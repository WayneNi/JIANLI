"use client";

import { useState } from 'react';
import { FileSearch, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

// Black & Gold Theme
const COLORS = {
  darkBg: '#050508',
  darkSurface: '#0a0a10',
  darkElevated: '#12121a',
  gold: '#c9a227',
  goldLight: '#e8d48a',
  goldDark: '#8b7019',
  text: '#ffffff',
  textMuted: '#888888',
  textDim: '#555555',
  success: '#059669',
  border: '#1a1a24',
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
            style={{ backgroundColor: `${COLORS.gold}15`, border: `1px solid ${COLORS.gold}30` }}
          >
            <FileSearch className="h-4 w-4" style={{ color: COLORS.gold }} />
          </div>
          目标岗位描述（可选）
          {isExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4" style={{ color: COLORS.gold }} />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4" style={{ color: COLORS.gold }} />
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
              backgroundColor: COLORS.darkSurface,
              color: COLORS.text,
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
