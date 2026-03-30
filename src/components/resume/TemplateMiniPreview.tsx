"use client";

import type { OptimizedResume } from '@/types/resume';
import type { TemplateType } from '@/lib/templates';

interface TemplateMiniPreviewProps {
  resume: OptimizedResume;
  template: TemplateType;
  targetRole?: string;
}

// Color schemes for each template
const templateStyles = {
  simple: {
    primary: '#1e3a5f',
    accent: '#c9a227',
    headerBg: '#ffffff',
  },
  professional: {
    primary: '#0f172a',
    accent: '#3b82f6',
    headerBg: '#0f172a',
  },
  creative: {
    primary: '#7c3aed',
    accent: '#ec4899',
    headerBg: '#ffffff',
  },
};

export function TemplateMiniPreview({ resume, template, targetRole }: TemplateMiniPreviewProps) {
  const styles = templateStyles[template];
  const isProfessional = template === 'professional';

  // Get initials from name
  const name = resume.contact?.name || '简历';
  const initials = name.slice(0, 2);

  return (
    <div className="template-mini-preview overflow-hidden rounded-lg bg-gray-100 p-3">
      {/* A4 Paper Preview */}
      <div className="mx-auto bg-white shadow-lg overflow-hidden" style={{ width: '200px', height: '283px' }}>
        {/* Header */}
        <div
          className="px-3 py-2"
          style={{
            backgroundColor: styles.headerBg,
            borderBottom: isProfessional ? 'none' : `3px solid ${styles.accent}`,
          }}
        >
          {isProfessional ? (
            // Professional template - dark header
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: styles.accent }}
              >
                {initials}
              </div>
              <div className="h-2 w-24 mx-auto rounded" style={{ backgroundColor: '#374151' }} />
              <div className="h-1.5 w-32 mx-auto rounded mt-1" style={{ backgroundColor: '#6B7280' }} />
            </div>
          ) : (
            // Simple/Creative - light header with accent line
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: styles.primary }}
                >
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded w-20" style={{ backgroundColor: styles.primary }} />
                  <div className="h-1 w-16 rounded mt-0.5" style={{ backgroundColor: '#9CA3AF' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-3 py-2 space-y-1.5">
          {/* Summary */}
          {resume.summary && (
            <div>
              <div className="h-1 w-12 rounded" style={{ backgroundColor: styles.primary, opacity: 0.3 }} />
              <div className="h-1 w-full rounded mt-0.5" style={{ backgroundColor: '#E5E7EB' }} />
              <div className="h-1 w-4/5 rounded" style={{ backgroundColor: '#E5E7EB' }} />
            </div>
          )}

          {/* Experience */}
          {resume.experience && resume.experience.length > 0 && (
            <div>
              <div className="h-1 w-14 rounded mb-1" style={{ backgroundColor: styles.primary, opacity: 0.3 }} />
              {resume.experience.slice(0, 2).map((exp, idx) => (
                <div key={idx} className="flex items-center gap-1 mb-0.5">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: styles.accent }} />
                  <div className="h-1 flex-1 rounded" style={{ backgroundColor: '#D1D5DB' }} />
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {resume.skills?.technical && resume.skills.technical.length > 0 && (
            <div>
              <div className="h-1 w-12 rounded mb-1" style={{ backgroundColor: styles.primary, opacity: 0.3 }} />
              <div className="flex flex-wrap gap-0.5">
                {resume.skills.technical.slice(0, 4).map((skill, idx) => (
                  <div
                    key={idx}
                    className="px-1 py-0.5 rounded text-xs"
                    style={{ backgroundColor: `${styles.primary}15`, color: styles.primary }}
                  >
                    {skill.slice(0, 6)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template name */}
      <p className="text-center text-xs text-gray-500 mt-2 font-medium">
        {template === 'simple' && '现代简约'}
        {template === 'professional' && 'Executive'}
        {template === 'creative' && '创意活力'}
      </p>
    </div>
  );
}
