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
 * Handles truncated responses by trying multiple strategies
 */
export function parseAIResponse(rawJson: string): OptimizedResume {
  let jsonStr = rawJson.trim();

  // Remove all markdown code blocks (including malformed ones like }````json)
  jsonStr = jsonStr.replace(/```json\n?/g, '');
  jsonStr = jsonStr.replace(/```\n?/g, '');
  // Also handle cases where backticks are missing separation
  jsonStr = jsonStr.replace(/`+/g, '');

  let parsed: {
    summary?: unknown;
    experience?: unknown;
    skills?: {
      technical?: unknown;
      soft?: unknown;
      languages?: unknown;
    };
    education?: unknown;
  } | null = null;
  let lastError: Error | null = null;

  // Strategy 1: Try parsing the whole string first
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    lastError = e as Error;
  }

  // Strategy 2: Split by }{ and try each part (handles duplicate JSON)
  if (!parsed) {
    const parts = jsonStr.split(/(?<=})\s*(?=\{)/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const testParsed = JSON.parse(trimmed);
          if (testParsed.summary || testParsed.experience || testParsed.skills) {
            parsed = testParsed;
            break;
          }
        } catch (e) {
          lastError = e as Error;
        }
      }
    }
  }

  // Strategy 3: Regex extraction for potentially truncated JSON
  if (!parsed) {
    // Try to find the main resume object by looking for known keys
    const mainKeys = ['"summary"', '"experience"', '"skills"', '"education"'];
    for (const key of mainKeys) {
      const idx = jsonStr.indexOf(key);
      if (idx !== -1) {
        // Find the opening brace before this key
        let braceStart = idx;
        while (braceStart > 0 && jsonStr[braceStart] !== '{') {
          braceStart--;
        }
        // Try to extract complete JSON from this point using bracket counting
        let braceCount = 0;
        for (let i = braceStart; i < jsonStr.length; i++) {
          if (jsonStr[i] === '{') braceCount++;
          if (jsonStr[i] === '}') braceCount--;
          if (braceCount === 0 && i > braceStart) {
            const candidate = jsonStr.slice(braceStart, i + 1);
            try {
              const testParsed = JSON.parse(candidate);
              if (testParsed.summary || testParsed.experience || testParsed.skills) {
                parsed = testParsed;
                break;
              }
            } catch {
              // Continue
            }
            break;
          }
        }
        if (parsed) break;
      }
    }
  }

  // Strategy 4: Try to fix truncated JSON by completing braces
  if (!parsed && jsonStr.startsWith('{')) {
    // Count unclosed braces
    let braceCount = 0;
    for (const ch of jsonStr) {
      if (ch === '{') braceCount++;
      if (ch === '}') braceCount--;
    }
    // If unclosed, try completing the JSON structure
    if (braceCount > 0) {
      const fixed = jsonStr + ']}'.repeat(braceCount);
      try {
        const testParsed = JSON.parse(fixed);
        if (testParsed.summary || testParsed.experience || testParsed.skills) {
          parsed = testParsed;
        }
      } catch {
        // Try another approach - truncate at last complete item
        const lastCloseBrace = jsonStr.lastIndexOf('}');
        if (lastCloseBrace > 0) {
          const truncated = jsonStr.slice(0, lastCloseBrace + 1);
          try {
            const testParsed = JSON.parse(truncated);
            if (testParsed.summary || testParsed.experience || testParsed.skills) {
              parsed = testParsed;
            }
          } catch {
            // Give up
          }
        }
      }
    }
  }

  if (!parsed) {
    console.error('Raw response:', jsonStr.substring(0, 500));
    console.error('Parse error:', lastError);
    throw new Error('无法解析 AI 响应，请重试');
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
