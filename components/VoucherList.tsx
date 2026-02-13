import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VoucherItem } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface VoucherListProps {
  vouchers: VoucherItem[];
  onRedeem: (voucherId: string) => void;
}

export default function VoucherList({ vouchers, onRedeem }: VoucherListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voucher Dashboard</Text>
        <Text style={styles.subtitle}>{vouchers.length} vouchers</Text>
      </View>

      {vouchers.length === 0 ? (
        <Text style={styles.emptyText}>No vouchers available</Text>
      ) : (
        vouchers.map((voucher) => (
          <View key={voucher._id} style={styles.card}>
            <View>
              <Text style={styles.voucherNumber}>#{voucher.voucherNumber}</Text>
              <Text style={styles.voucherMeta}>MRP ₹{voucher.MRP}</Text>
              <Text style={styles.voucherMeta}>
                Expires{" "}
                {new Date(voucher.expiryDate).toLocaleDateString("en-IN")}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.redeemButton,
                voucher.redeemedStatus !== "unredeemed" &&
                  styles.redeemButtonDisabled,
              ]}
              disabled={voucher.redeemedStatus !== "unredeemed"}
              onPress={() => onRedeem(voucher._id)}
            >
              <Ionicons name="ticket" size={16} color="#0F172A" />
              <Text style={styles.redeemText}>
                {voucher.redeemedStatus === "unredeemed"
                  ? "Redeem"
                  : voucher.redeemedStatus === "redeemed"
                    ? "Redeemed"
                    : "Expired"}
              </Text>
            </TouchableOpacity>
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
  voucherNumber: {
    fontSize: scaleFontSize(14),
    fontWeight: "700",
    color: "#0F172A",
  },
  voucherMeta: {
    fontSize: scaleFontSize(12),
    color: "#64748B",
    marginTop: 2,
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
});
