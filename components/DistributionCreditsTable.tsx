import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { scaleFontSize, scaleSize } from "../lib/responsive";
import { DistributionCredit } from "../types/network";
import { useMlmTransferStore } from "../lib/mlmTransferStore";
import { formatSecondsCompact, statusLabel } from "../lib/mlmTransferUi";

interface DistributionCreditsTableProps {
  credits: DistributionCredit[];
  onTransfer: (recipientId: string, amount: number) => void;
  loading?: boolean;
}

export default function DistributionCreditsTable({
  credits,
  onTransfer,
  loading = false,
}: DistributionCreditsTableProps) {
  const transfersById = useMlmTransferStore((state) => state.transfersById);
  const slotLocks = useMlmTransferStore((state) => state.slotLocksBySlotNumber);

  const formatCredits = (amount: number): string => {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(2)} Lacs`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`;
    }
    return amount.toFixed(2);
  };

  if (credits.length === 0) {
    return null; // Don't show table if no distribution credits
  }

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
            <Text style={styles.title}>Distribution Credits</Text>
            <Text style={styles.subtitle}>
              Track lock status, timer, and voucher unlock progress
            </Text>
          </View>
          <View style={styles.iconBadge}>
            <Ionicons name="git-network" size={20} color="#3B82F6" />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tableScrollView}
        >
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: 60 }]}>Level</Text>
              <Text style={[styles.tableHeaderCell, { width: 150 }]}>
                Recipient
              </Text>
              <Text style={[styles.tableHeaderCell, { width: 120 }]}>
                Credits
              </Text>
              <Text style={[styles.tableHeaderCell, { width: 100 }]}>
                Vouchers
              </Text>
              <Text style={[styles.tableHeaderCell, { width: 100 }]}>
                Status
              </Text>
              <Text style={[styles.tableHeaderCell, { width: 120 }]}>
                Action
              </Text>
            </View>

            {/* Table Rows */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#10B981" />
              </View>
            ) : (
              credits.map((credit, index) => (
                (() => {
                  const transfer =
                    credit.transferId ? transfersById[credit.transferId] : undefined;
                  const slotLock =
                    typeof credit.slotNumber === "number"
                      ? slotLocks[credit.slotNumber]
                      : undefined;
                  const locked = credit.isLocked ?? slotLock?.isLocked ?? false;
                  const lockReason =
                    credit.lockReason ??
                    slotLock?.lockReason ??
                    (locked ? "Voucher requirement pending" : null);
                  const effectiveSeconds =
                    slotLock?.timeLeftSeconds ??
                    transfer?.timeLeftSeconds ??
                    credit.timeLeftSeconds;
                  const effectiveStatus =
                    transfer?.status ?? (locked ? "pending_unlock" : "unlocked");
                  const currentVoucher = transfer?.currentVoucherCount ?? 0;
                  const requiredVoucher = transfer?.requiredVoucherCount ?? 0;

                  return (
                    <View
                      key={`${credit.recipientId}-${index}`}
                      style={[
                        styles.tableRow,
                        index % 2 === 0 && styles.tableRowEven,
                      ]}
                    >
                      <Text style={[styles.tableCell, { width: 60 }]}>
                        {credit.level ?? "-"}
                      </Text>
                  <View style={[styles.tableCell, { width: 150 }]}>
                    <Text style={styles.recipientName}>
                      {credit.recipientName}
                    </Text>
                    <Text style={styles.recipientPhone}>
                      {credit.recipientPhone}
                    </Text>
                    <Text style={styles.metaText}>{statusLabel(effectiveStatus)}</Text>
                    {typeof effectiveSeconds === "number" && (
                      <Text style={styles.metaTimer}>
                        {formatSecondsCompact(effectiveSeconds)}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.creditsCell,
                      { width: 120 },
                    ]}
                  >
                    ₹{formatCredits(credit.creditsToTransfer)}
                  </Text>
                  <View style={[styles.tableCell, { width: 100 }]}>
                    <View style={styles.voucherBadge}>
                      <Ionicons
                        name="ticket"
                        size={12}
                        color={
                          (credit.vouchersShared || 0) >= 5
                            ? "#10B981"
                            : "#F59E0B"
                        }
                      />
                      <Text
                        style={[
                          styles.voucherText,
                          {
                            color:
                              (credit.vouchersShared || 0) >= 5
                                ? "#10B981"
                                : "#F59E0B",
                          },
                        ]}
                      >
                        {requiredVoucher > 0
                          ? `${currentVoucher}/${requiredVoucher}`
                          : `${credit.vouchersShared || 0}/5`}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.tableCell, { width: 100 }]}>
                    {locked ? (
                      <View style={styles.statusBadge}>
                        <Ionicons
                          name="lock-closed"
                          size={12}
                          color="#EF4444"
                        />
                        <Text style={styles.lockedText}>Locked</Text>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, styles.unlockedBadge]}>
                        <Ionicons name="lock-open" size={12} color="#10B981" />
                        <Text style={styles.unlockedText}>Ready</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.tableCell, { width: 120 }]}>
                    <TouchableOpacity
                      disabled={locked}
                      onPress={() =>
                        onTransfer(credit.recipientId, credit.creditsToTransfer)
                      }
                      style={[
                        styles.transferButton,
                        locked && styles.transferButtonDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.transferButtonText,
                          locked && styles.transferButtonTextDisabled,
                        ]}
                      >
                        {locked ? "Locked" : "Transfer"}
                      </Text>
                      {!locked && (
                        <Ionicons
                          name="arrow-forward"
                          size={12}
                          color="#FFFFFF"
                        />
                      )}
                    </TouchableOpacity>
                    {locked && !!lockReason && (
                      <Text style={styles.lockReasonInline}>{lockReason}</Text>
                    )}
                  </View>
                    </View>
                  );
                })()
              ))
            )}
          </View>
        </ScrollView>

        {/* Info Footer */}
        <View style={styles.footer}>
          <Ionicons name="information-circle" size={16} color="#6B7280" />
          <Text style={styles.footerText}>
            Locked transfers unlock after voucher requirements are met within
            the active timer window.
          </Text>
        </View>
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
    marginBottom: scaleSize(16),
  },
  iconBadge: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    backgroundColor: "#3B82F615",
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
  tableScrollView: {
    marginBottom: scaleSize(12),
  },
  table: {
    minWidth: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: scaleSize(8),
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(8),
    marginBottom: scaleSize(8),
  },
  tableHeaderCell: {
    fontSize: scaleFontSize(12),
    fontWeight: "700",
    color: "#1F2937",
    paddingHorizontal: scaleSize(8),
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(8),
    borderRadius: scaleSize(8),
    marginBottom: scaleSize(4),
  },
  tableRowEven: {
    backgroundColor: "#F9FAFB",
  },
  tableCell: {
    fontSize: scaleFontSize(13),
    color: "#1F2937",
    paddingHorizontal: scaleSize(8),
    justifyContent: "center",
  },
  recipientName: {
    fontSize: scaleFontSize(13),
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  recipientPhone: {
    fontSize: scaleFontSize(11),
    color: "#6B7280",
  },
  metaText: {
    fontSize: scaleFontSize(10),
    color: "#1E3A8A",
    marginTop: scaleSize(2),
  },
  metaTimer: {
    fontSize: scaleFontSize(10),
    color: "#EF4444",
    marginTop: scaleSize(1),
    fontWeight: "700",
  },
  creditsCell: {
    fontWeight: "700",
    color: "#10B981",
  },
  voucherBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(4),
    borderRadius: scaleSize(6),
    gap: 4,
  },
  voucherText: {
    fontSize: scaleFontSize(11),
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(4),
    borderRadius: scaleSize(6),
    gap: 4,
  },
  unlockedBadge: {
    backgroundColor: "#D1FAE5",
  },
  lockedText: {
    fontSize: scaleFontSize(11),
    fontWeight: "600",
    color: "#EF4444",
  },
  unlockedText: {
    fontSize: scaleFontSize(11),
    fontWeight: "600",
    color: "#10B981",
  },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(6),
    gap: 4,
  },
  transferButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  transferButtonText: {
    fontSize: scaleFontSize(12),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  transferButtonTextDisabled: {
    color: "#9CA3AF",
  },
  lockReasonInline: {
    fontSize: scaleFontSize(10),
    color: "#991B1B",
    marginTop: scaleSize(4),
  },
  loadingContainer: {
    paddingVertical: scaleSize(20),
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: scaleSize(12),
    borderRadius: scaleSize(8),
    gap: 8,
  },
  footerText: {
    flex: 1,
    fontSize: scaleFontSize(11),
    color: "#6B7280",
    lineHeight: 16,
  },
});
