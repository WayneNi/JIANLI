# Vnative 支付集成设计文档

## 概述

将项目的支付系统从 Stripe 替换为 Vnative（微信/支付宝扫码支付）。

## 背景

当前系统使用 Stripe 进行支付处理，但目标用户主要在中国大陆，需要支持微信支付和支付宝。Vnative 是聚合支付平台，支持微信/支付宝/云闪付，提供稳定的二维码扫码支付方式。

## 设计决策

### 支付方式
- **二维码扫码支付**：页面上显示支付二维码，用户用微信/支付宝扫码支付
- 最稳定、用户体验好，不受浏览器限制

### 测试策略
- 使用 Vnative 沙箱环境（测试商户号）进行开发测试
- 沙箱环境不消耗真实资金

### 部署注意
- 生产环境需要公网固定 IP + 域名
- Vnative 回调 URL 需要配置为 `https://yourdomain.com/api/payments/vnative/callback`
- 如部署在 Vercel，需特殊处理异步回调

## 实施范围

### 需要修改的文件
1. **新增** `src/lib/vnative.ts` - Vnative API 封装
2. **新增** `src/app/api/payments/vnative/create-order/route.ts` - 创建支付订单
3. **新增** `src/app/api/payments/vnative/callback/route.ts` - 支付回调处理
4. **修改** `src/lib/stripe-products.ts` - 移除 Stripe 相关配置，添加 Vnative 配置
5. **修改** `src/app/api/payments/checkout/route.ts` - 重构为调用 Vnative
6. **修改** `src/app/api/webhooks/stripe/route.ts` - 移除或标记废弃
7. **修改** `src/components/PricingCard.tsx` - 前端适配 Vnative 支付流程
8. **修改** `src/app/pricing/page.tsx` - 文字更新
9. **新增** `src/app/api/payments/vnative/query/route.ts` - 订单查询（用于前端轮询）

### Prisma 模型变更
- Payment 模型新增字段：`vnativeOrderId String?`

### 需要新增的环境变量
```
VNATIVE_MERCHANT_ID=      # Vnative 商户号
VNATIVE_APP_ID=           # Vnative 应用ID
VNATIVE_APP_KEY=          # Vnative 应用密钥
VNATIVE_NOTIFY_URL=       # 回调URL
VNATIVE_MODE=sandbox      # sandbox | production
```

### 保留/废弃的文件
- `src/lib/stripe.ts` - 保留但标记废弃（未来可删除）
- `src/app/mock-checkout/page.tsx` - 保留用于开发测试

## 支付流程

### 创建订单流程
```
1. 用户选择套餐，点击购买
2. 前端调用 POST /api/payments/vnative/createOrder
   - 参数: { packageId }
3. 后端:
   a. 验证用户登录
   b. 根据 packageId 获取套餐信息
   c. 调用 Vnative API 创建订单，获取支付二维码
   d. 创建 PENDING 状态的 Payment 记录
   e. 返回 { orderId, qrcodeUrl, expireTime }
4. 前端展示二维码，设置过期轮询
```

### 支付回调流程
```
1. 用户扫码支付，Vnative 异步通知我们的回调地址
2. 回调接口 POST /api/payments/vnative/callback
   - Vnative 会 POST 订单状态信息
3. 后端验证签名
4. 验证订单金额防篡改
5. 更新 Payment 状态为 COMPLETED
6. 根据套餐类型:
   - CREDIT: 调用 addCredits() 增加积分
   - LIFETIME: 调用 setLifetimeMember() 开通会员
7. 返回 SUCCESS 给 Vnative
```

### 前端轮询/状态更新
```
1. 创建订单后，前端开始轮询 POST /api/payments/vnative/query
2. 用户支付成功后，前端检测到状态变更
3. 跳转到 /dashboard?payment=success 显示成功
```

## 错误处理

### 订单创建失败
- 返回错误信息，前端显示"创建订单失败，请重试"
- 不创建 Payment 记录

### 回调签名验证失败
- 记录日志，返回 FAIL
- 不修改 Payment 状态

### 回调金额不匹配
- 记录日志，返回 FAIL
- 不发放积分/会员

### 订单超时（用户未支付）
- Vnative 会在超时后通知我们
- Payment 状态保持 PENDING 或更新为 EXPIRED

## 安全性考虑

1. **签名验证**：所有 Vnative 回调必须验证签名
2. **金额验证**：回调金额必须与创建订单时一致
3. **幂等性**：同一订单多次回调只处理一次
4. **日志记录**：所有支付操作记录日志
5. **敏感信息**：不在前端暴露商户密钥

## Vnative API 概要

### 创建订单
```
POST https://api.vnative.com/v1/pay
{
  "merchant_id": "xxx",
  "app_id": "xxx",
  "order_no": "xxx",        # 商户订单号
  "total_amount": 1000,     # 金额（分）
  "pay_type": "wechat|alipay|union",
  "notify_url": "xxx",
  "return_url": "xxx",      # 支付完成后跳转地址
  "subject": "xxx",
  "body": "xxx"
}
```

### 回调通知
```
POST {notify_url}
{
  "order_no": "xxx",
  "vnative_order_no": "xxx",
  "status": "success|failed|closed",
  "pay_type": "wechat|alipay",
  "total_amount": 1000,
  "sign": "xxx"
}
```

## 测试计划

1. **沙箱环境测试**
   - 配置测试商户号
   - 创建订单，验证返回二维码
   - 模拟支付成功/失败回调
   - 验证积分/会员发放

2. **沙箱支付流程测试**
   - 使用 Vnative 提供的测试支付链接
   - 完整走一遍支付流程

3. **错误场景测试**
   - 签名错误
   - 金额篡改
   - 订单重复通知

## 实施顺序

1. 添加环境变量，配置 Vnative SDK
2. 创建 Vnative API 封装库
3. 创建订单 API（创建订单 + 订单查询）
4. 创建回调 API（支付回调处理）
5. 修改前端 PricingCard 支持 Vnative
6. 更新定价页面文案
7. 添加 Prisma 字段
8. 端到端测试

## 预计改动文件数

- 新增文件：4 个（API route x3, lib x1）
- 修改文件：5 个
- 总计：9 个文件
