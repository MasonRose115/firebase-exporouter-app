import { Stack } from "expo-router";

export default function HuntStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: "Edit Hunt" }} />
    </Stack>
  );
}
