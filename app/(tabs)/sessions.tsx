import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateSessionForm } from '../../components/CreateSessionForm';
import { SessionCard } from '../../components/SessionCard';
import { ApiError, deleteSession, getSessions } from '../../src/api/sessions';

interface Session {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  created_at: string;
}

export default function SessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null,
  );

  const fetchSessions = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await getSessions();
      setSessions(data.sessions);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : 'Failed to load sessions';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [fetchSessions]),
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSessions().then(() => setIsRefreshing(false));
  };

  const handleDeleteSession = async (id: string) => {
    if (deletingSessionId) {
      return;
    }

    setDeletingSessionId(id);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((session) => session.id !== id));
      Alert.alert('Success', 'Session deleted successfully');
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : 'Failed to delete session';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleSessionPress = (id: string) => {
    router.push(`/session/${id}`);
  };

  const handleCreateSuccess = () => {
    fetchSessions();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No sessions yet</Text>
      <Text style={styles.emptySubtext}>
        Create your first study session to get started
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Study Sessions</Text>
      </View>

      <CreateSessionForm onSuccess={handleCreateSuccess} />

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onDelete={handleDeleteSession}
            onPress={handleSessionPress}
            isDeleting={deletingSessionId === item.id}
          />
        )}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          sessions.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
