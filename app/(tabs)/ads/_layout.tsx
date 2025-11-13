import { Stack } from "expo-router";
import React from "react";

export default function AdsStackLayout() {
  return (
    <Stack>
      {/* 1. index.tsx: The main screen of the tab 
        The Tabs navigator will show this screen when the "Ads" tab is selected.
      */}
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Advertisements",
          headerShown: true, // You probably want a header inside the stack
        }}
      />
      
      {/* 2. adswithoutchannel.tsx: The hidden sub-screen 
        This is now navigable as part of the Ads stack, but not visible in the bottom tab bar.
      */}
      <Stack.Screen
        name="adswithoutchannel"
        options={{
          headerTitle: "Advertisements",
          headerShown: true,
          // Hide the back arrow on this screen
          headerBackVisible: false,
          // For older versions of react-navigation, you can also use:
          // headerLeft: () => null,
        }}
      />
    </Stack>
  );

}