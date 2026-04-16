import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { getToken, refreshAccessToken } from '../utils/storage';

const BACKEND_URL = API_URL;
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
  try {
    const formData = new FormData();

    const isWeb = typeof window !== 'undefined' && file.uri instanceof File;
    if (isWeb) {
      formData.append('file', file.uri as File);
    } else {
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);
    }

    if (folder) formData.append('folder', folder);
    if (sessionId) formData.append('session_id', sessionId);

    const res = await makeAuthenticatedRequest(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await parseResponseBody(res);

    if (!res.ok) {
      const errorMsg = getErrorMessage(data, 'Failed to upload file');
      throw new ApiError(errorMsg, res.status);
    }

    const fileForNormalization = {
      uri: isWeb ? '' : file.uri,
      name: file.name,
      type: file.type,
    };
    const normalized = normalizeUploadedFile(
      data,
      fileForNormalization,
      Boolean(sessionId),
    );
    if (!normalized.file_url) {
      throw new ApiError('Upload succeeded but no file URL was returned');
    }
    return normalized;
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ApiError(
        'Unable to connect to server. Please check your internet connection.',
      );
    }
    throw error;
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
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
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
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'File type not allowed';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File too large. Maximum size is 10MB';
  }
  return null;
};
