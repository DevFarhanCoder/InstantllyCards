import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface VoucherPromoScreenProps {
  onPress: () => void;
  serialNumber?: string;
}

export default function VoucherPromoScreen({
  onPress,
  serialNumber = "VCH-001",
}: VoucherPromoScreenProps) {
  return (
    <View style={styles.container}>
      {/* Attention-Catching Box Wrapper */}
      <View style={styles.voucherBox}>
        <LinearGradient
          colors={["#FF9500", "#FFD700", "#FF9500"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={styles.innerBox}>
            {/* Serial Number Badge */}
            <View style={styles.serialBadge}>
              <Text style={styles.serialText}>Serial No: {serialNumber}</Text>
            </View>

            {/* Voucher Image - Tappable */}
            <TouchableOpacity
              onPress={onPress}
              activeOpacity={0.85}
              style={styles.imageContainer}
            >
              <Image
                source={require("../assets/images/1stVoucher.jpeg")}
                style={styles.voucherImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scaleSize(16),
    paddingTop: scaleSize(16),
    paddingBottom: scaleSize(20),
  },
  voucherBox: {
    borderRadius: scaleSize(20),
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  gradientBorder: {
    borderRadius: scaleSize(20),
    padding: scaleSize(4),
  },
  innerBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(16),
    padding: scaleSize(16),
  },
  serialBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#1F2937",
    paddingHorizontal: scaleSize(14),
    paddingVertical: scaleSize(7),
    borderRadius: scaleSize(8),
    marginBottom: scaleSize(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  serialText: {
    fontSize: scaleFontSize(12),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  imageContainer: {
    borderRadius: scaleSize(12),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  voucherImage: {
    width: "100%",
    height: scaleSize(300),
  },
});
