"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { OptimizedResume } from '@/types/resume';
import type { TemplateType } from '@/lib/templates';

// Register fonts for Chinese support
Font.register({
  family: 'Noto Sans SC',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeALhLOCT-xWdqOhi.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeALhLOCT-xWdqOhi.woff2',
      fontWeight: 500,
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeALhLOCT-xWdqOhi.woff2',
      fontWeight: 700,
    },
  ],
});

// Simple styles - using standard fonts that work better
const simpleStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#1a1f2e',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #c9a227',
    paddingBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1f2e',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1 solid #e5e5e5',
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333',
  },
  experienceItem: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  company: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 9,
    color: '#666',
  },
  position: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#444',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    fontSize: 9,
    padding: '4 8',
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
  },
  skillLabel: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  educationItem: {
    marginBottom: 8,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  school: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  degree: {
    fontSize: 10,
    color: '#333',
  },
});

// Professional styles
const professionalStyles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#0f172a',
  },
  header: {
    marginBottom: 25,
    backgroundColor: '#0f172a',
    padding: 20,
    marginLeft: -20,
    marginRight: -20,
    marginTop: -20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  title: {
    fontSize: 11,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '2 solid #0f172a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
  },
  experienceItem: {
    marginBottom: 15,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  company: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  duration: {
    fontSize: 9,
    color: '#64748b',
  },
  position: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 5,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#334155',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillBadge: {
    fontSize: 9,
    padding: '4 10',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: 2,
  },
  skillLabel: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  educationItem: {
    marginBottom: 10,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  school: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  degree: {
    fontSize: 10,
    color: '#334155',
  },
});

// Creative styles
const creativeStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#1e1b4b',
  },
  header: {
    marginBottom: 25,
    paddingBottom: 20,
    borderBottom: '3 solid #7c3aed',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1 dashed #7c3aed',
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
  },
  experienceItem: {
    marginBottom: 14,
    paddingLeft: 10,
    borderLeft: '2 solid #7c3aed',
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  company: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e1b4b',
  },
  duration: {
    fontSize: 9,
    color: '#9ca3af',
  },
  position: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    fontSize: 9,
    padding: '4 12',
    backgroundColor: '#ede9fe',
    color: '#7c3aed',
    borderRadius: 12,
  },
  skillLabel: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  educationItem: {
    marginBottom: 8,
    paddingLeft: 10,
    borderLeft: '2 solid #a78bfa',
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  school: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e1b4b',
  },
  degree: {
    fontSize: 10,
    color: '#374151',
  },
});

const getStyles = (template: TemplateType) => {
  switch (template) {
    case 'professional':
      return professionalStyles;
    case 'creative':
      return creativeStyles;
    default:
      return simpleStyles;
  }
};

interface ResumePDFProps {
  resume: OptimizedResume;
  template?: TemplateType;
}

export function ResumePDF({ resume, template = 'simple' }: ResumePDFProps) {
  const styles = getStyles(template);

  // Extract name from summary (first line typically contains name)
  const summaryLines = (resume.summary || '').split('\n').filter((l) => l.trim());
  const name = summaryLines[0] || '简历';
  const titleText = summaryLines.slice(1).join(' | ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          {titleText && <Text style={styles.title}>{titleText}</Text>}
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
                  <Text style={styles.company}>{exp.company}</Text>
                  <Text style={styles.duration}>{exp.duration}</Text>
                </View>
                <Text style={styles.position}>{exp.position}</Text>
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
            <Text style={styles.sectionTitle}>技能</Text>
            <View style={styles.skillsContainer}>
              {resume.skills.technical.map((skill, index) => (
                <Text key={index} style={styles.skillBadge}>
                  {skill}
                </Text>
              ))}
              {resume.skills.soft?.map((skill, index) => (
                <Text key={`soft-${index}`} style={styles.skillBadge}>
                  {skill}
                </Text>
              ))}
              {resume.skills.languages?.map((lang, index) => (
                <Text key={`lang-${index}`} style={styles.skillBadge}>
                  {lang}
                </Text>
              ))}
            </View>
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
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
