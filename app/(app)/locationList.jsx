import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import { getLocationsByHunt, deleteLocation, isLocationAvailableNow } from '../../lib/firebase-service';

export default function LocationList() {
  const { huntId } = useLocalSearchParams();
  const router = useRouter();
  
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to load locations from Firestore
  const loadLocations = async () => {
    try {
      setIsLoading(true);
      const huntIdString = huntId || 'default';
      const locationData = await getLocationsByHunt(huntIdString);
      setLocations(locationData);
    } catch (error) {
      console.error('Error loading locations:', error);
      Alert.alert('Error', 'Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh locations (pull-to-refresh)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLocations();
    setIsRefreshing(false);
  };

  // Load locations when component mounts
  useEffect(() => {
    loadLocations();
  }, [huntId]);

  // Reload locations when screen comes into focus (when returning from locationDetail)
  useFocusEffect(
    React.useCallback(() => {
      loadLocations();
    }, [huntId])
  );

  const handleAddLocation = () => {
    router.push({
      pathname: '/locationDetail',
      params: { huntId }
    });
  };

  const handleEditLocation = (location) => {
    router.push({
      pathname: '/locationDetail',
      params: { 
        huntId,
        locationId: location.id,
        // You might want to pass more data here for editing
      }
    });
  };

  const handleEditAvailability = (location) => {
    router.push({
      pathname: '/conditionEdit',
      params: {
        huntId,
        locationId: location.id,
      }
    });
  };

  const handleDeleteLocation = async (documentId) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocation(documentId);
              // Refresh the list after deletion
              loadLocations();
              Alert.alert('Success', 'Location deleted successfully');
            } catch (error) {
              console.error('Error deleting location:', error);
              Alert.alert('Error', 'Failed to delete location');
            }
          }
        }
      ]
    );
  };

  const renderLocationItem = ({ item }) => (
    <View style={styles.locationItem}>
      <Pressable 
        style={styles.locationContent}
        onPress={() => handleEditLocation(item)}
      >
        <View style={styles.locationHeader}>
          <Text style={styles.locationName}>{item.locationName}</Text>
          <Text style={styles.locationId}>ID: {item.locationId}</Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: isLocationAvailableNow(item) ? '#065f46' : '#7f1d1d'
          }}>
            {isLocationAvailableNow(item) ? 'Active now' : 'Inactive now'}
          </Text>
        </View>
        
        {item.explanation ? (
          <Text style={styles.locationExplanation} numberOfLines={2}>
            {item.explanation}
          </Text>
        ) : null}
        
        <View style={styles.coordinatesContainer}>
          <View style={styles.coordinate}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.coordinateText}>
              {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
            </Text>
          </View>
        </View>
      </Pressable>
      
      <View style={styles.locationActions}>
        <Pressable 
          style={styles.editButton}
          onPress={() => handleEditLocation(item)}
        >
          <Ionicons name="pencil" size={18} color="#3b82f6" />
        </Pressable>
        <Pressable 
          style={styles.editButton}
          onPress={() => handleEditAvailability(item)}
        >
          <Ionicons name="time-outline" size={18} color="#10b981" />
        </Pressable>
        
        <Pressable 
          style={styles.deleteButton}
          onPress={() => handleDeleteLocation(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        title="Locations"
        subtitle={huntId ? `Hunt ID: ${huntId} • ${locations.length} location${locations.length !== 1 ? 's' : ''}` : `${locations.length} location${locations.length !== 1 ? 's' : ''}`}
        showBackButton={true}
        onBackPress={() => {
          console.log('Back button pressed in LocationList');
          try {
            router.back();
          } catch (error) {
            console.log('router.back() failed, using push instead', error);
            router.push('/');
          }
        }}
      />

      <Pressable style={styles.addButton} onPress={handleAddLocation}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Location</Text>
      </Pressable>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading locations...</Text>
        </View>
      ) : locations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Locations Yet</Text>
          <Text style={styles.emptyDescription}>
            Add your first location to get started with this hunt
          </Text>
        </View>
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          renderItem={renderLocationItem}
          style={styles.locationsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  addButton: {
    backgroundColor: '#10b981',
    margin: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationsList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  locationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  locationContent: {
    padding: 16,
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  locationId: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  locationExplanation: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordinate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordinateText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  locationActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
