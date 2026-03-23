const BACKEND_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.169:3000';

export interface StudySession {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
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
    } catch {
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
      throw new ApiError(
        'Unable to connect to server. Please check your internet connection.',
      );
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create session');
  }
};

export const getSessions = async (): Promise<StudySessionListResponse> => {
  try {
    const token = await getAuthToken();

    const res = await fetch(`${BACKEND_URL}/api/session/list`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok) {
      const errorMsg =
        data?.message || data?.error || 'Failed to fetch sessions';
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
    throw new ApiError('Failed to fetch sessions');
  }
};

export const getSession = async (id: string): Promise<StudySession> => {
  try {
    const token = await getAuthToken();

    const res = await fetch(`${BACKEND_URL}/api/session/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok) {
      const errorMsg =
        data?.message || data?.error || 'Failed to fetch session';
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
    throw new ApiError('Failed to fetch session');
  }
};

export const deleteSession = async (
  id: string,
): Promise<{ message: string }> => {
  try {
    const token = await getAuthToken();

    const res = await fetch(`${BACKEND_URL}/api/session/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new ApiError('Invalid response from server');
    }

    if (!res.ok) {
      const errorMsg =
        data?.message || data?.error || 'Failed to delete session';
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
    throw new ApiError('Failed to delete session');
  }
};
