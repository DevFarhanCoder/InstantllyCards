import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NetworkMetrics } from "../types/network";
import { wp, hp, scaleFontSize, scaleSize } from "../lib/responsive";

interface SummaryCardProps {
  metrics: NetworkMetrics;
}

export default function SummaryCard({ metrics }: SummaryCardProps) {
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const MetricItem = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <View style={styles.metricItem}>
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.metricContent}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={["#FFFFFF", "#F9FAFB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>Network Overview</Text>

      <View style={styles.metricsGrid}>
        <MetricItem
          icon="wallet-outline"
          label="Available Credits"
          value={formatNumber(metrics.availableCredits ?? 0)}
          color="#10B981"
        />
        <MetricItem
          icon="arrow-forward-circle-outline"
          label="Credits Distributed"
          value={formatNumber(metrics.totalVouchersTransferred ?? 0)}
          color="#3B82F6"
        />
        <MetricItem
          icon="people-outline"
          label="Network Users"
          value={formatNumber(metrics.totalNetworkUsers ?? 0)}
          color="#8B5CF6"
        />
        <MetricItem
          icon="trending-up-outline"
          label="Virtual Savings"
          value={`₹${formatNumber(metrics.virtualCommission ?? 0)}`}
          color="#F59E0B"
        />
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  title: {
    fontSize: scaleFontSize(18),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: scaleSize(16),
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleSize(16),
    backgroundColor: "#F9FAFB",
    borderRadius: scaleSize(12),
    padding: scaleSize(12),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  iconContainer: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(10),
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: scaleFontSize(16),
    color: "#6B7280",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#1F2937",
  },
});
