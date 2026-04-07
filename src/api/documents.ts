import AsyncStorage from '@react-native-async-storage/async-storage';
import { DocumentStatusResponse } from '../types';
import { getToken, refreshAccessToken } from '../utils/storage';
import { ApiError } from './upload';

const BACKEND_URL = 'http://192.168.1.169:3000';

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

export const getDocumentStatus = async (
  documentId: string,
): Promise<DocumentStatusResponse> => {
  const res = await makeAuthenticatedRequest(
    `${BACKEND_URL}/api/documents/${documentId}`,
    { method: 'GET' },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      data?.message || 'Failed to fetch document status',
      res.status,
    );
  }

  return data as DocumentStatusResponse;
};
