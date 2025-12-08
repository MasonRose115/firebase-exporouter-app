/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    // Text colors
    text: '#11181C',
    textSecondary: '#687076',
    textMuted: '#9BA1A6',
    
    // Background colors
    background: '#fff',
    backgroundSecondary: '#f5f5f5',
    backgroundTertiary: '#e8e8e8',
    
    // UI colors
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // Button colors
    buttonPrimary: '#0a7ea4',
    buttonPrimaryText: '#fff',
    buttonSecondary: '#e8e8e8',
    buttonSecondaryText: '#11181C',
    buttonDanger: '#dc3545',
    buttonDangerText: '#fff',
    
    // Card colors
    card: '#fff',
    cardBorder: '#e0e0e0',
    
    // Border colors
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    
    // Status colors
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
    
    // Input colors
    input: '#fff',
    inputBorder: '#d1d5db',
    inputPlaceholder: '#9BA1A6',
  },
  dark: {
    // Text colors
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    textMuted: '#687076',
    
    // Background colors
    background: '#151718',
    backgroundSecondary: '#1f2224',
    backgroundTertiary: '#2a2d30',
    
    // UI colors
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // Button colors
    buttonPrimary: '#0a7ea4',
    buttonPrimaryText: '#fff',
    buttonSecondary: '#2a2d30',
    buttonSecondaryText: '#ECEDEE',
    buttonDanger: '#dc3545',
    buttonDangerText: '#fff',
    
    // Card colors
    card: '#1f2224',
    cardBorder: '#2a2d30',
    
    // Border colors
    border: '#2a2d30',
    borderLight: '#1f2224',
    
    // Status colors
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
    
    // Input colors
    input: '#1f2224',
    inputBorder: '#2a2d30',
    inputPlaceholder: '#687076',
  },
};
