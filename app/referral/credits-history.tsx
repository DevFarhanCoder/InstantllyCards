import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { scaleFontSize, scaleSize } from "@/lib/responsive";
import api from "@/lib/api";
import { formatAmount } from "@/utils/formatNumber";

interface TransferItem {
  type: "special_credit" | "voucher";
  direction: "sent" | "received";
  amount?: number;
  totalAmount?: number;
  count?: number;
  voucherNumber?: string;
  voucherNumbers?: string[];
  companyName?: string;
  sender?: {
    id: string;
    name: string;
    phone: string;
  };
  recipient?: {
    id: string;
    name: string;
    phone: string;
  };
  slotNumber?: number;
  transferredAt: string;
  source?: string;
}

interface TransferHistory {
  all: TransferItem[];
  specialCredits: {
    sent: TransferItem[];
    received: TransferItem[];
  };
  vouchers: {
    sent: TransferItem[];
    received: TransferItem[];
  };
  summary: {
    specialCreditsSent: number;
    specialCreditsReceived: number;
    vouchersSent: number;
    vouchersReceived: number;
    totalTransfers: number;
  };
}

export default function TransferHistoryPage() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<TransferHistory>({
    all: [],
    specialCredits: { sent: [], received: [] },
    vouchers: { sent: [], received: [] },
    summary: {
      specialCreditsSent: 0,
      specialCreditsReceived: 0,
      vouchersSent: 0,
      vouchersReceived: 0,
      totalTransfers: 0,
    },
  });
  const [activeTab, setActiveTab] = useState<"all" | "credits" | "vouchers">(
    "all",
  );

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }

      const response = await api.get("/mlm/transfer-history?limit=100");

      if (response.success) {
        setHistory(response.history);
      }
    } catch (error: any) {
      console.error("Error loading transfer history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory(true);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getFilteredTransfers = () => {
    if (activeTab === "all") return history.all;
    if (activeTab === "credits")
      return [
        ...history.specialCredits.sent,
        ...history.specialCredits.received,
      ].sort(
        (a, b) =>
          new Date(b.transferredAt).getTime() -
          new Date(a.transferredAt).getTime(),
      );
    if (activeTab === "vouchers")
      return [...history.vouchers.sent, ...history.vouchers.received].sort(
        (a, b) =>
          new Date(b.transferredAt).getTime() -
          new Date(a.transferredAt).getTime(),
      );
    return [];
  };

  const renderTransferItem = (item: TransferItem, index: number) => {
    const isSent = item.direction === "sent";
    const contact = isSent ? item.recipient : item.sender;
    const isSpecialCredit = item.type === "special_credit";
    const voucherCount = item.count || 1;
    const isMultiple = voucherCount > 1;

    return (
      <View key={`${item.type}-${index}`} style={styles.transferItem}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isSent
                ? "#FEF3C7"
                : isSpecialCredit
                  ? "#DBEAFE"
                  : "#E9D5FF",
            },
          ]}
        >
          <Ionicons
            name={
              isSent ? "arrow-up-circle" : isSpecialCredit ? "gift" : "ticket"
            }
            size={24}
            color={isSent ? "#F59E0B" : isSpecialCredit ? "#3B82F6" : "#8B5CF6"}
          />
        </View>

        <View style={styles.transferInfo}>
          <Text style={styles.transferType}>
            {isMultiple && !isSpecialCredit
              ? `${voucherCount} Vouchers`
              : isSpecialCredit
                ? "Special Credit"
                : "Voucher"}{" "}
            {isSent ? "Sent" : "Received"}
          </Text>
          {contact && (
            <Text style={styles.contactName}>
              {isSent ? "To: " : "From: "}
              {contact.name}
            </Text>
          )}
          {isSpecialCredit && item.amount && (
            <Text style={styles.amount}>
              Amount: {formatAmount(item.amount)}
            </Text>
          )}
          {!isSpecialCredit && (
            <Text style={styles.voucherDetails}>
              {item.companyName} - ₹
              {isMultiple ? item.totalAmount : item.amount}
              {isMultiple && ` (${voucherCount}×)`}
            </Text>
          )}
          <Text style={styles.transferDate}>
            {new Date(item.transferredAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {contact && contact.phone && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall(contact.phone)}
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <LinearGradient
          colors={["#FFFFFF", "#F9FAFB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transfer History</Text>
          <View style={styles.placeholder} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={["#FFFFFF", "#F9FAFB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer History</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="arrow-up" size={22} color="#F59E0B" />
          <Text style={styles.summaryValue}>
            {history.summary.specialCreditsSent + history.summary.vouchersSent}
          </Text>
          <Text style={styles.summaryLabel}>Sent</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="arrow-down" size={22} color="#10B981" />
          <Text style={styles.summaryValue}>
            {history.summary.specialCreditsReceived +
              history.summary.vouchersReceived}
          </Text>
          <Text style={styles.summaryLabel}>Received</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="list" size={22} color="#3B82F6" />
          <Text style={styles.summaryValue}>
            {history.summary.totalTransfers}
          </Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.activeTabText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "credits" && styles.activeTab]}
          onPress={() => setActiveTab("credits")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "credits" && styles.activeTabText,
            ]}
          >
            Special Credits
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "vouchers" && styles.activeTab]}
          onPress={() => setActiveTab("vouchers")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "vouchers" && styles.activeTabText,
            ]}
          >
            Vouchers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transfers List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {getFilteredTransfers().length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="swap-horizontal-outline"
              size={64}
              color="#D1D5DB"
            />
            <Text style={styles.emptyTitle}>No Transfers</Text>
            <Text style={styles.emptySubtitle}>
              Your transfer history will appear here
            </Text>
          </View>
        ) : (
          getFilteredTransfers().map((item, index) =>
            renderTransferItem(item, index),
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(16),
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: scaleSize(4),
  },
  headerTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: "700",
    color: "#1F2937",
  },
  placeholder: {
    width: scaleSize(32),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: scaleSize(12),
    fontSize: scaleFontSize(16),
    color: "#6B7280",
  },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(16),
    gap: scaleSize(12),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(16),
    padding: scaleSize(16),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: scaleFontSize(24),
    fontWeight: "700",
    color: "#1F2937",
    marginTop: scaleSize(8),
  },
  summaryLabel: {
    fontSize: scaleFontSize(12),
    color: "#6B7280",
    marginTop: scaleSize(4),
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: scaleSize(20),
    gap: scaleSize(8),
    marginBottom: scaleSize(16),
  },
  tab: {
    flex: 1,
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(12),
    borderRadius: scaleSize(12),
    backgroundColor: "#E5E7EB",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#3B82F6",
  },
  tabText: {
    fontSize: scaleFontSize(14),
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
    paddingHorizontal: scaleSize(20),
    paddingBottom: scaleSize(20),
  },
  transferItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(16),
    padding: scaleSize(16),
    marginBottom: scaleSize(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(24),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(12),
  },
  transferInfo: {
    flex: 1,
  },
  transferType: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#1F2937",
  },
  contactName: {
    fontSize: scaleFontSize(14),
    color: "#6B7280",
    marginTop: scaleSize(4),
  },
  amount: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#3B82F6",
    marginTop: scaleSize(4),
  },
  voucherDetails: {
    fontSize: scaleFontSize(14),
    color: "#8B5CF6",
    marginTop: scaleSize(4),
  },
  transferDate: {
    fontSize: scaleFontSize(12),
    color: "#9CA3AF",
    marginTop: scaleSize(4),
  },
  callButton: {
    backgroundColor: "#10B981",
    borderRadius: scaleSize(20),
    width: scaleSize(40),
    height: scaleSize(40),
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: scaleSize(60),
  },
  emptyTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: "600",
    color: "#6B7280",
    marginTop: scaleSize(16),
  },
  emptySubtitle: {
    fontSize: scaleFontSize(14),
    color: "#9CA3AF",
    marginTop: scaleSize(8),
  },
});
