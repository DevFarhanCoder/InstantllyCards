import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { scaleFontSize, scaleSize } from "../lib/responsive";
import api from "../lib/api";

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
  const router = useRouter();
  const [availableVouchers, setAvailableVouchers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkVoucherAvailability();
  }, []);

  const checkVoucherAvailability = async () => {
    try {
      const response = await api.get("/mlm/vouchers");
      if (response?.success) {
        const available =
          response.vouchers?.filter(
            (v: any) => !v.redeemedStatus || v.redeemedStatus === "unredeemed",
          ).length || 0;
        setAvailableVouchers(available);
      }
    } catch (error) {
      console.error("Error checking voucher availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemNow = () => {
    if (availableVouchers > 0) {
      // Navigate to Ads/Business Promotion section
      router.push("/business-promotion");
    } else {
      Alert.alert(
        "No Vouchers Available",
        "You don't have any available vouchers to redeem. Please purchase vouchers first.",
      );
    }
  };

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Voucher Image - Full Screen */}
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

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Redeem Now Button - Only if available vouchers */}
          {availableVouchers > 0 ? (
            <TouchableOpacity
              style={styles.redeemButton}
              onPress={handleRedeemNow}
              activeOpacity={0.9}
            >
              <Ionicons name="megaphone" size={20} color="#FFFFFF" />
              <Text style={styles.redeemText}>Redeem Now - Publish Ad</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.noVoucherCard}>
              <Ionicons name="alert-circle" size={24} color="#F59E0B" />
              <Text style={styles.noVoucherText}>
                No vouchers available in your account
              </Text>
            </View>
          )}

          {/* Continue to Dashboard Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.continueText}>Continue to Dashboard</Text>
            <Ionicons name="arrow-forward" size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleSize(100),
  },
  imageContainer: {
    minHeight: scaleSize(500),
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
  },
  voucherImage: {
    width: SCREEN_WIDTH,
    height: scaleSize(500),
  },
  buttonContainer: {
    padding: scaleSize(20),
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  redeemButton: {
    backgroundColor: "#10B981",
    borderRadius: scaleSize(12),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: scaleSize(16),
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  redeemText: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  noVoucherCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: scaleSize(16),
    borderRadius: scaleSize(12),
    gap: 10,
  },
  noVoucherText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    fontWeight: "600",
    color: "#92400E",
  },
  continueButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: scaleSize(12),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: scaleSize(16),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  continueText: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#1F2937",
  },
});
