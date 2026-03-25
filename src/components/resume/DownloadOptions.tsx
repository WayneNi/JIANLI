"use client";

import { useState } from 'react';
import { Packer } from 'docx';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { FileText, FileType, Loader2, Check, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OptimizedResume } from '@/types/resume';
import { TEMPLATES, type TemplateType } from '@/lib/templates';
import { ResumePDF } from './PdfTemplateProfessional';
import { generateWordDocument } from '@/lib/doc-generator';

interface DownloadOptionsProps {
  resume: OptimizedResume | null;
}

export function DownloadOptions({ resume }: DownloadOptionsProps) {
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('simple');
  const [hoveredTemplate, setHoveredTemplate] = useState<TemplateType | null>(null);

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

  const displayTemplate = hoveredTemplate || selectedTemplate;
  const templateConfig = TEMPLATES.find(t => t.id === displayTemplate)!;

  return (
    <div className="space-y-5">
      {/* Template Selection Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" style={{ color: '#7C3AED' }} />
        <p className="text-sm font-semibold" style={{ color: '#1f2937' }}>
          选择模板风格
        </p>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 gap-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template.id)}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              selectedTemplate === template.id
                ? 'border-2 shadow-md'
                : 'border border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            style={{
              borderColor: selectedTemplate === template.id ? template.color : undefined,
              backgroundColor: selectedTemplate === template.id ? `${template.color}08` : '#ffffff',
            }}
          >
            {/* Selected indicator */}
            {selectedTemplate === template.id && (
              <div
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: template.color }}
              >
                <Check className="h-3 w-3 text-white" />
              </div>
            )}

            {/* Template name and description */}
            <div className="flex items-start gap-3">
              {/* Color indicator bar */}
              <div
                className="w-1 h-12 rounded-full flex-shrink-0 mt-0.5"
                style={{ backgroundColor: template.color }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p
                    className="font-bold text-base"
                    style={{ color: template.color }}
                  >
                    {template.name}
                  </p>
                  <span className="text-xs text-gray-400">
                    {template.nameEn}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {template.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {template.features.slice(0, 3).map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: `${template.color}15`,
                        color: template.color,
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Best for */}
                <p className="text-xs text-gray-400 mt-2">
                  适合: {template.bestFor.slice(0, 3).join('、')}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Preview hint */}
      <p className="text-xs text-gray-400 text-center">
        鼠标悬停预览不同模板风格
      </p>

      {/* Download Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          onClick={handleDownloadWord}
          disabled={isGeneratingWord || isGeneratingPdf}
          className="gap-2 h-11"
          variant="outline"
          style={{
            borderColor: '#e5e7eb',
            borderRadius: '8px',
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
              <span className="font-medium">Word 文档</span>
            </>
          )}
        </Button>

        <Button
          onClick={handleDownloadPdf}
          disabled={isGeneratingWord || isGeneratingPdf}
          className="gap-2 h-11"
          style={{
            backgroundColor: templateConfig.color,
            borderRadius: '8px',
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
              <Download className="h-4 w-4" />
              <span>下载 PDF</span>
            </>
          )}
        </Button>
      </div>

      {/* Format note */}
      <p className="text-xs text-gray-400 text-center">
        PDF 文件可直投简历，Word 方便后续编辑修改
      </p>
    </div>
  );
}
