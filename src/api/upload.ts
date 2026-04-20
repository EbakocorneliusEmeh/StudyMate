import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { getToken, refreshAccessToken } from '../utils/storage';

const BACKEND_URL = API_URL;

const fileToBase64 = async (fileUri: string | File): Promise<string | null> => {
  if (
    typeof window !== 'undefined' &&
    typeof File !== 'undefined' &&
    fileUri instanceof File
  ) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64 || null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(fileUri);
    });
  }

  const uri = fileUri as string;
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface UploadedFile {
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  document_id?: string;
  source_text?: string;
  gemini_file_uri?: string;
  linked_to_session?: boolean;
}

const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    return (
      error.message.includes('Network request failed') ||
      error.message.includes('Network error')
    );
  }
  return false;
};

const parseResponseBody = async (res: Response) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const message = record.message || record.error;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

const normalizeUploadedFile = (
  data: unknown,
  file: { uri: string | File; name: string; type: string },
  linkedToSession: boolean,
): UploadedFile => {
  const record = (
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  ) as Record<string, unknown>;
  return {
    file_name:
      typeof record.file_name === 'string' && record.file_name
        ? record.file_name
        : file.name,
    file_url:
      typeof record.file_url === 'string' && record.file_url
        ? record.file_url
        : '',
    file_type:
      typeof record.file_type === 'string' && record.file_type
        ? record.file_type
        : file.type,
    file_size: typeof record.file_size === 'number' ? record.file_size : 0,
    document_id:
      typeof record.document_id === 'string' ? record.document_id : undefined,
    source_text:
      typeof record.source_text === 'string' ? record.source_text : undefined,
    gemini_file_uri:
      typeof record.gemini_file_uri === 'string'
        ? record.gemini_file_uri
        : undefined,
    linked_to_session: linkedToSession,
  };
};

const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit,
  retryOnUnauthorized = true,
): Promise<Response> => {
  let token = await getToken();
  if (!token) {
    token = await AsyncStorage.getItem('access_token');
  }
  if (!token) {
    throw new ApiError('Not authenticated. Please log in.', 401);
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && retryOnUnauthorized) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  return res;
};

export const uploadFile = async (
  file:
    | { uri: string; name: string; type: string }
    | { uri: File; name: string; type: string },
  sessionId?: string,
  folder?: string,
): Promise<UploadedFile> => {
  const _isWeb =
    typeof window !== 'undefined' &&
    typeof File !== 'undefined' &&
    file.uri instanceof File;

  // ALWAYS use JSON endpoint for string URIs (works everywhere)
  if (true) {
    try {
      console.log('[Upload] Using JSON endpoint for:', file.name);

      let token = await getToken();
      if (!token) {
        token = await AsyncStorage.getItem('access_token');
      }
      console.log('[Upload] Token exists:', !!token);

      const base64 = await fileToBase64(file.uri);
      console.log('[Upload] Base64 length:', base64?.length);

      if (!base64) {
        throw new ApiError('Failed to read file', 500);
      }

      const response = await fetch(`${BACKEND_URL}/api/upload/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileData: base64,
          fileName: file.name,
          fileType: file.type,
          folder,
          session_id: sessionId,
        }),
      });

      console.log('[Upload] Response status:', response.status);
      const data = await response.json();
      console.log('[Upload] Response data:', JSON.stringify(data));

      if (!response.ok) {
        throw new ApiError(data.message || 'Upload failed', response.status);
      }

      return normalizeUploadedFile(data, file, false);
    } catch (e) {
      console.log('[Upload] Error:', e);
      throw new ApiError(e instanceof Error ? e.message : 'Upload failed', 500);
    }
  }
};

export const deleteFile = async (
  fileUrl: string,
): Promise<{ message: string }> => {
  try {
    const res = await makeAuthenticatedRequest(`${BACKEND_URL}/api/upload`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_url: fileUrl }),
    });

    const data = await parseResponseBody(res);
    if (!res.ok) {
      throw new ApiError(
        getErrorMessage(data, 'Failed to delete file'),
        res.status,
      );
    }
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ApiError(
        'Unable to connect to server. Please check your internet connection.',
      );
    }
    throw error;
  }
};

export const getSignedUrl = async (
  fileUrl: string,
  expiresIn?: number,
): Promise<{ signed_url: string }> => {
  try {
    const res = await makeAuthenticatedRequest(
      `${BACKEND_URL}/api/upload/signed-url`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: fileUrl, expires_in: expiresIn }),
      },
    );

    const data = await parseResponseBody(res);
    if (!res.ok) {
      throw new ApiError(
        getErrorMessage(data, 'Failed to get signed URL'),
        res.status,
      );
    }
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ApiError(
        'Unable to connect to server. Please check your internet connection.',
      );
    }
    throw error;
  }
};

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/x-bitmap',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const validateFile = (file: {
  type: string;
  size: number;
}): string | null => {
  const fileTypeLower = file.type.toLowerCase();
  const isAllowed = ALLOWED_FILE_TYPES.some(
    (allowed) => allowed.toLowerCase() === fileTypeLower,
  );
  if (!isAllowed) {
    return 'File type not allowed';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File too large. Maximum size is 10MB';
  }
  return null;
};
