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
import { searchApi } from '../api/search';
import { sendCompanionMessage } from '../services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    documentId?: string | string[];
    sessionId?: string | string[];
    fileName?: string | string[];
    fileUrl?: string | string[];
    fileType?: string | string[];
  }>();
  const documentId = getFirstParam(params.documentId);
  const sessionId = getFirstParam(params.sessionId);
  const fileName = getFirstParam(params.fileName);
  const fileUrl = getFirstParam(params.fileUrl);
  const fileType = getFirstParam(params.fileType);
  const [input, setInput] = useState('');
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
      const history = messages.map((m) => ({
        role: m.fromUser ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const response = documentId
        ? await searchApi.sendCompanionMessage({
            documentId,
            question: currentInput,
            history,
          })
        : await sendCompanionMessage({
            question: currentInput,
            history,
            sessionId,
            mode: fileType?.startsWith('image/')
              ? 'image'
              : fileType === 'application/pdf'
                ? 'pdf'
                : 'text',
            attachmentUrl: fileUrl,
            attachmentType: fileType || (fileUrl ? 'file' : undefined),
          });

      const replyText =
        'answer' in response
          ? response.answer
          : response.text || response.message || 'No response received.';

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: replyText,
          fromUser: false,
        },
      ]);
    } catch (err) {
      console.error('Companion chat failed:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as any).response?.data?.message ||
            (err as any).response?.data?.error ||
            (err as any).message
          : err instanceof Error
            ? err.message
            : 'Companion is unavailable.';
      Alert.alert('Error', errorMessage || 'Companion is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Glassmorphism Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#64748b" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.logoPlaceholder}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={20}
                color="white"
              />
            </View>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>StudyMate</Text>
              {documentId ? (
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {fileName || 'Selected material'}
                </Text>
              ) : (
                <Text style={styles.headerSubtitle}>
                  General companion chat
                </Text>
              )}
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {documentId ? 'DOC LINKED' : 'AI TUTOR ACTIVE'}
            </Text>
          </View>
        </View>
      </View>

      {documentId && (
        <View style={styles.attachmentBanner}>
          <View style={styles.attachmentDot}>
            <MaterialCommunityIcons
              name="file-document"
              size={16}
              color="#7f13ec"
            />
          </View>
          <View style={styles.attachmentTextWrap}>
            <Text style={styles.attachmentLabel}>Attached material</Text>
            <Text style={styles.attachmentName} numberOfLines={1}>
              {fileName || 'Selected document'}
            </Text>
          </View>
          {!!fileUrl && <Text style={styles.attachmentHint}>Ready</Text>}
        </View>
      )}

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
            {!item.fromUser && (
              <View style={styles.aiAvatarRow}>
                <View style={styles.aiIconCircle}>
                  <MaterialCommunityIcons
                    name="star-four-points"
                    size={12}
                    color="white"
                  />
                </View>
                <Text style={styles.aiNameText}>StudyMate AI</Text>
              </View>
            )}
            <View
              style={[
                styles.bubble,
                item.fromUser ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.msgText,
                  item.fromUser ? styles.userMsgText : styles.aiMsgText,
                ]}
              >
                {item.text}
              </Text>
            </View>
            {item.fromUser && <Text style={styles.readStatus}>Read</Text>}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.timestamp}>TODAY • 10:42 AM</Text>
        }
      />

      {/* Input Section */}
      <View style={styles.footer}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="add-circle-outline" size={28} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask StudyMate anything..."
              placeholderTextColor="#94a3b8"
              value={input}
              onChangeText={setInput}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="mic-outline" size={24} color="#7f13ec" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendBtn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <MaterialCommunityIcons name="send" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Base Surface
  container: { flex: 1, backgroundColor: '#F7F6F8' },

  // Header (Amethyst Pulse Navigation)
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    backgroundColor: '#7f13ec',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: 'rgba(127, 19, 236, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: { fontSize: 10, fontWeight: '800', color: '#7f13ec' },

  attachmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(127, 19, 236, 0.08)',
  },
  attachmentDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentTextWrap: {
    flex: 1,
  },
  attachmentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7f13ec',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e1924',
    marginTop: 2,
  },
  attachmentHint: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },

  // List & Messages
  listContent: { padding: 20, paddingBottom: 100 },
  timestamp: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  messageWrapper: { marginBottom: 20, width: '100%' },
  userWrapper: { alignItems: 'flex-end' },
  aiWrapper: { alignItems: 'flex-start' },

  // AI Identity Header
  aiAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 4,
  },
  aiIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7f13ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 8,
  },

  // Bubbles
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: '#7f13ec',
    borderTopRightRadius: 4,
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  msgText: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  userMsgText: { color: '#FFFFFF' },
  aiMsgText: { color: '#1e1924' },
  readStatus: { fontSize: 10, color: '#94a3b8', marginTop: 4, marginRight: 4 },

  // Footer / Input (The "Floating Jewel" Principle)
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    paddingHorizontal: 12,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f1eef4', // surface_container
    borderRadius: 24,
    paddingHorizontal: 16,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    color: '#1e1924',
    paddingVertical: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    backgroundColor: '#7f13ec', // Primary Amethyst
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
});
