"use client";

import { useState } from 'react';
import { Packer } from 'docx';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { FileText, FileType, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OptimizedResume } from '@/types/resume';
import { TEMPLATES, type TemplateType } from '@/lib/templates';
import { ResumePDF } from './PdfTemplate';
import { generateWordDocument } from '@/lib/doc-generator';

interface DownloadOptionsProps {
  resume: OptimizedResume | null;
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
        <p className="text-sm font-medium mb-2" style={{ color: '#7C3AED' }}>
          选择模板
        </p>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedTemplate === template.id
                  ? 'border-[#7C3AED]'
                  : 'border-transparent hover:border-gray-200'
              }`}
              style={{
                backgroundColor:
                  selectedTemplate === template.id
                    ? '#7C3AED15'
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
            backgroundColor: '#7C3AED',
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
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
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
