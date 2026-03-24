const getBackendUrl = (): string => {
  // For development, check if we have an explicit env var
  // Otherwise use the default IP address for mobile devices
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Default to local IP for mobile development
  // This can be changed via environment variable in production
  return 'http://192.168.1.169:3000';
};

const BACKEND_URL = getBackendUrl();

// Get auth token - tries both new (authToken) and legacy (access_token) keys
const getAuthToken = async (): Promise<string> => {
  const AsyncStorage =
    await import('@react-native-async-storage/async-storage');
  // Try authToken first (new), then access_token (legacy)
  let token = await AsyncStorage.default.getItem('authToken');
  if (!token) {
    token = await AsyncStorage.default.getItem('access_token');
  }
  if (!token) {
    throw new ApiError('Not authenticated', 401);
  }
  return token;
};

export class ApiError extends Error {
  constructor(
    message: string,
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
}

const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    return (
      error.message.includes('Network request failed') ||
      error.message.includes('Network error')
    );
  }
  if (error instanceof Error) {
    return (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('ETIMEDOUT')
    );
  }
  return false;
};

export const uploadFile = async (
  file: {
    uri: string;
    name: string;
    type: string;
  },
  folder?: string,
): Promise<UploadedFile> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new ApiError('No authentication token found', 401);
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    if (folder) {
      formData.append('folder', folder);
    }

    const res = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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
      throw new ApiError(
        'Unable to connect to server. Please check your internet connection.',
      );
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to upload file');
  }
};

export const deleteFile = async (
  fileUrl: string,
): Promise<{ message: string }> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new ApiError('No authentication token found', 401);
    }

    const res = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
      throw new ApiError(
        'Unable to connect to server. Please check your internet connection.',
      );
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to delete file');
  }
};

export const getSignedUrl = async (
  fileUrl: string,
  expiresIn?: number,
): Promise<{ signed_url: string }> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new ApiError('No authentication token found', 401);
    }

    const res = await fetch(`${BACKEND_URL}/api/upload/signed-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
      const errorMsg =
        data?.message || data?.error || 'Failed to get signed URL';
      throw new ApiError(errorMsg, res.status);
    }

    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ApiError(
        'Unable to connect to server. Please check your internet connection.',
      );
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
  'image/heic',
  'image/heif',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
