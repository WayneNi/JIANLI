"use client";

import { useState } from 'react';
import { MessageSquare, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GreetingMessageProps {
  resumeText: string;
  jobDescription: string;
  onGenerate?: (message: string) => void;
}

export function GreetingMessage({ resumeText, jobDescription, onGenerate }: GreetingMessageProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/greeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      const data = await response.json();
      setMessage(data.message);
      onGenerate?.(data.message);
    } catch (error) {
      console.error('Failed to generate greeting:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!message) return;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!jobDescription.trim()) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="w-4 h-4" />
          打招呼语
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {message ? (
          <>
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
              "{message}"
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制到剪贴板
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !jobDescription.trim()}
            variant="outline"
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                生成打招呼语
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
