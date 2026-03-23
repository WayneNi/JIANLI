import { NextRequest, NextResponse } from 'next/server'
import { stripe, isStripeEnabled } from '@/lib/stripe'
import { MOCK_MODE } from '@/lib/stripe-products'
import prisma from '@/lib/db'
import { addCredits, setLifetimeMember } from '@/lib/credit'

export async function POST(req: NextRequest) {
  if (MOCK_MODE) {
    // In mock mode, handle a simple query parameter-based callback
    try {
      const url = new URL(req.url)
      const userId = url.searchParams.get('userId')
      const packageId = url.searchParams.get('package')

      if (!userId || !packageId) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
      }

      // Process mock payment
      const payment = await prisma.payment.findFirst({
        where: {
          userId,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      })

      // Grant credits or lifetime
      if (payment.type === 'LIFETIME') {
        await setLifetimeMember(userId)
      } else if (payment.credits) {
        await addCredits(userId, payment.credits)
      }

      return NextResponse.json({ success: true, mock: true })
    } catch (error) {
      console.error('Mock webhook error:', error)
      return NextResponse.json({ error: 'Mock processing failed' }, { status: 500 })
    }
  }

  if (!isStripeEnabled || !stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set')
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          metadata?: { userId?: string; packageId?: string }
          payment_status?: string
          id?: string
        }

        if (session.payment_status !== 'paid') {
          break
        }

        const userId = session.metadata?.userId
        const packageId = session.metadata?.packageId

        if (!userId || !packageId) {
          console.error('Missing metadata in checkout session')
          break
        }

        // Find and update the pending payment
        const payment = await prisma.payment.findFirst({
          where: {
            stripePaymentId: session.id,
            status: 'PENDING',
          },
        })

        if (!payment) {
          console.error('Payment record not found for session:', session.id)
          break
        }

        // Update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED' },
        })

        // Grant credits or lifetime based on package type
        if (payment.type === 'LIFETIME') {
          await setLifetimeMember(userId)
        } else if (payment.credits) {
          await addCredits(userId, payment.credits)
        }

        break
      }

      case 'payment_intent.succeeded': {
        // Handle payment intent success if needed
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as { id?: string }
        if (paymentIntent.id) {
          // Update payment record to failed
          await prisma.payment.updateMany({
            where: { stripePaymentId: paymentIntent.id },
            data: { status: 'FAILED' },
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
