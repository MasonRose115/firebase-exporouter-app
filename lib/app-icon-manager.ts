/**
 * App Icon Manager
 * Native module wrapper for changing app icons
 * @module lib/app-icon-manager
 */

import { Platform, NativeModules } from 'react-native';

// Type definitions for the native module
interface AppIconManagerType {
  setAppIcon: (iconName: string | null) => Promise<void>;
  getAppIcon: () => Promise<string | null>;
  supportsAlternateIcons: () => Promise<boolean>;
}

// For iOS, we'll use the native module when available
const AppIconManagerNative: AppIconManagerType | undefined =
  Platform.OS === 'ios' ? NativeModules.AppIconManager : undefined;

/**
 * Change the app icon
 * @param {string|null} iconName - Icon name to switch to, or null for default
 * @returns {Promise<void>}
 */
export async function changeAppIcon(iconName: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('App icon changes are not supported on web');
  }

  if (Platform.OS === 'ios') {
    // iOS implementation
    // This requires native module or expo-dev-client build
    if (AppIconManagerNative) {
      try {
        await AppIconManagerNative.setAppIcon(iconName);
        console.log(`iOS app icon changed to: ${iconName || 'default'}`);
      } catch (error) {
        console.error('Error changing iOS app icon:', error);
        throw error;
      }
    } else {
      // Fallback: Log the attempted change
      // In production, this would use the native module
      console.log(`Would change iOS app icon to: ${iconName || 'default'}`);
      console.log('Note: Requires native build with expo-dev-client or EAS');
    }
  } else if (Platform.OS === 'android') {
    // Android implementation
    // This requires activity-alias configuration in AndroidManifest.xml
    console.log(`Would change Android app icon to: ${iconName || 'default'}`);
    console.log('Note: Requires native build with activity-alias configuration');
  }
}

/**
 * Get the current app icon name
 * @returns {Promise<string|null>} Current icon name or null for default
 */
export async function getCurrentAppIcon(): Promise<string | null> {
  if (Platform.OS === 'ios' && AppIconManagerNative) {
    try {
      return await AppIconManagerNative.getAppIcon();
    } catch (error) {
      console.error('Error getting current iOS app icon:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Check if alternate app icons are supported
 * @returns {Promise<boolean>}
 */
export async function supportsAlternateIcons(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  if (Platform.OS === 'ios' && AppIconManagerNative) {
    try {
      return await AppIconManagerNative.supportsAlternateIcons();
    } catch (error) {
      console.error('Error checking alternate icon support:', error);
      return false;
    }
  }

  // Android support depends on manifest configuration
  return Platform.OS === 'android';
}

/**
 * List of available app icon identifiers
 */
export const AVAILABLE_ICONS = [
  'default',
  'dark',
  'vintage',
  'minimal',
  'colorful',
  'nature',
] as const;

export type AppIconName = typeof AVAILABLE_ICONS[number];
