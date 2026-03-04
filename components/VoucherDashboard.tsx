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
import { router } from "expo-router";
import SummaryCard from "./SummaryCard";
import VoucherStatsCard from "./VoucherStatsCard";
import NetworkTreeView from "./NetworkTreeView";
import NetworkListView from "./NetworkListView";
import TransferCreditsModal from "./TransferCreditsModal";
import SpecialCreditsTransferModal from "./SpecialCreditsTransferModal";
import VoucherTransferModal from "./VoucherTransferModal";
import NetworkDetailBottomSheet from "./NetworkDetailBottomSheet";
import DiscountDashboardCard from "./DiscountDashboardCard";
import VoucherList from "./VoucherList";
import DirectBuyersList from "./DirectBuyersList";
import BuyVoucherScreen from "./BuyVoucherScreen";
import DistributionCreditsTable from "./DistributionCreditsTable";
import api from "../lib/api";
import {
  DiscountSummary,
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
  voucherId?: string;
}

export default function VoucherDashboard({
  onBack,
  voucherId,
}: VoucherDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [specialTransferModalVisible, setSpecialTransferModalVisible] =
    useState(false);
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(
    null,
  );
  const [selectedSlotCredits, setSelectedSlotCredits] = useState<number>(0);
  const [voucherTransferModalVisible, setVoucherTransferModalVisible] =
    useState(false);
  const [selectedRecipient, setSelectedRecipient] =
    useState<NetworkUser | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(
    null,
  );
  const [detailSheetVisible, setDetailSheetVisible] = useState(false);
  const [detailUser, setDetailUser] = useState<NetworkUser | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [showBuyVoucherScreen, setShowBuyVoucherScreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    availableCredits: 0,
    totalVouchersTransferred: 0,
    totalNetworkUsers: 0,
    virtualCommission: 0,
    currentDiscountPercent: 0,
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
  const [discountSummary, setDiscountSummary] = useState<DiscountSummary>({
    currentLevel: 1,
    discountPercent: 40,
    payableAmount: 3600,
    virtualCommission: 0,
    disclaimer:
      "This amount represents savings unlocked via discounts and is not withdrawable.",
  });
  const [rootUser, setRootUser] = useState<NetworkUser | null>(null);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [directBuyers, setDirectBuyers] = useState<DirectBuyer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMLMUser, setIsMLMUser] = useState(false); // Track if user came via introducer
  const [distributionCredits, setDistributionCredits] = useState<any[]>([]); // Credits to be transferred
  const [isVoucherAdmin, setIsVoucherAdmin] = useState(false); // Track if user is voucher admin
  const [hasSpecialCredits, setHasSpecialCredits] = useState(false); // Track if user has special credits slots
  const [specialCredits, setSpecialCredits] = useState<any>(null); // Special credits data for admin
  const [networkSlots, setNetworkSlots] = useState<any[]>([]); // Network slots with placeholders

  useEffect(() => {
    loadDashboard();
  }, [voucherId]);

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
        discount,
        voucherRes,
        userProfile,
        distributionRes,
        treeRes,
        buyerRes,
      ] = await Promise.all([
        api.get("/mlm/overview"),
        api.get("/mlm/credits/dashboard"),
        api.get("/mlm/discount/summary"),
        api.get("/mlm/vouchers?limit=20"),
        api.get("/users/profile"),
        api.get("/mlm/distribution-credits"),
        api.get("/mlm/network/tree?depth=3&perParentLimit=5"),
        api.get("/mlm/network/direct-buyers?limit=10"),
      ]);

      // Check if user is voucher admin from overview
      const isAdmin = overview?.user?.isVoucherAdmin === true;
      setIsVoucherAdmin(isAdmin);

      // Check if user has special credits (slots > 0)
      const userHasSpecialCredits =
        overview?.user?.specialCredits?.availableSlots > 0;
      setHasSpecialCredits(userHasSpecialCredits);

      let specialCreditsData = null;
      let networkSlotsData = null;

      // When a specific voucher is selected, ALWAYS load per-voucher data
      // for ALL users — ensures every voucher shows its own isolated stats (zeros for new vouchers)
      if (isAdmin || userHasSpecialCredits || voucherId) {
        try {
          const voucherParam = voucherId ? `?voucherId=${voucherId}` : "";
          const [specialCreditsRes, networkSlotsRes] = await Promise.all([
            api.get(`/mlm/special-credits/dashboard${voucherParam}`),
            api.get(`/mlm/special-credits/network${voucherParam}`),
          ]);

          if (specialCreditsRes?.dashboard) {
            specialCreditsData = specialCreditsRes.dashboard;
            setSpecialCredits(specialCreditsData);
          }

          if (networkSlotsRes?.networkUsers) {
            networkSlotsData = networkSlotsRes.networkUsers;
            setNetworkSlots(networkSlotsData);
          }
        } catch (err) {
          console.error("Special credits load error", err);
        }
      }

      if (voucherId) {
        // Per-voucher mode: always show isolated data for THIS voucher only.
        // Regular users with no slots assigned for this voucher see zeros + buy screen.
        const totalSlotsForVoucher = specialCreditsData?.slots?.total ?? 0;
        if (!isAdmin && totalSlotsForVoucher === 0) {
          setShowBuyVoucherScreen(true);
        }
        setMetrics({
          availableCredits: specialCreditsData?.specialCredits?.balance ?? 0,
          totalVouchersTransferred:
            specialCreditsData?.specialCredits?.totalSent ?? 0,
          totalNetworkUsers: specialCreditsData?.slots?.used ?? 0,
          virtualCommission:
            specialCreditsData?.specialCredits?.totalSent ?? 0,
          currentDiscountPercent: 0,
          vouchersFigure: specialCreditsData?.vouchersFigure ?? 0,
        });
      } else if (overview?.metrics) {
        // No specific voucher — global view (original behaviour)
        if ((isAdmin || userHasSpecialCredits) && specialCreditsData) {
          setMetrics({
            availableCredits:
              specialCreditsData.specialCredits?.balance || 0,
            totalVouchersTransferred:
              specialCreditsData.specialCredits?.totalSent || 0,
            totalNetworkUsers: specialCreditsData.slots?.used || 0,
            virtualCommission:
              specialCreditsData.specialCredits?.totalSent || 0,
            currentDiscountPercent: 0,
            vouchersFigure:
              specialCreditsData.vouchersFigure ||
              overview.metrics?.vouchersFigure ||
              0,
          });
        } else {
          setMetrics(overview.metrics);
        }
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

      if (discount?.summary) {
        setDiscountSummary(discount.summary);
      }

      if (treeRes?.tree) {
        setRootUser(mapTree(treeRes.tree));
      }

      // For users with special credits, override with network slots
      if (
        (isAdmin || userHasSpecialCredits) &&
        networkSlotsData &&
        networkSlotsData.length > 0
      ) {
        // Create a root user node with slot children
        // Filter out placeholders - only show actual users who received credits
        const actualUsers = networkSlotsData.filter(
          (slot: any) => !slot.isPlaceholder && slot.name,
        );

        const rootNode: NetworkUser = {
          id: overview?.user?.id || "user",
          name: overview?.user?.name || "User",
          phone: overview?.user?.phone || "",
          avatar: undefined,
          creditsReceived: 0,
          level: overview?.user?.level || 1,
          directChildren: actualUsers.map((slot: any) => ({
            id: slot.id || `user-${slot.slotNumber}`,
            name: slot.name,
            phone: slot.phone || "Not assigned",
            avatar: undefined,
            creditsReceived: slot.credits || 0, // Use 'credits' field from backend
            level: slot.recipientLevel || slot.level || 1,
            directChildren: [],
            totalNetworkCount: 0,
            directCount: 0,
            joinedDate: slot.sentAt || new Date().toISOString(),
            commissionEarned: 0,
            isActive: true,
            isPlaceholder: false,
          })),
          totalNetworkCount: actualUsers.length,
          directCount: actualUsers.length,
          joinedDate: overview?.user?.createdAt || new Date().toISOString(),
          commissionEarned: 0,
          isActive: true,
        };
        setRootUser(rootNode);
      }

      if (voucherRes?.vouchers) {
        setVouchers(voucherRes.vouchers);
      } else {
        setVouchers([]);
      }

      // Check if user is MLM user (came via introducer)
      if (userProfile?.user?.introducerId) {
        setIsMLMUser(true);
      }

      // Load distribution credits
      if (distributionRes?.credits) {
        setDistributionCredits(distributionRes.credits);
      }

      if (buyerRes?.buyers) {
        setDirectBuyers(buyerRes.buyers);
      }
    } catch (err: any) {
      console.error("MLM dashboard load error", err);
      setError(err?.message || "Failed to load dashboard");
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferPress = (user: NetworkUser) => {
    // For users with special credits (admin OR regular users with slots) clicking placeholder slots
    if ((isVoucherAdmin || hasSpecialCredits) && user.isPlaceholder) {
      // Extract slot number from name (e.g., "User 1" -> 1)
      const match = user.name.match(/User (\d+)/);
      const slotNumber = match ? parseInt(match[1]) : user.level;
      setSelectedSlotNumber(slotNumber);
      setSelectedSlotCredits(user.creditsReceived || 0);
      setSpecialTransferModalVisible(true);
    } else {
      // Regular transfer modal for non-placeholder users
      setSelectedRecipient(user);
      setTransferModalVisible(true);
    }
  };

  const handleBuyerTransferCredits = async (buyerId: string) => {
    try {
      const buyer = directBuyers.find((b) => b.id === buyerId);
      if (!buyer) return;

      // Show transfer modal for the buyer
      setSelectedRecipient({
        id: buyer.id,
        name: buyer.name,
        phone: buyer.phone,
        level: 1,
        directChildren: [],
        totalNetworkCount: 0,
        creditsReceived: 0,
        joinedDate: "",
        isActive: true,
      });
      setTransferModalVisible(true);
    } catch (error: any) {
      console.error("Buyer credit transfer error:", error);
    }
  };

  const handleBuyerTransferVouchers = async (buyerId: string) => {
    try {
      const buyer = directBuyers.find((b) => b.id === buyerId);
      if (!buyer) return;

      if (isVoucherAdmin) {
        // Admin can transfer vouchers to anyone - use admin transfer
        handleAdminVoucherTransfer();
      } else {
        // Find an unredeemed voucher to transfer (exclude special voucher)
        const unredeemedVoucher = vouchers.find(
          (v) =>
            v.redeemedStatus === "unredeemed" &&
            v._id !== "instantlly-special-credits" &&
            !v.isSpecialCreditsVoucher,
        );

        if (!unredeemedVoucher) {
          // No vouchers available - this is normal, just return silently
          return;
        }

        // Set the voucher and show voucher transfer modal
        setSelectedVoucher(unredeemedVoucher);
        setVoucherTransferModalVisible(true);
      }
    } catch (error: any) {
      console.error("Buyer voucher transfer error:", error);
    }
  };

  const handleDistributionTransfer = async (
    recipientId: string,
    amount: number,
  ) => {
    try {
      await api.post("/mlm/credits/transfer", {
        receiverId: recipientId,
        amount,
        note: "Distribution credit transfer",
      });
      await loadDashboard();
    } catch (error: any) {
      console.error("Distribution transfer error:", error);
    }
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

  const handleSpecialCreditsTransfer = async (phone: string) => {
    try {
      await api.post("/mlm/special-credits/send", {
        recipientPhone: phone,
        slotNumber: selectedSlotNumber,
      });
      await loadDashboard();
      setSpecialTransferModalVisible(false);
    } catch (error: any) {
      console.error("Special credits transfer error:", error);
      throw error; // Re-throw to let modal handle error display
    }
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

  const handleVoucherTransfer = (voucher: VoucherItem) => {
    setSelectedVoucher(voucher);
    setVoucherTransferModalVisible(true);
  };

  const handleAdminVoucherTransfer = () => {
    // For admin, create a virtual voucher object to open the modal
    const adminVoucher: VoucherItem = {
      _id: "admin-voucher-transfer",
      voucherNumber: "ADMIN-TRANSFER",
      MRP: 1200,
      issueDate: new Date().toISOString(),
      expiryDate: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      redeemedStatus: "unredeemed",
      isSpecialCreditsVoucher: true,
    };
    setSelectedVoucher(adminVoucher);
    setVoucherTransferModalVisible(true);
  };

  const handleVoucherTransferConfirm = async (
    voucherId: string,
    recipientPhone: string,
    quantity: number,
  ) => {
    try {
      // If admin is transferring, use special endpoint to create vouchers
      if (isVoucherAdmin && voucherId === "admin-voucher-transfer") {
        await api.post(`/mlm/vouchers/admin-transfer`, {
          recipientPhone,
          quantity,
        });
      } else {
        // Regular user transferring their own voucher
        await api.post(`/mlm/vouchers/${voucherId}/transfer`, {
          recipientPhone,
          quantity,
        });
      }
      await loadDashboard();
      setVoucherTransferModalVisible(false);
    } catch (error: any) {
      console.error("Voucher transfer error:", error);
      throw error; // Re-throw to let modal handle error display
    }
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
  // Show Buy Voucher Screen if navigated
  if (showBuyVoucherScreen) {
    return (
      <BuyVoucherScreen
        onBack={() => setShowBuyVoucherScreen(false)}
        onSuccess={loadDashboard}
      />
    );
  }

  const availableVouchers = vouchers.filter(
    (v) => !v.redeemedStatus || v.redeemedStatus === "unredeemed",
  ).length;
  const redeemedVouchers = vouchers.filter(
    (v) => v.redeemedStatus === "redeemed",
  ).length;

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
              {isVoucherAdmin
                ? "Sales Target at Special Discount"
                : "5× Referral Credit Distribution"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => router.push("/referral/credits-history")}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={20} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Network Overview Stats */}
        <SummaryCard metrics={metrics} isVoucherAdmin={isVoucherAdmin} />

        {/* Voucher Stats Card - Clickable to Buy - HIDDEN for Admin and Special Credits Users */}
        {!isVoucherAdmin && !hasSpecialCredits && (
          <VoucherStatsCard
            totalVouchers={vouchers.length}
            availableVouchers={availableVouchers}
            redeemedVouchers={redeemedVouchers}
            onBuyNowPress={() => setShowBuyVoucherScreen(true)}
          />
        )}

        {/* Distribution Credits Table - Only for MLM users */}
        {isMLMUser && distributionCredits.length > 0 && (
          <DistributionCreditsTable
            credits={distributionCredits}
            onTransfer={handleDistributionTransfer}
          />
        )}

        {/* Discount Dashboard - HIDDEN for Admin */}
        {!isVoucherAdmin && <DiscountDashboardCard summary={discountSummary} />}

        {/* Voucher List - COMPLETELY HIDDEN */}
        {/* Removed as per requirements */}

        {/* Direct Buyers - Only show if there are buyers */}
        {directBuyers && directBuyers.length > 0 && (
          <DirectBuyersList
            buyers={directBuyers}
            onTransferCredits={handleBuyerTransferCredits}
            onTransferVouchers={handleBuyerTransferVouchers}
            onTransfer={isVoucherAdmin ? handleAdminVoucherTransfer : undefined}
          />
        )}

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

      {/* Special Credits Transfer Modal - For Admin */}
      <SpecialCreditsTransferModal
        visible={specialTransferModalVisible}
        slotNumber={selectedSlotNumber}
        creditAmount={selectedSlotCredits}
        onClose={() => setSpecialTransferModalVisible(false)}
        onConfirm={handleSpecialCreditsTransfer}
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

      {/* Voucher Transfer Modal */}
      <VoucherTransferModal
        visible={voucherTransferModalVisible}
        voucher={selectedVoucher}
        onClose={() => setVoucherTransferModalVisible(false)}
        onConfirm={handleVoucherTransferConfirm}
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
  headerActions: {
    flexDirection: "row",
    gap: scaleSize(8),
  },
  historyButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: scaleSize(10),
    padding: scaleSize(10),
    justifyContent: "center",
    alignItems: "center",
  },
  transferVoucherButton: {
    borderRadius: scaleSize(12),
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  transferVoucherGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: scaleSize(14),
    paddingVertical: scaleSize(10),
  },
  transferVoucherText: {
    fontSize: scaleFontSize(13),
    fontWeight: "700",
    color: "#FFFFFF",
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
