import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from "react-native";
import { updateItemName } from "../../../models/ScavSlice";

export default function HuntDetail() {
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch();
  const router = useRouter();

  const item = useSelector((state) => state.scavSlice.items.find((i) => String(i.id) === String(id)));
  const [name, setName] = useState(item?.name ?? "");

  useEffect(() => {
    setName(item?.name ?? "");
  }, [item?.name]);

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

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter a non-empty name.");
      return;
    }
    dispatch(updateItemName({ id: item.id, name: trimmed }));
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Hunt Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter hunt name"
        autoFocus
      />
      <View style={styles.row}>
        <Pressable style={[styles.button, styles.cancel]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.save]} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
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
  cancel: { backgroundColor: "#9ca3af" },
  save: { backgroundColor: "#2563eb" },
  buttonText: { color: "#fff", fontWeight: "700" },
});
