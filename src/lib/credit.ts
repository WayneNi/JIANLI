import prisma from '@/lib/db'
import { CREDIT_COSTS, type FeatureType } from '@/lib/stripe-products'

export interface CreditCheckResult {
  allowed: boolean
  reason?: 'lifetime' | 'free' | 'credits'
  cost?: number
  error?: 'NO_CREDITS' | 'FREE_QUOTA_USED'
  required?: number
  remaining?: number
  message?: string
}

// Check if it's a new month (for free quota reset)
function isNewMonth(lastResetDate: Date): boolean {
  const now = new Date()
  const lastReset = new Date(lastResetDate)
  return (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  )
}

// Check if user can use a feature and returns how much it will cost
export async function checkCredits(
  userId: string,
  feature: FeatureType
): Promise<CreditCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      credits: true,
      isLifetime: true,
      freeUsageCount: true,
      freeResetDate: true,
    },
  })

  if (!user) {
    return { allowed: false, error: 'NO_CREDITS', message: '用户不存在' }
  }

  // 终身会员不受限制
  if (user.isLifetime) {
    return { allowed: true, reason: 'lifetime', cost: 0 }
  }

  const cost = CREDIT_COSTS[feature]

  // 免费额度检查（仅 OPTIMIZE 功能，每月1次）
  if (feature === 'OPTIMIZE') {
    const shouldReset = isNewMonth(user.freeResetDate)

    if (shouldReset || user.freeUsageCount < 1) {
      // 可以使用免费额度
      return {
        allowed: true,
        reason: 'free',
        cost: 0,
      }
    }
  }

  // 检查积分是否足够
  if (user.credits >= cost) {
    return {
      allowed: true,
      reason: 'credits',
      cost,
      remaining: user.credits,
    }
  }

  // 积分不足
  return {
    allowed: false,
    error: 'NO_CREDITS',
    required: cost,
    remaining: user.credits,
    message: `积分不足，需要 ${cost} 积分，当前剩余 ${user.credits} 积分`,
  }
}

// Reserve credits for a feature (used to prevent race conditions)
// Returns a reservation ID that must be used when confirming or cancelling
export async function reserveCredits(
  userId: string,
  feature: FeatureType
): Promise<{ success: boolean; reservationId?: string; error?: string; cost?: number; remaining?: number; reason?: 'lifetime' | 'free' | 'credits' }> {
  const cost = CREDIT_COSTS[feature]

  // Use a transaction to atomically check and reserve
  try {
    // For free usage - use optimistic locking approach
    if (feature === 'OPTIMIZE') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true, isLifetime: true, freeUsageCount: true, freeResetDate: true },
      })

      if (!user) {
        return { success: false, error: '用户不存在' }
      }

      if (user.isLifetime) {
        return { success: true, reservationId: `lifetime-${Date.now()}`, cost: 0, reason: 'lifetime' }
      }

      const shouldReset = isNewMonth(user.freeResetDate)
      if (shouldReset || user.freeUsageCount < 1) {
        // Reserve free quota - update the count immediately
        await prisma.user.update({
          where: { id: userId },
          data: {
            freeUsageCount: { increment: 1 },
            freeResetDate: new Date(),
          },
        })
        const reservationId = `free-${userId}-${Date.now()}`
        return { success: true, reservationId, cost: 0, reason: 'free' }
      }
    }

    // For paid credits - atomic check and decrement
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true, isLifetime: true },
      })

      if (!user) {
        throw new Error('用户不存在')
      }

      if (user.isLifetime) {
        return { reason: 'lifetime' as const, cost: 0, remaining: Infinity }
      }

      if (user.credits < cost) {
        return {
          success: false,
          error: `积分不足，需要 ${cost} 积分，当前剩余 ${user.credits} 积分`,
          remaining: user.credits,
        }
      }

      // Deduct credits atomically
      const updated = await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: cost } },
        select: { credits: true },
      })

      return {
        success: true,
        reason: 'credits' as const,
        cost,
        remaining: updated.credits,
      }
    })

    if (!result.success) {
      return { success: false, error: result.error, remaining: result.remaining }
    }

    return {
      success: true,
      reservationId: `credits-${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      cost: result.cost,
      remaining: result.remaining,
      reason: result.reason,
    }
  } catch (e) {
    console.error('[Credit] Reserve error:', e)
    return { success: false, error: '积分预留失败，请重试' }
  }
}

// Refund credits for a failed operation
export async function refundCredits(
  userId: string,
  feature: FeatureType,
  cost: number
): Promise<void> {
  if (cost <= 0) return

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { increment: cost },
      },
    })
  } catch (e) {
    console.error('[Credit] Refund error:', e)
  }
}

// Consume credits for a feature
export async function consumeCredits(
  userId: string,
  feature: FeatureType
): Promise<CreditCheckResult> {
  // First check
  const checkResult = await checkCredits(userId, feature)

  if (!checkResult.allowed) {
    return checkResult
  }

  // If lifetime or free, just update free usage count if needed
  if (checkResult.reason === 'lifetime') {
    return { allowed: true, reason: 'lifetime', cost: 0 }
  }

  if (checkResult.reason === 'free') {
    // Update free usage count
    await prisma.user.update({
      where: { id: userId },
      data: {
        freeUsageCount: { increment: 1 },
        freeResetDate: new Date(),
      },
    })
    return { allowed: true, reason: 'free', cost: 0 }
  }

  // Deduct credits
  const cost = checkResult.cost || CREDIT_COSTS[feature]

  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: { decrement: cost },
    },
  })

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  })

  return {
    allowed: true,
    reason: 'credits',
    cost,
    remaining: updatedUser?.credits ?? 0,
  }
}

// Get user credit info
export async function getCreditInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      credits: true,
      isLifetime: true,
      freeUsageCount: true,
      freeResetDate: true,
    },
  })

  if (!user) {
    return null
  }

  const shouldReset = isNewMonth(user.freeResetDate)

  return {
    credits: user.credits,
    isLifetime: user.isLifetime,
    freeQuotaUsed: !shouldReset && user.freeUsageCount >= 1,
    freeQuotaRemaining: shouldReset ? 1 : Math.max(0, 1 - user.freeUsageCount),
    freeResetDate: shouldReset ? new Date() : user.freeResetDate,
  }
}

// Add credits to user account (after payment)
export async function addCredits(userId: string, amount: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: { increment: amount },
    },
  })
}

// Set user as lifetime member (after payment)
export async function setLifetimeMember(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isLifetime: true,
    },
  })
}
