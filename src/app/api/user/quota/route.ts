import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import prisma from '@/lib/db'

// 获取用户当前配额状态
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        usageCount: true,
        resetDate: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 检查是否需要重置配额
    const now = new Date()
    const resetDate = new Date(user.resetDate)
    const isNewMonth = now.getMonth() !== resetDate.getMonth() ||
                       now.getFullYear() !== resetDate.getFullYear()

    let usageCount = user.usageCount
    let resetDateValue = user.resetDate

    // 如果是新月且是免费用户，重置配额
    if (isNewMonth && user.subscriptionTier === 'FREE') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          usageCount: 0,
          resetDate: now
        }
      })
      usageCount = 0
      resetDateValue = now
    }

    // 配额限制
    const limits = {
      FREE: 3,
      PRO: Infinity,
      PREMIUM: Infinity,
      ENTERPRISE: Infinity
    }

    const limit = limits[user.subscriptionTier] ?? 3

    return NextResponse.json({
      tier: user.subscriptionTier,
      usageCount,
      limit,
      resetDate: resetDateValue,
      isLimited: user.subscriptionTier === 'FREE'
    })
  } catch (error) {
    console.error('Quota check error:', error)
    return NextResponse.json({ error: '获取配额失败' }, { status: 500 })
  }
}

// 消耗一次配额
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 非免费用户不受限制
    if (user.subscriptionTier !== 'FREE') {
      return NextResponse.json({ success: true, reason: 'paid_user' })
    }

    // 检查是否需要重置配额
    const now = new Date()
    const resetDate = new Date(user.resetDate)
    const isNewMonth = now.getMonth() !== resetDate.getMonth() ||
                       now.getFullYear() !== resetDate.getFullYear()

    if (isNewMonth) {
      // 重置并允许本次使用
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          usageCount: 1,
          resetDate: now
        }
      })
      return NextResponse.json({ success: true, remaining: 2 })
    }

    // 检查配额
    if (user.usageCount >= 3) {
      return NextResponse.json({
        error: '配额已用完',
        code: 'QUOTA_EXCEEDED',
        upgradeUrl: '/pricing'
      }, { status: 403 })
    }

    // 消耗配额
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        usageCount: user.usageCount + 1
      }
    })

    return NextResponse.json({
      success: true,
      remaining: 2 - user.usageCount
    })
  } catch (error) {
    console.error('Quota consumption error:', error)
    return NextResponse.json({ error: '配额更新失败' }, { status: 500 })
  }
}
