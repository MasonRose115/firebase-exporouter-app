import { Stack } from "expo-router";

export default function HuntStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: "Edit Hunt" }} />
      <Stack.Screen name="HuntDetail" options={{ title: "Hunt Details" }} />
      <Stack.Screen name="MyCompletedHunts" options={{ title: "My Completed Hunts" }} />
      <Stack.Screen name="ReviewHunt" options={{ title: "Review Hunt" }} />
    </Stack>
  );
}
