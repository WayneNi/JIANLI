// Template types
export type TemplateType = 'simple' | 'professional' | 'creative';

export interface TemplateConfig {
  id: TemplateType;
  name: string;
  nameEn: string;
  description: string;
  color: string;
  features: string[];
  bestFor: string[];
}

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'simple',
    name: '现代简约',
    nameEn: 'Modern Minimal',
    description: '简洁清晰，专业大气',
    color: '#1e3a5f',
    features: [
      '金色强调线分隔',
      '清晰的信息层级',
      '专业技能标签',
      '留白充足'
    ],
    bestFor: ['传统行业', '国企', '事业单位', '技术岗位'],
  },
  {
    id: 'professional',
    name: 'Executive',
    nameEn: 'Executive Dark',
    description: '深色头部，高端专业',
    color: '#0f172a',
    features: [
      '深色头部设计',
      '白色背景内容',
      '强烈视觉对比',
      '分栏技能展示'
    ],
    bestFor: ['金融/咨询', '管理岗位', '外资企业', '高管职位'],
  },
  {
    id: 'creative',
    name: '创意活力',
    nameEn: 'Creative Modern',
    description: '活力配色，创意十足',
    color: '#7c3aed',
    features: [
      '紫色主题配色',
      '左侧竖线强调',
      '圆角技能标签',
      '现代感十足'
    ],
    bestFor: ['互联网/科技', '设计/创意', '创业公司', '海归/外企'],
  },
];

export function getTemplateColor(template: TemplateType): string {
  const found = TEMPLATES.find((t) => t.id === template);
  return found?.color || '#1e3a5f';
}
