import { Platform } from 'react-native';

const ANDROID_EMULATOR_API_URL = 'http://10.0.2.2:3000';
const IOS_SIMULATOR_API_URL = 'http://localhost:3000';
const PHYSICAL_DEVICE_API_URL = 'http://192.168.1.172:3000';

// Get raw URL from env or platform-specific fallback
const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  process.env.API_URL?.trim() ||
  (Platform.OS === 'android' && __DEV__
    ? ANDROID_EMULATOR_API_URL
    : Platform.OS === 'ios' && __DEV__
      ? IOS_SIMULATOR_API_URL
      : PHYSICAL_DEVICE_API_URL);

export const API_URL = rawApiUrl.replace(/\/$/, '');
export const isEmulator =
  Platform.OS === 'android' && __DEV__ && !process.env.EXPO_PUBLIC_API_URL;
