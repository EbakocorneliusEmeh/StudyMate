import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getSession,
  getSessionFiles,
  SessionFile,
  StudySession,
} from '../../src/api/sessions';
import { findDocumentSource } from '../../src/utils/storage';

export default function SessionDetailScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;
  const router = useRouter();
  const isFocused = useIsFocused();
  const [session, setSession] = useState<StudySession | null>(null);
  const [files, setFiles] = useState<SessionFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilesLoading, setIsFilesLoading] = useState(false);

  const fetchSession = async (sessionId: string) => {
    const data = await getSession(sessionId);
    setSession(data);
  };

  const fetchFiles = async (sessionId: string) => {
    setIsFilesLoading(true);
    try {
      const data = await getSessionFiles(sessionId);
      setFiles(data);
    } catch (err) {
      console.log('Error fetching session files:', err);
      setFiles([]);
      throw err;
    } finally {
      setIsFilesLoading(false);
    }
  };

  useEffect(() => {
    const loadSessionDetails = async () => {
      if (!id || !isFocused) {
        return;
      }

      try {
        setIsLoading(true);
        await Promise.all([fetchSession(id), fetchFiles(id)]);
      } catch (err) {
        console.log('Error loading session details:', err);
        Alert.alert('Error', 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    void loadSessionDetails();
  }, [id, isFocused]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return 'image-outline';
    if (type === 'application/pdf') return 'document-text-outline';
    if (type.includes('word')) return 'document-outline';
    if (type.startsWith('text/')) return 'document-text-outline';
    return 'attach-outline';
  };

  const openFileInCompanion = async (file: SessionFile) => {
    try {
      const localSource = await findDocumentSource({
        fileName: file.file_name,
        fileUrl: file.file_url,
        sessionId: session?.id,
      });

      router.push({
        pathname: '/ai-companion',
        params: {
          sessionId: session?.id,
          fileName: localSource?.fileName || file.file_name,
          fileUrl: localSource?.fileUrl || file.file_url,
          fileType: localSource?.mimeType || file.file_type,
          ...(localSource?.documentId
            ? { documentId: localSource.documentId }
            : {}),
        },
      });
    } catch (error) {
      console.warn('Falling back to direct companion open:', error);
      router.push({
        pathname: '/ai-companion',
        params: {
          sessionId: session?.id,
          fileName: file.file_name,
          fileUrl: file.file_url,
          fileType: file.file_type,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7f13ec" />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Session Details
          </Text>
        </View>
        <TouchableOpacity
          style={styles.sessionsNavButton}
          onPress={() => router.push('/sessions')}
        >
          <Ionicons name="list-outline" size={18} color="#7f13ec" />
          <Text style={styles.sessionsNavText}>Sessions</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          {session.subject && (
            <View style={styles.subjectContainer}>
              <Ionicons name="book-outline" size={16} color="#7f13ec" />
              <Text style={styles.sessionSubject}>{session.subject}</Text>
            </View>
          )}
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.sessionDate}>
              Created: {formatDate(session.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.filesSection}>
          <Text style={styles.sectionTitle}>Files</Text>

          {isFilesLoading ? (
            <View style={styles.emptyFilesContainer}>
              <ActivityIndicator size="small" color="#7f13ec" />
              <Text style={styles.emptyFilesText}>Loading files...</Text>
            </View>
          ) : files.length > 0 ? (
            <View style={styles.filesList}>
              {files.map((file) => (
                <TouchableOpacity
                  key={file.id}
                  style={styles.fileItem}
                  onPress={() => {
                    void openFileInCompanion(file);
                  }}
                >
                  <View style={styles.fileIconContainer}>
                    <Ionicons
                      name={
                        getFileIcon(
                          file.file_type,
                        ) as keyof typeof Ionicons.glyphMap
                      }
                      size={22}
                      color="#7f13ec"
                    />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.file_name}
                    </Text>
                    <Text style={styles.fileMeta}>
                      {formatFileSize(file.file_size)}
                    </Text>
                  </View>
                  <Ionicons name="open-outline" size={20} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyFilesContainer}>
              <Ionicons name="folder-open-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyFilesText}>
                Files will appear here after upload
              </Text>
            </View>
          )}

          <View style={styles.uploadButtonContainer}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => {
                if (!session) {
                  Alert.alert('Error', 'No session available');
                  return;
                }
                router.push({
                  pathname: '/upload-material',
                  params: { sessionId: session.id },
                });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
              <Text style={styles.uploadButtonText}>Upload File</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  headerBackButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  sessionsNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(127, 19, 236, 0.08)',
  },
  sessionsNavText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7f13ec',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#7f13ec',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionSubject: {
    fontSize: 16,
    color: '#7f13ec',
    marginLeft: 8,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDate: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  placeholderSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  filesSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyFilesContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyFilesText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  filesList: {
    marginTop: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  fileMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  uploadButtonContainer: {
    marginTop: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7f13ec',
    borderRadius: 8,
    padding: 12,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
