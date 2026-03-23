import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { consumeCredits } from '@/lib/credit'
import type { FeatureType } from '@/lib/stripe-products'

// Consume credits for a feature
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await req.json()
    const { feature } = body

    if (!feature) {
      return NextResponse.json({ error: 'feature is required' }, { status: 400 })
    }

    // Validate feature type
    const validFeatures = ['OPTIMIZE', 'ATS', 'INTERVIEW', 'COVER_LETTER']
    if (!validFeatures.includes(feature)) {
      return NextResponse.json({ error: 'Invalid feature type' }, { status: 400 })
    }

    const result = await consumeCredits(session.user.id, feature as FeatureType)

    if (!result.allowed) {
      const statusCode = result.error === 'NO_CREDITS' ? 402 : 403
      return NextResponse.json(result, { status: statusCode })
    }

    return NextResponse.json({
      success: true,
      remaining: result.remaining,
      reason: result.reason,
      cost: result.cost,
    })
  } catch (error) {
    console.error('Consume credits error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '扣减积分失败' },
      { status: 500 }
    )
  }
}
