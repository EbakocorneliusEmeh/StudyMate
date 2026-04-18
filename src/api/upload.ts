import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import { API_URL } from '../config/api';
import { getToken, refreshAccessToken } from '../utils/storage';

const BACKEND_URL = API_URL;

const fileToBase64 = async (uri: string | File): Promise<string> => {
  console.log('[fileToBase64] Input URI:', uri);

  if (typeof File !== 'undefined' && uri instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(uri);
    });
  }

  // For any file:// or content:// URIs (mobile) - try FileSystem first for cache directories
  if (
    typeof uri === 'string' &&
    (uri.startsWith('file://') || uri.startsWith('content://'))
  ) {
    try {
      // Check if it's an Expo cache file - use File API to read
      if (uri.includes('DocumentPicker') || uri.includes('cache')) {
        const file = new File(uri);
        const base64 = await file.base64();
        return base64;
      }
      // Fallback to fetch for other file URIs
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.log('[fileToBase64] Error fetching:', e);
    }
  }

  // For web URLs
  if (typeof uri === 'string' && uri.startsWith('http')) {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Try as a local file path - read directly
  if (typeof uri === 'string') {
    console.log('[fileToBase64] Trying direct read for:', uri);
    try {
      // Try File API for local files
      if (typeof File !== 'undefined') {
        try {
          const file = new File(uri);
          const base64 = await file.base64();
          return base64;
        } catch {}
      }
      // Fallback to fetch
      const response = await fetch(uri);
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.log('[fileToBase64] Direct fetch error:', e);
    }
  }

  throw new Error('Unsupported file type: ' + uri);
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
  source_text?: string;
  linked_to_session?: boolean;
  gemini_file_uri?: string | null;
  document_id?: string;
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
      typeof record.document_id === 'string'
        ? record.document_id
        : typeof record.id === 'string'
          ? record.id
          : undefined,
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
  const isWeb =
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

  try {
    const formData = new FormData();

    if (isWeb) {
      formData.append('file', file.uri as File);
    } else {
      const fileObj: Record<string, string> = {
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name,
      };
      formData.append('file', fileObj as unknown as Blob);
    }

    if (folder) formData.append('folder', folder as string);
    if (sessionId) formData.append('session_id', sessionId as string);

    const res = await makeAuthenticatedRequest(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    console.log('[Upload] Response status:', res.status);
    const data = await parseResponseBody(res);
    console.log('[Upload] Response data:', JSON.stringify(data));

    if (!res.ok) {
      console.log('[Upload] Error response:', res.status, data);
      const errorMsg = getErrorMessage(data, 'Failed to upload file');
      Alert.alert('Upload failed', `Status: ${res.status}, Error: ${errorMsg}`);
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
