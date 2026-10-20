import { api } from './axiosConfig';
import {
  generateFlashcardsWithGemini,
  generateFlashcardsWithGroq,
} from '../services/flashcardService';
import {
  FlashcardChatMessage,
  FlashcardDeck,
  GeneratedFlashcard,
  GeneratedQuiz,
} from '../types';

export interface GenerateQuizRequest {
  numQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  fileName: string;
  sessionId?: string;
  sourceText?: string;
  geminiFileUri?: string;
  mimeType?: string;
  fileUrl?: string;
  documentId?: string;
}

export interface GenerateFlashcardsRequest {
  numCards: number;
  fileName: string;
  sessionId?: string;
  sourceText?: string;
  geminiFileUri?: string;
  mimeType?: string;
  fileUrl?: string;
  documentId?: string;
}

export interface FlashcardChatRequest {
  message: string;
  deck: FlashcardDeck;
  chatHistory: FlashcardChatMessage[];
}

export type FlashcardModification = 'simpler' | 'harder' | 'examples';

const normalizeQuizResponse = (data: unknown): { quiz: GeneratedQuiz } => {
  if (!data || typeof data !== 'object') {
    return { quiz: data as GeneratedQuiz };
  }

  const d = data as Record<string, unknown>;

  if ('quiz' in d && d.quiz) {
    return { quiz: d.quiz as GeneratedQuiz };
  }

  if ('id' in d && 'questions' in d) {
    const rawQuestions = d.questions as unknown[];
    let qIndex = 0;
    const mappedQuestions = rawQuestions.map((q: unknown) => {
      const question = q as Record<string, unknown>;
      const currentIndex = qIndex++;
      let options: GeneratedQuiz['questions'][0]['options'] = [];

      if (Array.isArray(question.options)) {
        let optIndex = 0;
        options = question.options.map((opt: unknown) => {
          const optStr = String(opt);
          const id = String.fromCharCode(65 + optIndex);
          optIndex++;
          return { id, text: optStr || `Option ${id}` };
        });
      }

      const correctAnswerStr = String(
        question.correct_answer || question.correctAnswer || '',
      );
      const correctOption = options.find(
        (opt) => opt.text === correctAnswerStr,
      );
      const correctAnswerId =
        correctOption?.id || (options.length > 0 ? options[0].id : 'A');

      return {
        id: String(question.id || `q${currentIndex + 1}`),
        question: String(question.question || ''),
        options,
        correct_answer: correctAnswerId,
        explanation: String(question.explanation || ''),
      };
    });

    return {
      quiz: {
        id: String(d.id || ''),
        title: String(d.title || 'Quiz'),
        fileName: String(d.fileName || ''),
        difficulty: ((d.difficulty as string) ||
          'medium') as GeneratedQuiz['difficulty'],
        numQuestions:
          typeof d.numQuestions === 'number'
            ? d.numQuestions
            : mappedQuestions.length,
        sessionId: d.sessionId as string | undefined,
        sourcePreview: d.sourcePreview as string | undefined,
        suggestedTopics: d.suggestedTopics as string[] | undefined,
        createdAt: String(d.createdAt || new Date().toISOString()),
        questions: mappedQuestions,
      },
    };
  }

  return { quiz: data as unknown as GeneratedQuiz };
};

const normalizeFlashcardResponse = (data: unknown): { deck: FlashcardDeck } => {
  if (data && typeof data === 'object' && 'deck' in data) {
    return { deck: (data as { deck: FlashcardDeck }).deck };
  }

  return { deck: data as FlashcardDeck };
};

export const generateQuizFromBackend = async (
  input: GenerateQuizRequest,
): Promise<{ quiz: GeneratedQuiz }> => {
  const response = await api.post('/quiz/generate', input);
  return normalizeQuizResponse(response.data);
};

const generateFlashcardsWithFallback = async (
  input: GenerateFlashcardsRequest,
  onProgress?: (progress: number) => void,
): Promise<{ deck: FlashcardDeck }> => {
  const fallbackStrategies = [
    generateFlashcardsWithGemini,
    generateFlashcardsWithGroq,
  ];

  let lastError: unknown;

  for (const strategy of fallbackStrategies) {
    try {
      onProgress?.(15);
      const result = await strategy(
        {
          numCards: input.numCards,
          fileName: input.fileName,
          sessionId: input.sessionId,
          sourceText: input.sourceText,
          geminiFileUri: input.geminiFileUri,
          mimeType: input.mimeType,
        },
        onProgress,
      );
      return { deck: result.deck };
    } catch (error) {
      lastError = error;
      console.warn('Flashcard fallback generation failed:', error);
    }
  }

  throw lastError ?? new Error('Flashcard generation failed.');
};

export const generateFlashcardsFromBackend = async (
  input: GenerateFlashcardsRequest,
  onProgress?: (progress: number) => void,
): Promise<{ deck: FlashcardDeck }> => {
  onProgress?.(10);

  try {
    const response = await api.post('/flashcards/generate', input);
    onProgress?.(100);
    return normalizeFlashcardResponse(response.data);
  } catch (error) {
    const axiosLike = error as {
      response?: { status?: number };
      code?: string;
    };

    const hasServerMetadata =
      typeof axiosLike === 'object' &&
      axiosLike !== null &&
      ('response' in axiosLike || 'code' in axiosLike);

    if (hasServerMetadata) {
      const status = axiosLike.response?.status ?? 0;
      const shouldFallback = status >= 500 || axiosLike.code === 'ERR_NETWORK';

      if (shouldFallback) {
        console.warn(
          'Backend flashcard generation failed; retrying with direct AI fallback.',
          {
            status,
            code: axiosLike.code,
          },
        );
        return generateFlashcardsWithFallback(input, onProgress);
      }
    }

    throw error;
  }
};

export const chatAboutFlashcardsFromBackend = async (
  input: FlashcardChatRequest,
): Promise<{ response: string }> => {
  const response = await api.post('/flashcards/chat', input);
  const data = response.data as { response?: string; answer?: string };
  return {
    response: data.response || data.answer || '',
  };
};

export const regenerateFlashcardWithBackend = async (
  cardId: string,
  modification: FlashcardModification,
  deck: FlashcardDeck,
): Promise<GeneratedFlashcard> => {
  const response = await api.post('/flashcards/regenerate-card', {
    cardId,
    modification,
    deck,
  });
  const data = response.data as
    | GeneratedFlashcard
    | { card?: GeneratedFlashcard };
  if (data && typeof data === 'object' && 'card' in data && data.card) {
    return data.card;
  }
  return data as GeneratedFlashcard;
};
