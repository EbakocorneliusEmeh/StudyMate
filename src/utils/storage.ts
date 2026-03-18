import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const storeToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Failed to store token:', error);
    Alert.alert('Error', 'Failed to save authentication token');
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
};
