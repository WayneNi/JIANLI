"use client";

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Download, Loader2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OptimizedResume } from '@/types/resume';

interface DownloadButtonProps {
  resume: OptimizedResume | null;
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #333',
    paddingBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textTransform: 'uppercase',
  },
  summary: {
    lineHeight: 1.5,
    color: '#444',
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
    fontWeight: 'bold',
    fontSize: 11,
  },
  duration: {
    color: '#666',
    fontSize: 9,
  },
  position: {
    fontSize: 10,
    color: '#555',
    marginBottom: 4,
  },
  description: {
    lineHeight: 1.4,
    color: '#444',
  },
  starHighlight: {
    backgroundColor: '#e8f5e9',
    padding: 4,
    borderRadius: 2,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skill: {
    fontSize: 9,
    backgroundColor: '#f5f5f5',
    padding: '4 8',
    borderRadius: 2,
  },
  educationItem: {
    marginBottom: 8,
  },
  school: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  degree: {
    fontSize: 10,
    color: '#555',
  },
});

// PDF Document Component
const ResumePDF = ({ resume }: { resume: OptimizedResume }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with summary as name */}
      <View style={styles.header}>
        <Text style={styles.name}>{resume.summary.split('\n')[0]}</Text>
        <Text style={styles.title}>
          {resume.summary.split('\n').slice(1).join(' ')}
        </Text>
      </View>

      {/* Summary */}
      {resume.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>个人简介</Text>
          <Text style={styles.summary}>{resume.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>工作经历</Text>
          {resume.experience.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              <View style={styles.experienceHeader}>
                <Text style={styles.company}>{exp.company}</Text>
                <Text style={styles.duration}>{exp.duration}</Text>
              </View>
              <Text style={styles.position}>{exp.position}</Text>
              {exp.starFormatted ? (
                <View style={styles.starHighlight}>
                  <Text style={styles.description}>{exp.starFormatted}</Text>
                </View>
              ) : (
                <Text style={styles.description}>{exp.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Skills */}
      {resume.skills.technical.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>技能</Text>
          <View style={styles.skillsContainer}>
            {resume.skills.technical.map((skill, index) => (
              <Text key={index} style={styles.skill}>
                {skill}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>教育背景</Text>
          {resume.education.map((edu, index) => (
            <View key={index} style={styles.educationItem}>
              <Text style={styles.school}>
                {edu.school} - {edu.degree}
              </Text>
              <Text style={styles.degree}>
                {edu.duration}
                {edu.gpa && ` · GPA: ${edu.gpa}`}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);

export function DownloadButton({ resume }: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!resume) return;

    setIsGenerating(true);
    try {
      const blob = await pdf(<ResumePDF resume={resume} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'optimized_resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!resume) {
    return null;
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      className="gap-2 bg-green-600 hover:bg-green-700"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          生成 PDF...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          下载优化简历
        </>
      )}
    </Button>
  );
}
