import React, { useState } from "react";
import { StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FooterCarousel from "../../components/FooterCarousel";
import VoucherListScreen from "../../components/VoucherListScreen";
import VoucherDetailScreen from "../../components/VoucherDetailScreen";
import VoucherDashboard from "../../components/VoucherDashboard";

interface Voucher {
  _id: string;
  voucherNumber: string;
  MRP: number;
  issueDate: string;
  expiryDate: string;
  redeemedStatus: "unredeemed" | "redeemed" | "expired";
  voucherImages?: string[];
}

type ScreenState = "list" | "detail" | "dashboard";

export default function VouchersScreen() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>("list");
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const handleVoucherSelect = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setCurrentScreen("detail");
  };

  const handleContinueToDashboard = () => {
    setCurrentScreen("dashboard");
  };

  const handleBackToList = () => {
    setCurrentScreen("list");
    setSelectedVoucher(null);
  };

  const handleBackToDetail = () => {
    setCurrentScreen("detail");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "list":
        return <VoucherListScreen onVoucherSelect={handleVoucherSelect} />;

      case "detail":
        return selectedVoucher ? (
          <VoucherDetailScreen
            voucher={selectedVoucher}
            onContinue={handleContinueToDashboard}
            onBack={handleBackToList}
          />
        ) : null;

      case "dashboard":
        return <VoucherDashboard onBack={handleBackToDetail} />;

      default:
        return <VoucherListScreen onVoucherSelect={handleVoucherSelect} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
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
