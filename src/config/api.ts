import { Platform } from 'react-native';

const ANDROID_EMULATOR_API_URL = 'http://10.0.2.2:3000';
const IOS_SIMULATOR_API_URL = 'http://localhost:3000';
const PHYSICAL_DEVICE_API_URL = 'http://192.168.237.246:3000';

const envApiUrl =
  process.env.EXPO_PUBLIC_API_URL?.trim() || process.env.API_URL?.trim();

const normalizeLocalUrl = (url: string): string => {
  if (__DEV__ && Platform.OS === 'android') {
    return url.replace('http://localhost:3000', ANDROID_EMULATOR_API_URL);
  }

  if (__DEV__ && Platform.OS === 'ios') {
    return url.replace('http://localhost:3000', IOS_SIMULATOR_API_URL);
  }

  return url;
};

const rawApiUrl = normalizeLocalUrl(envApiUrl || PHYSICAL_DEVICE_API_URL);

export const API_URL = rawApiUrl.replace(/\/$/, '');
export const isEmulator = __DEV__ && Platform.OS === 'android';
