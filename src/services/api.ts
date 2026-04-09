import axios from 'axios';
// import { API_URL } from '../config/api';
import { getToken } from '../utils/storage';
import { AskQuestionOptions, ChatResponse, UploadResponse } from '../types';
import { Platform } from 'react-native';

const BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.1.178:3000';

// ASK GEMINI
export const askQuestion = async (
  question: string,
  options?: AskQuestionOptions,
): Promise<ChatResponse> => {
  const token = await getToken();
  const response = await axios.post(
    `${BASE_URL}/chat/ask`,
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

  const fileToUpload = {
    uri,
    name,
    type,
  } as unknown as Blob;

  formData.append('file', fileToUpload);
  if (sessionId) {
    formData.append('sessionId', sessionId);
  }

  const response = await axios.post(`${BASE_URL}/api/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return {
    message: response.data.message,
    documentId: response.data.documentId || response.data.id,
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
    const token = await getToken();
    const response = await axios.post(
      `${BASE_URL}/chat/companion/message`,
      payload,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );
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
