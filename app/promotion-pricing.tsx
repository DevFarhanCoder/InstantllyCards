import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

const { width: screenWidth } = Dimensions.get('window');

const pricingData = [
  { rank: '1', pincode: '1100', tehsil: '6600', district: '39600' },
  { rank: '2', pincode: '1000', tehsil: '6000', district: '36000' },
  { rank: '3', pincode: '900', tehsil: '5400', district: '32400' },
  { rank: '4', pincode: '800', tehsil: '4800', district: '28800' },
  { rank: '5', pincode: '700', tehsil: '4200', district: '25200' },
  { rank: '6', pincode: '600', tehsil: '3600', district: '21600' },
  { rank: '7', pincode: '500', tehsil: '3000', district: '18000' },
  { rank: '8', pincode: '400', tehsil: '2400', district: '14400' },
  { rank: '9', pincode: '300', tehsil: '1800', district: '10800' },
  { rank: '10', pincode: '200', tehsil: '1200', district: '7200' },
  { rank: '11', pincode: '100', tehsil: '600', district: '3600' },
];

export default function PromotionPricing() {
  const [advertisementType, setAdvertisementType] = useState('');
  const [ranking, setRanking] = useState('');
  const [showError, setShowError] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handlePayNow = () => {
    if (!advertisementType || !ranking) {
      setShowError(true);
      // Scroll to the selection section
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return;
    }
    console.log('Payment initiated:', { advertisementType, ranking });
    // Navigate to payment screen or process payment
  };

  const handleAdvertisementTypeChange = (value: string) => {
    setAdvertisementType(value);
    setShowError(false);
  };

  const handleRankingChange = (value: string) => {
    setRanking(value);
    setShowError(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotion Pricing</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pricing Table */}
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Pricing Chart</Text>
          
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.rankColumn]}>Rank/Area</Text>
            <Text style={[styles.tableHeaderCell, styles.priceColumn]}>Pincode</Text>
            <Text style={[styles.tableHeaderCell, styles.priceColumn]}>Tehsil</Text>
            <Text style={[styles.tableHeaderCell, styles.priceColumn]}>District</Text>
          </View>

          {/* Table Rows */}
          {pricingData.map((row, index) => (
            <View 
              key={index} 
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
              ]}
            >
              <Text style={[styles.tableCell, styles.rankColumn, styles.rankText]}>{row.rank}</Text>
              <Text style={[styles.tableCell, styles.priceColumn]}>₹{row.pincode}</Text>
              <Text style={[styles.tableCell, styles.priceColumn]}>₹{row.tehsil}</Text>
              <Text style={[styles.tableCell, styles.priceColumn]}>₹{row.district}</Text>
            </View>
          ))}
        </View>

        {/* Advertisement Selection */}
        <View style={styles.selectionContainer}>
          <Text style={styles.sectionTitle}>Where to make advertisement</Text>

          {/* Advertisement Type Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Advertisement Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={advertisementType}
                onValueChange={handleAdvertisementTypeChange}
                style={[styles.picker, { fontSize: 18 }]}
                dropdownIconColor="#000000"
                mode="dropdown"
              >
                <Picker.Item label="-- Select Type --" value="" style={{ fontSize: 18 }} />
                <Picker.Item label="Pincode" value="pincode" style={{ fontSize: 18 }} />
                <Picker.Item label="Tehsil" value="tehsil" style={{ fontSize: 18 }} />
                <Picker.Item label="District" value="district" style={{ fontSize: 18 }} />
              </Picker>
            </View>
            {showError && !advertisementType && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>

          {/* Ranking Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Ranking *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={ranking}
                onValueChange={handleRankingChange}
                style={[styles.picker, { fontSize: 18 }]}
                dropdownIconColor="#000000"
                mode="dropdown"
              >
                <Picker.Item label="-- Select Rank --" value="" style={{ fontSize: 18 }} />
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => (
                  <Picker.Item 
                    key={num} 
                    label={`Rank ${num}`} 
                    value={num.toString()} 
                    style={{ fontSize: 18 }}
                  />
                ))}
              </Picker>
            </View>
            {showError && !ranking && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>

          {/* Selected Price Display */}
          <View style={styles.priceDisplay}>
            <Text style={styles.priceLabel}>Selected Price:</Text>
            <Text style={styles.priceValue}>
              {ranking && advertisementType 
                ? `₹${pricingData[parseInt(ranking) - 1]?.[advertisementType as 'pincode' | 'tehsil' | 'district'] || '0'}`
                : '₹0'
              }
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Pay Now Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayNow}
          activeOpacity={0.8}
        >
          <Ionicons name="card" size={24} color="#FFFFFF" style={styles.payIcon} />
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tableTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRowEven: {
    backgroundColor: '#F9FAFB',
  },
  tableRowOdd: {
    backgroundColor: '#FFFFFF',
  },
  tableCell: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  rankColumn: {
    flex: 1,
  },
  priceColumn: {
    flex: 1.5,
  },
  rankText: {
    fontWeight: '700',
    color: '#2563EB',
    fontSize: 16,
  },
  selectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 8,
    minHeight: 60,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  picker: {
    height: 60,
    width: '100%',
    color: '#000000',
    backgroundColor: 'transparent',
  },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
  },
  payButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#22C55E',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  payIcon: {
    marginRight: 8,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
});
