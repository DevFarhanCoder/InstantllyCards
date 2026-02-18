import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  FlatList,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface VoucherScratchCardProps {
  onContinue: () => void;
  serialNumber?: string;
}

interface VoucherItem {
  id: string;
  title: string;
  value: string;
  originalPrice: string;
  discountedPrice: string;
  discountBadge: string;
  description: string;
  expiryDate: string;
  icon: string;
  colors: [string, string, ...string[]];
  type: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const VOUCHER_DATA: VoucherItem[] = [
  {
    id: "1",
    title: "Instantlly Premium",
    value: "₹3600",
    originalPrice: "₹6000",
    discountedPrice: "₹3600",
    discountBadge: "-40%",
    description: "Build your network & earn credits instantly",
    expiryDate: "31 Dec 2026",
    icon: "business",
    colors: ["#FFFFFF", "#FFFFFF"],
    type: "premium",
  },
];

export default function VoucherScratchCard({
  onContinue,
  serialNumber = "1",
}: VoucherScratchCardProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(
    null,
  );

  const handleCardPress = (voucher: VoucherItem) => {
    setSelectedVoucher(voucher);
    setShowImageModal(true);
  };

  const handlePhonePress = () => {
    Linking.openURL("tel:+919820329571").catch(() => {
      Alert.alert("Error", "Unable to open phone dialer");
    });
  };

  const handleLocationPress = () => {
    const location = "Jogeshwari, Mumbai";
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to open Google Maps");
    });
  };

  const handleContinuePress = () => {
    setShowImageModal(false);
    onContinue();
  };

  const renderVoucherCard = ({ item }: { item: VoucherItem }) => (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => handleCardPress(item)}
      style={styles.cardWrapper}
    >
      <LinearGradient colors={item.colors} style={styles.voucherCard}>
        {/* Discount Badge - Top Right Outside */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discountBadge}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.cardContent}>
          {/* Left Section - Logo and Company Info */}
          <View style={styles.leftSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.companyDetails}>
              <Text style={styles.companyName}>Instantlly</Text>
              <TouchableOpacity
                style={styles.infoRow}
                onPress={handlePhonePress}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={14} color="#3B82F6" />
                <Text style={styles.infoText}>+91 9820329571</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.infoRow}
                onPress={handleLocationPress}
                activeOpacity={0.7}
              >
                <Ionicons name="location" size={14} color="#EF4444" />
                <Text style={styles.infoText}>Jogeshwari, Mumbai</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Section - Amount */}
          <View style={styles.rightSection}>
            <Text style={styles.voucherValue}>{item.value}</Text>
            <Text style={styles.valueLabel}>Value</Text>
          </View>
        </View>

        {/* Redeem Button - Full Width */}
        <TouchableOpacity
          style={styles.redeemButton}
          onPress={() => handleCardPress(item)}
          activeOpacity={0.9}
        >
          <Text style={styles.redeemButtonText}>Redeem Voucher</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Expiry Date */}
        <View style={styles.expiryContainer}>
          <Ionicons name="star" size={12} color="#D97706" />
          <Text style={styles.expiryText}>Valid till August 30th, 2026</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Vouchers</Text>
        <Text style={styles.headerSubtext}>
          {VOUCHER_DATA.length} available offers
        </Text>
      </View>

      {/* Voucher List */}
      <FlatList
        data={VOUCHER_DATA}
        renderItem={renderVoucherCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Image Preview Modal */}
      <Modal
        visible={showImageModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowImageModal(false)}
      >
        <SafeAreaView style={styles.modalGradient}>
          <View style={styles.modalContainer}>
            {/* Header in Modal */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Voucher Details</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Voucher Image */}
            <View style={styles.imageContainer}>
              <Image
                source={require("../assets/images/1stVoucher.jpeg")}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>

            {/* Continue Button */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinuePress}
              >
                <Text style={styles.buttonText}>Continue to Dashboard</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: scaleSize(20),
    paddingTop: scaleSize(20),
    paddingBottom: scaleSize(16),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerText: {
    fontSize: scaleFontSize(32),
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: scaleSize(4),
  },
  headerSubtext: {
    fontSize: scaleFontSize(14),
    fontWeight: "500",
    color: "#6B7280",
  },
  listContent: {
    padding: scaleSize(20),
    paddingBottom: scaleSize(100),
  },
  cardWrapper: {
    marginBottom: scaleSize(16),
  },
  voucherCard: {
    borderRadius: scaleSize(16),
    padding: scaleSize(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    minHeight: scaleSize(180),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    position: "relative",
  },
  discountBadge: {
    position: "absolute",
    top: scaleSize(-12),
    right: scaleSize(16),
    backgroundColor: "#DC2626",
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(8),
    borderRadius: scaleSize(20),
    zIndex: 10,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  discountText: {
    fontSize: scaleFontSize(14),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scaleSize(16),
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  logoContainer: {
    width: scaleSize(60),
    height: scaleSize(60),
    backgroundColor: "#F3F4F6",
    borderRadius: scaleSize(12),
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: scaleSize(50),
    height: scaleSize(50),
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: scaleFontSize(22),
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: scaleSize(4),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: scaleSize(3),
  },
  infoText: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#374151",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  voucherValue: {
    fontSize: scaleFontSize(32),
    fontWeight: "900",
    color: "#DC2626",
  },
  valueLabel: {
    fontSize: scaleFontSize(11),
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: scaleSize(2),
  },
  redeemButton: {
    backgroundColor: "#000000",
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  redeemButtonText: {
    fontSize: scaleFontSize(14),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scaleSize(10),
    gap: 6,
  },
  expiryText: {
    fontSize: scaleFontSize(12),
    fontWeight: "600",
    color: "#D97706",
  },
  modalGradient: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scaleSize(20),
    paddingTop: scaleSize(10),
    paddingBottom: scaleSize(16),
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: "700",
    color: "#1F2937",
  },
  imageContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  modalButtonContainer: {
    paddingHorizontal: scaleSize(20),
    paddingTop: scaleSize(16),
    paddingBottom: scaleSize(10),
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    paddingVertical: scaleSize(16),
    borderRadius: scaleSize(12),
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
