import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCards, getDueCards } from '../../src/api/spacedRepetition';
import { Card } from '../../src/types';

interface QuizQuestion {
  card: Card;
  options?: string[];
}

export default function QuizScreen() {
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizActive, setQuizActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizType, setQuizType] = useState<'practice' | 'timed'>('practice');

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    try {
      setLoading(true);
      const due = await getDueCards();
      setDueCards(due);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (type: 'practice' | 'timed') => {
    if (dueCards.length === 0) {
      Alert.alert('No Cards', 'You have no cards due for review!');
      return;
    }
    setQuizType(type);
    setQuizActive(true);
    setCurrentIndex(0);
    setShowAnswer(false);
    setScore({ correct: 0, total: 0 });
    setQuizComplete(false);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setQuizActive(false);
    setQuizComplete(false);
    setCurrentIndex(0);
    setShowAnswer(false);
    setScore({ correct: 0, total: 0 });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7f13ec" />
      </View>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <View style={styles.container}>
        <View style={styles.quizCompleteContainer}>
          <Ionicons name="trophy" size={80} color="#fbbf24" />
          <Text style={styles.completeTitle}>Quiz Complete!</Text>
          <Text style={styles.scoreText}>
            {score.correct} / {score.total}
          </Text>
          <Text style={styles.percentageText}>{percentage}% Correct</Text>
          <TouchableOpacity style={styles.retryButton} onPress={resetQuiz}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (quizActive) {
    const currentCard = dueCards[currentIndex];
    return (
      <View style={styles.container}>
        <View style={styles.quizHeader}>
          <Text style={styles.quizProgress}>
            Question {currentIndex + 1} of {dueCards.length}
          </Text>
          <TouchableOpacity onPress={resetQuiz}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / dueCards.length) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.quizContent}>
          <Text style={styles.questionText}>{currentCard.frontText}</Text>
          {!showAnswer ? (
            <TouchableOpacity
              style={styles.showAnswerButton}
              onPress={() => setShowAnswer(true)}
            >
              <Text style={styles.showAnswerText}>Show Answer</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.answerSection}>
              <Text style={styles.answerText}>{currentCard.backText}</Text>
              <Text style={styles.rateText}>Did you get it right?</Text>
              <View style={styles.answerButtons}>
                <TouchableOpacity
                  style={[styles.answerButton, styles.wrongButton]}
                  onPress={() => handleAnswer(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                  <Text style={styles.answerButtonText}>Wrong</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.answerButton, styles.correctButton]}
                  onPress={() => handleAnswer(true)}
                >
                  <Ionicons name="checkmark" size={24} color="#fff" />
                  <Text style={styles.answerButtonText}>Correct</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quiz</Text>
        <Text style={styles.headerSubtitle}>
          Test your knowledge with flashcards
        </Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{dueCards.length}</Text>
          <Text style={styles.statLabel}>Cards Due</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{quizType === 'practice' ? '∞' : '5'}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
      </View>

      <View style={styles.quizOptions}>
        <Text style={styles.sectionTitle}>Choose Quiz Type</Text>
        <TouchableOpacity
          style={styles.quizTypeOption}
          onPress={() => startQuiz('practice')}
        >
          <View style={styles.quizTypeIcon}>
            <Ionicons name="school" size={24} color="#7f13ec" />
          </View>
          <View style={styles.quizTypeInfo}>
            <Text style={styles.quizTypeTitle}>Practice Mode</Text>
            <Text style={styles.quizTypeDesc}>No time limit, learn at your pace</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quizTypeOption}
          onPress={() => startQuiz('timed')}
        >
          <View style={styles.quizTypeIcon}>
            <Ionicons name="timer" size={24} color="#f59e0b" />
          </View>
          <View style={styles.quizTypeInfo}>
            <Text style={styles.quizTypeTitle}>Timed Challenge</Text>
            <Text style={styles.quizTypeDesc}>Beat the clock!</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7f13ec',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  quizOptions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  quizTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
  quizTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quizTypeInfo: {
    flex: 1,
  },
  quizTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  quizTypeDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  quizProgress: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7f13ec',
    borderRadius: 2,
  },
  quizContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  showAnswerButton: {
    backgroundColor: '#7f13ec',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  showAnswerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  answerSection: {
    alignItems: 'center',
  },
  answerText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  rateText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  wrongButton: {
    backgroundColor: '#ef4444',
  },
  correctButton: {
    backgroundColor: '#22c55e',
  },
  answerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quizCompleteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#7f13ec',
    marginTop: 16,
  },
  percentageText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#7f13ec',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});