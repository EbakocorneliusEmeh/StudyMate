import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashcardUploader } from '../../components/FlashcardUploader';
import {
  GeneratedFlashcard,
  FlashcardDeck,
  FlashcardChatMessage,
} from '../types';
import {
  chatAboutFlashcardsFromBackend,
  generateFlashcardsFromBackend,
  regenerateFlashcardWithBackend,
} from '../api/ai';

interface FlashcardGenerationScreenProps {
  visible: boolean;
  onClose: () => void;
  initialSourceText?: string;
  initialFileName?: string;
}

type GenerationStatus =
  | 'idle'
  | 'uploading'
  | 'generating'
  | 'complete'
  | 'error';

export const FlashcardGenerationScreen: React.FC<
  FlashcardGenerationScreenProps
> = ({ visible, onClose, initialSourceText, initialFileName }) => {
  const [showUploader, setShowUploader] = useState(false);
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null,
  );
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [chatMessages, setChatMessages] = useState<FlashcardChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [numCards] = useState(10);

  useEffect(() => {
    if (visible && (initialSourceText || initialFileName)) {
      handleGenerateFromText(
        initialSourceText || '',
        initialFileName || 'document',
      );
    }
  }, [visible, initialSourceText, initialFileName]);

  const resetState = useCallback(() => {
    setGenerationStatus('idle');
    setProgress(0);
    setDeck(null);
    setErrorMessage(null);
    setSelectedCardIndex(null);
    setChatMessages([]);
    setChatInput('');
  }, []);

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible, resetState]);

  const handleFileSelected = async (
    file: { uri: string | File; name: string; type: string },
    _extractedText?: string,
  ) => {
    try {
      setGenerationStatus('uploading');
      setErrorMessage(null);
      setProgress(10);

      let sourceText = '';
      if (typeof file.uri === 'string') {
        if (file.type.startsWith('text/')) {
          const response = await fetch(file.uri);
          sourceText = await response.text();
        }
      }

      setProgress(30);
      await handleGenerateFromText(sourceText, file.name);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to process file';
      setErrorMessage(message);
      setGenerationStatus('error');
    }
  };

  const handleTextSubmit = async (text: string, fileName: string) => {
    await handleGenerateFromText(text, fileName);
  };

  const handleGenerateFromText = async (
    sourceText: string,
    fileName: string,
  ) => {
    try {
      setGenerationStatus('generating');
      setErrorMessage(null);
      setProgress(20);

      const input = {
        numCards,
        fileName,
        sourceText,
      };

      setProgress(40);

      const result = await generateFlashcardsFromBackend(
        {
          ...input,
          sessionId: undefined,
        },
        (p) => setProgress(40 + Math.round(p * 0.5)),
      );

      setDeck(result.deck);
      setProgress(100);
      setGenerationStatus('complete');
      setShowUploader(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate flashcards';
      setErrorMessage(message);
      setGenerationStatus('error');
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !deck || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);

    const newUserMsg: FlashcardChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, newUserMsg]);

    try {
      const { response } = await chatAboutFlashcardsFromBackend({
        message: userMessage,
        deck,
        chatHistory: chatMessages,
      });

      const newAssistantMsg: FlashcardChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response,
        createdAt: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, newAssistantMsg]);
    } catch (_error) {
      Alert.alert('Error', 'Failed to generate flashcards. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleModifyCard = async (
    cardId: string,
    modification: 'simpler' | 'harder' | 'examples',
  ) => {
    if (!deck) return;

    Alert.alert(
      'Modify Card',
      `Change this card to be ${modification === 'simpler' ? 'simpler' : modification === 'harder' ? 'more challenging' : 'have more examples'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Modify',
          onPress: async () => {
            try {
              const updatedCard = await regenerateFlashcardWithBackend(
                cardId,
                modification,
                deck,
              );
              setDeck((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  cards: prev.cards.map((c) =>
                    c.id === cardId ? updatedCard : c,
                  ),
                };
              });
            } catch (_error) {
              Alert.alert('Error', 'Failed to modify card');
            }
          },
        },
      ],
    );
  };

  const renderCardPreview = ({
    item,
    index,
  }: {
    item: GeneratedFlashcard;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.cardPreview,
        selectedCardIndex === index && styles.cardPreviewSelected,
      ]}
      onPress={() =>
        setSelectedCardIndex(selectedCardIndex === index ? null : index)
      }
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardNumber}>Card #{index + 1}</Text>
        <View style={styles.cardBadge}>
          <Ionicons name="bulb-outline" size={12} color="#7f13ec" />
        </View>
      </View>
      <Text style={styles.cardFront} numberOfLines={3}>
        {item.front}
      </Text>
      {selectedCardIndex === index && (
        <View style={styles.cardBackContainer}>
          <Text style={styles.cardBackLabel}>Answer:</Text>
          <Text style={styles.cardBack}>{item.back}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => handleModifyCard(item.id, 'simpler')}
            >
              <Text style={styles.cardActionText}>Simpler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => handleModifyCard(item.id, 'harder')}
            >
              <Text style={styles.cardActionText}>Harder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => handleModifyCard(item.id, 'examples')}
            >
              <Text style={styles.cardActionText}>Examples</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Flashcard Generator</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowUploader(true)}
            disabled={generationStatus === 'generating'}
          >
            <Ionicons name="add-circle-outline" size={24} color="#7f13ec" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {generationStatus === 'idle' && !deck && (
        <View style={styles.emptyState}>
          <Ionicons name="layers-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Generate Flashcards</Text>
          <Text style={styles.emptySubtitle}>
            Upload a PDF, image, or paste text to create AI-powered flashcards
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setShowUploader(true)}
          >
            <LinearGradient
              colors={['#7f13ec', '#6366f1']}
              style={styles.startButtonGradient}
            >
              <Ionicons name="sparkles" size={20} color="white" />
              <Text style={styles.startButtonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {(generationStatus === 'uploading' ||
        generationStatus === 'generating') && (
        <View style={styles.generatingState}>
          <ActivityIndicator size="large" color="#7f13ec" />
          <Text style={styles.generatingTitle}>
            {generationStatus === 'uploading'
              ? 'Processing file...'
              : 'Generating flashcards...'}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% complete</Text>
          {deck && deck.cards.length > 0 && (
            <View style={styles.livePreview}>
              <Text style={styles.livePreviewTitle}>
                Cards generated so far:
              </Text>
              <FlatList
                data={deck.cards.slice(0, 3)}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <View style={styles.miniCard}>
                    <Text style={styles.miniCardNumber}>#{index + 1}</Text>
                    <Text style={styles.miniCardFront} numberOfLines={1}>
                      {item.front}
                    </Text>
                  </View>
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      )}

      {generationStatus === 'error' && (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Generation Failed</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setShowUploader(true)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {generationStatus === 'complete' && deck && (
        <View style={styles.completeContainer}>
          <View style={styles.deckHeader}>
            <View style={styles.deckInfo}>
              <Text style={styles.deckTitle}>{deck.title}</Text>
              <Text style={styles.deckCount}>{deck.cardCount} cards</Text>
            </View>
            <View style={styles.deckActions}>
              <TouchableOpacity
                style={styles.chatToggleButton}
                onPress={() => setShowChatSidebar(!showChatSidebar)}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={20}
                  color={showChatSidebar ? '#ffffff' : '#7f13ec'}
                />
                <Text
                  style={[
                    styles.chatToggleText,
                    showChatSidebar && styles.chatToggleTextActive,
                  ]}
                >
                  Chat
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={deck.cards}
            keyExtractor={(item) => item.id}
            renderItem={renderCardPreview}
            contentContainerStyle={styles.cardList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <FlashcardUploader
        visible={showUploader}
        onClose={() => setShowUploader(false)}
        onFileSelected={handleFileSelected}
        onTextSubmit={handleTextSubmit}
      />

      <Modal visible={showChatSidebar} animationType="slide" transparent>
        <View style={styles.chatSidebarOverlay}>
          <Pressable
            style={styles.chatSidebarBg}
            onPress={() => setShowChatSidebar(false)}
          />
          <View style={styles.chatSidebar}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>AI Companion</Text>
              <TouchableOpacity onPress={() => setShowChatSidebar(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.chatMessages}>
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.chatBubble,
                    msg.role === 'user'
                      ? styles.chatBubbleUser
                      : styles.chatBubbleAssistant,
                  ]}
                >
                  <Text
                    style={[
                      styles.chatBubbleText,
                      msg.role === 'user'
                        ? styles.chatBubbleTextUser
                        : styles.chatBubbleTextAssistant,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
              {isChatLoading && (
                <View style={styles.chatLoading}>
                  <ActivityIndicator size="small" color="#7f13ec" />
                </View>
              )}
            </ScrollView>

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask about the cards..."
                value={chatInput}
                onChangeText={setChatInput}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity
                style={[
                  styles.chatSendButton,
                  (!chatInput.trim() || isChatLoading) &&
                    styles.chatSendButtonDisabled,
                ]}
                onPress={handleChatSubmit}
                disabled={!chatInput.trim() || isChatLoading}
              >
                <Ionicons name="send" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f6f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  startButton: {
    marginTop: 32,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  generatingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  generatingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 24,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7f13ec',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  livePreview: {
    marginTop: 32,
    width: '100%',
  },
  livePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  miniCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniCardNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f13ec',
    marginBottom: 4,
  },
  miniCardFront: {
    fontSize: 14,
    color: '#1e293b',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#7f13ec',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  completeContainer: {
    flex: 1,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  deckInfo: {
    flex: 1,
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  deckCount: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  deckActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  chatToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f13ec',
  },
  chatToggleTextActive: {
    color: '#ffffff',
  },
  cardList: {
    padding: 16,
  },
  cardPreview: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardPreviewSelected: {
    borderColor: '#7f13ec',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  cardBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFront: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 24,
  },
  cardBackContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cardBackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  cardBack: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cardActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  cardActionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  chatSidebarOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  chatSidebarBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  chatSidebar: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  chatBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#7f13ec',
    borderBottomRightRadius: 4,
  },
  chatBubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  chatBubbleTextUser: {
    color: '#ffffff',
  },
  chatBubbleTextAssistant: {
    color: '#1e293b',
  },
  chatLoading: {
    padding: 12,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  chatSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7f13ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
});

export default FlashcardGenerationScreen;
