export interface Message {
  id: string;
  text: string;
  fromUser: boolean;
  createdAt: Date;
}

export interface ChatResponse {
  answer: string;
  foundInNotes: boolean;
  error?: string;
  fallback?: true;
  provider?: string;
  documentScoped?: boolean;
  resolvedDocumentId?: string | null;
  chunkCount?: number;
}

export interface UploadResponse {
  message: string;
  documentId?: string;
  url: string;
  fileName?: string;
  fileType?: string;
}

export interface AskQuestionOptions {
  documentId?: string;
  sessionId?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  history?: any[];
}

export interface Card {
  id: string;
  frontText: string;
  backText: string;
  sessionId?: string;
  noteId?: string;
  nextReviewDate?: string;
  interval?: number;
  easeFactor?: number;
  repetitions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardCreateInput {
  frontText: string;
  backText: string;
  sessionId?: string;
  noteId?: string;
}

export interface CardReviewInput {
  quality: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface CollaborationInvite {
  id: string;
  sessionId: string;
  inviterId: string;
  collaboratorId: string;
  role: 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Collaborator {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  role: 'editor' | 'viewer';
  joinedAt: string;
}

export interface ProgressStats {
  totalSessions: number;
  totalStudyTimeMinutes: number;
  totalNotes: number;
  totalFiles: number;
  totalCards: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionLength: number;
  cardsDueToday: number;
  cardsReviewedThisWeek: number;
  mostProductiveDay: string;
  weeklyProgress: WeeklyProgress[];
}

export interface WeeklyProgress {
  date: string;
  sessionsCount: number;
  studyTimeMinutes: number;
}

export interface DocumentStatusResponse {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  source_text?: string | null;
  gemini_file_uri?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentSourceRecord {
  id: string;
  sessionId?: string;
  fileId?: string;
  documentId?: string;
  fileName: string;
  fileUrl?: string;
  sourceText?: string;
  geminiFileUri?: string;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestionOption {
  id: string;
  text: string;
}

export interface GeneratedQuizQuestion {
  id: string;
  question: string;
  options: QuizQuestionOption[];
  correct_answer: string;
  explanation: string;
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  fileName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  sessionId?: string;
  sourcePreview?: string;
  createdAt: string;
  questions: GeneratedQuizQuestion[];
}
