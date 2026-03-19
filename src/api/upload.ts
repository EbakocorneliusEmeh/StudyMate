import { Platform } from 'react-native';
import { getToken } from '../utils/storage';

// Use localhost for web, private IP for mobile
const getBackendUrl = (): string => {
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.172:3000';
};

const BACKEND_URL = getBackendUrl();

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Types for file upload
export interface UploadedFile {
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

// Check if error is a network connectivity issue
const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    return error.message.includes('Network request failed') ||
           error.message.includes('Network error');
  }
  if (error instanceof Error) {
    return error.message.includes('ECONNREFUSED') ||
           error.message.includes('ENOTFOUND') ||
           error.message.includes('ETIMEDOUT');
  }
  return false;
};

/**
 * Upload a file to the backend
 * POST /api/upload
 */
export const uploadFile = async (
  file: {
    uri: string;
    name: string;
    type: string;
  },
  folder?: string
): Promise<UploadedFile> => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new ApiError('No authentication token found', 401);
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
    
    if (folder) {
      formData.append('folder', folder);
    }

    const res = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || 'Failed to upload file';
      throw new ApiError(errorMsg, res.status);
    }

    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ApiError('Unable to connect to server. Please check your internet connection.');
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to upload file');
  }
};

/**
 * Delete a file
 * DELETE /api/upload
 */
export const deleteFile = async (fileUrl: string): Promise<{ message: string }> => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new ApiError('No authentication token found', 401);
    }

    const res = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ file_url: fileUrl }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || 'Failed to delete file';
      throw new ApiError(errorMsg, res.status);
    }

    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ApiError('Unable to connect to server. Please check your internet connection.');
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to delete file');
  }
};

/**
 * Get a signed URL for a file
 * POST /api/upload/signed-url
 */
export const getSignedUrl = async (
  fileUrl: string,
  expiresIn?: number
): Promise<{ signed_url: string }> => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new ApiError('No authentication token found', 401);
    }

    const res = await fetch(`${BACKEND_URL}/api/upload/signed-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ file_url: fileUrl, expires_in: expiresIn }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || 'Failed to get signed URL';
      throw new ApiError(errorMsg, res.status);
    }

    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ApiError('Unable to connect to server. Please check your internet connection.');
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to get signed URL');
  }
};

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate a file before upload
 */
export const validateFile = (file: { type: string; size: number }): string | null => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'File type not allowed';
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return 'File too large. Maximum size is 10MB';
  }
  
  return null;
};
