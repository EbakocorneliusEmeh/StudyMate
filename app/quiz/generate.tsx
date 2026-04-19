import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileUploader } from '../../components/FileUploader';
import {
  getSessionFiles,
  getSessions,
  SessionFile,
  StudySession,
} from '../../src/api/sessions';
import { UploadedFile } from '../../src/api/upload';
import { suggestQuizTopics } from '../../src/services/api';
import {
  generateQuizWithGemini,
  generateQuizWithGroq,
  generateQuizWithOpenAI,
  generateQuizWithOpenRouter,
} from '../../src/services/geminiQuiz';
import { DocumentSourceRecord, GeneratedQuiz } from '../../src/types';
import {
  hydrateDocumentSourceFromBackend,
  persistUploadedDocumentSource,
} from '../../src/utils/documentSources';
import { showToast } from '../../src/utils/notifications';
import {
  findDocumentSource,
  getGeneratedQuizzes,
  saveGeneratedQuiz,
  upsertDocumentSource,
} from '../../src/utils/storage';

const QUESTION_OPTIONS = [5, 10, 15, 20] as const;
const MAX_QUESTION_OPTION = QUESTION_OPTIONS[QUESTION_OPTIONS.length - 1];

export default function GenerateQuizPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId?: string;
    fileName?: string;
    fileUrl?: string;
    documentId?: string;
    sourceText?: string;
    geminiFileUri?: string;
    mimeType?: string;
  }>();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(
    null,
  );
  const [sessionFiles, setSessionFiles] = useState<SessionFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<SessionFile | null>(null);
  const [generatedQuizzes, setGeneratedQuizzes] = useState<GeneratedQuiz[]>([]);
  const [questionCount, setQuestionCount] = useState(15);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'medium',
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const numQuestions = questionCount;

  const startProgress = () => {
    setProgressValue(12);
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }

    progressTimerRef.current = setInterval(() => {
      setProgressValue((current) => (current >= 92 ? current : current + 8));
    }, 280);
  };

  const stopProgress = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgressValue(100);
    setTimeout(() => setProgressValue(0), 400);
  };

  const syncStoredParamSource = useCallback(async () => {
    if (
      !params.fileName ||
      (!params.sourceText &&
        !params.geminiFileUri &&
        !params.fileUrl &&
        !params.documentId)
    ) {
      return;
    }

    const sourceRecord: DocumentSourceRecord = {
      id: `${params.sessionId || 'global'}:${params.fileName}`,
      sessionId: params.sessionId,
      documentId: params.documentId,
      fileName: params.fileName,
      fileUrl: params.fileUrl,
      sourceText: params.sourceText,
      geminiFileUri: params.geminiFileUri,
      mimeType: params.mimeType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await upsertDocumentSource(sourceRecord);
  }, [
    params.fileName,
    params.fileUrl,
    params.documentId,
    params.geminiFileUri,
    params.mimeType,
    params.sessionId,
    params.sourceText,
  ]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      await syncStoredParamSource();

      const [sessionsData, savedQuizzes] = await Promise.all([
        getSessions(),
        getGeneratedQuizzes(),
      ]);

      const sessionList = sessionsData.sessions || [];
      setSessions(sessionList);
      setGeneratedQuizzes(savedQuizzes);

      const nextSession =
        sessionList.find((session) => session.id === params.sessionId) ||
        sessionList[0] ||
        null;

      setSelectedSession(nextSession);

      if (!nextSession) {
        setSessionFiles([]);
        setSelectedFile(null);
        return;
      }

      const filesData = await getSessionFiles(nextSession.id);
      setSessionFiles(filesData || []);

      const preferredFile =
        filesData.find((file) => file.file_name === params.fileName) ||
        filesData[0] ||
        null;

      setSelectedFile(preferredFile);
    } catch (error) {
      console.error('Error fetching quiz generator data:', error);
      showToast('Unable to load quiz data right now.', 'Load Error');
    } finally {
      setIsLoading(false);
    }
  }, [params.fileName, params.sessionId, syncStoredParamSource]);

  useEffect(() => {
    void fetchData();

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [fetchData]);

  const selectedSourceLabel = useMemo(
    () => selectedFile?.file_name || params.fileName || 'Select a source file',
    [params.fileName, selectedFile?.file_name],
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return { name: 'document-text', color: '#ef4444' };
    }
    if (type.includes('word') || type.includes('docx')) {
      return { name: 'document', color: '#3b82f6' };
    }
    if (type.startsWith('image/')) {
      return { name: 'image', color: '#10b981' };
    }
    return { name: 'document-text', color: '#6b7280' };
  };

  const handleGenerateQuiz = async () => {
    if (isGenerating) {
      return;
    }

    const fileName = selectedFile?.file_name || params.fileName;
    if (!fileName) {
      showToast('Choose an uploaded document before generating a quiz.');
      return;
    }

    try {
      setIsGenerating(true);
      startProgress();

      const storedSource = await findDocumentSource({
        fileId: selectedFile?.id,
        fileName,
        fileUrl: selectedFile?.file_url,
        sessionId: selectedSession?.id || params.sessionId,
      });
      const hydratedSource =
        !storedSource?.sourceText &&
        !storedSource?.geminiFileUri &&
        storedSource?.documentId &&
        (selectedSession?.id || params.sessionId)
          ? await hydrateDocumentSourceFromBackend({
              documentId: storedSource.documentId,
              sessionId: selectedSession?.id || params.sessionId || 'global',
              fileId: selectedFile?.id,
              fileName,
              fileUrl: selectedFile?.file_url,
            })
          : null;
      const resolvedSource = hydratedSource || storedSource;

      const fallbackGeminiUri =
        params.geminiFileUri ||
        (selectedFile?.file_url &&
        (selectedFile.file_url.startsWith('gs://') ||
          selectedFile.file_url.includes('generativelanguage.googleapis.com'))
          ? selectedFile.file_url
          : undefined);

      let result;
      console.log('[Quiz] Starting quiz generation...');

      // Try OpenRouter first (most reliable)
      try {
        console.log('[Quiz] Trying OpenRouter...');
        result = await generateQuizWithOpenRouter({
          numQuestions,
          difficulty,
          fileName,
          sessionId: selectedSession?.id || params.sessionId,
          sourceText: params.sourceText || resolvedSource?.sourceText,
        });
        console.log('[Quiz] OpenRouter succeeded!');
      } catch (orError) {
        const err = orError as Error;
        console.log('[Quiz] OpenRouter failed:', err.message);

        // Try OpenAI
        try {
          console.log('[Quiz] Trying OpenAI...');
          result = await generateQuizWithOpenAI({
            numQuestions,
            difficulty,
            fileName,
            sessionId: selectedSession?.id || params.sessionId,
            sourceText: params.sourceText || resolvedSource?.sourceText,
          });
          console.log('[Quiz] OpenAI succeeded!');
        } catch (openaiError) {
          const err2 = openaiError as Error;
          console.log('[Quiz] OpenAI failed:', err2.message);

          // Try Groq
          try {
            console.log('[Quiz] Trying Groq...');
            result = await generateQuizWithGroq({
              numQuestions,
              difficulty,
              fileName,
              sessionId: selectedSession?.id || params.sessionId,
              sourceText: params.sourceText || resolvedSource?.sourceText,
            });
            console.log('[Quiz] Groq succeeded!');
          } catch (groqError) {
            const err3 = groqError as Error;
            console.log('[Quiz] Groq failed:', err3.message);

            // Try Gemini last (it has free tier)
            try {
              console.log('[Quiz] Trying Gemini...');
              result = await generateQuizWithGemini({
                numQuestions,
                difficulty,
                fileName,
                sessionId: selectedSession?.id || params.sessionId,
                sourceText: params.sourceText || resolvedSource?.sourceText,
                geminiFileUri:
                  fallbackGeminiUri || resolvedSource?.geminiFileUri,
                mimeType:
                  params.mimeType ||
                  resolvedSource?.mimeType ||
                  selectedFile?.file_type,
              });
              console.log('[Quiz] Gemini succeeded!');
            } catch (geminiError) {
              const err4 = geminiError as Error;
              console.log('[Quiz] Gemini failed:', err4.message);
              throw new Error(
                `All AI providers failed: OpenRouter(${err.message}), OpenAI(${err2.message}), Groq(${err3.message}), Gemini(${err4.message})`,
              );
            }
          }
        }
      }

      await saveGeneratedQuiz(result.quiz);
      console.log('[Quiz] Quiz saved successfully!');

      const sourceForTopics = params.sourceText || resolvedSource?.sourceText;
      let suggestedTopics: string[] = [];
      if (sourceForTopics) {
        try {
          const topicsResult = await suggestQuizTopics({
            quizTitle: result.quiz.title,
            fileName: fileName,
            sourceText: sourceForTopics,
          });
          if (topicsResult.success && topicsResult.topics?.length > 0) {
            suggestedTopics = topicsResult.topics;
          }
        } catch (topicsError) {
          console.warn('Could not fetch study topics:', topicsError);
        }
      }

      setGeneratedQuizzes((current) => [
        { ...result.quiz, suggestedTopics },
        ...current.filter((quiz) => quiz.id !== result.quiz.id),
      ]);
      stopProgress();
      showToast('Quiz generated successfully!', 'Quiz Ready');
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      stopProgress();
      showToast(
        'Could not generate enough questions from this specific document.',
        'Generation Failed',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadComplete = async (
    file: UploadedFile,
    sessionId: string,
  ) => {
    try {
      setShowUploadModal(false);
      const uploadSession =
        sessions.find((session) => session.id === sessionId) || selectedSession;
      setSelectedSession(uploadSession || null);
      const refreshedFiles = await getSessionFiles(sessionId);
      setSessionFiles(refreshedFiles);

      const matchingFile =
        refreshedFiles.find((item) => item.file_name === file.file_name) ||
        null;

      if (matchingFile) {
        setSelectedFile(matchingFile);
      }

      await persistUploadedDocumentSource({
        uploadedFile: file,
        sessionId,
        fileId: matchingFile?.id,
      });

      Alert.alert(
        'File Uploaded!',
        `Would you like to generate a quiz from "${file.file_name}" now?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Generate Quiz',
            onPress: () => {
              setTimeout(() => handleGenerateQuiz(), 500);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Failed to refresh quiz uploads after upload:', error);
      showToast(
        'The file uploaded, but we could not refresh the quiz file list yet.',
        'Refresh Failed',
      );
    }
  };

  const renderUploadSection = () => (
    <View style={styles.uploadCard}>
      <View style={styles.uploadIconCircle}>
        <Ionicons name="sparkles" size={30} color="#8a2be2" />
      </View>
      <Text style={styles.uploadTitle}>AI Quiz Generator</Text>
      <Text style={styles.uploadSubtitle}>
        Pick an uploaded note, tune the settings, and let Gemini build a quiz.
      </Text>
      <TouchableOpacity
        style={styles.selectFileButton}
        onPress={() => {
          setShowUploadModal(true);
        }}
      >
        <Text style={styles.selectFileButtonText}>Upload More Files</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuestionSlider = () => (
    <View style={styles.settingSection}>
      <View style={styles.sliderHeader}>
        <Text style={styles.settingLabel}>Number of questions</Text>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>{numQuestions}</Text>
        </View>
      </View>
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              { width: `${(numQuestions / MAX_QUESTION_OPTION) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.sliderTouchArea}>
          {QUESTION_OPTIONS.map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.sliderThumb}
              onPress={() => setQuestionCount(value)}
            >
              <View
                style={[
                  styles.thumbInner,
                  numQuestions === value && styles.thumbInnerActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderDifficultySelector = () => (
    <View style={styles.settingSection}>
      <Text style={styles.settingLabel}>Difficulty</Text>
      <View style={styles.difficultyContainer}>
        {(['easy', 'medium', 'hard'] as const).map((level) => (
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
                styles.difficultyText,
                difficulty === level && styles.difficultyTextActive,
              ]}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSessionSelector = () => (
    <View style={styles.settingSection}>
      <Text style={styles.settingLabel}>Session</Text>
      <View style={styles.sessionSelector}>
        <Ionicons name="folder-outline" size={20} color="#8a2be2" />
        <Text style={styles.sessionSelectorText}>
          {selectedSession?.title || 'No session available'}
        </Text>
      </View>
    </View>
  );

  const renderSelectedSource = () => (
    <View style={styles.settingSection}>
      <Text style={styles.settingLabel}>Selected source</Text>
      <View style={styles.sessionSelector}>
        <Ionicons name="document-text-outline" size={20} color="#8a2be2" />
        <Text style={styles.sessionSelectorText}>{selectedSourceLabel}</Text>
      </View>
    </View>
  );

  const renderRecentUploads = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Uploads</Text>
        <Text style={styles.sectionHint}>Tap one to use it</Text>
      </View>
      {sessionFiles.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="folder-open-outline" size={32} color="#cbd5e1" />
          <Text style={styles.emptyText}>No files uploaded yet</Text>
        </View>
      ) : (
        sessionFiles.slice(0, 5).map((file) => {
          const icon = getFileIcon(file.file_type);
          const isActive = selectedFile?.id === file.id;

          return (
            <TouchableOpacity
              key={file.id}
              style={[styles.fileCard, isActive && styles.fileCardActive]}
              onPress={() => setSelectedFile(file)}
            >
              <View
                style={[
                  styles.fileIcon,
                  { backgroundColor: `${icon.color}20` },
                ]}
              >
                <Ionicons
                  name={icon.name as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={icon.color}
                />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.file_name}
                </Text>
                <Text style={styles.fileMeta}>
                  Uploaded {formatTimeAgo(file.created_at)} •{' '}
                  {formatFileSize(file.file_size)}
                </Text>
              </View>
              {isActive ? (
                <Ionicons name="checkmark-circle" size={22} color="#8a2be2" />
              ) : null}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  const renderGeneratingState = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Generating</Text>
      <View style={styles.generatingCard}>
        <View style={styles.generatingHeader}>
          <ActivityIndicator size="small" color="#8a2be2" />
          <Text style={styles.generatingTitle}>
            Building your quiz with Gemini
          </Text>
        </View>
        <Text style={styles.generatingSubtitle}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty
          • {numQuestions} questions • {selectedSourceLabel}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.max(progressValue, 10)}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );

  const renderGeneratedQuizzes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Generated Quizzes</Text>
      {generatedQuizzes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="school-outline" size={32} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            Your saved AI quizzes will appear here for offline replay.
          </Text>
        </View>
      ) : (
        generatedQuizzes.slice(0, 3).map((quiz) => (
          <View key={quiz.id} style={styles.quizCard}>
            <View style={styles.quizImageContainer}>
              <View style={styles.quizPlaceholder}>
                <Ionicons name="school" size={48} color="#8a2be2" />
              </View>
              <View style={styles.quizBadge}>
                <Text style={styles.quizBadgeText}>READY TO PLAY</Text>
              </View>
            </View>
            <View style={styles.quizContent}>
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.quizDescription}>
                {quiz.fileName} • {quiz.difficulty} • {quiz.questions.length}{' '}
                questions
              </Text>
              <View style={styles.quizMetaRow}>
                <View style={styles.questionCountBadge}>
                  <Text style={styles.questionCountText}>
                    {quiz.questions.length} Qs
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.startQuizButton}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/quiz',
                    params: { quizId: quiz.id },
                  })
                }
              >
                <Ionicons name="play" size={20} color="#ffffff" />
                <Text style={styles.startQuizButtonText}>Start Quiz</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderBottomButton = () => (
    <TouchableOpacity
      style={[styles.bottomButton, isGenerating && styles.bottomButtonDisabled]}
      onPress={() => {
        void handleGenerateQuiz();
      }}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Ionicons name="sparkles" size={22} color="#ffffff" />
      )}
      <Text style={styles.bottomButtonText}>
        {isGenerating ? 'Generating Quiz...' : 'Generate New Quiz'}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8a2be2" />
          <Text style={styles.loadingText}>Loading quiz generator...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate Quiz</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderUploadSection()}

        <View style={styles.settingsCard}>
          {renderSessionSelector()}
          {renderSelectedSource()}
          {renderQuestionSlider()}
          {renderDifficultySelector()}
        </View>

        {renderRecentUploads()}
        {isGenerating ? renderGeneratingState() : null}
        {renderGeneratedQuizzes()}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomButtonContainer}>{renderBottomButton()}</View>

      <FileUploader
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        sessions={sessions}
        initialSessionId={selectedSession?.id || params.sessionId}
        onUploadComplete={(file, sessionId) => {
          void handleUploadComplete(file, sessionId);
        }}
        onUploadSuccess={(message) => {
          showToast(message, 'Upload Complete');
        }}
        onUploadError={(message) => {
          showToast(message, 'Upload Failed');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  uploadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#8a2be2',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadIconCircle: {
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
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectFileButton: {
    backgroundColor: '#8a2be2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectFileButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  settingSection: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  questionBadge: {
    backgroundColor: '#8a2be2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    height: 40,
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
    backgroundColor: '#c4b5fd',
    borderRadius: 3,
  },
  sliderTouchArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 8,
  },
  sliderThumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#d1d5db',
  },
  thumbInnerActive: {
    backgroundColor: '#8a2be2',
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
    borderRadius: 8,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: '#8a2be2',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  difficultyTextActive: {
    color: '#ffffff',
  },
  sessionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  sessionSelectorText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionHint: {
    fontSize: 13,
    color: '#8a2be2',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  fileCardActive: {
    borderColor: '#8a2be2',
    backgroundColor: '#faf5ff',
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  generatingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  generatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  generatingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  generatingSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 14,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#ede9fe',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8a2be2',
    borderRadius: 999,
  },
  quizCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  quizImageContainer: {
    height: 140,
    backgroundColor: '#f3e8ff',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizPlaceholder: {
    opacity: 0.5,
  },
  quizBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quizBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  quizContent: {
    padding: 16,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  quizDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  quizMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionCountBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questionCountText: {
    color: '#8a2be2',
    fontSize: 12,
    fontWeight: '600',
  },
  startQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8a2be2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startQuizButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 80,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  bottomButtonDisabled: {
    opacity: 0.75,
  },
  bottomButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
