import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable } from 'react-native';
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

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  placeholder?: string;
}

export default function PhoneInput({
  label,
  value,
  onChangeText,
  countryCode,
  onCountryCodeChange,
  placeholder = "Enter your phone number"
}: PhoneInputProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedCountry = countries.find(c => c.code === countryCode) || countries[3]; // Default to India

  const handleClear = () => {
    onChangeText('');
  };

  const renderCountryItem = ({ item }: { item: typeof countries[0] }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        onCountryCodeChange(item.code);
        setModalVisible(false);
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCodeText}>{item.code}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View style={styles.inputContainer}>
        {/* Country Code Picker Button */}
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.code}>{selectedCountry.code}</Text>
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>

        {/* Phone Number Input */}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />

        {/* Clear Button */}
        {value.length > 0 && (
          <Pressable style={styles.clearButton} onPress={handleClear}>
            <View style={styles.clearCircle}>
              <Text style={styles.clearText}>✕</Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Country Selection Modal */}
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
  container: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E6E9EE',
    paddingLeft: 4,
    paddingRight: 12,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  flag: {
    fontSize: 18,
  },
  code: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  arrow: {
    fontSize: 9,
    color: '#6B7280',
    marginLeft: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingHorizontal: 12,
    height: '100%',
  },
  clearButton: {
    padding: 8,
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal styles
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
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
    borderBottomColor: '#F3F4F6',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
});
