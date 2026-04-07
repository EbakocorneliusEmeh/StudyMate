import axios from 'axios';
import { AskQuestionOptions, ChatResponse, UploadResponse } from '../types';
import { getToken } from '../utils/storage';

const BASE_URL = 'http://192.168.1.169:3000';

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
    documentId:
      response.data.documentId || response.data.document_id || response.data.id,
    url: response.data.url || response.data.file_url,
    fileName: response.data.fileName || response.data.file_name || name,
    fileType: response.data.fileType || response.data.file_type || type,
    status: response.data.status,
    sourceText: response.data.sourceText || response.data.source_text || null,
    geminiFileUri:
      response.data.geminiFileUri || response.data.gemini_file_uri || null,
    errorMessage:
      response.data.errorMessage || response.data.error_message || null,
  };
};

// Re-export from api modules for convenience
export * from '../api/collaboration';
export * from '../api/progress';
export * from '../api/spacedRepetition';
