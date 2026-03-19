// Word document generation utilities

import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import type { OptimizedResume } from '@/types/resume';

/**
 * Generate Word document from resume
 */
export function generateWordDocument(resume: OptimizedResume): Document {
  const children: Paragraph[] = [];

  // Summary Section
  if (resume.summary) {
    children.push(
      new Paragraph({
        text: '个人简介',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    children.push(
      new Paragraph({
        text: resume.summary,
        spacing: { after: 400 },
      })
    );
  }

  // Experience Section
  if (resume.experience && resume.experience.length > 0) {
    children.push(
      new Paragraph({
        text: '工作经历',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    for (const exp of resume.experience) {
      // Company and Duration
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.company, bold: true, size: 24 }),
            new TextRun({ text: '    ' + exp.duration, size: 20, color: '666666' }),
          ],
          spacing: { after: 100 },
        })
      );

      // Position
      children.push(
        new Paragraph({
          children: [new TextRun({ text: exp.position, italics: true })],
          spacing: { after: 200 },
        })
      );

      // Description
      const desc = exp.starFormatted || exp.description;
      if (desc) {
        children.push(
          new Paragraph({
            text: desc,
            spacing: { after: 400 },
          })
        );
      }
    }
  }

  // Skills Section
  if (resume.skills && resume.skills.technical.length > 0) {
    children.push(
      new Paragraph({
        text: '技能',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    if (resume.skills.technical.length > 0) {
      children.push(
        new Paragraph({
          text: '技术技能: ' + resume.skills.technical.join(' / '),
          spacing: { after: 200 },
        })
      );
    }

    if (resume.skills.soft?.length) {
      children.push(
        new Paragraph({
          text: '软技能: ' + resume.skills.soft.join(' / '),
          spacing: { after: 200 },
        })
      );
    }

    if (resume.skills.languages?.length) {
      children.push(
        new Paragraph({
          text: '语言能力: ' + resume.skills.languages.join(' / '),
          spacing: { after: 400 },
        })
      );
    }
  }

  // Education Section
  if (resume.education?.length) {
    children.push(
      new Paragraph({
        text: '教育背景',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    for (const edu of resume.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.school, bold: true, size: 24 }),
            new TextRun({ text: ' - ' + edu.degree, size: 24 }),
            new TextRun({ text: '    ' + edu.duration, size: 20, color: '666666' }),
          ],
          spacing: { after: 100 },
        })
      );

      if (edu.gpa) {
        children.push(
          new Paragraph({
            text: 'GPA: ' + edu.gpa,
            spacing: { after: 200 },
          })
        );
      }
    }
  }

  return new Document({
    sections: [{ properties: {}, children }],
  });
}
