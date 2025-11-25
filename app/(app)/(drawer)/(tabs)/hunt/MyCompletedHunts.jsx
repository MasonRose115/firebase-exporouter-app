import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import PageHeader from '../../../../../components/PageHeader';
import { getCurrentUser, getPlayerHuntsByStatus } from '../../../../../lib/firebase-service';

export default function MyCompletedHunts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hunts, setHunts] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCurrentUser();
        const uid = res?.user?.uid;
        if (!uid) {
          setError('You must be signed in to view completed hunts.');
        } else {
          const data = await getPlayerHuntsByStatus(uid, 'COMPLETED');
          if (mounted) setHunts(data.sort((a,b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0)));
        }
      } catch (e) {
        console.error('Failed to load completed hunts:', e);
        setError('Failed to load completed hunts.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      <PageHeader title="Completed Hunts" subtitle={`Total: ${hunts.length}`} />
      {loading && (
        <View style={styles.center}> 
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      )}
      {!loading && error && (
        <View style={styles.center}> 
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
      {!loading && !error && hunts.length === 0 && (
        <View style={styles.center}> 
          <Text style={styles.empty}>No completed hunts yet. </Text>
        </View>
      )}
      {!loading && !error && hunts.length > 0 && (
        <ScrollView style={styles.list} contentContainerStyle={{ padding: 8 }}>
          <View style={styles.celebrateBox}>
            <Text style={styles.celebrateText}>Great job! Keep the streak going!</Text>
          </View>
          {hunts.map(h => (
            <Pressable key={h.playerHuntId} style={styles.item} onPress={() => router.push({ pathname: '/(app)/(drawer)/(tabs)/hunt/HuntDetail', params: { id: String(h.huntId) } })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{h.huntName || h.huntId}</Text>
                {h.completedAt && (
                  <Text style={styles.meta}>Completed: {new Date(h.completedAt.toDate()).toLocaleString()}</Text>
                )}
              </View>
              <Text style={styles.statusBadge}>COMPLETED</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#dc2626' },
  empty: { color: '#6b7280', textAlign: 'center', padding: 24 },
  list: { flex: 1, marginTop: 8 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statusBadge: { backgroundColor: '#10b981', color: '#fff', fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  celebrateBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ecfdf5', borderColor: '#d1fae5', borderWidth: 1, padding: 16, borderRadius: 12, marginBottom: 12 },
  celebrateEmoji: { fontSize: 28 },
  celebrateText: { fontSize: 14, fontWeight: '600', color: '#065f46' },
});
