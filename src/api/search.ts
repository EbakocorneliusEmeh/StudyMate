import { api } from './axiosConfig';

export interface SearchFilters {
  query: string;
  offset?: number;
  limit?: number;
  date_from?: string;
  date_to?: string;
  file_type?: string;
  include_history?: boolean;
}

export interface SearchResult {
  results: any[];
  has_more: boolean;
  pagination: {
    offset: number;
    limit: number;
    total?: number;
  };
}

export interface SearchHistoryItem {
  id: number;
  query: string;
  created_at: string;
}

export const searchApi = {
  search: async (filters: SearchFilters): Promise<SearchResult> => {
    const response = await api.post<SearchResult>('/search', filters);
    return response.data;
  },

  searchStream: async (filters: SearchFilters): Promise<ReadableStream> => {
    const response = await api.post('/search/stream', filters, {
      responseType: 'stream',
    });
    return response.data;
  },

  getSearchHistory: async (): Promise<SearchHistoryItem[]> => {
    const response = await api.get<SearchHistoryItem[]>('/search/history');
    return response.data;
  },
};
