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
}
