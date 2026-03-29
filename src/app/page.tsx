import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Sparkles, TrendingUp, Target, Zap, Shield, CheckCircle2, Star } from 'lucide-react'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const isAuthenticated = !!session?.user

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">ResumeCraft</span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                功能特点
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                使用流程
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                定价
              </Link>
            </nav>

            {/* Auth */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="text-gray-600">
                      个人中心
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shadow-sm"
                    >
                      开始优化
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="text-gray-600">
                      登录
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shadow-sm"
                    >
                      免费试用
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-36 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-pink-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-violet-200 to-pink-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-violet-200 to-pink-200 rounded-full blur-3xl opacity-20" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-violet-200 shadow-sm mb-8">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-medium text-gray-700">AI 智能驱动 · STAR 法则优化</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              让简历从{' '}
              <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                平淡
              </span>
              {' '}到{' '}
              <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                出色
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto">
              基于 STAR 法则智能重构你的工作经历，量化成果数据，提升面试机会率
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isAuthenticated ? "/dashboard" : "/auth/register"}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shadow-lg shadow-violet-200"
                >
                  {isAuthenticated ? "进入控制台" : "免费开始"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  了解详情
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>无需信用卡</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>永久免费额度</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>隐私保护</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 md:py-10 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { value: '50,000+', label: '用户信赖' },
              { value: '3x', label: '面试机会提升' },
              { value: '4.9/5', label: '用户评分' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              为什么选择 ResumeCraft
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              专业团队打造，让你的简历更具竞争力
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {[
              {
                icon: <Target className="w-6 h-6" />,
                title: 'STAR 法则重构',
                description: '将模糊的工作描述转化为具体的情境、任务、行动和结果，让经历更具说服力',
                color: 'violet',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: '智能量化分析',
                description: '自动识别并补充可量化的成果数据，用数字证明你的能力',
                color: 'pink',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'JD 关键词匹配',
                description: '针对目标岗位的 JD 进行优化，确保简历与招聘需求高度匹配',
                color: 'violet',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg hover:border-violet-100 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                    feature.color === 'violet'
                      ? 'bg-violet-50 text-violet-600 group-hover:bg-violet-100'
                      : 'bg-pink-50 text-pink-600 group-hover:bg-pink-100'
                  } transition-colors`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-gradient-to-br from-violet-50 to-pink-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              三步完成简历优化
            </h2>
            <p className="text-lg text-gray-600">
              简单易用，快速提升简历质量
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {[
              {
                step: '01',
                title: '上传简历',
                description: '支持 PDF 和 Word 格式，智能解析内容',
              },
              {
                step: '02',
                title: 'AI 智能分析',
                description: '基于 STAR 法则自动优化，量化成果数据',
              },
              {
                step: '03',
                title: '下载结果',
                description: '获取专业级优化简历，支持多格式导出',
              },
            ].map((item, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-8 shadow-sm">
                <div className="absolute -top-4 left-8 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">{item.step}</span>
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-violet-600 to-pink-600 rounded-3xl p-12 md:p-16 text-white relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full opacity-5 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full opacity-5 blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                准备好让你的简历脱颖而出了吗？
              </h2>
              <p className="text-lg text-violet-100 mb-8 max-w-xl mx-auto">
                立即开始，让招聘官眼前一亮
              </p>
              <Link href={isAuthenticated ? "/dashboard" : "/auth/register"}>
                <Button
                  size="lg"
                  className="bg-white text-violet-700 hover:bg-violet-50 shadow-lg gap-2"
                >
                  {isAuthenticated ? "进入控制台" : "免费开始优化"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">ResumeCraft</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/pricing" className="hover:text-gray-900 transition-colors">
                定价
              </Link>
              <Link href="/auth/signin" className="hover:text-gray-900 transition-colors">
                登录
              </Link>
              <Link href="/auth/register" className="hover:text-gray-900 transition-colors">
                注册
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-400">
              © 2024 ResumeCraft. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
