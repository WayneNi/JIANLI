// ATS (Applicant Tracking System) Checker
// Analyzes resume against common ATS criteria

export interface AtsResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: AtsIssue[];
  suggestions: string[];
}

export interface AtsIssue {
  category: 'format' | 'keyword' | 'structure' | 'content';
  severity: 'high' | 'medium' | 'low';
  message: string;
}

// Keywords that ATS systems typically look for
const ATS_KEYWORDS = {
  technical: [
    'python', 'java', 'javascript', 'typescript', 'sql', 'aws', 'azure',
    'docker', 'kubernetes', 'git', 'linux', 'machine learning', 'data analysis',
    'project management', 'agile', 'scrum', 'ci/cd', 'rest api', 'microservices',
  ],
  soft: [
    'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical',
    'collaboration', 'initiative', 'adaptability', 'time management',
  ],
  actionVerbs: [
    'managed', 'led', 'developed', 'implemented', 'optimized', 'increased',
    'reduced', 'created', 'designed', 'analyzed', 'coordinated', 'executed',
  ],
};

// Check for common ATS issues
export function analyzeResumeATS(resumeText: string, jobDescription?: string): AtsResult {
  const issues: AtsIssue[] = [];
  const suggestions: string[] = [];
  const lowerText = resumeText.toLowerCase();

  // 1. Format Checks
  // Check for tables (ATS can't read tables well)
  if (lowerText.includes('table') || resumeText.includes('|')) {
    issues.push({
      category: 'format',
      severity: 'high',
      message: '检测到表格或特殊格式，ATS可能无法正确解析',
    });
    suggestions.push('避免使用表格或使用纯文本格式');
  }

  // Check for headers/footers (often missed by ATS)
  if (resumeText.match(/page \d+ of \d+/i)) {
    issues.push({
      category: 'format',
      severity: 'medium',
      message: '检测到页码，重要信息可能在页眉/页脚中被忽略',
    });
  }

  // Check for images/graphics
  if (resumeText.match(/(photo|image|avatar|picture)/i)) {
    issues.push({
      category: 'format',
      severity: 'high',
      message: '检测到图片引用，ATS无法读取图像内容',
    });
    suggestions.push('移除所有图片和图形元素');
  }

  // 2. Keyword Checks
  const foundKeywords: string[] = [];
  for (const keyword of ATS_KEYWORDS.technical) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }

  // Check keyword density
  if (jobDescription) {
    const jdKeywords = jobDescription.toLowerCase().split(/\s+/).filter(
      (w) => w.length > 3 && !['with', 'have', 'will', 'this', 'that'].includes(w)
    );

    const missingKeywords = jdKeywords.filter(
      (kw) => !lowerText.includes(kw) && ATS_KEYWORDS.technical.includes(kw)
    );

    if (missingKeywords.length > 0) {
      issues.push({
        category: 'keyword',
        severity: 'high',
        message: `缺少JD中的关键技能词: ${missingKeywords.slice(0, 5).join(', ')}`,
      });
      suggestions.push(`建议添加: ${missingKeywords.slice(0, 5).join(', ')}`);
    }
  }

  // 3. Structure Checks
  // Check for contact info
  const hasEmail = lowerText.match(/[\w.-]+@[\w.-]+\.\w+/);
  const hasPhone = lowerText.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/);
  const hasName = lowerText.length > 20; // Rough check

  if (!hasEmail) {
    issues.push({
      category: 'structure',
      severity: 'high',
      message: '未检测到邮箱地址',
    });
    suggestions.push('在简历顶部添加邮箱地址');
  }

  if (!hasPhone) {
    issues.push({
      category: 'structure',
      severity: 'medium',
      message: '未检测到电话号码',
    });
    suggestions.push('添加联系电话');
  }

  // 4. Content Checks
  // Check for action verbs
  const hasActionVerbs = ATS_KEYWORDS.actionVerbs.some((v) => lowerText.includes(v));
  if (!hasActionVerbs) {
    issues.push({
      category: 'content',
      severity: 'medium',
      message: '缺少强动词开头的工作描述',
    });
    suggestions.push('使用强动词开头描述工作成就');
  }

  // Check for quantifiable results
  const hasNumbers = lowerText.match(/\d+%|\$\d+|\d+x|\d+/);
  if (!hasNumbers) {
    issues.push({
      category: 'content',
      severity: 'medium',
      message: '缺少量化数据',
    });
    suggestions.push('添加具体的数字成果');
  }

  // Check length
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount < 100) {
    issues.push({
      category: 'content',
      severity: 'high',
      message: '内容过短，可能缺少关键信息',
    });
  } else if (wordCount > 1500) {
    issues.push({
      category: 'content',
      severity: 'low',
      message: '内容过长，建议精简',
    });
    suggestions.push('精简简历内容，保持在1-2页');
  }

  // Calculate score
  let score = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 8;
        break;
      case 'low':
        score -= 3;
        break;
    }
  }

  // Bonus for keywords
  if (foundKeywords.length >= 5) {
    score = Math.min(100, score + 5);
  }

  score = Math.max(0, score);

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return {
    score,
    grade,
    issues,
    suggestions,
  };
}
