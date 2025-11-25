import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import { toggleItemFound, startHunt, endHunt, removeItem, removeItemsBulk, addItem } from "../../models/ScavSlice";
import PageHeader from "../../../../components/PageHeader";
import { createHunt, getCurrentUser, setPlayerHuntStatus } from "../../../../lib/firebase-service";

const ScavengerHunt = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, totalFound } = useSelector((state) => state.scavSlice);
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Started hunts and progress
  const startedItems = items.filter((i) => i.started);
  const progress = items.length > 0 ? (totalFound / items.length) * 100 : 0;
  const selectedCount = selectedItems.size;

  const handleToggleItem = (itemId) => {
    dispatch(toggleItemFound(itemId));
  };

  const handleStartHunt = (itemId) => {
    dispatch(startHunt(itemId));
    // Persist STARTED status
    (async () => {
      try {
        const res = await getCurrentUser();
        const uid = res?.user?.uid;
        if (uid) {
          const item = items.find(i => i.id === itemId);
          await setPlayerHuntStatus(uid, String(itemId), item?.name, 'STARTED');
        }
      } catch (e) {
        console.error('Failed to persist STARTED status:', e);
      }
    })();
  };

  const handleEndHunt = (itemId) => {
    dispatch(endHunt(itemId));
    // Persist completion/abandoned status
    (async () => {
      try {
        const res = await getCurrentUser();
        const uid = res?.user?.uid;
        if (uid) {
          const item = items.find(i => i.id === itemId);
          if (item) {
            const status = item.found ? 'COMPLETED' : 'ABANDONED';
            await setPlayerHuntStatus(uid, String(itemId), item.name, status);
          }
        }
      } catch (e) {
        console.error('Failed to persist end status:', e);
      }
    })();
  };

  const handleToggleSelect = (itemId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);
    dispatch(removeItemsBulk(ids));
    setSelectedItems(new Set());
  };

  const handleAddAndStart = async () => {
    const id = Date.now().toString();
    const count = items.length + 1;
    const name = `New Hunt ${count}`;

    // Persist to Firestore hunts collection with userId if logged in
    try {
      const res = await getCurrentUser();
      const uid = res?.user?.uid;
      if (!uid) {
        Alert.alert('Not signed in', 'You must be signed in to save hunts to the cloud. This hunt will exist only locally.');
      } else {
        await createHunt(id, name, uid);
      }
    } catch (e) {
      console.error('Failed to create hunt in Firestore:', e);
      Alert.alert('Cloud save failed', 'The hunt was created locally but could not be saved to the cloud.');
    }

    // Always create locally so the UI updates
    dispatch(addItem({ id, name, description: '' }));
    dispatch(startHunt(id));
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Scavenger Hunt"
        subtitle={`Progress: ${totalFound} / ${items.length} (${Math.round(progress)}%)`}
      />

      {/* Started hunts section */}
      <View style={styles.startedSection}>
        <View style={styles.startedHeaderRow}>
          <Text style={styles.startedTitle}>Started Hunts ({startedItems.length})</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={styles.startNewButton} onPress={handleAddAndStart}>
              <Text style={styles.startNewButtonText}>Start New Hunt</Text>
            </Pressable>
            <Pressable style={styles.completedButton} onPress={() => router.push({ pathname: "/(app)/(drawer)/(tabs)/hunt/MyCompletedHunts" })}>
              <Text style={styles.startNewButtonText}>Completed</Text>
            </Pressable>
          </View>
        </View>
        {startedItems.length === 0 ? (
          <Text style={styles.startedEmpty}>No hunts started yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {startedItems.map((it) => (
              <View key={it.id} style={styles.chip}>
                <Text style={styles.chipText}>{it.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Controls: only delete selected */}
      <View style={styles.controls}>
        <Pressable 
          style={[
            styles.button,
            selectedCount > 0 ? styles.buttonDelete : styles.buttonDisabled,
          ]}
          onPress={handleDeleteSelected}
          accessibilityRole="button"
          accessibilityState={{ disabled: selectedCount === 0 }}
          hitSlop={8}
        >
          <Text style={styles.buttonText}>Delete Selected ({selectedCount})</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.itemList}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.item, selectedItems.has(item.id) && styles.itemSelected]}
            onPress={() => handleToggleSelect(item.id)}
          >
            <View style={styles.checkboxContainer}>
              <Checkbox
                value={item.found}
                onValueChange={() => handleToggleItem(item.id)}
                disabled={!item.started}
              />
            </View>
            <View style={styles.itemDetails}>
              <Text onPress={() => router.push({ pathname: "/(app)/(drawer)/(tabs)/hunt/HuntDetail", params: { id: String(item.id) } })} style={[
                styles.itemName,
                item.found && styles.itemFound
              ]}>
                {item.name}
              </Text>
              {item.description ? (
                <Text style={styles.itemDescription}>{item.description}</Text>
              ) : null}
            </View>
            <Pressable
              style={styles.selectIcon}
              onPress={() => handleToggleSelect(item.id)}
              hitSlop={8}
            >
              <Ionicons
                name={selectedItems.has(item.id) ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={24}
                color={selectedItems.has(item.id) ? '#2563eb' : '#9ca3af'}
              />
            </Pressable>
            <Pressable
              style={[styles.startButton, item.started && styles.startButtonActive]}
              onPress={() => (item.started ? handleEndHunt(item.id) : handleStartHunt(item.id))}
            >
              <Text style={styles.startButtonText}>{item.started ? 'End' : 'Start'}</Text>
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffffff', 
  },
  controls: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  button: {
    backgroundColor: '#4A6FFF', // Vibrant blue
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#4A6FFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    flex: 1,
  },
  buttonActive: {
    backgroundColor: '#FF4757', // Vibrant red
    shadowColor: "#FF4757",
  },
  buttonDelete: {
    backgroundColor: '#dc2626', // Red color for delete
    shadowColor: "#dc2626",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  startedSection: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  startedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  startedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  startedEmpty: {
    color: '#6b7280',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    color: '#3730a3',
    fontWeight: '600',
  },
  startNewButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  completedButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startNewButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'center',
  },
  startButtonActive: {
    backgroundColor: '#f59e0b',
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  itemList: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    padding: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8ECFF', // Light blue border
  },
  itemSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  itemDetails: {
    marginLeft: 12,
    flex: 1,
  },
  selectIcon: {
    marginRight: 10,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  itemFound: {
    textDecorationLine: 'line-through',
    color: '#4A6FFF',
    opacity: 0.7,
  },
  itemDescription: {
    fontSize: 14,
    color: '#5B5B5B',
    marginTop: 4,
    lineHeight: 20,
  },
});

export default ScavengerHunt;
