import React, { useState } from "react";
import { View, StyleSheet, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FooterCarousel from "../../components/FooterCarousel";
import VoucherScratchCard from "../../components/VoucherScratchCard";
import VoucherDashboard from "../../components/VoucherDashboard";

export default function VouchersScreen() {
  const [showDashboard, setShowDashboard] = useState(false);

  if (showDashboard) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        <VoucherDashboard onBack={() => setShowDashboard(false)} />
        <FooterCarousel />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <VoucherScratchCard onContinue={() => setShowDashboard(true)} />
      <FooterCarousel />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
