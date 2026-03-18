"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Required for streaming data processing */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Briefcase,
  GraduationCap,
  Wrench,
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
  AlertCircle,
  Lightbulb,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import type {
  OptimizedResume,
  OptimizeStatus,
  StreamChunk,
  ResumeSuggestion,
  AtsCheckResult,
} from '@/types/resume';
import { STATUS_MESSAGES } from '@/lib/ai-prompts';
import { AtsScore } from './AtsScore';

interface PreviewPanelProps {
  isOptimizing: boolean;
  streamData: StreamChunk[];
  status: OptimizeStatus;
  resume?: OptimizedResume | null;
}

// Design tokens - Black & Gold Luxury Theme
const COLORS = {
  darkBg: '#050508',
  darkSurface: '#0a0a10',
  darkElevated: '#12121a',
  gold: '#c9a227',
  goldLight: '#e8d48a',
  goldBright: '#ffd700',
  goldDark: '#8b7019',
  text: '#ffffff',
  textMuted: '#888888',
  textDim: '#555555',
  success: '#059669',
  border: '#1a1a24',
};

export function PreviewPanel({
  isOptimizing,
  streamData,
  status,
  resume: resumeProp,
}: PreviewPanelProps) {
  const [optimizedResume, setOptimizedResume] =
    useState<OptimizedResume | null>(resumeProp || null);
  const [suggestion, setSuggestion] = useState<ResumeSuggestion | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    experience: true,
    skills: true,
    education: true,
    suggestion: true,
  });
  const contentRef = useRef<HTMLDivElement>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // ATS state
  const [atsCheck, setAtsCheck] = useState<AtsCheckResult | null>(null);

  // Update from prop when it changes (for tab switching)
  useEffect(() => {
    if (resumeProp && !isOptimizing) {
      setOptimizedResume(resumeProp);
    }
  }, [resumeProp, isOptimizing]);

  // Process streaming data
  useEffect(() => {
    // Check for ATS first
    const atsChunk = streamData.find(
      (chunk) => chunk.type === 'ats' && chunk.atsCheck
    );
    if (atsChunk?.atsCheck && !atsCheck) {
      setAtsCheck(atsChunk.atsCheck);
    }

    // Check for suggestion first
    const suggestionChunk = streamData.find(
      (chunk) => chunk.type === 'suggestion' && chunk.suggestion
    );
    if (suggestionChunk?.suggestion && !suggestion) {
      setSuggestion(suggestionChunk.suggestion);
    }

    // Then check for done chunk
    const doneChunk = streamData.find(
      (chunk) => chunk.type === 'done' && chunk.data
    );
    if (doneChunk?.data && !optimizedResume) {
      setOptimizedResume(doneChunk.data);
    }
  }, [streamData, atsCheck, suggestion, optimizedResume]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Editing handlers
  const startEdit = (section: string, index?: number, value?: string) => {
    setIsEditing(true);
    setEditingSection(section);
    setEditingIndex(index ?? null);
    setEditValue(value || '');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingSection(null);
    setEditingIndex(null);
    setEditValue('');
  };

  const saveEdit = () => {
    if (!optimizedResume || !editingSection) return;

    const updated = { ...optimizedResume };

    switch (editingSection) {
      case 'summary':
        updated.summary = editValue;
        break;
      case 'experience':
        if (editingIndex !== null && updated.experience[editingIndex]) {
          updated.experience = [...updated.experience];
          updated.experience[editingIndex] = {
            ...updated.experience[editingIndex],
            starFormatted: editValue,
          };
        }
        break;
      case 'skills':
        updated.skills = {
          ...updated.skills,
          technical: editValue.split(',').map((s) => s.trim()).filter(Boolean),
        };
        break;
    }

    setOptimizedResume(updated);
    cancelEdit();
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
      <Card
        className="flex flex-col h-full glass-card"
        style={{
          borderRadius: '12px',
          maxHeight: '70vh',
          backgroundColor: COLORS.darkSurface,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <CardContent
          className="flex flex-1 flex-col items-center justify-center p-10"
          style={{ backgroundColor: COLORS.darkSurface }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `${COLORS.gold}15` }}
          >
            <FileText
              className="h-10 w-10"
              style={{ color: COLORS.gold }}
            />
          </div>
          <p className="text-lg font-medium mb-2 text-white">
            等待上传简历
          </p>
          <p className="text-sm text-center max-w-xs" style={{ color: COLORS.textMuted }}>
            上传简历后，AI 将自动分析并优化内容
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="flex flex-col h-full glass-card"
      style={{
        borderRadius: '12px',
        maxHeight: '70vh',
        backgroundColor: COLORS.darkSurface,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <CardHeader
        className="border-b flex-shrink-0"
        style={{ borderColor: COLORS.border, backgroundColor: COLORS.darkElevated }}
      >
        <div className="flex items-center justify-between">
          <CardTitle
            className="flex items-center gap-2 text-lg font-display"
            style={{ color: COLORS.text }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${COLORS.gold}15`, border: `1px solid ${COLORS.gold}30` }}
            >
              <Sparkles className="h-4 w-4" style={{ color: COLORS.gold }} />
            </div>
            优化预览
          </CardTitle>
          {isOptimizing && (
            <Badge
              style={{
                backgroundColor: `${COLORS.gold}15`,
                color: COLORS.gold,
                borderRadius: '4px',
                border: `1px solid ${COLORS.gold}30`,
              }}
            >
              {STATUS_MESSAGES[status] || '处理中...'}
            </Badge>
          )}
        </div>
        {isOptimizing && (
          <Progress
            value={getStatusProgress()}
            className="mt-3 h-1.5"
            style={{
              backgroundColor: COLORS.darkSurface,
            }}
          />
        )}
      </CardHeader>
      <CardContent
        className="flex-1 overflow-y-auto p-4"
        ref={contentRef}
        style={{ backgroundColor: COLORS.darkSurface }}
      >
        {/* Suggestion Section */}
        {suggestion && (
          <div className="mb-6 space-y-4">
            <button
              onClick={() => toggleSection('suggestion')}
              className="mb-3 flex w-full items-center justify-between rounded-lg p-3 transition-colors"
              style={{
                backgroundColor: `${COLORS.gold}15`,
                color: COLORS.text,
                border: `1px solid ${COLORS.gold}30`,
              }}
            >
              <div className="flex items-center gap-2 font-medium">
                <Target className="h-4 w-4" style={{ color: COLORS.gold }} />
                简历改善建议
              </div>
              {expandedSections.suggestion ? (
                <ChevronUp className="h-4 w-4" style={{ color: COLORS.gold }} />
              ) : (
                <ChevronDown className="h-4 w-4" style={{ color: COLORS.gold }} />
              )}
            </button>

            {expandedSections.suggestion && (
              <div className="space-y-3 pl-2">
                {/* Match Score */}
                {suggestion.matchScore > 0 ? (
                  <div className="flex items-center gap-4 p-4 rounded-lg glass-card" style={{ backgroundColor: COLORS.darkElevated }}>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: COLORS.textMuted }}>
                        JD 匹配度
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="font-display text-3xl font-bold"
                          style={{
                            color: suggestion.matchScore >= 70 ? COLORS.success : suggestion.matchScore >= 50 ? '#f59e0b' : '#dc2626'
                          }}
                        >
                          {suggestion.matchScore}
                        </span>
                        <span className="text-lg" style={{ color: COLORS.textMuted }}>/ 100</span>
                      </div>
                    </div>
                    <Progress
                      value={suggestion.matchScore}
                      className="h-2 w-24"
                      style={{
                        backgroundColor: COLORS.darkSurface,
                      }}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg p-4" style={{ backgroundColor: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}30` }}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.gold }} />
                      <p className="text-sm" style={{ color: COLORS.text }}>
                        {suggestion.gapAnalysis
                          ? 'JD匹配度分析生成失败，请重试或稍后再试'
                          : '未填写目标岗位JD，请填写后可获得详细的匹配度分析和改善建议'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Gap Analysis */}
                {suggestion.gapAnalysis && (
                  <div className="rounded-lg p-4" style={{ backgroundColor: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}30` }}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.gold }} />
                      <div>
                        <p className="text-xs font-medium uppercase mb-1" style={{ color: COLORS.gold }}>
                          差距分析
                        </p>
                        <p className="text-sm" style={{ color: COLORS.textMuted }}>
                          {suggestion.gapAnalysis}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skill Gaps */}
                {suggestion.skillGaps && suggestion.skillGaps.length > 0 && (
                  <div className="rounded-lg p-4" style={{ backgroundColor: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}30` }}>
                    <div className="flex items-start gap-2">
                      <Wrench className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.gold }} />
                      <div>
                        <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.gold }}>
                          技能缺口
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestion.skillGaps.map((skill, i) => (
                            <Badge
                              key={i}
                              style={{
                                backgroundColor: `${COLORS.gold}15`,
                                color: COLORS.gold,
                                borderRadius: '4px',
                                border: `1px solid ${COLORS.gold}30`,
                              }}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Experience Suggestions */}
                {suggestion.experienceSuggestions && suggestion.experienceSuggestions.length > 0 && (
                  <div className="rounded-lg p-4" style={{ backgroundColor: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}30` }}>
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.gold }} />
                      <div>
                        <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.gold }}>
                          经历建议
                        </p>
                        <div className="space-y-2">
                          {suggestion.experienceSuggestions.map((exp, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Badge
                                style={{
                                  backgroundColor: exp.type === 'add' ? `${COLORS.success}20` : exp.type === 'emphasize' ? `${COLORS.gold}20` : '#dc262620',
                                  color: exp.type === 'add' ? COLORS.success : exp.type === 'emphasize' ? COLORS.gold : '#dc2626',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  border: `1px solid ${exp.type === 'add' ? COLORS.success : exp.type === 'emphasize' ? COLORS.gold : '#dc2626'}40`,
                                }}
                              >
                                {exp.type === 'add' ? '新增' : exp.type === 'emphasize' ? '强化' : '弱化'}
                              </Badge>
                              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                                {exp.suggestion}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Plan */}
                {suggestion.actionPlan && suggestion.actionPlan.length > 0 && (
                  <div className="rounded-lg p-4" style={{ backgroundColor: `${COLORS.success}10`, border: `1px solid ${COLORS.success}30` }}>
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.success }} />
                      <div>
                        <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.success }}>
                          执行方向
                        </p>
                        <ul className="space-y-1">
                          {suggestion.actionPlan.map((action, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-sm font-medium" style={{ color: COLORS.text }}>
                                {i + 1}.
                              </span>
                              <span className="text-sm" style={{ color: COLORS.textMuted }}>
                                {action}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {optimizedResume ? (
          <div className="space-y-4">
            {/* Summary */}
            <div
              className="rounded-lg p-4 glass-card"
              style={{ backgroundColor: COLORS.darkElevated, border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3
                  className="font-semibold flex items-center gap-2"
                  style={{ color: COLORS.text }}
                >
                  <Sparkles className="h-4 w-4" style={{ color: COLORS.gold }} />
                  个人简介
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startEdit('summary', 0, optimizedResume.summary)
                  }
                  className="h-6 px-2"
                  style={{ color: COLORS.gold }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              {isEditing && editingSection === 'summary' ? (
                <div className="space-y-2">
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="min-h-[100px]"
                    placeholder="编辑个人简介..."
                    style={{ backgroundColor: COLORS.darkSurface, color: COLORS.text, borderColor: COLORS.border }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} className="gap-1" style={{ backgroundColor: COLORS.gold, color: COLORS.darkBg }}>
                      <Save className="h-3 w-3" /> 保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      className="gap-1"
                      style={{ borderColor: COLORS.border, color: COLORS.textMuted }}
                    >
                      <X className="h-3 w-3" /> 取消
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="leading-7" style={{ color: COLORS.textMuted }}>
                  {optimizedResume.summary}
                </p>
              )}
            </div>

            {/* ATS Score */}
            {atsCheck && <AtsScore score={atsCheck.score} issues={atsCheck.issues} suggestions={atsCheck.suggestions} />}

            {/* Experience */}
            <div>
              <button
                onClick={() => toggleSection('experience')}
                className="mb-3 flex w-full items-center justify-between rounded-lg p-3 transition-colors"
                style={{
                  backgroundColor: `${COLORS.gold}15`,
                  color: COLORS.text,
                  border: `1px solid ${COLORS.gold}30`,
                }}
              >
                <div className="flex items-center gap-2 font-medium">
                  <Briefcase className="h-4 w-4" style={{ color: COLORS.gold }} />
                  工作经历 ({optimizedResume.experience.length})
                </div>
                {expandedSections.experience ? (
                  <ChevronUp className="h-4 w-4" style={{ color: COLORS.gold }} />
                ) : (
                  <ChevronDown className="h-4 w-4" style={{ color: COLORS.gold }} />
                )}
              </button>
              {expandedSections.experience && (
                <div className="mt-3 space-y-4 pl-2">
                  {optimizedResume.experience.map((exp, index) => (
                    <div
                      key={index}
                      className="rounded-lg border p-4 glass-card"
                      style={{
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.darkElevated,
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold" style={{ color: COLORS.text }}>
                            {exp.position}
                          </p>
                          <p className="text-sm" style={{ color: COLORS.textMuted }}>
                            {exp.company} · {exp.duration}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            startEdit('experience', index, exp.starFormatted || exp.description)
                          }
                          className="h-6 px-2"
                          style={{ color: COLORS.gold }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Edit mode for experience */}
                      {isEditing && editingSection === 'experience' && editingIndex === index ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="min-h-[120px]"
                            placeholder="编辑经历描述 (STAR格式)..."
                            style={{ backgroundColor: COLORS.darkSurface, color: COLORS.text, borderColor: COLORS.border }}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} className="gap-1" style={{ backgroundColor: COLORS.gold, color: COLORS.darkBg }}>
                              <Save className="h-3 w-3" /> 保存
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                              className="gap-1"
                              style={{ borderColor: COLORS.border, color: COLORS.textMuted }}
                            >
                              <X className="h-3 w-3" /> 取消
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {exp.description && (
                            <div className="mb-3 rounded p-3" style={{ backgroundColor: COLORS.darkSurface }}>
                              <p
                                className="text-xs font-medium uppercase mb-1"
                                style={{ color: COLORS.textMuted }}
                              >
                                原始描述
                              </p>
                              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                                {exp.description}
                              </p>
                            </div>
                          )}
                          {exp.starFormatted && (
                            <div
                              className="rounded p-3"
                              style={{ backgroundColor: `${COLORS.success}10`, border: `1px solid ${COLORS.success}30` }}
                            >
                              <p
                                className="text-xs font-medium uppercase mb-1 flex items-center gap-1"
                                style={{ color: COLORS.success }}
                              >
                                <Sparkles className="h-3 w-3" />
                                STAR 优化
                              </p>
                              <p className="text-sm" style={{ color: COLORS.text }}>
                                {exp.starFormatted}
                              </p>
                            </div>
                          )}
                        </>
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
                className="mb-3 flex w-full items-center justify-between rounded-lg p-3 transition-colors"
                style={{
                  backgroundColor: `${COLORS.success}15`,
                  color: COLORS.text,
                  border: `1px solid ${COLORS.success}30`,
                }}
              >
                <div className="flex items-center gap-2 font-medium">
                  <Wrench className="h-4 w-4" style={{ color: COLORS.success }} />
                  技能 ({optimizedResume.skills.technical.length})
                </div>
                {expandedSections.skills ? (
                  <ChevronUp className="h-4 w-4" style={{ color: COLORS.success }} />
                ) : (
                  <ChevronDown className="h-4 w-4" style={{ color: COLORS.success }} />
                )}
              </button>
              {expandedSections.skills && (
                <div className="mt-3 space-y-3 pl-2">
                  <div className="flex items-center justify-between">
                    <p
                      className="text-xs font-medium uppercase"
                      style={{ color: COLORS.textMuted }}
                    >
                      技术技能
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        startEdit('skills', 0, optimizedResume.skills.technical.join(', '))
                      }
                      className="h-6 px-2"
                      style={{ color: COLORS.gold }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Edit mode for skills */}
                  {isEditing && editingSection === 'skills' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="min-h-[80px]"
                        placeholder="输入技能，用逗号分隔..."
                        style={{ backgroundColor: COLORS.darkSurface, color: COLORS.text, borderColor: COLORS.border }}
                      />
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>
                        用逗号分隔多个技能
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} className="gap-1" style={{ backgroundColor: COLORS.gold, color: COLORS.darkBg }}>
                          <Save className="h-3 w-3" /> 保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          className="gap-1"
                          style={{ borderColor: COLORS.border, color: COLORS.textMuted }}
                        >
                          <X className="h-3 w-3" /> 取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {optimizedResume.skills.technical.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {optimizedResume.skills.technical.map((skill, i) => (
                            <Badge
                              key={i}
                              style={{
                                backgroundColor: `${COLORS.gold}15`,
                                color: COLORS.gold,
                                borderRadius: '4px',
                                border: `1px solid ${COLORS.gold}30`,
                              }}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {optimizedResume.skills.soft &&
                        optimizedResume.skills.soft.length > 0 && (
                          <div>
                            <p
                              className="text-xs font-medium uppercase mb-2"
                              style={{ color: COLORS.textMuted }}
                            >
                              软技能
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {optimizedResume.skills.soft.map((skill, i) => (
                                <Badge
                                  key={i}
                                  style={{
                                    backgroundColor: `${COLORS.success}15`,
                                    color: COLORS.success,
                                    borderRadius: '4px',
                                    border: `1px solid ${COLORS.success}30`,
                                  }}
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Education */}
            <div>
              <button
                onClick={() => toggleSection('education')}
                className="mb-3 flex w-full items-center justify-between rounded-lg p-3 transition-colors"
                style={{
                  backgroundColor: `${COLORS.gold}15`,
                  color: COLORS.text,
                  border: `1px solid ${COLORS.gold}30`,
                }}
              >
                <div className="flex items-center gap-2 font-medium">
                  <GraduationCap className="h-4 w-4" style={{ color: COLORS.gold }} />
                  教育背景 ({optimizedResume.education.length})
                </div>
                {expandedSections.education ? (
                  <ChevronUp className="h-4 w-4" style={{ color: COLORS.gold }} />
                ) : (
                  <ChevronDown className="h-4 w-4" style={{ color: COLORS.gold }} />
                )}
              </button>
              {expandedSections.education && (
                <div className="mt-3 space-y-2 pl-2">
                  {optimizedResume.education.map((edu, index) => (
                    <div
                      key={index}
                      className="rounded-lg border p-3 glass-card"
                      style={{
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.darkElevated,
                      }}
                    >
                      <p className="font-semibold" style={{ color: COLORS.text }}>
                        {edu.school}
                      </p>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>
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
            {streamData
              .filter((chunk) => chunk.type === 'content')
              .map((chunk, index) => {
                const widths = [60, 75, 80, 65, 70, 85];
                return (
                <div key={index} className="animate-pulse">
                  <div
                    className="h-4 rounded mb-2"
                    style={{
                      backgroundColor: COLORS.darkElevated,
                      width: `${widths[index % widths.length]}%`,
                    }}
                  />
                </div>
              );
              })}
            {streamData.filter((chunk) => chunk.type === 'content').length ===
              0 && (
              <div className="space-y-3">
                <div className="h-4 rounded" style={{ backgroundColor: COLORS.darkElevated, width: '80%' }} />
                <div className="h-4 rounded" style={{ backgroundColor: COLORS.darkElevated, width: '60%' }} />
                <div className="h-4 rounded" style={{ backgroundColor: COLORS.darkElevated, width: '70%' }} />
                <div className="h-4 rounded" style={{ backgroundColor: COLORS.darkElevated, width: '50%' }} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
