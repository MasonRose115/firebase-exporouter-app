import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

/**
 * DrawerLayout configures the drawer (side menu) navigation.
 * This wraps the tab navigation, allowing users to access the drawer
 * from any tab screen via the hamburger menu icon.
 */
export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: false, // Let tabs handle their own headers
          drawerStyle: {
            backgroundColor: "#fff",
            width: 280,
          },
          drawerActiveTintColor: "#2563eb",
          drawerInactiveTintColor: "#6b7280",
          drawerLabelStyle: {
            fontSize: 16,
            fontWeight: "500",
          },
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: "Home",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="../myActiveHunts"
          options={{
            drawerLabel: "My Active Hunts",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="compass" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Profile"
          options={{
            drawerLabel: "Profile",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
