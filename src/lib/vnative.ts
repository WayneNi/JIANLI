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
