/**
 * App Icon Selector Component
 * Allows users to change the app icon from a gallery of alternatives
 * @module components/AppIconSelector
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { changeAppIcon } from '../lib/app-icon-manager';

// Define available app icons
const APP_ICONS = [
  {
    id: 'default',
    name: 'Default',
    preview: require('@/assets/images/icon.png'),
    description: 'Classic scavenger hunt icon',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    preview: require('@/assets/images/icon.png'),
    description: 'Sleek dark theme icon',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    preview: require('@/assets/images/icon.png'),
    description: 'Retro adventure style',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    preview: require('@/assets/images/icon.png'),
    description: 'Clean and simple',
  },
  {
    id: 'colorful',
    name: 'Colorful',
    preview: require('@/assets/images/icon.png'),
    description: 'Bright and vibrant',
  },
  {
    id: 'nature',
    name: 'Nature',
    preview: require('@/assets/images/icon.png'),
    description: 'Outdoor adventure theme',
  },
];

interface AppIconSelectorProps {
  onIconChange?: (iconId: string) => void;
}

/**
 * AppIconSelector Component
 * Displays a gallery of alternative app icons and allows selection
 */
export default function AppIconSelector({ onIconChange }: AppIconSelectorProps) {
  const [selectedIcon, setSelectedIcon] = useState('default');
  const [isChanging, setIsChanging] = useState(false);

  /**
   * Handle app icon change
   * Uses native module to change the app icon
   */
  const handleIconChange = async (iconId: string) => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available on Web',
        'App icon changes are only available on iOS and Android devices.'
      );
      return;
    }

    setIsChanging(true);
    
    try {
      // Store the selection
      setSelectedIcon(iconId);
      
      // Attempt to change the app icon using native module
      const iconName = iconId === 'default' ? null : iconId;
      await changeAppIcon(iconName);
      
      // Show success message
      Alert.alert(
        'Icon Changed',
        `App icon changed to "${APP_ICONS.find(i => i.id === iconId)?.name}".\n\nNote: If this doesn't work, make sure you've built the app natively with EAS Build or Xcode/Android Studio.`,
        [{ text: 'OK' }]
      );

      if (onIconChange) {
        onIconChange(iconId);
      }
    } catch (error) {
      console.error('Error changing app icon:', error);
      
      // Show helpful error message
      const errorMessage = Platform.OS === 'ios'
        ? 'To enable this feature:\n1. Configure alternate icons in Info.plist (already done)\n2. Add icon assets to project\n3. Build with EAS Build: eas build --platform ios'
        : 'To enable this feature:\n1. Configure activity-alias in AndroidManifest.xml\n2. Add icon drawables to project\n3. Build with EAS Build: eas build --platform android';
      
      Alert.alert('Icon Change Not Available', errorMessage);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="apps" size={24} color="#2563eb" />
        <Text style={styles.title}>App Icon</Text>
      </View>
      
      <Text style={styles.subtitle}>
        Choose your favorite app icon
      </Text>

      {/* Icon Gallery */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gallery}
      >
        {APP_ICONS.map((icon) => (
          <Pressable
            key={icon.id}
            style={[
              styles.iconCard,
              selectedIcon === icon.id && styles.iconCardSelected,
            ]}
            onPress={() => handleIconChange(icon.id)}
            disabled={isChanging}
          >
            {/* Icon Preview */}
            <View style={styles.iconPreview}>
              <Image 
                source={icon.preview} 
                style={styles.iconImage}
                resizeMode="cover"
              />
              {selectedIcon === icon.id && (
                <View style={styles.checkmarkBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
              )}
            </View>

            {/* Icon Info */}
            <View style={styles.iconInfo}>
              <Text style={styles.iconName}>{icon.name}</Text>
              <Text style={styles.iconDescription} numberOfLines={2}>
                {icon.description}
              </Text>
            </View>

            {/* Selection Indicator */}
            {selectedIcon === icon.id && (
              <View style={styles.selectedBorder} />
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Info Message */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#6b7280" />
        <Text style={styles.infoText}>
          App icon changes are applied system-wide and may take a moment to reflect.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  gallery: {
    gap: 12,
    paddingVertical: 8,
  },
  iconCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  iconCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  iconPreview: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  iconInfo: {
    alignItems: 'center',
    width: '100%',
  },
  iconName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  iconDescription: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  selectedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    pointerEvents: 'none',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
});
