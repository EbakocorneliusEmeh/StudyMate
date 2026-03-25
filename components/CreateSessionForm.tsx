import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createSession } from '../src/api/sessions';

interface CreateSessionFormProps {
  onSuccess: () => void;
}

export const CreateSessionForm: React.FC<CreateSessionFormProps> = ({
  onSuccess,
}) => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a session title');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const newSession = await createSession(title.trim(), subject.trim() || undefined);
      setTitle('');
      setSubject('');
      onSuccess();
      Alert.alert('Success', 'Study session created successfully!');
      
      router.push(`/session/${newSession.id}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Session Title</Text>
      <View style={styles.inputContainer}>
        <Ionicons
          name="book-outline"
          size={20}
          color="#94a3b8"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Biology Revision"
          placeholderTextColor="#94a3b8"
          autoCapitalize="words"
          returnKeyType="next"
          editable={!isLoading}
        />
      </View>

      <Text style={styles.label}>Subject (Optional)</Text>
      <View style={styles.inputContainer}>
        <Ionicons
          name="school-outline"
          size={20}
          color="#94a3b8"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={subject}
          onChangeText={setSubject}
          placeholder="e.g., Biology, Chemistry, Physics"
          placeholderTextColor="#94a3b8"
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          editable={!isLoading}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleSubmit}
        style={styles.buttonShadow}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#7f13ec', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text style={styles.buttonText}>Create Session</Text>
              <Ionicons name="add-circle-outline" size={20} color="white" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 12,
  },
  buttonShadow: {
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
