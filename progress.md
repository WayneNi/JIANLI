# 进度日志

## 2026-03-18

### 当前状态
- 任务：修复 PDF 无法识别问题
- 阶段：完成 (Phase 2)

### 完成事项
- [x] Phase 1: 问题诊断 - 发现是 pdfjs-dist v3 与 Next.js/Turbopack 不兼容
- [x] Phase 2: 实现修复 - 使用子进程调用独立脚本方案
- [x] 测试 PDF 解析成功

### 修复详情
1. 创建了 `scripts/parse-pdf.js` - 使用 pdfjs-dist legacy 版本
2. 修改了 `src/app/api/parse/route.ts` - 通过子进程调用脚本
3. 修复了变量名冲突 (process → child)

### 错误记录
| 错误 | 原因 | 解决 |
|------|------|------|
| "Setting up fake worker failed" | pdfjs-dist v3 需要 Worker | 使用子进程方案 |
| "Cannot access 'process1' before initialization" | 变量名 `process` 覆盖全局对象 | 改为 `child` |

### 测试结果
- test.pdf: ✅ "Test Resume - John Doe"
- test2.pdf: ✅ "Dummy PDF file"

---

## 2026-03-23

### 当前状态
- 任务：Step 1.4 - 中文 PDF 字体修复
- 阶段：完成

### 完成事项
- [x] 安装 `@fontsource/noto-sans-sc` 中文字体包
- [x] 复制字体文件到 `public/fonts/`
- [x] 更新 `PdfTemplate.tsx` 注册 Noto Sans SC 字体
- [x] 将所有模板的 `fontFamily: 'Helvetica'` 改为 `fontFamily: 'Noto Sans SC'`

### 修复详情
1. 安装依赖：`pnpm add @fontsource/noto-sans-sc`
2. 复制字体文件到 `public/fonts/`:
   - `NotoSansSC-Regular.woff` (400 weight)
   - `NotoSansSC-Bold.woff` (700 weight)
3. 修改 `src/components/resume/PdfTemplate.tsx`:
   - 添加 `Font` 导入
   - 使用 URL 路径注册字体：`Font.register({ family: 'Noto Sans SC', fonts: [...] })`
   - 替换 3 处 `fontFamily: 'Helvetica'` → `fontFamily: 'Noto Sans SC'`

### 技术说明
- 使用 URL 路径 (`/fonts/NotoSansSC-Regular.woff`) 避免 Turbopack 模块解析问题
- 字体为 Unicode 范围子集，覆盖常用简体中文字符
- 适用于 simple、professional、creative 三种简历模板

### 验证结果
- `pnpm build`: ✅ 编译成功
- `pnpm lint`: ✅ 项目代码无错误（第三方 minified 文件警告可忽略）

### 修改的文件
| 文件 | 操作 |
|------|------|
| `src/components/resume/PdfTemplate.tsx` | 修改 |
| `public/fonts/NotoSansSC-Regular.woff` | 新增 |
| `public/fonts/NotoSansSC-Bold.woff` | 新增 |

---

## 2026-03-23 (续)

### 当前状态
- 任务：修复 auth 错误导致构建失败
- 阶段：完成

### 问题描述
```
Error: Module not found: Can't resolve './HomeClient'
TypeError: Cannot destructure property 'data' of '(0 , f.useSession)(...)' as it is undefined.
```
`page.tsx` 引入了不存在的 `HomeClient` 组件，导致构建失败。

### 修复方案
从 git 历史恢复 `page.tsx` 到上一个可用版本 (HEAD~1)

### 验证结果
- `pnpm build`: ✅ 编译成功
- `curl http://localhost:3000/`: ✅ 返回 HTTP 200

### 修改的文件
| 文件 | 操作 |
|------|------|
| `src/app/page.tsx` | 恢复（从 HEAD~1 恢复） |

---

*最后更新: 2026-03-23*
