import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CreditStatistics } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface CreditStatisticsCardProps {
  statistics: CreditStatistics;
}

export default function CreditStatisticsCard({
  statistics,
}: CreditStatisticsCardProps) {
  const [showTransfers, setShowTransfers] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "returned":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "returned":
        return "arrow-undo-circle";
      default:
        return "help-circle";
    }
  };

  const formatTimeLeft = (target?: string) => {
    if (!target) return "--";
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const StatisticItem = ({
    icon,
    label,
    value,
    color,
    prefix = "",
    suffix = "",
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    color: string;
    prefix?: string;
    suffix?: string;
  }) => (
    <View style={styles.statisticItem}>
      <LinearGradient
        colors={[color + "15", color + "25"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statisticIconContainer}
      >
        <Ionicons name={icon} size={24} color={color} />
      </LinearGradient>
      <View style={styles.statisticContent}>
        <Text style={styles.statisticLabel}>{label}</Text>
        <Text style={[styles.statisticValue, { color }]}>
          {prefix}
          {typeof value === "number" ? formatNumber(value) : value}
          {suffix}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FFFFFF", "#F9FAFB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Credit Statistics</Text>
            <Text style={styles.subtitle}>Your complete credit overview</Text>
          </View>
          <View style={styles.balanceBadge}>
            <Ionicons name="wallet" size={16} color="#10B981" />
            <Text style={styles.balanceText}>
              {formatNumber(statistics.totalCreditBalance)} credits
            </Text>
          </View>
        </View>

        <View style={styles.statisticsGrid}>
          <StatisticItem
            icon="arrow-down-circle"
            label="Total Credit Received"
            value={statistics.totalCreditReceived}
            color="#10B981"
            suffix=" credits"
          />
          <StatisticItem
            icon="arrow-up-circle"
            label="Total Credit Transferred"
            value={statistics.totalCreditTransferred}
            color="#EF4444"
            suffix=" credits"
          />
          <StatisticItem
            icon="wallet-outline"
            label="Current Balance"
            value={statistics.totalCreditBalance}
            color="#3B82F6"
            suffix=" credits"
          />
          <StatisticItem
            icon="arrow-undo-circle"
            label="Credits Received Back"
            value={statistics.creditTransferredReceivedBack}
            color="#8B5CF6"
            suffix=" credits"
          />
        </View>

        {/* Transfer History Section */}
        <TouchableOpacity
          style={styles.transferHistoryHeader}
          onPress={() => setShowTransfers(!showTransfers)}
        >
          <View style={styles.transferHeaderLeft}>
            <Ionicons name="swap-horizontal" size={20} color="#1F2937" />
            <Text style={styles.transferHistoryTitle}>
              Credit Transfer to Each Person (
              {statistics.creditTransferToEachPerson.length})
            </Text>
          </View>
          <Ionicons
            name={showTransfers ? "chevron-up" : "chevron-down"}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>

        {showTransfers && (
          <ScrollView
            style={styles.transferList}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {statistics.creditTransferToEachPerson.map((transfer) => (
              <View key={transfer.id} style={styles.transferItem}>
                <View style={styles.transferLeft}>
                  <View
                    style={[
                      styles.transferStatusIcon,
                      {
                        backgroundColor: getStatusColor(transfer.status) + "20",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        getStatusIcon(
                          transfer.status,
                        ) as keyof typeof Ionicons.glyphMap
                      }
                      size={16}
                      color={getStatusColor(transfer.status)}
                    />
                  </View>
                  <View style={styles.transferInfo}>
                    <Text style={styles.transferName}>
                      {transfer.recipientName}
                    </Text>
                    <Text style={styles.transferDate}>
                      {formatDate(transfer.date)}
                    </Text>
                  </View>
                </View>
                <View style={styles.transferRight}>
                  <Text style={styles.transferAmount}>
                    ₹{formatNumber(transfer.amount)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(transfer.status) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(transfer.status) },
                      ]}
                    >
                      {transfer.status.charAt(0).toUpperCase() +
                        transfer.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {statistics.timers && statistics.timers.length > 0 && (
          <View style={styles.timerSection} key={tick}>
            <Text style={styles.timerTitle}>Credit Countdown</Text>
            {statistics.timers.map((timer) => (
              <View key={timer.creditId} style={styles.timerRow}>
                <View style={styles.timerLeft}>
                  <Ionicons name="timer" size={16} color="#0F172A" />
                  <Text style={styles.timerLabel}>
                    {timer.paymentStatus === "pending" ? "Payment" : "Transfer"}
                  </Text>
                </View>
                <Text style={styles.timerValue}>
                  {timer.paymentStatus === "pending"
                    ? formatTimeLeft(timer.expiresAt)
                    : formatTimeLeft(timer.transferExpiresAt)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </View>
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scaleSize(20),
  },
  title: {
    fontSize: scaleFontSize(20),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: scaleFontSize(14),
    color: "#6B7280",
  },
  balanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98120",
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(20),
    gap: 6,
  },
  balanceText: {
    fontSize: scaleFontSize(14),
    fontWeight: "700",
    color: "#10B981",
  },
  statisticsGrid: {
    marginBottom: scaleSize(20),
  },
  statisticItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: scaleSize(12),
    padding: scaleSize(14),
    marginBottom: scaleSize(12),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  statisticIconContainer: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(24),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(14),
  },
  statisticContent: {
    flex: 1,
  },
  statisticLabel: {
    fontSize: scaleFontSize(14),
    color: "#6B7280",
    marginBottom: 4,
  },
  statisticValue: {
    fontSize: scaleFontSize(20),
    fontWeight: "700",
  },
  transferHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(12),
    backgroundColor: "#F3F4F6",
    borderRadius: scaleSize(10),
    marginBottom: scaleSize(12),
  },
  transferHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  transferHistoryTitle: {
    fontSize: scaleFontSize(15),
    fontWeight: "600",
    color: "#1F2937",
  },
  transferList: {
    maxHeight: scaleSize(300),
  },
  transferItem: {
    timerSection: {
      marginTop: scaleSize(16),
      borderTopWidth: 1,
      borderTopColor: "rgba(0, 0, 0, 0.06)",
      paddingTop: scaleSize(12),
    },
    timerTitle: {
      fontSize: scaleFontSize(16),
      fontWeight: "600",
      color: "#1F2937",
      marginBottom: scaleSize(8),
    },
    timerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: scaleSize(6),
    },
    timerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    timerLabel: {
      fontSize: scaleFontSize(14),
      color: "#475569",
    },
    timerValue: {
      fontSize: scaleFontSize(14),
      fontWeight: "600",
      color: "#0F172A",
    },
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(10),
    padding: scaleSize(12),
    marginBottom: scaleSize(8),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  transferLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transferStatusIcon: {
    width: scaleSize(32),
    height: scaleSize(32),
    borderRadius: scaleSize(16),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(10),
  },
  transferInfo: {
    flex: 1,
  },
  transferName: {
    fontSize: scaleFontSize(15),
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  transferDate: {
    fontSize: scaleFontSize(12),
    color: "#9CA3AF",
  },
  transferRight: {
    alignItems: "flex-end",
  },
  transferAmount: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(3),
    borderRadius: scaleSize(6),
  },
  statusText: {
    fontSize: scaleFontSize(11),
    fontWeight: "600",
  },
});
