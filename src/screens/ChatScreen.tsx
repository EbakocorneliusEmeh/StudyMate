import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { sendCompanionMessage } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const _params = useLocalSearchParams();
  const [input, setInput] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), text: input, fromUser: true };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const response = await sendCompanionMessage({
        question: currentInput,
        history: messages.map((m) => ({
          role: m.fromUser ? 'user' : 'model',
          parts: [{ text: m.text }],
        })),
        mode: 'text',
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: response.text,
          fromUser: false,
        },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert(
        'Error',
        'Companion is unavailable. Check your backend connection.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Companion (Test Mode)</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageWrapper,
              item.fromUser ? styles.userWrapper : styles.aiWrapper,
            ]}
          >
            <View
              style={[
                styles.bubble,
                item.fromUser ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.msgText,
                  { color: item.fromUser ? 'white' : '#1e293b' },
                ]}
              >
                {item.text}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 20 }}
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendBtn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  messageWrapper: { marginVertical: 5, width: '100%' },
  userWrapper: { alignItems: 'flex-end' },
  aiWrapper: { alignItems: 'flex-start' },
  bubble: { padding: 12, borderRadius: 20, maxWidth: '80%' },
  userBubble: { backgroundColor: '#2563eb' },
  aiBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  msgText: { fontSize: 16, lineHeight: 22 },
  inputContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    color: '#0f172a',
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
