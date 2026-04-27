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
  BarChart2,
  Award,
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
import { COLORS } from '@/lib/theme/colors';

// Tab types
type TabId = 'experience' | 'skills-education' | 'ats' | 'suggestions';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: 'suggestions', label: '优化建议', icon: Lightbulb },
  { id: 'experience', label: '工作经历', icon: Briefcase },
  { id: 'skills-education', label: '技能&教育', icon: Award },
  { id: 'ats', label: 'ATS评分', icon: BarChart2 },
];

interface PreviewPanelProps {
  isOptimizing: boolean;
  streamData: StreamChunk[];
  status: OptimizeStatus;
  resume?: OptimizedResume | null;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  resetTrigger?: number;
  hasJobDescription?: boolean;
  suggestionError?: boolean;
}

export function PreviewPanel({
  isOptimizing,
  streamData,
  status,
  resume: resumeProp,
  userName,
  userEmail,
  userAvatar,
  resetTrigger,
  hasJobDescription = false,
  suggestionError = false,
}: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('suggestions');
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

  // Local suggestion error state
  const [localSuggestionError, setLocalSuggestionError] = useState(false);

  // Listen for reset trigger to clear all state when new resume is uploaded
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      setOptimizedResume(null);
      setSuggestion(null);
      setAtsCheck(null);
      setLocalSuggestionError(false);
      setIsEditing(false);
      setEditingSection(null);
      setEditingIndex(null);
      setEditValue('');
    }
  }, [resetTrigger]);

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

    // Check for suggestionError
    const errorChunk = streamData.find(
      (chunk) => chunk.type === 'suggestion' && chunk.suggestionError
    );
    if (errorChunk?.suggestionError !== undefined) {
      setLocalSuggestionError(errorChunk.suggestionError);
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

  // Get ATS grade letter
  const getAtsGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Get ATS grade color
  const getAtsGradeColor = (score: number): string => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return '#f59e0b';
    return '#dc2626';
  };

  // Empty state
  if (!isOptimizing && !optimizedResume) {
    return (
      <Card
        className="flex flex-col h-full glass-card"
        style={{
          borderRadius: '12px',
          maxHeight: '70vh',
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <CardContent
          className="flex flex-1 flex-col items-center justify-center p-10"
          style={{ backgroundColor: COLORS.surface }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `${COLORS.primary}15` }}
          >
            <FileText
              className="h-10 w-10"
              style={{ color: COLORS.primary }}
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

  // Render skeleton for loading state
  const renderSkeleton = () => (
    <div className="space-y-4 p-4">
      {/* Summary skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-slate-700 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
          <div className="h-3 w-24 bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
      {/* ATS cards skeleton */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="h-16 bg-slate-700 rounded-xl animate-pulse" />
        <div className="h-16 bg-slate-700 rounded-xl animate-pulse" />
        <div className="h-16 bg-slate-700 rounded-xl animate-pulse" />
      </div>
      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-slate-700 rounded animate-pulse" style={{ width: '80%' }} />
        <div className="h-4 bg-slate-700 rounded animate-pulse" style={{ width: '60%' }} />
        <div className="h-4 bg-slate-700 rounded animate-pulse" style={{ width: '70%' }} />
      </div>
    </div>
  );

  // Render Experience Tab
  const renderExperienceTab = () => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2" style={{ color: COLORS.text }}>
          <Briefcase className="h-4 w-4" style={{ color: COLORS.primary }} />
          工作经历 ({optimizedResume?.experience.length || 0})
        </h3>
      </div>
      <div className="space-y-4">
        {optimizedResume?.experience.map((exp, index) => (
          <div
            key={index}
            className="rounded-lg border p-4 glass-card"
            style={{
              borderColor: COLORS.border,
              backgroundColor: COLORS.surfaceElevated,
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
                style={{ color: COLORS.primary }}
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
                  style={{ backgroundColor: COLORS.surface, color: COLORS.text, borderColor: COLORS.border }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} className="gap-1" style={{ backgroundColor: COLORS.primary, color: COLORS.bg }}>
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
                  <div className="mb-3 rounded p-3" style={{ backgroundColor: COLORS.surface }}>
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
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.success}10, ${COLORS.success}05)`,
                      border: `1px solid ${COLORS.success}30`,
                      borderLeft: `3px solid ${COLORS.success}`,
                    }}
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
    </div>
  );

  // Render Skills & Education Tab
  const renderSkillsEducationTab = () => (
    <div className="space-y-6">
      {/* Skills Section */}
      <div
        className="rounded-lg p-4 glass-card"
        style={{ backgroundColor: COLORS.surfaceElevated, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: COLORS.text }}>
            <Wrench className="h-4 w-4" style={{ color: COLORS.success }} />
            技能
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              startEdit('skills', 0, optimizedResume?.skills.technical.join(', ') || '')
            }
            className="h-6 px-2"
            style={{ color: COLORS.primary }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>

        {isEditing && editingSection === 'skills' ? (
          <div className="space-y-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-[80px]"
              placeholder="输入技能，用逗号分隔..."
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, borderColor: COLORS.border }}
            />
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              用逗号分隔多个技能
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} className="gap-1" style={{ backgroundColor: COLORS.primary, color: COLORS.bg }}>
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
          <div className="space-y-4">
            {/* Technical Skills */}
            {optimizedResume?.skills.technical && optimizedResume.skills.technical.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.textMuted }}>
                  技术技能
                </p>
                <div className="flex flex-wrap gap-2">
                  {optimizedResume.skills.technical.map((skill, i) => (
                    <Badge
                      key={i}
                      style={{
                        backgroundColor: `${COLORS.primary}15`,
                        color: COLORS.primary,
                        borderRadius: '4px',
                        border: `1px solid ${COLORS.primary}30`,
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {/* Soft Skills */}
            {optimizedResume?.skills.soft && optimizedResume.skills.soft.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.textMuted }}>
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
            {/* Languages */}
            {optimizedResume?.skills.languages && optimizedResume.skills.languages.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.textMuted }}>
                  语言
                </p>
                <div className="flex flex-wrap gap-2">
                  {optimizedResume.skills.languages.map((lang, i) => (
                    <Badge
                      key={i}
                      style={{
                        backgroundColor: `${COLORS.primary}10`,
                        color: COLORS.primary,
                        borderRadius: '4px',
                        border: `1px solid ${COLORS.primary}20`,
                      }}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Education Section */}
      <div
        className="rounded-lg p-4 glass-card"
        style={{ backgroundColor: COLORS.surfaceElevated, border: `1px solid ${COLORS.border}` }}
      >
        <h3 className="font-semibold flex items-center gap-2 mb-3" style={{ color: COLORS.text }}>
          <GraduationCap className="h-4 w-4" style={{ color: COLORS.primary }} />
          教育
        </h3>
        <div className="space-y-3">
          {optimizedResume?.education.map((edu, index) => (
            <div
              key={index}
              className="rounded-lg border p-3"
              style={{
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface,
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
      </div>
    </div>
  );

  // Render ATS Tab
  const renderAtsTab = () => (
    <div>
      {atsCheck ? (
        <AtsScore score={atsCheck.score} issues={atsCheck.issues} suggestions={atsCheck.suggestions} />
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <BarChart2 className="h-12 w-12 mb-3" style={{ color: COLORS.textMuted }} />
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            正在分析 ATS 评分...
          </p>
        </div>
      )}
    </div>
  );

  // Render Suggestions Tab
  const renderSuggestionsTab = () => (
    <div className="space-y-4">
      {/* Error State - takes precedence */}
      {localSuggestionError || suggestionError ? (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: `${COLORS.primary}10`, border: `1px solid ${COLORS.primary}30` }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.primary }} />
            <p className="text-sm" style={{ color: COLORS.text }}>
              简历改善建议生成失败，请重试或稍后再试
            </p>
          </div>
        </div>
      ) : suggestion && suggestion.matchScore > 0 ? (
        /* Match Score */
        <div
          className="rounded-xl p-4"
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.primary}05)`,
            border: `1px solid ${COLORS.primary}30`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium" style={{ color: COLORS.text }}>
              JD 匹配度
            </p>
            <span
              className="font-display text-2xl font-bold"
              style={{
                color: suggestion.matchScore >= 70 ? COLORS.success : suggestion.matchScore >= 50 ? '#f59e0b' : '#dc2626',
              }}
            >
              {suggestion.matchScore}%
            </span>
          </div>
          <Progress
            value={suggestion.matchScore}
            className="h-2"
            style={{
              backgroundColor: COLORS.surface,
            }}
          />
          <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
            {suggestion.gapAnalysis || '继续优化以提高匹配度'}
          </p>
        </div>
      ) : (
        /* No JD State */
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: `${COLORS.primary}10`, border: `1px solid ${COLORS.primary}30` }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.primary }} />
            <p className="text-sm" style={{ color: COLORS.text }}>
              {hasJobDescription
                ? '正在生成优化建议...'
                : '未填写目标岗位JD，请填写后可获得详细的匹配度分析和改善建议'}
            </p>
          </div>
        </div>
      )}

      {/* Skill Gaps */}
      {suggestion && suggestion.skillGaps && suggestion.skillGaps.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: `${COLORS.primary}10`, border: `1px solid ${COLORS.primary}30` }}
        >
          <div className="flex items-start gap-2">
            <Wrench className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.primary }} />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.primary }}>
                技能缺口
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestion.skillGaps.map((skill, i) => (
                  <span
                    key={i}
                    className="mb-1 px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: '#dc262620',
                      color: '#dc2626',
                      border: '1px solid #dc262640',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      display: 'inline-block',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Plan */}
      {suggestion && suggestion.actionPlan && suggestion.actionPlan.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: `${COLORS.success}10`, border: `1px solid ${COLORS.success}30` }}
        >
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.success }} />
            <div>
              <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.success }}>
                优化建议
              </p>
              <ol className="space-y-2">
                {suggestion.actionPlan.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sm font-medium flex-shrink-0" style={{ color: COLORS.success }}>
                      {i + 1}.
                    </span>
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>
                      {action}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Experience Suggestions */}
      {suggestion && suggestion.experienceSuggestions && suggestion.experienceSuggestions.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: `${COLORS.primary}10`, border: `1px solid ${COLORS.primary}30` }}
        >
          <div className="flex items-start gap-2">
            <Briefcase className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.primary }} />
            <div>
              <p className="text-xs font-medium uppercase mb-2" style={{ color: COLORS.primary }}>
                经历建议
              </p>
              <div className="space-y-2">
                {suggestion.experienceSuggestions.map((exp, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge
                      style={{
                        backgroundColor: exp.type === 'add' ? `${COLORS.success}20` : exp.type === 'emphasize' ? `${COLORS.primary}20` : '#dc262620',
                        color: exp.type === 'add' ? COLORS.success : exp.type === 'emphasize' ? COLORS.primary : '#dc2626',
                        borderRadius: '4px',
                        fontSize: '10px',
                        border: `1px solid ${exp.type === 'add' ? COLORS.success : exp.type === 'emphasize' ? COLORS.primary : '#dc2626'}40`,
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
    </div>
  );

  return (
    <Card
      className="flex flex-col h-full glass-card"
      style={{
        borderRadius: '12px',
        maxHeight: '70vh',
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <CardHeader
        className="border-b flex-shrink-0"
        style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceElevated }}
      >
        <div className="flex items-center justify-between">
          <CardTitle
            className="flex items-center gap-2 text-lg font-display"
            style={{ color: COLORS.text }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${COLORS.primary}15`, border: `1px solid ${COLORS.primary}30` }}
            >
              <Sparkles className="h-4 w-4" style={{ color: COLORS.primary }} />
            </div>
            优化预览
          </CardTitle>
          {isOptimizing && (
            <Badge
              style={{
                backgroundColor: `${COLORS.primary}15`,
                color: COLORS.primary,
                borderRadius: '4px',
                border: `1px solid ${COLORS.primary}30`,
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
              backgroundColor: COLORS.surface,
            }}
          />
        )}
      </CardHeader>

      {/* Tab Bar */}
      <div
        className="flex border-b overflow-x-auto flex-shrink-0"
        style={{ backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.border }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 text-sm font-medium flex items-center justify-center gap-1.5
                transition-all border-b-2 whitespace-nowrap min-w-fit
                ${isActive
                  ? 'border-indigo-500 text-indigo-500'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }
              `}
              style={{ backgroundColor: isActive ? `${COLORS.primary}08` : 'transparent' }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <CardContent
        className="flex-1 overflow-y-auto p-4"
        ref={contentRef}
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Loading State */}
        {isOptimizing && !optimizedResume && renderSkeleton()}

        {/* Render content based on active tab */}
        {!isOptimizing || optimizedResume ? (
          <>
            {activeTab === 'experience' && renderExperienceTab()}
            {activeTab === 'skills-education' && renderSkillsEducationTab()}
            {activeTab === 'ats' && renderAtsTab()}
            {activeTab === 'suggestions' && renderSuggestionsTab()}
          </>
        ) : (
          /* Streaming content for non-summary tabs */
          <div className="space-y-3">
            <div className="h-4 rounded animate-pulse" style={{ backgroundColor: COLORS.surfaceElevated, width: '80%' }} />
            <div className="h-4 rounded animate-pulse" style={{ backgroundColor: COLORS.surfaceElevated, width: '60%' }} />
            <div className="h-4 rounded animate-pulse" style={{ backgroundColor: COLORS.surfaceElevated, width: '70%' }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
