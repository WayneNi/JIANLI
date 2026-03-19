import { describe, it, expect } from 'vitest';
import {
  parseAIResponse,
  parseSuggestionResponse,
  containsWeakVerbs,
  countImprovements,
} from '../resume-optimizer';

describe('resume-optimizer', () => {
  describe('parseAIResponse', () => {
    it('should parse valid JSON response', () => {
      const rawJson = JSON.stringify({
        summary: '测试简介',
        experience: [
          {
            company: '测试公司',
            position: '测试职位',
            duration: '2020-2023',
            description: '负责测试工作',
            starFormatted: '主导测试工作',
          },
        ],
        skills: {
          technical: ['JavaScript', 'TypeScript'],
          soft: ['沟通'],
          languages: ['中文'],
        },
        education: [
          {
            school: '测试大学',
            degree: '本科',
            duration: '2016-2020',
          },
        ],
      });

      const result = parseAIResponse(rawJson);

      expect(result.summary).toBe('测试简介');
      expect(result.experience).toHaveLength(1);
      expect(result.experience[0].company).toBe('测试公司');
      expect(result.skills.technical).toContain('JavaScript');
    });

    it('should handle JSON with markdown code blocks', () => {
      const rawJson = `\`\`\`json
{
  "summary": "测试简介",
  "experience": [],
  "skills": { "technical": [], "soft": [], "languages": [] },
  "education": []
}
\`\`\``;

      const result = parseAIResponse(rawJson);

      expect(result.summary).toBe('测试简介');
    });

    it('should handle empty response gracefully', () => {
      const rawJson = '{}';

      const result = parseAIResponse(rawJson);

      expect(result.summary).toBe('');
      expect(result.experience).toEqual([]);
    });
  });

  describe('parseSuggestionResponse', () => {
    it('should parse valid suggestion response', () => {
      const rawJson = JSON.stringify({
        matchScore: 75,
        gapAnalysis: '主要差距分析',
        skillGaps: ['技能1', '技能2'],
        experienceSuggestions: [
          { type: 'add', suggestion: '建议内容' },
        ],
        actionPlan: ['第一步', '第二步'],
      });

      const result = parseSuggestionResponse(rawJson);

      expect(result.matchScore).toBe(75);
      expect(result.gapAnalysis).toBe('主要差距分析');
      expect(result.skillGaps).toHaveLength(2);
      expect(result.actionPlan).toHaveLength(2);
    });
  });

  describe('containsWeakVerbs', () => {
    it('should detect weak verbs', () => {
      expect(containsWeakVerbs('负责销售工作')).toBe(true);
      expect(containsWeakVerbs('协助完成项目')).toBe(true);
      expect(containsWeakVerbs('参与会议')).toBe(true);
    });

    it('should return false for strong verbs', () => {
      expect(containsWeakVerbs('主导产品开发')).toBe(false);
      expect(containsWeakVerbs('构建系统架构')).toBe(false);
    });
  });

  describe('countImprovements', () => {
    it('should count improvements needed', () => {
      const resume = {
        summary: '测试简介',
        experience: [
          {
            company: '公司',
            position: '职位',
            duration: '时间',
            description: '负责销售工作',
            starFormatted: '主导销售工作',
          },
        ],
        skills: {
          technical: [],
          soft: [],
          languages: [],
        },
        education: [],
      };

      const count = countImprovements(resume);

      expect(count).toBeGreaterThan(0);
    });
  });
});
