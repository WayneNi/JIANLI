'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Crown, Coins } from 'lucide-react'

interface CreditInfo {
  credits: number
  isLifetime: boolean
  freeQuotaUsed: boolean
  freeQuotaRemaining: number
}

export function CreditBalance() {
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCreditInfo()
  }, [])

  const fetchCreditInfo = async () => {
    try {
      const res = await fetch('/api/credits')
      if (res.ok) {
        const data = await res.json()
        setCreditInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch credit info:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!creditInfo) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      {creditInfo.isLifetime ? (
        <Badge className="bg-gradient-to-r from-violet-600 to-pink-600 text-white gap-1">
          <Crown className="w-3 h-3" />
          终身会员
        </Badge>
      ) : (
        <Link href="/dashboard/credits">
          <Button variant="outline" size="sm" className="gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-medium">{creditInfo.credits}</span>
            <span className="text-gray-500">积分</span>
          </Button>
        </Link>
      )}

      {!creditInfo.isLifetime && !creditInfo.freeQuotaUsed && (
        <span className="text-xs text-green-600">
          本月免费优化 {creditInfo.freeQuotaRemaining} 次
        </span>
      )}
    </div>
  )
}
