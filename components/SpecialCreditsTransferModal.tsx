import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scaleFontSize, scaleSize } from "../lib/responsive";
import api from "../lib/api";

interface SpecialCreditsTransferModalProps {
  visible: boolean;
  slotNumber: number | null;
  creditAmount: number;
  onClose: () => void;
  onConfirm: (phone: string) => Promise<void>;
}

interface UserSuggestion {
  id: string;
  name: string;
  phone: string;
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
  const [searchLoading, setSearchLoading] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noUserFound, setNoUserFound] = useState(false);

  // Search for users when phone input changes — always search (no skip for +91)
  useEffect(() => {
    setNoUserFound(false);
    const searchUsers = async () => {
      // Strip +91 / +1 etc. prefix for the search query so backend can match
      const stripped = phone.replace(/^\+\d{1,3}/, "").replace(/[\s-()]/g, "");

      if (!stripped || stripped.length < 4) {
        setUserSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        setSearchLoading(true);
        const response = await api.get(
          `/users/search?q=${encodeURIComponent(stripped)}`,
        );
        if (response?.users && Array.isArray(response.users)) {
          setUserSuggestions(response.users.slice(0, 5));
          setShowSuggestions(response.users.length > 0);
          setNoUserFound(response.users.length === 0 && stripped.length >= 10);
        }
      } catch (err) {
        console.error("User search error:", err);
        setUserSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 400);
    return () => clearTimeout(debounceTimer);
  }, [phone]);

  const handleClose = () => {
    setPhone("");
    setError("");
    setLoading(false);
    setUserSuggestions([]);
    setShowSuggestions(false);
    setNoUserFound(false);
    onClose();
  };

  const handleConfirm = async () => {
    setError("");

    if (!phone.trim()) {
      setError("Please enter a phone number");
      return;
    }

    let cleanPhone = phone.replace(/[\s-()]/g, "");

    if (!cleanPhone.startsWith("+")) {
      if (/^\d/.test(cleanPhone)) {
        cleanPhone = "+91" + cleanPhone;
      } else {
        setError("Phone number must start with + or country code");
        return;
      }
    }

    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError("Invalid format. Use: +919867477227 or 9867477227");
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

  const handleSelectUser = (user: UserSuggestion) => {
    setPhone(user.phone);
    setShowSuggestions(false);
    setUserSuggestions([]);
  };

  // Admin sends full amount
  const sendAmount = creditAmount;
  const recipientWillReceive = creditAmount;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Send Special Credits</Text>
                <Text style={styles.subtitle}>Slot {slotNumber}</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Scrollable middle content */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              style={styles.scrollArea}
            >
              {/* Credit Amount */}
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
                  Enter number (e.g., 9867477227 or +919867477227)
                </Text>
                <View style={styles.phoneInputContainer}>
                  <Ionicons name="call" size={20} color="#6B7280" />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="9867477227"
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
                  {searchLoading && (
                    <ActivityIndicator size="small" color="#10B981" />
                  )}
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Suggestions dropdown */}
                {showSuggestions && userSuggestions.length > 0 && (
                  <View style={styles.suggestionsDropdown}>
                    {userSuggestions.map((item, index) => (
                      <View key={item.id}>
                        {index > 0 && (
                          <View style={styles.suggestionSeparator} />
                        )}
                        <TouchableOpacity
                          style={styles.suggestionItem}
                          onPress={() => handleSelectUser(item)}
                        >
                          <Ionicons
                            name="person-circle"
                            size={32}
                            color="#10B981"
                            style={styles.suggestionIcon}
                          />
                          <View style={styles.suggestionInfo}>
                            <Text style={styles.suggestionName}>
                              {item.name}
                            </Text>
                            <Text style={styles.suggestionPhone}>
                              {item.phone}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#9CA3AF"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Unregistered warning */}
                {noUserFound && !showSuggestions && !searchLoading && (
                  <View style={styles.notFoundBox}>
                    <Ionicons
                      name="warning-outline"
                      size={16}
                      color="#F59E0B"
                    />
                    <Text style={styles.notFoundText}>
                      Not registered yet. Ask them to sign up first.
                    </Text>
                  </View>
                )}
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={styles.infoText}>
                  Recipient gets {recipientWillReceive.toLocaleString()} credits
                  and 5 slots to distribute (auto-divided ÷5).
                </Text>
              </View>
            </ScrollView>

            {/* Send button — always visible at bottom */}
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
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
    paddingHorizontal: scaleSize(20),
    paddingTop: scaleSize(20),
    paddingBottom: scaleSize(16),
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  scrollArea: {
    flexGrow: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scaleSize(16),
  },
  title: {
    fontSize: scaleFontSize(20),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: scaleSize(2),
  },
  subtitle: {
    fontSize: scaleFontSize(13),
    color: "#10B981",
    fontWeight: "600",
  },
  closeButton: {
    padding: scaleSize(4),
  },
  creditAmountCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: scaleSize(12),
    padding: scaleSize(14),
    marginBottom: scaleSize(16),
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
    fontSize: scaleFontSize(11),
    color: "#059669",
    marginBottom: scaleSize(2),
  },
  creditAmountValue: {
    fontSize: scaleFontSize(22),
    fontWeight: "700",
    color: "#047857",
  },
  inputSection: {
    marginBottom: scaleSize(16),
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
    paddingHorizontal: scaleSize(14),
    paddingVertical: scaleSize(12),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  phoneInput: {
    flex: 1,
    fontSize: scaleFontSize(16),
    color: "#1F2937",
    marginLeft: scaleSize(10),
    padding: 0,
  },
  errorText: {
    fontSize: scaleFontSize(12),
    color: "#EF4444",
    marginTop: scaleSize(6),
  },
  notFoundBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: scaleSize(8),
    padding: scaleSize(10),
    marginTop: scaleSize(8),
    borderWidth: 1,
    borderColor: "#FDE68A",
    gap: scaleSize(6),
  },
  notFoundText: {
    flex: 1,
    fontSize: scaleFontSize(12),
    color: "#92400E",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: scaleSize(10),
    padding: scaleSize(10),
    marginBottom: scaleSize(12),
    borderWidth: 1,
    borderColor: "#BFDBFE",
    gap: scaleSize(8),
  },
  infoText: {
    flex: 1,
    fontSize: scaleFontSize(12),
    color: "#1E40AF",
    lineHeight: scaleFontSize(17),
  },
  confirmButton: {
    backgroundColor: "#10B981",
    borderRadius: scaleSize(12),
    paddingVertical: scaleSize(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scaleSize(4),
    gap: scaleSize(8),
  },
  confirmButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  confirmButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  suggestionsDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(10),
    marginTop: scaleSize(6),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: scaleSize(180),
    overflow: "hidden",
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(10),
  },
  suggestionIcon: {
    marginRight: scaleSize(10),
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: scaleSize(2),
  },
  suggestionPhone: {
    fontSize: scaleFontSize(12),
    color: "#6B7280",
  },
  suggestionSeparator: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
});
