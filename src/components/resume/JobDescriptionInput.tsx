"use client";

import { useState } from 'react';
import { FileSearch, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobDescriptionInput({
  value,
  onChange,
}: JobDescriptionInputProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card>
      <CardHeader className="cursor-pointer pb-2" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSearch className="h-4 w-4 text-blue-500" />
          目标岗位描述（可选）
          {isExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <Textarea
            placeholder="粘贴目标岗位的 JD（职位描述），AI 将根据岗位要求优化简历..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <p className="mt-2 text-xs text-gray-500">
            提供 JD 可以让 AI 更好地匹配岗位关键词和技能要求
          </p>
        </CardContent>
      )}
    </Card>
  );
}
