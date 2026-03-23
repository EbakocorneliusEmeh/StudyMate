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
  ActivityIndicator, // Added for loader
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { register } from '../src/api/auth';
import { storeToken } from '../src/utils/storage';
import logoImg from '../assets/images/logo.png';

export default function RegisterScreen() {
  const router = useRouter();

  // States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const [errorText, setErrorText] = useState<string | null>(null); // Added error state

  // Clear error when user updates any field
  useEffect(() => {
    if (errorText) setErrorText(null);
  }, [name, email, password]);

  const handleRegister = async () => {
    setErrorText(null);

    // 1. Basic Validation
    if (!name || !email || !password) {
      setErrorText('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setErrorText('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await register({ name, email, password });

      // 2. Storage
      await storeToken(data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // 3. Navigation
      router.replace('/sessions');
    } catch (err: any) {
      // 4. Capture exact message from your NestJS AuthService
      const message =
        err?.response?.data?.message || err.message || 'Registration failed';

      // Handle array messages from NestJS DTO validation
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.navHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>AI Study Companion</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.heroSection}>
            <View style={styles.logoCircle}>
              <Image
                source={logoImg}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Start Your Study Journey</Text>
            <Text style={styles.subtitle}>
              Start your focused learning experience today.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
                autoCapitalize="words"
                style={styles.input}
                editable={!isLoading}
              />
            </View>

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="example@email.com"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                editable={!isLoading}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                placeholder="Create a strong password"
                placeholderTextColor="#94a3b8"
                style={[styles.input, { flex: 1 }]}
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

            {/* ERROR DISPLAY AREA */}
            {errorText ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorLabel}>{errorText}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRegister}
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
                    <Text style={styles.buttonText}>Sign Up</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
              <Image
                source={{
                  uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
                }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={[styles.link, isLoading && { color: '#94a3b8' }]}
                onPress={() => !isLoading && router.push('/login')}
              >
                Login here
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6f8', paddingTop: 30 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(127, 19, 236, 0.1)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  heroSection: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  logoCircle: {
    width: 90,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  logo: { width: 50, height: 50, tintColor: '#7f13ec' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  form: { marginTop: 10 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(127, 19, 236, 0.1)',
    borderRadius: 16,
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 56, fontSize: 16, color: '#0f172a' },
  eyeIcon: { padding: 10 },

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
  errorLabel: { color: '#b91c1c', fontSize: 14, fontWeight: '600', flex: 1 },

  buttonShadow: {
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 10,
  },
  primaryButton: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(127, 19, 236, 0.1)',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  socialRow: { flexDirection: 'row', gap: 15 },
  socialButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(127, 19, 236, 0.1)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialIcon: { width: 18, height: 18 },
  socialText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { color: '#64748b', fontSize: 14 },
  link: { color: '#7f13ec', fontWeight: '800' },
});
