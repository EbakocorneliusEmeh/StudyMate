import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CreateSessionForm } from '../components/CreateSessionForm';

export default function CreateSessionPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Main Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Back Button (Maintained per request) */}
          <View style={styles.header}>
            {/* <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity> */}

            <View style={styles.heroSection}>
              <Text style={styles.heroText}>
                What would you like to{' '}
                <Text style={styles.heroAccent}>master</Text> today?
              </Text>

              {/* Reference Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#64748b"
                  style={styles.searchIcon}
                />
                <TextInput
                  placeholder="Search your library or topics..."
                  placeholderTextColor="rgba(100, 116, 139, 0.6)"
                  style={styles.searchInput}
                />
              </View>
            </View>
          </View>

          {/* New Form Design */}
          <CreateSessionForm onSuccess={() => router.replace('/sessions')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f6f8', // surface base
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroText: {
    fontSize: 28, // Headline scale
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 24,
  },
  heroAccent: {
    color: '#7f13ec', // Primary violet
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lexend',
    color: '#0f172a',
  },
});
