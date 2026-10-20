import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getGeneratedQuizzes } from '../../src/utils/storage';
import { GeneratedQuiz } from '../../src/types';

const difficultyLevels = ['Easy', 'Medium', 'Hard'];

export default function QuizScreen() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<GeneratedQuiz[]>([]);
  const [questionCount] = useState(15);
  const [difficulty, setDifficulty] = useState('Medium');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      const storedQuizzes = await getGeneratedQuizzes();
      setQuizzes(storedQuizzes);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSelectFiles = () => {
    router.push('/quiz/generate');
  };

  const handleStartQuiz = (quizId: string) => {
    router.push(`/quiz/${quizId}`);
  };

  const handleGenerateNewQuiz = () => {
    router.push('/quiz/generate');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f3e8ff', '#fafafa']} style={styles.gradient} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8A2BE2']}
          />
        }
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Generate Quiz</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            <View style={styles.uploadCard}>
              <View style={styles.uploadIconContainer}>
                <Ionicons name="cloud-upload" size={32} color="#8A2BE2" />
              </View>
              <Text style={styles.uploadTitle}>Upload Files</Text>
              <Text style={styles.uploadSubtitle}>
                PDF, Doc, or images of your notes
              </Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={handleSelectFiles}
              >
                <Text style={styles.selectButtonText}>Select Files</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Number of questions</Text>
                <View style={styles.questionBadge}>
                  <Text style={styles.questionBadgeText}>{questionCount}</Text>
                </View>
              </View>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                  <View
                    style={[
                      styles.sliderFill,
                      { width: `${(questionCount / 30) * 100}%` },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.sliderThumb,
                    { left: `${(questionCount / 30) * 100 - 5}%` },
                  ]}
                  activeOpacity={0.8}
                />
              </View>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>5</Text>
                <Text style={styles.sliderLabelText}>30</Text>
              </View>

              <Text style={[styles.settingLabel, { marginTop: 20 }]}>
                Difficulty
              </Text>
              <View style={styles.difficultyContainer}>
                {difficultyLevels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyButton,
                      difficulty === level && styles.difficultyButtonActive,
                    ]}
                    onPress={() => setDifficulty(level)}
                  >
                    <Text
                      style={[
                        styles.difficultyButtonText,
                        difficulty === level &&
                          styles.difficultyButtonTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {quizzes.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Generated Quizzes</Text>
                </View>
                {quizzes.slice(0, 1).map((quiz, index) => (
                  <View
                    key={`${quiz.id ?? 'quiz'}-${index}`}
                    style={styles.quizCard}
                  >
                    <View style={styles.quizImageContainer}>
                      <View style={styles.quizImagePlaceholder}>
                        <Ionicons name="school" size={48} color="#d1d5db" />
                      </View>
                      <View style={styles.readyBadge}>
                        <Text style={styles.readyBadgeText}>READY TO PLAY</Text>
                      </View>
                    </View>
                    <View style={styles.quizContent}>
                      <Text style={styles.quizTitle}>{quiz.title}</Text>
                      <Text style={styles.quizSubtitle}>
                        Based on {quiz.fileName}
                      </Text>
                      <View style={styles.questionCountBadge}>
                        <Text style={styles.questionCountBadgeText}>
                          {quiz.questions.length} Qs
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.startQuizButton}
                      onPress={() => handleStartQuiz(quiz.id)}
                    >
                      <Ionicons name="play" size={20} color="#fff" />
                      <Text style={styles.startQuizButtonText}>Start Quiz</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleGenerateNewQuiz}
      >
        <Ionicons name="sparkles" size={24} color="#fff" />
        <Text style={styles.floatingButtonText}>Generate New Quiz</Text>
      </TouchableOpacity>
    </View>
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
  scrollView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'System',
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  uploadCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#8A2BE2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'System',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  selectButton: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  questionBadge: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    marginTop: 12,
    height: 30,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#8A2BE2',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8A2BE2',
    top: 5,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  difficultyContainer: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  difficultyButtonActive: {
    backgroundColor: '#8A2BE2',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  difficultyButtonTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  uploadItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  fileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  uploadItemInfo: {
    flex: 1,
  },
  uploadItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  uploadItemMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  quizImageContainer: {
    height: 160,
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  quizImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  quizImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  readyBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  readyBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  quizContent: {
    padding: 16,
  },
  quizTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  quizSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  questionCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  questionCountBadgeText: {
    color: '#8A2BE2',
    fontSize: 12,
    fontWeight: '600',
  },
  startQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8A2BE2',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startQuizButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
