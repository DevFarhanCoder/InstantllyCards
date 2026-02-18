import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scaleFontSize, scaleSize } from "../lib/responsive";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Voucher {
  _id: string;
  voucherNumber: string;
  MRP: number;
  issueDate: string;
  expiryDate: string;
  redeemedStatus: "unredeemed" | "redeemed" | "expired";
  voucherImages?: string[];
  // Admin-created voucher fields
  companyName?: string;
  companyLogo?: string;
  phoneNumber?: string;
  address?: string;
  amount?: number;
  discountPercentage?: number;
  validity?: string;
  voucherImage?: string;
  description?: string;
}

interface VoucherDetailScreenProps {
  voucher: Voucher;
  onContinue: () => void;
  onBack: () => void;
}

export default function VoucherDetailScreen({
  voucher,
  onContinue,
  onBack,
}: VoucherDetailScreenProps) {
  return (
    <View style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onBack}>
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voucher Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Voucher Image - Fixed Size */}
      <View style={styles.imageContainer}>
        <Image
          source={
            voucher.voucherImage === "local" || !voucher.voucherImage
              ? require("../assets/images/1stVoucher.jpeg")
              : voucher.voucherImages && voucher.voucherImages.length > 0
                ? { uri: voucher.voucherImages[0] }
                : require("../assets/images/1stVoucher.jpeg")
          }
          style={styles.voucherImage}
          resizeMode="contain"
        />
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          activeOpacity={0.9}
        >
          <Text style={styles.continueText}>Continue to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: scaleSize(44),
    height: scaleSize(44),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: scaleSize(22),
  },
  headerTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: "600",
    color: "#1F2937",
  },
  placeholder: {
    width: scaleSize(44),
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(20),
    marginBottom: scaleSize(140),
  },
  voucherImage: {
    width: SCREEN_WIDTH - scaleSize(40),
    height: (SCREEN_WIDTH - scaleSize(40)) * 1.4,
    borderRadius: scaleSize(12),
  },
  buttonContainer: {
    position: "absolute",
    bottom: scaleSize(120),
    left: 0,
    right: 0,
    padding: scaleSize(20),
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  continueButton: {
    backgroundColor: "#000000",
    borderRadius: scaleSize(12),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: scaleSize(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueText: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
