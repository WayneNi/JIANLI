"use client";

import { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface UploadZoneProps {
  onFileSelect: (file: File, text: string) => void;
  isLoading: boolean;
}

// Purple-Blue Gradient Theme
const COLORS = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#F8F9FA',
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  gradientStart: '#667EEA',
  gradientEnd: '#764BA2',
  accent: '#EC4899',
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  success: '#059669',
  error: '#DC2626',
};

export function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      const fileName = file.name.toLowerCase();
      const isPdf = fileName.endsWith('.pdf');
      const isDocx = fileName.endsWith('.docx');
      const validMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      const hasValidMimeType = validMimeTypes.includes(file.type);

      if (!((isPdf || isDocx) || hasValidMimeType)) {
        setError('请上传 PDF 或 Word (.docx) 文件');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('文件大小不能超过 5MB');
        return;
      }

      try {
        setIsParsing(true);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/parse', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '解析失败');
        }

        const data = await response.json();
        const text = data.text;

        if (!text?.trim()) {
          throw new Error('无法解析文件内容，请确保文件不是图片格式');
        }

        setSelectedFile(file);
        onFileSelect(file, text);
      } catch (err) {
        console.error('File parsing error:', err);
        setError(err instanceof Error ? err.message : '文件解析失败，请重试');
      } finally {
        setIsParsing(false);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const isProcessing = isLoading || isParsing;

  if (selectedFile) {
    return (
      <Card style={{
        borderRadius: '8px',
        border: `1px solid ${COLORS.success}40`,
        backgroundColor: `${COLORS.success}10`,
        borderLeft: `3px solid ${COLORS.success}`
      }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: `${COLORS.success}20` }}
              >
                <CheckCircle2 className="h-5 w-5" style={{ color: COLORS.success }} />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: COLORS.text }}>{selectedFile.name}</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB · 已成功解析
                </p>
              </div>
            </div>
            {!isProcessing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-8 w-8"
                style={{ color: COLORS.textMuted }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 transition-all duration-300 hover-lift ${
        isDragging ? 'scale-[1.02]' : ''
      }`}
      style={{
        borderColor: isDragging ? COLORS.primary : COLORS.border,
        backgroundColor: isDragging ? `${COLORS.primary}10` : COLORS.surface,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        className="absolute inset-0 cursor-pointer opacity-0"
        disabled={isProcessing}
      />

      <div className="flex flex-col items-center text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-transform"
          style={{ backgroundColor: `${COLORS.primary}15`, border: `1px solid ${COLORS.primary}30` }}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: COLORS.primary }} />
          ) : (
            <Upload className="h-6 w-6" style={{ color: COLORS.primary }} />
          )}
        </div>
        <p className="mb-1 font-medium" style={{ color: COLORS.text }}>
          {isProcessing ? '正在解析文件...' : '拖拽文件到此处，或点击选择'}
        </p>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          支持 PDF 和 Word (.docx) 文件，最大 5MB
        </p>
        {error && (
          <p className="mt-3 text-sm font-medium" style={{ color: COLORS.error }}>{error}</p>
        )}
      </div>
    </div>
  );
}
