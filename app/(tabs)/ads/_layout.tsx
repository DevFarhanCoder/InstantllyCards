import { Stack, useRouter } from "expo-router";
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";

// Custom header with icons
const HeaderRight = () => {
  const router = useRouter();

  const handleCredits = () => {
    router.push("/credits");
  };

  const handleTransfer = () => {
    router.push("/transfer");
  };

  return (
    <View style={styles.headerRight}>
      <TouchableOpacity 
        style={styles.transferButton} 
        onPress={handleTransfer}
        activeOpacity={0.7}
      >
        <Text style={styles.transferIcon}>⇄</Text>
        <Text style={styles.transferLabel}>Transfer</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function AdsStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Advertisements",
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="adquestionnaire"
        options={{
          headerTitle: "Ad Preferences",
          headerShown: true,
          headerBackVisible: true,
        }}
      />
      
      <Stack.Screen
        name="adswithoutchannel"
        options={{
          headerTitle: "Create Advertisement",
          headerShown: true,
          headerBackVisible: true,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  transferIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  transferLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
