import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getDueCards } from '../../src/api/spacedRepetition';
import { Card, GeneratedQuiz } from '../../src/types';
import { getGeneratedQuizById } from '../../src/utils/storage';

export default function QuizScreen() {
  const params = useLocalSearchParams<{ quizId?: string }>();
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [quizActive, setQuizActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizType, setQuizType] = useState<'practice' | 'timed'>('practice');

  useEffect(() => {
    void loadQuizState();
  }, [params.quizId]);

  const loadQuizState = async () => {
    try {
      setLoading(true);

      if (params.quizId) {
        const savedQuiz = await getGeneratedQuizById(params.quizId);
        if (savedQuiz) {
          setGeneratedQuiz(savedQuiz);
          setDueCards([]);
          return;
        }
      }

      const due = await getDueCards();
      setDueCards(due);
      setGeneratedQuiz(null);
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setQuizActive(false);
    setQuizComplete(false);
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore({ correct: 0, total: 0 });
  };

  const startQuiz = (type: 'practice' | 'timed') => {
    const questionCount = generatedQuiz
      ? generatedQuiz.questions.length
      : dueCards.length;

    if (questionCount === 0) {
      Alert.alert(
        'No Questions',
        'There are no questions available right now.',
      );
      return;
    }

    setQuizType(type);
    setQuizActive(true);
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore({ correct: 0, total: 0 });
    setQuizComplete(false);
  };

  const handleGeneratedAnswer = (optionText: string) => {
    if (!generatedQuiz) {
      return;
    }

    if (selectedOption) {
      return;
    }

    const currentQuestion = generatedQuiz.questions[currentIndex];
    const isCorrect =
      optionText.trim().toLowerCase() ===
      currentQuestion.correct_answer.trim().toLowerCase();

    setSelectedOption(optionText);
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextQuestion = () => {
    if (generatedQuiz) {
      if (!selectedOption) {
        return;
      }

      if (currentIndex < generatedQuiz.questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
      } else {
        setQuizComplete(true);
      }
      return;
    }

    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setQuizComplete(true);
    }
  };

  const handleFlashcardAnswer = (isCorrect: boolean) => {
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    nextQuestion();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7f13ec" />
      </View>
    );
  }

  if (quizComplete) {
    const percentage = score.total
      ? Math.round((score.correct / score.total) * 100)
      : 0;

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

  if (quizActive && generatedQuiz) {
    const currentQuestion = generatedQuiz.questions[currentIndex];
    const isAnswered = selectedOption !== null;

    return (
      <View style={styles.container}>
        <View style={styles.quizHeader}>
          <Text style={styles.quizProgress}>
            Question {currentIndex + 1} of {generatedQuiz.questions.length}
          </Text>
          <TouchableOpacity onPress={resetQuiz}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentIndex + 1) / generatedQuiz.questions.length) * 100}%`,
              },
            ]}
          />
        </View>
        <View style={styles.quizContent}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          <View style={styles.optionsList}>
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.text;
              const isCorrectOption =
                option.text.trim().toLowerCase() ===
                currentQuestion.correct_answer.trim().toLowerCase();
              const optionStyle = isAnswered
                ? isCorrectOption
                  ? styles.optionCorrect
                  : isSelected
                    ? styles.optionWrong
                    : styles.optionDefault
                : styles.optionDefault;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionButton, optionStyle]}
                  onPress={() => handleGeneratedAnswer(option.text)}
                  disabled={isAnswered}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      isAnswered && isCorrectOption && styles.optionLabelOnDark,
                      isAnswered &&
                        isSelected &&
                        !isCorrectOption &&
                        styles.optionLabelOnDark,
                    ]}
                  >
                    {option.id}. {option.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isAnswered ? (
            <View style={styles.explanationCard}>
              <Text style={styles.explanationTitle}>Explanation</Text>
              <Text style={styles.explanationText}>
                {currentQuestion.explanation}
              </Text>
              <TouchableOpacity
                style={styles.nextQuestionButton}
                onPress={nextQuestion}
              >
                <Text style={styles.nextQuestionText}>
                  {currentIndex === generatedQuiz.questions.length - 1
                    ? 'Finish Quiz'
                    : 'Next Question'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
          <View style={styles.explanationCard}>
            <Text style={styles.explanationTitle}>Answer</Text>
            <Text style={styles.explanationText}>{currentCard.backText}</Text>
            <Text style={styles.rateText}>Did you get it right?</Text>
            <View style={styles.answerButtons}>
              <TouchableOpacity
                style={[styles.answerButton, styles.wrongButton]}
                onPress={() => handleFlashcardAnswer(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
                <Text style={styles.answerButtonText}>Wrong</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.answerButton, styles.correctButton]}
                onPress={() => handleFlashcardAnswer(true)}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
                <Text style={styles.answerButtonText}>Correct</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const defaultQuestionCount = generatedQuiz
    ? generatedQuiz.questions.length
    : dueCards.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {generatedQuiz ? generatedQuiz.title : 'Quiz'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {generatedQuiz
            ? `Saved from ${generatedQuiz.fileName}`
            : 'Test your knowledge with flashcards'}
        </Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{defaultQuestionCount}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {generatedQuiz
              ? generatedQuiz.difficulty.charAt(0).toUpperCase()
              : quizType === 'practice'
                ? '∞'
                : '5'}
          </Text>
          <Text style={styles.statLabel}>
            {generatedQuiz ? 'Level' : 'Questions'}
          </Text>
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
            <Text style={styles.quizTypeDesc}>
              {generatedQuiz
                ? 'Multiple choice with explanations'
                : 'No time limit, learn at your pace'}
            </Text>
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
            <Text style={styles.quizTypeDesc}>
              {generatedQuiz ? 'Quick-fire review round' : 'Beat the clock!'}
            </Text>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  quizProgress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7f13ec',
  },
  quizContent: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 34,
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
  },
  optionButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionDefault: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  optionCorrect: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  optionWrong: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 22,
  },
  optionLabelOnDark: {
    color: '#ffffff',
  },
  explanationCard: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7f13ec',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  explanationText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  nextQuestionButton: {
    marginTop: 18,
    backgroundColor: '#7f13ec',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextQuestionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  rateText: {
    marginTop: 16,
    marginBottom: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  answerButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  wrongButton: {
    backgroundColor: '#ef4444',
  },
  correctButton: {
    backgroundColor: '#10b981',
  },
  answerButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  quizCompleteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#7f13ec',
    marginTop: 12,
  },
  percentageText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#7f13ec',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
