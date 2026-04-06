import { api } from './axiosConfig';
import { ProgressStats } from '../types';

export const getProgress = async (startDate?: string, endDate?: string): Promise<any> => {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get('/api/progress', { params });
  return response.data;
};

export const getStats = async (): Promise<ProgressStats> => {
  const response = await api.get('/api/progress/stats');
  return response.data;
};