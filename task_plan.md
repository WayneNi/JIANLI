# 任务计划：ATS 检测模块无法识别邮箱/电话问题修复

## 目标
修复 ATS 检测模块无法识别邮箱和电话的问题

## 问题分析

### 根本原因 (Root Cause)
**数据流问题**：`route.ts:329` 行
```javascript
const optimizedText = JSON.stringify(optimized);
const atsResult = analyzeResumeATS(optimizedText, jobDescription);
```

ATS 检查器接收的是 `JSON.stringify(optimized)`，即 AI 优化后的 JSON 字符串。但 `OptimizedResume` 类型只包含：
- `summary`
- `experience`
- `skills`
- `education`

**没有 contact（联系信息）字段！**

因此 `JSON.stringify(optimized)` 产生的字符串中根本不包含邮箱或电话。

### AI 优化 Prompt 问题
`OPTIMIZE_PROMPT` (ai-prompts.ts) 没有要求 AI 保留联系信息（姓名、邮箱、电话）。

### 数据流
1. 用户上传简历 → 提取文本包含联系信息
2. AI 优化 → 输出 JSON 只有 summary/experience/skills/education
3. ATS 检查 → 检查 JSON 字符串，找不到邮箱/电话
4. **误报：未检测到邮箱/电话**

## 修复方案

### Phase 1: 更新 AI Prompt (status: complete)
修改 `OPTIMIZE_PROMPT`，要求 AI 在 JSON 输出中包含联系信息

### Phase 2: 更新类型定义 (status: complete)
在 `OptimizedResume` 类型中添加 `contact` 字段

### Phase 3: 修复 ATS 检查数据源 (status: complete)
修改 `route.ts`，将原始简历文本（包含联系信息）传给 ATS 检查器

### Phase 4: 测试验证 (status: complete)
运行测试确保修复有效

## 实施步骤

1. [x] 1.1 更新 `OPTIMIZE_PROMPT` 添加联系信息保留指令
2. [x] 1.2 更新 `ai-prompts.ts` SYSTEM_PROMPT 添加 contact 字段说明
3. [x] 2.1 在 `OptimizedResume` 类型添加 `contact` 字段
4. [x] 3.1 修改 `route.ts` 使用原始 resumeText 而非 JSON.stringify(optimized)
5. [x] 4.1 运行 `pnpm test` 验证测试通过

## 验证结果

| 测试项 | 状态 |
|--------|------|
| `pnpm test` | ✅ 14 tests passed |
| ESLint (modified files) | ✅ 0 errors |

## 关键文件

| 文件 | 修改内容 |
|------|----------|
| `src/lib/ai-prompts.ts` | OPTIMIZE_PROMPT 添加联系信息保留 |
| `src/types/resume.ts` | OptimizedResume 添加 contact 字段 |
| `src/app/api/optimize/route.ts` | ATS 检查使用原始文本 |

---
*更新时间: 2026-03-19*
