import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VoucherItem } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface VoucherListProps {
  vouchers: VoucherItem[];
  onRedeem: (voucherId: string) => void;
  onTransfer: (voucher: VoucherItem) => void;
}

export default function VoucherList({
  vouchers,
  onRedeem,
  onTransfer,
}: VoucherListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Voucher Dashboard</Text>
          <Text style={styles.subtitle}>{vouchers.length} vouchers</Text>
        </View>
      </View>

      {vouchers.length === 0 ? (
        <Text style={styles.emptyText}>No vouchers available</Text>
      ) : (
        vouchers.map((voucher) => (
          <View key={voucher._id} style={styles.card}>
            <View style={styles.voucherInfo}>
              <View style={styles.voucherHeader}>
                <Text style={styles.voucherNumber}>
                  #{voucher.voucherNumber}
                </Text>
                {voucher.source === "transfer" && (
                  <View style={styles.sourceBadge}>
                    <Ionicons name="arrow-down" size={10} color="#10B981" />
                    <Text style={styles.sourceBadgeText}>Received</Text>
                  </View>
                )}
              </View>
              <Text style={styles.voucherMeta}>MRP ₹{voucher.MRP}</Text>
              <Text style={styles.voucherMeta}>
                Expires{" "}
                {new Date(voucher.expiryDate).toLocaleDateString("en-IN")}
              </Text>
              {voucher.source === "transfer" && voucher.transferredFrom && (
                <Text style={styles.transferInfo}>
                  From: {voucher.transferredFrom.name}
                </Text>
              )}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.redeemButton,
                  voucher.redeemedStatus &&
                    voucher.redeemedStatus !== "unredeemed" &&
                    styles.redeemButtonDisabled,
                ]}
                disabled={
                  voucher.redeemedStatus &&
                  voucher.redeemedStatus !== "unredeemed"
                }
                onPress={() => onRedeem(voucher._id)}
              >
                <Ionicons
                  name="ticket"
                  size={14}
                  color={
                    !voucher.redeemedStatus ||
                    voucher.redeemedStatus === "unredeemed"
                      ? "#0F172A"
                      : "#64748B"
                  }
                />
                <Text
                  style={[
                    styles.redeemText,
                    voucher.redeemedStatus &&
                      voucher.redeemedStatus !== "unredeemed" &&
                      styles.redeemTextDisabled,
                  ]}
                >
                  {!voucher.redeemedStatus ||
                  voucher.redeemedStatus === "unredeemed"
                    ? "Redeem"
                    : voucher.redeemedStatus === "redeemed"
                      ? "Redeemed"
                      : "Expired"}
                </Text>
              </TouchableOpacity>
              {(!voucher.redeemedStatus ||
                voucher.redeemedStatus === "unredeemed") && (
                <TouchableOpacity
                  style={styles.transferButton}
                  onPress={() => onTransfer(voucher)}
                >
                  <Ionicons name="send" size={14} color="#10B981" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(16),
    padding: scaleSize(20),
    marginBottom: scaleSize(20),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleSize(12),
  },
  title: {
    fontSize: scaleFontSize(18),
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: scaleFontSize(14),
    color: "#64748B",
    marginTop: 4,
  },
  emptyText: {
    fontSize: scaleFontSize(14),
    color: "#94A3B8",
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleSize(12),
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
  },
  voucherInfo: {
    flex: 1,
  },
  voucherHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  voucherNumber: {
    fontSize: scaleFontSize(14),
    fontWeight: "700",
    color: "#0F172A",
  },
  sourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: scaleSize(6),
    paddingVertical: scaleSize(2),
    backgroundColor: "#D1FAE5",
    borderRadius: scaleSize(6),
  },
  sourceBadgeText: {
    fontSize: scaleFontSize(10),
    fontWeight: "600",
    color: "#10B981",
  },
  voucherMeta: {
    fontSize: scaleFontSize(12),
    color: "#64748B",
    marginTop: 2,
  },
  transferInfo: {
    fontSize: scaleFontSize(11),
    color: "#10B981",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: scaleSize(8),
    alignItems: "center",
  },
  redeemButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(8),
    backgroundColor: "#FDE68A",
    borderRadius: scaleSize(10),
  },
  redeemButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  redeemText: {
    fontSize: scaleFontSize(12),
    fontWeight: "600",
    color: "#0F172A",
  },
  redeemTextDisabled: {
    color: "#64748B",
  },
  transferButton: {
    width: scaleSize(36),
    height: scaleSize(36),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    borderRadius: scaleSize(10),
  },
});
