import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { isVnativeEnabled } from '@/lib/vnative'

// 重定向到 Vnative 创建订单
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    if (!isVnativeEnabled()) {
      return NextResponse.json({ error: '支付系统未配置' }, { status: 500 })
    }

    const body = await req.json()
    const { packageId, payType = 'alipay' } = body

    if (!packageId) {
      return NextResponse.json({ error: 'packageId is required' }, { status: 400 })
    }

    // 调用 Vnative 创建订单 API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/vnative/create-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId, payType }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error || '创建订单失败' }, { status: response.status })
    }

    // 返回给前端，包含二维码URL
    return NextResponse.json({
      orderId: data.orderId,
      vnativeOrderId: data.vnativeOrderId,
      qrcodeUrl: data.qrcodeUrl,
      qrcodeContent: data.qrcodeContent,
      expireTime: data.expireTime,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建订单失败' },
      { status: 500 }
    )
  }
}
