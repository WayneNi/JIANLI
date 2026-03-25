// src/app/api/payments/vnative/callback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyCallbackSignature, isVnativeEnabled, type VnativeCallbackData } from '@/lib/vnative'
import prisma from '@/lib/db'
import { addCredits, setLifetimeMember } from '@/lib/credit'

export async function POST(req: NextRequest) {
  try {
    // 检查 Vnative 是否启用
    if (!isVnativeEnabled()) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 })
    }

    const body = await req.json()
    const callbackData = body as VnativeCallbackData

    console.log('[Vnative Callback]:', callbackData)

    // 验证签名
    const appKey = process.env.VNATIVE_APP_KEY!
    if (!verifyCallbackSignature(callbackData, appKey)) {
      console.error('[Vnative Callback] Invalid signature:', callbackData)
      return NextResponse.json({ status: 'FAIL', message: 'Invalid signature' }, { status: 400 })
    }

    const { order_no, vnative_order_no, status, total_amount } = callbackData

    // 查找对应的 Payment 记录
    const payment = await prisma.payment.findFirst({
      where: {
        vnativeOrderId: vnative_order_no,
        status: 'PENDING',
      },
      include: {
        user: true,
      },
    })

    if (!payment) {
      console.error('[Vnative Callback] Payment not found:', vnative_order_no)
      return NextResponse.json({ status: 'FAIL', message: 'Order not found' }, { status: 404 })
    }

    // 验证金额（防篡改）
    if (payment.amount !== total_amount) {
      console.error('[Vnative Callback] Amount mismatch:', { paymentAmount: payment.amount, callbackAmount: total_amount })
      return NextResponse.json({ status: 'FAIL', message: 'Amount mismatch' }, { status: 400 })
    }

    // 订单已处理过（幂等性）
    if (payment.status === 'COMPLETED') {
      console.log('[Vnative Callback] Order already completed:', vnative_order_no)
      return NextResponse.json({ status: 'SUCCESS', message: 'OK' })
    }

    // 处理不同状态
    if (status === 'success') {
      // 更新 Payment 状态
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      })

      // 发放积分或开通会员
      if (payment.type === 'LIFETIME') {
        await setLifetimeMember(payment.userId)
        console.log('[Vnative Callback] Lifetime membership activated for user:', payment.userId)
      } else if (payment.credits) {
        await addCredits(payment.userId, payment.credits)
        console.log('[Vnative Callback] Credits added:', { userId: payment.userId, credits: payment.credits })
      }

      return NextResponse.json({ status: 'SUCCESS', message: 'OK' })
    }

    if (status === 'failed' || status === 'closed') {
      // 更新 Payment 状态为失败
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      })

      return NextResponse.json({ status: 'SUCCESS', message: 'OK' })
    }

    // 其他状态不需要处理
    return NextResponse.json({ status: 'SUCCESS', message: 'OK' })
  } catch (error) {
    console.error('[Vnative Callback] Error:', error)
    return NextResponse.json({ status: 'FAIL', message: 'Processing failed' }, { status: 500 })
  }
}