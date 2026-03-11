"use client";

import { useState, useCallback } from 'react';
import { Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { UploadZone } from '@/components/resume/UploadZone';
import { PreviewPanel } from '@/components/resume/PreviewPanel';
import { DownloadButton } from '@/components/resume/DownloadButton';
import { JobDescriptionInput } from '@/components/resume/JobDescriptionInput';

import type { OptimizeStatus, StreamChunk, OptimizedResume } from '@/types/resume';

export default function Home() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [status, setStatus] = useState<OptimizeStatus>('idle');
  const [streamData, setStreamData] = useState<StreamChunk[]>([]);
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);

  const handleFileSelect = useCallback((file: File, text: string) => {
    setResumeText(text);
    setStatus('parsing');
  }, []);

  const handleOptimize = useCallback(async () => {
    if (!resumeText.trim()) return;

    setIsOptimizing(true);
    setStatus('analyzing');
    setStreamData([]);
    setOptimizedResume(null);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescription || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to read response');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed: StreamChunk = JSON.parse(data);
              setStreamData((prev) => [...prev, parsed]);

              if (parsed.status) {
                setStatus(parsed.status);
              }

              if (parsed.type === 'done' && parsed.data) {
                setOptimizedResume(parsed.data);
              }

              if (parsed.type === 'error') {
                throw new Error(parsed.message || 'Unknown error');
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Optimization error:', error);
      setStatus('error');
    } finally {
      setIsOptimizing(false);
    }
  }, [resumeText, jobDescription]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">
              AI 简历优化平台
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">
            用 AI 优化您的简历
          </h2>
          <p className="text-gray-600">
            基于 STAR 法则，智能优化简历内容，提升面试机会
          </p>
        </div>

        {/* Features */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">智能优化</p>
                <p className="text-sm text-gray-500">STAR 法则重构</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">关键词匹配</p>
                <p className="text-sm text-gray-500">针对 JD 优化</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">隐私保护</p>
                <p className="text-sm text-gray-500">数据本地处理</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload and Optimize */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column - Upload */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">上传简历</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <UploadZone
                  onFileSelect={handleFileSelect}
                  isLoading={isOptimizing}
                />

                <JobDescriptionInput
                  value={jobDescription}
                  onChange={setJobDescription}
                />

                <Button
                  onClick={handleOptimize}
                  disabled={!resumeText.trim() || isOptimizing}
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isOptimizing ? (
                    <>正在优化...</>
                  ) : (
                    <>
                      开始优化 <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {status === 'error' && (
                  <p className="text-center text-sm text-red-500">
                    优化失败，请检查 API 配置或重试
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4">
            <PreviewPanel
              isOptimizing={isOptimizing}
              streamData={streamData}
              status={status}
            />

            {optimizedResume && (
              <div className="flex justify-end">
                <DownloadButton resume={optimizedResume} />
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <Card className="mt-8 bg-blue-50">
          <CardContent className="p-4">
            <h3 className="mb-2 font-semibold text-blue-800">优化建议</h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>
                • 上传 PDF 格式的简历可获得最佳解析效果
              </li>
              <li>
                • 提供目标岗位 JD 可获得更精准的关键词匹配
              </li>
              <li>
                • STAR 法则：将工作经历转化为情境、任务、行动、结果
              </li>
              <li>
                • 优化后的描述包含具体数据，效果更佳
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          <p>AI 简历优化平台 · 基于智谱 GLM-4.7 模型</p>
        </div>
      </footer>
    </div>
  );
}
