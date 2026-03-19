// AI Prompts for resume optimization

export const SYSTEM_PROMPT = `你是一位专业的简历优化专家，擅长基于 STAR 法则 (Situation, Task, Action, Result) 优化简历内容。

## 你的任务
分析用户上传的简历内容，按照以下步骤进行优化：

1. **分析**: 识别现有经历中的模糊描述 (如 "负责销售"、"协助完成" 等)
2. **重构 (STAR 法则)**: 将模糊描述改写为完整 STAR 结构
3. **量化**: 强制补充或建议合理的量化数据 (百分比、金额、时间)
4. **关键词匹配**: 若提供了 JD，确保优化后的内容包含 JD 中的高频技能词
5. **语气调整**: 使用专业、主动语态 (Action Verbs)，去除弱动词

## 输出格式
你必须返回标准的 JSON 格式，包含以下字段：

\`\`\`json
{
  "contact": {
    "name": "姓名",
    "email": "邮箱地址",
    "phone": "电话号码"
  },
  "summary": "个人简介（2-3句话，突出核心竞争力）",
  "experience": [
    {
      "company": "公司名",
      "position": "职位名",
      "duration": "时间段",
      "description": "原始描述",
      "starFormatted": "STAR 格式化的描述"
    }
  ],
  "skills": {
    "technical": ["技术技能1", "技术技能2"],
    "soft": ["软技能1"],
    "languages": ["语言能力"]
  },
  "education": [
    {
      "school": "学校名",
      "degree": "学位",
      "duration": "时间段",
      "gpa": "GPA（可选）"
    }
  ]
}
\`\`\`

**重要：必须保留原文中的联系信息（姓名、邮箱、电话），不要遗漏。**

## 重要规则
- STAR 法则示例：
  - 错误："负责社交媒体运营。"
  - 正确："主导公司 LinkedIn 账号运营 (S: 公司希望提升品牌影响力), 制定数据驱动的内容日历和 A/B 测试策略 (T: 制定增长策略), 每周分析数据并优化内容方向 (A), 在 3 个月内将粉丝增长率提升 45%，线索转化率提高 12% (R)。"
- 若原文中缺少数据，使用 "[待补充数据]" 标记
- 使用主动动词：主导、构建、优化、提升、设计、开发、管理
- 避免弱动词：协助、参与、负责（单独使用）、帮助`;

export const ANALYSIS_PROMPT = (resumeText: string, jobDescription?: string) => `
## 简历内容
${resumeText}

${jobDescription ? `## 目标岗位 JD
${jobDescription}` : ''}

请分析以上简历内容，按照系统提示中的要求进行优化。

**重要：必须返回纯 JSON 格式，不要包含任何解释性文本或markdown代码块。**`;

export const STATUS_MESSAGES: Record<string, string> = {
  parsing: '正在解析简历文件...',
  analyzing: '正在分析经历描述...',
  suggesting: '正在生成改善建议...',
  optimizing: '正在应用 STAR 法则优化...',
  formatting: '正在整理输出格式...',
  completed: '优化完成！',
};

// Prompt for generating JD-based improvement suggestions (compressed)
export const SUGGESTION_PROMPT = (resumeText: string, jobDescription: string) => `
## 简历
${resumeText}

## JD
${jobDescription}

分析简历与JD的匹配度，返回JSON：
{"matchScore":75,"gapAnalysis":"...","skillGaps":[],"experienceSuggestions":[],"actionPlan":[]}`;

export const OPTIMIZE_PROMPT = (resumeText: string, jobDescription?: string) => `
## 简历内容
${resumeText}

${jobDescription ? `## 目标岗位 JD
${jobDescription}

请根据 JD 中的关键词和技能要求，在优化时重点突出与 JD 匹配的经历和技能。` : ''}

请按照系统提示中的要求优化简历内容。

**重要：必须返回纯 JSON 格式，不要包含任何解释性文本或markdown代码块。**`;

// ATS Check Prompt
export const ATS_CHECK_PROMPT = (resumeText: string, jobDescription?: string) => `
## 简历内容
${resumeText}

${jobDescription ? `## 目标岗位 JD
${jobDescription}` : ''}

请分析这份简历的 ATS (Applicant Tracking System) 友好度。

请返回以下 JSON 格式：

\`\`\`json
{
  "score": 85,
  "issues": [
    {
      "category": "format|keyword|structure|content",
      "severity": "high|medium|low",
      "message": "具体问题描述"
    }
  ],
  "suggestions": [
    "改进建议1",
    "改进建议2"
  ]
}
\`\`\`

## ATS 评分标准：
- 格式：是否有表格、特殊字符、图像等 ATS 无法解析的元素
- 关键词：是否包含目标岗位的关键技能词
- 结构：是否有完整的联系信息、清晰的分段
- 内容：是否有量化数据、动作动词、专业术语

**重要：必须返回纯 JSON 格式，不要包含任何解释性文本或markdown代码块。**`;

// Cover Letter Prompt
export const COVER_LETTER_PROMPT = (resumeText: string, jobDescription: string) => `
## 简历内容
${resumeText}

## 目标岗位 JD
${jobDescription}

请根据以上简历和目标岗位 JD，写一封专业的求职信 (Cover Letter)。

要求：
1. 结构清晰：开头自我介绍，说明投递岗位，中间展示与岗位的匹配度，结尾表达期待
2. 突出优势：结合 JD 要求，突出简历中相关的工作经历和技能
3. 专业语气：正式、专业、有针对性
4. 长度适中：300-500 字左右

请返回以下 JSON 格式：

\`\`\`json
{
  "subject": "求职信主题",
  "content": "求职信正文内容"
}
\`\`\`

**重要：必须返回纯 JSON 格式，不要包含任何解释性文本或markdown代码块。**`;

// Interview Questions Prompt
export const INTERVIEW_QUESTIONS_PROMPT = (resumeText: string, jobDescription?: string) => `
## 简历内容
${resumeText}

${jobDescription ? `## 目标岗位 JD
${jobDescription}` : ''}

请根据简历中的工作经历，生成针对性的模拟面试问题。

要求：
1. 针对每段工作经历生成 2-3 个面试问题
2. 问题应该考察：项目经验、技术能力、解决问题的能力、团队协作等
3. 包含参考回答要点

请返回以下 JSON 格式：

\`\`\`json
{
  "questions": [
    {
      "experience": "经历描述",
      "questions": [
        {
          "question": "面试问题",
          "keyPoints": ["回答要点1", "回答要点2"]
        }
      ]
    }
  ]
}
\`\`\`

**重要：必须返回纯 JSON 格式，不要包含任何解释性文本或markdown代码块。**`;
