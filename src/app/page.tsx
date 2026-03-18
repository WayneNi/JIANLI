"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, Zap, Shield, ArrowRight, FileText, CheckCircle2, TrendingUp, Eye, Download, RefreshCw, Star, Crown, Gem, ChevronDown, X } from 'lucide-react';
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

// Design tokens - Black & Gold Luxury Theme
const COLORS = {
  darkBg: '#050508',           // Deepest black
  darkSurface: '#0a0a10',      // Card backgrounds
  darkElevated: '#12121a',     // Elevated surfaces
  gold: '#c9a227',             // Primary gold
  goldLight: '#e8d48a',        // Light gold
  goldBright: '#ffd700',       // Bright gold for accents
  goldDark: '#8b7019',         // Dark gold
  text: '#ffffff',             // White text
  textMuted: '#888888',        // Muted text
  textDim: '#555555',          // Dimmed text
  success: '#059669',          // Emerald
  border: '#1a1a24',           // Subtle borders
};

// Particle configuration
const PARTICLES = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 20 + 10,
  delay: Math.random() * 10,
}));

export default function Home() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [status, setStatus] = useState<OptimizeStatus>('idle');
  const [streamData, setStreamData] = useState<StreamChunk[]>([]);
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [activeTab, setActiveTab] = useState<'cover' | 'interview'>('cover');
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      gold: boolean;
    }> = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.2,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        gold: Math.random() > 0.7,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (p.gold) {
          ctx.fillStyle = `rgba(201, 162, 39, ${p.alpha})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.3})`;
        }
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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: COLORS.darkBg }}>
      {/* Particle Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.6 }}
      />

      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: `radial-gradient(circle, ${COLORS.gold} 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: `radial-gradient(circle, ${COLORS.goldLight} 0%, transparent 70%)` }}
        />
        <div
          className="absolute top-1/2 right-0 w-64 h-64 rounded-full opacity-5 blur-3xl"
          style={{ background: `radial-gradient(circle, ${COLORS.goldBright} 0%, transparent 70%)` }}
        />
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

        .font-display {
          font-family: 'Playfair Display', Georgia, serif;
        }
        .font-body {
          font-family: 'Inter', -apple-system, sans-serif;
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

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(201, 162, 39, 0.3); }
          50% { box-shadow: 0 0 40px rgba(201, 162, 39, 0.6); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes rotate-glow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes border-glow {
          0%, 100% { border-color: rgba(201, 162, 39, 0.3); }
          50% { border-color: rgba(201, 162, 39, 0.8); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-delay-100 { animation-delay: 0.1s; opacity: 0; }
        .animate-delay-200 { animation-delay: 0.2s; opacity: 0; }
        .animate-delay-300 { animation-delay: 0.3s; opacity: 0; }
        .animate-delay-400 { animation-delay: 0.4s; opacity: 0; }
        .animate-delay-500 { animation-delay: 0.5s; opacity: 0; }

        .gold-shimmer {
          background: linear-gradient(
            90deg,
            ${COLORS.goldLight} 0%,
            ${COLORS.gold} 25%,
            ${COLORS.goldLight} 50%,
            ${COLORS.gold} 75%,
            ${COLORS.goldLight} 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s infinite linear;
        }

        .gradient-text {
          background: linear-gradient(135deg, ${COLORS.goldLight} 0%, ${COLORS.goldBright} 50%, ${COLORS.goldLight} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gold-border-glow {
          animation: border-glow 2s ease-in-out infinite;
          border: 1px solid rgba(201, 162, 39, 0.3);
        }

        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(201, 162, 39, 0.2);
        }

        .glass-card {
          background: rgba(10, 10, 16, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(201, 162, 39, 0.15);
        }

        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: ${COLORS.darkSurface};
        }
        ::-webkit-scrollbar-thumb {
          background: ${COLORS.goldDark};
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${COLORS.gold};
        }
      `}</style>

      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: 'rgba(5, 5, 8, 0.9)',
          backdropFilter: 'blur(20px)',
          borderColor: COLORS.border,
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="relative flex h-11 w-11 items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  borderRadius: '6px',
                }}
              >
                <Sparkles className="h-5 w-5 text-white" />
                <div
                  className="absolute inset-0 rounded-md"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.goldBright} 0%, transparent 50%)`,
                    opacity: 0.5,
                  }}
                />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-white">
                  ResumeCraft
                </h1>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>AI-Powered Resume Optimizer</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {['功能特点', '使用流程', '关于'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm font-medium transition-all hover:text-white"
                  style={{ color: COLORS.textMuted }}
                  onMouseEnter={(e) => e.currentTarget.style.color = COLORS.gold}
                  onMouseLeave={(e) => e.currentTarget.style.color = COLORS.textMuted}
                >
                  {item}
                </a>
              ))}
              <Button
                size="sm"
                className="font-medium"
                style={{
                  backgroundColor: COLORS.gold,
                  color: COLORS.darkBg,
                  borderRadius: '4px',
                }}
              >
                立即体验
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            {/* Floating decorative elements */}
            <div
              className="absolute top-1/4 left-10 w-2 h-2 rounded-full opacity-60"
              style={{ backgroundColor: COLORS.gold, animation: 'sparkle 3s infinite' }}
            />
            <div
              className="absolute top-1/3 right-16 w-1 h-1 rounded-full opacity-40"
              style={{ backgroundColor: COLORS.goldBright, animation: 'sparkle 4s infinite 1s' }}
            />
            <div
              className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 rounded-full opacity-50"
              style={{ backgroundColor: COLORS.goldLight, animation: 'sparkle 5s infinite 2s' }}
            />

            <div className="animate-fade-in-up">
              <span
                className="inline-block px-5 py-2 text-xs font-semibold uppercase tracking-widest mb-8"
                style={{
                  backgroundColor: `${COLORS.gold}15`,
                  color: COLORS.gold,
                  borderRadius: '2px',
                  border: `1px solid ${COLORS.gold}30`,
                }}
              >
                <Sparkles className="inline h-3 w-3 mr-2" />
                AI 智能优化
              </span>
            </div>

            <h2 className="animate-fade-in-up animate-delay-100 font-display text-5xl md:text-7xl font-bold leading-tight mb-8 text-white">
              让你的简历
              <br />
              <span className="gradient-text">脱颖而出</span>
            </h2>

            <p className="animate-fade-in-up animate-delay-200 text-lg md:text-xl leading-relaxed mb-10" style={{ color: COLORS.textMuted }}>
              基于 STAR 法则，智能重构你的工作经历，
              <br className="hidden md:block" />
              量化成果数据，提升面试机会率达 3 倍
            </p>

            <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="gap-2 text-base px-10 py-6 font-medium hover-lift"
                style={{
                  backgroundColor: COLORS.gold,
                  color: COLORS.darkBg,
                  borderRadius: '4px',
                }}
                onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                开始优化 <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base px-10 py-6 font-medium"
                style={{
                  borderColor: `${COLORS.gold}50`,
                  color: COLORS.gold,
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                }}
              >
                <Eye className="h-4 w-4" /> 查看示例
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up animate-delay-400 mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { value: '3x', label: '面试机会提升' },
              { value: '10k+', label: '已优化简历' },
              { value: '98%', label: '用户满意度' },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-lg glass-card hover-lift"
                style={{ animation: `float ${3 + index * 0.5}s ease-in-out infinite` }}
              >
                <p className="font-display text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 relative" style={{ backgroundColor: COLORS.darkSurface }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h3 className="font-display text-3xl md:text-4xl font-bold mb-4 text-white">
              为什么选择我们
            </h3>
            <p className="text-lg" style={{ color: COLORS.textMuted }}>
              专业团队打造，让你的简历更具竞争力
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="h-7 w-7" />,
                title: 'STAR 法则重构',
                description: '将模糊的工作描述转化为具体的情境、任务、行动和结果，让经历更具说服力',
                color: COLORS.gold,
              },
              {
                icon: <TrendingUp className="h-7 w-7" />,
                title: '智能量化分析',
                description: '自动识别并补充可量化的成果数据，用数字证明你的能力',
                color: '#059669',
              },
              {
                icon: <Crown className="h-7 w-7" />,
                title: 'JD 关键词匹配',
                description: '针对目标岗位的 JD 进行优化，确保简历与招聘需求高度匹配',
                color: '#9333ea',
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover-lift glass-card"
                style={{
                  borderRadius: '12px',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s forwards`,
                }}
              >
                <CardContent className="p-8">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: `${feature.color}15`,
                      border: `1px solid ${feature.color}30`,
                    }}
                  >
                    <div style={{ color: feature.color }}>{feature.icon}</div>
                  </div>
                  <h4 className="font-display text-xl font-semibold mb-3 text-white">
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
      <section id="how-it-works" className="py-20 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${COLORS.gold}30 1px, transparent 0)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="mx-auto max-w-6xl px-6 relative z-10">
          <div className="text-center mb-16">
            <h3 className="font-display text-3xl md:text-4xl font-bold mb-4 text-white">
              使用流程
            </h3>
            <p className="text-lg" style={{ color: COLORS.textMuted }}>
              三步完成简历优化
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: '上传简历', desc: '支持 PDF 和 Word 格式' },
              { step: '02', title: 'AI 智能分析', desc: '自动识别并优化内容' },
              { step: '03', title: '下载优化结果', desc: '获取专业级优化简历' },
            ].map((item, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-xl glass-card gold-border-glow"
                style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.15}s forwards` }}
              >
                <p
                  className="font-display text-6xl font-bold mb-4 gold-shimmer bg-clip-text text-transparent"
                  style={{ WebkitTextFillColor: 'transparent' }}
                >
                  {item.step}
                </p>
                <h4 className="font-display text-xl font-semibold mb-2 text-white">
                  {item.title}
                </h4>
                <p style={{ color: COLORS.textMuted }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at center, ${COLORS.gold}20 0%, transparent 70%)`,
          }}
        />
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <h3 className="font-display text-3xl md:text-4xl font-bold mb-6 text-white">
            准备好让你的简历脱颖而出了吗？
          </h3>
          <p className="text-lg mb-10" style={{ color: COLORS.textMuted }}>
            立即开始免费优化，让招聘官眼前一亮
          </p>
          <Button
            size="lg"
            className="gap-2 text-base px-12 py-7 font-semibold hover-lift"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.darkBg,
              borderRadius: '4px',
            }}
            onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            立即开始 <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Main Content - Upload & Preview */}
      <section id="upload-section" className="py-20 relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h3 className="font-display text-3xl md:text-4xl font-bold mb-4 text-white">
              开始优化你的简历
            </h3>
            <p className="text-lg" style={{ color: COLORS.textMuted }}>
              上传简历，AI 将自动分析并优化内容
            </p>
          </div>

          {/* 3-Column Layout for better organization */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Column - Upload & Job Description */}
            <div className="lg:col-span-4 space-y-6">
              <Card
                className="glass-card hover-lift"
                style={{ borderRadius: '12px' }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${COLORS.gold}15`,
                        border: `1px solid ${COLORS.gold}30`,
                      }}
                    >
                      <FileText className="h-5 w-5" style={{ color: COLORS.gold }} />
                    </div>
                    <CardTitle className="font-display text-xl text-white">
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
                      className="flex items-center gap-3 p-4 rounded-lg"
                      style={{ backgroundColor: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}30` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full gold-shimmer" />
                      <span className="text-sm font-medium text-white">
                        {getStatusLabel()}
                      </span>
                      <RefreshCw className="h-4 w-4 animate-spin ml-auto" style={{ color: COLORS.gold }} />
                    </div>
                  )}

                  <Button
                    onClick={handleOptimize}
                    disabled={!resumeText.trim() || isOptimizing}
                    className="w-full gap-2 text-base py-6 font-semibold hover-lift"
                    style={{
                      backgroundColor: resumeText.trim() && !isOptimizing ? COLORS.gold : COLORS.darkElevated,
                      color: resumeText.trim() && !isOptimizing ? COLORS.darkBg : COLORS.textMuted,
                      borderRadius: '6px',
                      border: resumeText.trim() && !isOptimizing ? 'none' : `1px solid ${COLORS.border}`,
                    }}
                  >
                    {isOptimizing ? (
                      <>正在优化中...</>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        开始优化简历
                      </>
                    )}
                  </Button>

                  {status === 'error' && (
                    <p className="text-center text-sm" style={{ color: '#ef4444' }}>
                      优化失败，请检查 API 配置或重试
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="glass-card" style={{ borderRadius: '12px' }}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: COLORS.gold }} />
                    <div>
                      <h4 className="font-semibold mb-3 text-white">优化建议</h4>
                      <ul className="text-sm space-y-2.5" style={{ color: COLORS.textMuted }}>
                        <li className="flex items-center gap-2">
                          <span style={{ color: COLORS.gold }}>•</span> 上传 PDF 格式可获得最佳解析效果
                        </li>
                        <li className="flex items-center gap-2">
                          <span style={{ color: COLORS.gold }}>•</span> 提供目标岗位 JD 可获得更精准的匹配
                        </li>
                        <li className="flex items-center gap-2">
                          <span style={{ color: COLORS.gold }}>•</span> STAR 法则让你的经历更具说服力
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
                    className="glass-card hover-lift"
                    style={{
                      borderRadius: '12px',
                      animation: 'slide-in-right 0.5s ease-out',
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${COLORS.success}20` }}
                        >
                          <CheckCircle2 className="h-5 w-5" style={{ color: COLORS.success }} />
                        </div>
                        <div>
                          <span className="font-semibold text-white">优化完成！</span>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>AI 已基于 STAR 法则完成优化</p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCompare(true)}
                        className="w-full gap-2"
                        style={{
                          borderColor: `${COLORS.gold}50`,
                          color: COLORS.gold,
                          borderRadius: '4px',
                          backgroundColor: 'transparent',
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        对比预览
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Download Options */}
                  <Card
                    className="glass-card hover-lift"
                    style={{
                      borderRadius: '12px',
                      animation: 'slide-in-right 0.5s ease-out 0.1s both',
                    }}
                  >
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Download className="h-4 w-4" style={{ color: COLORS.gold }} />
                        下载优化结果
                      </h4>
                      <DownloadOptions resume={optimizedResume} />
                    </CardContent>
                  </Card>

                  {/* Tabbed Section - Cover Letter & Interview Questions */}
                  <Card
                    className="glass-card"
                    style={{
                      borderRadius: '12px',
                      animation: 'slide-in-right 0.5s ease-out 0.2s both',
                    }}
                  >
                    {/* Tab Header */}
                    <div
                      className="flex border-b"
                      style={{ borderColor: COLORS.border }}
                    >
                      <button
                        onClick={() => setActiveTab('cover')}
                        className="flex-1 px-4 py-3 text-sm font-medium transition-all relative"
                        style={{
                          color: activeTab === 'cover' ? COLORS.gold : COLORS.textMuted,
                        }}
                      >
                        求职信
                        {activeTab === 'cover' && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ backgroundColor: COLORS.gold }}
                          />
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab('interview')}
                        className="flex-1 px-4 py-3 text-sm font-medium transition-all relative"
                        style={{
                          color: activeTab === 'interview' ? COLORS.gold : COLORS.textMuted,
                        }}
                      >
                        面试问题
                        {activeTab === 'interview' && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ backgroundColor: COLORS.gold }}
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
                /* Empty State for Results Column */
                <Card
                  className="glass-card h-full min-h-96 flex items-center justify-center"
                  style={{ borderRadius: '12px', border: `1px dashed ${COLORS.border}` }}
                >
                  <CardContent className="text-center py-12">
                    <div
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS.gold}10` }}
                    >
                      <Gem className="h-8 w-8" style={{ color: COLORS.gold }} />
                    </div>
                    <h4 className="font-semibold text-white mb-2">等待优化结果</h4>
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
      <footer className="py-10 border-t" style={{ backgroundColor: COLORS.darkSurface, borderColor: COLORS.border }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  borderRadius: '4px',
                }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-semibold text-white">
                ResumeCraft
              </span>
            </div>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              AI 简历优化平台 · 基于智谱 GLM-4.7 模型
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
