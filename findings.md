# 研究发现：PDF 解析问题

## 当前实现分析

### 文件位置
- API: `src/app/api/parse/route.ts`
- 前端: `src/components/resume/UploadZone.tsx`

### 当前依赖
- `pdfjs-dist`: 3.11.174
- `mammoth`: 1.11.0 (用于 DOCX)

### 当前 Worker 配置
```typescript
const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.js');
const workerCode = fs.readFileSync(workerPath);
const workerBase64 = workerCode.toString('base64');
pdfjs.GlobalWorkerOptions.workerSrc = `data:application/javascript;base64,${workerBase64}`;
```

## 已知问题

### 1. 中文 PDF 乱码
- **原因**: `pdf-parse` 对中文支持不好
- **CLAUDE.md 建议**: 使用 `pdfjs-dist` 或 Python 脚本

### 2. Node.js 兼容性
- pdfjs-dist v3 在 Node.js 环境中需要正确配置 worker
- 动态 import 可能导致问题

### 3. 扫描件/图片 PDF
- 当前已处理：返回友好错误信息

## 解决方案对比

### 方案 A: 改进 pdfjs-dist
- 改用 CDN 加载 worker
- 尝试不同版本
- 优点：无需新增依赖
- 缺点：某些格式仍可能失败

### 方案 B: tesseract.js (OCR)
- 支持图片和扫描件 PDF
- 优点：支持所有 PDF 类型
- 缺点：速度慢，内存占用大

### 方案 C: Python 后端
- 使用 pdfplumber 或 PyMuPDF
- 优点：中文支持最好
- 缺点：需要 Python 环境

## 参考资源

- pdfjs-dist 官方文档: https://mozilla.github.io/pdf.js/
- tesseract.js: https://tesseract.projectnaptha.com/
- pdfplumber: https://github.com/jsvine/pdfplumber

---

*更新时间: 2026-03-18*
