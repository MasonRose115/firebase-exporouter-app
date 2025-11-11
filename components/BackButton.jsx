import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BackButton({ style, iconColor = '#ffffff', iconSize = 20, onPress }) {
  const router = useRouter();

  const handlePress = () => {
    console.log('BackButton handlePress called');
    if (onPress) {
      console.log('Using custom onPress function');
      onPress();
    } else {
      console.log('Using router.back()');
      router.back();
    }
  };

  return (
    <Pressable style={[styles.backButton, style]} onPress={handlePress}>
      <Ionicons name="arrow-back" size={iconSize} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#3b82f6', // Make it blue for visibility
    borderWidth: 2,
    borderColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});