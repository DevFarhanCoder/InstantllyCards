import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Linking,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/lib/api";
import FooterCarousel from "@/components/FooterCarousel";
import { scaleFontSize, scaleSize } from "@/lib/responsive";

const { width } = Dimensions.get("window");

interface TransferHistoryItem {
  from: { _id: string; name: string; phone: string };
  to: { _id: string; name: string; phone: string };
  transferredAt: string;
}

interface VoucherHistoryItem {
  _id: string;
  voucherNumber: string;
  MRP: number;
  amount?: number;
  issueDate: string;
  expiryDate: string;
  redeemedStatus: string;
  source: "purchase" | "transfer" | "admin";
  userId?: { _id: string; name: string; phone: string };
  transferredFrom?: { _id: string; name: string; phone: string };
  transferredAt?: string;
  transferHistory?: TransferHistoryItem[];
  companyName?: string;
  createdAt: string;
}

interface VoucherHistorySummary {
  purchased: number;
  received: number;
  sent: number;
  all: VoucherHistoryItem[];
}

export default function VoucherHistoryPage() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<VoucherHistorySummary>({
    purchased: 0,
    received: 0,
    sent: 0,
    all: [],
  });
  const [activeTab, setActiveTab] = useState<
    "all" | "purchased" | "received" | "sent"
  >("all");

  useEffect(() => {
    loadVoucherHistory();
  }, []);

  const loadVoucherHistory = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }

      const response = await api.get("/mlm/vouchers/history?limit=100");

      if (response.success) {
        setHistory(response.history);
      }
    } catch (error: any) {
      console.error("Error loading voucher history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVoucherHistory(true);
  };

  const getFilteredVouchers = () => {
    if (activeTab === "all") return history.all;

    return history.all.filter((v) => {
      if (activeTab === "purchased") return v.source === "purchase";
      if (activeTab === "received") return v.source === "transfer";
      if (activeTab === "sent") {
        // Check if voucher was sent by looking at transfer history
        return v.transferredAt !== undefined;
      }
      return true;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unredeemed":
        return "#10B981";
      case "redeemed":
        return "#6B7280";
      case "expired":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "purchase":
        return "cart";
      case "transfer":
        return "swap-horizontal";
      case "admin":
        return "gift";
      default:
        return "ticket";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "purchase":
        return "#3B82F6";
      case "transfer":
        return "#8B5CF6";
      case "admin":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getTransferRecipient = (voucher: VoucherHistoryItem) => {
    // For sent vouchers, find the transfer recipient from transferHistory
    if (voucher.transferHistory && voucher.transferHistory.length > 0) {
      // Get the last transfer (most recent)
      const lastTransfer =
        voucher.transferHistory[voucher.transferHistory.length - 1];
      return lastTransfer.to;
    }
    return null;
  };

  const renderVoucherItem = (voucher: VoucherHistoryItem, index: number) => {
    const isSentVoucher = activeTab === "sent";
    const transferRecipient = isSentVoucher
      ? getTransferRecipient(voucher)
      : null;
    const contactPerson = isSentVoucher
      ? transferRecipient
      : voucher.transferredFrom;

    return (
      <View key={voucher._id} style={styles.voucherItem}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getSourceColor(voucher.source) + "15" },
          ]}
        >
          <Ionicons
            name={getSourceIcon(voucher.source) as any}
            size={scaleFontSize(24)}
            color={getSourceColor(voucher.source)}
          />
        </View>

        <View style={styles.voucherInfo}>
          <Text style={styles.companyName} numberOfLines={1}>
            {voucher.companyName || "Instantlly"}
          </Text>
          <Text style={styles.voucherNumber}>#{voucher.voucherNumber}</Text>
          <Text style={styles.voucherMRP}>
            MRP ₹{voucher.amount || voucher.MRP}
          </Text>
          {contactPerson && (
            <Text style={styles.transferInfo}>
              {isSentVoucher ? "Sent to" : "Received from"} {contactPerson.name}
            </Text>
          )}
          <Text style={styles.voucherDate}>
            {new Date(voucher.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          {contactPerson && contactPerson.phone ? (
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(contactPerson.phone)}
            >
              <Ionicons name="call" size={scaleFontSize(18)} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(voucher.redeemedStatus) },
              ]}
            >
              <Text style={styles.statusText}>
                {voucher.redeemedStatus === "unredeemed"
                  ? "Active"
                  : voucher.redeemedStatus}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={scaleFontSize(24)}
            color="#1F2937"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voucher History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="cart" size={scaleFontSize(22)} color="#3B82F6" />
          <Text style={styles.summaryValue}>{history.purchased}</Text>
          <Text style={styles.summaryLabel}>Purchased</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons
            name="arrow-down"
            size={scaleFontSize(22)}
            color="#8B5CF6"
          />
          <Text style={styles.summaryValue}>{history.received}</Text>
          <Text style={styles.summaryLabel}>Received</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="arrow-up" size={scaleFontSize(22)} color="#F59E0B" />
          <Text style={styles.summaryValue}>{history.sent}</Text>
          <Text style={styles.summaryLabel}>Sent</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["all", "purchased", "received", "sent"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Vouchers List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {getFilteredVouchers().length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="ticket-outline"
              size={scaleFontSize(64)}
              color="#D1D5DB"
            />
            <Text style={styles.emptyTitle}>No Vouchers</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "all"
                ? "Your voucher history will appear here"
                : `No ${activeTab} vouchers found`}
            </Text>
          </View>
        ) : (
          getFilteredVouchers().map((voucher, index) =>
            renderVoucherItem(voucher, index),
          )
        )}
      </ScrollView>

      <FooterCarousel />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: scaleFontSize(16),
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(14),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: scaleSize(40),
    height: scaleSize(40),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: "700",
    color: "#1F2937",
  },
  placeholder: {
    width: scaleSize(40),
  },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(16),
    gap: scaleSize(10),
    flexWrap: "wrap",
  },
  summaryCard: {
    flex: 1,
    minWidth: scaleSize(100),
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(12),
    padding: scaleSize(12),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryValue: {
    fontSize: scaleFontSize(22),
    fontWeight: "700",
    color: "#1F2937",
    marginTop: scaleSize(6),
  },
  summaryLabel: {
    fontSize: scaleFontSize(11),
    color: "#6B7280",
    marginTop: scaleSize(4),
  },
  tabsContainer: {
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
  },
  tab: {
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(8),
    borderRadius: scaleSize(18),
    marginRight: scaleSize(8),
    backgroundColor: "#FFFFFF",
  },
  activeTab: {
    backgroundColor: "#3B82F6",
  },
  tabText: {
    fontSize: scaleFontSize(13),
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: scaleSize(16),
    paddingTop: scaleSize(8),
    paddingBottom: scaleSize(120),
  },
  voucherItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(12),
    padding: scaleSize(14),
    marginBottom: scaleSize(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "flex-start",
  },
  iconContainer: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: scaleSize(22),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(10),
    marginTop: scaleSize(2),
  },
  voucherInfo: {
    flex: 1,
    paddingRight: scaleSize(8),
  },
  companyName: {
    fontSize: scaleFontSize(17),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: scaleSize(3),
  },
  voucherNumber: {
    fontSize: scaleFontSize(13),
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: scaleSize(3),
  },
  voucherMRP: {
    fontSize: scaleFontSize(15),
    fontWeight: "700",
    color: "#10B981",
    marginBottom: scaleSize(4),
  },
  voucherDetails: {
    fontSize: scaleFontSize(14),
    color: "#6B7280",
    marginTop: scaleSize(4),
  },
  transferInfo: {
    fontSize: scaleFontSize(12),
    color: "#8B5CF6",
    marginBottom: scaleSize(4),
    fontStyle: "italic",
  },
  voucherDate: {
    fontSize: scaleFontSize(11),
    color: "#9CA3AF",
  },
  actionContainer: {
    justifyContent: "center",
    alignItems: "center",
    minWidth: scaleSize(70),
  },
  callButton: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: scaleSize(22),
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(12),
    minWidth: scaleSize(60),
    alignItems: "center",
  },
  statusText: {
    fontSize: scaleFontSize(11),
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleSize(50),
    paddingHorizontal: scaleSize(20),
  },
  emptyTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#1F2937",
    marginTop: scaleSize(16),
  },
  emptySubtitle: {
    fontSize: scaleFontSize(13),
    color: "#6B7280",
    marginTop: scaleSize(8),
    textAlign: "center",
    paddingHorizontal: scaleSize(20),
  },
});
