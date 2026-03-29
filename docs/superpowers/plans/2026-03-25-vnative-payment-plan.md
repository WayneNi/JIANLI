# Vnative 支付集成实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将支付系统从 Stripe 替换为 Vnative（微信/支付宝二维码扫码支付）

**Architecture:** 通过 Vnative REST API 创建支付订单，获取二维码 URL 返回前端展示。用户扫码支付后，Vnative 异步回调我们的接口，我们验证签名后发放积分/开通会员。

**Tech Stack:** Next.js 15 App Router, Prisma, Vnative REST API

---

## 文件结构

```
新建文件:
- src/lib/vnative.ts                    # Vnative API 封装库
- src/app/api/payments/vnative/create-order/route.ts  # 创建订单
- src/app/api/payments/vnative/callback/route.ts      # 支付回调
- src/app/api/payments/vnative/query/route.ts          # 订单查询

修改文件:
- src/lib/stripe-products.ts            # 移除Stripe配置，添加Vnative套餐映射
- src/app/api/payments/checkout/route.ts # 重构为调用Vnative
- src/components/PricingCard.tsx         # 前端适配QR码展示
- src/app/pricing/page.tsx              # 文案更新（Stripe → 微信/支付宝）
- prisma/schema.prisma                  # Payment表新增vnativeOrderId字段

.env.local 需要新增:
- VNATIVE_MERCHANT_ID
- VNATIVE_APP_ID
- VNATIVE_APP_KEY
- VNATIVE_NOTIFY_URL
- VNATIVE_MODE=sandbox
```

---

## Task 1: 环境变量配置

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: 添加 Vnative 环境变量到 .env.local**

```bash
# Vnative 支付配置
VNATIVE_MERCHANT_ID=your_merchant_id
VNATIVE_APP_ID=your_app_id
VNATIVE_APP_KEY=your_app_key
VNATIVE_NOTIFY_URL=https://yourdomain.com/api/payments/vnative/callback
VNATIVE_MODE=sandbox
```

- [ ] **Step 2: 提交**

```bash
git add .env.local
git commit -m "chore: add Vnative payment environment variables"
```

---

## Task 2: Prisma 模型变更

**Files:**
- Modify: `prisma/schema.prisma:172-187`

- [ ] **Step 1: 在 Payment 模型添加 vnativeOrderId 字段**

在 `model Payment` 中，`stripePaymentId` 字段后添加：

```prisma
vnativeOrderId    String?
```

修改后的 Payment 模型:
```prisma
model Payment {
  id               String   @id @default(cuid())
  userId           String
  type             PaymentType
  amount           Int
  credits          Int?
  stripePaymentId  String?
  vnativeOrderId   String?    # 新增
  status           PaymentStatus @default(PENDING)
  createdAt        DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("payments")
}
```

- [ ] **Step 2: 运行 Prisma migrate**

```bash
npx prisma migrate dev --name add_vnative_order_id
```

- [ ] **Step 3: 提交**

```bash
git add prisma/schema.prisma
git commit -m "feat: add vnativeOrderId to Payment model"
```

---

## Task 3: 创建 Vnative API 封装库

**Files:**
- Create: `src/lib/vnative.ts`

- [ ] **Step 1: 创建 Vnative API 封装库**

```typescript
// src/lib/vnative.ts

const VNATIVE_API_BASE = 'https://api.vnative.com'

// 支付类型
export type PayType = 'wechat' | 'alipay' | 'union'

// 订单状态
export type VnativeOrderStatus = 'pending' | 'success' | 'failed' | 'closed'

// 创建订单请求
export interface CreateOrderParams {
  orderNo: string        // 商户订单号（唯一）
  totalAmount: number     // 金额（分）
  payType: PayType       // 支付方式
  subject: string        // 订单标题
  body?: string          // 订单描述
  notifyUrl: string      // 回调URL
  returnUrl?: string     // 支付完成后跳转URL
}

// 创建订单响应
export interface CreateOrderResponse {
  order_no: string
  vnative_order_no: string
  qrcode_url: string     // 支付二维码URL
  qrcode_content: string // 二维码内容（用于生成二维码）
  expire_time: string    // 过期时间
  amount: number
  status: VnativeOrderStatus
}

// 回调通知数据
export interface VnativeCallbackData {
  order_no: string
  vnative_order_no: string
  status: VnativeOrderStatus
  pay_type: PayType
  total_amount: number
  sign: string
  sign_type: string
}

// 查询订单响应
export interface QueryOrderResponse {
  order_no: string
  vnative_order_no: string
  status: VnativeOrderStatus
  pay_type: PayType
  total_amount: number
  paid_amount?: number
  paid_time?: string
  create_time: string
}

// 错误响应
interface VnativeError {
  code: string
  message: string
}

function getConfig() {
  const merchantId = process.env.VNATIVE_MERCHANT_ID
  const appId = process.env.VNATIVE_APP_ID
  const appKey = process.env.VNATIVE_APP_KEY
  const mode = process.env.VNATIVE_MODE || 'sandbox'

  if (!merchantId || !appId || !appKey) {
    throw new Error('Vnative configuration is missing')
  }

  return { merchantId, appId, appKey, mode }
}

// 生成签名
function generateSignature(params: Record<string, string | number>, appKey: string): string {
  // Vnative 签名算法：按字典序排列参数 + appKey，然后 MD5
  const sortedKeys = Object.keys(params).sort()
  const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + `&key=${appKey}`

  // 使用 Node.js crypto
  const crypto = require('crypto')
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase()
}

// 验证签名
export function verifyCallbackSignature(data: VnativeCallbackData, appKey: string): boolean {
  const { sign, sign_type, ...params } = data

  // 移除 sign 和 sign_type 后验证
  const paramsToSign: Record<string, string | number> = {
    order_no: params.order_no,
    vnative_order_no: params.vnative_order_no,
    status: params.status,
    pay_type: params.pay_type,
    total_amount: params.total_amount,
  }

  const expectedSign = generateSignature(paramsToSign, appKey)
  return expectedSign === sign
}

// 创建支付订单
export async function createVnativeOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  const { merchantId, appId, appKey, mode } = getConfig()

  const apiUrl = mode === 'sandbox'
    ? 'https://sandbox-api.vnative.com/v1/pay'
    : `${VNATIVE_API_BASE}/v1/pay`

  const requestParams: Record<string, string | number> = {
    merchant_id: merchantId,
    app_id: appId,
    order_no: params.orderNo,
    total_amount: params.totalAmount,
    pay_type: params.payType,
    subject: params.subject,
    notify_url: params.notifyUrl,
  }

  if (params.body) requestParams.body = params.body
  if (params.returnUrl) requestParams.return_url = params.returnUrl

  // 生成签名
  const sign = generateSignature(requestParams, appKey)

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...requestParams,
      sign,
      sign_type: 'MD5',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Vnative API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  if (result.code && result.code !== '200') {
    throw new Error(`Vnative API error: ${result.code} - ${result.message}`)
  }

  return result.data as CreateOrderResponse
}

// 查询订单
export async function queryVnativeOrder(orderNo: string): Promise<QueryOrderResponse> {
  const { merchantId, appId, appKey, mode } = getConfig()

  const apiUrl = mode === 'sandbox'
    ? 'https://sandbox-api.vnative.com/v1/query'
    : `${VNATIVE_API_BASE}/v1/query`

  const requestParams: Record<string, string | number> = {
    merchant_id: merchantId,
    app_id: appId,
    order_no: orderNo,
  }

  const sign = generateSignature(requestParams, appKey)

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...requestParams,
      sign,
      sign_type: 'MD5',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Vnative API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  if (result.code && result.code !== '200') {
    throw new Error(`Vnative API error: ${result.code} - ${result.message}`)
  }

  return result.data as QueryOrderResponse
}

// 检查 Vnative 是否启用
export function isVnativeEnabled(): boolean {
  return !!(
    process.env.VNATIVE_MERCHANT_ID &&
    process.env.VNATIVE_APP_ID &&
    process.env.VNATIVE_APP_KEY
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/vnative.ts
git commit -m "feat: add Vnative API SDK wrapper"
```

---

## Task 4: 创建订单 API

**Files:**
- Create: `src/app/api/payments/vnative/create-order/route.ts`

- [ ] **Step 1: 创建订单 API**

```typescript
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
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/payments/vnative/create-order/route.ts
git commit -m "feat: add Vnative create order API"
```

---

## Task 5: 创建支付回调 API

**Files:**
- Create: `src/app/api/payments/vnative/callback/route.ts`

- [ ] **Step 1: 创建支付回调 API**

```typescript
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
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/payments/vnative/callback/route.ts
git commit -m "feat: add Vnative payment callback API"
```

---

## Task 6: 创建订单查询 API

**Files:**
- Create: `src/app/api/payments/vnative/query/route.ts`

- [ ] **Step 1: 创建订单查询 API（用于前端轮询）**

```typescript
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
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/payments/vnative/query/route.ts
git commit -m "feat: add Vnative order query API for frontend polling"
```

---

## Task 7: 重构 checkout API 支持 Vnative

**Files:**
- Modify: `src/app/api/payments/checkout/route.ts`

- [ ] **Step 1: 重构 checkout API 移除 Stripe 逻辑**

将整个 `POST` 函数改为调用 Vnative：

```typescript
// src/app/api/payments/checkout/route.ts

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
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/payments/checkout/route.ts
git commit -m "refactor: redirect checkout to Vnative API"
```

---

## Task 8: 前端 PricingCard 支持二维码展示

**Files:**
- Modify: `src/components/PricingCard.tsx`

- [ ] **Step 1: 添加二维码弹窗展示**

在 `PricingCard` 组件中添加状态和二维码展示逻辑：

```tsx
// src/components/PricingCard.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, QRCode } from 'lucide-react'
import { CREDIT_PACKAGES_DISPLAY, LIFETIME_DISPLAY } from '@/lib/pricing-packages'

interface Package {
  id: string
  name: string
  price: number
  credits?: number
  bonus?: number
  features?: string[]
  highlight?: boolean
  badge?: string
}

interface PricingCardProps {
  pkg: Package
  type: 'credit' | 'lifetime'
  isAuthenticated: boolean
}

export function PricingCard({ pkg, type, isAuthenticated }: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [expireTime, setExpireTime] = useState<string | null>(null)
  const router = useRouter()

  const handlePurchase = async (payType: 'wechat' | 'alipay' = 'alipay') => {
    if (!isAuthenticated) {
      router.push('/auth/signin?callbackUrl=/pricing')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, payType }),
      })

      const data = await res.json()

      if (data.qrcodeUrl) {
        setQrCodeUrl(data.qrcodeUrl)
        setOrderId(data.orderId)
        setExpireTime(data.expireTime)
      } else {
        alert('创建订单失败，请重试')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('创建订单失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const closeQRModal = () => {
    setQrCodeUrl(null)
    setOrderId(null)
    setExpireTime(null)
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(0)
  }

  return (
    <>
      <div
        className={`relative rounded-2xl border p-6 ${
          pkg.highlight
            ? 'border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 shadow-lg'
            : 'border-gray-200 bg-white'
        }`}
      >
        {pkg.badge && (
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-pink-600 text-white">
            {pkg.badge}
          </Badge>
        )}

        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
          <div className="mt-2 flex items-baseline justify-center">
            <span className="text-3xl font-bold text-gray-900">¥{formatPrice(pkg.price)}</span>
          </div>
          {pkg.credits && (
            <p className="mt-1 text-sm text-gray-600">
              {pkg.credits} 积分
              {pkg.bonus ? (
                <span className="text-green-600"> + {pkg.bonus} bonus</span>
              ) : null}
            </p>
          )}
        </div>

        {pkg.features && (
          <ul className="space-y-2 mb-6">
            {pkg.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <Button
            onClick={() => handlePurchase('alipay')}
            disabled={loading}
            className={`w-full ${
              pkg.highlight
                ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white'
                : ''
            }`}
            variant={pkg.highlight ? 'default' : 'outline'}
          >
            {loading ? '处理中...' : '支付宝支付'}
          </Button>

          <Button
            onClick={() => handlePurchase('wechat')}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? '处理中...' : '微信支付'}
          </Button>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrCodeUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              请扫码支付
            </h3>
            <div className="flex justify-center mb-4">
              {/* 使用 img 标签展示二维码图片 */}
              <img src={qrCodeUrl} alt="支付二维码" className="w-64 h-64" />
            </div>
            <p className="text-sm text-gray-500 text-center mb-4">
              支付完成后点击下方按钮确认
            </p>
            <Button onClick={closeQRModal} className="w-full" variant="outline">
              我已支付
            </Button>
            <p className="text-xs text-gray-400 text-center mt-2">
              订单号: {orderId}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

// Free tier card (保持不变)
export function FreeTierCard({ isAuthenticated }: { isAuthenticated: boolean }) {
  // ... 不变
}

export { CREDIT_PACKAGES_DISPLAY, LIFETIME_DISPLAY }
```

- [ ] **Step 2: 提交**

```bash
git add src/components/PricingCard.tsx
git commit -m "feat: add QR code modal to PricingCard for Vnative payment"
```

---

## Task 9: 更新定价页面文案

**Files:**
- Modify: `src/app/pricing/page.tsx`

- [ ] **Step 1: 将 FAQ 中的 "Stripe" 改为 "微信/支付宝"**

找到 FAQ 中 "如何充值积分？" 的描述，将：
```
登录后选择积分充值套餐，通过 Stripe 安全支付即可。支付成功后积分即时到账。
```
改为：
```
登录后选择积分充值套餐，通过微信或支付宝安全支付即可。支付成功后积分即时到账。
```

- [ ] **Step 2: 提交**

```bash
git add src/app/pricing/page.tsx
git commit -m "docs: update payment method text to WeChat/Alipay"
```

---

## Task 10: 更新 stripe-products 配置

**Files:**
- Modify: `src/lib/stripe-products.ts`

- [ ] **Step 1: 移除 Stripe 相关配置，添加注释说明**

将 `stripe-products.ts` 重命名为 `packages.ts`（或保持文件名但更新内容），移除所有 Stripe 引用：

```typescript
// src/lib/stripe-products.ts

// Credit package configurations
export const CREDIT_PACKAGES = {
  CREDIT_10: {
    id: 'credit_10',
    name: '体验包',
    price: 1000, // ¥10 in cents
    credits: 100,
    bonus: 0,
  },
  CREDIT_20: {
    id: 'credit_20',
    name: '标准包',
    price: 2000, // ¥20 in cents
    credits: 200,
    bonus: 0,
  },
  CREDIT_50: {
    id: 'credit_50',
    name: '大礼包',
    price: 5000, // ¥50 in cents
    credits: 500,
    bonus: 20,
  },
} as const

// Lifetime membership
export const LIFETIME_PACKAGE = {
  id: 'lifetime',
  name: '终身会员',
  price: 9900, // ¥99 in cents
} as const

// Feature credit costs
export const CREDIT_COSTS = {
  OPTIMIZE: 10,
  ATS: 5,
  INTERVIEW: 5,
  COVER_LETTER: 5,
} as const

export type FeatureType = keyof typeof CREDIT_COSTS

// Package display info for pricing page
export const CREDIT_PACKAGES_DISPLAY = [
  { ...CREDIT_PACKAGES.CREDIT_10, features: ['100 积分', '支持微信/支付宝'] },
  { ...CREDIT_PACKAGES.CREDIT_20, features: ['200 积分', '支持微信/支付宝'] },
  { ...CREDIT_PACKAGES.CREDIT_50, features: ['500 积分 + 20 bonus', '支持微信/支付宝'], highlight: true, badge: '最划算' },
]

export const LIFETIME_DISPLAY = {
  ...LIFETIME_PACKAGE,
  features: [
    '无限使用所有功能',
    '简历优化无限次',
    'ATS优化无限次',
    '面试问题无限次',
    '求职信无限次',
  ],
}

export function isCreditPackage(packageId: string): packageId is keyof typeof CREDIT_PACKAGES {
  return packageId in CREDIT_PACKAGES
}

export function getPackage(packageId: string) {
  if (isCreditPackage(packageId)) {
    return CREDIT_PACKAGES[packageId]
  }
  if (packageId === 'lifetime') {
    return LIFETIME_PACKAGE
  }
  return null
}
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/stripe-products.ts
git commit -m "refactor: remove Stripe references from package config"
```

---

## Task 11: 端到端测试

**Files:**
- 无文件变更

- [ ] **Step 1: 启动开发服务器**

```bash
pnpm dev
```

- [ ] **Step 2: 访问 http://localhost:3000/pricing**

- [ ] **Step 3: 登录后点击任意套餐，验证：**
1. 弹出二维码
2. 微信/支付宝支付按钮可用
3. 沙箱环境下用测试链接完成支付
4. 回调处理正常
5. 积分/会员到账

- [ ] **Step 4: 测试失败场景**
1. 签名错误
2. 金额不匹配
3. 订单超时

---

## 实施顺序

| Task | 描述 | 依赖 |
|------|------|------|
| 1 | 环境变量配置 | 无 |
| 2 | Prisma 模型变更 | 无 |
| 3 | Vnative SDK 封装 | 1 |
| 4 | 创建订单 API | 2, 3 |
| 5 | 支付回调 API | 2, 3 |
| 6 | 订单查询 API | 2, 3 |
| 7 | 重构 checkout API | 4 |
| 8 | 前端 PricingCard | 7 |
| 9 | 定价页面文案 | 无 |
| 10 | 更新套餐配置 | 无 |
| 11 | 端到端测试 | 所有 |

---

## 注意事项

1. **Vnative 沙箱 vs 生产**: 开发时使用沙箱 API URL，生产环境使用正式 URL，通过 `VNATIVE_MODE` 切换
2. **回调 URL**: 必须公网可访问，本地开发可使用 ngrok 隧道
3. **签名算法**: Vnative 使用 MD5 签名，务必在服务器端验证签名
4. **幂等性**: 同一订单多次回调只处理一次
5. **金额验证**: 回调金额必须与创建订单时一致，防止篡改
