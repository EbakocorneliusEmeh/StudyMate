// import React from 'react';
// import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import logoImg from '../assets/images/logo.png';
// import studyIllustration from '../assets/images/study-illustration.png';

// export default function HomeScreen() {
//   const router = useRouter();

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.content}>
//         \{' '}
//         <View style={styles.header}>
//           <View style={styles.logoContainer}>
//             \ <Image source={logoImg} style={styles.logo} />
//           </View>
//           <Text style={styles.title}>StudyMate</Text>
//           <Text style={styles.subtitle}>Smarter studying powered by AI</Text>
//         </View>
//         \{' '}
//         <View style={styles.illustrationContainer}>
//           \{' '}
//           <Image
//             source={studyIllustration}
//             style={styles.illustration}
//             resizeMode="cover"
//           />
//         </View>
//         <View style={styles.footer}>
//           <TouchableOpacity
//             activeOpacity={0.8}
//             onPress={() => router.push('/register')}
//             style={styles.buttonWrapper}
//           >
//             <LinearGradient
//               colors={['#7f13ec', '#6366f1']}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={styles.primaryButton}
//             >
//               <Text style={styles.primaryButtonText}>Get Started</Text>
//             </LinearGradient>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={() => router.push('/login')}
//             style={styles.secondaryButton}
//           >
//             <Text style={styles.secondaryButtonText}>
//               I already have an account
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   content: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 30,
//     paddingVertical: 40,
//   },
//   header: {
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   logoContainer: {
//     width: 80,
//     height: 80,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     shadowColor: '#7f13ec',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.1,
//     shadowRadius: 20,
//     elevation: 5,
//   },
//   logo: {
//     width: 45,
//     height: 45,
//     tintColor: '#7f13ec',
//   },
//   title: {
//     fontSize: 34,
//     fontWeight: '700',
//     color: '#1e293b',
//     letterSpacing: -0.5,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#64748b',
//     textAlign: 'center',
//     marginTop: 8,
//     fontWeight: '400',
//   },
//   illustrationContainer: {
//     width: '100%',
//     height: 300,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   illustration: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 32,
//   },
//   footer: {
//     width: '100%',
//     gap: 12,
//   },
//   buttonWrapper: {
//     width: '100%',
//     borderRadius: 16,
//     overflow: 'hidden',
//   },
//   primaryButton: {
//     paddingVertical: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   primaryButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   secondaryButton: {
//     paddingVertical: 15,
//     alignItems: 'center',
//   },
//   secondaryButtonText: {
//     color: '#64748b',
//     fontSize: 15,
//     fontWeight: '500',
//   },
// });

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import logoImg from '../assets/images/logo.png';
import studyIllustration from '../assets/images/study-illustration.png';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={logoImg} style={styles.logo} />
          </View>
          <Text style={styles.title}>StudyMate</Text>
          <Text style={styles.subtitle}>Smarter studying powered by AI</Text>
        </View>

        <View style={styles.illustrationContainer}>
          <Image
            source={studyIllustration}
            style={styles.illustration}
            resizeMode="cover"
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/register')}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#7f13ec', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#7f13ec',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  logo: {
    width: 45,
    height: 45,
    tintColor: '#7f13ec',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '400',
  },
  illustrationContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  footer: {
    width: '100%',
    gap: 12,
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '500',
  },
});
