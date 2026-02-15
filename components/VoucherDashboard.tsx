import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import SummaryCard from "./SummaryCard";
import CreditStatisticsCard from "./CreditStatisticsCard";
import NetworkTreeView from "./NetworkTreeView";
import NetworkListView from "./NetworkListView";
import TransferCreditsModal from "./TransferCreditsModal";
import NetworkDetailBottomSheet from "./NetworkDetailBottomSheet";
import CommissionDashboardCard from "./CommissionDashboardCard";
import VoucherList from "./VoucherList";
import DirectBuyersList from "./DirectBuyersList";
import api from "../lib/api";
import {
  CommissionSummary,
  CreditStatistics,
  DirectBuyer,
  NetworkMetrics,
  NetworkUser,
  VoucherItem,
  ViewMode,
} from "../types/network";
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
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    availableCredits: 0,
    totalVouchersTransferred: 0,
    totalNetworkUsers: 0,
    estimatedCommission: 0,
  });
  const [creditStats, setCreditStats] = useState<CreditStatistics>({
    totalCreditReceived: 0,
    totalCreditTransferred: 0,
    totalCreditBalance: 0,
    creditTransferToEachPerson: [],
    creditTransferredReceivedBack: 0,
    activeCredits: 0,
    timers: [],
  });
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary>(
    {
      totalEarned: 0,
      totalWithdrawn: 0,
      availableBalance: 0,
      levelBreakdown: [],
    },
  );
  const [rootUser, setRootUser] = useState<NetworkUser | null>(null);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [directBuyers, setDirectBuyers] = useState<DirectBuyer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const mapTree = (node: any): NetworkUser => {
    const children = (node.directChildren || []).map(mapTree);
    const totalNetworkCount = children.reduce(
      (sum, child) => sum + 1 + child.totalNetworkCount,
      0,
    );

    return {
      id: node.id,
      name: node.name,
      phone: node.phone,
      avatar: undefined,
      creditsReceived: 0,
      level: node.level || 0,
      directChildren: children,
      totalNetworkCount,
      directCount: node.directCount || children.length,
      structuralCreditPool: node.structuralCreditPool,
      joinedDate: node.joinedDate,
      commissionEarned: 0,
      isActive: true,
    };
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        overview,
        creditDashboard,
        commission,
        voucherRes,
        treeRes,
        buyerRes,
      ] = await Promise.all([
        api.get("/mlm/overview"),
        api.get("/mlm/credits/dashboard"),
        api.get("/mlm/commissions/summary"),
        api.get("/mlm/vouchers?limit=20"),
        api.get("/mlm/network/tree?depth=3&perParentLimit=5"),
        api.get("/mlm/network/direct-buyers?limit=10"),
      ]);

      if (overview?.metrics) {
        setMetrics(overview.metrics);
      }

      if (creditDashboard) {
        setCreditStats({
          totalCreditReceived: creditDashboard.totalCreditsReceived || 0,
          totalCreditTransferred: creditDashboard.totalCreditsTransferred || 0,
          totalCreditBalance: creditDashboard.creditBalance || 0,
          creditTransferToEachPerson: creditDashboard.recentTransfers || [],
          creditTransferredReceivedBack: 0,
          activeCredits: creditDashboard.activeCredits || 0,
          timers: creditDashboard.timers || [],
        });
      }

      if (commission?.summary) {
        setCommissionSummary(commission.summary);
      }

      if (treeRes?.tree) {
        setRootUser(mapTree(treeRes.tree));
      }

      if (voucherRes?.vouchers) {
        setVouchers(voucherRes.vouchers);
      }

      if (buyerRes?.buyers) {
        setDirectBuyers(buyerRes.buyers);
      }
    } catch (err: any) {
      console.error("MLM dashboard load error", err);
      setError(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferPress = (user: NetworkUser) => {
    setSelectedRecipient(user);
    setTransferModalVisible(true);
  };

  const handleTransferConfirm = (amount: number, note: string) => {
    if (!selectedRecipient) return;
    api
      .post("/mlm/credits/transfer", {
        receiverId: selectedRecipient.id,
        amount,
        note,
      })
      .then(() => loadDashboard())
      .finally(() => setTransferModalVisible(false));
  };

  const handleViewNetwork = (user: NetworkUser) => {
    setDetailUser(user);
    setBreadcrumb([rootUser?.name || "You", user.name]);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!rootUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No network data available</Text>
      </View>
    );
  }

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
        <SummaryCard metrics={metrics} />

        {/* Credit Statistics Card */}
        <CreditStatisticsCard statistics={creditStats} />

        <CommissionDashboardCard
          summary={commissionSummary}
          onWithdraw={() =>
            api.post("/mlm/withdrawals/request", {
              amount: commissionSummary.availableBalance,
            })
          }
        />

        <VoucherList
          vouchers={vouchers}
          onRedeem={(voucherId) =>
            api.post(`/mlm/vouchers/${voucherId}/redeem`).then(loadDashboard)
          }
        />

        <DirectBuyersList buyers={directBuyers} />

        {/* View Toggle */}
        <ViewToggle />

        {/* Network Visualization */}
        <View style={styles.networkContainer}>
          {viewMode === "list" ? (
            <NetworkListView
              rootUser={rootUser}
              onTransferPress={handleTransferPress}
              onViewNetwork={handleViewNetwork}
            />
          ) : (
            <NetworkTreeView
              rootUser={rootUser}
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
        availableCredits={metrics.availableCredits}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: scaleSize(20),
  },
  loadingText: {
    fontSize: scaleFontSize(16),
    color: "#64748B",
    marginTop: scaleSize(12),
  },
  errorText: {
    fontSize: scaleFontSize(16),
    color: "#EF4444",
    textAlign: "center",
    marginBottom: scaleSize(12),
  },
  retryButton: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(10),
  },
  retryText: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#0F172A",
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
