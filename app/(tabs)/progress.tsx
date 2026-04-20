import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStats } from '../../src/api/progress';
import { ProgressStats, WeeklyProgress } from '../../src/types';

export default function ProgressScreen() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const statsData = await getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7f13ec" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#7f13ec']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Text style={styles.headerSubtitle}>Track your study journey</Text>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakMain}>
          <Ionicons name="flame" size={40} color="#f97316" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{stats?.currentStreak || 0}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakItem}>
          <Text style={styles.streakItemNumber}>
            {stats?.longestStreak || 0}
          </Text>
          <Text style={styles.streakItemLabel}>Best</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="book" size={24} color="#7f13ec" />
          <Text style={styles.statCardNumber}>{stats?.totalNotes || 0}</Text>
          <Text style={styles.statCardLabel}>Notes</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="layers" size={24} color="#3b82f6" />
          <Text style={styles.statCardNumber}>{stats?.totalCards || 0}</Text>
          <Text style={styles.statCardLabel}>Cards</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#22c55e" />
          <Text style={styles.statCardNumber}>
            {stats?.totalStudyTimeMinutes || 0}
          </Text>
          <Text style={styles.statCardLabel}>Minutes</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="folder" size={24} color="#f59e0b" />
          <Text style={styles.statCardNumber}>{stats?.totalFiles || 0}</Text>
          <Text style={styles.statCardLabel}>Files</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Stats</Text>
        <View style={styles.todayStats}>
          <View style={styles.todayStatItem}>
            <Text style={styles.todayStatNumber}>
              {stats?.cardsDueToday || 0}
            </Text>
            <Text style={styles.todayStatLabel}>Cards Due</Text>
          </View>
          <View style={styles.todayStatItem}>
            <Text style={styles.todayStatNumber}>
              {stats?.cardsReviewedThisWeek || 0}
            </Text>
            <Text style={styles.todayStatLabel}>Reviewed This Week</Text>
          </View>
          <View style={styles.todayStatItem}>
            <Text style={styles.todayStatNumber}>
              {stats?.averageSessionLength || 0}
            </Text>
            <Text style={styles.todayStatLabel}>Avg Session (min)</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
        {stats?.weeklyProgress && stats.weeklyProgress.length > 0 ? (
          <View style={styles.weeklyChart}>
            {stats.weeklyProgress
              .slice(-7)
              .map((day: WeeklyProgress, index: number) => {
                const maxMinutes = Math.max(
                  ...stats.weeklyProgress.map((d) => d.studyTimeMinutes),
                  1,
                );
                const height = (day.studyTimeMinutes / maxMinutes) * 100;
                return (
                  <View key={index} style={styles.chartBarContainer}>
                    <Text style={styles.chartValue}>
                      {day.studyTimeMinutes}
                    </Text>
                    <View
                      style={[styles.chartBar, { height: Math.max(height, 4) }]}
                    />
                    <Text style={styles.chartDate}>
                      {new Date(day.date).toLocaleDateString('en', {
                        weekday: 'short',
                      })}
                    </Text>
                  </View>
                );
              })}
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>
              No study data yet. Start studying!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  streakCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  streakMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakInfo: {
    marginLeft: 12,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  streakLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  streakDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakItemNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  streakItemLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  todayStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  todayStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  todayStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7f13ec',
  },
  todayStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  weeklyChart: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    height: 180,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartValue: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  chartBar: {
    width: 24,
    backgroundColor: '#7f13ec',
    borderRadius: 4,
    marginBottom: 8,
  },
  chartDate: {
    fontSize: 10,
    color: '#6b7280',
  },
  emptyChart: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
