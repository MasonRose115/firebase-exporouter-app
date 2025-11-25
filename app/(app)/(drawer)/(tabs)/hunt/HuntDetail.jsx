import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from "react-native";
import { updateItemName } from "../../../models/ScavSlice";
import { getCurrentUser, getHuntById, createHunt, updateHuntName, getLocationsByHunt, getPlayerHunt, setPlayerHuntStatus, getCheckInSummaryForHunt, abandonPlayerHunt } from "../../../../../lib/firebase-service";
import PageHeader from "../../../../../components/PageHeader";

export default function HuntDetail() {
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch();
  const router = useRouter();

  const item = useSelector((state) => state.scavSlice.items.find((i) => String(i.id) === String(id)));
  const [name, setName] = useState(item?.name ?? "");
  const [locations, setLocations] = useState([]);
  const [statusRecord, setStatusRecord] = useState(null);
  const [checkInCounts, setCheckInCounts] = useState({});
  const [userCompleted, setUserCompleted] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setName(item?.name ?? "");
  }, [item?.name]);

  // Load locations and player status
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getCurrentUser();
        const uid = res?.user?.uid;
        const [locs] = await Promise.all([
          getLocationsByHunt(String(id))
        ]);
        if (mounted) setLocations(locs);
        if (uid) {
          const rec = await getPlayerHunt(uid, String(id));
          if (mounted) setStatusRecord(rec);
          if (rec && (rec.status === 'STARTED' || rec.status === 'IN_PROGRESS')) {
            const summary = await getCheckInSummaryForHunt(String(id), uid);
            if (mounted) {
              setCheckInCounts(summary.counts);
              setUserCompleted(summary.userCompleted);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load hunt detail context:', e);
        if (mounted) setError('Failed to load hunt data');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (!item) {
    return (
      <View style={styles.container}> 
        <Text style={styles.title}>Hunt not found</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter a non-empty name.");
      return;
    }
    dispatch(updateItemName({ id: item.id, name: trimmed }));

    try {
      const res = await getCurrentUser();
      const uid = res?.user?.uid;
      if (uid) {
        const existing = await getHuntById(String(item.id));
        if (!existing) {
          await createHunt(String(item.id), trimmed, uid);
        } else {
          await updateHuntName(String(item.id), trimmed);
        }
      }
    } catch (e) {
      console.error('Failed to persist hunt name:', e);
    }

    router.back();
  };

  const handleStartPlaying = async () => {
    try {
      const res = await getCurrentUser();
      const uid = res?.user?.uid;
      if (!uid) {
        Alert.alert('Sign In Required', 'You must be signed in to start and track this hunt.');
        return;
      }
      await setPlayerHuntStatus(uid, String(id), name || item?.name, 'STARTED');
      const rec = await getPlayerHunt(uid, String(id));
      setStatusRecord(rec);
      const summary = await getCheckInSummaryForHunt(String(id), uid);
      setCheckInCounts(summary.counts);
      setUserCompleted(summary.userCompleted);
    } catch (e) {
      console.error('Failed to start playing hunt:', e);
      Alert.alert('Error', 'Could not start the hunt.');
    }
  };

  const handleAbandon = async () => {
    Alert.alert('Abandon Hunt', 'Are you sure? All progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Abandon', style: 'destructive', onPress: async () => {
        try {
          const res = await getCurrentUser();
          const uid = res?.user?.uid;
          if (!uid) return;
          await abandonPlayerHunt(uid, String(id));
          setStatusRecord(null);
          setUserCompleted(new Set());
          setCheckInCounts({});
        } catch (e) {
          console.error('Failed to abandon hunt:', e);
          Alert.alert('Error', 'Could not abandon the hunt.');
        }
      }}
    ]);
  };

  const isStarted = statusRecord?.status === 'STARTED' || statusRecord?.status === 'IN_PROGRESS';

  return (
    <View style={styles.container}>
      <PageHeader
        title={item?.name || 'Hunt Detail'}
        subtitle={statusRecord ? `Status: ${statusRecord.status}` : 'Status: Not Started'}
      />
      {loading && <Text style={styles.info}>Loading...</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!loading && !error && (
        <>
          {!isStarted && (
            <Pressable style={styles.startPlayButton} onPress={handleStartPlaying}>
              <Text style={styles.startPlayButtonText}>Start Playing Hunt</Text>
            </Pressable>
          )}
          {isStarted && (
            <Pressable style={styles.abandonButton} onPress={handleAbandon}>
              <Text style={styles.abandonButtonText}>Abandon Hunt</Text>
            </Pressable>
          )}
          {/* Editable section (could be hidden for pure player view) */}
          <View style={styles.form}>
            <Text style={styles.label}>Hunt Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter hunt name"
            />
            <View style={styles.row}>
              <Pressable style={[styles.button, styles.cancel]} onPress={() => router.back()}>
                <Text style={styles.buttonText}>Back</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.save]} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locations ({locations.length})</Text>
            {locations.length === 0 && <Text style={styles.info}>No locations added yet.</Text>}
            {locations.map(loc => {
              const completed = userCompleted.has(loc.id);
              const count = checkInCounts[loc.id] || 0;
              return (
                <View key={loc.id} style={[styles.locationItem, !isStarted && styles.locationLocked]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.locationName}>{isStarted ? loc.locationName : '🔒 Locked'}</Text>
                    {isStarted && (
                      <Text style={[styles.badge, completed ? styles.badgeDone : styles.badgePending]}>
                        {completed ? 'Done' : 'Pending'}
                      </Text>
                    )}
                  </View>
                  {isStarted && <Text style={styles.locationSub}>{loc.explanation}</Text>}
                  {isStarted && (
                    <Text style={styles.countText}>Check-ins: {count}</Text>
                  )}
                </View>
              );
            })}
            <Pressable 
              style={styles.manageButton} 
              onPress={() => router.push({ pathname: "/locationList", params: { huntId: item.id } })}
            >
              <Text style={styles.manageButtonText}>Manage Locations</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  form: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 14, color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", gap: 12 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancel: { backgroundColor: "#af9c9cff" },
  save: { backgroundColor: "#2563eb" },
  buttonText: { color: "#fff", fontWeight: "700" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden'
  },
  badgeDone: { backgroundColor: '#10b981', color: '#fff' },
  badgePending: { backgroundColor: '#f59e0b', color: '#fff' },
  countText: { marginTop: 6, fontSize: 12, color: '#374151' },
  section: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  manageButton: {
    backgroundColor: "#b82929ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  manageButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  startPlayButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  startPlayButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  locationItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  locationLocked: {
    backgroundColor: '#f3f4f6',
  },
  locationName: {
    fontWeight: '600',
    color: '#111827',
  },
  locationSub: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  info: { color: '#6b7280', paddingHorizontal: 16, marginBottom: 8 },
  error: { color: '#dc2626', paddingHorizontal: 16, marginBottom: 8 },
});
