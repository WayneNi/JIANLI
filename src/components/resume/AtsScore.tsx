"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
} from 'lucide-react';

interface AtsScoreProps {
  score: number;
  issues: Array<{
    category: string;
    severity: string;
    message: string;
  }>;
  suggestions: string[];
}

const COLORS = {
  primary: '#1a1f2e',
  secondary: '#2d3548',
  accent: '#c9a227',
  success: '#059669',
  warning: '#f59e0b',
  error: '#dc2626',
};

export function AtsScore({ score, issues, suggestions }: AtsScoreProps) {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return COLORS.success;
      case 'B':
        return '#22c55e';
      case 'C':
        return COLORS.warning;
      case 'D':
        return '#f97316';
      default:
        return COLORS.error;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return COLORS.error;
      case 'medium':
        return COLORS.warning;
      default:
        return COLORS.primary;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-4 w-4" style={{ color: COLORS.error }} />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" style={{ color: COLORS.warning }} />;
      default:
        return <CheckCircle className="h-4 w-4" style={{ color: COLORS.primary }} />;
    }
  };

  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  return (
    <Card
      className="mt-4"
      style={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.accent}15` }}
          >
            <Target className="h-5 w-5" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: COLORS.primary }}>
              ATS 友好度检测
            </h3>
            <p className="text-xs" style={{ color: COLORS.secondary }}>
              机筛系统兼容性评分
            </p>
          </div>
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-center gap-4 mb-4 p-4 rounded-lg" style={{ backgroundColor: `${getGradeColor(grade)}10` }}>
          <div className="text-center">
            <p
              className="font-display text-4xl font-bold"
              style={{ color: getGradeColor(grade) }}
            >
              {grade}
            </p>
            <p className="text-xs" style={{ color: COLORS.secondary }}>
              等级
            </p>
          </div>
          <div
            className="h-12 w-px"
            style={{ backgroundColor: getGradeColor(grade) }}
          />
          <div className="text-center">
            <p
              className="font-display text-4xl font-bold"
              style={{ color: getGradeColor(grade) }}
            >
              {score}
            </p>
            <p className="text-xs" style={{ color: COLORS.secondary }}>
              / 100
            </p>
          </div>
        </div>

        {/* Issues */}
        {issues && issues.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.secondary }}>
              发现问题 ({issues.length})
            </p>
            <div className="space-y-2">
              {issues.slice(0, 4).map((issue, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded"
                  style={{
                    backgroundColor: `${getSeverityColor(issue.severity)}10`,
                  }}
                >
                  {getSeverityIcon(issue.severity)}
                  <div>
                    <p className="text-xs font-medium" style={{ color: getSeverityColor(issue.severity) }}>
                      {issue.category === 'format' && '格式问题'}
                      {issue.category === 'keyword' && '关键词'}
                      {issue.category === 'structure' && '结构问题'}
                      {issue.category === 'content' && '内容问题'}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.secondary }}>
                      {issue.message}
                    </p>
                  </div>
                </div>
              ))}
              {issues.length > 4 && (
                <p className="text-xs text-center" style={{ color: COLORS.secondary }}>
                  还有 {issues.length - 4} 个问题...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.secondary }}>
              优化建议
            </p>
            <div className="space-y-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded"
                  style={{ backgroundColor: `${COLORS.success}10` }}
                >
                  <Lightbulb className="h-4 w-4 flex-shrink-0" style={{ color: COLORS.success }} />
                  <p className="text-xs" style={{ color: COLORS.secondary }}>
                    {suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
