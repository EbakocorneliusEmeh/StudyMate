// const getBackendUrl = (): string => {
//   if (process.env.EXPO_PUBLIC_API_URL) {
//     return process.env.EXPO_PUBLIC_API_URL;
//   }

//   return 'http://192.168.1.172:3000';
// };

// const BACKEND_URL = getBackendUrl();

// const getAuthToken = async (): Promise<string> => {
//   const AsyncStorage =
//     await import('@react-native-async-storage/async-storage');
//   let token = await AsyncStorage.default.getItem('authToken');
//   if (!token) {
//     token = await AsyncStorage.default.getItem('access_token');
//   }
//   if (!token) {
//     throw new ApiError('Not authenticated', 401);
//   }
//   return token;
// };

// export class ApiError extends Error {
//   constructor(
//     message: string,
//     public statusCode?: number,
//   ) {
//     super(message);
//     this.name = 'ApiError';
//   }
// }

// export interface UploadedFile {
//   file_name: string;
//   file_url: string;
//   file_type: string;
//   file_size: number;
// }

// const isNetworkError = (error: unknown): boolean => {
//   if (error instanceof TypeError) {
//     return (
//       error.message.includes('Network request failed') ||
//       error.message.includes('Network error')
//     );
//   }
//   if (error instanceof Error) {
//     return (
//       error.message.includes('ECONNREFUSED') ||
//       error.message.includes('ENOTFOUND') ||
//       error.message.includes('ETIMEDOUT')
//     );
//   }
//   return false;
// };

// export const uploadFile = async (
//   file: {
//     uri: string;
//     name: string;
//     type: string;
//   },
//   folder?: string,
// ): Promise<UploadedFile> => {
//   try {
//     const token = await getAuthToken();

//     if (!token) {
//       throw new ApiError('No authentication token found', 401);
//     }

//     // Create FormData for file upload
//     const formData = new FormData();
//     formData.append('file', {
//       uri: file.uri,
//       name: file.name,
//       type: file.type,
//     } as unknown as Blob);

//     if (folder) {
//       formData.append('folder', folder);
//     }

//     const res = await fetch(`${BACKEND_URL}/api/upload`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       body: formData,
//     });

//     let data;
//     try {
//       data = await res.json();
//     } catch {
//       throw new ApiError('Invalid response from server');
//     }

//     if (!res.ok) {
//       const errorMsg = data?.message || data?.error || 'Failed to upload file';
//       throw new ApiError(errorMsg, res.status);
//     }

//     return data;
//   } catch (error) {
//     if (isNetworkError(error)) {
//       throw new ApiError(
//         'Unable to connect to server. Please check your internet connection.',
//       );
//     }
//     if (error instanceof ApiError) {
//       throw error;
//     }
//     throw new ApiError('Failed to upload file');
//   }
// };

// export const deleteFile = async (
//   fileUrl: string,
// ): Promise<{ message: string }> => {
//   try {
//     const token = await getAuthToken();

//     if (!token) {
//       throw new ApiError('No authentication token found', 401);
//     }

//     const res = await fetch(`${BACKEND_URL}/api/upload`, {
//       method: 'DELETE',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ file_url: fileUrl }),
//     });

//     let data;
//     try {
//       data = await res.json();
//     } catch {
//       throw new ApiError('Invalid response from server');
//     }

//     if (!res.ok) {
//       const errorMsg = data?.message || data?.error || 'Failed to delete file';
//       throw new ApiError(errorMsg, res.status);
//     }

//     return data;
//   } catch (error) {
//     if (isNetworkError(error)) {
//       throw new ApiError(
//         'Unable to connect to server. Please check your internet connection.',
//       );
//     }
//     if (error instanceof ApiError) {
//       throw error;
//     }
//     throw new ApiError('Failed to delete file');
//   }
// };

// export const getSignedUrl = async (
//   fileUrl: string,
//   expiresIn?: number,
// ): Promise<{ signed_url: string }> => {
//   try {
//     const token = await getAuthToken();

//     if (!token) {
//       throw new ApiError('No authentication token found', 401);
//     }

//     const res = await fetch(`${BACKEND_URL}/api/upload/signed-url`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ file_url: fileUrl, expires_in: expiresIn }),
//     });

//     let data;
//     try {
//       data = await res.json();
//     } catch {
//       throw new ApiError('Invalid response from server');
//     }

//     if (!res.ok) {
//       const errorMsg =
//         data?.message || data?.error || 'Failed to get signed URL';
//       throw new ApiError(errorMsg, res.status);
//     }

//     return data;
//   } catch (error) {
//     if (isNetworkError(error)) {
//       throw new ApiError(
//         'Unable to connect to server. Please check your internet connection.',
//       );
//     }
//     if (error instanceof ApiError) {
//       throw error;
//     }
//     throw new ApiError('Failed to get signed URL');
//   }
// };

// export const ALLOWED_FILE_TYPES = [
//   'image/jpeg',
//   'image/png',
//   'image/gif',
//   'image/webp',
//   'image/heic',
//   'image/heif',
//   'application/pdf',
//   'text/plain',
//   'text/markdown',
//   'application/msword',
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
// ];

// export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// export const validateFile = (file: {
//   type: string;
//   size: number;
// }): string | null => {
//   if (!ALLOWED_FILE_TYPES.includes(file.type)) {
//     return 'File type not allowed';
//   }

//   if (file.size > MAX_FILE_SIZE) {
//     return 'File too large. Maximum size is 10MB';
//   }

//   return null;
// };

// src/api/upload.ts

const getBackendUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'http://192.168.1.172:3000';
};

const BACKEND_URL = getBackendUrl();

const getAuthToken = async (): Promise<string> => {
  const AsyncStorage =
    await import('@react-native-async-storage/async-storage');
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

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const message = record.message || record.error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
};

const normalizeUploadedFile = (
  data: unknown,
  file: { uri: string; name: string; type: string },
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
    linked_to_session: linkedToSession,
  };
};

export const uploadFile = async (
  file: { uri: string; name: string; type: string },
  sessionId?: string,
  folder?: string,
): Promise<UploadedFile> => {
  try {
    const token = await getAuthToken();

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
      },
      body: formData,
    });

    const data = await parseResponseBody(res);

    if (!res.ok) {
      const errorMsg = getErrorMessage(data, 'Failed to upload file');

      if (
        sessionId &&
        (res.status === 404 ||
          res.status === 405 ||
          errorMsg.includes('Cannot POST /api/upload'))
      ) {
        const legacyRes = await fetch(`${BACKEND_URL}/session/${sessionId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const legacyData = await parseResponseBody(legacyRes);

        if (!legacyRes.ok) {
          throw new ApiError(
            getErrorMessage(legacyData, 'Failed to upload file'),
            legacyRes.status,
          );
        }

        const normalized = normalizeUploadedFile(legacyData, file, true);
        if (!normalized.file_url) {
          throw new ApiError('Upload succeeded but no file URL was returned');
        }
        return normalized;
      }

      throw new ApiError(errorMsg, res.status);
    }

    const normalized = normalizeUploadedFile(data, file, false);
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
    const token = await getAuthToken();

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
    throw error;
  }
};

export const getSignedUrl = async (
  fileUrl: string,
  expiresIn?: number,
): Promise<{ signed_url: string }> => {
  try {
    const token = await getAuthToken();

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
