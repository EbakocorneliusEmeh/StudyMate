import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getStats } from '../../src/api/progress';
import { ProgressStats } from '../../src/types';
import { removeToken } from '../../src/utils/storage';

interface User {
  name?: string;
  full_name?: string;
  fullName?: string;
  email?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  const getDisplayName = (value: User | null) => {
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

    return 'User';
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        router.push('/login');
      }
      const statsData = await getStats().catch(() => null);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await removeToken();
          await AsyncStorage.removeItem('user');
          router.replace('/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7f13ec" />
      </View>
    );
  }

  const menuItems: Array<{
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    route?: string;
    action?: () => void;
  }> = [
    { icon: 'person-outline', label: 'Edit Profile', route: '/edit-profile' },
    { icon: 'settings-outline', label: 'Settings', action: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', action: () => {} },
    { icon: 'information-circle-outline', label: 'About', action: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#7f13ec" />
        </View>
        <Text style={styles.userName}>{getDisplayName(user)}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.totalCards || 0}</Text>
          <Text style={styles.statLabel}>Cards</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.totalNotes || 0}</Text>
          <Text style={styles.statLabel}>Notes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => {
              if (item.route === '/edit-profile') {
                router.push('/edit-profile');
              } else if (item.action) {
                item.action();
              }
            }}
          >
            <Ionicons name={item.icon} size={24} color="#6b7280" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 24,
    marginHorizontal: 20,
    borderRadius: 16,
    marginTop: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7f13ec',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  menu: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 40,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
});
