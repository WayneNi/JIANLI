# 2026-04-02 简历优化器稳定性与质量改善

## 日期
2026-04-02

## 概述

根据用户确认的目标实施了一系列稳定性和质量改进：

- **框架变更**：引入 React Query 替换手写流式处理（计划中）
- **AI 质量**：增强 Prompt + 解析失败时重试
- **测试**：补充 Credit 系统单元测试

## 主要变更

### Bug 修复

#### 1. `timeoutId is not defined` 错误 (OptimizeClient.tsx)
**根因**：变量声明在 try 块内部，当 early throw 发生时，finally 块引用未绑定的变量。

**修复**：
- 将 `bytesReceived` 和 `timeoutId` 声明移到 try 块外部
- 在 finally 中添加空值检查：`if (timeoutId !== undefined) clearTimeout(timeoutId)`
- 清除后重置 `timeoutId = undefined`

### Prompt 增强

#### 2. 增强系统提示词 (ai-prompts.ts)
- 添加 `MAX_PARSE_ATTEMPTS = 2` 常量
- 创建 `STRICT_SYSTEM_PROMPT`，包含更严格的输出约束
- 更新 `SYSTEM_PROMPT`，明确字段要求：
  - experience 数组必须至少有一项
  - skills.technical 必须至少有一项
  - 禁止添加未列出字段
- 更新 `OPTIMIZE_PROMPT`，明确禁止编造内容

### 解析重试逻辑

#### 3. 添加 parseWithRetry 函数 (route.ts)
- 首次解析失败后，使用严格 prompt 进行重试
- 最多尝试 2 次
- 重试使用非流式 API 调用

### 积分退款保障

#### 4. 退款逻辑移到 finally 块 (route.ts)
- 添加 `shouldRefund` 标志跟踪退款需求
- 在 finally 块中执行退款，确保无论任何路径都执行
- 添加退款失败的错误处理

### AbortController 支持

#### 5. 请求取消支持 (route.ts)
- 修改 `fetchWithTimeout` 接受 `externalSignal` 参数
- 所有 API 调用传递 `req.signal`
- 用户取消请求时自动中断 MiniMax API 调用

### 测试覆盖

#### 6. Credit 系统单元测试 (credit.test.ts)
新增测试文件，包含 20 个测试用例：

**checkCredits 测试**：
- 免费配额优先级处理
- 积分充足时的使用
- 积分不足时的拒绝
- 非存在用户处理
- 终身会员无需检查积分
- 每月免费配额重置

**reserveCredits 测试**：
- 免费配额预留
- 终身会员跳过扣减
- 非存在用户处理

**refundCredits 测试**：
- 成功退款
- 零/负成本不退款
- 数据库错误处理

**getCreditInfo 测试**：
- 用户信息获取
- 配额使用状态
- 终身会员状态
- 月份重置逻辑

## 文件变更

| 文件 | 变更类型 |
|------|---------|
| `src/app/dashboard/optimize/OptimizeClient.tsx` | 修改 |
| `src/app/api/optimize/route.ts` | 修改 |
| `src/lib/ai-prompts.ts` | 修改 |
| `src/lib/resume-optimizer.ts` | 修改 |
| `src/lib/__tests__/credit.test.ts` | 新增 |

## 验证

- TypeScript 类型检查通过
- 所有 34 个测试通过（4 个测试文件）
- 积分系统测试 20 个全部通过

## 待办事项

- [ ] React Query 集成（计划中的框架变更）
- [ ] E2E 测试补充
