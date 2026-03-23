import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Coins, Crown, CheckCircle2 } from 'lucide-react'
import { getCreditInfo } from '@/lib/credit'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>
}) {
  const session = await getServerSession(authOptions)
  const params = await searchParams

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = session.user
  const creditInfo = await getCreditInfo(user.id)
  const showPaymentSuccess = params.payment === 'success'

  // Check if it's a new month for quota reset
  const now = new Date()
  const resetDate = new Date(user.freeResetDate)
  const isNewMonth = now.getMonth() !== resetDate.getMonth() ||
                     now.getFullYear() !== resetDate.getFullYear()
  const freeQuotaRemaining = isNewMonth ? 1 : Math.max(0, 1 - user.freeUsageCount)

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
              {/* Credit Balance */}
              {user.isLifetime ? (
                <Badge className="bg-gradient-to-r from-violet-600 to-pink-600 text-white gap-1">
                  <Crown className="w-3 h-3" />
                  终身会员
                </Badge>
              ) : (
                <Link
                  href="/dashboard/credits"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-muted hover:text-foreground h-7 px-3 text-[0.8rem]"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-medium">{user.credits}</span>
                  <span className="text-gray-500">积分</span>
                </Link>
              )}
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
        {/* Payment Success Banner */}
        {showPaymentSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">支付成功！</p>
              <p className="text-sm text-green-700">
                {creditInfo?.isLifetime
                  ? '恭喜成为终身会员，所有功能已解锁'
                  : `积分已到账，当前余额：${creditInfo?.credits} 积分`}
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            欢迎回来，{user.name || '用户'}
          </h1>
          <p className="text-gray-600 mt-1">这里是你的个人中心</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Lifetime Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                会员状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.isLifetime ? (
                <Badge className="bg-gradient-to-r from-violet-600 to-pink-600 text-white gap-1">
                  <Crown className="w-3 h-3" />
                  终身会员
                </Badge>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">普通用户</p>
                  <Link href="/pricing" className="text-sm text-violet-600 hover:underline">
                    升级 →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credits Card (only for non-lifetime) */}
          {!user.isLifetime && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  当前积分
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{user.credits}</p>
                <Link href="/pricing" className="text-sm text-violet-600 hover:underline">
                  充值积分 →
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Free Quota Card (only for non-lifetime) */}
          {!user.isLifetime && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">
                  本月免费额度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {freeQuotaRemaining}
                  <span className="text-sm font-normal text-gray-500 ml-1">/ 1 次</span>
                </p>
                {freeQuotaRemaining === 0 && (
                  <p className="text-xs text-orange-500">本月已用完</p>
                )}
              </CardContent>
            </Card>
          )}

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

        {/* Upgrade CTA (if not lifetime) */}
        {!user.isLifetime && (
          <Card className="mt-8 border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50">
            <CardHeader>
              <CardTitle className="text-violet-900 flex items-center gap-2">
                <Crown className="w-5 h-5" />
                升级到终身会员
              </CardTitle>
              <CardDescription className="text-violet-700">
                一次性 ¥99，终身解锁全部功能，不消耗积分
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <p className="font-medium text-gray-900">无限简历优化</p>
                  <p className="text-sm text-gray-500">不消耗积分</p>
                </div>
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <p className="font-medium text-gray-900">全部高级功能</p>
                  <p className="text-sm text-gray-500">ATS/面试/求职信</p>
                </div>
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <p className="font-medium text-gray-900">终身模板更新</p>
                  <p className="text-sm text-gray-500">持续迭代</p>
                </div>
              </div>
              <Link href="/pricing">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600">
                  立即购买终身会员 - ¥99
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
