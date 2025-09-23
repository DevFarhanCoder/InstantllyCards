import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/theme';

const countries = [
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
];

interface CountryCodePickerProps {
  selectedCode: string;
  onSelect: (code: string) => void;
}

export default function CountryCodePicker({ selectedCode, onSelect }: CountryCodePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedCountry = countries.find(c => c.code === selectedCode) || countries[0];

  const renderCountryItem = ({ item }: { item: typeof countries[0] }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        onSelect(item.code);
        setModalVisible(false);
      }}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCode}>{item.code}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.flag}>{selectedCountry.flag}</Text>
        <Text style={styles.code}>{selectedCountry.code}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={countries}
            renderItem={renderCountryItem}
            keyExtractor={(item, index) => `${item.code}-${index}`}
            style={styles.list}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg || '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.muted,
    minWidth: 80,
    maxWidth: 120,
    height: 56, // Match the input field height
  },
  flag: {
    fontSize: 18,
    marginRight: 8,
  },
  code: {
    color: COLORS.text || '#FFF',
    fontSize: 16,
    flex: 1,
  },
  arrow: {
    color: COLORS.muted || '#888',
    fontSize: 12,
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.bgDark || '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.muted,
    paddingTop: 50, // Account for status bar
  },
  modalTitle: {
    color: COLORS.text || '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: COLORS.text || '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.muted,
  },
  countryName: {
    color: COLORS.text || '#FFF',
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  countryCode: {
    color: COLORS.muted || '#888',
    fontSize: 14,
  },
});