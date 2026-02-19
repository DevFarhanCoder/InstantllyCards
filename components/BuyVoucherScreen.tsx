import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { scaleFontSize, scaleSize } from "../lib/responsive";
import api from "../lib/api";

interface BuyVoucherScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export default function BuyVoucherScreen({
  onBack,
  onSuccess,
}: BuyVoucherScreenProps) {
  const [quantity, setQuantity] = useState(5); // Minimum 5 vouchers
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState<number>(3600); // 1 hour in seconds

  const VOUCHER_PRICE = 1200; // ₹1200 per voucher
  const ACTUAL_PRICE = 6000; // ₹6000 for 5 vouchers
  const DISCOUNTED_PRICE = 3600; // ₹3600 for 5 vouchers (40% discount)
  const DISCOUNT_PERCENT = 40;

  useEffect(() => {
    // Start 1-hour countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          Alert.alert(
            "Time Expired",
            "The purchase window has expired. Please try again.",
            [{ text: "OK", onPress: onBack }],
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateTotal = () => {
    const sets = Math.floor(quantity / 5);
    return sets * DISCOUNTED_PRICE;
  };

  const calculateActualPrice = () => {
    const sets = Math.floor(quantity / 5);
    return sets * ACTUAL_PRICE;
  };

  const calculateSavings = () => {
    return calculateActualPrice() - calculateTotal();
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 5 && newQuantity % 5 === 0) {
      setQuantity(newQuantity);
    }
  };

  const handleBuyNow = async () => {
    try {
      setLoading(true);

      // Initiate payment gateway here
      // For now, we'll simulate the payment process
      const response = await api.post("/mlm/vouchers/purchase", {
        quantity,
        totalAmount: calculateTotal(),
        paymentMethod: "razorpay", // or other payment gateway
      });

      if (response?.success) {
        Alert.alert(
          "Purchase Successful",
          `You have successfully purchased ${quantity} vouchers!`,
          [
            {
              text: "OK",
              onPress: () => {
                onSuccess?.();
                onBack();
              },
            },
          ],
        );
      } else {
        throw new Error(response?.message || "Purchase failed");
      }
    } catch (error: any) {
      Alert.alert(
        "Purchase Failed",
        error?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const initiatePaymentGateway = () => {
    // TODO: Integrate Razorpay or other payment gateway
    // This is a placeholder for the actual payment integration
    Alert.alert(
      "Payment Gateway",
      "Payment gateway integration will be implemented here.\n\nFor now, proceeding with purchase...",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Proceed", onPress: handleBuyNow },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#FFFFFF", "#F9FAFB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Vouchers</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Card */}
        <LinearGradient
          colors={["#EF4444", "#DC2626"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.timerCard}
        >
          <Ionicons name="time" size={24} color="#FFFFFF" />
          <View style={styles.timerContent}>
            <Text style={styles.timerLabel}>Time Remaining to Purchase</Text>
            <Text style={styles.timerValue}>{formatTimer(timer)}</Text>
          </View>
        </LinearGradient>

        {/* Voucher Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="ticket" size={24} color="#10B981" />
            <Text style={styles.infoTitle}>Voucher Details</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price per Voucher:</Text>
            <Text style={styles.infoValue}>₹{VOUCHER_PRICE}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Minimum Purchase:</Text>
            <Text style={styles.infoValue}>5 Vouchers</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Discount:</Text>
            <Text style={[styles.infoValue, styles.discountText]}>
              {DISCOUNT_PERCENT}% OFF
            </Text>
          </View>
        </View>

        {/* Quantity Selector */}
        <View style={styles.quantityCard}>
          <Text style={styles.sectionTitle}>Select Quantity</Text>
          <Text style={styles.sectionSubtitle}>Must be in multiples of 5</Text>
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                quantity <= 5 && styles.quantityButtonDisabled,
              ]}
              onPress={() => handleQuantityChange(-5)}
              disabled={quantity <= 5}
            >
              <Ionicons
                name="remove"
                size={24}
                color={quantity <= 5 ? "#9CA3AF" : "#1F2937"}
              />
            </TouchableOpacity>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <Text style={styles.quantityLabel}>Vouchers</Text>
            </View>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(5)}
            >
              <Ionicons name="add" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.priceCard}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Original Price:</Text>
            <Text style={styles.priceValue}>₹{calculateActualPrice()}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Discount ({DISCOUNT_PERCENT}%):
            </Text>
            <Text style={[styles.priceValue, styles.savingsText]}>
              -₹{calculateSavings()}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Payable:</Text>
            <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
          </View>
          <View style={styles.savingsBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.savingsLabel}>
              You save ₹{calculateSavings()}!
            </Text>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.notesTitle}>Important Points</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="checkmark" size={16} color="#10B981" />
            <Text style={styles.noteText}>
              Each person must connect 5 people to build their network
            </Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="checkmark" size={16} color="#10B981" />
            <Text style={styles.noteText}>
              You have 2 days to connect 5 people after purchase
            </Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="checkmark" size={16} color="#10B981" />
            <Text style={styles.noteText}>
              Credits transfer only after sharing 5 vouchers
            </Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="checkmark" size={16} color="#10B981" />
            <Text style={styles.noteText}>
              If you fail to connect 5 people, credits return to admin
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Buy Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.buyButton, loading && styles.buyButtonDisabled]}
          onPress={initiatePaymentGateway}
          disabled={loading || timer === 0}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={loading ? ["#9CA3AF", "#6B7280"] : ["#10B981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buyButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="#FFFFFF" />
                <Text style={styles.buyButtonText}>
                  Pay ₹{calculateTotal()} via Payment Gateway
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(16),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
  },
  backButton: {
    padding: scaleSize(4),
  },
  headerTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: "700",
    color: "#1F2937",
  },
  placeholder: {
    width: scaleSize(32),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scaleSize(20),
    paddingBottom: scaleSize(100),
  },
  timerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: scaleSize(16),
    borderRadius: scaleSize(12),
    marginBottom: scaleSize(20),
    gap: 12,
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    fontSize: scaleFontSize(12),
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: scaleFontSize(24),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(12),
    padding: scaleSize(16),
    marginBottom: scaleSize(20),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: scaleSize(16),
  },
  infoTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#1F2937",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleSize(8),
  },
  infoLabel: {
    fontSize: scaleFontSize(14),
    color: "#6B7280",
  },
  infoValue: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#1F2937",
  },
  discountText: {
    color: "#10B981",
  },
  quantityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(12),
    padding: scaleSize(20),
    marginBottom: scaleSize(20),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  sectionTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(12),
    color: "#6B7280",
    marginBottom: scaleSize(16),
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityButton: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(24),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityDisplay: {
    alignItems: "center",
  },
  quantityValue: {
    fontSize: scaleFontSize(36),
    fontWeight: "700",
    color: "#1F2937",
  },
  quantityLabel: {
    fontSize: scaleFontSize(12),
    color: "#6B7280",
  },
  priceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(12),
    padding: scaleSize(20),
    marginBottom: scaleSize(20),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleSize(8),
  },
  priceLabel: {
    fontSize: scaleFontSize(14),
    color: "#6B7280",
  },
  priceValue: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#1F2937",
  },
  savingsText: {
    color: "#10B981",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: scaleSize(12),
  },
  totalLabel: {
    fontSize: scaleFontSize(18),
    fontWeight: "700",
    color: "#1F2937",
  },
  totalValue: {
    fontSize: scaleFontSize(24),
    fontWeight: "700",
    color: "#10B981",
  },
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(8),
    borderRadius: scaleSize(8),
    marginTop: scaleSize(12),
    gap: 6,
  },
  savingsLabel: {
    fontSize: scaleFontSize(13),
    fontWeight: "600",
    color: "#10B981",
  },
  notesCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: scaleSize(12),
    padding: scaleSize(16),
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: scaleSize(12),
  },
  notesTitle: {
    fontSize: scaleFontSize(14),
    fontWeight: "700",
    color: "#1E40AF",
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: scaleSize(8),
  },
  noteText: {
    flex: 1,
    fontSize: scaleFontSize(12),
    color: "#1E40AF",
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: scaleSize(20),
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  buyButton: {
    borderRadius: scaleSize(12),
    overflow: "hidden",
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: scaleSize(16),
  },
  buyButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
