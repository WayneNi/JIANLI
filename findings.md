# Resume Optimizer - 问题诊断报告

## 根本原因分析（Phase 1 完成）

### 核心问题：MiniMax API 返回的是纯文本，不是 JSON

从服务器日志可以清楚看到：

**Suggestion API 返回：**
```
匹配度：75%，简历与JD的主要差距在于没有AI相关的项目经验和技能...
```
→ 这是纯文本，不是 JSON！

**Optimization API 返回：**
```
## 简历优化结果

{
  "contact": { "name": "倪天城", ...
```
→ 包含 markdown 标题 `## 简历优化结果`，不是纯 JSON！

### 为什么之前以为"API 连接失败"？
- 最初是网络超时（已解决）
- 现在 API 连通了，但返回格式不符合要求
- 前端 React 报错是因为收到了 error chunk 但状态更新失败

---

## 发现的问题

| # | 问题 | 位置 | 严重性 | 状态 |
|---|------|------|--------|--------|
| 1 | **AI 模型不返回纯 JSON** | MiniMax API / Prompt | CRITICAL | 已修复 |
| 2 | `parseAIResponse` 无法处理 markdown 前缀 | `src/lib/resume-optimizer.ts:46` | CRITICAL | 已修复 |
| 3 | `parseSuggestionResponse` 无法处理纯文本 | `src/lib/resume-optimizer.ts:9` | CRITICAL | 已修复 |
| 4 | System Prompt 未明确要求"仅返回 JSON" | `ai-prompts.ts` | HIGH | 已修复 |
| 5 | 前端 error 处理可能导致 React 渲染错误 | `OptimizeClient.tsx` | MEDIUM | 已修复 |

**注**: 问题 #2-4 已在 `src/lib/resume-optimizer.ts` 中修复，代码包含4种容错策略处理 markdown 前缀。

---

## 服务器日志关键证据

```
Raw suggestion response: 匹配度：75%，简历与JD的主要差距...
Parse error: SyntaxError: Unexpected token '匹', "匹配度：75%，简历"... is not valid JSON

Raw response: ## 简历优化结果\n\n{ "contact": {...
Parse error: SyntaxError: Unexpected token '#', "## 简历优化结果\n"...
```

---

## 关键代码位置

1. `src/lib/ai-prompts.ts` - SYSTEM_PROMPT 和 SUGGESTION_PROMPT
2. `src/lib/resume-optimizer.ts` - `parseAIResponse()` 和 `parseSuggestionResponse()` 包含4种容错策略
3. `src/app/api/optimize/route.ts` - API 流处理逻辑
4. `src/app/dashboard/optimize/OptimizeClient.tsx` - 前端渲染逻辑
