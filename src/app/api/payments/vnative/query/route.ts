// src/app/api/payments/vnative/query/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { queryVnativeOrder, isVnativeEnabled } from '@/lib/vnative'
import prisma from '@/lib/db'

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
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    // 查询 Vnative 订单状态
    const vnativeOrder = await queryVnativeOrder(orderId)

    // 查找本地 Payment 记录
    const payment = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        vnativeOrderId: vnativeOrder.vnative_order_no,
      },
      select: {
        id: true,
        status: true,
        credits: true,
        type: true,
      },
    })

    return NextResponse.json({
      orderId: vnativeOrder.order_no,
      vnativeOrderId: vnativeOrder.vnative_order_no,
      status: vnativeOrder.status,
      paymentStatus: payment?.status,
      isPaid: vnativeOrder.status === 'success',
      isExpired: vnativeOrder.status === 'closed',
    })
  } catch (error) {
    console.error('Query order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '查询订单失败' },
      { status: 500 }
    )
  }
}
