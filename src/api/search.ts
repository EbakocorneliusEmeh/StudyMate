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

export interface SearchCompanionMessagePayload {
  documentId: string;
  question: string;
  history: any[];
  sessionId?: string;
}

export interface SearchCompanionResponse {
  answer: string;
  document: {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    created_at: string;
  };
  context_source: 'extracted_text' | 'metadata_only';
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

  sendCompanionMessage: async (
    payload: SearchCompanionMessagePayload,
  ): Promise<SearchCompanionResponse> => {
    const response = await api.post<SearchCompanionResponse>(
      '/search/companion/message',
      payload,
    );
    return response.data;
  },

  getSessionChatHistory: async (sessionId: string): Promise<any[]> => {
    const encodedSessionId = encodeURIComponent(sessionId);
    const endpoints = [
      `/chat/session/${encodedSessionId}/history`,
      `/api/chat/session/${encodedSessionId}/history`,
    ];
    let lastError: unknown;

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        const data = response.data;
        if (Array.isArray(data)) {
          return data;
        }
        if (Array.isArray(data?.messages)) {
          return data.messages;
        }
        if (Array.isArray(data?.history)) {
          return data.history;
        }
        return [];
      } catch (error) {
        lastError = error;
        // Try next endpoint
      }
    }

    // All endpoints failed
    console.debug('Session chat history fetch failed on all endpoints.');
    throw lastError;
  },
};
