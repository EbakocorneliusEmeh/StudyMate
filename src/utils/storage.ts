import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const storeToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('access_token', token);
  } catch (error) {
    console.error('Failed to store token:', error);
    Alert.alert('Error', 'Failed to save authentication token');
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('access_token');
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('access_token');
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
};
