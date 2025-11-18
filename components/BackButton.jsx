import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BackButton({ style, iconColor = '#ffffff', iconSize = 20, onPress }) {
  const router = useRouter();

  const handlePress = () => {
    console.log('BackButton handlePress called');
    try {
      if (onPress) {
        console.log('Using custom onPress function');
        onPress();
      } else {
        console.log('Using router.back()');
        router.back();
      }
    } catch (error) {
      console.error('Error in handlePress:', error);
    }
  };

  console.log('BackButton rendering with onPress:', !!onPress);

  return (
    <TouchableOpacity 
      style={[styles.backButton, style]} 
      onPress={handlePress}
      activeOpacity={0.7}
      testID="back-button"
    >
      <Ionicons name="arrow-back" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ef4444', // Red for high visibility
    borderWidth: 2,
    borderColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    elevation: 8, // Higher elevation
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 1000, // Ensure it's above other elements
  },
});