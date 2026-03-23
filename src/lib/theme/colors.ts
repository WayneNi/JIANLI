// Shared design tokens - Purple/Pink Theme
// Used by: AtsScore, CompareView, CoverLetter, InterviewQuestions, JobDescriptionInput, PreviewPanel, UploadZone

export const COLORS = {
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
  warning: '#f59e0b',
  error: '#dc2626',
} as const;

export type ColorTheme = typeof COLORS;
