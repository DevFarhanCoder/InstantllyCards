import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, Image } from "react-native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// fallback for icon visibility
import { FontAwesome5 } from '@expo/vector-icons';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Base height of the bar itself (without the device bottom inset)
  const BASE = Platform.select({ ios: 60, android: 56, default: 56 }) as number;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#9CA3AF",
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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="home" color={focused ? "#D84315" : "#9CA3AF"} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mycards"
        options={{
          title: "My Cards",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="albums" color={focused ? "#4F6AF3" : "#9CA3AF"} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Messaging",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="chatbubbles" color={focused ? "#047857" : "#9CA3AF"} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="vouchers"
        options={{
          title: "Vouchers",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="gift" color={focused ? "#cc7a00" : "#9CA3AF"} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ads" 
        options={{
          title: "Ads",
          tabBarIcon: ({ color, size, focused }) => (
            focused ? (
              <Image 
                source={require('../../assets/images/google-ads-icon.png')}
                style={{ 
                  width: size, 
                  height: size,
                }}
                resizeMode="contain"
              />
            ) : (
              <Image 
                source={require('../../assets/images/Google Ads.png')}
                style={{ 
                  width: size, 
                  height: size,
                }}
                resizeMode="contain"
              />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
