import { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/context';

/**
 * Splash screen component that displays during app initialization
 * Validates authentication session and navigates accordingly
 */
export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading } = useSession();

  useEffect(() => {
    // Wait for auth state to be determined
    if (!isLoading) {
      // Navigate based on authentication status
      if (user) {
        // Valid session exists - go to main app (ScavengerHunt screen)
        router.replace('/(app)/(drawer)/(tabs)');
      } else {
        // No valid session - go to sign-in
        router.replace('/sign-in');
      }
    }
  }, [isLoading, user]);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/splash.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator 
        size="large" 
        color="#2563eb" 
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
