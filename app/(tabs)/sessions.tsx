// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect, useRouter } from 'expo-router';
// import React, { useCallback, useState } from 'react';
// import {
//   Alert,
//   FlatList,
//   RefreshControl,
//   StyleSheet,
//   Text,
//   View,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { CreateSessionForm } from '../../components/CreateSessionForm';
// import { SessionCard } from '../../components/SessionCard';
// import { ApiError, deleteSession, getSessions } from '../../src/api/sessions';

// interface Session {
//   id: string;
//   user_id: string;
//   title: string;
//   subject: string | null;
//   created_at: string;
// }

// export default function SessionsScreen() {
//   const router = useRouter();
//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
//     null,
//   );

//   const fetchSessions = useCallback(async () => {
//     try {
//       const token = await AsyncStorage.getItem('authToken');
//       if (!token) {
//         router.push('/login');
//         return;
//       }

//       const data = await getSessions();
//       setSessions(data.sessions);
//     } catch (err) {
//       const errorMessage =
//         err instanceof ApiError ? err.message : 'Failed to load sessions';
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [router]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchSessions();
//     }, [fetchSessions]),
//   );

//   const handleRefresh = () => {
//     setIsRefreshing(true);
//     fetchSessions().then(() => setIsRefreshing(false));
//   };

//   const handleDeleteSession = async (id: string) => {
//     if (deletingSessionId) {
//       return;
//     }

//     setDeletingSessionId(id);
//     try {
//       await deleteSession(id);
//       setSessions((prev) => prev.filter((session) => session.id !== id));
//       Alert.alert('Success', 'Session deleted successfully');
//     } catch (error) {
//       const errorMessage =
//         error instanceof ApiError ? error.message : 'Failed to delete session';
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setDeletingSessionId(null);
//     }
//   };

//   const handleCreateSuccess = () => {
//     fetchSessions();
//   };

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyText}>No sessions yet</Text>
//       <Text style={styles.emptySubtext}>
//         Create your first study session to get started
//       </Text>
//     </View>
//   );

//   if (isLoading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <Text>Loading...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>My Study Sessions</Text>
//       </View>

//       <CreateSessionForm onSuccess={handleCreateSuccess} />

//       <FlatList
//         data={sessions}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <SessionCard
//             session={item}
//             onDelete={handleDeleteSession}
//             isDeleting={deletingSessionId === item.id}
//           />
//         )}
//         ListEmptyComponent={renderEmptyState}
//         contentContainerStyle={
//           sessions.length === 0 ? styles.emptyList : styles.list
//         }
//         refreshControl={
//           <RefreshControl
//             refreshing={isRefreshing}
//             onRefresh={handleRefresh}
//             colors={['#3b82f6']}
//           />
//         }
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f3f4f6',
//   },
//   header: {
//     padding: 16,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#1f2937',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   list: {
//     padding: 16,
//   },
//   emptyList: {
//     flex: 1,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 32,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#6b7280',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#9ca3af',
//     textAlign: 'center',
//   },
// });

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect, useRouter } from 'expo-router';
// import React, { useCallback, useState } from 'react';
// import {
//   Alert,
//   FlatList,
//   RefreshControl,
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { CreateSessionForm } from '../../components/CreateSessionForm';
// import { SessionCard } from '../../components/SessionCard';
// import { ApiError, deleteSession, getSessions } from '../../src/api/sessions';

// interface Session {
//   id: string;
//   user_id: string;
//   title: string;
//   subject: string | null;
//   created_at: string;
// }

// export default function SessionsScreen() {
//   const router = useRouter();
//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
//     null,
//   );

//   const fetchSessions = useCallback(async () => {
//     try {
//       const token = await AsyncStorage.getItem('authToken');
//       if (!token) {
//         router.push('/login');
//         return;
//       }
//       const data = await getSessions();
//       setSessions(data.sessions || []);
//     } catch (err) {
//       const errorMessage =
//         err instanceof ApiError ? err.message : 'Failed to load sessions';
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [router]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchSessions();
//     }, [fetchSessions]),
//   );

//   const handleRefresh = () => {
//     setIsRefreshing(true);
//     fetchSessions().then(() => setIsRefreshing(false));
//   };

//   const handleDeleteSession = async (id: string) => {
//     if (deletingSessionId) return;
//     setDeletingSessionId(id);
//     try {
//       await deleteSession(id);
//       setSessions((prev) => prev.filter((session) => session.id !== id));
//       Alert.alert('Success', 'Session deleted successfully');
//     } catch (error) {
//       const errorMessage =
//         error instanceof ApiError ? error.message : 'Failed to delete session';
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setDeletingSessionId(null);
//     }
//   };

//   const handleSessionPress = (id: string) => {
//     router.push(`/session/${id}`);
//   };

//   const handleCreateSuccess = () => {
//     fetchSessions();
//   };

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyText}>No sessions yet</Text>
//       <Text style={styles.emptySubtext}>
//         Create your first study session to get started
//       </Text>
//     </View>
//   );

//   if (isLoading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <Text>Loading Sessions...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       {/* HEADER SECTION */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>My Sessions</Text>

//         <TouchableOpacity
//           onPress={() => router.push('/edit-profile')}
//           style={styles.profileButton}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="person-circle-outline" size={32} color="#7f13ec" />
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={sessions}
//         keyExtractor={(item) => item.id}
//         // Putting the Form inside ListHeaderComponent keeps it scrollable with the list
//         ListHeaderComponent={<CreateSessionForm onSuccess={fetchSessions} />}
//         renderItem={({ item }) => (
//           <SessionCard
//             session={item}
//             onDelete={handleDeleteSession}
//             onPress={handleSessionPress}
//             isDeleting={deletingSessionId === item.id}
//           />
//         )}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Text style={styles.emptyText}>No sessions yet</Text>
//             <Text style={styles.emptySubtext}>
//               Create your first study session to get started
//             </Text>
//           </View>
//         }
//         contentContainerStyle={styles.list}
//         refreshControl={
//           <RefreshControl
//             refreshing={isRefreshing}
//             onRefresh={handleRefresh}
//             colors={['#7f13ec']}
//           />
//         }
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f3f4f6',
//   },
//   // header: {
//   //   width: '100%',
//   //   flexDirection: 'row',
//   //   justifyContent: 'space-between',
//   //   alignItems: 'center',
//   //   paddingHorizontal: 20,
//   //   paddingVertical: 15,
//   //   backgroundColor: '#ffffff',
//   //   borderBottomWidth: 1,
//   //   borderBottomColor: '#e5e7eb',
//   //   // Ensures header stays on top
//   //   zIndex: 10,
//   //   elevation: 3,
//   // },
//   header: {
//     width: '100%',
//     height: 70, // Force a height
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 2, // Make border thicker so you can see it
//     borderBottomColor: '#7f13ec', // Purple border to make it obvious
//     marginTop: 0, // Ensure it's not tucked under the status bar
//     zIndex: 999, // Force it to the front
//     elevation: 5, // Shadow for Android
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#1f2937',
//   },
//   profileButton: {
//     width: 45,
//     height: 45,
//     backgroundColor: '#f3e8ff', // Light purple background
//     borderRadius: 22.5,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   // profileButton: {
//   //   padding: 5,
//   //   backgroundColor: 'rgba(127, 19, 236, 0.1)',
//   //   borderRadius: 25,
//   // },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   list: {
//     padding: 16,
//     paddingBottom: 40,
//   },
//   emptyContainer: {
//     marginTop: 100,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 32,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#6b7280',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#9ca3af',
//     textAlign: 'center',
//   },
// });

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
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
      setSessions(data.sessions || []);
    } catch (err: unknown) {
      // FIXED: changed to unknown
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
    if (deletingSessionId) return;
    setDeletingSessionId(id);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((session) => session.id !== id));
      Alert.alert('Success', 'Session deleted successfully');
    } catch (error: unknown) {
      // FIXED: changed to unknown
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

  // FIXED: Renamed with underscore so ESLint ignores it if you want to keep it,
  // or just use fetchSessions directly in the component.
  const _handleCreateSuccess = () => {
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
          <ActivityIndicator size="small" color="#7f13ec" />
          <Text style={{ marginTop: 10 }}>Loading Sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Sessions</Text>

        <TouchableOpacity
          onPress={() => router.push('/edit-profile')}
          style={styles.profileButton}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle-outline" size={32} color="#7f13ec" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <CreateSessionForm onSuccess={_handleCreateSuccess} />
        }
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onDelete={handleDeleteSession}
            onPress={handleSessionPress}
            isDeleting={deletingSessionId === item.id}
          />
        )}
        ListEmptyComponent={renderEmptyState} // FIXED: Now using the function
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#7f13ec']}
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
    width: '100%',
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#7f13ec',
    zIndex: 999,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profileButton: {
    width: 45,
    height: 45,
    backgroundColor: '#f3e8ff',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    marginTop: 100,
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
