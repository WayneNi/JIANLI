"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, Check, Mail, Edit2, Save, X } from 'lucide-react';
import { COLORS } from '@/lib/theme/colors';

interface CoverLetterProps {
  resumeText: string;
  jobDescription: string;
}

interface CoverLetterData {
  subject: string;
  content: string;
}

export function CoverLetterGenerator({ resumeText, jobDescription }: CoverLetterProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState<CoverLetterData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCoverLetter = async () => {
    if (!jobDescription.trim()) {
      setError('请先填写目标岗位 JD');
      return;
    }

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
          action: 'coverLetter',
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
      let coverLetterReceived = false;

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
              if (parsed.coverLetter) {
                setCoverLetter(parsed.coverLetter);
                coverLetterReceived = true;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Try to parse as JSON if not already set
      if (!coverLetterReceived && fullContent) {
        try {
          // Enhanced cleaning function
          let cleaned = fullContent;

          // Remove all markdown code blocks with various language tags
          cleaned = cleaned.replace(/```(?:json|javascript|js|python)?\n?/g, '');
          cleaned = cleaned.replace(/```\n?/g, '');

          // Try to extract JSON object
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleaned = jsonMatch[0];
            // Fix common JSON issues (trailing commas)
            cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
          }

          const parsed = JSON.parse(cleaned);
          if (parsed.subject || parsed.content) {
            setCoverLetter(parsed);
          }
        } catch {
          // If parsing fails, try to extract plain text content
          const plainText = fullContent
            .replace(/```[\s\S]*?```/g, '')  // Remove all code blocks
            .replace(/^.*\{/, '{')  // Remove anything before first {
            .replace(/\}.*$/, '}')  // Remove anything after last }
            .replace(/```/g, '')  // Remove any remaining backticks
            .trim();

          // If still has content, use it; otherwise use raw content
          const finalContent = plainText.length > 10 ? plainText : fullContent
            .replace(/```[\s\S]*?```/g, '')
            .replace(/```/g, '')
            .trim();

          setCoverLetter({
            subject: '求职信',
            content: finalContent,
          });
        }
      }
    } catch (err) {
      console.error('Cover letter generation error:', err);
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (coverLetter?.content) {
      navigator.clipboard.writeText(coverLetter.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startEdit = () => {
    setEditContent(coverLetter?.content || '');
    setIsEditing(true);
  };

  const saveEdit = () => {
    setCoverLetter((prev) => (prev ? { ...prev, content: editContent } : null));
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  return (
    <Card className="mt-4" style={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: COLORS.primary }}>
            <Mail className="h-4 w-4" style={{ color: COLORS.accent }} />
            求职信生成
          </CardTitle>
          <Button
            size="sm"
            onClick={generateCoverLetter}
            disabled={isGenerating || !jobDescription.trim()}
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
                <Mail className="h-3 w-3" />
                生成求职信
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

        {!jobDescription.trim() && !coverLetter && (
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            请先填写目标岗位 JD，然后点击生成求职信
          </p>
        )}

        {coverLetter && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                主题
              </p>
              <p className="font-medium" style={{ color: COLORS.primary }}>
                {coverLetter.subject}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  正文
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-6 px-2"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" style={{ color: COLORS.success }} />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startEdit}
                      className="h-6 px-2"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" onClick={saveEdit} className="h-6 px-2 gap-1">
                        <Save className="h-3 w-3" /> 保存
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                        className="h-6 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[200px]"
                  placeholder="编辑求职信内容..."
                />
              ) : (
                <div
                  className="p-4 rounded-lg whitespace-pre-wrap text-sm"
                  style={{ backgroundColor: COLORS.surfaceElevated, color: COLORS.text }}
                >
                  {coverLetter.content}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
