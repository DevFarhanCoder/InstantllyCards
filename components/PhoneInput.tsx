import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable, Alert, Dimensions } from 'react-native';
import { COLORS } from '@/lib/theme';

const { width: screenWidth } = Dimensions.get('window');

const countries = [
  // Americas
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+51', name: 'Peru', flag: '🇵🇪' },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: '+591', name: 'Bolivia', flag: '🇧🇴' },
  { code: '+592', name: 'Guyana', flag: '🇬🇾' },
  { code: '+597', name: 'Suriname', flag: '🇸🇷' },
  { code: '+594', name: 'French Guiana', flag: '🇬🇫' },
  { code: '+1787', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: '+1809', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: '+1876', name: 'Jamaica', flag: '🇯🇲' },
  { code: '+1242', name: 'Bahamas', flag: '🇧🇸' },
  { code: '+1246', name: 'Barbados', flag: '�🇧' },
  { code: '+1284', name: 'British Virgin Islands', flag: '🇻🇬' },
  { code: '+1340', name: 'US Virgin Islands', flag: '🇻🇮' },
  { code: '+1649', name: 'Turks and Caicos', flag: '🇹�' },
  { code: '+1758', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: '+1767', name: 'Dominica', flag: '🇩🇲' },
  { code: '+1784', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: '+1473', name: 'Grenada', flag: '🇬🇩' },
  { code: '+1664', name: 'Montserrat', flag: '🇲�' },
  { code: '+1868', name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: '+1869', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: '+1721', name: 'Sint Maarten', flag: '🇸🇽' },
  { code: '+590', name: 'Saint Martin', flag: '🇲🇫' },
  { code: '+596', name: 'Martinique', flag: '🇲🇶' },
  { code: '+1268', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: '+501', name: 'Belize', flag: '🇧🇿' },
  { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: '+503', name: 'El Salvador', flag: '🇸🇻' },
  { code: '+504', name: 'Honduras', flag: '🇭🇳' },
  { code: '+505', name: 'Nicaragua', flag: '🇳🇮' },
  { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: '+507', name: 'Panama', flag: '🇵🇦' },
  { code: '+508', name: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
  { code: '+509', name: 'Haiti', flag: '🇭🇹' },

  // Europe
  { code: '+44', name: 'United Kingdom', flag: '��' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', name: 'Belgium', flag: '��🇪' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+30', name: 'Greece', flag: '🇬🇷' },
  { code: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: '+420', name: 'Czech Republic', flag: '🇨🇿' },
  { code: '+421', name: 'Slovakia', flag: '��' },
  { code: '+36', name: 'Hungary', flag: '🇭🇺' },
  { code: '+40', name: 'Romania', flag: '�🇷🇴' },
  { code: '+359', name: 'Bulgaria', flag: '🇧🇬' },
  { code: '+385', name: 'Croatia', flag: '🇭🇷' },
  { code: '+381', name: 'Serbia', flag: '�🇸' },
  { code: '+382', name: 'Montenegro', flag: '�🇲�' },
  { code: '+387', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: '+383', name: 'Kosovo', flag: '�🇽🇰' },
  { code: '+386', name: 'Slovenia', flag: '🇸🇮' },
  { code: '+389', name: 'North Macedonia', flag: '🇲🇰' },
  { code: '+355', name: 'Albania', flag: '🇦🇱' },
  { code: '+370', name: 'Lithuania', flag: '🇱🇹' },
  { code: '+371', name: 'Latvia', flag: '🇱🇻' },
  { code: '+372', name: 'Estonia', flag: '🇪🇪' },
  { code: '+375', name: 'Belarus', flag: '🇧🇾' },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: '+373', name: 'Moldova', flag: '🇲🇩' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+995', name: 'Georgia', flag: '🇬🇪' },
  { code: '+374', name: 'Armenia', flag: '🇦🇲' },
  { code: '+994', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+357', name: 'Cyprus', flag: '🇨🇾' },
  { code: '+354', name: 'Iceland', flag: '🇮🇸' },
  { code: '+298', name: 'Faroe Islands', flag: '🇫🇴' },
  { code: '+350', name: 'Gibraltar', flag: '🇬🇮' },
  { code: '+377', name: 'Monaco', flag: '🇲🇨' },
  { code: '+378', name: 'San Marino', flag: '🇸🇲' },
  { code: '+379', name: 'Vatican City', flag: '🇻🇦' },
  { code: '+376', name: 'Andorra', flag: '🇦🇩' },
  { code: '+423', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: '+352', name: 'Luxembourg', flag: '🇱🇺' },
  { code: '+356', name: 'Malta', flag: '🇲🇹' },

  // Asia
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+850', name: 'North Korea', flag: '🇰🇵' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+95', name: 'Myanmar', flag: '🇲🇲' },
  { code: '+855', name: 'Cambodia', flag: '🇰🇭' },
  { code: '+856', name: 'Laos', flag: '🇱🇦' },
  { code: '+673', name: 'Brunei', flag: '🇧🇳' },
  { code: '+670', name: 'East Timor', flag: '��' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+960', name: 'Maldives', flag: '🇲🇻' },
  { code: '+975', name: 'Bhutan', flag: '🇧🇹' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: '+93', name: 'Afghanistan', flag: '🇦🇫' },
  { code: '+98', name: 'Iran', flag: '🇮🇷' },
  { code: '+964', name: 'Iraq', flag: '🇮🇶' },
  { code: '+996', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: '+998', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: '+992', name: 'Tajikistan', flag: '🇹🇯' },
  { code: '+993', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: '+7', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: '+976', name: 'Mongolia', flag: '🇲🇳' },
  { code: '+852', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '+853', name: 'Macau', flag: '🇲🇴' },
  { code: '+886', name: 'Taiwan', flag: '🇹🇼' },

  // Middle East
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+973', name: 'Bahrain', flag: '�🇭' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+967', name: 'Yemen', flag: '🇾�🇪' },
  { code: '+972', name: 'Israel', flag: '🇮🇱' },
  { code: '+970', name: 'Palestine', flag: '🇵🇸' },
  { code: '+962', name: 'Jordan', flag: '🇯🇴' },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+963', name: 'Syria', flag: '🇸🇾' },

  // Africa
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: '+255', name: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', name: 'Uganda', flag: '🇺🇬' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: '+251', name: 'Ethiopia', flag: '🇪🇹' },
  { code: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: '+213', name: 'Algeria', flag: '🇩🇿' },
  { code: '+216', name: 'Tunisia', flag: '🇹🇳' },
  { code: '+218', name: 'Libya', flag: '🇱🇾' },
  { code: '+249', name: 'Sudan', flag: '🇸🇩' },
  { code: '+211', name: 'South Sudan', flag: '🇸🇸' },
  { code: '+221', name: 'Senegal', flag: '🇸🇳' },
  { code: '+220', name: 'Gambia', flag: '🇬🇲' },
  { code: '+224', name: 'Guinea', flag: '🇬🇳' },
  { code: '+225', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: '+226', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+227', name: 'Niger', flag: '🇳🇪' },
  { code: '+228', name: 'Togo', flag: '🇹🇬' },
  { code: '+229', name: 'Benin', flag: '🇧🇯' },
  { code: '+230', name: 'Mauritius', flag: '🇲🇺' },
  { code: '+231', name: 'Liberia', flag: '🇱🇷' },
  { code: '+232', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: '+235', name: 'Chad', flag: '🇹🇩' },
  { code: '+236', name: 'Central African Republic', flag: '🇨🇫' },
  { code: '+237', name: 'Cameroon', flag: '🇨🇲' },
  { code: '+238', name: 'Cape Verde', flag: '🇨🇻' },
  { code: '+239', name: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { code: '+240', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: '+241', name: 'Gabon', flag: '🇬🇦' },
  { code: '+242', name: 'Republic of the Congo', flag: '🇨🇬' },
  { code: '+243', name: 'Democratic Republic of the Congo', flag: '🇨🇩' },
  { code: '+244', name: 'Angola', flag: '🇦🇴' },
  { code: '+245', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: '+246', name: 'British Indian Ocean Territory', flag: '🇮🇴' },
  { code: '+248', name: 'Seychelles', flag: '🇸🇨' },
  { code: '+250', name: 'Rwanda', flag: '🇷🇼' },
  { code: '+252', name: 'Somalia', flag: '🇸🇴' },
  { code: '+253', name: 'Djibouti', flag: '🇩🇯' },
  { code: '+257', name: 'Burundi', flag: '🇧🇮' },
  { code: '+258', name: 'Mozambique', flag: '🇲🇿' },
  { code: '+260', name: 'Zambia', flag: '🇿🇲' },
  { code: '+261', name: 'Madagascar', flag: '🇲🇬' },
  { code: '+262', name: 'Mayotte', flag: '🇾🇹' },
  { code: '+263', name: 'Zimbabwe', flag: '🇿�' },
  { code: '+264', name: 'Namibia', flag: '🇳🇦' },
  { code: '+265', name: 'Malawi', flag: '🇲🇼' },
  { code: '+266', name: 'Lesotho', flag: '🇱🇸' },
  { code: '+267', name: 'Botswana', flag: '🇧🇼' },
  { code: '+268', name: 'Eswatini', flag: '🇸🇿' },
  { code: '+269', name: 'Comoros', flag: '🇰🇲' },
  { code: '+290', name: 'Saint Helena', flag: '🇸🇭' },
  { code: '+291', name: 'Eritrea', flag: '�🇪🇷' },

  // Oceania
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+64', name: 'New Zealand', flag: '🇳�' },
  { code: '+679', name: 'Fiji', flag: '🇫🇯' },
  { code: '+675', name: 'Papua New Guinea', flag: '🇵�🇬' },
  { code: '+678', name: 'Vanuatu', flag: '🇻🇺' },
  { code: '+676', name: 'Tonga', flag: '🇹🇴' },
  { code: '+685', name: 'Samoa', flag: '🇼🇸' },
  { code: '+684', name: 'American Samoa', flag: '🇦🇸' },
  { code: '+681', name: 'Wallis and Futuna', flag: '🇼🇫' },
  { code: '+687', name: 'New Caledonia', flag: '🇳🇨' },
  { code: '+689', name: 'French Polynesia', flag: '🇵🇫' },
  { code: '+682', name: 'Cook Islands', flag: '🇨🇰' },
  { code: '+683', name: 'Niue', flag: '🇳🇺' },
  { code: '+690', name: 'Tokelau', flag: '🇹🇰' },
  { code: '+691', name: 'Micronesia', flag: '🇫🇲' },
  { code: '+692', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: '+680', name: 'Palau', flag: '🇵🇼' },
  { code: '+686', name: 'Kiribati', flag: '🇰🇮' },
  { code: '+688', name: 'Tuvalu', flag: '🇹🇻' },
  { code: '+677', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: '+674', name: 'Nauru', flag: '🇳🇷' },

  // Other territories and special codes
  { code: '+599', name: 'Netherlands Antilles', flag: '🇧🇶' },
  { code: '+500', name: 'Falkland Islands', flag: '🇫🇰' },
  { code: '+290', name: 'Tristan da Cunha', flag: '🇹🇦' },
  { code: '+672', name: 'Norfolk Island', flag: '🇳🇫' },
].sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by country name

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
  placeholder = "80012 34567"
}: PhoneInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCountry = countries.find(c => c.code === countryCode) || countries.find(c => c.name === 'India') || countries[0];

  // Filter countries based on search query
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.includes(searchQuery)
  );

  const handleClear = () => {
    onChangeText('');
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSearchQuery(''); // Clear search when modal closes
  };

  const renderCountryItem = ({ item }: { item: typeof countries[0] }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        onCountryCodeChange(item.code);
        setModalVisible(false);
        setSearchQuery(''); // Clear search when selecting
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
onChangeText={(text) => {
            // Only allow digits and limit to 10 characters
            const cleaned = text.replace(/\D/g, '');
            const limited = cleaned.slice(0, 10);
            onChangeText(limited);
          }}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      {/* Country Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country ({filteredCountries.length})</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleModalClose}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search countries or codes..."
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.searchClearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.searchClearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={(item, index) => `${item.code}-${item.name}-${index}`}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
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
    height: screenWidth < 360 ? 52 : 56, // Slightly smaller on very small screens
    borderWidth: 1.5,
    borderColor: '#E6E9EE',
    paddingLeft: 4,
    paddingRight: 8, // Reduced padding to give more space for input
    minWidth: 0, // Ensure proper flex behavior
    width: '100%', // Ensure full width usage
    maxWidth: screenWidth - 40, // Account for parent padding
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenWidth < 360 ? 4 : 6, // Less padding on small screens
    paddingVertical: 8,
    gap: screenWidth < 360 ? 2 : 3, // Smaller gap on small screens
    minWidth: screenWidth < 360 ? 70 : 80, // Responsive minimum width
    maxWidth: screenWidth < 360 ? 90 : 100, // Responsive maximum width
  },
  flag: {
    fontSize: 16, // Slightly smaller flag
  },
  code: {
    fontSize: 14, // Smaller font for country code
    fontWeight: '600',
    color: '#111827',
    minWidth: 30, // Ensure minimum width for codes
  },
  arrow: {
    fontSize: 9,
    color: '#6B7280',
    marginLeft: 0,
  },
  input: {
    flex: 1,
    fontSize: screenWidth < 360 ? 14 : 16, // Smaller font on very small screens
    color: '#111827',
    paddingHorizontal: screenWidth < 360 ? 6 : 8, // Less padding on small screens
    height: '100%',
    minWidth: 0, // Ensure proper text truncation if needed
    textAlign: 'left',
  },
  clearButton: {
    padding: 4, // Reduced padding
    marginLeft: 4,
  },
  clearCircle: {
    width: 18, // Slightly smaller
    height: 18,
    borderRadius: 9,
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
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E9EE',
  },
  searchClearButton: {
    marginLeft: 8,
    padding: 8,
  },
  searchClearText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
});
