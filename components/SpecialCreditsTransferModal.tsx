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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scaleFontSize, scaleSize } from "../lib/responsive";

interface SpecialCreditsTransferModalProps {
  visible: boolean;
  slotNumber: number | null;
  creditAmount: number;
  onClose: () => void;
  onConfirm: (phone: string) => Promise<void>;
}

export default function SpecialCreditsTransferModal({
  visible,
  slotNumber,
  creditAmount,
  onClose,
  onConfirm,
}: SpecialCreditsTransferModalProps) {
  const [phone, setPhone] = useState("");
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
    setError("");

    // Validate phone number
    if (!phone.trim()) {
      setError("Please enter a phone number");
      return;
    }

    // Clean phone number (remove spaces, hyphens, etc.)
    let cleanPhone = phone.replace(/[\s-()]/g, "");

    // Ensure phone starts with +
    if (!cleanPhone.startsWith("+")) {
      // If it starts with a digit, assume it needs +91 (India)
      if (/^\d/.test(cleanPhone)) {
        cleanPhone = "+91" + cleanPhone;
      } else {
        setError("Phone number must start with + or country code");
        return;
      }
    }

    // Validate format: + followed by 10-15 digits
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError("Invalid phone number format. Use: +919867477227");
      return;
    }

    try {
      setLoading(true);
      await onConfirm(cleanPhone);
      handleClose();
    } catch (err: any) {
      setError(err?.message || "Failed to send credits");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhone("");
    setError("");
    setLoading(false);
    onClose();
  };

  // Admin sends full amount, recipients will get it divided later
  const sendAmount = creditAmount;
  const recipientWillReceive = creditAmount;

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

        <View style={styles.centeredView}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [500, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View style={styles.header}>
                  <View>
                    <Text style={styles.title}>Send Special Credits</Text>
                    <Text style={styles.subtitle}>User {slotNumber}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close-circle" size={28} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Credit Amount Display */}
                <View style={styles.creditAmountCard}>
                  <View style={styles.creditAmountRow}>
                    <Ionicons name="gift" size={24} color="#10B981" />
                    <View style={styles.creditAmountInfo}>
                      <Text style={styles.creditAmountLabel}>
                        Credits to Send
                      </Text>
                      <Text style={styles.creditAmountValue}>
                        {sendAmount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Phone Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.label}>Recipient Phone Number</Text>
                  <Text style={styles.helperText}>
                    Enter with country code (e.g., +919867477227) or just the
                    number
                  </Text>
                  <View style={styles.phoneInputContainer}>
                    <Ionicons name="call" size={20} color="#6B7280" />
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="+919867477227 or 9867477227"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleConfirm}
                      autoFocus={true}
                    />
                  </View>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  {/* Quick Suggestions */}
                  {!phone && !error && (
                    <View style={styles.suggestionsContainer}>
                      <Text style={styles.suggestionsLabel}>Quick Fill:</Text>
                      <View style={styles.suggestionsRow}>
                        <TouchableOpacity
                          style={styles.suggestionChip}
                          onPress={() => setPhone("+91")}
                        >
                          <Text style={styles.suggestionText}>+91 (India)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.suggestionChip}
                          onPress={() => setPhone("+1")}
                        >
                          <Text style={styles.suggestionText}>+1 (US)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.suggestionChip}
                          onPress={() => setPhone("+44")}
                        >
                          <Text style={styles.suggestionText}>+44 (UK)</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#3B82F6"
                  />
                  <Text style={styles.infoText}>
                    The recipient will receive{" "}
                    {recipientWillReceive.toLocaleString()} credits and get 5
                    slots to distribute (auto-divided ÷5).
                  </Text>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (!phone.trim() || loading) && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!phone.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                      <Text style={styles.confirmButtonText}>
                        Send {sendAmount.toLocaleString()} Credits
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  centeredView: {
    width: "100%",
    maxWidth: scaleSize(500),
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(24),
    padding: scaleSize(24),
    maxHeight: "85%",
    width: "90%",
    marginHorizontal: "5%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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
    color: "#1F2937",
    marginBottom: scaleSize(4),
  },
  subtitle: {
    fontSize: scaleFontSize(14),
    color: "#10B981",
    fontWeight: "600",
  },
  closeButton: {
    padding: scaleSize(4),
  },
  creditAmountCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: scaleSize(12),
    padding: scaleSize(16),
    marginBottom: scaleSize(24),
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  creditAmountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  creditAmountInfo: {
    marginLeft: scaleSize(12),
  },
  creditAmountLabel: {
    fontSize: scaleFontSize(12),
    color: "#059669",
    marginBottom: scaleSize(4),
  },
  creditAmountValue: {
    fontSize: scaleFontSize(24),
    fontWeight: "700",
    color: "#047857",
  },
  inputSection: {
    marginBottom: scaleSize(20),
  },
  label: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#374151",
    marginBottom: scaleSize(4),
  },
  helperText: {
    fontSize: scaleFontSize(11),
    color: "#6B7280",
    marginBottom: scaleSize(8),
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: scaleSize(12),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(14),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  phoneInput: {
    flex: 1,
    fontSize: scaleFontSize(16),
    color: "#1F2937",
    marginLeft: scaleSize(12),
    padding: 0,
  },
  errorText: {
    fontSize: scaleFontSize(12),
    color: "#EF4444",
    marginTop: scaleSize(8),
  },
  suggestionsContainer: {
    marginTop: scaleSize(12),
  },
  suggestionsLabel: {
    fontSize: scaleFontSize(11),
    color: "#6B7280",
    marginBottom: scaleSize(6),
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scaleSize(8),
  },
  suggestionChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(8),
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  suggestionText: {
    fontSize: scaleFontSize(12),
    color: "#374151",
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: scaleSize(12),
    padding: scaleSize(12),
    marginBottom: scaleSize(24),
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoText: {
    flex: 1,
    fontSize: scaleFontSize(12),
    color: "#1E40AF",
    marginLeft: scaleSize(8),
    lineHeight: scaleFontSize(16),
  },
  confirmButton: {
    backgroundColor: "#10B981",
    borderRadius: scaleSize(12),
    paddingVertical: scaleSize(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scaleSize(8),
  },
  confirmButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  confirmButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: scaleSize(8),
  },
});
