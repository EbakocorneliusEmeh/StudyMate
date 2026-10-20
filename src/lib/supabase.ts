import { createClient } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';

// Polyfill WebCrypto for Supabase PKCE
if (!global.crypto) {
  global.crypto = Crypto as unknown as typeof globalThis.crypto;
}

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://hltqozqfkkendnoptvgb.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_Un7zlUdgTVRnze6kNuYeOQ_CDpsmcC3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    detectSessionInUrl: true, // Enable for OAuth
  },
});

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
