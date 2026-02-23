import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DirectBuyer } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface DirectBuyersListProps {
  buyers: DirectBuyer[];
  onTransferCredits?: (buyerId: string) => void;
  onTransferVouchers?: (buyerId: string) => void;
  onTransfer?: () => void;
}

export default function DirectBuyersList({
  buyers,
  onTransferCredits,
  onTransferVouchers,
  onTransfer,
}: DirectBuyersListProps) {
  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => undefined);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Direct Buyers</Text>
        {onTransfer && (
          <TouchableOpacity
            style={styles.headerTransferButton}
            onPress={onTransfer}
          >
            <Ionicons name="send" size={16} color="#3B82F6" />
            <Text style={styles.headerTransferText}>Transfer</Text>
          </TouchableOpacity>
        )}
      </View>
      {buyers.length === 0 ? (
        <Text style={styles.emptyText}>No direct buyers yet</Text>
      ) : (
        buyers.map((buyer) => (
          <View key={buyer.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.buyerInfo}>
                <Text style={styles.name}>{buyer.name}</Text>
                <Text style={styles.meta}>{buyer.phone}</Text>
                <Text style={styles.meta}>Team: {buyer.teamSize}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(buyer.phone)}
              >
                <Ionicons name="call" size={16} color="#0F172A" />
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
            </View>

            {/* Transfer buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.transferButton}
                onPress={() => onTransferCredits?.(buyer.id)}
              >
                <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
                <Text style={styles.transferButtonText}>Transfer Credits</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.transferButton}
                onPress={() => onTransferVouchers?.(buyer.id)}
              >
                <Ionicons name="ticket-outline" size={16} color="#FFFFFF" />
                <Text style={styles.transferButtonText}>Transfer Vouchers</Text>
              </TouchableOpacity>
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
  headerTransferButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(8),
    borderRadius: scaleSize(10),
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  headerTransferText: {
    fontSize: scaleFontSize(13),
    fontWeight: "600",
    color: "#3B82F6",
  },
  emptyText: {
    fontSize: scaleFontSize(14),
    color: "#94A3B8",
  },
  card: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
    paddingVertical: scaleSize(12),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buyerInfo: {
    flex: 1,
  },
  name: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#0F172A",
  },
  meta: {
    fontSize: scaleFontSize(12),
    color: "#64748B",
    marginTop: 2,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(8),
    borderRadius: scaleSize(10),
  },
  callText: {
    fontSize: scaleFontSize(12),
    fontWeight: "600",
    color: "#0F172A",
  },
  buttonRow: {
    flexDirection: "row",
    gap: scaleSize(8),
    marginTop: scaleSize(12),
  },
  transferButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#3B82F6",
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(10),
  },
  transferButtonText: {
    fontSize: scaleFontSize(12),
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
