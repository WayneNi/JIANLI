// Resume types

export interface ResumeExperience {
  company: string;
  position: string;
  duration: string;
  description: string;
  starFormatted?: string;
}

export interface ResumeEducation {
  school: string;
  degree: string;
  duration: string;
  gpa?: string;
}

export interface ResumeSkills {
  technical: string[];
  soft?: string[];
  languages?: string[];
}

export interface OptimizedResume {
  summary: string;
  experience: ResumeExperience[];
  skills: ResumeSkills;
  education: ResumeEducation[];
}

export interface OptimizeRequest {
  resumeText: string;
  jobDescription?: string;
  targetRole?: string;
}

export interface OptimizeResponse {
  optimized: OptimizedResume;
  rawJson: string;
  improvements: string[];
}

export type OptimizeStatus =
  | 'idle'
  | 'parsing'
  | 'analyzing'
  | 'optimizing'
  | 'formatting'
  | 'completed'
  | 'error';

export interface StreamChunk {
  type: 'status' | 'content' | 'error' | 'done';
  status?: OptimizeStatus;
  message?: string;
  content?: string;
  data?: OptimizedResume;
}
