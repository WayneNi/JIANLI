"use client";

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadZone } from '@/components/resume/UploadZone';
import { PreviewPanel } from '@/components/resume/PreviewPanel';
import { JobDescriptionInput } from '@/components/resume/JobDescriptionInput';
import { DownloadOptions } from '@/components/resume/DownloadOptions';
import { CompareView } from '@/components/resume/CompareView';
import { CoverLetterGenerator } from '@/components/resume/CoverLetter';
import { InterviewQuestionsGenerator } from '@/components/resume/InterviewQuestions';
import { Sparkles, FileText, Eye, ArrowLeft, Coins, Crown, AlertCircle } from 'lucide-react';
import type { OptimizeStatus, StreamChunk, OptimizedResume } from '@/types/resume';

function extractTargetRole(jobDescription: string): string {
  if (!jobDescription) return '';
  const patterns = [
    /(?:岗位|职位|应聘|申请|目标)[：:]\s*(.+)/i,
    /^(.+?)(?:工程师|经理|总监|专员|助理|专家)/,
  ];
  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
}

interface OptimizeClientProps {
  initialCredits: number;
  isLifetime: boolean;
  email: string;
  userName?: string;
  userAvatar?: string;
}

export function OptimizeClient({ initialCredits, isLifetime, email, userName, userAvatar }: OptimizeClientProps) {
  const router = useRouter();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [status, setStatus] = useState<OptimizeStatus>('idle');
  const [streamData, setStreamData] = useState<StreamChunk[]>([]);
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [activeTab, setActiveTab] = useState<'cover' | 'interview'>('cover');
  const [credits, setCredits] = useState(initialCredits);
  const [showCreditError, setShowCreditError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [hasJobDescription, setHasJobDescription] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);

  const handleFileSelect = useCallback((file: File, text: string) => {
    setResumeText(text);
    setStatus('parsing');
    setOptimizedResume(null);
    setStreamData([]);
    setShowCompare(false);
    setShowCreditError(false);
    setErrorMessage(null);
    setSuggestionError(false);
    setResetTrigger(prev => prev + 1);
    setHasJobDescription(false);
    setTimeoutError(false);
  }, []);

  const resetOptimizationState = useCallback(() => {
    setOptimizedResume(null);
    setStreamData([]);
    setStatus('idle');
    setShowCompare(false);
    setErrorMessage(null);
    setSuggestionError(false);
    setIsOptimizing(false); // Ensure optimizing state is reset
  }, []);

  const handleOptimize = useCallback(async () => {
    if (!resumeText.trim()) return;

    setIsOptimizing(true);
    setStatus('analyzing');
    setStreamData([]);
    setOptimizedResume(null);
    setShowCreditError(false);
    setHasJobDescription(!!jobDescription.trim());
    setSuggestionError(false);
    setTimeoutError(false);

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

      const TIMEOUT_MS = 90000;
      let bytesReceived = false;
      const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
        if (!bytesReceived) {
          reader.cancel();
          setErrorMessage('网络连接超时，请检查网络后重试');
          setStatus('error');
          setIsOptimizing(false);
        }
      }, TIMEOUT_MS);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value && value.length > 0) {
          bytesReceived = true;
          clearTimeout(timeoutId);
        }

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

              if (parsed.type === 'credits') {
                if (parsed.remaining !== undefined) {
                  setCredits(parsed.remaining);
                }
              }

              if (parsed.type === 'suggestion' && parsed.suggestionError) {
                setSuggestionError(true);
              }

              if (parsed.type === 'error') {
                const errMsg = parsed.message || '优化过程出现错误';
                if (parsed.message?.includes('积分不足')) {
                  setShowCreditError(true);
                }
                setErrorMessage(errMsg);
                setStatus('error');
                setIsOptimizing(false);
                return; // Stop processing
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Optimization error:', error);
      const errMsg = error instanceof Error ? error.message : '网络错误，请检查连接后重试';
      setErrorMessage(errMsg);
      setStatus('error');
    } finally {
      clearTimeout(timeoutId);
      setIsOptimizing(false);
    }
  }, [resumeText, jobDescription]);

  const getStatusLabel = () => {
    const labels: Record<OptimizeStatus, string> = {
      idle: '等待上传',
      parsing: '解析简历中',
      analyzing: '分析经历中',
      suggesting: '生成改善建议中',
      optimizing: '应用 STAR 法则',
      formatting: '整理输出中',
      completed: '优化完成',
      error: '处理失败',
    };
    return labels[status];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Back */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
                  <ArrowLeft className="w-4 h-4" />
                  返回
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-900">简历优化</span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              {isLifetime ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-medium">
                  <Crown className="w-4 h-4" />
                  终身会员
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                  <Coins className="w-4 h-4" />
                  {credits} 积分
                </div>
              )}
              <span className="text-sm text-gray-600">{email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Credit Error Banner */}
      {showCreditError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700">
              <Coins className="w-5 h-5" />
              <span className="font-medium">积分不足</span>
              <span className="text-red-600">当前优化需要 10 积分，您当前余额不足</span>
            </div>
            <Link href="/dashboard/credits">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                立即充值
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && !showCreditError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">优化失败</span>
              <span className="text-red-600 text-sm">{errorMessage}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setErrorMessage(null);
                handleOptimize();
              }}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              重试
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Bar */}
        {isOptimizing && (
          <div className="mb-6 bg-white rounded-xl border border-violet-200 p-4 flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-violet-600 animate-pulse" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{getStatusLabel()}</p>
              <p className="text-sm text-gray-500">AI 正在处理你的简历，请稍候...</p>
            </div>
            <div className="text-sm text-violet-600 font-medium">
              {status === 'optimizing' && '这可能需要几秒钟...'}
            </div>
          </div>
        )}

        {/* Three Column Layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Upload & JD */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upload Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-violet-600" />
                  </div>
                  上传简历
                </CardTitle>
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
                  className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                >
                  {isOptimizing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      优化中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      开始优化
                    </>
                  )}
                </Button>

                {!isLifetime && (
                  <p className="text-xs text-center text-gray-500">
                    每次优化消耗 10 积分
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-violet-50 to-pink-50 border-violet-100">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">优化小贴士</h4>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  <li>• PDF 格式解析效果最佳</li>
                  <li>• 提供目标岗位 JD 可获得更精准匹配</li>
                  <li>• 优化后可对比原文查看改动</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Preview */}
          <div className="lg:col-span-4">
            <PreviewPanel
              isOptimizing={isOptimizing}
              streamData={streamData}
              status={status}
              resume={optimizedResume}
              userName={userName}
              userEmail={email}
              userAvatar={userAvatar}
              resetTrigger={resetTrigger}
              hasJobDescription={hasJobDescription}
              suggestionError={suggestionError}
            />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-4 space-y-6">
            {optimizedResume ? (
              <>
                {/* Success Card */}
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-800">优化完成！</p>
                      <p className="text-sm text-green-600">基于 STAR 法则已完成优化</p>
                    </div>
                    {suggestionError && (
                      <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        建议生成失败
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Suggestion Error Card */}
                {suggestionError && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-amber-700">简历改善建议生成失败</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            resetOptimizationState();
                            handleOptimize();
                          }}
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          重新生成
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Compare Button */}
                <Button
                  variant="outline"
                  onClick={() => setShowCompare(true)}
                  className="w-full gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <Eye className="w-4 h-4" />
                  对比原始简历
                </Button>

                {/* Regenerate Button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    resetOptimizationState();
                    handleOptimize();
                  }}
                  className="w-full gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <Sparkles className="w-4 h-4" />
                  重新生成
                </Button>

                {/* Download Options */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">下载优化结果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DownloadOptions resume={optimizedResume} targetRole={extractTargetRole(jobDescription)} />
                  </CardContent>
                </Card>

                {/* Tabs - Cover Letter & Interview */}
                <Card>
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="cover">求职信</TabsTrigger>
                      <TabsTrigger value="interview">面试问题</TabsTrigger>
                    </TabsList>
                    <TabsContent value="cover" className="p-4">
                      <CoverLetterGenerator
                        resumeText={resumeText}
                        jobDescription={jobDescription}
                      />
                    </TabsContent>
                    <TabsContent value="interview" className="p-4">
                      <InterviewQuestionsGenerator
                        resumeText={resumeText}
                        jobDescription={jobDescription}
                      />
                    </TabsContent>
                  </Tabs>
                </Card>
              </>
            ) : (
              /* Empty State */
              <Card className="border-dashed border-2">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">等待优化结果</h4>
                  <p className="text-sm text-gray-500">
                    上传简历并点击开始优化后
                    <br />
                    这里将展示优化结果
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Compare Modal */}
      {showCompare && optimizedResume && (
        <CompareView
          originalText={resumeText}
          optimizedResume={optimizedResume}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}
