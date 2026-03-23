'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Coins, Crown, Loader2, XCircle } from 'lucide-react'
import { getPackage, CREDIT_PACKAGES } from '@/lib/stripe-products'

type Status = 'loading' | 'confirming' | 'success' | 'error'

function MockCheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const packageId = searchParams.get('package')
  const userId = searchParams.get('userId')

  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string>('')
  const [countdown, setCountdown] = useState(3)

  const pkg = packageId ? getPackage(packageId) : null
  const isLifetime = packageId === 'lifetime'
  const creditPkg = !isLifetime && pkg ? pkg as typeof CREDIT_PACKAGES.CREDIT_10 | typeof CREDIT_PACKAGES.CREDIT_20 | typeof CREDIT_PACKAGES.CREDIT_50 : null

  useEffect(() => {
    if (!packageId || !userId) {
      setStatus('error')
      setError('缺少必要的参数')
      return
    }

    if (!pkg) {
      setStatus('error')
      setError('未找到对应的套餐')
      return
    }

    setStatus('confirming')
  }, [packageId, userId, pkg])

  const handleConfirm = async () => {
    setStatus('confirming')

    try {
      const response = await fetch(`/api/webhooks/stripe?userId=${userId}&package=${packageId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '支付处理失败')
      }

      setStatus('success')

      // Start countdown to redirect
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            router.push('/dashboard?payment=success')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '支付处理失败')
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
            <p className="text-gray-600">正在加载支付信息...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl">支付页面错误</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push('/pricing')} variant="outline">
              返回定价页
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-700">支付成功！</CardTitle>
            <CardDescription>
              {isLifetime ? '恭喜成为终身会员' : `已获得 ${creditPkg?.credits} 积分`}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              {countdown} 秒后自动跳转到个人中心...
            </p>
            <Button onClick={() => router.push('/dashboard?payment=success')} className="w-full">
              立即前往
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Confirming state (default)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>确认支付</CardTitle>
            <Badge variant="outline" className="text-violet-600 border-violet-600">
              模拟支付
            </Badge>
          </div>
          <CardDescription>请确认您的购买信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Package Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">套餐名称</span>
              <div className="flex items-center gap-2">
                {isLifetime ? (
                  <>
                    <Crown className="w-4 h-4 text-violet-600" />
                    <span className="font-medium">{pkg?.name}</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">{pkg?.name}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">{isLifetime ? '会员类型' : '获得积分'}</span>
              <span className="font-medium">
                {isLifetime ? '终身会员' : `${creditPkg?.credits} 积分`}
                {creditPkg?.bonus ? (
                  <span className="text-green-600 text-sm ml-1">+{creditPkg.bonus} bonus</span>
                ) : null}
              </span>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-gray-600">支付金额</span>
              <span className="text-xl font-bold text-violet-600">
                ¥{((pkg?.price ?? 0) / 100).toFixed(0)}
              </span>
            </div>
          </div>

          {/* Mock Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>模拟支付模式：</strong>点击确认后将直接完成支付，无需真实付款。
              此模式仅用于测试。
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/pricing')}
            >
              取消
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-90"
              onClick={handleConfirm}
            >
              确认支付
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
          <p className="text-gray-600">正在加载支付信息...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MockCheckoutPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MockCheckoutContent />
    </Suspense>
  )
}
