import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = session.user

  const tierLabels = {
    FREE: { text: '免费版', color: 'bg-gray-100 text-gray-800' },
    PRO: { text: 'Pro', color: 'bg-violet-100 text-violet-800' },
    PREMIUM: { text: 'Premium', color: 'bg-pink-100 text-pink-800' },
    ENTERPRISE: { text: 'Enterprise', color: 'bg-amber-100 text-amber-800' }
  }

  const tier = tierLabels[user.subscriptionTier] || tierLabels.FREE

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600" />
              <span className="font-bold text-lg">ResumeOptimizer</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Link href="/api/auth/signout">
                <Button variant="ghost" size="sm">退出</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            欢迎回来，{user.name || '用户'}
          </h1>
          <p className="text-gray-600 mt-1">这里是你的个人中心</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Subscription Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                当前套餐
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge className={tier.color}>
                  {tier.text}
                </Badge>
                {user.subscriptionTier === 'FREE' && (
                  <Link href="/pricing">
                    <Button size="sm" className="bg-gradient-to-r from-violet-600 to-pink-600">
                      升级
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usage Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                本月使用
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{user.usageCount}</p>
                  <p className="text-sm text-gray-500">
                    {user.subscriptionTier === 'FREE' ? '/ 3 次' : '/ 无限'}
                  </p>
                </div>
                {user.subscriptionTier === 'FREE' && (
                  <p className="text-xs text-gray-500">
                    {3 - user.usageCount} 次剩余
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                快速操作
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600">
                  新建优化
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>最近优化</CardTitle>
            <CardDescription>你最近的简历优化记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <p>暂无优化记录</p>
              <Link href="/" className="text-violet-600 hover:underline mt-2 inline-block">
                开始第一次优化
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans (if FREE) */}
        {user.subscriptionTier === 'FREE' && (
          <Card className="mt-8 border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50">
            <CardHeader>
              <CardTitle className="text-violet-900">升级到 Pro</CardTitle>
              <CardDescription className="text-violet-700">
                解锁无限优化和更多高级功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/80 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">Pro - ¥49/月</h4>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>无限简历优化</li>
                    <li>PDF/Word 下载</li>
                    <li>求职信生成</li>
                    <li>历史记录保存</li>
                  </ul>
                </div>
                <div className="bg-white/80 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">Premium - ¥99/月</h4>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>Pro 全部功能</li>
                    <li>面试问题生成</li>
                    <li>简历诊断报告</li>
                    <li>多模板选择</li>
                  </ul>
                </div>
              </div>
              <Link href="/pricing">
                <Button className="w-full mt-4 bg-gradient-to-r from-violet-600 to-pink-600">
                  查看全部方案
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
