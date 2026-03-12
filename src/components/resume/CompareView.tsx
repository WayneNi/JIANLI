"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  FileText,
  ArrowRight,
  MoveHorizontal,
  X,
} from 'lucide-react';
import type { OptimizedResume } from '@/types/resume';

interface CompareViewProps {
  originalText: string;
  optimizedResume: OptimizedResume;
  onClose: () => void;
}

const COLORS = {
  primary: '#1a1f2e',
  secondary: '#2d3548',
  accent: '#c9a227',
  accentLight: '#e8d48a',
  surface: '#faf9f7',
  surfaceDark: '#f0ede8',
  textMuted: '#6b7280',
  success: '#059669',
};

export function CompareView({
  originalText,
  optimizedResume,
  onClose,
}: CompareViewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  // Parse original text into sections (basic parsing)
  const parseOriginalResume = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim());

    // Try to identify sections
    const sections: Record<string, string[]> = {
      summary: [],
      experience: [],
      skills: [],
      education: [],
    };

    let currentSection = 'summary';
    const sectionKeywords: Record<string, string[]> = {
      summary: ['简介', 'summary', '关于'],
      experience: ['工作', '经历', 'experience', 'job'],
      skills: ['技能', 'skills', '技术'],
      education: ['教育', 'education', '学历'],
    };

    for (const line of lines) {
      // Check if line is a section header
      let foundSection = false;
      for (const [section, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.some((kw) => line.toLowerCase().includes(kw))) {
          currentSection = section;
          foundSection = true;
          break;
        }
      }

      if (!foundSection) {
        sections[currentSection].push(line);
      }
    }

    return sections;
  };

  const original = parseOriginalResume(originalText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
        style={{ borderRadius: '12px' }}
      >
        <CardHeader
          className="flex flex-row items-center justify-between"
          style={{ backgroundColor: COLORS.surface }}
        >
          <CardTitle
            className="flex items-center gap-2"
            style={{ color: COLORS.primary }}
          >
            <MoveHorizontal className="h-5 w-5" style={{ color: COLORS.accent }} />
            对比预览
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent
          className="overflow-y-auto p-6"
          style={{ backgroundColor: COLORS.surface }}
        >
          {/* Header info */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#fee2e2' }}>
              <FileText className="h-6 w-6 mx-auto mb-2" style={{ color: '#dc2626' }} />
              <p className="font-medium" style={{ color: '#dc2626' }}>
                原始简历
              </p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#dcfce7' }}>
              <Sparkles className="h-6 w-6 mx-auto mb-2" style={{ color: COLORS.success }} />
              <p className="font-medium" style={{ color: COLORS.success }}>
                优化后
              </p>
            </div>
          </div>

          {/* Comparison content */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original */}
            <div className="space-y-4">
              <h3
                className="font-semibold flex items-center gap-2"
                style={{ color: '#dc2626' }}
              >
                <FileText className="h-4 w-4" />
                原始内容
              </h3>

              {/* Summary */}
              <div className="rounded-lg border p-4" style={{ borderColor: '#fee2e2' }}>
                <p className="text-xs font-medium uppercase mb-2" style={{ color: '#dc2626' }}>
                  个人简介
                </p>
                <div className="text-sm space-y-2" style={{ color: COLORS.secondary }}>
                  {original.summary.length > 0 ? (
                    original.summary.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))
                  ) : (
                    <p className="italic" style={{ color: COLORS.textMuted }}>
                      未能识别个人简介
                    </p>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div className="rounded-lg border p-4" style={{ borderColor: '#fee2e2' }}>
                <p className="text-xs font-medium uppercase mb-2" style={{ color: '#dc2626' }}>
                  工作经历
                </p>
                <div className="text-sm space-y-2" style={{ color: COLORS.secondary }}>
                  {original.experience.length > 0 ? (
                    original.experience.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))
                  ) : (
                    <p className="italic" style={{ color: COLORS.textMuted }}>
                      未能识别工作经历
                    </p>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="rounded-lg border p-4" style={{ borderColor: '#fee2e2' }}>
                <p className="text-xs font-medium uppercase mb-2" style={{ color: '#dc2626' }}>
                  技能
                </p>
                <div className="flex flex-wrap gap-1">
                  {original.skills.length > 0 ? (
                    original.skills.map((skill, i) => (
                      <Badge
                        key={i}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          borderRadius: '4px',
                        }}
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="italic text-sm" style={{ color: COLORS.textMuted }}>
                      未能识别技能
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Optimized */}
            <div className="space-y-4">
              <h3
                className="font-semibold flex items-center gap-2"
                style={{ color: COLORS.success }}
              >
                <Sparkles className="h-4 w-4" />
                优化内容
              </h3>

              {/* Summary */}
              <div className="rounded-lg border p-4" style={{ borderColor: '#dcfce7' }}>
                <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.success }}>
                  个人简介
                </p>
                <p className="text-sm" style={{ color: COLORS.primary }}>
                  {optimizedResume.summary}
                </p>
              </div>

              {/* Experience */}
              <div className="rounded-lg border p-4" style={{ borderColor: '#dcfce7' }}>
                <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.success }}>
                  工作经历
                </p>
                <div className="space-y-4">
                  {optimizedResume.experience.map((exp, i) => (
                    <div key={i} className="rounded p-3" style={{ backgroundColor: '#f0fdf4' }}>
                      <p className="font-medium text-sm" style={{ color: COLORS.primary }}>
                        {exp.position} @ {exp.company}
                      </p>
                      <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                        {exp.duration}
                      </p>
                      {exp.starFormatted && (
                        <p className="text-sm" style={{ color: COLORS.success }}>
                          {exp.starFormatted}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="rounded-lg border p-4" style={{ borderColor: '#dcfce7' }}>
                <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.success }}>
                  技能
                </p>
                <div className="flex flex-wrap gap-2">
                  {optimizedResume.skills.technical.map((skill, i) => (
                    <Badge
                      key={i}
                      style={{
                        backgroundColor: '#dcfce7',
                        color: COLORS.success,
                        borderRadius: '4px',
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Improvement highlights */}
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: `${COLORS.accent}15` }}>
            <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
              优化亮点
            </h4>
            <ul className="space-y-2 text-sm" style={{ color: COLORS.secondary }}>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5" style={{ color: COLORS.accent }} />
                <span>应用 STAR 法则重构工作经历，描述更具说服力</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5" style={{ color: COLORS.accent }} />
                <span>补充量化数据，用数字证明你的能力</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5" style={{ color: COLORS.accent }} />
                <span>使用主动动词，提升专业形象</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
