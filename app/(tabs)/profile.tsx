import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import { api } from '../../src/api/axiosConfig';
import { getStats } from '../../src/api/progress';
import { ProgressStats } from '../../src/types';
import {
  clearStoredUser,
  getStoredUser,
  removeToken,
  setStoredUser,
} from '../../src/utils/storage';

interface User {
  name: string;
  email: string;
  avatar_url?: string | null;
  full_name?: string | null;
  bio?: string | null;
  learning_goal?: string | null;
  study_level?: string | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    bio: '',
    learningGoal: '',
    studyLevel: '',
    image: null as string | null,
  });

  const loadUserData = React.useCallback(async () => {
    try {
      setLoading(true);
      const storedUser = await getStoredUser();
      if (storedUser) {
        setUser({
          name: storedUser.name || '',
          email: storedUser.email || '',
          avatar_url: storedUser.avatar_url || null,
          full_name: storedUser.full_name || null,
        });
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
                name:
                  profileData.full_name?.trim() ||
                  profileData.name?.trim() ||
                  current.name,
                full_name:
                  profileData.full_name?.trim() ||
                  current.full_name ||
                  current.name,
                avatar_url:
                  profileData.avatar_url || current.avatar_url || null,
                bio: profileData.bio || null,
                learning_goal: profileData.learning_goal || null,
                study_level: profileData.study_level || null,
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

  const _startEditing = () => {
    setEditForm({
      fullName: user?.full_name?.trim() || user?.name?.trim() || '',
      email: user?.email || '',
      bio: user?.bio || '',
      learningGoal: user?.learning_goal || '',
      studyLevel: user?.study_level || '',
      image: user?.avatar_url || null,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({
      fullName: '',
      email: '',
      bio: '',
      learningGoal: '',
      studyLevel: '',
      image: null,
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'We need access to your photos to change your profile picture.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setEditForm((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (editLoading) return;
    setEditLoading(true);

    try {
      const profileFormData = new FormData();
      profileFormData.append('full_name', editForm.fullName);
      profileFormData.append('bio', editForm.bio);
      profileFormData.append('learning_goal', editForm.learningGoal);
      profileFormData.append('study_level', editForm.studyLevel);

      if (editForm.image && !editForm.image.startsWith('http')) {
        const filename = editForm.image.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // @ts-expect-error - FormData append typing issue in React Native
        profileFormData.append('avatar', {
          uri:
            Platform.OS === 'android'
              ? editForm.image
              : editForm.image.replace('file://', ''),
          name: filename,
          type: type,
        });
      }

      await api.post('/profile/update', profileFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const currentUser = await getStoredUser();
      await setStoredUser({
        id: currentUser?.id,
        name: editForm.fullName.trim(),
        full_name: editForm.fullName.trim(),
        email: editForm.email.trim() || currentUser?.email,
        avatar_url: editForm.image || currentUser?.avatar_url || null,
      });

      if (editForm.email && editForm.email.trim() !== '') {
        await api.post('/auth/update-account', {
          email: editForm.email.toLowerCase().trim(),
        });

        Alert.alert(
          'Email Update Started',
          'Profile saved! Check your NEW email inbox for a confirmation link to finish changing your login email.',
        );
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
      }

      setUser((current) =>
        current
          ? {
              ...current,
              full_name: editForm.fullName.trim(),
              name: editForm.fullName.trim(),
              avatar_url: editForm.image,
              bio: editForm.bio,
              learning_goal: editForm.learningGoal,
              study_level: editForm.studyLevel,
            }
          : current,
      );

      setIsEditing(false);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: unknown; status?: number };
        message?: string;
      };
      const errorData = axiosError.response?.data;
      const errorMessage = axiosError.message || 'Unknown error';

      console.error('Update Error:', errorData || errorMessage);

      if (axiosError.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await removeToken();
                router.replace('/login');
              },
            },
          ],
        );
        return;
      }

      Alert.alert(
        'Update Failed',
        errorData?.message || 'Check your internet connection.',
      );
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7f13ec" />
      </View>
    );
  }

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
        <Text style={styles.userName}>
          {user?.full_name?.trim() || user?.name?.trim() || 'User'}
        </Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
      </View>

      <View style={styles.editProfileCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/edit-profile')}
        >
          <Ionicons name="person-outline" size={24} color="#6b7280" />
          <Text style={styles.menuLabel}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
        </TouchableOpacity>
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

      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={cancelEditing}
      >
        <View style={editModalStyles.overlay}>
          <TouchableOpacity
            style={editModalStyles.backdrop}
            activeOpacity={1}
            onPress={cancelEditing}
          />
          <View style={editModalStyles.container}>
            <View style={editModalStyles.header}>
              <TouchableOpacity
                onPress={cancelEditing}
                style={editModalStyles.headerButton}
              >
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
              <Text style={editModalStyles.headerTitle}>Edit Profile</Text>
              <View style={editModalStyles.headerButton} />
            </View>

            <ScrollView
              style={editModalStyles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                onPress={pickImage}
                style={editModalStyles.avatarContainer}
              >
                {editForm.image && editForm.image.length > 0 ? (
                  <Image
                    source={{ uri: editForm.image }}
                    style={editModalStyles.avatarImage}
                  />
                ) : (
                  <View
                    style={[
                      editModalStyles.avatarImage,
                      editModalStyles.avatarPlaceholder,
                    ]}
                  >
                    <Ionicons name="person" size={40} color="#999" />
                  </View>
                )}
                <Text style={editModalStyles.changePhotoText}>
                  Change Profile Picture
                </Text>
              </TouchableOpacity>

              <View style={editModalStyles.form}>
                <Text style={editModalStyles.label}>Full Name</Text>
                <TextInput
                  value={editForm.fullName}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, fullName: text }))
                  }
                  style={editModalStyles.input}
                  placeholder="e.g. Cornelius"
                />

                <Text style={editModalStyles.label}>
                  Update Email (Optional)
                </Text>
                <TextInput
                  value={editForm.email}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, email: text }))
                  }
                  style={editModalStyles.input}
                  placeholder="New email address"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={editModalStyles.label}>Bio</Text>
                <TextInput
                  value={editForm.bio}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, bio: text }))
                  }
                  style={[editModalStyles.input, editModalStyles.bioInput]}
                  multiline
                  placeholder="What are you studying lately?"
                />

                <Text style={editModalStyles.label}>Learning Goal</Text>
                <TextInput
                  value={editForm.learningGoal}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, learningGoal: text }))
                  }
                  style={editModalStyles.input}
                  placeholder="e.g. Master NestJS"
                />

                <Text style={editModalStyles.label}>Study Level</Text>
                <TextInput
                  value={editForm.studyLevel}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, studyLevel: text }))
                  }
                  style={editModalStyles.input}
                  placeholder="e.g. Senior Student"
                />

                <View style={editModalStyles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      editModalStyles.button,
                      editModalStyles.cancelButton,
                    ]}
                    onPress={cancelEditing}
                  >
                    <Text style={editModalStyles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      editModalStyles.button,
                      editModalStyles.saveButton,
                      editLoading && editModalStyles.buttonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={editLoading}
                    activeOpacity={0.7}
                  >
                    {editLoading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={editModalStyles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  editProfileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 8,
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

const editModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  changePhotoText: {
    color: '#007AFF',
    marginTop: 12,
    fontWeight: '600',
    fontSize: 15,
  },
  form: {
    paddingHorizontal: 25,
  },
  label: {
    fontSize: 14,
    color: '#777',
    marginTop: 15,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  bioInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 40,
  },
  button: {
    flex: 1,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#b3d7ff',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
