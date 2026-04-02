// AI Prompts for resume optimization

// Maximum number of parse retry attempts
export const MAX_PARSE_ATTEMPTS = 2;

// Strict prompt for retry attempts - more explicit constraints
export const STRICT_SYSTEM_PROMPT = `【重要】必须严格遵循以下JSON格式返回，不要包含任何其他文字或解释。

必须返回的字段：
- summary: 字符串，个人简介
- experience: 数组，每项必须包含 company, position, duration, description, starFormatted（可选）字段
- skills: 对象，必须包含 technical, soft, languages 三个数组字段
- education: 数组，每项必须包含 school, degree, duration 字段
- contact: 对象（可选），包含 name, email, phone 字段

【强制要求】
1. experience 数组必须至少包含一段工作经历
2. skills.technical 数组必须包含至少一项技能
3. 只返回上述字段，禁止添加其他字段
4. 如果无法从简历中提取某字段，返回空数组或空字符串，而非编造内容

JSON格式示例：
{"summary":"","experience":[{"company":"公司名","position":"职位","duration":"时间","description":"工作描述","starFormatted":"STAR格式描述"}],"skills":{"technical":["技能1"],"soft":["软技能"],"languages":["语言"]},"education":[{"school":"学校","degree":"学位","duration":"时间","gpa":""}]}`;

export const SYSTEM_PROMPT = `【重要】只返回纯JSON，不要其他文字。JSON格式必须包含以下字段：
- summary: 字符串
- experience: 数组，每项包含 company, position, duration, description, starFormatted（可选）
- skills: 对象，包含 technical, soft, languages 三个数组
- education: 数组，每项包含 school, degree, duration, gpa（可选）
- contact: 对象（可选），包含 name, email, phone

【重要】experience 数组必须至少有一项，skills.technical 必须至少有一项。如果无法从简历中提取某个字段，返回空数组或空字符串，禁止编造内容。禁止添加上述未列出的字段。`;

export const STATUS_MESSAGES: Record<string, string> = {
  parsing: '正在解析简历文件...',
  analyzing: '正在分析经历描述...',
  suggesting: '正在生成改善建议...',
  optimizing: '正在应用 STAR 法则优化...',
  formatting: '正在整理输出格式...',
  completed: '优化完成！',
};

// Prompt for generating JD-based improvement suggestions
export const SUGGESTION_PROMPT = (resumeText: string, jobDescription: string) => `
## 简历
${resumeText}

## JD
${jobDescription}

请分析简历与JD的匹配度，并为每段工作经历生成改善建议。

**gapAnalysis 要求**：
- 只分析 JD 明确要求但简历中缺失或薄弱的内容
- 每项差距必须能对应到 JD 中的具体条款
- 禁止包含：与JD无关的公司生态知识、面试官个人偏好、JD未提及的假设性要求等

**相关性过滤规则**：
- 只能基于 JD 中**明确列出**的技能/经验/素质要求来识别差距
- 不要编造 JD 未提及的要求（如"公司生态认知"、"行业通用知识"等）
- 不要分析 JD 未提及的"软性认知"或"隐性偏好"

**排除内容列表**：
- 公司生态/文化相关知识（如"腾讯生态"、"字节跳动文化"）
- JD 未提及的假设性要求
- 与岗位硬技能无关的"软性认知"
- 面试官的私人偏好或行业惯例

**重要：必须严格按照以下 JSON 格式返回，确保生成多样化建议：**
{
  "matchScore": 75,
  "gapAnalysis": "匹配度分析...",
  "skillGaps": ["缺失技能1", "缺失技能2"],
  "experienceSuggestions": [
    {"type": "add", "suggestion": "建议新增...（针对某段经历）"},
    {"type": "emphasize", "suggestion": "建议强化...（针对某段经历）"},
    {"type": "remove", "suggestion": "建议弱化/删除...（针对某段经历）"}
  ],
  "actionPlan": ["具体行动步骤1", "具体行动步骤2"]
}
**注意**：experienceSuggestions 数组必须同时包含 add、emphasize、remove 三种类型的建议，每种至少 1-2 条。不要只返回 remove 类型的建议。`;

export const OPTIMIZE_PROMPT = (resumeText: string, jobDescription?: string) => `
## 简历内容
${resumeText}

${jobDescription ? `## 目标岗位 JD
${jobDescription}

请根据 JD 中的关键词和技能要求，在优化时重点突出与 JD 匹配的经历和技能。` : ''}

请按照系统提示中的要求优化简历内容。

**重要**：
1. 必须返回纯 JSON 格式，不要包含任何解释性文本或markdown代码块
2. 如果无法从简历中提取某个工作经历或技能字段，返回空数组（[]）而非编造内容
3. 只能基于简历中实际存在的内容进行优化和改写，不要添加简历中未提及的信息`;

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
