import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createCard,
  getCards,
  getDueCards,
  reviewCard,
  deleteCard,
} from '../../src/api/spacedRepetition';
import { Card, CardCreateInput, CardReviewInput } from '../../src/types';

const QUALITY_LABELS = [
  { value: 0, label: 'Forgot', color: '#ef4444' },
  { value: 1, label: 'Wrong', color: '#f97316' },
  { value: 2, label: 'Hard', color: '#eab308' },
  { value: 3, label: 'Good', color: '#22c55e' },
  { value: 4, label: 'Easy', color: '#3b82f6' },
  { value: 5, label: 'Perfect', color: '#7c3aed' },
];

export default function FlashcardsScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReviewCard, setCurrentReviewCard] = useState<Card | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'due'>('all');

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const allCards = await getCards();
      setCards(allCards);
      const due = await getDueCards();
      setDueCards(due);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async () => {
    if (!frontText.trim() || !backText.trim()) {
      Alert.alert('Error', 'Please fill in both front and back text');
      return;
    }
    try {
      const input: CardCreateInput = {
        frontText: frontText.trim(),
        backText: backText.trim(),
      };
      if (sessionId.trim()) {
        input.sessionId = sessionId.trim();
      }
      await createCard(input);
      setShowCreateModal(false);
      setFrontText('');
      setBackText('');
      setSessionId('');
      loadCards();
      Alert.alert('Success', 'Card created successfully');
    } catch (_error) {
      Alert.alert('Error', 'Failed to create card');
    }
  };

  const handleReviewCard = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!currentReviewCard) return;
    try {
      const input: CardReviewInput = { quality };
      await reviewCard(currentReviewCard.id, input);
      setShowAnswer(false);
      setCurrentReviewCard(null);
      setShowReviewModal(false);
      loadCards();
    } catch (_error) {
      Alert.alert('Error', 'Failed to submit review');
    }
  };

  const handleDeleteCard = async (id: string) => {
    Alert.alert('Delete Card', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCard(id);
            loadCards();
          } catch (_error) {
            Alert.alert('Error', 'Failed to delete card');
          }
        },
      },
    ]);
  };

  const startReview = (card: Card) => {
    setCurrentReviewCard(card);
    setShowAnswer(false);
    setShowReviewModal(true);
  };

  const displayedCards = activeTab === 'due' ? dueCards : cards;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7f13ec" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flashcards</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'all' && styles.activeTabText,
            ]}
          >
            All ({cards.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'due' && styles.activeTab]}
          onPress={() => setActiveTab('due')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'due' && styles.activeTabText,
            ]}
          >
            Due ({dueCards.length})
          </Text>
        </TouchableOpacity>
      </View>

      {displayedCards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="layers-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>
            {activeTab === 'due'
              ? 'No cards due for review!'
              : 'No flashcards yet'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.emptyButtonText}>Create Your First Card</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedCards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cardItem}
              onPress={() => startReview(item)}
              onLongPress={() => handleDeleteCard(item.id)}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardFront} numberOfLines={2}>
                  {item.frontText}
                </Text>
                <Text style={styles.cardBack} numberOfLines={1}>
                  {item.backText}
                </Text>
              </View>
              {item.nextReviewDate && (
                <Text style={styles.cardDue}>
                  Due: {new Date(item.nextReviewDate).toLocaleDateString()}
                </Text>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Flashcard</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Front (Question)"
              value={frontText}
              onChangeText={setFrontText}
              multiline
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Back (Answer)"
              value={backText}
              onChangeText={setBackText}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Session ID (optional)"
              value={sessionId}
              onChangeText={setSessionId}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateCard}
            >
              <Text style={styles.submitButtonText}>Create Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Card</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {currentReviewCard && (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewFront}>
                  {currentReviewCard.frontText}
                </Text>
                {!showAnswer ? (
                  <TouchableOpacity
                    style={styles.showAnswerButton}
                    onPress={() => setShowAnswer(true)}
                  >
                    <Text style={styles.showAnswerText}>Show Answer</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={styles.reviewBack}>
                      {currentReviewCard.backText}
                    </Text>
                    <Text style={styles.rateText}>
                      How well did you remember?
                    </Text>
                    <View style={styles.qualityButtons}>
                      {QUALITY_LABELS.map((q) => (
                        <TouchableOpacity
                          key={q.value}
                          style={[
                            styles.qualityButton,
                            {
                              backgroundColor: q.color + '20',
                              borderColor: q.color,
                            },
                          ]}
                          onPress={() =>
                            handleReviewCard(q.value as 0 | 1 | 2 | 3 | 4 | 5)
                          }
                        >
                          <Text
                            style={[
                              styles.qualityButtonText,
                              { color: q.color },
                            ]}
                          >
                            {q.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7f13ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeTab: {
    backgroundColor: '#7f13ec',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    marginBottom: 8,
  },
  cardFront: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardBack: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardDue: {
    fontSize: 12,
    color: '#7f13ec',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#7f13ec',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#7f13ec',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    alignItems: 'center',
  },
  reviewFront: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  showAnswerButton: {
    backgroundColor: '#7f13ec',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  showAnswerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewBack: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  rateText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  qualityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  qualityButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
  },
  qualityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
