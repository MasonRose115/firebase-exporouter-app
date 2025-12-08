/**
 * Quick Actions Handler Component
 * Listens for and handles app shortcuts / quick actions
 * @module components/QuickActionsHandler
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Linking, Platform } from 'react-native';

/**
 * Component that handles quick action deep links
 * Navigates to appropriate screen when quick action is triggered
 */
export function QuickActionsHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle quick actions via deep linking
    const handleDeepLink = ({ url }: { url: string }) => {
      handleQuickActionNavigation(url);
    };

    // Subscribe to deep link events
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial URL (if app was launched via quick action)
    Linking.getInitialURL().then((url) => {
      if (url != null) {
        handleQuickActionNavigation(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  const handleQuickActionNavigation = (url: string) => {
    // Parse the URL to get the quick action
    const routeName = url.split('quick-action/')[1] || '';

    switch (routeName) {
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
        break;
    }
  };

  return null;
}
