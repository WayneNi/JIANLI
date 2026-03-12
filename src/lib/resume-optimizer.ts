// Resume optimization utilities

import type { OptimizedResume, ResumeSuggestion } from '@/types/resume';

/**
 * Parse raw AI response to resume object
 */
export function parseSuggestionResponse(rawJson: string): ResumeSuggestion {
  try {
    let jsonStr = rawJson.trim();

    // Remove all markdown code blocks
    jsonStr = jsonStr.replace(/```json\n?/g, '');
    jsonStr = jsonStr.replace(/```\n?/g, '');
    jsonStr = jsonStr.replace(/`+/g, '');

    let parsed = null;
    let parseError = null;

    // Strategy 1: Split by } { and try each part (handles duplicate JSON)
    const parts = jsonStr.split(/(?<=})\s*(?=\{)/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const testParsed = JSON.parse(trimmed);
          if (testParsed.matchScore !== undefined || testParsed.gapAnalysis) {
            parsed = testParsed;
            break;
          }
        } catch (e) {
          parseError = e;
        }
      }
    }

    // Strategy 2: Try to find JSON with matchScore using bracket matching
    if (!parsed) {
      const startIdx = jsonStr.indexOf('"matchScore"');
      if (startIdx !== -1) {
        // Find the opening { before matchScore
        let braceStart = startIdx;
        while (braceStart > 0 && jsonStr[braceStart] !== '{') {
          braceStart--;
        }
        // Find matching closing }
        let braceCount = 0;
        let braceEnd = braceStart;
        for (let i = braceStart; i < jsonStr.length; i++) {
          if (jsonStr[i] === '{') braceCount++;
          if (jsonStr[i] === '}') braceCount--;
          if (braceCount === 0) {
            braceEnd = i + 1;
            break;
          }
        }
        const candidate = jsonStr.slice(braceStart, braceEnd);
        try {
          parsed = JSON.parse(candidate);
        } catch (e) {
          parseError = e;
        }
      }
    }

    // Strategy 3: Try parsing the whole string if it's a single JSON
    if (!parsed) {
      try {
        const testParsed = JSON.parse(jsonStr);
        if (testParsed.matchScore !== undefined || testParsed.gapAnalysis) {
          parsed = testParsed;
        }
      } catch (e) {
        parseError = e;
      }
    }

    if (!parsed) {
      console.error('Raw suggestion response:', jsonStr);
      console.error('Parse error:', parseError);
      throw new Error('Invalid JSON response for suggestion');
    }

    // Validate and sanitize
    return {
      matchScore: typeof parsed.matchScore === 'number' ? parsed.matchScore : 0,
      gapAnalysis: parsed.gapAnalysis || '',
      skillGaps: Array.isArray(parsed.skillGaps) ? parsed.skillGaps : [],
      experienceSuggestions: Array.isArray(parsed.experienceSuggestions)
        ? parsed.experienceSuggestions
        : [],
      actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan : [],
    };
  } catch (error) {
    console.error('Failed to parse suggestion response:', error);
    // Return empty suggestion on error to not break the flow
    return {
      matchScore: 0,
      gapAnalysis: '无法生成建议',
      skillGaps: [],
      experienceSuggestions: [],
      actionPlan: [],
    };
  }
}

/**
 * Parse raw AI response to resume object
 */
export function parseAIResponse(rawJson: string): OptimizedResume {
  try {
    let jsonStr = rawJson.trim();

    // Remove all markdown code blocks (including malformed ones like }````json)
    jsonStr = jsonStr.replace(/```json\n?/g, '');
    jsonStr = jsonStr.replace(/```\n?/g, '');
    // Also handle cases where backticks are missing separation
    jsonStr = jsonStr.replace(/`+/g, '');

    // Split by the pattern that separates two JSON objects
    // Looking for patterns like: }{ or } `` `json {
    const parts = jsonStr.split(/(?<=})\s*(?=\{)/);

    // Try to find valid JSON in the response
    let parsed = null;

    // Try parsing the whole string first
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // If that fails, try each part
      for (const part of parts) {
        try {
          const trimmed = part.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            parsed = JSON.parse(trimmed);
            break;
          }
        } catch {
          continue;
        }
      }
    }

    // If still not parsed, try regex extraction
    if (!parsed) {
      // Find the last complete JSON object
      const matches = jsonStr.match(/\{[\s\S]*\}/g);
      if (matches) {
        for (let i = matches.length - 1; i >= 0; i--) {
          try {
            const testParsed = JSON.parse(matches[i]);
            if (testParsed.summary || testParsed.experience || testParsed.skills) {
              parsed = testParsed;
              break;
            }
          } catch {
            continue;
          }
        }
      }
    }

    if (!parsed) {
      console.error('Raw response:', jsonStr);
      throw new Error('Invalid JSON response');
    }

    // Validate and sanitize
    return {
      summary: parsed.summary || '',
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      skills: {
        technical: Array.isArray(parsed.skills?.technical)
          ? parsed.skills.technical
          : [],
        soft: Array.isArray(parsed.skills?.soft) ? parsed.skills.soft : [],
        languages: Array.isArray(parsed.skills?.languages)
          ? parsed.skills.languages
          : [],
      },
      education: Array.isArray(parsed.education) ? parsed.education : [],
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('无法解析 AI 响应，请重试');
  }
}

/**
 * Detect weak verbs that should be replaced
 */
const WEAK_VERBS = [
  '负责',
  '协助',
  '参与',
  '帮助',
  '完成',
  '进行',
  '处理',
  '从事',
];

const STRONG_VERBS = [
  '主导',
  '构建',
  '优化',
  '提升',
  '设计',
  '开发',
  '管理',
  '协调',
  '制定',
  '执行',
];

/**
 * Check if text contains weak verbs
 */
export function containsWeakVerbs(text: string): boolean {
  return WEAK_VERBS.some((verb) => text.includes(verb));
}

/**
 * Count potential improvements
 */
export function countImprovements(resume: OptimizedResume): number {
  let count = 0;

  for (const exp of resume.experience) {
    if (containsWeakVerbs(exp.description)) {
      count++;
    }
    if (exp.description && !/\d+%|[\u4e00-\u9fa5]+元|\d+人/.test(exp.description)) {
      count++;
    }
  }

  return count;
}

/**
 * Format resume as readable text for preview
 */
export function formatResumeAsText(resume: OptimizedResume): string {
  const lines: string[] = [];

  // Summary
  lines.push('=== 个人简介 ===');
  lines.push(resume.summary || '无');
  lines.push('');

  // Experience
  lines.push('=== 工作经历 ===');
  for (const exp of resume.experience) {
    lines.push(`【${exp.position}】@ ${exp.company} (${exp.duration})`);
    lines.push(`原始: ${exp.description}`);
    if (exp.starFormatted) {
      lines.push(`优化: ${exp.starFormatted}`);
    }
    lines.push('');
  }

  // Skills
  lines.push('=== 技能 ===');
  if (resume.skills.technical.length) {
    lines.push(`技术: ${resume.skills.technical.join(', ')}`);
  }
  if (resume.skills.soft?.length) {
    lines.push(`软技能: ${resume.skills.soft.join(', ')}`);
  }
  if (resume.skills.languages?.length) {
    lines.push(`语言: ${resume.skills.languages.join(', ')}`);
  }
  lines.push('');

  // Education
  lines.push('=== 教育背景 ===');
  for (const edu of resume.education) {
    lines.push(`${edu.school} - ${edu.degree} (${edu.duration})`);
    if (edu.gpa) {
      lines.push(`GPA: ${edu.gpa}`);
    }
  }

  return lines.join('\n');
}
