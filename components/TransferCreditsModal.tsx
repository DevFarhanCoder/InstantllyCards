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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NetworkUser } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";
// import { BlurView } from "expo-blur"; // Temporarily disabled - requires native rebuild

interface TransferCreditsModalProps {
  visible: boolean;
  recipient: NetworkUser | null;
  availableCredits: number;
  onClose: () => void;
  onConfirm: (amount: number, note: string) => void;
}

export default function TransferCreditsModal({
  visible,
  recipient,
  availableCredits,
  onClose,
  onConfirm,
}: TransferCreditsModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
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

  const handleConfirm = () => {
    const numAmount = parseInt(amount);
    if (numAmount > 0 && numAmount <= availableCredits) {
      onConfirm(numAmount, note);
      setAmount("");
      setNote("");
    }
  };

  const handleClose = () => {
    setAmount("");
    setNote("");
    onClose();
  };

  if (!recipient) return null;

  const numAmount = parseInt(amount) || 0;
  const isValid =
    numAmount > 0 && numAmount <= availableCredits && numAmount <= 5;

  const QuickAmountButton = ({ value }: { value: number }) => (
    <TouchableOpacity
      style={styles.quickAmountBtn}
      onPress={() => setAmount(value.toString())}
    >
      <Text style={styles.quickAmountText}>{value}</Text>
    </TouchableOpacity>
  );

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
                      outputRange: [500, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Transfer Credits</Text>
                <Text style={styles.recipientName}>To: {recipient.name}</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Available Credits */}
            <View style={styles.availableSection}>
              <Ionicons name="wallet" size={20} color="#10B981" />
              <Text style={styles.availableText}>
                Available:{" "}
                <Text style={styles.availableAmount}>{availableCredits}</Text>{" "}
                credits
              </Text>
            </View>

            {/* Amount Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountInputContainer}>
                <Ionicons name="gift" size={20} color="#6B7280" />
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.currencyText}>credits</Text>
              </View>
              {numAmount > availableCredits && (
                <Text style={styles.errorText}>
                  Insufficient credits available
                </Text>
              )}
              {numAmount > 5 && (
                <Text style={styles.errorText}>
                  Maximum 5 credits per transfer
                </Text>
              )}
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountsSection}>
              <Text style={styles.label}>Quick Select</Text>
              <View style={styles.quickAmountsRow}>
                <QuickAmountButton value={1} />
                <QuickAmountButton value={2} />
                <QuickAmountButton value={3} />
                <QuickAmountButton value={5} />
              </View>
            </View>

            {/* Note Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Note (Optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a note for this transfer"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !isValid && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!isValid}
              >
                <Ionicons name="checkmark-circle" size={20} color="#1F2937" />
                <Text style={styles.confirmButtonText}>
                  Transfer {numAmount || 0}
                </Text>
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
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent backdrop
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  keyboardView: {
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
    padding: scaleSize(24),
    maxHeight: "90%",
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
    marginBottom: 4,
  },
  recipientName: {
    fontSize: scaleFontSize(16),
    color: "#6B7280",
  },
  closeButton: {
    padding: scaleSize(4),
  },
  availableSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    marginBottom: scaleSize(20),
    gap: 8,
  },
  availableText: {
    fontSize: scaleFontSize(16),
    color: "#6B7280",
  },
  availableAmount: {
    fontWeight: "700",
    color: "#10B981",
  },
  inputSection: {
    marginBottom: scaleSize(20),
  },
  label: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#374151",
    marginBottom: scaleSize(8),
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: scaleSize(12),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(14),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    gap: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: scaleFontSize(18),
    fontWeight: "600",
    color: "#1F2937",
  },
  currencyText: {
    fontSize: scaleFontSize(16),
    color: "#6B7280",
  },
  errorText: {
    fontSize: scaleFontSize(16),
    color: "#EF4444",
    marginTop: scaleSize(6),
  },
  quickAmountsSection: {
    marginBottom: scaleSize(20),
  },
  quickAmountsRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(10),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  quickAmountText: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#10B981",
  },
  noteInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: scaleSize(12),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
    fontSize: scaleFontSize(16),
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    minHeight: scaleSize(80),
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: scaleSize(8),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: scaleSize(16),
    borderRadius: scaleSize(12),
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  cancelButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#6B7280",
  },
  confirmButton: {
    flex: 1.5,
    flexDirection: "row",
    paddingVertical: scaleSize(16),
    borderRadius: scaleSize(12),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: "#E5E7EB",
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
