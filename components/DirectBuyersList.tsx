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
}

export default function DirectBuyersList({ buyers }: DirectBuyersListProps) {
  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => undefined);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Direct Buyers</Text>
      {buyers.length === 0 ? (
        <Text style={styles.emptyText}>No direct buyers yet</Text>
      ) : (
        buyers.map((buyer) => (
          <View key={buyer.id} style={styles.row}>
            <View>
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
  title: {
    fontSize: scaleFontSize(18),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: scaleSize(12),
  },
  emptyText: {
    fontSize: scaleFontSize(14),
    color: "#94A3B8",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleSize(12),
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
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
});
