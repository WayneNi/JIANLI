"use client";

import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { OptimizedResume, ResumeContact } from '@/types/resume';
import type { TemplateType } from '@/lib/templates';

// Color palette - Professional resume colors
const colors = {
  // Simple template - Navy & Gold accent
  simple: {
    primary: '#1e3a5f',      // Deep navy
    secondary: '#64748b',   // Slate gray
    accent: '#c9a227',      // Gold accent
    background: '#ffffff',
    text: '#1e293b',
    lightText: '#64748b',
    border: '#e2e8f0',
    skillBg: '#f1f5f9',
  },
  // Professional template - Dark & Blue
  professional: {
    primary: '#0f172a',      // Slate 900
    secondary: '#334155',    // Slate 700
    accent: '#3b82f6',       // Blue 500
    background: '#ffffff',
    text: '#0f172a',
    lightText: '#64748b',
    border: '#cbd5e1',
    skillBg: '#f1f5f9',
  },
  // Creative template - Purple & Pink
  creative: {
    primary: '#7c3aed',      // Violet 600
    secondary: '#6b7280',    // Gray 500
    accent: '#ec4899',        // Pink 500
    background: '#ffffff',
    text: '#1f2937',
    lightText: '#6b7280',
    border: '#e5e7eb',
    skillBg: '#f3e8ff',
  },
};

type ColorScheme = typeof colors.simple;

// ============================================
// TEMPLATE 1: MODERN MINIMAL (Simple)
// ============================================
const createMinimalStyles = (c: ColorScheme) => StyleSheet.create({
  page: {
    padding: 48,
    paddingTop: 40,
    fontFamily: 'Noto Sans SC',
    fontSize: 10,
    lineHeight: 1.6,
    color: c.text,
    backgroundColor: c.background,
  },
  content: {},
  // Header with name and contact
  header: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: c.accent,
    borderBottomStyle: 'solid',
  },
  name: {
    fontSize: 28,
    fontWeight: 700,
    color: c.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    color: c.secondary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  contactItem: {
    fontSize: 9,
    color: c.lightText,
    marginRight: 16,
  },
  contactSeparator: {
    color: c.accent,
    marginRight: 16,
  },
  // Section styling
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: c.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    borderBottomStyle: 'solid',
  },
  // Summary text
  summary: {
    fontSize: 10,
    lineHeight: 1.7,
    color: c.text,
  },
  // Experience items
  experienceItem: {
    marginBottom: 16,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  company: {
    fontSize: 12,
    fontWeight: 700,
    color: c.primary,
  },
  dot: {
    color: c.accent,
    marginHorizontal: 8,
    fontSize: 10,
  },
  position: {
    fontSize: 10,
    color: c.secondary,
  },
  duration: {
    fontSize: 9,
    color: c.lightText,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.6,
    color: c.text,
    marginTop: 6,
  },
  // Skills section
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    fontSize: 9,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: c.skillBg,
    borderRadius: 4,
    color: c.primary,
  },
  skillLabel: {
    fontWeight: 700,
  },
  skillsSubtitle: {
    fontSize: 10,
    fontWeight: 700,
    color: c.primary,
    marginBottom: 8,
    marginTop: 10,
  },
  // Education
  educationItem: {
    marginBottom: 12,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  school: {
    fontSize: 11,
    fontWeight: 700,
    color: c.primary,
  },
  degree: {
    fontSize: 10,
    color: c.text,
    marginTop: 2,
  },
  gpa: {
    fontSize: 9,
    color: c.lightText,
    marginTop: 2,
  },
});

// ============================================
// TEMPLATE 2: EXECUTIVE (Professional)
// ============================================
const createExecutiveStyles = (c: ColorScheme) => StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Noto Sans SC',
    fontSize: 10,
    lineHeight: 1.5,
    color: c.text,
    backgroundColor: c.background,
  },
  // Header with dark background
  header: {
    backgroundColor: c.primary,
    padding: 36,
    paddingTop: 32,
    marginBottom: 32,
  },
  name: {
    fontSize: 26,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 20,
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  contactItem: {
    fontSize: 9,
    color: '#cbd5e1',
  },
  contactSeparator: {
    color: c.accent,
    marginHorizontal: 4,
  },
  // Content wrapper
  content: {
    paddingHorizontal: 36,
  },
  // Section styling
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: c.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: c.primary,
    borderBottomStyle: 'solid',
  },
  // Summary text
  summary: {
    fontSize: 10,
    lineHeight: 1.7,
    color: c.text,
  },
  // Experience items
  experienceItem: {
    marginBottom: 18,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  company: {
    fontSize: 12,
    fontWeight: 700,
    color: c.primary,
  },
  dot: {
    color: c.accent,
    marginHorizontal: 8,
    fontSize: 10,
  },
  position: {
    fontSize: 10,
    color: c.secondary,
    fontWeight: 500,
  },
  duration: {
    fontSize: 9,
    color: c.lightText,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.6,
    color: c.text,
    marginTop: 6,
  },
  // Skills section - two column layout
  skillsSection: {
    marginBottom: 16,
  },
  skillsSubtitle: {
    fontSize: 10,
    fontWeight: 700,
    color: c.primary,
    marginBottom: 8,
    marginTop: 12,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillBadge: {
    fontSize: 9,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: c.skillBg,
    borderRadius: 3,
    color: c.primary,
  },
  // Education
  educationItem: {
    marginBottom: 14,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  school: {
    fontSize: 11,
    fontWeight: 700,
    color: c.primary,
  },
  degree: {
    fontSize: 10,
    color: c.text,
    marginTop: 2,
  },
  gpa: {
    fontSize: 9,
    color: c.lightText,
    marginTop: 2,
  },
});

// ============================================
// TEMPLATE 3: CREATIVE MODERN
// ============================================
const createCreativeStyles = (c: ColorScheme) => StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Noto Sans SC',
    fontSize: 10,
    lineHeight: 1.5,
    color: c.text,
    backgroundColor: c.background,
  },
  content: {},
  // Header with accent border
  header: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: c.accent,
    borderBottomStyle: 'solid',
  },
  name: {
    fontSize: 30,
    fontWeight: 700,
    color: c.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    color: c.secondary,
    marginBottom: 14,
    fontWeight: 500,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  contactItem: {
    fontSize: 9,
    color: c.lightText,
  },
  contactSeparator: {
    color: c.accent,
    marginHorizontal: 4,
  },
  // Section styling
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: c.primary,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    borderBottomStyle: 'dashed',
  },
  // Summary text
  summary: {
    fontSize: 10,
    lineHeight: 1.7,
    color: c.text,
  },
  // Experience items with left accent
  experienceItem: {
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: c.accent,
    borderLeftStyle: 'solid',
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  company: {
    fontSize: 12,
    fontWeight: 700,
    color: c.primary,
  },
  dot: {
    color: c.accent,
    marginHorizontal: 8,
    fontSize: 10,
  },
  position: {
    fontSize: 10,
    color: c.secondary,
  },
  duration: {
    fontSize: 9,
    color: c.lightText,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.6,
    color: c.text,
    marginTop: 6,
  },
  // Skills with pill badges
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    fontSize: 9,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: c.skillBg,
    borderRadius: 20,
    color: c.primary,
    fontWeight: 500,
  },
  skillsSubtitle: {
    fontSize: 10,
    fontWeight: 700,
    color: c.primary,
    marginBottom: 8,
    marginTop: 10,
  },
  // Education
  educationItem: {
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#a78bfa',
    borderLeftStyle: 'solid',
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  school: {
    fontSize: 11,
    fontWeight: 700,
    color: c.primary,
  },
  degree: {
    fontSize: 10,
    color: c.text,
    marginTop: 2,
  },
  gpa: {
    fontSize: 9,
    color: c.lightText,
    marginTop: 2,
  },
});

const getStyles = (template: TemplateType) => {
  const scheme = colors[template];
  switch (template) {
    case 'professional':
      return createExecutiveStyles(scheme);
    case 'creative':
      return createCreativeStyles(scheme);
    default:
      return createMinimalStyles(scheme);
  }
};

// Helper component to render contact info
interface ContactInfoProps {
  contact?: ResumeContact;
  contactRow: any;
  contactItem: any;
  contactSeparator: any;
}

// 从 summary 中提取姓名（匹配常见中文姓名模式）
function extractNameFromSummary(summary: string): string | undefined {
  if (!summary) return undefined;
  // 匹配 "我叫XXX" 或 "姓名：XXX" 等模式
  const patterns = [
    /(?:我叫|姓名[：:]?|name[：:]?\s*)([\u4e00-\u9fa5]{2,4})/,
    /^([\u4e00-\u9fa5]{2,4})[\s，,]/,  // 开头姓名
  ];
  for (const pattern of patterns) {
    const match = summary.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

function hasAnyContactInfo(contact?: ResumeContact): boolean {
  if (!contact) return false;
  return !!(contact.email || contact.phone || contact.name);
}

function ContactInfo({ contact, contactRow, contactItem, contactSeparator }: ContactInfoProps) {
  if (!contact || !hasAnyContactInfo(contact)) return null;

  const items: string[] = [];
  if (contact.email) items.push(contact.email);
  if (contact.phone) items.push(contact.phone);
  if (contact.name) items.push(contact.name);

  return (
    <View style={contactRow}>
      {items.map((item, idx) => (
        <Text key={idx} style={contactItem}>
          {idx > 0 && <Text style={contactSeparator}> | </Text>}
          {item}
        </Text>
      ))}
    </View>
  );
}

interface ResumePDFProps {
  resume: OptimizedResume;
  template?: TemplateType;
  targetRole?: string;
}

export function ResumePDF({ resume, template = 'simple', targetRole }: ResumePDFProps) {
  const styles = getStyles(template);
  const isExecutive = template === 'professional';

  // Check if resume has any content
  const hasContent = resume.summary ||
    (resume.experience && resume.experience.length > 0) ||
    (resume.skills && resume.skills.technical && resume.skills.technical.length > 0);

  // Extract name from contact or summary
  const name = resume.contact?.name || extractNameFromSummary(resume.summary) || '我的简历';
  const titleText = targetRole || '';

  // Get contact info
  const contact = resume.contact;

  // Don't render if no content
  if (!hasContent) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No resume content available</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={isExecutive ? styles.page : styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          {titleText && <Text style={styles.title}>{titleText}</Text>}
          <ContactInfo
            contact={contact}
            contactRow={styles.contactRow}
            contactItem={styles.contactItem}
            contactSeparator={styles.contactSeparator}
          />
        </View>

        {/* Summary */}
        {resume.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>个人简介</Text>
            <Text style={styles.summary}>{resume.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>工作经历</Text>
            {resume.experience.map((exp, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <View style={styles.companyRow}>
                    <Text style={styles.company}>{exp.company}</Text>
                    <Text style={styles.dot}>·</Text>
                    <Text style={styles.position}>{exp.position}</Text>
                  </View>
                  <Text style={styles.duration}>{exp.duration}</Text>
                </View>
                <Text style={styles.description}>
                  {exp.starFormatted || exp.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {resume.skills && resume.skills.technical.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>专业技能</Text>
            <View style={styles.skillsGrid}>
              {resume.skills.technical.map((skill, index) => (
                <Text key={index} style={styles.skillBadge}>
                  {skill}
                </Text>
              ))}
            </View>
            {resume.skills.soft && resume.skills.soft.length > 0 && (
              <>
                <Text style={styles.skillsSubtitle}>软技能</Text>
                <View style={styles.skillsGrid}>
                  {resume.skills.soft.map((skill, index) => (
                    <Text key={`soft-${index}`} style={styles.skillBadge}>
                      {skill}
                    </Text>
                  ))}
                </View>
              </>
            )}
            {resume.skills.languages && resume.skills.languages.length > 0 && (
              <>
                <Text style={styles.skillsSubtitle}>语言能力</Text>
                <View style={styles.skillsGrid}>
                  {resume.skills.languages.map((lang, index) => (
                    <Text key={`lang-${index}`} style={styles.skillBadge}>
                      {lang}
                    </Text>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>教育背景</Text>
            {resume.education.map((edu, index) => (
              <View key={index} style={styles.educationItem}>
                <View style={styles.educationHeader}>
                  <Text style={styles.school}>{edu.school}</Text>
                  <Text style={styles.duration}>{edu.duration}</Text>
                </View>
                <Text style={styles.degree}>{edu.degree}</Text>
                {edu.gpa && <Text style={styles.gpa}>GPA: {edu.gpa}</Text>}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
