// Template types
export type TemplateType = 'simple' | 'professional' | 'creative';

export interface TemplateConfig {
  id: TemplateType;
  name: string;
  nameEn: string;
  description: string;
  color: string;
}

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'simple',
    name: '简约型',
    nameEn: 'Simple',
    description: '简洁清晰，适合传统行业',
    color: '#1a1f2e',
  },
  {
    id: 'professional',
    name: '专业型',
    nameEn: 'Professional',
    description: '专业大气，适合金融/咨询',
    color: '#0f172a',
  },
  {
    id: 'creative',
    name: '创意型',
    nameEn: 'Creative',
    description: '创意十足，适合互联网/设计',
    color: '#7c3aed',
  },
];

export function getTemplateColor(template: TemplateType): string {
  const found = TEMPLATES.find((t) => t.id === template);
  return found?.color || '#1a1f2e';
}
