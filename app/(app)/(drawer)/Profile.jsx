import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, TextInput, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import PageHeader from '../../../components/PageHeader';
import { getCurrentUser, getUserProfile, updateUserProfile, getPlayerHuntsByStatus } from '../../../lib/firebase-service';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [completedHunts, setCompletedHunts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCurrentUser();
      const uid = res?.user?.uid;
      if (!uid) {
        setError('You must be signed in to view your profile.');
        setLoading(false);
        return;
      }
      
      setUser(res.user);
      
      // Load profile data
      const profileData = await getUserProfile(uid);
      setProfile(profileData);
      setDisplayName(profileData?.displayName || res.user.email || '');
      
      // Load completed hunts
      const hunts = await getPlayerHuntsByStatus(uid, 'COMPLETED');
      setCompletedHunts(hunts.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0)));
    } catch (e) {
      console.error('Failed to load profile:', e);
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const imageUri = result.assets[0].uri;
        
        // For now, just store the local URI
        // In production, you'd upload to Firebase Storage and get a URL
        await updateUserProfile(user.uid, {
          profileImageUrl: imageUri,
        });
        
        // Reload profile
        await loadProfile();
        
        if (Platform.OS === 'web') {
          alert('Profile picture updated!');
        } else {
          Alert.alert('Success', 'Profile picture updated!');
        }
      }
    } catch (e) {
      console.error('Error uploading image:', e);
      if (Platform.OS === 'web') {
        alert('Failed to upload image.');
      } else {
        Alert.alert('Error', 'Failed to upload image.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name.');
      return;
    }

    try {
      setUploading(true);
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
      });
      await loadProfile();
      setIsEditing(false);
      
      if (Platform.OS === 'web') {
        alert('Display name updated!');
      } else {
        Alert.alert('Success', 'Display name updated!');
      }
    } catch (e) {
      console.error('Error updating name:', e);
      if (Platform.OS === 'web') {
        alert('Failed to update name.');
      } else {
        Alert.alert('Error', 'Failed to update name.');
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Profile" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <PageHeader title="Profile" />
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="Profile" subtitle={user?.email || ''} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            {profile?.profileImageUrl ? (
              <Image source={{ uri: profile.profileImageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={60} color="#9ca3af" />
              </View>
            )}
            <Pressable 
              style={styles.uploadButton} 
              onPress={handleImageUpload}
              disabled={uploading}
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.nameSection}>
            {!isEditing ? (
              <>
                <Text style={styles.displayName}>
                  {profile?.displayName || user?.email || 'Anonymous User'}
                </Text>
                <Pressable onPress={() => setIsEditing(true)} style={styles.editButton}>
                  <Ionicons name="pencil" size={16} color="#2563eb" />
                  <Text style={styles.editButtonText}>Edit Name</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter display name"
                  autoFocus
                />
                <View style={styles.editActions}>
                  <Pressable 
                    style={[styles.actionButton, styles.cancelButton]} 
                    onPress={() => {
                      setIsEditing(false);
                      setDisplayName(profile?.displayName || user?.email || '');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.actionButton, styles.saveButton]} 
                    onPress={handleSaveName}
                    disabled={uploading}
                  >
                    <Text style={styles.saveButtonText}>
                      {uploading ? 'Saving...' : 'Save'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{completedHunts.length}</Text>
            <Text style={styles.statLabel}>Completed Hunts</Text>
          </View>
        </View>

        {/* Completed Hunts Section */}
        <View style={styles.huntsSection}>
          <Text style={styles.sectionTitle}>🏆 Completed Hunts</Text>
          {completedHunts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No completed hunts yet.</Text>
              <Text style={styles.emptySubtext}>Start a hunt to begin your adventure!</Text>
            </View>
          ) : (
            <>
              <View style={styles.celebrateBox}>
                <Text style={styles.celebrateText}>🎉 Great job! Keep the streak going!</Text>
              </View>
              {completedHunts.map(hunt => (
                <Pressable 
                  key={hunt.playerHuntId} 
                  style={styles.huntItem}
                  onPress={() => router.push({ 
                    pathname: '/(app)/(drawer)/(tabs)/hunt/HuntDetail', 
                    params: { id: String(hunt.huntId) } 
                  })}
                >
                  <View style={styles.huntInfo}>
                    <Text style={styles.huntName}>{hunt.huntName || hunt.huntId}</Text>
                    {hunt.completedAt && (
                      <Text style={styles.huntMeta}>
                        Completed: {new Date(hunt.completedAt.toDate()).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.huntBadge}>
                    <Text style={styles.huntBadgeText}>✓</Text>
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#dc2626', fontSize: 16 },
  
  profileSection: { alignItems: 'center', padding: 24, backgroundColor: '#f9fafb', borderRadius: 16, marginBottom: 20 },
  imageContainer: { position: 'relative', marginBottom: 16 },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff' },
  profileImagePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff' },
  uploadButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563eb', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  
  nameSection: { alignItems: 'center', width: '100%', paddingHorizontal: 16 },
  displayName: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 },
  editButtonText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  
  editContainer: { width: '100%' },
  nameInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12, backgroundColor: '#fff' },
  editActions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#6b7280' },
  saveButton: { backgroundColor: '#2563eb' },
  cancelButtonText: { color: '#fff', fontWeight: '600' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  
  statsSection: { marginBottom: 24, alignItems: 'center' },
  statBox: { backgroundColor: '#eff6ff', padding: 20, paddingHorizontal: 40, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#dbeafe' },
  statNumber: { fontSize: 32, fontWeight: '700', color: '#2563eb', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  
  huntsSection: { flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#6b7280', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#9ca3af' },
  
  celebrateBox: { backgroundColor: '#ecfdf5', borderColor: '#d1fae5', borderWidth: 1, padding: 16, borderRadius: 12, marginBottom: 12 },
  celebrateText: { fontSize: 14, fontWeight: '600', color: '#065f46', textAlign: 'center' },
  
  huntItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  huntInfo: { flex: 1 },
  huntName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  huntMeta: { fontSize: 12, color: '#6b7280' },
  huntBadge: { backgroundColor: '#10b981', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  huntBadgeText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
