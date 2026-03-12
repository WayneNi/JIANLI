"use client";

import { useState } from 'react';
import { FileSearch, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

const COLORS = {
  primary: '#1a1f2e',
  secondary: '#2d3548',
  accent: '#c9a227',
  surface: '#faf9f7',
  surfaceDark: '#f0ede8',
  textMuted: '#6b7280',
};

export function JobDescriptionInput({
  value,
  onChange,
}: JobDescriptionInputProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card style={{ borderRadius: '8px', border: 'none', backgroundColor: COLORS.surfaceDark }}>
      <CardHeader
        className="cursor-pointer py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center gap-2 text-base" style={{ color: COLORS.primary }}>
          <div
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.accent}15` }}
          >
            <FileSearch className="h-4 w-4" style={{ color: COLORS.accent }} />
          </div>
          目标岗位描述（可选）
          {isExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4" style={{ color: COLORS.textMuted }} />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4" style={{ color: COLORS.textMuted }} />
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
              borderColor: COLORS.surface,
              backgroundColor: COLORS.surface,
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
