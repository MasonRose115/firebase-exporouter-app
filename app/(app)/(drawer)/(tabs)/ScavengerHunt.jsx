import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import CheckBox from "@react-native-community/checkbox";
import { toggleItemFound, startHunt, endHunt, resetHunt, addItem } from "../../models/ScavSlice";

const ScavengerHunt = () => {
  const dispatch = useDispatch();
  const { items, totalFound, isHuntActive } = useSelector((state) => state.scavSlice);
  const [newItemName, setNewItemName] = useState("");

  // Calculate progress percentage
  const progress = items.length > 0 ? (totalFound / items.length) * 100 : 0;

  const handleToggleItem = (itemId) => {
    dispatch(toggleItemFound(itemId));
  };

  const handleStartHunt = () => {
    dispatch(startHunt());
  };

  const handleEndHunt = () => {
    dispatch(endHunt());
  };

  const handleResetHunt = () => {
    dispatch(resetHunt());
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scavenger Hunt</Text>
        <Text style={styles.progress}>
          Progress: {totalFound} / {items.length} ({Math.round(progress)}%)
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={[styles.button, isHuntActive && styles.buttonActive]}
          onPress={isHuntActive ? handleEndHunt : handleStartHunt}
        >
          <Text style={styles.buttonText}>
            {isHuntActive ? "End Hunt" : "Start Hunt"}
          </Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleResetHunt}>
          <Text style={styles.buttonText}>Reset Hunt</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.itemList}>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <CheckBox
              disabled={!isHuntActive}
              value={item.found}
              onValueChange={() => handleToggleItem(item.id)}
            />
            <View style={styles.itemDetails}>
              <Text style={[
                styles.itemName,
                item.found && styles.itemFound
              ]}>
                {item.name}
              </Text>
              {item.description ? (
                <Text style={styles.itemDescription}>{item.description}</Text>
              ) : null}
            </View>
          </View>
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
  header: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  progress: {
    fontSize: 16,
    color: '#5B5B5B',
    fontWeight: '500',
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
  itemDetails: {
    marginLeft: 12,
    flex: 1,
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
