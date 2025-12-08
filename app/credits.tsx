import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function Credits() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>💰</Text>
          <Text style={styles.title}>Credits</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Credits</Text>
          <Text style={styles.creditAmount}>0</Text>
          <Text style={styles.cardSubtitle}>credits remaining</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>How Credits Work</Text>
          <Text style={styles.infoText}>
            • Credits are used to post advertisements{'\n'}
            • Each ad costs a certain number of credits{'\n'}
            • Purchase credits to continue posting ads{'\n'}
            • Credits never expire
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Credit Packages</Text>
          <Text style={styles.infoText}>Coming soon...</Text>
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
  infoSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
  },
});
