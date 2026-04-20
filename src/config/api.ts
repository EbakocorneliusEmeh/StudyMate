import { Platform } from 'react-native';

const ANDROID_EMULATOR_API_URL = 'http://10.0.2.2:3000';
const IOS_SIMULATOR_API_URL = 'http://localhost:3000';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  (Platform.OS === 'android'
    ? ANDROID_EMULATOR_API_URL
    : IOS_SIMULATOR_API_URL);
