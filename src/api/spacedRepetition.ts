import { api } from './axiosConfig';
import { Card, CardCreateInput, CardReviewInput } from '../types';

export const createCard = async (input: CardCreateInput): Promise<Card> => {
  const response = await api.post('/api/cards', input);
  return response.data;
};

export const getCards = async (sessionId?: string): Promise<Card[]> => {
  const params = sessionId ? { sessionId } : {};
  const response = await api.get('/api/cards', { params });
  return response.data;
};

export const getDueCards = async (): Promise<Card[]> => {
  const response = await api.get('/api/cards/due');
  return response.data;
};

export const getCard = async (id: string): Promise<Card> => {
  const response = await api.get(`/api/cards/${id}`);
  return response.data;
};

export const updateCard = async (
  id: string,
  input: Partial<CardCreateInput>,
): Promise<Card> => {
  const response = await api.patch(`/api/cards/${id}`, input);
  return response.data;
};

export const reviewCard = async (
  id: string,
  input: CardReviewInput,
): Promise<Card> => {
  const response = await api.post(`/api/cards/${id}/review`, input);
  return response.data;
};

export const deleteCard = async (id: string): Promise<void> => {
  await api.delete(`/api/cards/${id}`);
};
