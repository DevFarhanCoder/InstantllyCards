import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CommissionSummary } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface CommissionDashboardCardProps {
  summary: CommissionSummary;
  onWithdraw: () => void;
}

export default function CommissionDashboardCard({
  summary,
  onWithdraw,
}: CommissionDashboardCardProps) {
  const canWithdraw = summary.availableBalance > 0;
  return (
    <LinearGradient
      colors={["#FFFFFF", "#F8FAFC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Commission Dashboard</Text>
          <Text style={styles.subtitle}>Real earnings from paid vouchers</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.withdrawButton,
            !canWithdraw && styles.withdrawButtonDisabled,
          ]}
          onPress={onWithdraw}
          disabled={!canWithdraw}
        >
          <Ionicons name="cash" size={16} color="#0F172A" />
          <Text style={styles.withdrawText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Earned</Text>
          <Text style={styles.metricValue}>₹{summary.totalEarned}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Available</Text>
          <Text style={styles.metricValue}>₹{summary.availableBalance}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Withdrawn</Text>
          <Text style={styles.metricValue}>₹{summary.totalWithdrawn}</Text>
        </View>
      </View>

      <View style={styles.breakdownHeader}>
        <Ionicons name="analytics" size={18} color="#1F2937" />
        <Text style={styles.breakdownTitle}>Level-wise Breakdown</Text>
      </View>
      <View style={styles.breakdownGrid}>
        {summary.levelBreakdown.length === 0 ? (
          <Text style={styles.emptyText}>No commissions yet</Text>
        ) : (
          summary.levelBreakdown.map((item) => (
            <View key={item.level} style={styles.breakdownItem}>
              <Text style={styles.breakdownLevel}>L{item.level}</Text>
              <Text style={styles.breakdownAmount}>₹{item.amount}</Text>
            </View>
          ))
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: scaleSize(16),
    padding: scaleSize(20),
    marginBottom: scaleSize(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleSize(16),
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
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(8),
    backgroundColor: "#FDE68A",
    borderRadius: scaleSize(10),
  },
  withdrawButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  withdrawText: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#0F172A",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scaleSize(8),
    marginBottom: scaleSize(16),
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  metricLabel: {
    fontSize: scaleFontSize(12),
    color: "#64748B",
  },
  metricValue: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 4,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: scaleSize(8),
  },
  breakdownTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#1F2937",
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scaleSize(8),
  },
  breakdownItem: {
    backgroundColor: "#F1F5F9",
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(12),
    borderRadius: scaleSize(10),
  },
  breakdownLevel: {
    fontSize: scaleFontSize(12),
    color: "#334155",
  },
  breakdownAmount: {
    fontSize: scaleFontSize(14),
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyText: {
    fontSize: scaleFontSize(14),
    color: "#94A3B8",
    marginTop: scaleSize(4),
  },
});
