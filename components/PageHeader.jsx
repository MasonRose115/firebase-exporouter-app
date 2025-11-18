import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BackButton from './BackButton';

export default function PageHeader({ 
  title, 
  subtitle, 
  showBackButton = true, 
  onBackPress,
  style,
  titleStyle 
}) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerTop}>
        {showBackButton ? (
          <BackButton onPress={onBackPress} />
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={[styles.title, titleStyle]}>
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});