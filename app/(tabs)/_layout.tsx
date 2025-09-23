import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Base height of the bar itself (without the device bottom inset)
  const BASE = Platform.select({ ios: 60, android: 56, default: 56 }) as number;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4F6AF3",
        tabBarStyle: {
          // <-- critical: include the device bottom inset so it never overlaps the system bar
          height: BASE + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(8, insets.bottom),
          backgroundColor: "#fff",
          borderTopWidth: 0.5,
          borderTopColor: "#E5E7EB",
        },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mycards"
        options={{
          title: "My Cards",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Messaging",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
