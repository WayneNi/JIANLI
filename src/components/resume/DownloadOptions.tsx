"use client";

import { useState } from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { Download, FileText, FileType, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OptimizedResume } from '@/types/resume';
import { TEMPLATES, type TemplateType } from '@/lib/templates';
import { ResumePDF } from './PdfTemplate';

interface DownloadOptionsProps {
  resume: OptimizedResume | null;
}

// Generate Word document from resume
function generateWordDocument(resume: OptimizedResume): Document {
  const children: Paragraph[] = [];

  const summaryLines = resume.summary.split('\n').filter((line) => line.trim());
  if (summaryLines.length > 0) {
    children.push(
      new Paragraph({
        text: summaryLines[0],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.LEFT,
        spacing: {
          after: 200,
        },
      })
    );

    if (summaryLines.length > 1) {
      children.push(
        new Paragraph({
          children: summaryLines.slice(1).map((line) => new TextRun({
            text: line,
            size: 20,
            color: '666666',
          })),
          spacing: {
            after: 400,
          },
        })
      );
    }
  }

  if (resume.summary) {
    children.push(
      new Paragraph({
        text: '个人简介',
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: 400,
          after: 200,
        },
      })
    );

    children.push(
      new Paragraph({
        text: resume.summary,
        spacing: {
          after: 400,
        },
      })
    );
  }

  if (resume.experience && resume.experience.length > 0) {
    children.push(
      new Paragraph({
        text: '工作经历',
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: 400,
          after: 200,
        },
      })
    );

    for (const exp of resume.experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.company,
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: '    ' + exp.duration,
              size: 20,
              color: '666666',
            }),
          ],
          spacing: {
            after: 100,
          },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.position,
              italics: true,
            }),
          ],
          spacing: {
            after: 200,
          },
        })
      );

      if (exp.starFormatted) {
        children.push(
          new Paragraph({
            text: exp.starFormatted,
            spacing: {
              after: 400,
            },
          })
        );
      } else if (exp.description) {
        children.push(
          new Paragraph({
            text: exp.description,
            spacing: {
              after: 400,
            },
          })
        );
      }
    }
  }

  if (resume.skills && resume.skills.technical.length > 0) {
    children.push(
      new Paragraph({
        text: '技能',
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: 400,
          after: 200,
        },
      })
    );

    if (resume.skills.technical.length > 0) {
      children.push(
        new Paragraph({
          text: '技术技能: ' + resume.skills.technical.join(' / '),
          spacing: {
            after: 200,
          },
        })
      );
    }

    if (resume.skills.soft && resume.skills.soft.length > 0) {
      children.push(
        new Paragraph({
          text: '软技能: ' + resume.skills.soft.join(' / '),
          spacing: {
            after: 200,
          },
        })
      );
    }

    if (resume.skills.languages && resume.skills.languages.length > 0) {
      children.push(
        new Paragraph({
          text: '语言能力: ' + resume.skills.languages.join(' / '),
          spacing: {
            after: 400,
          },
        })
      );
    }
  }

  if (resume.education && resume.education.length > 0) {
    children.push(
      new Paragraph({
        text: '教育背景',
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: 400,
          after: 200,
        },
      })
    );

    for (const edu of resume.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.school,
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: ' - ' + edu.degree,
              size: 24,
            }),
            new TextRun({
              text: '    ' + edu.duration,
              size: 20,
              color: '666666',
            }),
          ],
          spacing: {
            after: 100,
          },
        })
      );

      if (edu.gpa) {
        children.push(
          new Paragraph({
            text: 'GPA: ' + edu.gpa,
            spacing: {
              after: 200,
            },
          })
        );
      }
    }
  }

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

export function DownloadOptions({ resume }: DownloadOptionsProps) {
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('simple');

  const handleDownloadWord = async () => {
    if (!resume) return;

    setIsGeneratingWord(true);
    try {
      const doc = generateWordDocument(resume);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, 'optimized_resume.docx');
    } catch (error) {
      console.error('Word generation error:', error);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!resume) return;

    setIsGeneratingPdf(true);
    try {
      const blob = await pdf(<ResumePDF resume={resume} template={selectedTemplate} />).toBlob();
      saveAs(blob, 'optimized_resume.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!resume) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: '#1a1f2e' }}>
          选择模板
        </p>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedTemplate === template.id
                  ? 'border-[#c9a227]'
                  : 'border-transparent hover:border-gray-200'
              }`}
              style={{
                backgroundColor:
                  selectedTemplate === template.id
                    ? '#c9a22715'
                    : '#f5f5f5',
              }}
            >
              <p
                className="font-medium text-sm"
                style={{
                  color: template.color,
                }}
              >
                {template.name}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                {template.nameEn}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Download Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleDownloadWord}
          disabled={isGeneratingWord || isGeneratingPdf}
          className="gap-2"
          style={{
            backgroundColor: '#1a1f2e',
            borderRadius: '4px',
          }}
        >
          {isGeneratingWord ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <FileType className="h-4 w-4" />
              Word 文档
            </>
          )}
        </Button>

        <Button
          onClick={handleDownloadPdf}
          disabled={isGeneratingWord || isGeneratingPdf}
          className="gap-2"
          style={{
            backgroundColor: '#c9a227',
            color: '#1a1f2e',
            borderRadius: '4px',
            fontWeight: 600,
          }}
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              PDF 导出
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
