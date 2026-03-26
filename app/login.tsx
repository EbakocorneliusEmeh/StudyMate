import React, { useState, useEffect } from 'react'; // Added useEffect
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../src/api/auth';
import { storeToken } from '../src/utils/storage';
import logoImg from '../assets/images/logo.png';

export default function LoginScreen() {
  const router = useRouter();

  // States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null); // New Error State

  // Clear error message when the user starts typing again
  useEffect(() => {
    if (errorText) setErrorText(null);
  }, [email, password]);

  const handleLogin = async () => {
    setErrorText(null);

    if (!email || !password) {
      setErrorText('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await login({ email, password });
      await storeToken(data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      Alert.alert('Success', `Welcome, ${data.user.name}!`);
      router.replace('/sessions');
    } catch (err: any) {
      // Extract specific message from your NestJS AuthService
      const message =
        err?.response?.data?.message || err.message || 'Login failed';

      // If NestJS returns an array of errors (from DTO validation), pick the first one
      setErrorText(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Image
                source={logoImg}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Log in to continue your learning journey
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@example.com"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              editable={!isLoading}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                style={styles.passwordInput}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!isPasswordVisible)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off' : 'eye'}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPass} disabled={isLoading}>
              <Text style={styles.forgotPassText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* --- ERROR MESSAGE DISPLAY --- */}
            {errorText ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorLabel}>{errorText}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={isLoading}
              style={[styles.buttonShadow, isLoading && { opacity: 0.8 }]}
            >
              <LinearGradient
                colors={
                  isLoading ? ['#94a3b8', '#64748b'] : ['#7f13ec', '#6366f1']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Login</Text>
                    <Ionicons name="log-in-outline" size={20} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              New to StudyMate?{' '}
              <Text
                style={[styles.link, isLoading && { color: '#94a3b8' }]}
                onPress={() => !isLoading && router.push('/register')}
              >
                Create an account
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6f8', paddingTop: 20 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  backButton: {
    marginTop: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(127, 19, 236, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: { width: 45, height: 45 },
  title: { fontSize: 32, fontWeight: '700', color: '#0f172a' },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  form: { width: '100%' },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    alignItems: 'center',
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: '#0f172a' },
  eyeIcon: { paddingRight: 16 },
  forgotPass: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 24 },
  forgotPassText: { color: '#7f13ec', fontWeight: '600', fontSize: 14 },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  errorLabel: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  buttonShadow: {
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { color: '#64748b', fontSize: 14 },
  link: { color: '#7f13ec', fontWeight: '700' },
});
