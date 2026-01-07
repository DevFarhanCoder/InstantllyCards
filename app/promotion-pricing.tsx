import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

const { width: screenWidth } = Dimensions.get('window');

const pricingData = [
  { rank: 'No Rank', pincode: '100', tehsil: '600', district: '3600' },
  { rank: '20', pincode: '200', tehsil: '1200', district: '70200' },
  { rank: '19', pincode: '300', tehsil: '1800', district: '10800' },
  { rank: '18', pincode: '400', tehsil: '2400', district: '14400' },
  { rank: '17', pincode: '500', tehsil: '3000', district: '18000' },
  { rank: '16', pincode: '600', tehsil: '3600', district: '21600' },
  { rank: '15', pincode: '700', tehsil: '4200', district: '25200' },
  { rank: '14', pincode: '800', tehsil: '4800', district: '28800' },
  { rank: '13', pincode: '900', tehsil: '500', district: '32400' },
  { rank: '12', pincode: '1000', tehsil: '6000', district: '36000' },
  { rank: '11', pincode: '1100', tehsil: '6600', district: '39600' },
  { rank: '10', pincode: '1200', tehsil: '7200', district: '43200' },
  { rank: '9', pincode: '1300', tehsil: '7800', district: '46800' },
  { rank: '8', pincode: '1400', tehsil: '8400', district: '50400' },
  { rank: '7', pincode: '1500', tehsil: '9000', district: '54000' },
  { rank: '6', pincode: '1600', tehsil: '9600', district: '57600' },
  { rank: '5', pincode: '1700', tehsil: '10200', district: '61200' },
  { rank: '4', pincode: '1800', tehsil: '10800', district: '64800' },
  { rank: '3', pincode: '1900', tehsil: '11400', district: '68400' },
  { rank: '2', pincode: '2000', tehsil: '12000', district: '72000' },
  { rank: '1', pincode: '2100', tehsil: '12600', district: '75600' },
];

export default function PromotionPricing() {
  const [advertisementType, setAdvertisementType] = useState('');
  const [ranking, setRanking] = useState('');
  const [showError, setShowError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rankingModalVisible, setRankingModalVisible] = useState(false);
  const [advertisementModalVisible, setAdvertisementModalVisible] = useState(false);
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
          
          {/* Pagination Tabs */}
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.pageTab, currentPage === 1 && styles.pageTabActive]}
              onPress={() => setCurrentPage(1)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pageTabText, currentPage === 1 && styles.pageTabTextActive]}>
                Rank 11-20
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pageTab, currentPage === 2 && styles.pageTabActive]}
              onPress={() => setCurrentPage(2)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pageTabText, currentPage === 2 && styles.pageTabTextActive]}>
                Rank 1-10
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.rankColumn]}>Rank/Area</Text>
            <Text style={[styles.tableHeaderCell, styles.priceColumn]}>Pincode</Text>
            <Text style={[styles.tableHeaderCell, styles.priceColumn]}>Tehsil</Text>
            <Text style={[styles.tableHeaderCell, styles.priceColumn]}>District</Text>
          </View>

          {/* Scrollable Table Content */}
          <ScrollView 
            style={styles.tableScrollView}
            showsVerticalScrollIndicator={true}
          >
            {/* Table Rows */}
            {pricingData
              .slice(currentPage === 1 ? 0 : 11, currentPage === 1 ? 11 : 21)
              .map((row, index) => (
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
          </ScrollView>
        </View>

        {/* Advertisement Selection */}
        <View style={styles.selectionContainer}>
          <Text style={styles.sectionTitle}>Where to make advertisement</Text>

          {/* Advertisement Type Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Advertisement Type *</Text>
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => setAdvertisementModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerText, !advertisementType && styles.pickerPlaceholder]}>
                {advertisementType ? advertisementType.charAt(0).toUpperCase() + advertisementType.slice(1) : '-- Select Type --'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#000000" />
            </TouchableOpacity>
            {showError && !advertisementType && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>

          {/* Ranking Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Ranking *</Text>
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => setRankingModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerText, !ranking && styles.pickerPlaceholder]}>
                {ranking ? (ranking === '21' ? 'No Rank' : `Rank ${ranking}`) : '-- Select Rank --'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#000000" />
            </TouchableOpacity>
            {showError && !ranking && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>

          {/* Selected Price Display */}
          <View style={styles.priceDisplay}>
            <Text style={styles.priceLabel}>Selected Price:</Text>
            <Text style={styles.priceValue}>
              {ranking && advertisementType 
                ? `₹${ranking === '21' ? pricingData[0]?.[advertisementType as 'pincode' | 'tehsil' | 'district'] : pricingData[21 - parseInt(ranking)]?.[advertisementType as 'pincode' | 'tehsil' | 'district'] || '0'}`
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

      {/* Advertisement Type Selection Modal */}
      <Modal
        visible={advertisementModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAdvertisementModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Advertisement Type</Text>
              <TouchableOpacity
                onPress={() => setAdvertisementModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.rankingScrollView}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
            >
              {[
                { label: 'Pincode', value: 'pincode' },
                { label: 'Tehsil', value: 'tehsil' },
                { label: 'District', value: 'district' }
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.rankingOption,
                    advertisementType === type.value && styles.rankingOptionSelected
                  ]}
                  onPress={() => {
                    handleAdvertisementTypeChange(type.value);
                    setAdvertisementModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.rankingOptionText,
                    advertisementType === type.value && styles.rankingOptionTextSelected
                  ]}>
                    {type.label}
                  </Text>
                  {advertisementType === type.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ranking Selection Modal */}
      <Modal
        visible={rankingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRankingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Ranking</Text>
              <TouchableOpacity
                onPress={() => setRankingModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.rankingScrollView}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.rankingOption,
                    ranking === num.toString() && styles.rankingOptionSelected
                  ]}
                  onPress={() => {
                    handleRankingChange(num.toString());
                    setRankingModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.rankingOptionText,
                    ranking === num.toString() && styles.rankingOptionTextSelected
                  ]}>
                    Rank {num}
                  </Text>
                  {ranking === num.toString() && (
                    <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.rankingOption,
                  ranking === '21' && styles.rankingOptionSelected
                ]}
                onPress={() => {
                  handleRankingChange('21');
                  setRankingModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.rankingOptionText,
                  ranking === '21' && styles.rankingOptionTextSelected
                ]}>
                  No Rank
                </Text>
                {ranking === '21' && (
                  <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 12,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  pageTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  pageTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pageTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  pageTabTextActive: {
    color: '#FFFFFF',
  },
  tableScrollView: {
    maxHeight: 460,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
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
    fontSize: 13,
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
    fontSize: 14,
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
  nativePickerContainer: {
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
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 14,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  pickerPlaceholder: {
    color: '#999999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  rankingScrollView: {
    maxHeight: 400,
  },
  rankingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rankingOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  rankingOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  rankingOptionTextSelected: {
    fontWeight: '600',
    color: '#2563EB',
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
