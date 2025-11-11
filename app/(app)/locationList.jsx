import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';

export default function LocationList() {
  const { huntId } = useLocalSearchParams();
  const router = useRouter();
  
  // Mock data - replace with your actual data source (Redux, API, etc.)
  const [locations, setLocations] = useState([
    {
      id: '1',
      locationId: 'LOC001',
      locationName: 'Campus Library',
      explanation: 'Find the ancient wisdom in the heart of learning',
      latitude: 40.7128,
      longitude: -74.0060,
      huntId: huntId
    },
    {
      id: '2', 
      locationId: 'LOC002',
      locationName: 'Student Center',
      explanation: 'Where students gather and friendships are made',
      latitude: 40.7589,
      longitude: -73.9851,
      huntId: huntId
    },
    {
      id: '3',
      locationId: 'LOC003', 
      locationName: 'Science Building',
      explanation: 'Discover the mysteries of the universe here',
      latitude: 40.7505,
      longitude: -73.9934,
      huntId: huntId
    }
  ]);

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

  const handleDeleteLocation = (locationId) => {
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
          onPress: () => {
            setLocations(prev => prev.filter(loc => loc.id !== locationId));
            // TODO: Update your data store here
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

      {locations.length === 0 ? (
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
