import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { scaleFontSize, scaleSize, moderateScale } from "@/lib/responsive";
import api from "@/lib/api";
import { formatIndianNumber } from "@/utils/formatNumber";

export default function Credits() {
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/credits/balance');
      if (response?.success) {
        setCredits(response.credits || 0);
        setExpiryDate(response.creditsExpiryDate);
        setDaysRemaining(response.daysRemaining);
        setIsExpired(response.isExpired || false);
      }
    } catch (err: any) {
      console.error('Error fetching credits:', err);
      setError(err?.message || 'Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4F6AF3" />
        <Text style={styles.loadingText}>Loading credits...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>❌ {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>💰</Text>
          <Text style={styles.title}>Credits</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Credits</Text>
          <Text style={styles.creditAmount}>{formatIndianNumber(credits)}</Text>
          <Text style={styles.cardSubtitle}>credits remaining</Text>
          
          {expiryDate && (
            <View style={[styles.expiryBanner, isExpired && styles.expiredBanner]}>
              <Text style={[styles.expiryIcon, isExpired && styles.expiredIcon]}>
                {isExpired ? '⚠️' : '⏰'}
              </Text>
              <View style={styles.expiryTextContainer}>
                {isExpired ? (
                  <Text style={styles.expiredText}>Credits Expired</Text>
                ) : (
                  <>
                    <Text style={styles.expiryText}>
                      Expires on: <Text style={styles.expiryDate}>31 March 2026</Text>
                    </Text>
                    {daysRemaining !== null && (
                      <Text style={styles.daysRemaining}>
                        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                      </Text>
                    )}
                  </>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>How Credits Work</Text>
          <Text style={styles.infoText}>
            • Credits are used to post advertisements{'\n'}
            • Each ad costs a certain number of credits{'\n'}
            • Purchase credits to continue posting ads{'\n'}
            • All credits expire on 31 March 2026
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: scaleSize(12),
    fontSize: scaleFontSize(16),
    color: "#6B7280",
  },
  errorText: {
    fontSize: scaleFontSize(16),
    color: "#EF4444",
    textAlign: "center",
    paddingHorizontal: scaleSize(20),
  },
  content: {
    padding: scaleSize(20),
  },
  header: {
    alignItems: "center",
    marginBottom: scaleSize(24),
  },
  icon: {
    fontSize: scaleFontSize(60),
    marginBottom: scaleSize(12),
  },
  title: {
    fontSize: scaleFontSize(28),
    fontWeight: "700",
    color: "#111827",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    padding: scaleSize(24),
    alignItems: "center",
    marginBottom: scaleSize(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: scaleFontSize(16),
    color: "#6B7280",
    marginBottom: scaleSize(12),
    fontWeight: "500",
  },
  creditAmount: {
    fontSize: scaleFontSize(48),
    fontWeight: "700",
    color: "#4F6AF3",
    marginBottom: scaleSize(8),
  },
  cardSubtitle: {
    fontSize: scaleFontSize(14),
    color: "#9CA3AF",
  },
  expiryBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: moderateScale(12),
    padding: scaleSize(16),
    marginTop: scaleSize(20),
    width: "100%",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  expiredBanner: {
    backgroundColor: "#FEE2E2",
    borderLeftColor: "#EF4444",
  },
  expiryIcon: {
    fontSize: scaleFontSize(32),
    marginRight: scaleSize(12),
  },
  expiredIcon: {
    fontSize: scaleFontSize(32),
  },
  expiryTextContainer: {
    flex: 1,
  },
  expiryText: {
    fontSize: scaleFontSize(14),
    color: "#92400E",
    fontWeight: "600",
  },
  expiryDate: {
    fontSize: scaleFontSize(14),
    color: "#B45309",
    fontWeight: "700",
  },
  daysRemaining: {
    fontSize: scaleFontSize(12),
    color: "#92400E",
    marginTop: scaleSize(4),
  },
  expiredText: {
    fontSize: scaleFontSize(16),
    color: "#991B1B",
    fontWeight: "700",
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: scaleSize(20),
    marginBottom: scaleSize(16),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: "600",
    color: "#111827",
    marginBottom: scaleSize(12),
  },
  infoText: {
    fontSize: scaleFontSize(14),
    color: "#6B7280",
    lineHeight: scaleFontSize(22),
  },
});
