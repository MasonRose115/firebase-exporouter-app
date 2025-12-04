import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { saveLocation, updateLocation, getLocationById } from '../../lib/firebase-service';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader'; 

export default function LocationDetail() {
  const { huntId, locationId } = useLocalSearchParams();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    locationId: '',
    locationName: '',
    explanation: '',
    latitude: '',
    longitude: ''
  });

  // Location tracking state
  const [location, setLocation] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const taskName = 'BACKGROUND_LOCATION_TASK';

  useEffect(() => {
    // Initialize form with existing data if editing
    const loadLocationData = async () => {
      if (locationId) {
        setIsLoading(true);
        try {
          const locationData = await getLocationById(locationId);
          if (locationData) {
            setFormData({
              locationId: locationData.locationId,
              locationName: locationData.locationName,
              explanation: locationData.explanation || '',
              latitude: locationData.latitude.toString(),
              longitude: locationData.longitude.toString()
            });
          }
        } catch (error) {
          console.error('Error loading location:', error);
          Alert.alert('Error', 'Failed to load location data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadLocationData();

    // Request location permissions
    (async () => {
      let fg = await Location.requestForegroundPermissionsAsync();
      if (fg.status !== 'granted') {
        setMessage('Permission to access location was denied');
        return;
      }

      let bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status !== 'granted') {
        setMessage('Permission to access background location was denied');
        return;
      }
      console.log(location);
      setMessage('Ready for tracking.');

      return() => {
        stopTracking();
      }
    })();
  }, [locationId]);

  // Form handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      setFormData(prev => ({
        ...prev,
        latitude: currentLocation.coords.latitude.toString(),
        longitude: currentLocation.coords.longitude.toString()
      }));
      
      Alert.alert('Success', 'Current location has been filled in!');
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.locationId.trim() || !formData.locationName.trim()) {
      Alert.alert('Error', 'Location ID and Name are required');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Error', 'Latitude and Longitude are required');
      return;
    }

    // Validate coordinate format
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Please enter valid coordinate ranges (-90 to 90 for latitude, -180 to 180 for longitude)');
      return;
    }

    setIsLoading(true);
    
    try {
      const locationData = {
        locationId: formData.locationId.trim(),
        locationName: formData.locationName.trim(),
        explanation: formData.explanation.trim(),
        latitude: lat,
        longitude: lng,
        huntId: huntId || 'default'
      };

      if (locationId) {
        // Update existing location
        await updateLocation(locationId, locationData);
        Alert.alert('Success', 'Location updated successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace(`/locationList?huntId=${huntId || 'default'}`)
          }
        ]);
      } else {
        // Create new location
        const docId = await saveLocation(locationData);
        console.log('Location saved with ID:', docId);
        Alert.alert('Success', 'Location saved successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace(`/locationList?huntId=${huntId || 'default'}`)
          }
        ]);
      }
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
    const stopTracking = async () => {
     await Location.stopLocationUpdatesAsync(taskName);

     await Location.hasStartedLocationUpdatesAsync(taskName);
    }

return (
  <ScrollView style={styles.container}>
    {isLoading && (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>
          {locationId ? 'Loading location data...' : 'Saving location...'}
        </Text>
      </View>
    )}
    
    <PageHeader
      title={locationId ? 'Edit Location' : 'Add New Location'}
      subtitle={huntId ? `Hunt ID: ${huntId}` : undefined}
      showBackButton={true}
      onBackPress={() => {
        console.log('Back button pressed in LocationDetail');
        router.back();
      }}
    />

    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location ID *</Text>
        <TextInput
          style={styles.input}
          value={formData.locationId}
          onChangeText={(value) => handleInputChange('locationId', value)}
          placeholder="Enter unique location ID"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.locationName}
          onChangeText={(value) => handleInputChange('locationName', value)}
          placeholder="Enter location name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Explanation</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.explanation}
          onChangeText={(value) => handleInputChange('explanation', value)}
          placeholder="Describe this location or provide clues..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.coordinatesSection}>
        <Text style={styles.sectionTitle}>Coordinates</Text>
        <Pressable style={styles.getCurrentButton} onPress={getCurrentLocation}>
          <Text style={styles.getCurrentButtonText}>Use Current Location</Text>
        </Pressable>
        
        <View style={styles.coordinatesRow}>
          <View style={styles.coordinateInput}>
            <Text style={styles.label}>Latitude *</Text>
            <TextInput
              style={styles.input}
              value={formData.latitude}
              onChangeText={(value) => handleInputChange('latitude', value)}
              placeholder="0.000000"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.coordinateInput}>
            <Text style={styles.label}>Longitude *</Text>
            <TextInput
              style={styles.input}
              value={formData.longitude}
              onChangeText={(value) => handleInputChange('longitude', value)}
              placeholder="0.000000"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.button, styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Location'}
          </Text>
        </Pressable>
      </View>
      
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  </ScrollView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  coordinatesSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  getCurrentButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  getCurrentButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  message: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    color: '#92400e',
    textAlign: 'center',
  },
});