"use client";

import { useState, useCallback } from 'react';
import { Sparkles, Zap, Shield, ArrowRight, FileText, CheckCircle2, TrendingUp, Eye, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { UploadZone } from '@/components/resume/UploadZone';
import { PreviewPanel } from '@/components/resume/PreviewPanel';
import { DownloadButton } from '@/components/resume/DownloadButton';
import { DownloadOptions } from '@/components/resume/DownloadOptions';
import { CompareView } from '@/components/resume/CompareView';
import { CoverLetterGenerator } from '@/components/resume/CoverLetter';
import { InterviewQuestionsGenerator } from '@/components/resume/InterviewQuestions';
import { JobDescriptionInput } from '@/components/resume/JobDescriptionInput';

import type { OptimizeStatus, StreamChunk, OptimizedResume } from '@/types/resume';

// Design tokens
const COLORS = {
  primary: '#1a1f2e',      // Deep navy
  secondary: '#2d3548',   // Slate
  accent: '#c9a227',       // Gold
  accentLight: '#e8d48a',  // Light gold
  surface: '#faf9f7',      // Warm white
  surfaceDark: '#f0ede8',   // Cream
  text: '#1a1f2e',         // Primary text
  textMuted: '#6b7280',    // Muted text
  success: '#059669',      // Emerald
};

export default function Home() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [status, setStatus] = useState<OptimizeStatus>('idle');
  const [streamData, setStreamData] = useState<StreamChunk[]>([]);
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [showCompare, setShowCompare] = useState(false);

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
    <div className="min-h-screen" style={{ backgroundColor: COLORS.surface }}>
      <style jsx global>{`
        .font-display {
          font-family: var(--font-playfair), Georgia, serif;
        }
        .font-body {
          font-family: var(--font-source-sans), -apple-system, sans-serif;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-delay-100 { animation-delay: 0.1s; }
        .animate-delay-200 { animation-delay: 0.2s; }
        .animate-delay-300 { animation-delay: 0.3s; }
        .animate-delay-400 { animation-delay: 0.4s; }

        .gradient-text {
          background: linear-gradient(135deg, ${COLORS.accent} 0%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gold-shimmer {
          background: linear-gradient(
            90deg,
            ${COLORS.accentLight} 0%,
            ${COLORS.accent} 25%,
            ${COLORS.accentLight} 50%,
            ${COLORS.accent} 75%,
            ${COLORS.accentLight} 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
      `}</style>

      {/* Header */}
      <header
        className="border-b sticky top-0 z-50"
        style={{
          backgroundColor: 'rgba(250, 249, 247, 0.95)',
          backdropFilter: 'blur(10px)',
          borderColor: COLORS.surfaceDark
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.accent} 0%, #b8962e 100%)`,
                  borderRadius: '4px'
                }}
              >
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold" style={{ color: COLORS.primary }}>
                  ResumeCraft
                </h1>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>AI-Powered Resume Optimizer</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: COLORS.secondary }}>
                功能特点
              </a>
              <a href="#how-it-works" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: COLORS.secondary }}>
                使用流程
              </a>
              <Button
                size="sm"
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: '4px'
                }}
              >
                立即体验
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${COLORS.secondary} 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />

        <div className="mx-auto max-w-6xl px-6 relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-in-up opacity-0">
              <span
                className="inline-block px-4 py-1.5 text-xs font-medium uppercase tracking-wider mb-6"
                style={{
                  backgroundColor: COLORS.surfaceDark,
                  color: COLORS.accent,
                  borderRadius: '2px'
                }}
              >
                AI 智能优化
              </span>
            </div>

            <h2 className="animate-fade-in-up opacity-0 animate-delay-100 font-display text-4xl md:text-6xl font-bold leading-tight mb-6" style={{ color: COLORS.primary }}>
              让你的简历
              <br />
              <span className="gradient-text">脱颖而出</span>
            </h2>

            <p className="animate-fade-in-up opacity-0 animate-delay-200 text-lg md:text-xl leading-relaxed mb-8" style={{ color: COLORS.textMuted }}>
              基于 STAR 法则，智能重构你的工作经历，
              <br className="hidden md:block" />
              量化成果数据，提升面试机会率达 3 倍
            </p>

            <div className="animate-fade-in-up opacity-0 animate-delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="gap-2 text-base px-8"
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: '4px'
                }}
                onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                开始优化 <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base px-8"
                style={{
                  borderColor: COLORS.secondary,
                  color: COLORS.secondary,
                  borderRadius: '4px'
                }}
              >
                <Eye className="h-4 w-4" /> 查看示例
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up opacity-0 animate-delay-400 mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold" style={{ color: COLORS.accent }}>3x</p>
              <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>面试机会提升</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold" style={{ color: COLORS.accent }}>10k+</p>
              <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>已优化简历</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold" style={{ color: COLORS.accent }}>98%</p>
              <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>用户满意度</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16" style={{ backgroundColor: COLORS.surfaceDark }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h3 className="font-display text-3xl font-bold mb-4" style={{ color: COLORS.primary }}>
              为什么选择我们
            </h3>
            <p className="text-lg" style={{ color: COLORS.textMuted }}>
              专业团队打造，让你的简历更具竞争力
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="h-6 w-6" />,
                title: 'STAR 法则重构',
                description: '将模糊的工作描述转化为具体的情境、任务、行动和结果，让经历更具说服力',
                color: '#f59e0b'
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: '智能量化分析',
                description: '自动识别并补充可量化的成果数据，用数字证明你的能力',
                color: '#059669'
              },
              {
                icon: <Target className="h-6 w-6" />,
                title: 'JD 关键词匹配',
                description: '针对目标岗位的 JD 进行优化，确保简历与招聘需求高度匹配',
                color: '#7c3aed'
              }
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300"
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <CardContent className="p-6">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <div style={{ color: feature.color }}>{feature.icon}</div>
                  </div>
                  <h4 className="font-display text-lg font-semibold mb-2" style={{ color: COLORS.primary }}>
                    {feature.title}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16" style={{ backgroundColor: COLORS.primary }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h3 className="font-display text-3xl font-bold mb-4" style={{ color: COLORS.surface }}>
              使用流程
            </h3>
            <p className="text-lg" style={{ color: `${COLORS.surface}99` }}>
              三步完成简历优化
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: '上传简历', desc: '支持 PDF 和 Word 格式' },
              { step: '02', title: 'AI 智能分析', desc: '自动识别并优化内容' },
              { step: '03', title: '下载优化结果', desc: '获取专业级优化简历' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <p className="font-display text-5xl font-bold mb-4 gold-shimmer bg-clip-text text-transparent">
                  {item.step}
                </p>
                <h4 className="font-display text-xl font-semibold mb-2" style={{ color: COLORS.surface }}>
                  {item.title}
                </h4>
                <p style={{ color: `${COLORS.surface}99` }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ backgroundColor: COLORS.surface }}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h3 className="font-display text-3xl md:text-4xl font-bold mb-6" style={{ color: COLORS.primary }}>
            准备好让你的简历脱颖而出了吗？
          </h3>
          <p className="text-lg mb-8" style={{ color: COLORS.textMuted }}>
            立即开始免费优化，让招聘官眼前一亮
          </p>
          <Button
            size="lg"
            className="gap-2 text-base px-10"
            style={{
              backgroundColor: COLORS.accent,
              color: COLORS.primary,
              borderRadius: '4px',
              fontWeight: 600
            }}
            onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            立即开始 <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Main Content - Upload & Preview */}
      <section id="upload-section" className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h3 className="font-display text-3xl font-bold mb-4" style={{ color: COLORS.primary }}>
              开始优化你的简历
            </h3>
            <p className="text-lg" style={{ color: COLORS.textMuted }}>
              上传简历，AI 将自动分析并优化内容
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Upload */}
            <div className="space-y-6">
              <Card style={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS.accent}15` }}
                    >
                      <FileText className="h-5 w-5" style={{ color: COLORS.accent }} />
                    </div>
                    <CardTitle className="font-display text-xl" style={{ color: COLORS.primary }}>
                      上传简历
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <UploadZone
                    onFileSelect={handleFileSelect}
                    isLoading={isOptimizing}
                  />

                  <JobDescriptionInput
                    value={jobDescription}
                    onChange={setJobDescription}
                  />

                  {/* Status indicator */}
                  {isOptimizing && (
                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: COLORS.surfaceDark }}>
                      <div className="w-2 h-2 rounded-full gold-shimmer" />
                      <span className="text-sm font-medium" style={{ color: COLORS.secondary }}>
                        {getStatusLabel()}
                      </span>
                      <RefreshCw className="h-4 w-4 animate-spin ml-auto" style={{ color: COLORS.accent }} />
                    </div>
                  )}

                  <Button
                    onClick={handleOptimize}
                    disabled={!resumeText.trim() || isOptimizing}
                    className="w-full gap-2 text-base py-6"
                    style={{
                      backgroundColor: resumeText.trim() && !isOptimizing ? COLORS.primary : COLORS.secondary,
                      borderRadius: '4px'
                    }}
                  >
                    {isOptimizing ? (
                      <>正在优化中...</>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        开始优化简历
                      </>
                    )}
                  </Button>

                  {status === 'error' && (
                    <p className="text-center text-sm" style={{ color: '#dc2626' }}>
                      优化失败，请检查 API 配置或重试
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card style={{ borderRadius: '8px', border: 'none', backgroundColor: `${COLORS.accent}08` }}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: COLORS.accent }} />
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: COLORS.primary }}>优化建议</h4>
                      <ul className="text-sm space-y-1.5" style={{ color: COLORS.textMuted }}>
                        <li className="flex items-center gap-2">
                          <span style={{ color: COLORS.accent }}>•</span> 上传 PDF 格式可获得最佳解析效果
                        </li>
                        <li className="flex items-center gap-2">
                          <span style={{ color: COLORS.accent }}>•</span> 提供目标岗位 JD 可获得更精准的匹配
                        </li>
                        <li className="flex items-center gap-2">
                          <span style={{ color: COLORS.accent }}>•</span> STAR 法则让你的经历更具说服力
                        </li>
                      </ul>
                    </div>
                  </div>
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
                <Card style={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5" style={{ color: COLORS.success }} />
                        <span className="font-medium" style={{ color: COLORS.primary }}>
                          优化完成！
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCompare(true)}
                        className="gap-2"
                        style={{
                          borderColor: COLORS.secondary,
                          borderRadius: '4px',
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        对比预览
                      </Button>
                    </div>
                    <DownloadOptions resume={optimizedResume} />

                    {/* Cover Letter */}
                    <CoverLetterGenerator
                      resumeText={resumeText}
                      jobDescription={jobDescription}
                    />

                    {/* Interview Questions */}
                    <InterviewQuestionsGenerator
                      resumeText={resumeText}
                      jobDescription={jobDescription}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Compare View Modal */}
      {showCompare && optimizedResume && (
        <CompareView
          originalText={resumeText}
          optimizedResume={optimizedResume}
          onClose={() => setShowCompare(false)}
        />
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: COLORS.primary }} className="py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.accent} 0%, #b8962e 100%)`,
                  borderRadius: '4px'
                }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-semibold" style={{ color: COLORS.surface }}>
                ResumeCraft
              </span>
            </div>
            <p className="text-sm" style={{ color: `${COLORS.surface}99` }}>
              AI 简历优化平台 · 基于智谱 GLM-4.7 模型
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Add missing Target icon component
function Target({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
