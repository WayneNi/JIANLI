'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Sparkles } from 'lucide-react'
import { CREDIT_PACKAGES_DISPLAY, LIFETIME_DISPLAY } from '@/lib/pricing-packages'

interface Package {
  id: string
  name: string
  price: number
  credits?: number
  bonus?: number
  features?: string[]
  highlight?: boolean
  badge?: string
}

interface PricingCardProps {
  pkg: Package
  type: 'credit' | 'lifetime'
  isAuthenticated: boolean
}

export function PricingCard({ pkg, type, isAuthenticated }: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push('/auth/signin?callbackUrl=/pricing')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      })

      const data = await res.json()

      if (data.url) {
        if (data.mock) {
          // Mock mode - redirect to mock checkout
          router.push(data.url)
        } else {
          window.location.href = data.url
        }
      } else {
        alert('创建订单失败，请重试')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('创建订单失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(0)
  }

  return (
    <div
      className={`relative rounded-2xl border p-6 ${
        pkg.highlight
          ? 'border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 shadow-lg'
          : 'border-gray-200 bg-white'
      }`}
    >
      {pkg.badge && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-pink-600 text-white">
          {pkg.badge}
        </Badge>
      )}

      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
        <div className="mt-2 flex items-baseline justify-center">
          <span className="text-3xl font-bold text-gray-900">¥{formatPrice(pkg.price)}</span>
        </div>
        {pkg.credits && (
          <p className="mt-1 text-sm text-gray-600">
            {pkg.credits} 积分
            {pkg.bonus ? (
              <span className="text-green-600"> + {pkg.bonus} bonus</span>
            ) : null}
          </p>
        )}
      </div>

      {pkg.features && (
        <ul className="space-y-2 mb-6">
          {pkg.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      <Button
        onClick={handlePurchase}
        disabled={loading}
        className={`w-full ${
          pkg.highlight
            ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white'
            : ''
        }`}
        variant={pkg.highlight ? 'default' : 'outline'}
      >
        {loading ? '处理中...' : type === 'lifetime' ? '立即购买' : '充值'}
      </Button>
    </div>
  )
}

// Free tier card
export function FreeTierCard({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">免费试用</h3>
        <div className="mt-2 flex items-baseline justify-center">
          <span className="text-3xl font-bold text-gray-900">¥0</span>
        </div>
        <p className="mt-1 text-sm text-gray-600">0 积分</p>
      </div>

      <ul className="space-y-2 mb-6">
        <li className="flex items-center gap-2 text-sm text-gray-600">
          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          每月 1 次简历优化（免费）
        </li>
        <li className="flex items-center gap-2 text-sm text-gray-600">
          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          ATS 优化 5 积分/次
        </li>
        <li className="flex items-center gap-2 text-sm text-gray-600">
          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          面试问题 5 积分/次
        </li>
        <li className="flex items-center gap-2 text-sm text-gray-600">
          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          求职信 5 积分/次
        </li>
      </ul>

      {isAuthenticated ? (
        <Link href="/">
          <Button variant="outline" className="w-full">
            开始使用
          </Button>
        </Link>
      ) : (
        <Link href="/auth/signin?callbackUrl=/">
          <Button variant="outline" className="w-full">
            登录后使用
          </Button>
        </Link>
      )}
    </div>
  )
}

export { CREDIT_PACKAGES_DISPLAY, LIFETIME_DISPLAY }
