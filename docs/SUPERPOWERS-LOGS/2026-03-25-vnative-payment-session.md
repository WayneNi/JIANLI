# Vnative 支付集成实施日志

**日期**: 2026-03-25
**会话**: 将 Stripe 支付替换为微信/支付宝（Vnative）
**状态**: 已完成（待部署测试）

---

## 背景

用户希望将项目中的 Stripe 支付系统替换为微信/支付宝支付。

**决策**：通过聚合支付平台 Vnative 接入，而非直接接入微信/支付宝官方（因为直接接入需要企业资质，难度极高）。

---

## 设计决策

| 项目 | 选择 |
|------|------|
| 聚合支付平台 | Vnative |
| 支付方式 | 二维码扫码支付 |
| 开发测试 | Vnative 沙箱环境 |
| 部署环境 | 待配置 |

---

## 实施任务

| # | 任务 | 状态 | 提交 |
|---|------|------|------|
| 1 | 环境变量配置 | ✅ 完成 | - (未提交，.env.local) |
| 2 | Prisma 模型变更 | ✅ 完成 | `c3c5408` |
| 3 | 创建 Vnative SDK 封装 | ✅ 完成 | `6ae7557` |
| 4 | 创建订单 API | ✅ 完成 | `f25c5b6` |
| 5 | 创建支付回调 API | ✅ 完成 | `4757ed8` |
| 6 | 创建订单查询 API | ✅ 完成 | `c1163f6` |
| 7 | 重构 checkout API | ✅ 完成 | `ff88a1b` |
| 8 | 前端二维码展示 | ✅ 完成 | `8ff69f4` |
| 9 | 定价页面文案更新 | ✅ 完成 | `62a9634` |
| 10 | 更新套餐配置 | ✅ 完成 | `e03cedc` |

**Prisma Migrate**: 待运行（需要 DATABASE_URL）

---

## 新增文件

```
src/lib/vnative.ts                                    # Vnative API 封装
src/app/api/payments/vnative/create-order/route.ts   # 创建订单
src/app/api/payments/vnative/callback/route.ts       # 支付回调
src/app/api/payments/vnative/query/route.ts           # 订单查询
.env.local                                           # 环境变量（不提交）
```

## 修改文件

```
prisma/schema.prisma                     # Payment 表新增 vnativeOrderId
src/app/api/payments/checkout/route.ts   # 重构为 Vnative
src/components/PricingCard.tsx            # 添加二维码弹窗
src/app/pricing/page.tsx                 # 文案更新
src/lib/stripe-products.ts              # 移除 Stripe 引用
```

---

## 待完成事项

### 1. 用户需自行完成
- [ ] 注册 Vnative 账号（https://vnative.com）
- [ ] 获取测试环境 Merchant ID / App ID / App Key
- [ ] 配置 .env.local 中的 Vnative 环境变量
- [ ] 配置 DATABASE_URL 数据库连接
- [ ] 运行 `npx prisma migrate dev --name add_vnative_order_id`

### 2. 部署后测试
- [ ] 本地开发测试（沙箱环境）
- [ ] 配置 ngrok 或公网回调 URL
- [ ] 端到端支付测试
- [ ] 切换到生产环境

---

## 费用说明

| 项目 | 说明 |
|------|------|
| Vnative 手续费 | 通常 0.6%-1% |
| 沙箱测试 | 免费 |
| 注册 | 免费 |

---

## 相关文档

- 设计文档: `docs/superpowers/specs/2026-03-25-vnative-payment-design.md`
- 实施计划: `docs/superpowers/plans/2026-03-25-vnative-payment-plan.md`

---

## Git 分支

- **分支名**: `feature/vnative-payment`
- **工作区**: `.worktrees/vnative-payment`
- **待合并**: `master`

---

## 下次会话

1. 运行 Prisma migrate
2. 配置 Vnative 测试环境
3. 本地端到端测试
4. 合并到 master
