"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, Zap, Shield, ArrowRight, FileText, CheckCircle2, TrendingUp, Eye, Download, RefreshCw, Star, ChevronDown, ChevronUp, X, Wand2, Target, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { UploadZone } from '@/components/resume/UploadZone';
import { PreviewPanel } from '@/components/resume/PreviewPanel';
import { DownloadOptions } from '@/components/resume/DownloadOptions';
import { CompareView } from '@/components/resume/CompareView';
import { CoverLetterGenerator } from '@/components/resume/CoverLetter';
import { InterviewQuestionsGenerator } from '@/components/resume/InterviewQuestions';
import { JobDescriptionInput } from '@/components/resume/JobDescriptionInput';

import type { OptimizeStatus, StreamChunk, OptimizedResume } from '@/types/resume';

// Design Tokens - Modern Gradient Premium
const COLORS = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
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
  warning: '#F59E0B',
};

export default function Home() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [status, setStatus] = useState<OptimizeStatus>('idle');
  const [streamData, setStreamData] = useState<StreamChunk[]>([]);
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [activeTab, setActiveTab] = useState<'cover' | 'interview'>('cover');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = useCallback((file: File, text: string) => {
    // Reset all optimization state when a new file is selected
    setResumeText(text);
    setOptimizedResume(null);
    setStreamData([]);
    setShowCompare(false);
    setStatus('parsing');
    setIsOptimizing(false);
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

  // Ambient background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const shapes: Array<{
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      hue: number;
    }> = [];

    for (let i = 0; i < 30; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 200 + 50,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.08 + 0.02,
        hue: Math.random() > 0.5 ? 250 : 280,
      });
    }

    let animationId: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.005;

      shapes.forEach((shape, i) => {
        shape.y -= shape.speed;
        if (shape.y + shape.size < 0) {
          shape.y = canvas.height + shape.size;
          shape.x = Math.random() * canvas.width;
        }

        const gradient = ctx.createRadialGradient(
          shape.x, shape.y, 0,
          shape.x, shape.y, shape.size
        );
        gradient.addColorStop(0, `hsla(${shape.hue}, 70%, 60%, ${shape.opacity})`);
        gradient.addColorStop(1, `hsla(${shape.hue}, 70%, 60%, 0)`);

        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: COLORS.bg }}>
      {/* Ambient Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.8 }}
      />

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${COLORS.gradientStart} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute top-1/3 -left-40 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${COLORS.gradientEnd} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${COLORS.accent} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 grid-pattern opacity-50" />

      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(250, 250, 250, 0.8)',
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div
                className="relative flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gradientStart} 0%, ${COLORS.gradientEnd} 100%)`,
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                }}
              >
                <Sparkles className="h-5 w-5 text-white relative z-10" />
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                  }}
                />
              </div>
              <div>
                <h1
                  className="text-xl font-semibold tracking-tight"
                  style={{
                    fontFamily: 'var(--font-outfit), sans-serif',
                    color: COLORS.text,
                  }}
                >
                  ResumeCraft
                </h1>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  AI-Powered Resume Optimizer
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {['功能特点', '使用流程', '关于'].map((item, index) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm font-medium transition-all duration-300 hover:opacity-100 relative group"
                  style={{ color: COLORS.textMuted }}
                >
                  {item}
                  <span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                    style={{ background: `linear-gradient(90deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})` }}
                  />
                </a>
              ))}
              <button
                className="relative px-6 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gradientStart} 0%, ${COLORS.gradientEnd} 100%)`,
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                }}
              >
                <span className="relative z-10">立即体验</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            {/* Floating Badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full border"
              style={{
                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                borderColor: 'rgba(102, 126, 234, 0.2)',
              }}
            >
              <Sparkles className="h-4 w-4" style={{ color: COLORS.primary }} />
              <span className="text-sm font-medium" style={{ color: COLORS.primary }}>
                AI 智能优化 · STAR 法则
              </span>
            </div>

            {/* Main Headline */}
            <h2
              className="animate-fade-in-up animate-delay-100 text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
              style={{
                fontFamily: 'var(--font-outfit), sans-serif',
                color: COLORS.text,
              }}
            >
              让你的简历
              <br />
              <span
                className="text-gradient-animated"
                style={{
                  background: `linear-gradient(90deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd}, ${COLORS.accent}, ${COLORS.gradientEnd})`,
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                脱颖而出
              </span>
            </h2>

            {/* Subheadline */}
            <p
              className="animate-fade-in-up animate-delay-200 text-lg md:text-xl leading-relaxed mb-12 max-w-xl mx-auto"
              style={{ color: COLORS.textMuted }}
            >
              基于 STAR 法则，智能重构你的工作经历，
              <br className="hidden md:block" />
              量化成果数据，提升面试机会率达 3 倍
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="group relative px-10 py-4 rounded-2xl text-base font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gradientStart} 0%, ${COLORS.gradientEnd} 100%)`,
                  boxShadow: '0 10px 40px rgba(102, 126, 234, 0.35)',
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  开始优化
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
              <button
                className="group px-10 py-4 rounded-2xl text-base font-semibold border-2 transition-all duration-300 hover:scale-105"
                style={{
                  borderColor: COLORS.border,
                  color: COLORS.text,
                  backgroundColor: 'transparent',
                }}
              >
                <span className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  查看示例
                </span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="animate-fade-in-up animate-delay-400 mt-20 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { value: '3x', label: '面试机会提升', icon: TrendingUp },
              { value: '10k+', label: '已优化简历', icon: FileText },
              { value: '98%', label: '用户满意度', icon: Award },
            ].map((stat, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-white border transition-all duration-500 hover:scale-105 hover:shadow-xl"
                style={{
                  borderColor: COLORS.border,
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gradientStart}10 0%, ${COLORS.gradientEnd}10 100%)`,
                  }}
                />
                <div className="relative z-10">
                  <stat.icon
                    className="h-6 w-6 mb-3 transition-colors duration-300"
                    style={{ color: COLORS.primary }}
                  />
                  <p
                    className="text-3xl md:text-4xl font-bold mb-1"
                    style={{
                      fontFamily: 'var(--font-sora), sans-serif',
                      background: `linear-gradient(135deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, rgba(102, 126, 234, 0.03) 50%, transparent 100%)`,
          }}
        />
        <div className="mx-auto max-w-6xl px-6 relative z-10">
          <div className="text-center mb-16">
            <span
              className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest rounded-full"
              style={{
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                color: COLORS.primary,
              }}
            >
              为什么选择我们
            </span>
            <h3
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{
                fontFamily: 'var(--font-outfit), sans-serif',
                color: COLORS.text,
              }}
            >
              专业团队打造，让你的简历{' '}
              <span
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                更具竞争力
              </span>
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'STAR 法则重构',
                description: '将模糊的工作描述转化为具体的情境、任务、行动和结果，让经历更具说服力',
                color: COLORS.gradientStart,
              },
              {
                icon: Target,
                title: '智能量化分析',
                description: '自动识别并补充可量化的成果数据，用数字证明你的能力',
                color: COLORS.gradientEnd,
              },
              {
                icon: Wand2,
                title: 'JD 关键词匹配',
                description: '针对目标岗位的 JD 进行优化，确保简历与招聘需求高度匹配',
                color: COLORS.accent,
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-0 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl"
                style={{
                  backgroundColor: COLORS.surface,
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color}08 0%, transparent 100%)`,
                  }}
                />
                <CardContent className="relative z-10 p-8">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `${feature.color}15`,
                    }}
                  >
                    <feature.icon className="h-7 w-7" style={{ color: feature.color }} />
                  </div>
                  <h4
                    className="text-xl font-semibold mb-3"
                    style={{
                      fontFamily: 'var(--font-outfit), sans-serif',
                      color: COLORS.text,
                    }}
                  >
                    {feature.title}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>
                    {feature.description}
                  </p>
                </CardContent>
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-500 group-hover:h-2"
                  style={{
                    background: `linear-gradient(90deg, ${feature.color}, ${feature.color}80)`,
                  }}
                />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 relative z-10">
          {/* Collapsible Header */}
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full text-center mb-4 group"
          >
            <span
              className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest rounded-full"
              style={{
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                color: COLORS.gradientEnd,
              }}
            >
              使用流程
            </span>
            <div className="flex items-center justify-center gap-2">
              <h3
                className="text-3xl md:text-4xl font-bold"
                style={{
                  fontFamily: 'var(--font-outfit), sans-serif',
                  color: COLORS.text,
                }}
              >
                三步完成简历优化
              </h3>
              {showHowItWorks ? (
                <ChevronUp className="h-6 w-6 transition-transform" style={{ color: COLORS.gradientEnd }} />
              ) : (
                <ChevronDown className="h-6 w-6 transition-transform" style={{ color: COLORS.gradientEnd }} />
              )}
            </div>
            {!showHowItWorks && (
              <p className="text-sm mt-2" style={{ color: COLORS.textMuted }}>
                点击展开查看
              </p>
            )}
          </button>

          {/* Collapsible Content */}
          {showHowItWorks && (
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              {[
                { step: '01', title: '上传简历', desc: '支持 PDF 和 Word 格式', gradient: COLORS.gradientStart },
                { step: '02', title: 'AI 智能分析', desc: '自动识别并优化内容', gradient: COLORS.gradientEnd },
                { step: '03', title: '下载优化结果', desc: '获取专业级优化简历', gradient: COLORS.accent },
              ].map((item, index) => (
                <div
                  key={index}
                  className="relative group"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div
                    className="absolute inset-0 rounded-3xl blur-xl opacity-20 transition-opacity duration-500 group-hover:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${item.gradient}, transparent)` }}
                  />
                  <div
                    className="relative p-8 rounded-3xl bg-white border transition-all duration-500 hover:scale-[1.02] hover:shadow-xl"
                    style={{
                      borderColor: COLORS.border,
                    }}
                  >
                    <p
                      className="text-6xl font-bold mb-4 tracking-tight"
                      style={{
                        fontFamily: 'var(--font-sora), sans-serif',
                        background: `linear-gradient(135deg, ${item.gradient}, ${item.gradient}80)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {item.step}
                    </p>
                    <h4
                      className="text-xl font-semibold mb-2"
                      style={{
                        fontFamily: 'var(--font-outfit), sans-serif',
                        color: COLORS.text,
                      }}
                    >
                      {item.title}
                    </h4>
                    <p className="text-sm" style={{ color: COLORS.textMuted }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-20 blur-3xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})`,
            }}
          />
        </div>
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <h3
            className="text-3xl md:text-4xl font-bold mb-6"
            style={{
              fontFamily: 'var(--font-outfit), sans-serif',
              color: COLORS.text,
            }}
          >
            准备好让你的简历脱颖而出了吗？
          </h3>
          <p className="text-lg mb-10" style={{ color: COLORS.textMuted }}>
            立即开始免费优化，让招聘官眼前一亮
          </p>
          <button
            onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative px-14 py-5 rounded-2xl text-base font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gradientStart} 0%, ${COLORS.gradientEnd} 100%)`,
              boxShadow: '0 15px 50px rgba(102, 126, 234, 0.4)',
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              立即开始
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </section>

      {/* Main Content - Upload & Preview */}
      <section id="upload-section" className="py-20 relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <span
              className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest rounded-full"
              style={{
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                color: COLORS.primary,
              }}
            >
              开始优化
            </span>
            <h3
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{
                fontFamily: 'var(--font-outfit), sans-serif',
                color: COLORS.text,
              }}
            >
              开始优化你的简历
            </h3>
            <p className="text-lg" style={{ color: COLORS.textMuted }}>
              上传简历，AI 将自动分析并优化内容
            </p>
          </div>

          {/* 3-Column Layout */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Column - Upload & Job Description */}
            <div className="lg:col-span-4 space-y-6">
              <Card
                className="overflow-hidden transition-all duration-500 hover:shadow-xl"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  borderRadius: '1rem',
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      }}
                    >
                      <FileText className="h-5 w-5" style={{ color: COLORS.primary }} />
                    </div>
                    <CardTitle
                      className="text-xl"
                      style={{
                        fontFamily: 'var(--font-outfit), sans-serif',
                        color: COLORS.text,
                      }}
                    >
                      上传简历
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
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
                    <div
                      className="flex items-center gap-3 p-4 rounded-xl"
                      style={{
                        backgroundColor: 'rgba(102, 126, 234, 0.08)',
                        border: `1px solid rgba(102, 126, 234, 0.2)`,
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ background: `linear-gradient(135deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})` }}
                      />
                      <span className="text-sm font-medium" style={{ color: COLORS.text }}>
                        {getStatusLabel()}
                      </span>
                      <RefreshCw className="h-4 w-4 animate-spin ml-auto" style={{ color: COLORS.primary }} />
                    </div>
                  )}

                  <button
                    onClick={handleOptimize}
                    disabled={!resumeText.trim() || isOptimizing}
                    className="w-full relative px-6 py-4 rounded-xl text-base font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                    style={{
                      background: resumeText.trim() && !isOptimizing
                        ? `linear-gradient(135deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})`
                        : COLORS.textMuted,
                      boxShadow: resumeText.trim() && !isOptimizing
                        ? '0 4px 15px rgba(102, 126, 234, 0.3)'
                        : 'none',
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isOptimizing ? (
                        <>正在优化中...</>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          开始优化简历
                        </>
                      )}
                    </span>
                  </button>

                  {status === 'error' && (
                    <p className="text-center text-sm" style={{ color: '#DC2626' }}>
                      优化失败，请检查 API 配置或重试
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card
                className="overflow-hidden transition-all duration-500 hover:shadow-lg"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  borderRadius: '1rem',
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: COLORS.success }} />
                    <div>
                      <h4
                        className="font-semibold mb-3"
                        style={{
                          fontFamily: 'var(--font-outfit), sans-serif',
                          color: COLORS.text,
                        }}
                      >
                        优化建议
                      </h4>
                      <ul className="text-sm space-y-2.5" style={{ color: COLORS.textMuted }}>
                        <li className="flex items-center gap-2">
                          <span style={{ color: COLORS.primary }}>•</span> 上传 PDF 格式可获得最佳解析效果
                        </li>
                        <li className="flex items-center gap-2">
                          <span style={{ color: COLORS.primary }}>•</span> 提供目标岗位 JD 可获得更精准的匹配
                        </li>
                        <li className="flex items-center gap-2">
                          <span style={{ color: COLORS.primary }}>•</span> STAR 法则让你的经历更具说服力
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Preview Panel */}
            <div className="lg:col-span-4">
              <PreviewPanel
                isOptimizing={isOptimizing}
                streamData={streamData}
                status={status}
              />
            </div>

            {/* Right Column - Results & Actions */}
            <div className="lg:col-span-4 space-y-6">
              {optimizedResume ? (
                <>
                  {/* Success Header */}
                  <Card
                    className="overflow-hidden transition-all duration-500"
                    style={{
                      backgroundColor: COLORS.surface,
                      borderColor: COLORS.border,
                      borderRadius: '1rem',
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)' }}
                        >
                          <CheckCircle2 className="h-5 w-5" style={{ color: COLORS.success }} />
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: COLORS.text }}>优化完成！</span>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>AI 已基于 STAR 法则完成优化</p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setShowCompare(true)}
                        className="w-full"
                        style={{
                          borderColor: COLORS.border,
                          color: COLORS.text,
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        对比预览
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Download Options */}
                  <Card
                    className="overflow-hidden transition-all duration-500 hover:shadow-xl"
                    style={{
                      backgroundColor: COLORS.surface,
                      borderColor: COLORS.border,
                      borderRadius: '1rem',
                    }}
                  >
                    <CardContent className="p-6">
                      <h4
                        className="font-semibold mb-4 flex items-center gap-2"
                        style={{
                          fontFamily: 'var(--font-outfit), sans-serif',
                          color: COLORS.text,
                        }}
                      >
                        <Download className="h-4 w-4" style={{ color: COLORS.primary }} />
                        下载优化结果
                      </h4>
                      <DownloadOptions resume={optimizedResume} />
                    </CardContent>
                  </Card>

                  {/* Tabbed Section */}
                  <Card
                    className="overflow-hidden transition-all duration-500"
                    style={{
                      backgroundColor: COLORS.surface,
                      borderColor: COLORS.border,
                      borderRadius: '1rem',
                    }}
                  >
                    {/* Tab Header */}
                    <div className="flex border-b" style={{ borderColor: COLORS.border }}>
                      <button
                        onClick={() => setActiveTab('cover')}
                        className="flex-1 px-4 py-3 text-sm font-medium transition-all relative"
                        style={{
                          color: activeTab === 'cover' ? COLORS.primary : COLORS.textMuted,
                        }}
                      >
                        求职信
                        {activeTab === 'cover' && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ background: `linear-gradient(90deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})` }}
                          />
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab('interview')}
                        className="flex-1 px-4 py-3 text-sm font-medium transition-all relative"
                        style={{
                          color: activeTab === 'interview' ? COLORS.primary : COLORS.textMuted,
                        }}
                      >
                        面试问题
                        {activeTab === 'interview' && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ background: `linear-gradient(90deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})` }}
                          />
                        )}
                      </button>
                    </div>

                    {/* Tab Content */}
                    <CardContent className="p-5">
                      {activeTab === 'cover' ? (
                        <CoverLetterGenerator
                          resumeText={resumeText}
                          jobDescription={jobDescription}
                        />
                      ) : (
                        <InterviewQuestionsGenerator
                          resumeText={resumeText}
                          jobDescription={jobDescription}
                        />
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* Empty State */
                <Card
                  className="h-full min-h-96 flex items-center justify-center transition-all duration-500"
                  style={{
                    backgroundColor: COLORS.surface,
                    borderColor: COLORS.border,
                    borderRadius: '1rem',
                    border: `2px dashed ${COLORS.border}`,
                  }}
                >
                  <CardContent className="text-center py-12">
                    <div
                      className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(102, 126, 234, 0.1)' }}
                    >
                      <Star className="h-8 w-8" style={{ color: COLORS.primary }} />
                    </div>
                    <h4
                      className="font-semibold mb-2"
                      style={{
                        fontFamily: 'var(--font-outfit), sans-serif',
                        color: COLORS.text,
                      }}
                    >
                      等待优化结果
                    </h4>
                    <p className="text-sm" style={{ color: COLORS.textMuted }}>
                      上传简历并点击开始优化后
                      <br />
                      这里将展示优化结果
                    </p>
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
      <footer
        className="py-10 border-t"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
        }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="relative flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})`,
                }}
              >
                <Sparkles className="h-4 w-4 text-white relative z-10" />
              </div>
              <span
                className="text-lg font-semibold"
                style={{
                  fontFamily: 'var(--font-outfit), sans-serif',
                  color: COLORS.text,
                }}
              >
                ResumeCraft
              </span>
            </div>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              AI 简历优化平台 · 基于智谱 GLM-4.7 模型
            </p>
          </div>
        </div>
      </footer>

      {/* Global Styles */}
      <style jsx global>{`
        .text-gradient-animated {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        .grid-pattern {
          background-image:
            linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-delay-100 { animation-delay: 0.1s; }
        .animate-delay-200 { animation-delay: 0.2s; }
        .animate-delay-300 { animation-delay: 0.3s; }
        .animate-delay-400 { animation-delay: 0.4s; }
        .animate-delay-500 { animation-delay: 0.5s; }
        .animate-delay-600 { animation-delay: 0.6s; }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        .animate-pulse-soft {
          animation: pulseSoft 3s ease-in-out infinite;
        }

        @keyframes pulseSoft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
