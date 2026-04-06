import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const BACKEND_URL = 'http://172.20.10.5:3000';

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
