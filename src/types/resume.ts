// Resume types

export interface ResumeExperience {
  company: string;
  position: string;
  duration: string;
  description: string;
  starFormatted?: string;
}

// Edit state for resume sections
export interface EditingState {
  isEditing: boolean;
  section: 'summary' | 'experience' | 'skills' | 'education' | null;
  itemIndex: number | null;
}

// ATS check result
export interface AtsCheckResult {
  score: number;
  issues: Array<{
    category: string;
    severity: string;
    message: string;
  }>;
  suggestions: string[];
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

export interface ResumeContact {
  name?: string;
  email?: string;
  phone?: string;
}

export interface OptimizedResume {
  contact?: ResumeContact;
  summary: string;
  experience: ResumeExperience[];
  skills: ResumeSkills;
  education: ResumeEducation[];
}

// JD-based improvement suggestions
export interface ExperienceSuggestion {
  type: 'add' | 'emphasize' | 'remove';
  suggestion: string;
}

export interface ResumeSuggestion {
  matchScore: number;
  gapAnalysis: string;
  skillGaps: string[];
  experienceSuggestions: ExperienceSuggestion[];
  actionPlan: string[];
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
  | 'suggesting'
  | 'optimizing'
  | 'formatting'
  | 'completed'
  | 'error';

export interface StreamChunk {
  type: 'status' | 'content' | 'error' | 'done' | 'suggestion' | 'ats';
  status?: OptimizeStatus;
  message?: string;
  content?: string;
  data?: OptimizedResume;
  suggestion?: ResumeSuggestion;
  atsCheck?: AtsCheckResult;
  fromCache?: boolean;
  coverLetter?: {
    subject: string;
    content: string;
  };
  interviewQuestions?: Array<{
    experience: string;
    questions: Array<{
      question: string;
      keyPoints: string[];
    }>;
  }>;
}
