import Ionicons from "@expo/vector-icons/Ionicons";
import { Slot } from "expo-router";
import { StyleSheet, Image, Text, View } from "react-native";
import PageHeader from "../../../../components/PageHeader";

export default function TabTwoScreen() {
  return (
    <View style={{ flex: 1 }}>
      <PageHeader title="Explore" showBackButton={false} subtitle="" onBackPress={undefined} style={undefined} titleStyle={undefined} />
      <View style={styles.content}>
        <Text>EXPLORE SCREEN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
