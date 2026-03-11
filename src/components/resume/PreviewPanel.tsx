"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Briefcase,
  GraduationCap,
  Wrench,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  OptimizedResume,
  OptimizeStatus,
  StreamChunk,
} from '@/types/resume';
import { STATUS_MESSAGES } from '@/lib/ai-prompts';

interface PreviewPanelProps {
  isOptimizing: boolean;
  streamData: StreamChunk[];
  status: OptimizeStatus;
}

export function PreviewPanel({
  isOptimizing,
  streamData,
  status,
}: PreviewPanelProps) {
  const [optimizedResume, setOptimizedResume] =
    useState<OptimizedResume | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    experience: true,
    skills: true,
    education: true,
  });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find done chunk with data
    const doneChunk = streamData.find(
      (chunk) => chunk.type === 'done' && chunk.data
    );
    if (doneChunk?.data) {
      setOptimizedResume(doneChunk.data);
    }
  }, [streamData]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getStatusProgress = () => {
    switch (status) {
      case 'parsing':
        return 20;
      case 'analyzing':
        return 40;
      case 'optimizing':
        return 70;
      case 'formatting':
        return 90;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  if (!isOptimizing && !optimizedResume) {
    return (
      <Card className="h-full min-h-[400px] border-2 border-dashed border-gray-200">
        <CardContent className="flex h-full items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <Sparkles className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>上传简历后，将显示优化预览</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full min-h-[400px]">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-500" />
            优化预览
          </CardTitle>
          {isOptimizing && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {STATUS_MESSAGES[status] || '处理中...'}
            </Badge>
          )}
        </div>
        {isOptimizing && (
          <Progress value={getStatusProgress()} className="mt-2 h-2" />
        )}
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto p-4" ref={contentRef}>
        {optimizedResume ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-800">个人简介</h3>
              <p className="text-gray-700">{optimizedResume.summary}</p>
            </div>

            {/* Experience */}
            <div>
              <button
                onClick={() => toggleSection('experience')}
                className="mb-2 flex w-full items-center justify-between rounded-lg bg-blue-50 p-3 text-left font-semibold text-blue-800 hover:bg-blue-100"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  工作经历 ({optimizedResume.experience.length})
                </div>
                {expandedSections.experience ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.experience && (
                <div className="mt-2 space-y-4">
                  {optimizedResume.experience.map((exp, index) => (
                    <div key={index} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <p className="font-medium">{exp.position}</p>
                          <p className="text-sm text-gray-600">
                            {exp.company} · {exp.duration}
                          </p>
                        </div>
                      </div>
                      {exp.description && (
                        <div className="mb-2 rounded bg-gray-50 p-2">
                          <p className="mb-1 text-xs font-medium uppercase text-gray-500">
                            原始描述
                          </p>
                          <p className="text-sm text-gray-600">{exp.description}</p>
                        </div>
                      )}
                      {exp.starFormatted && (
                        <div className="rounded bg-green-50 p-2">
                          <p className="mb-1 text-xs font-medium uppercase text-green-600">
                            STAR 优化
                          </p>
                          <p className="text-sm text-green-700">{exp.starFormatted}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills */}
            <div>
              <button
                onClick={() => toggleSection('skills')}
                className="mb-2 flex w-full items-center justify-between rounded-lg bg-green-50 p-3 text-left font-semibold text-green-800 hover:bg-green-100"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  技能 ({optimizedResume.skills.technical.length})
                </div>
                {expandedSections.skills ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.skills && (
                <div className="mt-2 space-y-2">
                  {optimizedResume.skills.technical.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase text-gray-500">
                        技术技能
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {optimizedResume.skills.technical.map((skill, i) => (
                          <Badge key={i} variant="outline" className="bg-white">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {optimizedResume.skills.soft && optimizedResume.skills.soft.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase text-gray-500">
                        软技能
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {optimizedResume.skills.soft.map((skill, i) => (
                          <Badge key={i} variant="outline" className="bg-white">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Education */}
            <div>
              <button
                onClick={() => toggleSection('education')}
                className="mb-2 flex w-full items-center justify-between rounded-lg bg-orange-50 p-3 text-left font-semibold text-orange-800 hover:bg-orange-100"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  教育背景 ({optimizedResume.education.length})
                </div>
                {expandedSections.education ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.education && (
                <div className="mt-2 space-y-2">
                  {optimizedResume.education.map((edu, index) => (
                    <div key={index} className="rounded border p-3">
                      <p className="font-medium">{edu.school}</p>
                      <p className="text-sm text-gray-600">
                        {edu.degree} · {edu.duration}
                        {edu.gpa && ` · GPA: ${edu.gpa}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show streaming content as it arrives */}
            {streamData
              .filter((chunk) => chunk.type === 'content')
              .map((chunk, index) => (
                <div key={index} className="animate-pulse text-gray-600">
                  {chunk.content}
                </div>
              ))}
            {streamData.filter((chunk) => chunk.type === 'content').length ===
              0 && (
              <div className="space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
