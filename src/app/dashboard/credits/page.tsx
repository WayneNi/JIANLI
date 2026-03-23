import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CREDIT_PACKAGES_DISPLAY, LIFETIME_DISPLAY } from '@/lib/pricing-packages'
import { Coins, Crown, Calendar, History, ArrowLeft } from 'lucide-react'

export default async function CreditsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/dashboard/credits')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      credits: true,
      isLifetime: true,
      freeUsageCount: true,
      freeResetDate: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  // Check if free quota should reset
  const now = new Date()
  const resetDate = new Date(user.freeResetDate)
  const isNewMonth =
    now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()
  const freeQuotaRemaining = isNewMonth ? 1 : Math.max(0, 1 - user.freeUsageCount)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  返回
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600" />
                <span className="font-bold text-lg">ResumeOptimizer</span>
              </div>
            </div>
            <Link href="/api/auth/signout">
              <Button variant="ghost" size="sm">
                退出
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">积分管理</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Credits */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Coins className="w-4 h-4" />
                当前积分
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.isLifetime ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-gradient-to-r from-violet-600 to-pink-600 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    终身会员
                  </Badge>
                  <span className="text-sm text-gray-500">无限使用</span>
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-gray-900">{user.credits}</p>
                  <p className="text-sm text-gray-500 mt-1">积分</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Free Quota */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                本月免费额度
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.isLifetime ? (
                <p className="text-sm text-gray-500">终身会员无需免费额度</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {freeQuotaRemaining}
                    <span className="text-sm font-normal text-gray-500 ml-1">/ 1 次</span>
                  </p>
                  {freeQuotaRemaining === 0 && (
                    <p className="text-sm text-orange-500 mt-1">本月免费额度已用完</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">会员状态</CardTitle>
            </CardHeader>
            <CardContent>
              {user.isLifetime ? (
                <Badge className="bg-gradient-to-r from-violet-600 to-pink-600 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  终身会员
                </Badge>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">普通用户</p>
                  <Link href="/pricing" className="text-sm text-violet-600 hover:underline">
                    升级到终身会员 →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Recharge */}
        {!user.isLifetime && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">快速充值</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CREDIT_PACKAGES_DISPLAY.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-xl border p-4 ${
                    pkg.highlight ? 'border-violet-200 bg-violet-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ¥{(pkg.price / 100).toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {pkg.credits} 积分{pkg.bonus ? ` + ${pkg.bonus}` : ''}
                    </p>
                    <Link href="/pricing" className="block mt-3">
                      <Button
                        size="sm"
                        className={
                          pkg.highlight
                            ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700'
                            : ''
                        }
                      >
                        充值
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purchase History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              充值记录
            </CardTitle>
            <CardDescription>你的积分充值和购买记录</CardDescription>
          </CardHeader>
          <CardContent>
            {user.payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暂无充值记录</p>
                <Link href="/pricing" className="text-violet-600 hover:underline mt-2 inline-block">
                  前往充值
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {user.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.type === 'LIFETIME' ? '终身会员' : '积分充值'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ¥{(payment.amount / 100).toFixed(2)}
                      </p>
                      {payment.credits && (
                        <p className="text-sm text-green-600">+{payment.credits} 积分</p>
                      )}
                      <Badge
                        variant={
                          payment.status === 'COMPLETED'
                            ? 'default'
                            : payment.status === 'PENDING'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="mt-1"
                      >
                        {payment.status === 'COMPLETED'
                          ? '已完成'
                          : payment.status === 'PENDING'
                          ? '处理中'
                          : '失败'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
