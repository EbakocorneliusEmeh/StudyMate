import axios from 'axios';
import { API_URL } from '../config/api';
import { AskQuestionOptions, ChatResponse, UploadResponse } from '../types';
import { getToken } from '../utils/storage';
import { api } from '../api/axiosConfig';

const BASE_URL = API_URL;

// ASK GEMINI
export const askQuestion = async (
  question: string,
  options?: AskQuestionOptions,
): Promise<ChatResponse> => {
  const token = await getToken();
  const response = await axios.post(
    `${API_URL}/chat/ask`,
    {
      question,
      documentId: options?.documentId,
      sessionId: options?.sessionId,
      fileName: options?.fileName,
      fileUrl: options?.fileUrl,
    },
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    },
  );
  return response.data;
};

// UPLOAD PDF
export const uploadFile = async (
  uri: string,
  name: string,
  type: string = 'application/pdf',
  sessionId?: string,
): Promise<UploadResponse> => {
  const token = await getToken();
  const formData = new FormData();

  formData.append('file', {
    uri,
    name,
    type: type || 'application/octet-stream',
  } as unknown as Blob);

  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  const response = await axios.post(`${API_URL}/api/upload`, formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return {
    message: response.data.message,
    documentId:
      response.data.documentId || response.data.document_id || response.data.id,
    url: response.data.url || response.data.file_url,
    fileName: response.data.fileName || response.data.file_name || name,
    fileType: response.data.fileType || response.data.file_type || type,
  };
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendCompanionMessage = async (payload: {
  question: string;
  history: ChatMessage[];
  mode?: 'text' | 'image' | 'pdf' | 'audio' | 'research';
  attachmentUrl?: string;
  attachmentType?: string;
  sessionId?: string;
}) => {
  try {
    const response = await api.post('/chat/companion/message', payload);
    return response.data;
  } catch (error) {
    console.error('Companion API Error:', error);
    throw error;
  }
};

// RE-EXPORT FROM API MODULES FOR CONVENIENCE
export * from '../api/collaboration';
export * from '../api/progress';
export * from '../api/spacedRepetition';

// QUIZ ASSISTANT API
export interface QuizExplanationInput {
  question: string;
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  sourceText?: string;
  isCorrect: boolean;
}

export interface QuizHintInput {
  question: string;
  questionId: string;
  options: string[];
  attemptedAnswers: string[];
}

export interface QuizTopicsInput {
  quizTitle: string;
  fileName: string;
  sourceText?: string;
}

export const explainQuizAnswer = async (input: QuizExplanationInput) => {
  const token = await getToken();
  const response = await axios.post(`${BASE_URL}/quiz/explain`, input, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
  return response.data;
};

export const getQuizHint = async (input: QuizHintInput) => {
  const token = await getToken();
  const response = await axios.post(`${BASE_URL}/quiz/hint`, input, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
  return response.data;
};

export const suggestQuizTopics = async (input: QuizTopicsInput) => {
  const token = await getToken();
  const response = await axios.post(`${BASE_URL}/quiz/topics`, input, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
  return response.data;
};
