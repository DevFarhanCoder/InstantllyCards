import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { DiscountSummary } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface DiscountDashboardCardProps {
  summary: DiscountSummary;
}

export default function DiscountDashboardCard({
  summary,
}: DiscountDashboardCardProps) {
  return (
    <LinearGradient
      colors={["#FFFFFF", "#F8FAFC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Discount Savings Dashboard</Text>
          <Text style={styles.subtitle}>Your savings from network growth</Text>
        </View>
        <View style={styles.levelBadge}>
          <Ionicons name="trophy" size={16} color="#F59E0B" />
          <Text style={styles.levelText}>
            Level {summary.currentLevel ?? 1}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Discount Level</Text>
          <Text style={styles.metricValue}>
            {summary.discountPercent ?? 40}%
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>You Pay</Text>
          <Text style={styles.metricValue}>
            ₹{summary.payableAmount ?? 3600}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Virtual Savings</Text>
          <Text style={styles.metricValue}>
            ₹{summary.virtualCommission ?? 0}
          </Text>
        </View>
      </View>

      {summary.nextLevelTarget && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Ionicons name="trending-up" size={18} color="#1F2937" />
            <Text style={styles.progressTitle}>Next Level Progress</Text>
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Level {summary.nextLevelTarget.level} •{" "}
              {summary.nextLevelTarget.targetDiscountPercent}% discount
            </Text>
            <Text style={styles.progressRemaining}>
              {summary.nextLevelTarget.remainingDownline} more members needed
            </Text>
          </View>
        </View>
      )}

      <View style={styles.disclaimerContainer}>
        <Ionicons name="information-circle" size={16} color="#64748B" />
        <Text style={styles.disclaimerText}>{summary.disclaimer}</Text>
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
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(8),
    backgroundColor: "#FEF3C7",
    borderRadius: scaleSize(10),
  },
  levelText: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#92400E",
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
  progressContainer: {
    backgroundColor: "#F0FDF4",
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    marginBottom: scaleSize(12),
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: scaleSize(8),
  },
  progressTitle: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#1F2937",
  },
  progressInfo: {
    gap: scaleSize(4),
  },
  progressText: {
    fontSize: scaleFontSize(14),
    color: "#166534",
    fontWeight: "500",
  },
  progressRemaining: {
    fontSize: scaleFontSize(12),
    color: "#15803D",
  },
  disclaimerContainer: {
    flexDirection: "row",
    gap: scaleSize(8),
    backgroundColor: "#F8FAFC",
    padding: scaleSize(12),
    borderRadius: scaleSize(10),
  },
  disclaimerText: {
    flex: 1,
    fontSize: scaleFontSize(12),
    color: "#64748B",
    lineHeight: scaleFontSize(16),
  },
});
