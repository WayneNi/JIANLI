import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PricingCard, FreeTierCard } from '@/components/PricingCard'
import { CREDIT_PACKAGES_DISPLAY, LIFETIME_DISPLAY } from '@/lib/pricing-packages'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Zap, Crown, Gift } from 'lucide-react'

export default async function PricingPage() {
  const session = await getServerSession(authOptions)
  const isAuthenticated = !!session?.user

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
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
            {isAuthenticated && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  个人中心
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            选择适合你的方案
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            简历优化低频使用场景，更适合积分制按需消费。一次性充值，长期有效。
          </p>
        </div>

        {/* Pricing Cards */}
        <Tabs defaultValue="packages" className="mb-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="free" className="gap-2">
              <Gift className="w-4 h-4" />
              免费试用
            </TabsTrigger>
            <TabsTrigger value="packages" className="gap-2">
              <Zap className="w-4 h-4" />
              积分充值
            </TabsTrigger>
            <TabsTrigger value="lifetime" className="gap-2">
              <Crown className="w-4 h-4" />
              终身会员
            </TabsTrigger>
          </TabsList>

          {/* Free Tier */}
          <TabsContent value="free">
            <div className="max-w-sm mx-auto">
              <FreeTierCard isAuthenticated={isAuthenticated} />
            </div>
          </TabsContent>

          {/* Credit Packages */}
          <TabsContent value="packages">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CREDIT_PACKAGES_DISPLAY.map((pkg) => (
                <PricingCard
                  key={pkg.id}
                  pkg={pkg}
                  type="credit"
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </TabsContent>

          {/* Lifetime Membership */}
          <TabsContent value="lifetime">
            <div className="max-w-md mx-auto">
              <div className="relative rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 p-8">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    最划算的选择
                  </span>
                </div>

                <div className="text-center mb-6">
                  <Crown className="w-12 h-12 mx-auto text-violet-600 mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900">{LIFETIME_DISPLAY.name}</h3>
                  <div className="mt-2 flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">¥99</span>
                    <span className="text-lg text-gray-500 ml-1">/ 终身</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {LIFETIME_DISPLAY.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700">
                      <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <PricingCard
                  pkg={{
                    id: LIFETIME_DISPLAY.id,
                    name: LIFETIME_DISPLAY.name,
                    price: LIFETIME_DISPLAY.price,
                    highlight: true,
                  }}
                  type="lifetime"
                  isAuthenticated={isAuthenticated}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Pricing Table */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            功能积分消耗
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">功能</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">积分消耗</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">简历优化 (STAR法则)</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">10 积分/次</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">ATS 优化</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">5 积分/次</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">面试问题生成</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">5 积分/次</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">求职信生成</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">5 积分/次</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            常见问题
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">积分会过期吗？</h3>
              <p className="text-sm text-gray-600">
                积分永久有效，购买后可在任意时间使用。没有月费或年费。
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">终身会员包含哪些功能？</h3>
              <p className="text-sm text-gray-600">
                终身会员可无限使用所有功能，包括简历优化、ATS优化、面试问题生成和求职信生成，完全不消耗积分。
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">免费额度如何重置？</h3>
              <p className="text-sm text-gray-600">
                每月 1 次免费简历优化额度在次月 1 日自动重置，不消耗积分。
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">如何充值积分？</h3>
              <p className="text-sm text-gray-600">
                登录后选择积分充值套餐，通过 Stripe 安全支付即可。支付成功后积分即时到账。
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 ResumeOptimizer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
