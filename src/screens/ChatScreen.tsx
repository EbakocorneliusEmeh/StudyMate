import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ApiError } from '../api/upload';
import { askQuestion } from '../services/api';
import { Message } from '../types';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    documentId?: string;
    sessionId?: string;
    fileName?: string;
    fileUrl?: string;
  }>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const hasContext = Boolean(
    params.documentId || params.fileName || params.sessionId || params.fileUrl,
  );

  useEffect(() => {
    const introText = params.fileName
      ? `I am ready to help you study from "${params.fileName}". Ask me to summarize it, explain key ideas, or quiz you on it.`
      : 'I am your AI Companion. Upload study material or ask a question about the notes already in your account.';

    setMessages([
      {
        id: 'intro',
        text: introText,
        fromUser: false,
        createdAt: new Date(),
      },
    ]);
  }, [params.documentId, params.fileName, params.fileUrl, params.sessionId]);

  const getFriendlyErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      if (params.fileUrl) {
        if (error.statusCode === 401) {
          return 'Your login session expired, so I could not open this uploaded file. Please sign in again and retry.';
        }

        if (error.statusCode === 403 || error.statusCode === 404) {
          return 'I could not access this uploaded file. It may have been moved, deleted, or you may not have permission to open it.';
        }

        return `I could not prepare "${params.fileName || 'this file'}" for AI reading. ${error.message}`;
      }

      return error.message;
    }

    if (error instanceof Error) {
      return 'I could not reach the AI service right now. Please try again in a moment.';
    }

    return 'Something went wrong while opening your study material. Please try again.';
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      fromUser: true,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    const currentInput = input;
    setInput('');

    try {
      const data = await askQuestion(currentInput, {
        documentId: params.documentId,
        sessionId: params.sessionId,
        fileName: params.fileName,
        fileUrl: params.fileUrl,
      });
      const showProcessingHint =
        data.documentScoped === false || data.chunkCount === 0;
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.error
          ? data.error
          : showProcessingHint
            ? `We found the file, but its text is still processing or could not be read clearly.${data.answer ? `\n\n${data.answer}` : ''}`
            : data.answer,
        fromUser: false,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: getFriendlyErrorMessage(err),
        fromUser: false,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = async (messageId: string, text: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedMessageId(messageId);
    setTimeout(() => {
      setCopiedMessageId((currentId) =>
        currentId === messageId ? null : currentId,
      );
    }, 1800);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.header}>AI Companion</Text>
      {params.fileName ? (
        <Text style={styles.contextText}>Focused on {params.fileName}</Text>
      ) : (
        <Text style={styles.contextText}>
          Ask questions about your uploaded notes
        </Text>
      )}
      {!hasContext && (
        <TouchableOpacity
          style={styles.uploadCta}
          onPress={() => router.push('/upload-material')}
        >
          <Text style={styles.uploadCtaText}>Upload Study Material</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={item.fromUser ? styles.messageRowUser : styles.messageRowAi}>
            <View
              style={[
                styles.bubble,
                item.fromUser ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.msgText,
                  { color: item.fromUser ? 'white' : '#0f172a' },
                ]}
              >
                {item.text}
              </Text>
            </View>
            {!item.fromUser && (
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  void handleCopyMessage(item.id, item.text);
                }}
              >
                <Text style={styles.copyButtonText}>
                  {copiedMessageId === item.id ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your math notes..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.sendBtnText}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingTop: 50,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#0f172a',
  },
  contextText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  uploadCta: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  uploadCtaText: {
    color: '#4338ca',
    fontWeight: '600',
    fontSize: 13,
  },
  messageList: {
    paddingBottom: 20,
    gap: 6,
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  messageRowAi: {
    alignItems: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
  },
  msgText: {
    fontSize: 16,
    lineHeight: 22,
  },
  copyButton: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  inputRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    minHeight: 45,
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#0f172a',
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: '#2563eb',
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
