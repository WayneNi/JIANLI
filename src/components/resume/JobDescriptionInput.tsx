"use client";

import { useState } from 'react';
import { FileSearch, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

// Purple-Blue Gradient Theme
const COLORS = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#F8F9FA',
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  gradientStart: '#667EEA',
  gradientEnd: '#764BA2',
  accent: '#EC4899',
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  success: '#059669',
  error: '#DC2626',
};

export function JobDescriptionInput({
  value,
  onChange,
}: JobDescriptionInputProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="glass-card" style={{ borderRadius: '12px', border: `1px solid ${COLORS.border}` }}>
      <CardHeader
        className="cursor-pointer py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center gap-2 text-base" style={{ color: COLORS.text }}>
          <div
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.primary}15`, border: `1px solid ${COLORS.primary}30` }}
          >
            <FileSearch className="h-4 w-4" style={{ color: COLORS.primary }} />
          </div>
          目标岗位描述（可选）
          {isExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4" style={{ color: COLORS.primary }} />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4" style={{ color: COLORS.primary }} />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <Textarea
            placeholder="粘贴目标岗位的 JD（职位描述），AI 将根据岗位要求优化简历..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[120px] resize-none"
            style={{
              borderRadius: '6px',
              borderColor: COLORS.border,
              backgroundColor: COLORS.surface,
              color: COLORS.text,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
          <p className="mt-2 text-xs" style={{ color: COLORS.textMuted }}>
            提供 JD 可以让 AI 更好地匹配岗位关键词和技能要求
          </p>
        </CardContent>
      )}
    </Card>
  );
}
