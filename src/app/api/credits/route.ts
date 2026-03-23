import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getCreditInfo } from '@/lib/credit'

// Get current user credit info
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const creditInfo = await getCreditInfo(session.user.id)

    if (!creditInfo) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json(creditInfo)
  } catch (error) {
    console.error('Get credits error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取积分失败' },
      { status: 500 }
    )
  }
}
