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
  // Logic remains untouched, but we add a local state for the UI level selector
  const [level, setLevel] = useState('Beginner');
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
      const newSession = await createSession(
        title.trim(),
        subject.trim() || undefined,
      );
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
    <View style={styles.formWrapper}>
      <Text style={styles.fieldLabel}>Topic to Study</Text>
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.roundedInput}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Photosynthesis"
          placeholderTextColor="rgba(100, 116, 139, 0.6)"
          editable={!isLoading}
        />
      </View>

      <Text style={styles.fieldLabel}>Subject</Text>
      <View style={styles.inputGroup}>
        <View style={styles.selectorContainer}>
          <TextInput
            style={styles.selectorInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="Biology"
            placeholderTextColor="rgba(100, 116, 139, 0.6)"
            editable={!isLoading}
          />
          <Ionicons name="chevron-down" size={20} color="#7f13ec" />
        </View>
      </View>

      {/* Complexity Level Selector from reference image */}
      <View style={styles.levelSection}>
        <Text style={styles.levelHeader}>COMPLEXITY LEVEL</Text>
        <View style={styles.levelGrid}>
          {['Beginner', 'Exam-level', 'Advanced'].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setLevel(item)}
              style={[
                styles.levelButton,
                level === item && styles.levelButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.levelButtonText,
                  level === item && styles.levelButtonTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleSubmit}
        disabled={isLoading}
        style={styles.ctaWrapper}
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
              <Text style={styles.buttonText}>START SESSION</Text>
              <Ionicons name="rocket-outline" size={22} color="white" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  formWrapper: {
    gap: 20,
    width: '100%',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700', // Lexend Bold per Design System
    color: '#0f172a',
    fontFamily: 'Lexend',
    marginLeft: 4,
  },
  inputGroup: {
    width: '100%',
  },
  roundedInput: {
    height: 56,
    backgroundColor: '#f1f5f9', // surface_container
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: 'Lexend',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectorInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: 'Lexend',
  },
  levelSection: {
    marginTop: 10,
    alignItems: 'center',
  },
  levelHeader: {
    fontSize: 10, // Micro scale
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 2,
    marginBottom: 16,
  },
  levelGrid: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 6,
    width: '100%',
  },
  levelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  levelButtonActive: {
    backgroundColor: '#ffffff', // surface_container_lowest
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  levelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'Lexend',
  },
  levelButtonTextActive: {
    color: '#7f13ec', // Primary violet
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Lexend',
  },
  ctaWrapper: {
    marginTop: 20,
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'Lexend',
  },
});
