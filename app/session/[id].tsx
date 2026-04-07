import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import {
  getCards,
  createCard,
  reviewCard,
} from '../../src/api/spacedRepetition';
import { Card, CardCreateInput, CardReviewInput } from '../../src/types';
import { FileUploader } from '../../components/FileUploader';

export default function SessionDetailScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;
  const router = useRouter();
  const isFocused = useIsFocused();
  const [session, setSession] = useState<StudySession | null>(null);
  const [files, setFiles] = useState<SessionFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);

  // Flashcards state
  const [cards, setCards] = useState<Card[]>([]);
  const [isCardsLoading, setIsCardsLoading] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [showReviewCards, setShowReviewCards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');

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

  const fetchCards = async (sessionId: string) => {
    setIsCardsLoading(true);
    try {
      const data = await getCards(sessionId);
      setCards(data);
    } catch (err) {
      console.log('Error fetching cards:', err);
      setCards([]);
    } finally {
      setIsCardsLoading(false);
    }
  };

  useEffect(() => {
    const loadSessionDetails = async () => {
      if (!id || !isFocused) {
        return;
      }

      try {
        setIsLoading(true);
        await Promise.all([fetchSession(id), fetchFiles(id), fetchCards(id)]);
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

  const handleCreateCard = async () => {
    if (!newCardFront.trim() || !newCardBack.trim() || !id) {
      Alert.alert('Error', 'Please fill in both sides of the card');
      return;
    }
    try {
      const input: CardCreateInput = {
        frontText: newCardFront.trim(),
        backText: newCardBack.trim(),
        sessionId: id,
      };
      await createCard(input);
      setNewCardFront('');
      setNewCardBack('');
      setShowCreateCard(false);
      fetchCards(id);
      Alert.alert('Success', 'Flashcard created!');
    } catch (err) {
      Alert.alert('Error', 'Failed to create card');
    }
  };

  const handleReviewCard = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!id || cards.length === 0) return;
    try {
      const input: CardReviewInput = { quality };
      await reviewCard(cards[currentCardIndex].id, input);

      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex((prev) => prev + 1);
        setShowAnswer(false);
      } else {
        Alert.alert('Done!', 'You reviewed all cards!');
        setShowReviewCards(false);
        setCurrentCardIndex(0);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to submit review');
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
                    router.push({
                      pathname: '/ai-companion',
                      params: {
                        sessionId: session.id,
                        fileName: file.file_name,
                        fileUrl: file.file_url,
                      },
                    });
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

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => setShowFileUploader(true)}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
            <Text style={styles.uploadButtonText}>Upload File</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.flashcardsSection}>
          <Text style={styles.sectionTitle}>Flashcards</Text>

          {isCardsLoading ? (
            <View style={styles.emptyFilesContainer}>
              <ActivityIndicator size="small" color="#7f13ec" />
              <Text style={styles.emptyFilesText}>Loading cards...</Text>
            </View>
          ) : cards.length > 0 ? (
            <View style={styles.cardsSummary}>
              <View style={styles.cardsCountBadge}>
                <Text style={styles.cardsCountText}>{cards.length}</Text>
              </View>
              <Text style={styles.cardsLabel}>cards in this session</Text>
            </View>
          ) : (
            <View style={styles.emptyFilesContainer}>
              <Ionicons name="layers-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyFilesText}>No flashcards yet</Text>
            </View>
          )}

          <View style={styles.flashcardsActions}>
            <TouchableOpacity
              style={styles.flashcardButton}
              onPress={() => setShowCreateCard(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#7f13ec" />
              <Text style={styles.flashcardButtonText}>Create Card</Text>
            </TouchableOpacity>
            {cards.length > 0 && (
              <TouchableOpacity
                style={[styles.flashcardButton, styles.reviewButton]}
                onPress={() => {
                  setCurrentCardIndex(0);
                  setShowAnswer(false);
                  setShowReviewCards(true);
                }}
              >
                <Ionicons name="school-outline" size={20} color="#ffffff" />
                <Text style={styles.reviewButtonText}>
                  Review ({cards.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <FileUploader
        visible={showFileUploader}
        onClose={() => setShowFileUploader(false)}
        sessions={session ? [session] : []}
        onUploadComplete={async (file, sessionId) => {
          console.log('File uploaded:', file);
          await fetchFiles(sessionId);
          Alert.alert('Success', 'File uploaded successfully!', [
            {
              text: 'Open AI Companion',
              onPress: () => {
                setShowFileUploader(false);
                router.push({
                  pathname: '/ai-companion',
                  params: {
                    sessionId,
                    fileName: file.file_name,
                    fileUrl: file.file_url,
                  },
                });
              },
            },
            { text: 'Stay Here', style: 'cancel' },
          ]);
        }}
      />

      <Modal visible={showCreateCard} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={styles.modalTitle}>Create Flashcard</Text>
              <TouchableOpacity onPress={() => setShowCreateCard(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Front (Question)"
              value={newCardFront}
              onChangeText={setNewCardFront}
              multiline
            />
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder="Back (Answer)"
              value={newCardBack}
              onChangeText={setNewCardBack}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: '#f3f4f6',
                  alignItems: 'center',
                }}
                onPress={() => setShowCreateCard(false)}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: '600', color: '#6b7280' }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: '#7f13ec',
                  alignItems: 'center',
                }}
                onPress={handleCreateCard}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}
                >
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showReviewCards} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={styles.modalTitle}>
                Review ({currentCardIndex + 1}/{cards.length})
              </Text>
              <TouchableOpacity onPress={() => setShowReviewCards(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {cards.length > 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#1f2937',
                    textAlign: 'center',
                    marginBottom: 24,
                  }}
                >
                  {cards[currentCardIndex]?.frontText}
                </Text>
                {!showAnswer ? (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#7f13ec',
                      paddingHorizontal: 32,
                      paddingVertical: 16,
                      borderRadius: 12,
                    }}
                    onPress={() => setShowAnswer(true)}
                  >
                    <Text
                      style={{
                        color: '#ffffff',
                        fontSize: 16,
                        fontWeight: '600',
                      }}
                    >
                      Show Answer
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text
                      style={{
                        fontSize: 18,
                        color: '#374151',
                        textAlign: 'center',
                        marginBottom: 24,
                      }}
                    >
                      {cards[currentCardIndex]?.backText}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#6b7280',
                        marginBottom: 16,
                      }}
                    >
                      How well did you remember?
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 2,
                          minWidth: 60,
                          alignItems: 'center',
                          backgroundColor: '#fee2e2',
                          borderColor: '#ef4444',
                        }}
                        onPress={() => handleReviewCard(0)}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#ef4444',
                          }}
                        >
                          Forgot
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 2,
                          minWidth: 60,
                          alignItems: 'center',
                          backgroundColor: '#fef3c7',
                          borderColor: '#f59e0b',
                        }}
                        onPress={() => handleReviewCard(3)}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#f59e0b',
                          }}
                        >
                          Hard
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 2,
                          minWidth: 60,
                          alignItems: 'center',
                          backgroundColor: '#dcfce7',
                          borderColor: '#22c55e',
                        }}
                        onPress={() => handleReviewCard(4)}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#22c55e',
                          }}
                        >
                          Good
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 2,
                          minWidth: 60,
                          alignItems: 'center',
                          backgroundColor: '#ede9fe',
                          borderColor: '#7c3aed',
                        }}
                        onPress={() => handleReviewCard(5)}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#7c3aed',
                          }}
                        >
                          Perfect
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  headerBackButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
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
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7f13ec',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  flashcardsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardsCountBadge: {
    backgroundColor: '#7f13ec',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
  },
  cardsCountText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  cardsLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  flashcardsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  flashcardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  flashcardButtonText: {
    color: '#7f13ec',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: '#7f13ec',
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalCreateButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#7f13ec',
    alignItems: 'center',
  },
  modalCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  reviewCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  reviewQuestion: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  showAnswerButton: {
    backgroundColor: '#7f13ec',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  showAnswerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewAnswer: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  qualityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  qualityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  qualityButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
