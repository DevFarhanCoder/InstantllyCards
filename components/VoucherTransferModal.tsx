import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VoucherItem } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface VoucherTransferModalProps {
  visible: boolean;
  voucher: VoucherItem | null;
  onClose: () => void;
  onConfirm: (voucherId: string, recipientPhone: string) => Promise<void>;
}

export default function VoucherTransferModal({
  visible,
  voucher,
  onClose,
  onConfirm,
}: VoucherTransferModalProps) {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (!voucher) return;

    setError("");

    // Validate phone number
    const cleanPhone = recipientPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(voucher._id, cleanPhone);
      handleClose();
    } catch (err: any) {
      setError(err?.message || "Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRecipientPhone("");
    setError("");
    setLoading(false);
    onClose();
  };

  if (!voucher) return null;

  const isValid = recipientPhone.replace(/\D/g, "").length === 10;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Transfer Voucher</Text>
                <Text style={styles.subtitle}>
                  Send voucher to another user
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.voucherInfo}>
              <View style={styles.voucherIcon}>
                <Ionicons name="ticket" size={28} color="#F59E0B" />
              </View>
              <View style={styles.voucherDetails}>
                <Text style={styles.voucherNumber}>
                  #{voucher.voucherNumber}
                </Text>
                <Text style={styles.voucherMRP}>MRP ₹{voucher.MRP}</Text>
                <Text style={styles.voucherExpiry}>
                  Expires{" "}
                  {new Date(voucher.expiryDate).toLocaleDateString("en-IN")}
                </Text>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Recipient Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit phone number"
                  placeholderTextColor="#94A3B8"
                  value={recipientPhone}
                  onChangeText={setRecipientPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={18} color="#F59E0B" />
              <Text style={styles.warningText}>
                This action cannot be undone. The voucher will be permanently
                transferred to the recipient.
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  (!isValid || loading) && styles.confirmBtnDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!isValid || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmText}>Transfer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
    padding: scaleSize(24),
    paddingBottom: scaleSize(32),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scaleSize(20),
  },
  title: {
    fontSize: scaleFontSize(22),
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: scaleFontSize(14),
    color: "#64748B",
    marginTop: 4,
  },
  closeBtn: {
    padding: scaleSize(4),
  },
  voucherInfo: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: scaleSize(12),
    padding: scaleSize(16),
    marginBottom: scaleSize(20),
  },
  voucherIcon: {
    width: scaleSize(56),
    height: scaleSize(56),
    borderRadius: scaleSize(28),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(12),
  },
  voucherDetails: {
    flex: 1,
    justifyContent: "center",
  },
  voucherNumber: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#92400E",
  },
  voucherMRP: {
    fontSize: scaleFontSize(14),
    color: "#92400E",
    marginTop: 2,
  },
  voucherExpiry: {
    fontSize: scaleFontSize(12),
    color: "#B45309",
    marginTop: 2,
  },
  inputSection: {
    marginBottom: scaleSize(16),
  },
  inputLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#334155",
    marginBottom: scaleSize(8),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: scaleSize(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: scaleSize(12),
  },
  inputIcon: {
    marginRight: scaleSize(8),
  },
  input: {
    flex: 1,
    paddingVertical: scaleSize(14),
    fontSize: scaleFontSize(16),
    color: "#0F172A",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: scaleSize(12),
    borderRadius: scaleSize(8),
    marginBottom: scaleSize(16),
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: "#DC2626",
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    padding: scaleSize(12),
    borderRadius: scaleSize(10),
    marginBottom: scaleSize(20),
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: "#92400E",
    lineHeight: scaleFontSize(18),
  },
  actions: {
    flexDirection: "row",
    gap: scaleSize(12),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: scaleSize(14),
    borderRadius: scaleSize(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  cancelText: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#64748B",
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    paddingVertical: scaleSize(14),
    borderRadius: scaleSize(12),
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDisabled: {
    backgroundColor: "#94A3B8",
  },
  confirmText: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
