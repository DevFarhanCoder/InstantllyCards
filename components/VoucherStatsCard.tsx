import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface VoucherStatsCardProps {
  totalVouchers: number;
  availableVouchers: number;
  redeemedVouchers: number;
  onBuyNowPress: () => void;
}

export default function VoucherStatsCard({
  totalVouchers,
  availableVouchers,
  redeemedVouchers,
  onBuyNowPress,
}: VoucherStatsCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onBuyNowPress}
      style={styles.container}
    >
      <LinearGradient
        colors={["#FFFFFF", "#F9FAFB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Vouchers</Text>
            <Text style={styles.subtitle}>Tap to purchase more vouchers</Text>
          </View>
          <View style={styles.iconBadge}>
            <Ionicons name="ticket" size={24} color="#10B981" />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <LinearGradient
              colors={["#10B98115", "#10B98125"]}
              style={styles.statIconContainer}
            >
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </LinearGradient>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{availableVouchers}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <LinearGradient
              colors={["#3B82F615", "#3B82F625"]}
              style={styles.statIconContainer}
            >
              <Ionicons name="albums" size={20} color="#3B82F6" />
            </LinearGradient>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{totalVouchers}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <LinearGradient
              colors={["#8B5CF615", "#8B5CF625"]}
              style={styles.statIconContainer}
            >
              <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
            </LinearGradient>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{redeemedVouchers}</Text>
              <Text style={styles.statLabel}>Redeemed</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <LinearGradient
            colors={["#10B981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buyButton}
          >
            <Ionicons name="cart" size={18} color="#FFFFFF" />
            <Text style={styles.buyButtonText}>Buy Vouchers</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: scaleSize(20),
  },
  card: {
    borderRadius: scaleSize(16),
    padding: scaleSize(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleSize(20),
  },
  iconBadge: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(24),
    backgroundColor: "#10B98115",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: scaleFontSize(18),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: scaleFontSize(12),
    color: "#6B7280",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scaleSize(16),
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: scaleSize(4),
  },
  statIconContainer: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scaleSize(8),
  },
  statContent: {
    alignItems: "center",
  },
  statValue: {
    fontSize: scaleFontSize(20),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: scaleFontSize(11),
    color: "#6B7280",
  },
  actionContainer: {
    marginTop: scaleSize(8),
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: scaleSize(14),
    borderRadius: scaleSize(12),
  },
  buyButtonText: {
    fontSize: scaleFontSize(15),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
