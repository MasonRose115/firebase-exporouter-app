import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import PageHeader from '../../components/PageHeader';
import {
  getCurrentUser,
  getPlayerHuntsByStatus,
  getLocationsByHunt,
  getCheckInSummaryForHunt
} from '../../lib/firebase-service';

export default function MyActiveHunts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeHunts, setActiveHunts] = useState([]);
  const [huntProgress, setHuntProgress] = useState({}); // Track progress for each hunt
  const [currentUser, setCurrentUser] = useState(null);

  const loadActiveHunts = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const user = await getCurrentUser();
      const uid = user?.user?.uid;
      
      if (!uid) {
        setError('You must be signed in to view your active hunts.');
        return;
      }
      
      setCurrentUser(user.user);

      // Get hunts with 'STARTED' status
      const startedHunts = await getPlayerHuntsByStatus(uid, 'STARTED');
      
      // Calculate progress for each active hunt
      const progressData = {};
      
      if (startedHunts.length > 0) {
        await Promise.all(
          startedHunts.map(async (hunt) => {
            try {
              // Get total locations for this hunt
              const locations = await getLocationsByHunt(hunt.huntId);
              const totalLocations = locations.length;
              
              if (totalLocations > 0) {
                // Get user's check-ins for this hunt
                const checkInSummary = await getCheckInSummaryForHunt(hunt.huntId, uid);
                const completedCount = checkInSummary.userCompleted.size;
                
                progressData[hunt.huntId] = {
                  completed: completedCount,
                  total: totalLocations,
                  percentage: Math.round((completedCount / totalLocations) * 100)
                };
              } else {
                progressData[hunt.huntId] = {
                  completed: 0,
                  total: 0,
                  percentage: 0
                };
              }
            } catch (e) {
              console.warn(`Error calculating progress for hunt ${hunt.huntId}:`, e);
              progressData[hunt.huntId] = {
                completed: 0,
                total: 0,
                percentage: 0
              };
            }
          })
        );
      }
      
      setActiveHunts(startedHunts);
      setHuntProgress(progressData);
    } catch (e) {
      console.error('Failed to load active hunts:', e);
      setError('Failed to load your active hunts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActiveHunts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadActiveHunts(false);
  };

  const navigateToHuntDetail = (huntId) => {
    console.log('Navigating to hunt detail with ID:', huntId);
    try {
      router.push({
        pathname: '/(app)/(drawer)/(tabs)/hunt/HuntDetail',
        params: { id: String(huntId) }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      router.push(`/(app)/(drawer)/(tabs)/hunt/HuntDetail?id=${huntId}`);
    }
  };

  const renderProgressBar = (progress) => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress.percentage}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {progress.completed}/{progress.total} ({progress.percentage}%)
        </Text>
      </View>
    );
  };

  const renderHuntItem = (hunt) => {
    const progress = huntProgress[hunt.huntId] || { completed: 0, total: 0, percentage: 0 };
    
    return (
      <Pressable
        key={hunt.playerHuntId}
        style={styles.huntItem}
        onPress={() => navigateToHuntDetail(hunt.huntId)}
      >
        <View style={styles.huntHeader}>
          <Text style={styles.huntName}>{hunt.huntName || hunt.huntId}</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>ACTIVE</Text>
            </View>
          </View>
        </View>
        
        {hunt.startTime && (
          <Text style={styles.startedText}>
            Started: {new Date(hunt.startTime.toDate()).toLocaleDateString()}
          </Text>
        )}
        
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Progress:</Text>
          {renderProgressBar(progress)}
        </View>
        
        <View style={styles.huntFooter}>
          <Text style={styles.tapToViewText}>Tap to continue hunt</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="My Active Hunts" 
        subtitle={`${activeHunts.length} hunt${activeHunts.length !== 1 ? 's' : ''} in progress`}
      />

      {loading && !refreshing && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading your active hunts...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadActiveHunts()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && activeHunts.length === 0 && (
        <View style={styles.center}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>No Active Hunts</Text>
            <Text style={styles.emptySubtext}>
              Start exploring hunts from the Discovery tab to see your progress here!
            </Text>
            <Pressable 
              style={styles.discoverButton}
              onPress={() => router.push('/(app)/(drawer)/(tabs)/huntDiscovery')}
            >
              <Text style={styles.discoverButtonText}>Discover Hunts</Text>
            </Pressable>
          </View>
        </View>
      )}

      {!loading && !error && activeHunts.length > 0 && (
        <ScrollView
          style={styles.huntList}
          contentContainerStyle={styles.huntListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2563eb']}
              tintColor="#2563eb"
            />
          }
        >
          {activeHunts.map(renderHuntItem)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  huntList: {
    flex: 1,
  },
  huntListContent: {
    padding: 16,
  },
  huntItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  huntHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  huntName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  startedText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    minWidth: 70,
    textAlign: 'right',
  },
  huntFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  tapToViewText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  discoverButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  discoverButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});