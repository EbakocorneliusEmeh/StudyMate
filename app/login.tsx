import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; // For visibility icon
import { login } from '../src/api/auth';
import { storeToken } from '../src/utils/storage';
import logoImg from '../assets/images/logo.png';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const data = await login({ email, password });
      await storeToken(data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      Alert.alert('Success', `Welcome ${data.user.name}`);
      router.replace('/sessions');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Image source={logoImg} style={styles.logo} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Log in to continue your learning journey
            </Text>
          </View>

          {/* Form Section */}
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

            <TouchableOpacity style={styles.forgotPass}>
              <Text style={styles.forgotPassText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Main Action Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogin}
              style={styles.buttonShadow}
            >
              <LinearGradient
                colors={['#7f13ec', '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.buttonText}>Login</Text>
                <Ionicons name="log-in-outline" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              New to StudyMate?{' '}
              <Text
                style={styles.link}
                onPress={() => router.push('/register')}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6f8', paddingTop: 20 }, // background-light
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
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
  logo: {
    width: 55,
    height: 55,
    tintColor: '#7f13ec', // If using a template icon
  },
});
