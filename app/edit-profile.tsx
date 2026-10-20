// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   Image,
//   Alert,
//   ActivityIndicator,
//   Platform,
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import { useRouter } from 'expo-router';
// import api from '../src/api/axiosConfig';
// const EditProfileScreen = () => {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   const [fullName, setFullName] = useState('');
//   const [email, setEmail] = useState('');
//   const [bio, setBio] = useState('');
//   const [learningGoal, setLearningGoal] = useState('');
//   const [studyLevel, setStudyLevel] = useState('');
//   const [image, setImage] = useState<string | null>(null);

//   // --- 2. Load Existing Data ---
//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const fetchProfile = async () => {
//     try {
//       const response = await api.get('/profile/me');
//       const data = response.data;

//       setFullName(data.full_name || '');
//       setBio(data.bio || '');
//       setLearningGoal(data.learning_goal || '');
//       setStudyLevel(data.study_level || '');
//       setImage(data.avatar_url || null);
//     } catch (error) {
//       console.error('Error fetching profile:', error);
//     }
//   };

//   const pickImage = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission Denied', 'We need access to your photos to change your profile picture.');
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ['images'],
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 0.7,
//     });

//     if (!result.canceled) {
//       setImage(result.assets[0].uri);
//     }
//   };

//   const handleUpdate = async () => {
//     if (loading) return;
//     setLoading(true);

//     try {

//       const profileFormData = new FormData();
//       profileFormData.append('full_name', fullName);
//       profileFormData.append('bio', bio);
//       profileFormData.append('learning_goal', learningGoal);
//       profileFormData.append('study_level', studyLevel);

//       if (image && !image.startsWith('http')) {
//         const filename = image.split('/').pop() || 'avatar.jpg';
//         const match = /\.(\w+)$/.exec(filename);
//         const type = match ? `image/${match[1]}` : `image/jpeg`;

//         // @ts-expect-error - FormData append typing issue with file objects
//         profileFormData.append('avatar', {
//           uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
//           name: filename,
//           type: type,
//         });
//       }

//       await api.post('/profile/update', profileFormData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       if (email && email.trim() !== "") {
//         await api.post('/auth/update-account', {
//           email: email.toLowerCase().trim(),
//         });

//         Alert.alert(
//           "Email Update Started",
//           "Profile saved! Check your NEW email inbox for a confirmation link to finish changing your login email."
//         );
//       } else {
//         Alert.alert("Success", "Profile updated successfully!");
//       }

//       router.replace('/sessions');

//     } catch (error: unknown) {
//       const errorData = error && typeof error === 'object' && 'response' in error ? (error as { response?: { data?: { message?: string } } }).response?.data : null;
//       const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as { message?: string }).message : 'Unknown error';

//       // Check for 401 Unauthorized - token expired/invalid
//       const isUnauthorized = error && typeof error === 'object' && 'response' in error && (error as { response?: { status?: number } }).response?.status === 401;

//       if (isUnauthorized) {
//         Alert.alert(
//           'Session Expired',
//           'Your session has expired. Please log in again.',
//           [
//             {
//               text: 'OK',
//               onPress: async () => {
//                 const { removeToken } = await import('../src/utils/storage');
//                 await removeToken();
//                 router.replace('/login');
//               }
//             }
//           ]
//         );
//         return;
//       }

//       console.error("Update Error:", errorData || errorMessage);
//       Alert.alert("Update Failed", errorData?.message || "Check your internet connection.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Edit Profile</Text>
//       </View>

//       <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
//         {image ? (
//           <Image source={{ uri: image }} style={styles.avatarImage} />
//         ) : (
//           <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
//             <Text style={{ color: '#999' }}>No Photo</Text>
//           </View>
//         )}
//         <Text style={styles.changePhotoText}>Change Profile Picture</Text>
//       </TouchableOpacity>

//       <View style={styles.form}>
//         <Text style={styles.label}>Full Name</Text>
//         <TextInput
//           value={fullName}
//           onChangeText={setFullName}
//           style={styles.input}
//           placeholder="e.g. Cornelius"
//         />

//         <Text style={styles.label}>Update Email (Optional)</Text>
//         <TextInput
//           value={email}
//           onChangeText={setEmail}
//           style={styles.input}
//           placeholder="New email address"
//           autoCapitalize="none"
//           keyboardType="email-address"
//         />

//         <Text style={styles.label}>Bio</Text>
//         <TextInput
//           value={bio}
//           onChangeText={setBio}
//           style={[styles.input, styles.bioInput]}
//           multiline
//           placeholder="What are you studying lately?"
//         />

//         <Text style={styles.label}>Learning Goal</Text>
//         <TextInput
//           value={learningGoal}
//           onChangeText={setLearningGoal}
//           style={styles.input}
//           placeholder="e.g. Master NestJS"
//         />

//         <Text style={styles.label}>Study Level</Text>
//         <TextInput
//           value={studyLevel}
//           onChangeText={setStudyLevel}
//           style={styles.input}
//           placeholder="e.g. Senior Student"
//         />

//         <TouchableOpacity
//           style={[styles.button, loading && styles.buttonDisabled]}
//           onPress={handleUpdate}
//           disabled={loading}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={styles.buttonText}>Save Changes</Text>
//           )}
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#ffffff' },
//   scrollContent: { paddingBottom: 60 },
//   header: { marginTop: 50, alignItems: 'center', marginBottom: 10 },
//   headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
//   avatarContainer: { alignItems: 'center', marginVertical: 20 },
//   avatarImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f0f0f0' },
//   avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderStyle: 'dashed' },
//   changePhotoText: { color: '#007AFF', marginTop: 12, fontWeight: '600', fontSize: 15 },
//   form: { paddingHorizontal: 25 },
//   label: { fontSize: 14, color: '#777', marginTop: 15, marginBottom: 5, fontWeight: '500' },
//   input: { borderBottomWidth: 1.5, borderBottomColor: '#f0f0f0', paddingVertical: 10, fontSize: 16, color: '#333' },
//   bioInput: { height: 70, textAlignVertical: 'top' },
//   button: { backgroundColor: '#007AFF', padding: 18, borderRadius: 15, marginTop: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
//   buttonDisabled: { backgroundColor: '#b3d7ff' },
//   buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
// });

// export default EditProfileScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api/axiosConfig';
import { getStoredUser, setStoredUser } from '../src/utils/storage';

const PRIMARY = '#7f13ec';
const PRIMARY_DARK = '#5b0fb0';

const EditProfileScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [image, setImage] = useState<string | null>(null);

  // --- Load Existing Data ---
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      const data = response.data;

      setFullName(data.full_name || '');
      setBio(data.bio || '');
      setLearningGoal(data.learning_goal || '');
      setStudyLevel(data.study_level || '');
      setImage(data.avatar_url || null);
    } catch (error: any) {
      console.error('Error fetching profile:', error?.message || error);
    }
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
      setImage(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const profileFormData = new FormData();
      profileFormData.append('full_name', fullName);
      profileFormData.append('bio', bio);
      profileFormData.append('learning_goal', learningGoal);
      profileFormData.append('study_level', studyLevel);

      if (image && !image.startsWith('http')) {
        const filename = image.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // @ts-expect-error - FormData append typing issue in React Native
        profileFormData.append('avatar', {
          uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
          name: filename,
          type: type,
        });
      }

      // 1. Update Profile Info and Avatar
      await api.post('/profile/update', profileFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const currentUser = await getStoredUser();
      await setStoredUser({
        id: currentUser?.id,
        name: fullName.trim(),
        full_name: fullName.trim(),
        email: email.trim() || currentUser?.email,
        avatar_url: image || currentUser?.avatar_url || null,
      });

      // 2. Update Email if provided
      if (email && email.trim() !== '') {
        await api.post('/auth/update-account', {
          email: email.toLowerCase().trim(),
        });

        Alert.alert(
          'Email Update Started',
          'Profile saved! Check your NEW email inbox for a confirmation link to finish changing your login email.',
        );
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
      }

      router.replace('/sessions');
    } catch (error: any) {
      const errorData = error?.response?.data;
      const errorMessage = error?.message || 'Unknown error';

      console.error(
        'Update Error Details:',
        JSON.stringify(errorData || errorMessage),
      );

      // Handle 401 Unauthorized
      if (error?.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                const { removeToken } = await import('../src/utils/storage');
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
        errorData?.message ||
          'Check your internet connection or if you are logged in correctly.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#f6efff', '#f8fafc', '#ffffff']}
          style={styles.hero}
        >
          <Text style={styles.kicker}>PROFILE</Text>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>
            Keep your study identity polished and up to date.
          </Text>
        </LinearGradient>

        <View style={styles.avatarCard}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            <View style={styles.avatarRing}>
              {image ? (
                <Image source={{ uri: image }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarFallback}>No Photo</Text>
                </View>
              )}
            </View>
            <Text style={styles.changePhotoText}>Change profile picture</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Identity</Text>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              placeholder="e.g. Cornelius"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Update Email (Optional)</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="New email address"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>About You</Text>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              style={[styles.input, styles.bioInput]}
              multiline
              placeholder="What are you studying lately?"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Study Profile</Text>
            <Text style={styles.label}>Learning Goal</Text>
            <TextInput
              value={learningGoal}
              onChangeText={setLearningGoal}
              style={styles.input}
              placeholder="e.g. Master NestJS"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Study Level</Text>
            <TextInput
              value={studyLevel}
              onChangeText={setStudyLevel}
              style={styles.input}
              placeholder="e.g. Senior Student"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.buttonShadow,
              loading ? styles.buttonDisabledShadow : null,
            ]}
            onPress={handleUpdate}
            disabled={loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={
                loading ? ['#c4b5fd', '#a78bfa'] : [PRIMARY, PRIMARY_DARK]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <View style={styles.buttonDot} />
                  <Text style={styles.buttonText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6f8' },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  hero: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
    marginTop: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
    color: PRIMARY,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'Lexend',
  },
  headerSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
    fontFamily: 'Lexend',
  },
  avatarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingVertical: 24,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  avatarContainer: { alignItems: 'center' },
  avatarRing: {
    width: 138,
    height: 138,
    borderRadius: 69,
    padding: 5,
    backgroundColor: '#ede9fe',
  },
  avatarImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#f1f5f9',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d8b4fe',
    borderStyle: 'dashed',
  },
  avatarFallback: {
    color: '#7c3aed',
    fontWeight: '700',
    fontFamily: 'Lexend',
  },
  changePhotoText: {
    color: PRIMARY,
    marginTop: 14,
    fontWeight: '800',
    fontSize: 15,
    fontFamily: 'Lexend',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  sectionBlock: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: PRIMARY,
    marginBottom: 14,
    fontFamily: 'Lexend',
  },
  label: {
    fontSize: 13,
    color: '#334155',
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '700',
    fontFamily: 'Lexend',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: 'Lexend',
    marginBottom: 6,
  },
  bioInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  buttonShadow: {
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 20,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  buttonDisabledShadow: {
    shadowOpacity: 0.12,
  },
  button: {
    width: '100%',
    minHeight: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontFamily: 'Lexend',
  },
});

export default EditProfileScreen;
