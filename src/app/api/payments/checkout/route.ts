import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { stripe, isStripeEnabled } from '@/lib/stripe'
import { CREDIT_PACKAGES, LIFETIME_PACKAGE, getPackage, MOCK_MODE } from '@/lib/stripe-products'
import prisma from '@/lib/db'

// Create Stripe Checkout Session for payment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await req.json()
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json({ error: 'packageId is required' }, { status: 400 })
    }

    const pkg = getPackage(packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // Mock mode - return a fake checkout URL for testing
    if (MOCK_MODE) {
      const mockCheckoutUrl = `/mock-checkout?package=${packageId}&userId=${session.user.id}`

      // Create a pending payment record
      await prisma.payment.create({
        data: {
          userId: session.user.id,
          type: packageId === 'lifetime' ? 'LIFETIME' : 'CREDIT',
          amount: pkg.price,
          credits: 'credits' in pkg ? pkg.credits + pkg.bonus : null,
          stripePaymentId: `mock_${Date.now()}`,
          status: 'PENDING',
        },
      })

      return NextResponse.json({ url: mockCheckoutUrl, mock: true })
    }

    if (!isStripeEnabled || !stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cny',
            product_data: {
              name: pkg.name,
              description:
                'credits' in pkg
                  ? `${pkg.credits} 积分${pkg.bonus > 0 ? `（另送 ${pkg.bonus} 积分）` : ''}`
                  : '终身解锁全部功能',
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: session.user.id,
        packageId,
      },
    })

    // Create a pending payment record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        type: packageId === 'lifetime' ? 'LIFETIME' : 'CREDIT',
        amount: pkg.price,
        credits: 'credits' in pkg ? pkg.credits + pkg.bonus : null,
        stripePaymentId: checkoutSession.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建订单失败' },
      { status: 500 }
    )
  }
}
