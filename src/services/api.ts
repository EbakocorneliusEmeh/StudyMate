import axios from 'axios';
import { API_URL } from '../config/api';
import { api } from '../api/axiosConfig';
import { getToken } from '../utils/storage';
import { AskQuestionOptions, ChatResponse, UploadResponse } from '../types';

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
      fileType: options?.fileType,
      history: options?.history,
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

  const fileToUpload = {
    uri,
    name,
    type,
  } as unknown as Blob;

  formData.append('file', fileToUpload);
  if (sessionId) {
    formData.append('sessionId', sessionId);
  }

  const response = await axios.post(`${API_URL}/api/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
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

export const sendCompanionMessage = async (payload: {
  question: string;
  history: any[];
  mode?: 'text' | 'image' | 'pdf' | 'audio' | 'research';
  attachmentUrl?: string;
  attachmentType?: string;
  sessionId?: string;
}) => {
  try {
    const response = await api.post('/search/companion/message', payload);
    return response.data;
  } catch (error) {
    console.error('Companion API Error:', error);
    throw error;
  }
};

// Re-export from api modules for convenience
export * from '../api/spacedRepetition';
export * from '../api/collaboration';
export * from '../api/progress';
