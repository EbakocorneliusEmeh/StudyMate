import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { DocumentSourceRecord, GeneratedQuiz } from '../types';
import { API_URL } from '../config/api';

const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const GENERATED_QUIZZES_KEY = 'generatedQuizzes';
const DOCUMENT_SOURCES_KEY = 'documentSources';
const SESSION_CHAT_PREFIX = 'sessionChatHistory:';

const BACKEND_URL = API_URL;

export interface StoredUser {
  id?: string;
  name?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string | null;
}

export const storeToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store token:', error);
    Alert.alert('Error', 'Failed to save authentication token');
  }
};

export const storeRefreshToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store refresh token:', error);
  }
};

export const storeAuthSession = async (
  accessToken?: string | null,
  refreshToken?: string | null,
) => {
  if (accessToken) {
    await storeToken(accessToken);
  }

  if (refreshToken) {
    await storeRefreshToken(refreshToken);
  }
};

export const setStoredUser = async (user: StoredUser) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store user:', error);
  }
};

export const getStoredUser = async (): Promise<StoredUser | null> => {
  try {
    const value = await AsyncStorage.getItem(USER_KEY);
    return value ? (JSON.parse(value) as StoredUser) : null;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
};

export const clearStoredUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to remove user:', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await res.json();
    if (data.access_token) {
      await storeToken(data.access_token);
      if (data.refresh_token) {
        await storeRefreshToken(data.refresh_token);
      }
      return data.access_token;
    }
    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    await removeToken();
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
};

const readJson = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) {
      return fallback;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return fallback;
  }
};

const writeJson = async <T>(key: string, value: T) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write ${key}:`, error);
    throw error;
  }
};

export const getGeneratedQuizzes = async (): Promise<GeneratedQuiz[]> =>
  readJson<GeneratedQuiz[]>(GENERATED_QUIZZES_KEY, []);

export const saveGeneratedQuiz = async (quiz: GeneratedQuiz) => {
  const quizzes = await getGeneratedQuizzes();
  const nextQuizzes = [quiz, ...quizzes.filter((item) => item.id !== quiz.id)];
  await writeJson(GENERATED_QUIZZES_KEY, nextQuizzes);
};

export const getGeneratedQuizById = async (
  quizId: string,
): Promise<GeneratedQuiz | null> => {
  const quizzes = await getGeneratedQuizzes();
  return quizzes.find((quiz) => quiz.id === quizId) ?? null;
};

export const getDocumentSources = async (): Promise<DocumentSourceRecord[]> =>
  readJson<DocumentSourceRecord[]>(DOCUMENT_SOURCES_KEY, []);

export const upsertDocumentSource = async (source: DocumentSourceRecord) => {
  const sources = await getDocumentSources();
  const nextSources = [
    source,
    ...sources.filter((item) => item.id !== source.id),
  ];
  await writeJson(DOCUMENT_SOURCES_KEY, nextSources);
};

export const findDocumentSource = async (params: {
  fileName?: string;
  fileId?: string;
  fileUrl?: string;
  documentId?: string;
  sessionId?: string;
}) => {
  const sources = await getDocumentSources();
  const { fileName, fileId, fileUrl, documentId, sessionId } = params;

  return (
    sources.find((source) => {
      if (fileId && source.fileId === fileId) {
        return true;
      }

      if (fileUrl && source.fileUrl === fileUrl) {
        return true;
      }

      if (documentId && source.documentId === documentId) {
        return true;
      }

      if (fileName && source.fileName === fileName) {
        if (!sessionId || !source.sessionId || source.sessionId === sessionId) {
          return true;
        }
      }

      return false;
    }) ?? null
  );
};

export interface StoredChatMessage {
  id: string;
  text: string;
  fromUser: boolean;
}

const getSessionChatHistoryKey = (sessionId: string) =>
  `${SESSION_CHAT_PREFIX}${sessionId}`;

export const getSessionChatHistory = async (
  sessionId: string,
): Promise<StoredChatMessage[]> =>
  readJson<StoredChatMessage[]>(getSessionChatHistoryKey(sessionId), []);

export const saveSessionChatHistory = async (
  sessionId: string,
  messages: StoredChatMessage[],
) => {
  await writeJson(getSessionChatHistoryKey(sessionId), messages);
};

export const appendSessionChatMessage = async (
  sessionId: string,
  message: StoredChatMessage,
) => {
  const current = await getSessionChatHistory(sessionId);
  await saveSessionChatHistory(sessionId, [...current, message]);
};
