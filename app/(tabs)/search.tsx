import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  searchApi,
  SearchFilters,
  SearchHistoryItem,
} from '../../src/api/search';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await searchApi.getSearchHistory();
      setHistory(data);
    } catch (error) {
      console.log('Failed to load history:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const filters: SearchFilters = { query: query.trim() };
      const response = await searchApi.search(filters);
      setResults(response.results);
      loadHistory();
    } catch (error) {
      console.log('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryPress = async (item: SearchHistoryItem) => {
    setQuery(item.query);
    setLoading(true);
    setHasSearched(true);
    try {
      const filters: SearchFilters = { query: item.query };
      const response = await searchApi.search(filters);
      setResults(response.results);
    } catch (error) {
      console.log('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openResultInAi = (item: any) => {
    const documentId =
      item.document_id || item.documentId || item.documents?.id;
    const fileName =
      item.file_name || item.title || item.documents?.file_name || 'Untitled';
    const fileUrl = item.file_url || item.documents?.file_url || '';

    router.push({
      pathname: '/ai-companion',
      params: {
        ...(documentId ? { documentId: String(documentId) } : {}),
        fileName: String(fileName),
        fileUrl: String(fileUrl),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.input}
            placeholder="Search your materials..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSearch}
              style={styles.searchButton}
            >
              <Text style={styles.searchButtonText}>Search Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7f13ec" />
        </View>
      ) : !hasSearched ? (
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No search history yet</Text>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.historyItem}
                  onPress={() => handleHistoryPress(item)}
                >
                  <Ionicons name="time-outline" size={18} color="#6b7280" />
                  <Text style={styles.historyText}>{item.query}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : results.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={48} color="#d1d5db" />
          <Text style={styles.noResultsText}>No results found</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.id || index}`}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => openResultInAi(item)}
              activeOpacity={0.85}
            >
              <View style={styles.resultIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color="#7f13ec"
                />
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultTitle}>
                  {item.file_name || item.title || 'Untitled'}
                </Text>
                {item.snippet && (
                  <Text style={styles.resultSnippet} numberOfLines={2}>
                    {item.snippet}
                  </Text>
                )}
                <View style={styles.resultActionRow}>
                  <Text style={styles.resultHint}>Tap to open in AI</Text>
                  <TouchableOpacity
                    onPress={() => openResultInAi(item)}
                    style={styles.resultActionButton}
                  >
                    <Text style={styles.resultActionButtonText}>Open AI</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButton: {
    backgroundColor: '#7f13ec',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  historyText: {
    fontSize: 14,
    color: '#374151',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6b7280',
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(127, 19, 236, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  resultSnippet: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  resultHint: {
    fontSize: 12,
    color: '#7f13ec',
    fontWeight: '600',
  },
  resultActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  resultActionButton: {
    backgroundColor: 'rgba(127, 19, 236, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  resultActionButtonText: {
    color: '#7f13ec',
    fontSize: 12,
    fontWeight: '700',
  },
});
