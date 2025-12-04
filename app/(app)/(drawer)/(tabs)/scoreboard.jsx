import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../../../components/PageHeader';
import { getGlobalScoreboard, getCurrentUser } from '../../../../lib/firebase-service';

export default function Scoreboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [scoreboard, setScoreboard] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadScoreboard();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const res = await getCurrentUser();
      setCurrentUserId(res?.user?.uid || null);
    } catch (e) {
      console.error('Error loading current user:', e);
    }
  };

  const loadScoreboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGlobalScoreboard();
      setScoreboard(data);
    } catch (e) {
      console.error('Failed to load scoreboard:', e);
      setError('Failed to load scoreboard.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScoreboard();
    setRefreshing(false);
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Scoreboard" subtitle="Global Rankings" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <PageHeader title="Scoreboard" subtitle="Global Rankings" />
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Scoreboard" 
        subtitle={`${scoreboard.length} Competitor${scoreboard.length !== 1 ? 's' : ''}`} 
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {scoreboard.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No completed hunts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to complete a hunt!</Text>
          </View>
        ) : (
          <>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#2563eb" />
              <Text style={styles.infoText}>Rankings based on completed hunts</Text>
            </View>

            {scoreboard.map((user, index) => {
              const rank = index + 1;
              const medal = getMedalEmoji(rank);
              const isCurrentUser = user.userId === currentUserId;
              
              return (
                <View 
                  key={user.userId} 
                  style={[
                    styles.rankItem,
                    isCurrentUser && styles.currentUserItem,
                    rank <= 3 && styles.topThreeItem,
                  ]}
                >
                  <View style={styles.rankSection}>
                    {medal ? (
                      <Text style={styles.medalText}>{medal}</Text>
                    ) : (
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>{rank}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.avatarSection}>
                    {user.profileImageUrl ? (
                      <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color="#9ca3af" />
                      </View>
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                        {user.displayName}
                      </Text>
                      {isCurrentUser && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.statsRow}>
                      <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                      <Text style={styles.statsText}>
                        {user.completedCount} hunt{user.completedCount !== 1 ? 's' : ''} completed
                      </Text>
                    </View>
                  </View>

                  <View style={styles.countSection}>
                    <Text style={styles.countNumber}>{user.completedCount}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
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
  
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
  
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#dbeafe' },
  infoText: { fontSize: 14, color: '#1e40af', fontWeight: '500' },
  
  rankItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  currentUserItem: { backgroundColor: '#eff6ff', borderColor: '#3b82f6', borderWidth: 2 },
  topThreeItem: { backgroundColor: '#fefce8', borderColor: '#fbbf24' },
  
  rankSection: { width: 40, alignItems: 'center' },
  medalText: { fontSize: 28 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  
  avatarSection: { marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  userName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  currentUserName: { color: '#2563eb' },
  youBadge: { backgroundColor: '#2563eb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  youBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statsText: { fontSize: 12, color: '#6b7280' },
  
  countSection: { marginLeft: 8 },
  countNumber: { fontSize: 24, fontWeight: '700', color: '#2563eb' },
});
