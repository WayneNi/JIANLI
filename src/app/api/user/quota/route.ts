import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getCreditInfo } from '@/lib/credit'

// 获取用户当前配额状态 (Legacy - redirects to /api/credits)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const creditInfo = await getCreditInfo(session.user.id)

    if (!creditInfo) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      credits: creditInfo.credits,
      isLifetime: creditInfo.isLifetime,
      freeQuotaUsed: creditInfo.freeQuotaUsed,
      freeQuotaRemaining: creditInfo.freeQuotaRemaining,
      freeResetDate: creditInfo.freeResetDate,
    })
  } catch (error) {
    console.error('Quota check error:', error)
    return NextResponse.json({ error: '获取配额失败' }, { status: 500 })
  }
}

// 消耗一次配额 (Legacy - redirects to /api/credits/consume)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await req.json()
    const { feature } = body

    // Legacy: if no feature specified, assume OPTIMIZE
    const featureType = feature || 'OPTIMIZE'

    // Forward to credits consume API
    const res = await fetch(`${req.nextUrl.origin}/api/credits/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: featureType }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Quota consumption error:', error)
    return NextResponse.json({ error: '配额更新失败' }, { status: 500 })
  }
}
