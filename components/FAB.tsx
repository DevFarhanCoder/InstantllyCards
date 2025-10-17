import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SIZE = 64;
const AD_HEIGHT = 100; // Height of the ad section
const SPACING = 16; // Decent spacing above the ad

export default function FAB() {
  const tabH = useBottomTabBarHeight();          // actual measured bar height
  const insets = useSafeAreaInsets();

  // Place the FAB just above the ad with decent spacing
  const bottom = AD_HEIGHT + SPACING;

  return (
    <Pressable
      onPress={() => router.push("/builder")}
      style={[styles.btn, { right: 18, bottom }]}
      accessibilityRole="button"
      accessibilityLabel="Create card"
    >
      <Text style={styles.plus}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "#5476FB",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 50,
  },
  plus: { color: "white", fontSize: 36, lineHeight: 36, fontWeight: "800" },
});
