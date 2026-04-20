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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
import { generateFlashcardsFromBackend } from '../../src/api/ai';
import { DocumentSourceRecord, FlashcardDeck } from '../../src/types';
import {
  hydrateDocumentSourceFromBackend,
  persistUploadedDocumentSource,
} from '../../src/utils/documentSources';
import { showToast } from '../../src/utils/notifications';
import {
  findDocumentSource,
  saveGeneratedFlashcards,
  getGeneratedFlashcards,
  getGeneratedFlashcardsById,
  upsertDocumentSource,
} from '../../src/utils/storage';

interface AnswerRecord {
  cardId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  partialCredit: number;
}

const CARD_OPTIONS = [5, 10, 15, 20] as const;
const MAX_CARD_OPTION = CARD_OPTIONS[CARD_OPTIONS.length - 1];

export default function FlashcardsScreen() {
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
  const [generatedDecks, setGeneratedDecks] = useState<FlashcardDeck[]>([]);
  const [cardCount, setCardCount] = useState(10);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Study mode states
  const [studyMode, setStudyMode] = useState(false);
  const [currentDeck, setCurrentDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<string | null>(null);

  const numCards = cardCount;

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

      const [sessionsData, savedDecks] = await Promise.all([
        getSessions(),
        getGeneratedFlashcards(),
      ]);

      const sessionList = sessionsData.sessions || [];
      setSessions(sessionList);
      setGeneratedDecks(savedDecks);

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
      console.error('Error fetching flashcard generator data:', error);
      showToast('Unable to load flashcard data right now.', 'Load Error');
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

  // Load study deck when deckId is provided
  useEffect(() => {
    const loadStudyDeck = async () => {
      if (params.deckId) {
        try {
          setIsLoading(true);
          const deck = await getGeneratedFlashcardsById(params.deckId);
          if (deck) {
            setCurrentDeck(deck);
            setStudyMode(true);
            setCurrentCardIndex(0);
            setAnswers([]);
            setSessionComplete(false);
            setAiEvaluation(null);
          } else {
            showToast('Flashcard deck not found', 'Error');
          }
        } catch (error) {
          console.error('Failed to load deck:', error);
          showToast('Unable to load flashcard deck', 'Error');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadStudyDeck();
  }, [params.deckId]);

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

  const handleGenerateFlashcards = async () => {
    if (isGenerating) {
      return;
    }

    const fileName = selectedFile?.file_name || params.fileName;
    if (!fileName) {
      showToast('Choose an uploaded document before generating flashcards.');
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

      console.log('[Flashcard] Starting flashcard generation...');
      const result = await generateFlashcardsFromBackend(
        {
          numCards,
          fileName,
          sourceText: params.sourceText || resolvedSource?.sourceText,
          sessionId: selectedSession?.id || params.sessionId,
          geminiFileUri: params.geminiFileUri || resolvedSource?.geminiFileUri,
          mimeType:
            params.mimeType ||
            resolvedSource?.mimeType ||
            selectedFile?.file_type,
          fileUrl: selectedFile?.file_url,
          documentId: params.documentId || resolvedSource?.documentId,
        },
        (progress) => {
          setProgressValue(progress);
        },
      );
      console.log('[Flashcard] Backend generation succeeded!');

      await saveGeneratedFlashcards(result.deck);
      console.log('[Flashcard] Flashcards saved successfully!');

      setGeneratedDecks((current) => [
        result.deck,
        ...current.filter((deck) => deck.id !== result.deck.id),
      ]);
      stopProgress();
      showToast('Flashcards generated successfully!', 'Flashcards Ready');
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
      stopProgress();
      showToast(
        'Could not generate enough flashcards from this specific document.',
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
        `Would you like to generate flashcards from "${file.file_name}" now?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Generate',
            onPress: () => {
              setTimeout(() => handleGenerateFlashcards(), 500);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Failed to refresh flashcard uploads after upload:', error);
      showToast(
        'The file uploaded, but we could not refresh the file list yet.',
        'Refresh Failed',
      );
    }
  };

  // Study mode functions
  const currentCard = currentDeck?.cards[currentCardIndex];

  const handleSubmitAnswer = () => {
    if (!currentCard || !userAnswer.trim()) {
      showToast('Please enter your answer');
      return;
    }

    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = currentCard.back.trim().toLowerCase();
    const isCorrect = normalizedUser === normalizedCorrect;

    let partialCredit = 0;
    if (!isCorrect) {
      const userWords = new Set(normalizedUser.split(' '));
      const correctWords = new Set(normalizedCorrect.split(' '));
      const overlap = [...userWords].filter((w) => correctWords.has(w)).length;
      const minLen = Math.min(userWords.size, correctWords.size);
      if (minLen > 0) {
        partialCredit = Math.round((overlap / minLen) * 50);
      }
    }

    const record: AnswerRecord = {
      cardId: currentCard.id,
      userAnswer: userAnswer.trim(),
      correctAnswer: currentCard.back,
      isCorrect: isCorrect,
      partialCredit: isCorrect ? 100 : partialCredit,
    };

    setAnswers((prev) => [...prev, record]);
    setShowAnswer(true);
  };

  const handleNextCard = () => {
    if (!currentDeck) return;

    if (currentCardIndex < currentDeck.cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setUserAnswer('');
      setShowAnswer(false);
    } else {
      setSessionComplete(true);
      evaluateSession();
    }
  };

  const evaluateSession = async () => {
    if (!currentDeck || answers.length === 0) return;

    setIsEvaluating(true);

    try {
      const score = answers.reduce(
        (acc, a) => acc + (a.isCorrect ? 100 : a.partialCredit),
        0,
      );
      const maxScore = answers.length * 100;
      const percentage = Math.round((score / maxScore) * 100);

      const topicsToReview = answers
        .filter((a) => !a.isCorrect && a.partialCredit < 30)
        .map((a) => a.correctAnswer.split(' ').slice(0, 3).join(' '))
        .slice(0, 3);

      const evaluation = `Score: ${percentage}/100\n\nCorrect: ${answers.filter((a) => a.isCorrect).length}/${answers.length}\n\nTopics to review:\n${topicsToReview.map((t, i) => `${i + 1}. ${t}`).join('\n') || 'None - Great job!'}`;

      setAiEvaluation(evaluation);
    } catch (error) {
      console.error('Evaluation error:', error);
      setAiEvaluation('Unable to generate evaluation');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setUserAnswer('');
    setShowAnswer(false);
    setAnswers([]);
    setSessionComplete(false);
    setAiEvaluation(null);
  };

  const handleExitStudy = () => {
    setStudyMode(false);
    setCurrentDeck(null);
    setCurrentCardIndex(0);
    setUserAnswer('');
    setShowAnswer(false);
    setAnswers([]);
    setSessionComplete(false);
    setAiEvaluation(null);
    router.replace('/(tabs)/flashcards');
  };

  const renderStudyMode = () => {
    if (!currentDeck || !currentCard) return null;

    const progress = ((currentCardIndex + 1) / currentDeck.cards.length) * 100;

    if (sessionComplete) {
      return (
        <KeyboardAvoidingView
          style={styles.studyContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.sessionCompleteCard}>
            <View style={styles.completeIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            </View>
            <Text style={styles.completeTitle}>Session Complete!</Text>
            <Text style={styles.completeSubtitle}>
              You reviewed {answers.length} cards
            </Text>

            {isEvaluating ? (
              <View style={styles.evaluatingContainer}>
                <ActivityIndicator size="small" color="#8a2be2" />
                <Text style={styles.evaluatingText}>
                  Analyzing performance...
                </Text>
              </View>
            ) : aiEvaluation ? (
              <View style={styles.evaluationResult}>
                <Text style={styles.evaluationTitle}>Performance Analysis</Text>
                <Text style={styles.evaluationText}>{aiEvaluation}</Text>
              </View>
            ) : null}

            <View style={styles.sessionActions}>
              <TouchableOpacity
                style={styles.restartButton}
                onPress={handleRestart}
              >
                <Ionicons name="refresh" size={20} color="#8a2be2" />
                <Text style={styles.restartButtonText}>Restart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exitButton}
                onPress={handleExitStudy}
              >
                <Ionicons name="exit-outline" size={20} color="#ffffff" />
                <Text style={styles.exitButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      );
    }

    return (
      <KeyboardAvoidingView
        style={styles.studyContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.studyHeader}>
          <TouchableOpacity
            onPress={handleExitStudy}
            style={styles.exitIconButton}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentCardIndex + 1} of {currentDeck.cards.length}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardScrollContent}
        >
          <View style={styles.flashcard}>
            <View style={styles.cardLabel}>
              <Text style={styles.cardLabelText}>QUESTION</Text>
            </View>
            <Text style={styles.cardQuestion}>{currentCard.front}</Text>

            {!showAnswer ? (
              <View style={styles.answerInputContainer}>
                <Text style={styles.answerLabel}>Type your answer:</Text>
                <TextInput
                  style={styles.answerInput}
                  multiline
                  placeholder="Type your answer here..."
                  placeholderTextColor="#9ca3af"
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                />
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitAnswer}
                >
                  <Text style={styles.submitButtonText}>Submit Answer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.answerRevealContainer}>
                <View style={styles.cardLabel}>
                  <Text style={styles.cardLabelText}>YOUR ANSWER</Text>
                </View>
                <Text style={styles.userAnswerText}>{userAnswer}</Text>

                <View style={styles.cardLabel}>
                  <Text style={styles.cardLabelText}>CORRECT ANSWER</Text>
                </View>
                <Text style={styles.correctAnswerText}>{currentCard.back}</Text>

                <View
                  style={[
                    styles.resultBadge,
                    answers[answers.length - 1]?.isCorrect
                      ? styles.correctBadge
                      : styles.incorrectBadge,
                  ]}
                >
                  <Ionicons
                    name={
                      answers[answers.length - 1]?.isCorrect
                        ? 'checkmark'
                        : 'close'
                    }
                    size={16}
                    color="#ffffff"
                  />
                  <Text style={styles.resultBadgeText}>
                    {answers[answers.length - 1]?.isCorrect
                      ? 'Correct!'
                      : 'Incorrect'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNextCard}
                >
                  <Text style={styles.nextButtonText}>
                    {currentCardIndex < currentDeck.cards.length - 1
                      ? 'Next Card'
                      : 'Finish Session'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderUploadSection = () => (
    <View style={styles.uploadCard}>
      <View style={styles.uploadIconCircle}>
        <Ionicons name="layers" size={30} color="#8a2be2" />
      </View>
      <Text style={styles.uploadTitle}>AI Flashcard Generator</Text>
      <Text style={styles.uploadSubtitle}>
        Pick an uploaded note, tune the settings, and let AI build flashcards.
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

  const renderCardSlider = () => (
    <View style={styles.settingSection}>
      <View style={styles.sliderHeader}>
        <Text style={styles.settingLabel}>Number of flashcards</Text>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{numCards}</Text>
        </View>
      </View>
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              { width: `${(numCards / MAX_CARD_OPTION) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.sliderTouchArea}>
          {CARD_OPTIONS.map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.sliderThumb}
              onPress={() => setCardCount(value)}
            >
              <View
                style={[
                  styles.thumbInner,
                  numCards === value && styles.thumbInnerActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
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
            Building your flashcards with AI
          </Text>
        </View>
        <Text style={styles.generatingSubtitle}>
          {numCards} flashcards • {selectedSourceLabel}
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

  const renderGeneratedDecks = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Generated Flashcards</Text>
      {generatedDecks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="layers-outline" size={32} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            Your saved AI flashcards will appear here for offline study.
          </Text>
        </View>
      ) : (
        generatedDecks.slice(0, 3).map((deck) => (
          <View key={deck.id} style={styles.deckCard}>
            <View style={styles.deckImageContainer}>
              <View style={styles.deckPlaceholder}>
                <Ionicons name="layers" size={48} color="#8a2be2" />
              </View>
              <View style={styles.deckBadge}>
                <Text style={styles.deckBadgeText}>READY</Text>
              </View>
            </View>
            <View style={styles.deckContent}>
              <Text style={styles.deckTitle}>{deck.title}</Text>
              <Text style={styles.deckDescription}>
                {deck.sourceFileName} • {deck.cards.length} cards
              </Text>
              <View style={styles.deckMetaRow}>
                <View style={styles.cardCountBadge}>
                  <Text style={styles.cardCountText}>
                    {deck.cards.length} Cards
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.startDeckButton}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/flashcards',
                    params: { deckId: deck.id },
                  })
                }
              >
                <Ionicons name="play" size={20} color="#ffffff" />
                <Text style={styles.startDeckButtonText}>Study Now</Text>
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
        void handleGenerateFlashcards();
      }}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Ionicons name="layers" size={22} color="#ffffff" />
      )}
      <Text style={styles.bottomButtonText}>
        {isGenerating ? 'Generating...' : 'Generate Flashcards'}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8a2be2" />
          <Text style={styles.loadingText}>Loading flashcard generator...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render study mode if active
  if (studyMode) {
    return renderStudyMode();
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
        <Text style={styles.headerTitle}>Generate Flashcards</Text>
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
          {renderCardSlider()}
        </View>

        {renderRecentUploads()}
        {isGenerating ? renderGeneratingState() : null}
        {renderGeneratedDecks()}

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
  cardBadge: {
    backgroundColor: '#8a2be2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardBadgeText: {
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
  deckCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  deckImageContainer: {
    height: 140,
    backgroundColor: '#f3e8ff',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deckPlaceholder: {
    opacity: 0.5,
  },
  deckBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deckBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  deckContent: {
    padding: 16,
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  deckMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardCountBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardCountText: {
    color: '#8a2be2',
    fontSize: 12,
    fontWeight: '600',
  },
  startDeckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8a2be2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startDeckButtonText: {
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

  // Study Mode Styles
  studyContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  studyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  exitIconButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  cardScroll: {
    flex: 1,
  },
  cardScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  flashcard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
  },
  cardLabel: {
    marginBottom: 12,
  },
  cardLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8a2be2',
    letterSpacing: 1.2,
  },
  cardQuestion: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 30,
    marginBottom: 24,
  },
  answerInputContainer: {
    marginTop: 16,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  answerInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#8a2be2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  answerRevealContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  userAnswerText: {
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 16,
    lineHeight: 24,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 24,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 16,
  },
  correctBadge: {
    backgroundColor: '#10b981',
  },
  incorrectBadge: {
    backgroundColor: '#ef4444',
  },
  resultBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8a2be2',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Session Complete Styles
  sessionCompleteCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  completeIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  evaluatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  evaluatingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  evaluationResult: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  evaluationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  evaluationText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  restartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3e8ff',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  restartButtonText: {
    color: '#8a2be2',
    fontSize: 16,
    fontWeight: '700',
  },
  exitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  exitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
