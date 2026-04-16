import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CreateSessionForm } from '../components/CreateSessionForm';
import { searchApi, SearchFilters, SearchHistoryItem } from '../src/api/search';

export default function CreateSessionPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await searchApi.getSearchHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Failed to load search history:', error);
      setHistory([]);
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

  const handleResultPress = (item: any) => {
    // Navigate to AI companion with the selected item
    router.push({
      pathname: '/ai-companion',
      params: { documentId: item.id, fileName: item.title },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Main Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Back Button (Maintained per request) */}
          <View style={styles.header}>
            {/* <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity> */}

            <View style={styles.heroSection}>
              <Text style={styles.heroText}>
                What would you like to{' '}
                <Text style={styles.heroAccent}>master</Text> today?
              </Text>

              {/* Reference Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#64748b"
                  style={styles.searchIcon}
                />
                <TextInput
                  placeholder="Search your library or topics..."
                  placeholderTextColor="rgba(100, 116, 139, 0.6)"
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity
                  onPress={handleSearch}
                  style={styles.searchButton}
                >
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#7f13ec" />
            </View>
          ) : !hasSearched ? (
            <View style={styles.historyContainer}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {Array.isArray(history) && history.length > 0 ? (
                history.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.historyItem}
                    onPress={() => handleHistoryPress(item)}
                  >
                    <Ionicons name="time-outline" size={18} color="#64748b" />
                    <Text style={styles.historyText}>{item.query}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No recent searches yet.</Text>
              )}
            </View>
          ) : results.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text style={styles.noResultsText}>No results found</Text>
            </View>
          ) : (
            <View style={styles.resultsContainer}>
              {results.map((item, index) => (
                <TouchableOpacity
                  key={`${item.id || index}`}
                  style={styles.resultItem}
                  onPress={() => handleResultPress(item)}
                >
                  <View style={styles.resultIcon}>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color="#7f13ec"
                    />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle}>
                      {item.title || 'Untitled'}
                    </Text>
                    {item.snippet ? (
                      <Text style={styles.resultSnippet} numberOfLines={2}>
                        {item.snippet}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* New Form Design */}
          <CreateSessionForm onSuccess={() => router.replace('/sessions')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f6f8', // surface base
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroText: {
    fontSize: 28, // Headline scale
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 24,
  },
  heroAccent: {
    color: '#7f13ec', // Primary violet
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lexend',
    color: '#0f172a',
  },
  searchButton: {
    backgroundColor: '#7f13ec',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 10,
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  historyContainer: {
    marginBottom: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyText: {
    marginLeft: 10,
    color: '#0f172a',
    fontSize: 14,
  },
  noResultsContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noResultsText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 15,
  },
  resultsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(127, 19, 236, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  resultSnippet: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
