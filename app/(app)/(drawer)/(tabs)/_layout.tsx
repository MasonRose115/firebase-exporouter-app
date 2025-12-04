import { Tabs } from "expo-router";
import React from "react";
import { useNavigation } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons"; // or your icon library
import { Pressable } from "react-native";
import { DrawerActions } from "@react-navigation/native";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

/**
 * TabLayout manages the bottom tab navigation while integrating with a drawer menu.
 * This layout serves as a nested navigation setup where:
 * - The drawer navigation is the parent (defined in the parent layout)
 * - The tab navigation is nested inside the drawer
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        /**
         * Add hamburger menu button to all tab headers by default
         * This is placed in screenOptions to avoid repetition across screens
         * Each screen can override this by setting headerLeft: () => null
         */
        headerLeft: () => (
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={{ marginLeft: 16 }}
          >
            <Ionicons name="menu" size={24} color="black" />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          // Override to remove menu button for this specific screen
          headerLeft: () => null,
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "code-slash" : "code-slash-outline"}
              color={color}
            />
          ),
        }}
      />
       <Tabs.Screen
        name="ScavengerHunt"
        options={{
          headerLeft: () => null,
          title: "Scavenger Hunt",
          tabBarIcon: ({ color }) => (
            <FontAwesome5
              name="crow"
              size={20}
              color={color}
              style={{ marginTop: 2 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scoreboard"
        options={{
          title: "Scoreboard",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "trophy" : "trophy-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="HuntDiscovery"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="hunt"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}
