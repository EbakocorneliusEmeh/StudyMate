import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/axiosConfig';
import {
  clearStoredUser,
  getStoredUser,
  removeToken,
} from '../../src/utils/storage';
import { getStats } from '../../src/api/progress';

interface User {
  name: string;
  email: string;
  avatar_url?: string | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const loadUserData = React.useCallback(async () => {
    try {
      setLoading(true);
      const storedUser = await getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      } else {
        router.push('/login');
      }
      try {
        const profileResponse = await api.get('/profile/me');
        const profileData = profileResponse.data || {};
        setUser((current) =>
          current
            ? {
                ...current,
                avatar_url:
                  profileData.avatar_url || current.avatar_url || null,
              }
            : current,
        );
      } catch (_error) {
        // Keep the stored user if profile fetch fails.
      }
      const statsData = await getStats().catch(() => null);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    React.useCallback(() => {
      void loadUserData();
    }, [loadUserData]),
  );

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await removeToken();
          await clearStoredUser();
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

  const menuItems = [
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
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => {
            if (user?.avatar_url) {
              setShowAvatarModal(true);
            }
          }}
          activeOpacity={0.85}
        >
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={40} color="#7f13ec" />
          )}
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
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
              if (item.route) {
                router.push(item.route as any);
              } else if (item.action) {
                item.action();
              }
            }}
          >
            <Ionicons name={item.icon as any} size={24} color="#6b7280" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Modal
        visible={showAvatarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.avatarModalOverlay}>
          <TouchableOpacity
            style={styles.avatarModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowAvatarModal(false)}
          />
          <View style={styles.avatarModalContent}>
            <TouchableOpacity
              style={styles.avatarModalClose}
              onPress={() => setShowAvatarModal(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            {user?.avatar_url && (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarModalImage}
              />
            )}
          </View>
        </View>
      </Modal>
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
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarModalContent: {
    width: '86%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  avatarModalClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarModalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: '#111827',
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
