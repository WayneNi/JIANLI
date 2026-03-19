"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface InterviewQuestionsProps {
  resumeText: string;
  jobDescription?: string;
}

interface InterviewQuestion {
  experience: string;
  questions: Array<{
    question: string;
    keyPoints: string[];
  }>;
}

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

export function InterviewQuestionsGenerator({ resumeText, jobDescription }: InterviewQuestionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [expandedExp, setExpandedExp] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const generateQuestions = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          action: 'interviewQuestions',
        }),
      });

      if (!response.ok) {
        throw new Error('生成失败，请重试');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to read response');
      }

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
              }
              if (parsed.interviewQuestions) {
                setQuestions(parsed.interviewQuestions);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Try to parse if not already set
      if (questions.length === 0 && fullContent) {
        try {
          const cleaned = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          const parsed = JSON.parse(cleaned);
          if (parsed.questions && Array.isArray(parsed.questions)) {
            setQuestions(parsed.questions);
          }
        } catch {
          // Ignore parse errors
        }
      }
    } catch (err) {
      console.error('Interview questions generation error:', err);
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExp = (index: number) => {
    setExpandedExp((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <Card className="mt-4" style={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: COLORS.primary }}>
            <MessageSquare className="h-4 w-4" style={{ color: COLORS.accent }} />
            面试问题预测
          </CardTitle>
          <Button
            size="sm"
            onClick={generateQuestions}
            disabled={isGenerating}
            className="gap-1"
            style={{ backgroundColor: COLORS.primary, borderRadius: '4px' }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <MessageSquare className="h-3 w-3" />
                生成问题
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm mb-3" style={{ color: '#dc2626' }}>
            {error}
          </p>
        )}

        {questions.length === 0 && !isGenerating && !error && (
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            点击生成针对简历中工作经历的模拟面试问题
          </p>
        )}

        {questions.length > 0 && (
          <div className="space-y-3">
            {questions.map((exp, expIndex) => (
              <div
                key={expIndex}
                className="rounded-lg border"
                style={{ borderColor: COLORS.border }}
              >
                <button
                  onClick={() => toggleExp(expIndex)}
                  className="w-full flex items-center justify-between p-3 text-left"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <span className="font-medium text-sm" style={{ color: COLORS.primary }}>
                    {exp.experience || `经历 ${expIndex + 1}`}
                  </span>
                  {expandedExp[expIndex] ? (
                    <ChevronUp className="h-4 w-4" style={{ color: COLORS.textMuted }} />
                  ) : (
                    <ChevronDown className="h-4 w-4" style={{ color: COLORS.textMuted }} />
                  )}
                </button>

                {expandedExp[expIndex] && (
                  <div className="p-3 pt-0 space-y-3" style={{ backgroundColor: COLORS.surface }}>
                    {exp.questions?.map((q, qIndex) => (
                      <div
                        key={qIndex}
                        className="rounded-lg p-3"
                        style={{ backgroundColor: `${COLORS.accent}10` }}
                      >
                        <p className="font-medium text-sm mb-2" style={{ color: COLORS.primary }}>
                          Q{qIndex + 1}: {q.question}
                        </p>
                        {q.keyPoints && q.keyPoints.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1" style={{ color: COLORS.success }}>
                              参考要点
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {q.keyPoints.map((point, pIndex) => (
                                <Badge
                                  key={pIndex}
                                  style={{
                                    backgroundColor: '#dcfce7',
                                    color: '#16a34a',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                  }}
                                >
                                  {point}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
