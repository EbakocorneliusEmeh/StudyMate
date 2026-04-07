import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SessionCard } from '../components/SessionCard';
import { deleteSession, getSessions } from '../src/api/sessions';

interface User {
  name?: string;
  full_name?: string;
  fullName?: string;
  email?: string;
}

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
  const [user, setUser] = useState<User | null>(null);

  const getDisplayName = useCallback((value: User | null) => {
    const explicitName =
      value?.name?.trim() ||
      value?.full_name?.trim() ||
      value?.fullName?.trim();

    if (explicitName) {
      return explicitName;
    }

    const emailName = value?.email?.split('@')[0]?.trim();
    if (emailName) {
      return emailName;
    }

    return 'Profile';
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
        return;
      }

      setUser(null);
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useFocusEffect(
    useCallback(() => {
      void loadUser();
    }, [loadUser]),
  );

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
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete session';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* PIXEL-PERFECT HEADER */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            onPress={() => router.push('/edit-profile')}
            style={styles.avatarContainer}
          >
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#7f13ec" />
            </View>
          </TouchableOpacity>
          <View>
            <Text style={styles.userNameText}>
              Welcome, {getDisplayName(user)}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={22} color="#475569" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7f13ec"
          />
        }
      >
        {/* PROGRESS GRID - LAYERED ELEVATION */}
        <View style={styles.progressGrid}>
          <View style={[styles.progressCard, styles.activeCard]}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="stats-chart"
                size={18}
                color="rgba(255,255,255,0.7)"
              />
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>ACTIVE</Text>
              </View>
            </View>
            <View>
              <Text style={styles.cardLabelLight}>Total Sessions</Text>
              <Text style={styles.cardValueLight}>
                {sessions.length}{' '}
                <Text style={styles.cardSubValueLight}>Sessions</Text>
              </Text>
            </View>
          </View>

          <View style={[styles.progressCard, styles.whiteCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="time" size={20} color="#7f13ec" />
              <View style={styles.growthBadge}>
                <Text style={styles.growthText}>+12%</Text>
              </View>
            </View>
            <View>
              <Text style={styles.cardLabelDark}>Study Time</Text>
              <Text style={styles.cardValueDark}>
                120 <Text style={styles.cardSubValueDark}>min</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* STUDY MODES */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Study Modes</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI ENHANCED</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          <TouchableOpacity
            style={styles.modeChip}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/flashcards')}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: 'rgba(127, 19, 236, 0.1)' },
              ]}
            >
              <Ionicons name="layers-outline" size={24} color="#7f13ec" />
            </View>
            <Text style={styles.modeLabel}>Flashcards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeChip}
            activeOpacity={0.9}
            onPress={() => router.push('/quiz/generate')}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: 'rgba(2, 132, 199, 0.1)' },
              ]}
            >
              <Ionicons name="school" size={26} color="#0284c7" />
            </View>
            <Text style={styles.modeLabel}>Quiz Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeChip}
            activeOpacity={0.9}
            onPress={() => router.push('/ai-companion')}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: 'rgba(5, 150, 105, 0.1)' },
              ]}
            >
              <Ionicons name="hardware-chip" size={24} color="#059669" />
            </View>
            <Text style={styles.modeLabel}>AI Companion</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* LIST OF SESSIONS */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionHeaderTitle}>List Of Sessions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sessionList}>
          {sessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="book-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No study sessions yet.</Text>
            </View>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={handleDelete}
                onPress={() => router.push(`/session/${session.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-session')}
        activeOpacity={0.95}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* NAVIGATION BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.activeNavIcon}>
            <Ionicons name="home" size={20} color="white" />
          </View>
          <Text style={styles.activeNavLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="layers-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Flashcards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="clipboard-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/edit-profile')}
        >
          <Ionicons name="person-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6f8' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 10,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(127,19,236,0.2)',
    padding: 2,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(127,19,236,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 13,
    right: 14,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#7f13ec',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  progressGrid: { flexDirection: 'row', gap: 16, marginTop: 24 },
  progressCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    height: 140,
    justifyContent: 'space-between',
  },
  activeCard: {
    backgroundColor: '#7f13ec',
    elevation: 10,
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  whiteCard: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  growthBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthText: { color: '#22c55e', fontSize: 10, fontWeight: '800' },
  cardLabelLight: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  cardLabelDark: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  cardValueLight: { color: 'white', fontSize: 26, fontWeight: '700' },
  cardSubValueLight: { fontSize: 14, fontWeight: '500' },
  cardValueDark: { color: '#0f172a', fontSize: 32, fontWeight: '700' },
  cardSubValueDark: { fontSize: 14, fontWeight: '400', color: '#94a3b8' },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  aiBadge: {
    backgroundColor: 'rgba(127,19,236,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aiBadgeText: { color: '#7f13ec', fontSize: 10, fontWeight: '800' },
  horizontalScroll: {
    gap: 16,
    paddingRight: 5,
    paddingBottom: 8,
    paddingLeft: 1.5,
  },
  modeChip: {
    width: 120,
    height: 120,
    backgroundColor: 'white',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modeLabel: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  viewAllText: { fontSize: 12, fontWeight: '700', color: '#7f13ec' },
  sessionList: { gap: 16 },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  emptyText: { marginTop: 12, color: '#94a3b8', fontWeight: '500' },
  fab: {
    position: 'absolute',
    bottom: 115,
    right: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#7f13ec',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    borderWidth: 4,
    borderColor: 'white',
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 95,
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 25,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  navItem: { alignItems: 'center', gap: 4 },
  activeNavIcon: { backgroundColor: '#7f13ec', padding: 8, borderRadius: 12 },
  activeNavLabel: { color: '#7f13ec', fontSize: 10, fontWeight: '800' },
  navLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
});
