import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CreateSessionForm } from '../components/CreateSessionForm';
import { SessionCard } from '../components/SessionCard';
import { deleteSession, getSessions } from '../src/api/sessions';

interface Session {
  id: string;
  title: string;
  subject: string | null;
  created_at: string;
  user_id: string;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch sessions';
      Alert.alert('Error', errorMessage);
    }
  }, []);

  // Initial fetch
  React.useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  }, [fetchSessions]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      Alert.alert('Success', 'Session deleted successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete session';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleSessionPress = (id: string) => {
    router.push(`/session/${id}`);
  };

  const handleSessionCreated = () => {
    fetchSessions();
    setShowCreateForm(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7f13ec']}
            tintColor="#7f13ec"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Study Sessions</Text>
              <Text style={styles.headerSubtitle}>
                Create and manage your study sessions
              </Text>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setShowUploader(true)}
            >
              <LinearGradient
                colors={['#7f13ec', '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.uploadButtonGradient}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="white" />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Session Form */}
        {showCreateForm && (
          <CreateSessionForm onSuccess={handleSessionCreated} />
        )}

        {/* Sessions List */}
        <View style={styles.sessionsContainer}>
          <Text style={styles.sectionTitle}>
            {sessions.length > 0 ? 'Your Sessions' : 'No sessions yet'}
          </Text>

          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                No study sessions yet.{'\n'}Create one to get started!
              </Text>
            </View>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={handleDelete}
                onPress={handleSessionPress}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Tab Indicator */}
      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.activeIconContainer}>
            <Ionicons name="home" size={22} color="white" />
          </View>
          <Text style={styles.activeNavText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="layers-outline" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Flashcards</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="help-circle-outline" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateForm(!showCreateForm)}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* File Uploader Modal */}
      <FileUploader
        visible={showUploader}
        onClose={() => setShowUploader(false)}
        sessions={sessions}
        onUploadComplete={(file, sessionId) => {
          console.log(
            'File uploaded:',
            file.file_name,
            'to session:',
            sessionId,
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f6f8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  sessionsContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeIconContainer: {
    backgroundColor: '#7f13ec',
    padding: 8,
    borderRadius: 12,
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  activeNavText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7f13ec',
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7f13ec',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
});
