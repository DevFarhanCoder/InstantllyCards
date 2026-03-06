import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scaleFontSize, scaleSize } from "../lib/responsive";
import { MlmActiveTransfer } from "../types/network";
import { formatSecondsCompact, statusColor, statusLabel } from "../lib/mlmTransferUi";

interface MLMTransferStatusCardProps {
  transfers: MlmActiveTransfer[];
}

export default function MLMTransferStatusCard({
  transfers,
}: MLMTransferStatusCardProps) {
  if (!transfers?.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transfer Unlock Status</Text>
      {transfers.map((transfer) => {
        const required = transfer.requiredVoucherCount || 0;
        const current = transfer.currentVoucherCount || 0;
        const ratio =
          required > 0 ? Math.max(0, Math.min(1, current / required)) : 0;
        const totalSlots = transfer.slotCount || 0;
        const unlockedSlots = transfer.unlockedSlots || 0;
        const pillColor = statusColor(transfer.status);

        return (
          <View key={transfer.transferId} style={styles.row}>
            <View style={styles.rowHead}>
              <View style={[styles.statusPill, { backgroundColor: `${pillColor}20` }]}>
                <Text style={[styles.statusPillText, { color: pillColor }]}>
                  {statusLabel(transfer.status)}
                </Text>
              </View>
              <View style={styles.timerWrap}>
                <Ionicons name="timer-outline" size={14} color="#1E3A8A" />
                <Text style={styles.timerText}>
                  {formatSecondsCompact(transfer.timeLeftSeconds)}
                </Text>
              </View>
            </View>

            <Text style={styles.metaText}>
              Vouchers {current}/{required}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
            </View>
            <Text style={styles.metaText}>
              Slots Unlocked {unlockedSlots}/{totalSlots || 5}
            </Text>

            {transfer.status === "returned_timeout" && (
              <Text style={styles.timeoutText}>Timed out, returned to sender</Text>
            )}
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
  timeoutText: {
    fontSize: scaleFontSize(12),
    color: "#B91C1C",
    fontWeight: "600",
    marginTop: scaleSize(4),
  },
});

