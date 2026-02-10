import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import SummaryCard from "./SummaryCard";
import CreditStatisticsCard from "./CreditStatisticsCard";
import NetworkTreeView from "./NetworkTreeView";
import NetworkListView from "./NetworkListView";
import TransferCreditsModal from "./TransferCreditsModal";
import NetworkDetailBottomSheet from "./NetworkDetailBottomSheet";
import {
  mockRootUser,
  mockMetrics,
  mockCreditStatistics,
} from "../utils/mockNetworkData";
import { NetworkUser, ViewMode } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface VoucherDashboardProps {
  onBack: () => void;
}

export default function VoucherDashboard({ onBack }: VoucherDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedRecipient, setSelectedRecipient] =
    useState<NetworkUser | null>(null);
  const [detailSheetVisible, setDetailSheetVisible] = useState(false);
  const [detailUser, setDetailUser] = useState<NetworkUser | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);

  const handleTransferPress = (user: NetworkUser) => {
    setSelectedRecipient(user);
    setTransferModalVisible(true);
  };

  const handleTransferConfirm = (amount: number, note: string) => {
    // In real app, this would call an API
    console.log(`Transferring ${amount} credits to ${selectedRecipient?.name}`);
    console.log(`Note: ${note}`);
    setTransferModalVisible(false);
    // Could show success toast here
  };

  const handleViewNetwork = (user: NetworkUser) => {
    setDetailUser(user);
    setBreadcrumb([mockRootUser.name, user.name]);
    setDetailSheetVisible(true);
  };

  const handleUserSelectInSheet = (
    user: NetworkUser,
    newBreadcrumb: string[],
  ) => {
    setDetailUser(user);
    setBreadcrumb(newBreadcrumb);
  };

  const ViewToggle = () => {
    const slideAnim = React.useRef(
      new Animated.Value(viewMode === "list" ? 0 : 1),
    ).current;

    React.useEffect(() => {
      Animated.spring(slideAnim, {
        toValue: viewMode === "list" ? 0 : 1,
        useNativeDriver: true,
      }).start();
    }, [viewMode]);

    return (
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === "list" && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode("list")}
        >
          <Ionicons
            name="list"
            size={20}
            color={viewMode === "list" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={[
              styles.toggleButtonText,
              viewMode === "list" && styles.toggleButtonTextActive,
            ]}
          >
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === "tree" && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode("tree")}
        >
          <Ionicons
            name="git-network"
            size={20}
            color={viewMode === "tree" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={[
              styles.toggleButtonText,
              viewMode === "tree" && styles.toggleButtonTextActive,
            ]}
          >
            Tree
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#FFFFFF", "#F9FAFB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Vouchers & Network</Text>
            <Text style={styles.headerSubtitle}>
              5× Referral Credit Distribution
            </Text>
          </View>
          <TouchableOpacity style={styles.infoButton}>
            <Ionicons
              name="information-circle-outline"
              size={28}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <SummaryCard metrics={mockMetrics} />

        {/* Credit Statistics Card */}
        <CreditStatisticsCard statistics={mockCreditStatistics} />

        {/* View Toggle */}
        <ViewToggle />

        {/* Network Visualization */}
        <View style={styles.networkContainer}>
          {viewMode === "list" ? (
            <NetworkListView
              rootUser={mockRootUser}
              onTransferPress={handleTransferPress}
              onViewNetwork={handleViewNetwork}
            />
          ) : (
            <NetworkTreeView
              rootUser={mockRootUser}
              onTransferPress={handleTransferPress}
              onViewNetwork={handleViewNetwork}
            />
          )}
        </View>
      </ScrollView>

      {/* Transfer Credits Modal */}
      <TransferCreditsModal
        visible={transferModalVisible}
        recipient={selectedRecipient}
        availableCredits={mockMetrics.availableCredits}
        onClose={() => setTransferModalVisible(false)}
        onConfirm={handleTransferConfirm}
      />

      {/* Network Detail Bottom Sheet */}
      <NetworkDetailBottomSheet
        visible={detailSheetVisible}
        user={detailUser}
        breadcrumb={breadcrumb}
        onClose={() => setDetailSheetVisible(false)}
        onUserSelect={handleUserSelectInSheet}
        onTransferPress={handleTransferPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(16),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: scaleSize(4),
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: scaleSize(12),
  },
  headerTitle: {
    fontSize: scaleFontSize(22),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: scaleFontSize(14),
    color: "#6B7280",
  },
  infoButton: {
    padding: scaleSize(4),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scaleSize(20),
    paddingBottom: scaleSize(100),
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: scaleSize(12),
    padding: scaleSize(4),
    marginBottom: scaleSize(20),
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleSize(12),
    borderRadius: scaleSize(10),
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#10B981",
  },
  toggleButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
  },
  networkContainer: {
    flex: 1,
    minHeight: scaleSize(400),
  },
});
