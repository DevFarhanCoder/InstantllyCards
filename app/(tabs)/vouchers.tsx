import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VouchersScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vouchers</Text>
          <Text style={styles.headerSubtitle}>Your rewards and offers</Text>
        </View>

        {/* Coming Soon Content */}
        <View style={styles.comingSoonContainer}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1376/1376388.png' }}
            style={styles.voucherImage}
            resizeMode="contain"
          />
          <Text style={styles.comingSoonTitle}>Vouchers Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            Get ready to unlock exclusive rewards, discounts, and special offers.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  voucherImage: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },
});
