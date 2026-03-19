import { describe, it, expect } from 'vitest';
import { analyzeResumeATS } from '../ats-checker';

describe('ats-checker', () => {
  describe('analyzeResumeATS', () => {
    it('should detect missing email', () => {
      const resumeText = `
张三
13800000000
毕业于北京大学
      `.trim();

      const result = analyzeResumeATS(resumeText);

      const emailIssue = result.issues.find(
        (issue) => issue.category === 'structure' && issue.message.includes('邮箱')
      );
      expect(emailIssue).toBeDefined();
      expect(emailIssue?.severity).toBe('high');
    });

    it('should pass with complete contact info', () => {
      const resumeText = `
张三
zhangsan@example.com
13800000000
北京大学 计算机科学学士
      `.trim();

      const result = analyzeResumeATS(resumeText);

      expect(result.score).toBeGreaterThan(50);
    });

    it('should detect keyword-rich resume', () => {
      const resumeText = `
张三
zhangsan@example.com
13800000000

技术技能: JavaScript, Python, React, Node.js, SQL, Git

工作经历:
- 负责前端开发
- 使用 React 框架开发 Web 应用
- 优化系统性能
      `.trim();

      const result = analyzeResumeATS(resumeText);

      expect(result.score).toBeGreaterThan(60);
    });

    it('should return valid score range', () => {
      const resumeText = `
张三
zhangsan@example.com
13800000000
北京大学
      `.trim();

      const result = analyzeResumeATS(resumeText);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});
