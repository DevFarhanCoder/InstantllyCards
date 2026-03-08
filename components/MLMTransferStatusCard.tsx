import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scaleFontSize, scaleSize } from "../lib/responsive";
import { MlmActiveTransfer } from "../types/network";
import {
  formatSecondsCompact,
  isPendingTransferStatus,
  resolveTransferStatus,
  shouldShowTransferTimer,
  statusColor,
  statusLabel,
} from "../lib/mlmTransferUi";

interface MLMTransferStatusCardProps {
  transfers: MlmActiveTransfer[];
}

export default function MLMTransferStatusCard({
  transfers,
}: MLMTransferStatusCardProps) {
  if (!transfers?.length) return null;

  const sortedTransfers = [...transfers].sort((a, b) => {
    const aPending = isPendingTransferStatus(a.status) ? 1 : 0;
    const bPending = isPendingTransferStatus(b.status) ? 1 : 0;
    return bPending - aPending;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transfer Unlock Status</Text>
      {sortedTransfers.map((transfer) => {
        const required = transfer.requiredVoucherCount || 0;
        const current = transfer.currentVoucherCount || 0;
        const resolvedStatus = resolveTransferStatus(
          transfer.status,
          current,
          required,
        );
        const voucherRatio =
          required > 0 ? Math.max(0, Math.min(1, current / required)) : 0;
        const totalSlots = transfer.slotCount || 0;
        const unlockedSlots = transfer.unlockedSlots || 0;
        const slotsRatio =
          totalSlots > 0
            ? Math.max(0, Math.min(1, unlockedSlots / totalSlots))
            : 0;
        const pillColor = statusColor(resolvedStatus);
        const isPending = isPendingTransferStatus(resolvedStatus);
        const showTimer = shouldShowTransferTimer(
          transfer.status,
          current,
          required,
        );
        const amount =
          transfer.totalCreditAmount ??
          (transfer.slotAmount || 0) * (transfer.slotCount || 0);

        let stateTitle = "Unlock in progress";
        let stateMessage = "Waiting for voucher progress before unlock completes.";

        if (resolvedStatus === "unlocked") {
          stateTitle = "Transfer unlocked";
          stateMessage = "Voucher requirement completed and credits are unlocked.";
        } else if (resolvedStatus === "returned_timeout") {
          stateTitle = "Transfer expired";
          stateMessage = "Timer ended and the credit was returned.";
        } else if (resolvedStatus === "partial_timeout_review") {
          stateTitle = "Transfer under review";
          stateMessage = "This transfer is no longer a standard active countdown.";
        }

        return (
          <View
            key={transfer.transferId}
            style={[
              styles.row,
              !isPending && styles.rowInactive,
              resolvedStatus === "unlocked" && styles.rowUnlocked,
              resolvedStatus === "returned_timeout" && styles.rowExpired,
            ]}
          >
            <View style={styles.rowHead}>
              <View style={[styles.statusPill, { backgroundColor: `${pillColor}20` }]}>
                <Text style={[styles.statusPillText, { color: pillColor }]}>
                  {statusLabel(resolvedStatus)}
                </Text>
              </View>
              {showTimer ? (
                <View style={styles.timerWrap}>
                  <Ionicons name="timer-outline" size={14} color="#1E3A8A" />
                  <Text style={styles.timerText}>
                    {formatSecondsCompact(transfer.timeLeftSeconds)}
                  </Text>
                </View>
              ) : (
                <View style={styles.stateWrap}>
                  <Ionicons
                    name={
                      resolvedStatus === "unlocked"
                        ? "checkmark-circle"
                        : "alert-circle"
                    }
                    size={14}
                    color={pillColor}
                  />
                  <Text style={[styles.stateText, { color: pillColor }]}>
                    {stateTitle}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.amountText}>Credits: {amount.toLocaleString()}</Text>
            <Text style={styles.stateMessage}>{stateMessage}</Text>

            <Text style={styles.metaText}>Vouchers {current}/{required}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${voucherRatio * 100}%` }]} />
            </View>
            <Text style={styles.metaText}>Slots Unlocked {unlockedSlots}/{totalSlots}</Text>
            <View style={[styles.progressTrack, styles.slotTrack]}>
              <View
                style={[styles.slotFill, { width: `${slotsRatio * 100}%` }]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(16),
    padding: scaleSize(16),
    marginBottom: scaleSize(20),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  title: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: scaleSize(10),
  },
  row: {
    backgroundColor: "#F8FAFC",
    borderRadius: scaleSize(12),
    padding: scaleSize(12),
    marginBottom: scaleSize(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rowInactive: {
    backgroundColor: "#F8FAFC",
  },
  rowUnlocked: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  rowExpired: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  rowHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleSize(8),
  },
  statusPill: {
    borderRadius: scaleSize(999),
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(4),
  },
  statusPillText: {
    fontSize: scaleFontSize(11),
    fontWeight: "700",
  },
  timerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerText: {
    fontSize: scaleFontSize(12),
    fontWeight: "700",
    color: "#1E3A8A",
  },
  stateWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stateText: {
    fontSize: scaleFontSize(12),
    fontWeight: "700",
  },
  amountText: {
    fontSize: scaleFontSize(14),
    color: "#0F172A",
    fontWeight: "700",
    marginBottom: scaleSize(4),
  },
  stateMessage: {
    fontSize: scaleFontSize(12),
    color: "#475569",
    marginBottom: scaleSize(10),
  },
  metaText: {
    fontSize: scaleFontSize(12),
    color: "#334155",
    marginBottom: scaleSize(6),
  },
  progressTrack: {
    height: scaleSize(8),
    borderRadius: scaleSize(999),
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: scaleSize(6),
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
  },
  slotTrack: {
    marginBottom: 0,
  },
  slotFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
  },
});

