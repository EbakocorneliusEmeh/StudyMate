import { api } from './axiosConfig';
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
  if (data && typeof data === 'object' && 'quiz' in data) {
    return { quiz: (data as { quiz: GeneratedQuiz }).quiz };
  }

  return { quiz: data as GeneratedQuiz };
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

export const generateFlashcardsFromBackend = async (
  input: GenerateFlashcardsRequest,
  onProgress?: (progress: number) => void,
): Promise<{ deck: FlashcardDeck }> => {
  onProgress?.(10);
  const response = await api.post('/flashcards/generate', input);
  onProgress?.(100);
  return normalizeFlashcardResponse(response.data);
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
