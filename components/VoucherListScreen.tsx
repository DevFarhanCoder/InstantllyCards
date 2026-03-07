import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "../lib/api";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface Voucher {
  _id: string;
  voucherNumber: string;
  MRP: number;
  issueDate: string;
  expiryDate: string;
  redeemedStatus: "unredeemed" | "redeemed" | "expired";
  source: "purchase" | "transfer" | "admin";
  voucherImages?: string[];
  // Admin-created voucher fields
  companyLogo?: string;
  companyName?: string;
  phoneNumber?: string;
  address?: string;
  amount?: number;
  discountPercentage?: number;
  validity?: string;
  voucherImage?: string;
  description?: string;
  isPublished?: boolean;
  isSpecialCreditsVoucher?: boolean; // the always-shown Instantlly template card
  isBalanceVoucher?: boolean;
  quantity?: number;
}

interface VoucherListScreenProps {
  onVoucherSelect: (voucher: Voucher) => void;
}

export default function VoucherListScreen({
  onVoucherSelect,
}: VoucherListScreenProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherBalance, setVoucherBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVouchers = async () => {
    try {
      const response = await api.get("/mlm/vouchers");
      if (response?.success) {
        let allVouchers = response.vouchers || [];
        const balance = response.voucherBalance || 0;
        setVoucherBalance(balance);

        // Attach quantity to the Instantlly special template card (no extra cards)
        if (balance > 0) {
          allVouchers = allVouchers.map((v: Voucher) =>
            v._id === "instantlly-special-credits"
              ? { ...v, quantity: balance }
              : v,
          );
        }

        // Also fetch published admin vouchers (global templates)
        try {
          const adminVouchersResponse = await api.get(
            "/mlm/vouchers?source=admin&isPublished=true",
          );
          if (adminVouchersResponse?.success) {
            // Merge admin vouchers, deduplicating by _id
            const existingIds = new Set(
              allVouchers.map((v: Voucher) => String(v._id)),
            );
            const newAdminVouchers = (
              adminVouchersResponse.vouchers || []
            ).filter((v: Voucher) => !existingIds.has(String(v._id)));
            allVouchers = [...newAdminVouchers, ...allVouchers];
          }
        } catch (adminError) {
          console.log("No admin vouchers or error fetching:", adminError);
        }

        setVouchers(allVouchers);
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setVouchers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVouchers();
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "unredeemed":
        return "Active";
      case "redeemed":
        return "Redeemed";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  const renderVoucherCard = ({ item }: { item: Voucher }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onVoucherSelect(item)}
      style={styles.cardWrapper}
    >
      <LinearGradient
        colors={["#FFFFFF", "#F9FAFB"]}
        style={styles.voucherCard}
      >
        {/* Discount Badge (Top Right) */}
        {(item.discountPercentage ?? 0) > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discountPercentage}%</Text>
          </View>
        )}

        {/* Quantity badge for balance-based vouchers */}
        {(item.quantity ?? 0) > 0 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>×{item.quantity}</Text>
          </View>
        )}

        {/* Company Logo and Info Section */}
        <View style={styles.headerSection}>
          {item.companyLogo ? (
            <Image
              source={{ uri: item.companyLogo }}
              style={styles.companyLogo}
            />
          ) : (
            <View style={styles.placeholderLogo}>
              <Image
                source={require("../assets/logo.png")}
                style={{ width: scaleSize(60), height: scaleSize(60) }}
                resizeMode="contain"
              />
            </View>
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {item.companyName || "Instantlly"}
            </Text>
            {item.phoneNumber && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={12} color="#6B7280" />
                <Text style={styles.infoTextSmall}>{item.phoneNumber}</Text>
              </View>
            )}
            {item.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={12} color="#6B7280" />
                <Text style={styles.infoTextSmall} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
            )}
          </View>

          {/* Amount Section */}
          <View style={styles.amountSection}>
            <Text style={styles.amountSymbol}>₹</Text>
            <Text style={styles.amountValue}>{item.amount || item.MRP}</Text>
            {(item.discountPercentage ?? 0) > 0 && (
              <Text style={styles.amountDiscount}>
                -{item.discountPercentage}%
              </Text>
            )}
            <Text style={styles.amountLabel}>Value</Text>
          </View>
        </View>

        {/* Description or CTA Text (instead of button) */}
        {item.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        )}

        {/* Validity Footer */}
        <View style={styles.validityFooter}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.validityText}>
            {item.validity ||
              `Valid till ${new Date(item.expiryDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
          </Text>
        </View>

        {/* Status Badge (if not unredeemed) */}
        {item.redeemedStatus !== "unredeemed" && (
          <View
            style={[
              styles.statusOverlay,
              { backgroundColor: getStatusColor(item.redeemedStatus) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusOverlayText,
                { color: getStatusColor(item.redeemedStatus) },
              ]}
            >
              {getStatusText(item.redeemedStatus)}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading vouchers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Compact */}
      <LinearGradient
        colors={["#3B82F6", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="ticket" size={24} color="#FFFFFF" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Vouchers</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Vouchers List */}
      <FlatList
        data={vouchers}
        renderItem={renderVoucherCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Vouchers Yet</Text>
            <Text style={styles.emptySubtitle}>
              Vouchers will appear here once admin assigns them to you
            </Text>
          </View>
        }
      />
    </View>
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
    borderBottomLeftRadius: scaleSize(24),
    borderBottomRightRadius: scaleSize(24),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: scaleFontSize(13),
    fontWeight: "500",
    color: "#E0E7FF",
    marginTop: scaleSize(2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    fontSize: scaleFontSize(16),
    color: "#6B7280",
    marginTop: scaleSize(12),
  },
  listContainer: {
    padding: scaleSize(20),
    paddingBottom: scaleSize(100),
  },
  cardWrapper: {
    marginBottom: scaleSize(20),
  },
  voucherCard: {
    borderRadius: scaleSize(20),
    padding: scaleSize(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  discountBadge: {
    position: "absolute",
    top: scaleSize(16),
    right: scaleSize(16),
    backgroundColor: "#DC2626",
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(20),
    zIndex: 10,
  },
  discountText: {
    fontSize: scaleFontSize(12),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  quantityBadge: {
    position: "absolute",
    top: scaleSize(16),
    left: scaleSize(16),
    backgroundColor: "#10B981",
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(4),
    borderRadius: scaleSize(20),
    zIndex: 10,
  },
  quantityText: {
    fontSize: scaleFontSize(12),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: scaleSize(16),
  },
  companyLogo: {
    width: scaleSize(64),
    height: scaleSize(64),
    borderRadius: scaleSize(14),
    backgroundColor: "#F3F4F6",
  },
  placeholderLogo: {
    width: scaleSize(64),
    height: scaleSize(64),
    borderRadius: scaleSize(14),
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  companyInfo: {
    flex: 1,
    marginLeft: scaleSize(12),
  },
  companyName: {
    fontSize: scaleFontSize(18),
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: scaleSize(4),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: scaleSize(2),
  },
  infoTextSmall: {
    fontSize: scaleFontSize(11),
    color: "#6B7280",
  },
  amountSection: {
    alignItems: "flex-end",
  },
  amountSymbol: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#DC2626",
  },
  amountValue: {
    fontSize: scaleFontSize(32),
    fontWeight: "900",
    color: "#DC2626",
    lineHeight: scaleFontSize(32),
  },
  amountDiscount: {
    fontSize: scaleFontSize(12),
    fontWeight: "700",
    color: "#059669",
    marginTop: scaleSize(2),
  },
  amountLabel: {
    fontSize: scaleFontSize(11),
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: scaleSize(2),
  },
  descriptionContainer: {
    paddingVertical: scaleSize(12),
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: scaleSize(12),
  },
  descriptionText: {
    fontSize: scaleFontSize(13),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  validityFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  validityText: {
    fontSize: scaleFontSize(12),
    fontWeight: "600",
    color: "#D97706",
  },
  statusOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: scaleSize(16),
    justifyContent: "center",
    alignItems: "center",
  },
  statusOverlayText: {
    fontSize: scaleFontSize(20),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusBadge: {
    position: "absolute",
    top: scaleSize(12),
    right: scaleSize(12),
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(4),
    borderRadius: scaleSize(12),
  },
  statusText: {
    fontSize: scaleFontSize(11),
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  iconContainer: {
    marginRight: scaleSize(16),
  },
  iconGradient: {
    width: scaleSize(64),
    height: scaleSize(64),
    borderRadius: scaleSize(16),
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContainer: {
    flex: 1,
  },
  voucherNumber: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: scaleSize(4),
  },
  mrpText: {
    fontSize: scaleFontSize(20),
    fontWeight: "800",
    color: "#3B82F6",
    marginBottom: scaleSize(8),
  },
  infoText: {
    fontSize: scaleFontSize(12),
    color: "#6B7280",
  },
  transferBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: scaleSize(4),
  },
  transferText: {
    fontSize: scaleFontSize(11),
    fontWeight: "600",
    color: "#10B981",
  },
  arrowContainer: {
    marginLeft: scaleSize(8),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleSize(60),
  },
  emptyTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: "700",
    color: "#1F2937",
    marginTop: scaleSize(16),
  },
  emptySubtitle: {
    fontSize: scaleFontSize(14),
    color: "#6B7280",
    textAlign: "center",
    marginTop: scaleSize(8),
    paddingHorizontal: scaleSize(40),
  },
});
