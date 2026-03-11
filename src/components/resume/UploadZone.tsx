"use client";

import { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface UploadZoneProps {
  onFileSelect: (file: File, text: string) => void;
  isLoading: boolean;
}

export function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      // Check file type - accept based on extension OR MIME type
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

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('文件大小不能超过 5MB');
        return;
      }

      try {
        setIsParsing(true);

        // Send file to server for parsing
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
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">{selectedFile.name}</p>
                <p className="text-sm text-green-600">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {!isProcessing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="text-green-700 hover:bg-green-100"
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
      className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
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
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
          ) : (
            <Upload className="h-6 w-6 text-gray-600" />
          )}
        </div>
        <p className="mb-1 font-medium text-gray-700">
          {isProcessing ? '正在解析文件...' : '拖拽文件到此处，或点击选择'}
        </p>
        <p className="text-sm text-gray-500">
          支持 PDF 和 Word (.docx) 文件，最大 5MB
        </p>
        {error && (
          <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
