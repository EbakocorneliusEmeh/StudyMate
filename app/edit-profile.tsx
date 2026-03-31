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
import { useRouter } from 'expo-router';
import { api } from '../src/api/axiosConfig';

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
            <Text style={{ color: '#999' }}>No Photo</Text>
          </View>
        )}
        <Text style={styles.changePhotoText}>Change Profile Picture</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
          placeholder="e.g. Cornelius"
        />

        <Text style={styles.label}>Update Email (Optional)</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="New email address"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          style={[styles.input, styles.bioInput]}
          multiline
          placeholder="What are you studying lately?"
        />

        <Text style={styles.label}>Learning Goal</Text>
        <TextInput
          value={learningGoal}
          onChangeText={setLearningGoal}
          style={styles.input}
          placeholder="e.g. Master NestJS"
        />

        <Text style={styles.label}>Study Level</Text>
        <TextInput
          value={studyLevel}
          onChangeText={setStudyLevel}
          style={styles.input}
          placeholder="e.g. Senior Student"
        />

        <TouchableOpacity
          style={[
            styles.button,
            loading ? styles.buttonDisabled : null, // Safer conditional styling
          ]}
          onPress={handleUpdate}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { paddingBottom: 60 },
  header: { marginTop: 50, alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  avatarContainer: { alignItems: 'center', marginVertical: 20 },
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
  form: { paddingHorizontal: 25 },
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
  bioInput: { height: 70, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 15,
    marginTop: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: { backgroundColor: '#b3d7ff' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default EditProfileScreen;
