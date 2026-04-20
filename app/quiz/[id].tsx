import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGeneratedQuizById } from '../../src/utils/storage';
import { getQuizHint, explainQuizAnswer } from '../../src/services/api';
import { GeneratedQuiz } from '../../src/types';

type QuizState = 'loading' | 'ready' | 'answering' | 'results';

interface QuizResult {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function QuizPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;

  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [state, setState] = useState<QuizState>('loading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [explanation, setExplanation] = useState<{
    explanation: string;
    deeperExplanation: string;
    relatedConcept: string | null;
  } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [attempts, setAttempts] = useState<string[]>([]);

  const currentQuestion = quiz?.questions[currentIndex] || null;
  const isLastQuestion = quiz
    ? currentIndex === quiz.questions.length - 1
    : false;
  const totalQuestions = quiz?.questions.length || 0;
  const _answeredCount = results.length;

  useEffect(() => {
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    try {
      setState('loading');
      const loadedQuiz = await getGeneratedQuizById(id);
      if (!loadedQuiz) {
        Alert.alert('Error', 'Quiz not found', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }
      setQuiz(loadedQuiz);
      setState('ready');
    } catch (error) {
      console.error('Error loading quiz:', error);
      Alert.alert('Error', 'Failed to load quiz', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (submitted) return;
    setSelectedAnswer(answer);
    setAttempts((prev) => [...prev, answer]);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    const result: QuizResult = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      userAnswer: selectedAnswer,
      correctAnswer: currentQuestion.correct_answer,
      isCorrect,
    };

    setResults((prev) => [...prev, result]);
    setSubmitted(true);

    if (quiz?.sourcePreview || quiz?.suggestedTopics?.length) {
      try {
        const expResult = await explainQuizAnswer({
          question: currentQuestion.question,
          questionId: currentQuestion.id,
          userAnswer: selectedAnswer,
          correctAnswer: currentQuestion.correct_answer,
          explanation: currentQuestion.explanation,
          sourceText: quiz?.sourcePreview,
          isCorrect,
        });
        if (expResult.success) {
          setExplanation({
            explanation: expResult.explanation || currentQuestion.explanation,
            deeperExplanation: expResult.deeperExplanation || '',
            relatedConcept: expResult.relatedConcept,
          });
          setShowExplanation(true);
        }
      } catch (expError) {
        console.warn('Could not get AI explanation:', expError);
      }
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setState('results');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      setHint(null);
      setExplanation(null);
      setShowExplanation(false);
      setAttempts([]);
    }
  };

  const handleGetHint = async () => {
    if (!currentQuestion) return;

    setHintLoading(true);
    try {
      const result = await getQuizHint({
        question: currentQuestion.question,
        questionId: currentQuestion.id,
        options: currentQuestion.options.map((o) => o.text),
        attemptedAnswers: attempts,
      });
      if (result.success && result.hint) {
        setHint(result.hint);
      }
    } catch (error) {
      console.warn('Failed to get hint:', error);
    } finally {
      setHintLoading(false);
    }
  };

  const closeExplanation = () => {
    setShowExplanation(false);
  };

  const getScore = () => {
    const correct = results.filter((r) => r.isCorrect).length;
    return {
      correct,
      total: totalQuestions,
      percentage: Math.round((correct / totalQuestions) * 100),
    };
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#8a2be2" />
      <Text style={styles.loadingText}>Loading quiz...</Text>
    </View>
  );

  const renderReady = () => (
    <View style={styles.centerContainer}>
      <View style={styles.quizIconContainer}>
        <Ionicons name="school" size={64} color="#8a2be2" />
      </View>
      <Text style={styles.quizTitle}>{quiz?.title}</Text>
      <Text style={styles.quizSubtitle}>
        {quiz?.questions.length} questions • {quiz?.difficulty} difficulty
      </Text>

      {quiz?.suggestedTopics && quiz.suggestedTopics.length > 0 && (
        <View style={styles.topicsContainer}>
          <Text style={styles.topicsLabel}>Study Topics:</Text>
          <View style={styles.topicsList}>
            {quiz.suggestedTopics.slice(0, 5).map((topic, index) => (
              <View key={index} style={styles.topicBadge}>
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => setState('answering')}
      >
        <Ionicons name="play" size={24} color="#ffffff" />
        <Text style={styles.startButtonText}>Start Quiz</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuestion = () => {
    if (!currentQuestion || !quiz) return null;

    return (
      <ScrollView
        style={styles.questionScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionHeader}>
          <View style={styles.questionProgress}>
            <Text style={styles.questionNumber}>
              Question {currentIndex + 1} of {totalQuestions}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentIndex + 1) / totalQuestions) * 100}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrectAnswer =
              option.text === currentQuestion.correct_answer;

            let optionStyle = styles.optionButton;
            let textStyle = styles.optionText;

            if (submitted) {
              if (isCorrectAnswer) {
                optionStyle = styles.optionCorrect;
                textStyle = styles.optionTextCorrect;
              } else if (isSelected && !isCorrectAnswer) {
                optionStyle = styles.optionIncorrect;
                textStyle = styles.optionTextIncorrect;
              }
            } else if (isSelected) {
              optionStyle = styles.optionSelected;
            }

            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionButton, optionStyle]}
                onPress={() => handleSelectAnswer(option.id)}
                disabled={submitted}
              >
                <View style={styles.optionCircle}>
                  <Text style={styles.optionCircleText}>{option.id}</Text>
                </View>
                <Text style={[styles.optionText, textStyle]}>
                  {option.text}
                </Text>
                {submitted && isCorrectAnswer && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#22c55e"
                    style={styles.optionIcon}
                  />
                )}
                {submitted && isSelected && !isCorrectAnswer && (
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color="#ef4444"
                    style={styles.optionIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {hint && !submitted && (
          <View style={styles.hintContainer}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {!submitted ? (
            <>
              <TouchableOpacity
                style={styles.hintButton}
                onPress={handleGetHint}
                disabled={hintLoading}
              >
                {hintLoading ? (
                  <ActivityIndicator size="small" color="#8a2be2" />
                ) : (
                  <>
                    <Ionicons name="bulb-outline" size={20} color="#8a2be2" />
                    <Text style={styles.hintButtonText}>Get Hint</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !selectedAnswer && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitAnswer}
                disabled={!selectedAnswer}
              >
                <Text style={styles.submitButtonText}>Submit Answer</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextQuestion}
            >
              <Text style={styles.nextButtonText}>
                {isLastQuestion ? 'See Results' : 'Next Question'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    );
  };

  const renderResults = () => {
    const score = getScore();
    const isPassing = score.percentage >= 70;

    return (
      <ScrollView
        style={styles.resultsScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultsCard}>
          <View style={styles.resultsIconContainer}>
            <Ionicons
              name={isPassing ? 'trophy' : 'refresh'}
              size={48}
              color={isPassing ? '#f59e0b' : '#8a2be2'}
            />
          </View>

          <Text style={styles.resultsTitle}>
            {isPassing ? 'Great Job!' : 'Keep Practicing!'}
          </Text>

          <Text style={styles.resultsScore}>
            {score.correct} / {score.total}
          </Text>
          <Text style={styles.resultsPercentage}>{score.percentage}%</Text>

          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyBadgeText}>
              {quiz?.difficulty} difficulty
            </Text>
          </View>
        </View>

        <View style={styles.resultsBreakdown}>
          <Text style={styles.breakdownTitle}>Question Review</Text>
          {results.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Ionicons
                name={result.isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={result.isCorrect ? '#22c55e' : '#ef4444'}
              />
              <View style={styles.resultItemContent}>
                <Text style={styles.resultQuestion} numberOfLines={2}>
                  {result.question}
                </Text>
                <Text style={styles.resultAnswer}>
                  Your answer: {result.userAnswer}
                </Text>
                {!result.isCorrect && (
                  <Text style={styles.resultCorrect}>
                    Correct: {result.correctAnswer}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setCurrentIndex(0);
            setResults([]);
            setSelectedAnswer(null);
            setSubmitted(false);
            setHint(null);
            setAttempts([]);
            setState('answering');
          }}
        >
          <Ionicons name="refresh" size={20} color="#ffffff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.back()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    );
  };

  const renderExplanationModal = () => (
    <Modal
      visible={showExplanation}
      animationType="slide"
      transparent
      onRequestClose={closeExplanation}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.explanationModal}>
          <View style={styles.modalHeader}>
            <Ionicons
              name={
                explanation?.explanation
                  ? 'checkmark-circle'
                  : 'information-circle'
              }
              size={28}
              color={explanation?.explanation ? '#22c55e' : '#8a2be2'}
            />
            <Text style={styles.modalTitle}>
              {results[results.length - 1]?.isCorrect
                ? 'Correct!'
                : 'Not Quite'}
            </Text>
            <TouchableOpacity
              onPress={closeExplanation}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.explanationLabel}>Explanation</Text>
            <Text style={styles.explanationText}>
              {explanation?.explanation || currentQuestion?.explanation}
            </Text>

            {explanation?.deeperExplanation && (
              <>
                <Text style={styles.explanationLabel}>Want to learn more?</Text>
                <Text style={styles.explanationText}>
                  {explanation.deeperExplanation}
                </Text>
              </>
            )}

            {explanation?.relatedConcept && (
              <View style={styles.relatedConceptContainer}>
                <Text style={styles.explanationLabel}>Related Concept</Text>
                <View style={styles.relatedConceptBadge}>
                  <Text style={styles.relatedConceptText}>
                    {explanation.relatedConcept}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={closeExplanation}
          >
            <Text style={styles.modalButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (state === 'loading') {
    return (
      <SafeAreaView style={styles.container}>{renderLoading()}</SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f3e8ff', '#fafafa']} style={styles.gradient} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        {state === 'answering' && (
          <Text style={styles.headerTitle}>
            {currentIndex + 1} / {totalQuestions}
          </Text>
        )}
        {state === 'results' && <Text style={styles.headerTitle}>Results</Text>}
        <View style={styles.placeholder} />
      </View>

      {state === 'ready' && renderReady()}
      {state === 'answering' && renderQuestion()}
      {state === 'results' && renderResults()}

      {renderExplanationModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  quizIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  quizSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  topicsContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  topicsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  topicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  topicBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  topicText: {
    fontSize: 13,
    color: '#8a2be2',
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8a2be2',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  questionScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  questionHeader: {
    marginBottom: 16,
  },
  questionProgress: {
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8a2be2',
    borderRadius: 3,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  optionSelected: {
    borderColor: '#8a2be2',
    backgroundColor: '#faf5ff',
  },
  optionCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  optionIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionCircleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
  },
  optionTextCorrect: {
    color: '#22c55e',
    fontWeight: '500',
  },
  optionTextIncorrect: {
    color: '#ef4444',
    fontWeight: '500',
  },
  optionIcon: {
    marginLeft: 8,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  hintText: {
    flex: 1,
    fontSize: 15,
    color: '#92400e',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  hintButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3e8ff',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  hintButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8a2be2',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#1f2937',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  spacer: {
    height: 40,
  },
  resultsScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  resultsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  resultsScore: {
    fontSize: 48,
    fontWeight: '700',
    color: '#8a2be2',
  },
  resultsPercentage: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 16,
  },
  difficultyBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyBadgeText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  resultsBreakdown: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  resultItemContent: {
    flex: 1,
  },
  resultQuestion: {
    fontSize: 15,
    color: '#1f2937',
    marginBottom: 4,
  },
  resultAnswer: {
    fontSize: 13,
    color: '#ef4444',
  },
  resultCorrect: {
    fontSize: 13,
    color: '#22c55e',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8a2be2',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  explanationModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 12,
  },
  modalClose: {
    padding: 4,
  },
  modalContent: {
    marginBottom: 20,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 16,
  },
  explanationText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  relatedConceptContainer: {
    marginTop: 8,
  },
  relatedConceptBadge: {
    backgroundColor: '#f3e8ff',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  relatedConceptText: {
    fontSize: 15,
    color: '#8a2be2',
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
