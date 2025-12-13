import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import PageHeader from '../../../../components/PageHeader';
import {
  getCurrentUser,
  getAllVisibleHunts,
  getPlayerHunt,
  getLocationsByHunt,
  getCheckInSummaryForHunt,
  getAverageRatingForHunt
} from '../../../../lib/firebase-service';

export default function HuntDiscovery() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hunts, setHunts] = useState([]);
  const [filteredHunts, setFilteredHunts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [huntProgress, setHuntProgress] = useState({}); // Track progress for each hunt
  const [huntRatings, setHuntRatings] = useState({}); // Track ratings for each hunt

  const loadHunts = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const user = await getCurrentUser();
      const uid = user?.user?.uid;
      setCurrentUser(user?.user);

      // Get all visible hunts
      const visibleHunts = await getAllVisibleHunts();
      
      // Calculate progress for each hunt if user is signed in
      const progressData = {};
      const ratingsData = {};
      
      if (visibleHunts.length > 0) {
        await Promise.all(
          visibleHunts.map(async (hunt) => {
            try {
              // Calculate ratings for this hunt
              const ratingInfo = await getAverageRatingForHunt(hunt.huntId);
              ratingsData[hunt.huntId] = {
                average: ratingInfo.average,
                count: ratingInfo.count
              };
              
              // Calculate progress only if user is signed in
              if (uid) {
                // Check if user has started this hunt
                const playerHunt = await getPlayerHunt(uid, hunt.huntId);
                
                if (playerHunt && playerHunt.status !== 'ABANDONED') {
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
                  }
                }
              }
            } catch (e) {
              console.warn(`Error calculating data for hunt ${hunt.huntId}:`, e);
              ratingsData[hunt.huntId] = { average: 0, count: 0 };
            }
          })
        );
      }
      
      setHunts(visibleHunts);
      setFilteredHunts(visibleHunts);
      setHuntProgress(progressData);
      setHuntRatings(ratingsData);
    } catch (e) {
      console.error('Failed to load hunts:', e);
      setError('Failed to load hunts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHunts();
  }, []);

  // Filter hunts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHunts(hunts);
    } else {
      const filtered = hunts.filter(hunt =>
        hunt.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHunts(filtered);
    }
  }, [searchQuery, hunts]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHunts(false);
  };

  const navigateToHuntDetail = (huntId) => {
    router.push({
      pathname: '/(app)/(drawer)/(tabs)/hunt/HuntDetail',
      params: { id: String(huntId) }
    });
  };

  const renderProgressBar = (progress) => {
    if (!progress) return null;
    
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

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Text key={`star-${i}`} style={styles.starFilled}>★</Text>
      );
    }
    
    // Add half star if needed
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <Text key="half-star" style={styles.starHalf}>★</Text>
      );
    }
    
    // Add empty stars
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Text key={`empty-${i}`} style={styles.starEmpty}>☆</Text>
      );
    }
    
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderHuntItem = (hunt) => {
    const progress = huntProgress[hunt.huntId];
    const rating = huntRatings[hunt.huntId] || { average: 0, count: 0 };
    const hasProgress = progress && progress.total > 0;
    
    return (
      <Pressable
        key={hunt.huntId}
        style={styles.huntItem}
        onPress={() => navigateToHuntDetail(hunt.huntId)}
      >
        <View style={styles.huntHeader}>
          <Text style={styles.huntName}>{hunt.name}</Text>
          <Text style={styles.huntCreator}>by {hunt.userId}</Text>
        </View>
        
        {/* Rating Display */}
        <View style={styles.ratingSection}>
          <View style={styles.ratingContainer}>
            {renderStarRating(rating.average)}
            <Text style={styles.ratingText}>
              {rating.count > 0 ? (
                `${rating.average.toFixed(1)} (${rating.count} review${rating.count !== 1 ? 's' : ''})`
              ) : (
                'No reviews yet'
              )}
            </Text>
          </View>
        </View>
        
        {hasProgress && (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Your Progress:</Text>
            {renderProgressBar(progress)}
          </View>
        )}
        
        {!hasProgress && currentUser && (
          <View style={styles.notStartedContainer}>
            <Text style={styles.notStartedText}>Not started</Text>
          </View>
        )}
        
        <View style={styles.huntFooter}>
          <Text style={styles.tapToViewText}>Tap to view details</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Discover Hunts" 
        subtitle={`${filteredHunts.length} hunt${filteredHunts.length !== 1 ? 's' : ''} available`}
      />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search hunts by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {loading && !refreshing && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading hunts...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadHunts()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && filteredHunts.length === 0 && (
        <View style={styles.center}>
          {searchQuery ? (
            <View style={styles.emptySearch}>
              <Text style={styles.emptyText}>No hunts match "{searchQuery}"</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No public hunts available</Text>
              <Text style={styles.emptySubtext}>Check back later for new adventures!</Text>
            </View>
          )}
        </View>
      )}

      {!loading && !error && filteredHunts.length > 0 && (
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
          {filteredHunts.map(renderHuntItem)}
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
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
    marginBottom: 12,
  },
  huntName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  huntCreator: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratingSection: {
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starFilled: {
    color: '#fbbf24',
    fontSize: 16,
  },
  starHalf: {
    color: '#fbbf24',
    fontSize: 16,
    opacity: 0.5,
  },
  starEmpty: {
    color: '#d1d5db',
    fontSize: 16,
  },
  ratingText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
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
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    minWidth: 70,
    textAlign: 'right',
  },
  notStartedContainer: {
    marginBottom: 12,
  },
  notStartedText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  huntFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  tapToViewText: {
    fontSize: 12,
    color: '#2563eb',
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
  },
  emptySearch: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});