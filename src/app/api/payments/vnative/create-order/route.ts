// src/app/api/payments/vnative/create-order/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { createVnativeOrder, isVnativeEnabled } from '@/lib/vnative'
import { CREDIT_PACKAGES, LIFETIME_PACKAGE, getPackage } from '@/lib/stripe-products'
import prisma from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // 检查认证
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // 检查 Vnative 是否启用
    if (!isVnativeEnabled()) {
      return NextResponse.json({ error: '支付系统未配置' }, { status: 500 })
    }

    const body = await req.json()
    const { packageId, payType = 'alipay' } = body

    if (!packageId) {
      return NextResponse.json({ error: 'packageId is required' }, { status: 400 })
    }

    const pkg = getPackage(packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    // 生成商户订单号
    const orderNo = `VN${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // 构建商品描述
    let subject = pkg.name
    let bodyDesc = ''
    if ('credits' in pkg) {
      bodyDesc = `${pkg.credits} 积分${pkg.bonus > 0 ? `（另送 ${pkg.bonus} 积分）` : ''}`
    } else {
      bodyDesc = '终身解锁全部功能'
    }

    // 创建 Vnative 订单
    const vnativeResult = await createVnativeOrder({
      orderNo,
      totalAmount: pkg.price, // 金额（分）
      payType, // 'wechat' | 'alipay' | 'union'
      subject,
      body: bodyDesc,
      notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/vnative/callback`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    })

    // 创建待支付的 Payment 记录
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        type: packageId === 'lifetime' ? 'LIFETIME' : 'CREDIT',
        amount: pkg.price,
        credits: 'credits' in pkg ? pkg.credits + pkg.bonus : null,
        vnativeOrderId: vnativeResult.vnative_order_no,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      orderId: orderNo,
      vnativeOrderId: vnativeResult.vnative_order_no,
      qrcodeUrl: vnativeResult.qrcode_url,
      qrcodeContent: vnativeResult.qrcode_content,
      expireTime: vnativeResult.expire_time,
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建订单失败' },
      { status: 500 }
    )
  }
}