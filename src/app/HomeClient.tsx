"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { signOut, signIn } from 'next-auth/react';
import { Sparkles, ArrowRight, CheckCircle2, TrendingUp, Eye, RefreshCw, X, Wand2, Coins, Crown, LogOut, Menu, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

import { UploadZone } from '@/components/resume/UploadZone';
import { PreviewPanel } from '@/components/resume/PreviewPanel';
import { DownloadOptions } from '@/components/resume/DownloadOptions';
import { CompareView } from '@/components/resume/CompareView';
import { CoverLetterGenerator } from '@/components/resume/CoverLetter';
import { InterviewQuestionsGenerator } from '@/components/resume/InterviewQuestions';
import { JobDescriptionInput } from '@/components/resume/JobDescriptionInput';

import type { OptimizeStatus, StreamChunk, OptimizedResume } from '@/types/resume';

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  credits?: number;
  isLifetime?: boolean;
}

interface HomeClientProps {
  user?: User | null;
}

export function HomeClient({ user }: HomeClientProps) {
  const isAuthenticated = !!user;

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Resume optimizer state
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [status, setStatus] = useState<OptimizeStatus>('idle');
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [streamData, setStreamData] = useState<StreamChunk[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const result = await signIn('credentials', {
          email: authEmail,
          password: authPassword,
          redirect: false,
        });

        if (result?.error) {
          setAuthError(result.error);
        } else {
          setShowAuthModal(false);
          window.location.reload();
        }
      } else {
        // Register
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword, name: authName }),
        });

        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || '注册失败');
        } else {
          // Auto login after register
          const result = await signIn('credentials', {
            email: authEmail,
            password: authPassword,
            redirect: false,
          });
          if (result?.error) {
            setAuthError('注册成功，请手动登录');
            setAuthMode('login');
          } else {
            setShowAuthModal(false);
            window.location.reload();
          }
        }
      }
    } catch {
      setAuthError('操作失败，请稍后重试');
    } finally {
      setAuthLoading(false);
    }
  }, [authMode, authEmail, authPassword, authName]);

  const openLogin = () => {
    setAuthMode('login');
    setAuthError('');
    setShowAuthModal(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setAuthError('');
    setShowAuthModal(true);
  };

  const handleFileSelect = useCallback((file: File, text: string) => {
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

  // Not authenticated - Landing Page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden">
        {/* Ambient Background */}
        <canvas
          ref={canvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none opacity-30"
        />

        {/* Navigation */}
        <nav className="relative z-10 border-b border-[#2D2D3A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">ResumeOptimizer</span>
              </div>

              <div className="hidden md:flex items-center gap-4">
                <button onClick={openLogin} className="text-sm text-gray-300 hover:text-white transition-colors">
                  登录
                </button>
                <Button onClick={openRegister} size="sm" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-90">
                  <Plus className="w-4 h-4 mr-1" />
                  免费开始
                </Button>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden relative z-10 bg-[#12121A] border-b border-[#2D2D3A] px-4 py-4 space-y-3">
            <button onClick={openLogin} className="block w-full text-left py-2 text-gray-300 hover:text-white">
              登录
            </button>
            <Button onClick={openRegister} className="w-full bg-gradient-to-r from-violet-600 to-pink-600">
              免费开始
            </Button>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-6 border-violet-500/50 text-violet-400 bg-violet-500/10">
                <Sparkles className="w-3 h-3 mr-1" />
                基于 GLM-4.7 / MiniMax AI
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                <span className="text-white">用 </span>
                <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                  STAR法则
                </span>
                <br />
                <span className="text-white">智能优化简历</span>
              </h1>

              <p className="text-lg text-gray-400 mb-8 max-w-lg">
                上传简历，AI 将基于 STAR 法则自动重构你的工作经历，添加量化数据，提升面试机会。每月免费 1 次，积分制低至 ¥0.1/次。
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={openRegister} size="lg" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-90 text-lg px-8">
                  免费优化简历
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button onClick={openLogin} variant="outline" size="lg" className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10 text-lg px-8">
                  已有账号登录
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-[#2D2D3A]">
                <div>
                  <div className="text-2xl font-bold text-white">10,000+</div>
                  <div className="text-sm text-gray-500">用户优化</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">95%</div>
                  <div className="text-sm text-gray-500">面试率提升</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">4.9★</div>
                  <div className="text-sm text-gray-500">用户评分</div>
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-pink-500/20 blur-3xl" />

              <div className="relative grid gap-4">
                {[
                  {
                    icon: <Wand2 className="w-5 h-5" />,
                    title: 'STAR 法则重构',
                    desc: '将模糊描述转化为情境+任务+行动+结果',
                    color: 'violet',
                  },
                  {
                    icon: <TrendingUp className="w-5 h-5" />,
                    title: '关键词匹配',
                    desc: '针对 JD 自动优化，ATS 分数提升 40%',
                    color: 'pink',
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5" />,
                    title: '量化数据',
                    desc: 'AI 自动补充或建议合理的量化指标',
                    color: 'violet',
                  },
                  {
                    icon: <Sparkles className="w-5 h-5" />,
                    title: '专业语气',
                    desc: '使用主动语态和专业动词，提升竞争力',
                    color: 'pink',
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="bg-[#12121A]/80 backdrop-blur border border-[#2D2D3A] rounded-xl p-4 flex items-start gap-4 hover:border-violet-500/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      feature.color === 'violet' ? 'bg-violet-500/20 text-violet-400' : 'bg-pink-500/20 text-pink-400'
                    }`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="relative z-10 py-20 border-t border-[#2D2D3A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">简单透明的定价</h2>
              <p className="text-gray-400">按需充值，无隐藏费用</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Free */}
              <div className="bg-[#12121A] border border-[#2D2D3A] rounded-2xl p-6">
                <div className="text-sm text-gray-400 mb-2">免费</div>
                <div className="text-3xl font-bold text-white mb-1">¥0</div>
                <div className="text-sm text-gray-500 mb-6">每月</div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    每月 1 次简历优化
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ATS 优化
                  </li>
                  <li className="flex items-center gap-2 text-gray-500">
                    <X className="w-4 h-4" />
                    面试问题生成
                  </li>
                </ul>
                <Button onClick={openRegister} variant="outline" className="w-full mt-6 border-violet-500/50">
                  立即注册
                </Button>
              </div>

              {/* Credit Package */}
              <div className="bg-[#12121A] border border-violet-500/50 rounded-2xl p-6 relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs">
                  推荐
                </Badge>
                <div className="text-sm text-violet-400 mb-2">积分充值</div>
                <div className="text-3xl font-bold text-white mb-1">¥10</div>
                <div className="text-sm text-gray-500 mb-1">体验包 / 100 积分</div>
                <div className="text-xs text-gray-500 mb-6">低至 ¥0.1/次</div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    简历优化 10 积分/次
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ATS 优化 5 积分/次
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    面试问题 5 积分/次
                  </li>
                </ul>
                <Button onClick={openRegister} className="w-full mt-6 bg-gradient-to-r from-violet-600 to-pink-600">
                  充值积分
                </Button>
              </div>

              {/* Lifetime */}
              <div className="bg-gradient-to-b from-amber-900/20 to-[#12121A] border border-amber-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-400">终身会员</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">¥99</div>
                <div className="text-sm text-gray-500 mb-6">一次买断</div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    无限次简历优化
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    全部高级功能
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    终身模板更新
                  </li>
                </ul>
                <Button onClick={openRegister} variant="outline" className="w-full mt-6 border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                  升级会员
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
            <div className="relative w-full max-w-md bg-[#12121A] border border-[#2D2D3A] rounded-2xl p-6">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {authMode === 'login' ? '登录 ResumeOptimizer' : '创建账号'}
                </h2>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {authError && (
                  <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                    {authError}
                  </div>
                )}

                {authMode === 'register' && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">姓名</label>
                    <Input
                      placeholder="你的姓名（可选）"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="bg-[#0A0A0F] border-[#2D2D3A] text-white"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">邮箱</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="bg-[#0A0A0F] border-[#2D2D3A] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">密码</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    className="bg-[#0A0A0F] border-[#2D2D3A] text-white"
                  />
                </div>

                <Button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-violet-600 to-pink-600">
                  {authLoading ? '处理中...' : authMode === 'login' ? '登录' : '注册'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#2D2D3A]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#12121A] px-2 text-gray-500">或</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-[#2D2D3A] hover:bg-[#1A1A24]"
                onClick={() => signIn('google', { callbackUrl: '/' })}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                使用 Google 登录
              </Button>

              <p className="mt-6 text-center text-sm text-gray-400">
                {authMode === 'login' ? (
                  <>还没有账号？<button onClick={() => setAuthMode('register')} className="text-violet-400 hover:underline">立即注册</button></>
                ) : (
                  <>已有账号？<button onClick={() => setAuthMode('login')} className="text-violet-400 hover:underline">登录</button></>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="relative z-10 border-t border-[#2D2D3A] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-pink-500" />
              <span>ResumeOptimizer © 2024</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/pricing" className="hover:text-gray-300 transition-colors">定价</Link>
              <Link href="/auth/privacy" className="hover:text-gray-300 transition-colors">隐私政策</Link>
              <Link href="/auth/terms" className="hover:text-gray-300 transition-colors">服务条款</Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated - Show Resume Optimizer Tool
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">ResumeOptimizer</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <span className="text-gray-600 hidden sm:inline">{user?.email}</span>
              </div>
              <Link
                href="/dashboard/credits"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-muted hover:text-foreground h-7 px-3 text-[0.8rem]"
              >
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">积分管理</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">简历优化</h1>
          <p className="text-gray-600">基于 STAR 法则，智能优化简历内容</p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <UploadZone onFileSelect={handleFileSelect} isLoading={isOptimizing} />
        </div>

        {/* Job Description (Optional) */}
        {resumeText && (
          <div className="mb-8">
            <JobDescriptionInput
              value={jobDescription}
              onChange={setJobDescription}
            />
          </div>
        )}

        {/* Optimize Button */}
        {resumeText && (
          <div className="mb-8 flex gap-4">
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing}
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-90"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  优化中...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  开始优化
                </>
              )}
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {status !== 'idle' && status !== 'completed' && (
          <Card className="mb-8">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                {isOptimizing && <RefreshCw className="w-5 h-5 animate-spin text-violet-600" />}
                <span className="text-gray-700">
                  {status === 'parsing' && '正在解析简历...'}
                  {status === 'analyzing' && '正在分析经历描述...'}
                  {status === 'optimizing' && '正在应用 STAR 法则优化...'}
                  {status === 'formatting' && '正在整理输出格式...'}
                  {status === 'error' && '优化失败，请重试'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compare View */}
        {showCompare && optimizedResume && (
          <CompareView
            originalText={resumeText}
            optimizedResume={optimizedResume}
            onClose={() => setShowCompare(false)}
          />
        )}

        {/* Results Section */}
        {optimizedResume && (
          <div className="space-y-8">
            {/* Success Banner */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">优化完成！</p>
                  <p className="text-sm text-green-700">基于 STAR 法则重构，点击下载或预览</p>
                </div>
              </CardContent>
            </Card>

            {/* Preview Panel */}
            <PreviewPanel
              isOptimizing={isOptimizing}
              streamData={streamData}
              status={status}
            />

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => setShowCompare(true)}
                variant="outline"
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                对比原简历
              </Button>
              <DownloadOptions resume={optimizedResume} />
            </div>

            {/* Feature Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-8">
                <button className="pb-3 text-sm font-medium text-violet-600 border-b-2 border-violet-600">
                  优化结果
                </button>
              </div>
            </div>

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
          </div>
        )}
      </main>
    </div>
  );
}
