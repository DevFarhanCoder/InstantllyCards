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
  Animated,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { VoucherItem } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";
import axios from "axios";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://localhost:3001";

interface UserSearchResult {
  _id: string;
  name: string;
  phone: string;
  profilePicture?: string;
  credits: number;
  displayPhone: string;
}

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
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Search users as user types
  useEffect(() => {
    const searchUsers = async () => {
      const cleanPhone = recipientPhone.replace(/\D/g, "");

      // Only search if we have at least 3 digits
      if (cleanPhone.length < 3) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await axios.post(
          `${API_BASE}/api/credits/search-users`,
          { query: cleanPhone },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.data.success) {
          setSearchResults(response.data.users);
        }
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [recipientPhone]);

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setRecipientPhone(user.phone);
    setSearchResults([]);
    setError("");
  };

  const handleConfirm = async () => {
    if (!voucher) return;

    setError("");

    // Use the full phone number if a user was selected, otherwise clean the input
    const phoneToSend = selectedUser
      ? selectedUser.phone
      : recipientPhone.replace(/\D/g, "");

    // Validate phone number (at least 10 digits)
    const cleanPhone = phoneToSend.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid phone number or select a user");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(voucher._id, phoneToSend);
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
    setSearchResults([]);
    setSelectedUser(null);
    onClose();
  };

  if (!voucher) return null;

  // Valid if either a user is selected OR phone has at least 10 digits
  const cleanPhoneDigits = recipientPhone.replace(/\D/g, "");
  const isValid = selectedUser !== null || cleanPhoneDigits.length >= 10;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Transfer Voucher</Text>
              <Text style={styles.subtitle}>Send voucher to another user</Text>
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
              <Text style={styles.voucherNumber}>#{voucher.voucherNumber}</Text>
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
                placeholder="Enter phone number"
                placeholderTextColor="#94A3B8"
                value={recipientPhone}
                onChangeText={(text) => {
                  setRecipientPhone(text);
                  setSelectedUser(null);
                }}
                keyboardType="phone-pad"
                maxLength={15}
              />
              {searching && <ActivityIndicator size="small" color="#3B82F6" />}
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => handleSelectUser(item)}
                    >
                      {item.profilePicture ? (
                        <Image
                          source={{ uri: item.profilePicture }}
                          style={styles.suggestionAvatar}
                        />
                      ) : (
                        <View style={styles.suggestionAvatarPlaceholder}>
                          <Ionicons name="person" size={20} color="#94A3B8" />
                        </View>
                      )}
                      <View style={styles.suggestionInfo}>
                        <Text style={styles.suggestionName}>{item.name}</Text>
                        <Text style={styles.suggestionPhone}>
                          {item.displayPhone}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#CBD5E1"
                      />
                    </TouchableOpacity>
                  )}
                  nestedScrollEnabled
                  style={styles.suggestionsList}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(20),
    padding: scaleSize(24),
    width: "90%",
    maxWidth: scaleSize(450),
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
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
  suggestionsContainer: {
    marginTop: scaleSize(8),
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    maxHeight: scaleSize(200),
    overflow: "hidden",
  },
  suggestionsList: {
    flexGrow: 0,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: scaleSize(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  suggestionAvatar: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    marginRight: scaleSize(12),
  },
  suggestionAvatarPlaceholder: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(12),
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: scaleFontSize(15),
    fontWeight: "600",
    color: "#0F172A",
  },
  suggestionPhone: {
    fontSize: scaleFontSize(13),
    color: "#64748B",
    marginTop: 2,
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
