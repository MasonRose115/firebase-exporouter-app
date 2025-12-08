/**
 * Quick Actions Hook
 * Handles app shortcuts and quick actions for iOS and Android
 * @module hooks/useQuickActions
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Platform, Alert } from 'react-native';

/**
 * Configure and handle quick actions (app shortcuts)
 * Supports:
 * - iOS Home Screen quick actions (3D Touch / long press)
 * - Android app shortcuts
 */
export function useQuickActions() {
  const router = useRouter();

  useEffect(() => {
    setupQuickActions();
  }, [router]);

  const setupQuickActions = async () => {
    try {
      if (Platform.OS === 'ios') {
        // iOS quick actions will be configured via app.json UIApplicationShortcutItems
        console.log('iOS quick actions configured via app.json');
      } else if (Platform.OS === 'android') {
        // Android app shortcuts will be configured via app.json shortcutItems
        console.log('Android app shortcuts configured via app.json');
      }
    } catch (error) {
      console.error('Error setting up quick actions:', error);
    }
  };

  /**
   * Handle quick action navigation
   * Called from app initialization when quick action is triggered
   * @param {string} actionId - The quick action identifier
   */
  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'ongoing-hunts':
        // Navigate to ScavengerHunt tab which shows ongoing/active hunts
        router.push('/(app)/(drawer)/(tabs)');
        break;
      case 'completed-hunts':
        // Navigate to Profile which displays completed hunts
        router.push('/(app)/(drawer)/Profile');
        break;
      case 'profile':
        router.push('/(app)/(drawer)/Profile');
        break;
      default:
        console.warn(`Unknown quick action: ${actionId}`);
    }
  };

  return { handleQuickAction };
}
