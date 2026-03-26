import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

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
  accessToken?: string,
  refreshToken?: string,
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

export const removeToken = async () => {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
};
