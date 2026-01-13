import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";

export default function Transfer() {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [amount, setAmount] = useState("");

  const handleTransfer = () => {
    if (!recipientPhone || !amount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    Alert.alert(
      "Transfer Credits",
      `Transfer ${amount} credits to ${recipientPhone}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            // Transfer logic will be implemented here
            Alert.alert("Success", "Credits transferred successfully!");
            setRecipientPhone("");
            setAmount("");
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>⇄</Text>
          <Text style={styles.title}>Transfer Credits</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Available Credits</Text>
          <Text style={styles.creditAmount}>0</Text>
          <Text style={styles.cardSubtitle}>credits</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Recipient Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter credits amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity style={styles.transferButton} onPress={handleTransfer}>
            <Text style={styles.transferButtonText}>Transfer Credits</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Important Notes</Text>
          <Text style={styles.infoText}>
            • Transfers are instant and cannot be reversed{'\n'}
            • Minimum transfer: 10 credits{'\n'}
            • Verify recipient phone number before transfer
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 60,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 12,
    fontWeight: "500",
  },
  creditAmount: {
    fontSize: 48,
    fontWeight: "700",
    color: "#4F6AF3",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  transferButton: {
    backgroundColor: "#4F6AF3",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#4F6AF3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  transferButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  infoSection: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#78350F",
    lineHeight: 22,
  },
});
