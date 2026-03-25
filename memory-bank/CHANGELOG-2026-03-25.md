# Changelog - 2026-03-25

## Summary
重新设计简历 PDF 生成模块，创建三种专业模板风格，提升简历导出质量至可投递标准。

---

## Changes

### New Features

#### 1. Professional PDF Templates (`src/components/resume/PdfTemplateProfessional.tsx`)
全新设计的专业简历 PDF 模板，包含三种风格：

| Template | Name | Description | Best For |
|----------|------|-------------|----------|
| `simple` | 现代简约 | 金色强调线分隔、清晰信息层级、专业技能标签 | 传统行业、国企、事业单位、技术岗位 |
| `professional` | Executive | 深色头部设计、白色背景内容、强烈视觉对比 | 金融/咨询、外资企业、管理层 |
| `creative` | 创意活力 | 紫色主题、左侧竖线强调、圆角技能标签 | 互联网/科技、设计/创意、创业公司 |

**Design Improvements:**
- 专业的排版层级（姓名 26-30pt > 标题 11-14pt > 正文 9-10pt）
- 统一分隔线设计（双线、虚线、左侧竖线）
- 技能标签统一样式
- 专属配色方案确保整体协调
- 姓名 + 联系方式头部区块

#### 2. Enhanced Template Selection UI (`src/components/resume/DownloadOptions.tsx`)
- 更清晰的模板选择卡片设计
- 悬停预览效果
- 显示模板特点和建议使用场景
- PDF 下载按钮颜色跟随选中模板
- 添加格式说明提示

#### 3. Template Configuration (`src/lib/templates/index.ts`)
- 添加 `features` 列表（模板特点）
- 添加 `bestFor` 列表（推荐场景）
- 更新模板颜色配置
- 优化模板命名（中英文）

---

## Technical Details

### Files Changed
- `src/components/resume/PdfTemplateProfessional.tsx` - **NEW** 专业 PDF 模板组件
- `src/components/resume/DownloadOptions.tsx` - **MODIFIED** 下载选项 UI
- `src/lib/templates/index.ts` - **MODIFIED** 模板配置

### Dependencies
- `@react-pdf/renderer` - PDF 生成
- `noto-sans-sc` 字体（通过 Font.register 加载）

### Technical Notes
- 修复了 TypeScript 类型兼容性问题
- 所有模板样式通过 `StyleSheet.create()` 定义
- 使用 React PDF 的 Document/Page/Text/View 组件

---

## Known Issues

1. **NotebookLM 认证** - 由于网络限制（无法访问 notebooklm.google.com）暂时无法使用
   - 临时解决方案：使用 Web 搜索获取简历设计知识
   - 用户有 VPN 时可重试认证

2. **中文 PDF 乱码** - 依赖 `/fonts/NotoSansSC-*.woff` 字体文件
   - 确保字体文件存在于 `public/fonts/` 目录

---

## Future Improvements

- [ ] 添加更多模板变体（2-column, timeline 等）
- [ ] 支持简历照片上传和展示
- [ ] 实时模板预览功能
- [ ] 简历健康度检测（格式、长度、关键词）
- [ ] 多语言简历支持（中英文）

---

## Related Commits
- `343f82b` - chore: add .worktrees to gitignore
- `d264016` - chore: save current work before feature branch
- `55b8886` - docs: add ResumeCraft business plan v7.0
- `8bd224e` - feat: switch to MiniMax-M2.7 model

---

*Generated: 2026-03-25*
