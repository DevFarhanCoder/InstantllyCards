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
<<<<<<< Updated upstream
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "600",
          },
=======
>>>>>>> Stashed changes
        }}
      />
      
      <Stack.Screen
        name="adswithoutchannel"
        options={{
          headerTitle: "Advertisements",
          headerShown: true,
          headerBackVisible: false,
<<<<<<< Updated upstream
          headerRight: () => <HeaderRight />,
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "600",
          },
          // For older versions of react-navigation, you can also use:
          // headerLeft: () => null,
=======
>>>>>>> Stashed changes
        }}
      />
    </Stack>
  );
<<<<<<< Updated upstream

}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    gap: 8,
    marginRight: 8,
    alignItems: "center",
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  coinIcon: {
    fontSize: 14,
  },
  creditNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  transferIcon: {
    fontSize: 18,
    color: "#EF4444",
  },
  transferLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF4444",
  },
});
=======
}
>>>>>>> Stashed changes
