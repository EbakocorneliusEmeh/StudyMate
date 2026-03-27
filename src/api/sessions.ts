// const BACKEND_URL =
//   typeof window !== 'undefined' && window.location.hostname === 'localhost'
//     ? 'http://localhost:3000'
//     : process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.172:3000';

// export interface StudySession {
//   id: string;
//   user_id: string;
//   title: string;
//   subject: string | null;
//   created_at: string;
// }

// export interface SessionFile {
//   id: string;
//   session_id: string;
//   file_name: string;
//   file_url: string;
//   file_type: string;
//   file_size: number;
//   created_at: string;
// }

// export interface StudySessionListResponse {
//   sessions: StudySession[];
//   total: number;
// }

// export class ApiError extends Error {
//   constructor(
//     public message: string,
//     public status?: number,
//   ) {
//     super(message);
//     this.name = 'ApiError';
//   }
// }

// const isNetworkError = (error: unknown): boolean => {
//   if (
//     error instanceof TypeError &&
//     error.message.includes('Network request failed')
//   ) {
//     return true;
//   }
//   return false;
// };

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

// export const createSession = async (
//   title: string,
//   subject?: string,
// ): Promise<StudySession> => {
//   try {
//     const token = await getAuthToken();

//     const res = await fetch(`${BACKEND_URL}/api/session/create`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ title, subject }),
//     });

//     let data;
//     try {
//       data = await res.json();
//     } catch (e) { // Fixed: added (e)
//       throw new ApiError('Invalid response from server');
//     }

//     if (!res.ok) {
//       const errorMsg =
//         data?.message || data?.error || 'Failed to create session';
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
//     throw new ApiError('Failed to create session');
//   }
// };

// export const getSessions = async (): Promise<StudySessionListResponse> => {
//   try {
//     const token = await getAuthToken();

//     const res = await fetch(`${BACKEND_URL}/api/session/list`, {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     let data;
//     try {
//       data = await res.json();
//     } catch (e) { // Fixed: added (e)
//       throw new ApiError('Invalid response from server');
//     }

//     if (!res.ok) {
//       const errorMsg =
//         data?.message || data?.error || 'Failed to fetch sessions';
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
//     throw new ApiError('Failed to fetch sessions');
//   }
// };

// export const getSession = async (id: string): Promise<StudySession> => {
//   try {
//     const token = await getAuthToken();

//     const res = await fetch(`${BACKEND_URL}/api/session/${id}`, {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     let data;
//     try {
//       data = await res.json();
//     } catch (e) { // Fixed: added (e)
//       throw new ApiError('Invalid response from server');
//     }

//     if (!res.ok) {
//       const errorMsg =
//         data?.message || data?.error || 'Failed to fetch session';
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
//     throw new ApiError('Failed to fetch session');
//   }
// };

// export const deleteSession = async (
//   id: string,
// ): Promise<{ message: string }> => {
//   try {
//     const token = await getAuthToken();

//     const res = await fetch(`${BACKEND_URL}/api/session/${id}`, {
//       method: 'DELETE',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     let data;
//     try {
//       data = await res.json();
//     } catch (e) { // Fixed: added (e)
//       throw new ApiError('Invalid response from server');
//     }

//     if (!res.ok) {
//       const errorMsg =
//         data?.message || data?.error || 'Failed to delete session';
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
//     throw new ApiError('Failed to delete session');
//   }
// };

// export const getSessionFiles = async (
//   sessionId: string,
// ): Promise<SessionFile[]> => {
//   try {
//     const token = await getAuthToken();

//     const res = await fetch(`${BACKEND_URL}/api/session/${sessionId}/files`, {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     let data;
//     try {
//       data = await res.json();
//     } catch (e) { // Fixed: added (e)
//       throw new ApiError('Invalid response from server');
//     }

//     if (!res.ok) {
//       const errorMsg =
//         data?.message || data?.error || 'Failed to fetch session files';
//       throw new ApiError(errorMsg, res.status);
//     }

//     return data.files || [];
//   } catch (error) {
//     if (isNetworkError(error)) {
//       throw new ApiError(
//         'Unable to connect to server. Please check your internet connection.',
//       );
//     }
//     if (error instanceof ApiError) {
//       throw error;
//     }
//     throw new ApiError('Failed to fetch session files');
//   }
// };

// export const linkFileToSession = async (
//   sessionId: string,
//   fileUrl: string,
//   fileName: string,
//   fileType: string,
//   fileSize: number,
// ): Promise<SessionFile> => {
//   try {
//     const token = await getAuthToken();

//     const res = await fetch(`${BACKEND_URL}/api/session/${sessionId}/files`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({
//         file_url: fileUrl,
//         file_name: fileName,
//         file_type: fileType,
//         file_size: fileSize,
//       }),
//     });

//     let data;
//     try {
//       data = await res.json();
//     } catch (e) { // Fixed: added (e)
//       throw new ApiError('Invalid response from server');
//     }

//     if (!res.ok) {
//       const errorMsg =
//         data?.message || data?.error || 'Failed to link file to session';
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
//     throw new ApiError('Failed to link file to session');
//   }
// };

// export const unlinkFileFromSession = async (
//   sessionId: string,
//   fileId: string,
// ): Promise<{ message: string }> => {
//   try {
//     const token = await getAuthToken();

//     const res = await fetch(
//       `${BACKEND_URL}/api/session/${sessionId}/files/${fileId}`,
//       {
//         method: 'DELETE',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       },
//     );

//     let data;
//     try {
//       data = await res.json();
//     } catch (e) { // Fixed: added (e)
//       throw new ApiError('Invalid response from server');
//     }

//     if (!res.ok) {
//       const errorMsg =
//         data?.message || data?.error || 'Failed to unlink file from session';
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
//     throw new ApiError('Failed to unlink file from session');
//   }
// };

import { getToken } from '../utils/storage';

// Simplified for Expo Go to ensure it always hits your computer
const BACKEND_URL = 'http://192.168.1.172:3000';

export interface StudySession {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  created_at: string;
}

export interface SessionFile {
  id: string;
  session_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface StudySessionListResponse {
  sessions: StudySession[];
  total: number;
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const isNetworkError = (error: unknown): boolean => {
  if (
    error instanceof TypeError &&
    error.message.includes('Network request failed')
  ) {
    return true;
  }
  return false;
};

const getAuthToken = async (): Promise<string> => {
  // Using your existing utility is cleaner
  const token = await getToken();
  if (!token) {
    throw new ApiError('Not authenticated', 401);
  }
  return token;
};

export const createSession = async (
  title: string,
  subject?: string,
): Promise<StudySession> => {
  try {
    const token = await getAuthToken();

    const res = await fetch(`${BACKEND_URL}/api/session/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, subject }),
    });

    let data;
    try {
      data = await res.json();
    } catch (_e) {
      // FIXED: renamed to _e
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok) {
      const errorMsg =
        data?.message || data?.error || 'Failed to create session';
      throw new ApiError(errorMsg, res.status);
    }

    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ApiError('Unable to connect to server. Check your connection.');
    }
    throw error instanceof ApiError
      ? error
      : new ApiError('Failed to create session');
  }
};

export const getSessions = async (): Promise<StudySessionListResponse> => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${BACKEND_URL}/api/session/list`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    let data;
    try {
      data = await res.json();
    } catch (_e) {
      // FIXED: renamed to _e
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok)
      throw new ApiError(
        data?.message || 'Failed to fetch sessions',
        res.status,
      );
    return data;
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError('Failed to fetch sessions');
  }
};

export const getSession = async (id: string): Promise<StudySession> => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${BACKEND_URL}/api/session/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    let data;
    try {
      data = await res.json();
    } catch (_e) {
      // FIXED: renamed to _e
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok)
      throw new ApiError(
        data?.message || 'Failed to fetch session',
        res.status,
      );
    return data;
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError('Failed to fetch session');
  }
};

export const deleteSession = async (
  id: string,
): Promise<{ message: string }> => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${BACKEND_URL}/api/session/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    let data;
    try {
      data = await res.json();
    } catch (_e) {
      // FIXED: renamed to _e
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok)
      throw new ApiError(
        data?.message || 'Failed to delete session',
        res.status,
      );
    return data;
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError('Failed to delete session');
  }
};

export const getSessionFiles = async (
  sessionId: string,
): Promise<SessionFile[]> => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${BACKEND_URL}/api/session/${sessionId}/files`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    let data;
    try {
      data = await res.json();
    } catch (_e) {
      // FIXED: renamed to _e
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok)
      throw new ApiError(data?.message || 'Failed to fetch files', res.status);
    return data.files || [];
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError('Failed to fetch files');
  }
};

export const linkFileToSession = async (
  sessionId: string,
  fileUrl: string,
  fileName: string,
  fileType: string,
  fileSize: number,
): Promise<SessionFile> => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${BACKEND_URL}/api/session/${sessionId}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
      }),
    });

    let data;
    try {
      data = await res.json();
    } catch (_e) {
      // FIXED: renamed to _e
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok)
      throw new ApiError(data?.message || 'Failed to link file', res.status);
    return data;
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError('Failed to link file');
  }
};

export const unlinkFileFromSession = async (
  sessionId: string,
  fileId: string,
): Promise<{ message: string }> => {
  try {
    const token = await getAuthToken();
    const res = await fetch(
      `${BACKEND_URL}/api/session/${sessionId}/files/${fileId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    let data;
    try {
      data = await res.json();
    } catch (_e) {
      // FIXED: renamed to _e
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok)
      throw new ApiError(data?.message || 'Failed to unlink file', res.status);
    return data;
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError('Failed to unlink file');
  }
};
