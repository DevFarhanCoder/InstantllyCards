import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/theme';

// Comprehensive list of all countries with their dial codes
const countries = [
  { code: '+93', name: 'Afghanistan', flag: '🇦🇫' },
  { code: '+355', name: 'Albania', flag: '🇦🇱' },
  { code: '+213', name: 'Algeria', flag: '🇩🇿' },
  { code: '+1684', name: 'American Samoa', flag: '🇦🇸' },
  { code: '+376', name: 'Andorra', flag: '🇦🇩' },
  { code: '+244', name: 'Angola', flag: '🇦🇴' },
  { code: '+1264', name: 'Anguilla', flag: '🇦🇮' },
  { code: '+1268', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+374', name: 'Armenia', flag: '🇦🇲' },
  { code: '+297', name: 'Aruba', flag: '🇦🇼' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: '+994', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+1242', name: 'Bahamas', flag: '🇧🇸' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+1246', name: 'Barbados', flag: '🇧🇧' },
  { code: '+375', name: 'Belarus', flag: '🇧🇾' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: '+501', name: 'Belize', flag: '🇧🇿' },
  { code: '+229', name: 'Benin', flag: '🇧🇯' },
  { code: '+1441', name: 'Bermuda', flag: '🇧🇲' },
  { code: '+975', name: 'Bhutan', flag: '🇧🇹' },
  { code: '+591', name: 'Bolivia', flag: '🇧🇴' },
  { code: '+387', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: '+267', name: 'Botswana', flag: '🇧🇼' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+673', name: 'Brunei', flag: '🇧🇳' },
  { code: '+359', name: 'Bulgaria', flag: '🇧🇬' },
  { code: '+226', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+257', name: 'Burundi', flag: '🇧🇮' },
  { code: '+855', name: 'Cambodia', flag: '🇰🇭' },
  { code: '+237', name: 'Cameroon', flag: '🇨🇲' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+238', name: 'Cape Verde', flag: '🇨🇻' },
  { code: '+1345', name: 'Cayman Islands', flag: '🇰🇾' },
  { code: '+236', name: 'Central African Republic', flag: '🇨🇫' },
  { code: '+235', name: 'Chad', flag: '🇹🇩' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+269', name: 'Comoros', flag: '🇰🇲' },
  { code: '+242', name: 'Congo', flag: '🇨🇬' },
  { code: '+243', name: 'Congo (DRC)', flag: '🇨🇩' },
  { code: '+682', name: 'Cook Islands', flag: '🇨🇰' },
  { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: '+225', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: '+385', name: 'Croatia', flag: '🇭🇷' },
  { code: '+53', name: 'Cuba', flag: '🇨🇺' },
  { code: '+357', name: 'Cyprus', flag: '🇨🇾' },
  { code: '+420', name: 'Czech Republic', flag: '🇨🇿' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: '+253', name: 'Djibouti', flag: '🇩🇯' },
  { code: '+1767', name: 'Dominica', flag: '🇩🇲' },
  { code: '+1809', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+503', name: 'El Salvador', flag: '🇸🇻' },
  { code: '+240', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: '+291', name: 'Eritrea', flag: '🇪🇷' },
  { code: '+372', name: 'Estonia', flag: '🇪🇪' },
  { code: '+251', name: 'Ethiopia', flag: '🇪🇹' },
  { code: '+500', name: 'Falkland Islands', flag: '🇫🇰' },
  { code: '+298', name: 'Faroe Islands', flag: '🇫🇴' },
  { code: '+679', name: 'Fiji', flag: '🇫🇯' },
  { code: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+594', name: 'French Guiana', flag: '🇬🇫' },
  { code: '+689', name: 'French Polynesia', flag: '🇵🇫' },
  { code: '+241', name: 'Gabon', flag: '🇬🇦' },
  { code: '+220', name: 'Gambia', flag: '🇬🇲' },
  { code: '+995', name: 'Georgia', flag: '🇬🇪' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: '+350', name: 'Gibraltar', flag: '🇬🇮' },
  { code: '+30', name: 'Greece', flag: '🇬🇷' },
  { code: '+299', name: 'Greenland', flag: '🇬🇱' },
  { code: '+1473', name: 'Grenada', flag: '🇬🇩' },
  { code: '+590', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: '+1671', name: 'Guam', flag: '🇬🇺' },
  { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: '+44', name: 'Guernsey', flag: '🇬🇬' },
  { code: '+224', name: 'Guinea', flag: '🇬🇳' },
  { code: '+245', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: '+592', name: 'Guyana', flag: '🇬🇾' },
  { code: '+509', name: 'Haiti', flag: '🇭🇹' },
  { code: '+504', name: 'Honduras', flag: '🇭🇳' },
  { code: '+852', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '+36', name: 'Hungary', flag: '🇭🇺' },
  { code: '+354', name: 'Iceland', flag: '🇮🇸' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+98', name: 'Iran', flag: '🇮🇷' },
  { code: '+964', name: 'Iraq', flag: '🇮🇶' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: '+44', name: 'Isle of Man', flag: '🇮🇲' },
  { code: '+972', name: 'Israel', flag: '🇮🇱' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+1876', name: 'Jamaica', flag: '🇯🇲' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+44', name: 'Jersey', flag: '🇯🇪' },
  { code: '+962', name: 'Jordan', flag: '🇯🇴' },
  { code: '+7', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: '+686', name: 'Kiribati', flag: '🇰🇮' },
  { code: '+850', name: 'North Korea', flag: '🇰🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+996', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: '+856', name: 'Laos', flag: '🇱🇦' },
  { code: '+371', name: 'Latvia', flag: '🇱🇻' },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+266', name: 'Lesotho', flag: '🇱🇸' },
  { code: '+231', name: 'Liberia', flag: '🇱🇷' },
  { code: '+218', name: 'Libya', flag: '🇱🇾' },
  { code: '+423', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: '+370', name: 'Lithuania', flag: '🇱🇹' },
  { code: '+352', name: 'Luxembourg', flag: '🇱🇺' },
  { code: '+853', name: 'Macao', flag: '🇲🇴' },
  { code: '+389', name: 'Macedonia', flag: '🇲🇰' },
  { code: '+261', name: 'Madagascar', flag: '🇲🇬' },
  { code: '+265', name: 'Malawi', flag: '🇲🇼' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+960', name: 'Maldives', flag: '🇲🇻' },
  { code: '+223', name: 'Mali', flag: '🇲🇱' },
  { code: '+356', name: 'Malta', flag: '🇲🇹' },
  { code: '+692', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: '+596', name: 'Martinique', flag: '🇲🇶' },
  { code: '+222', name: 'Mauritania', flag: '🇲🇷' },
  { code: '+230', name: 'Mauritius', flag: '🇲🇺' },
  { code: '+262', name: 'Mayotte', flag: '🇾🇹' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+691', name: 'Micronesia', flag: '🇫🇲' },
  { code: '+373', name: 'Moldova', flag: '🇲🇩' },
  { code: '+377', name: 'Monaco', flag: '🇲🇨' },
  { code: '+976', name: 'Mongolia', flag: '🇲🇳' },
  { code: '+382', name: 'Montenegro', flag: '🇲🇪' },
  { code: '+1664', name: 'Montserrat', flag: '🇲🇸' },
  { code: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: '+258', name: 'Mozambique', flag: '🇲🇿' },
  { code: '+95', name: 'Myanmar', flag: '🇲🇲' },
  { code: '+264', name: 'Namibia', flag: '🇳🇦' },
  { code: '+674', name: 'Nauru', flag: '🇳🇷' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+599', name: 'Netherlands Antilles', flag: '🇦🇳' },
  { code: '+687', name: 'New Caledonia', flag: '🇳🇨' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+505', name: 'Nicaragua', flag: '🇳🇮' },
  { code: '+227', name: 'Niger', flag: '🇳🇪' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+683', name: 'Niue', flag: '🇳🇺' },
  { code: '+672', name: 'Norfolk Island', flag: '🇳🇫' },
  { code: '+1670', name: 'Northern Mariana Islands', flag: '🇲🇵' },
  { code: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+680', name: 'Palau', flag: '🇵🇼' },
  { code: '+970', name: 'Palestine', flag: '🇵🇸' },
  { code: '+507', name: 'Panama', flag: '🇵🇦' },
  { code: '+675', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: '+51', name: 'Peru', flag: '🇵🇪' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+1787', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+262', name: 'Reunion', flag: '🇷🇪' },
  { code: '+40', name: 'Romania', flag: '🇷🇴' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+250', name: 'Rwanda', flag: '🇷🇼' },
  { code: '+290', name: 'Saint Helena', flag: '🇸🇭' },
  { code: '+1869', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: '+1758', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: '+508', name: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
  { code: '+1784', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: '+685', name: 'Samoa', flag: '🇼🇸' },
  { code: '+378', name: 'San Marino', flag: '🇸🇲' },
  { code: '+239', name: 'Sao Tome and Principe', flag: '🇸🇹' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+221', name: 'Senegal', flag: '🇸🇳' },
  { code: '+381', name: 'Serbia', flag: '🇷🇸' },
  { code: '+248', name: 'Seychelles', flag: '🇸🇨' },
  { code: '+232', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+421', name: 'Slovakia', flag: '🇸🇰' },
  { code: '+386', name: 'Slovenia', flag: '🇸🇮' },
  { code: '+677', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: '+252', name: 'Somalia', flag: '🇸🇴' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+249', name: 'Sudan', flag: '🇸🇩' },
  { code: '+597', name: 'Suriname', flag: '🇸🇷' },
  { code: '+268', name: 'Swaziland', flag: '🇸🇿' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+963', name: 'Syria', flag: '🇸🇾' },
  { code: '+886', name: 'Taiwan', flag: '🇹🇼' },
  { code: '+992', name: 'Tajikistan', flag: '🇹🇯' },
  { code: '+255', name: 'Tanzania', flag: '🇹🇿' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+670', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: '+228', name: 'Togo', flag: '🇹🇬' },
  { code: '+690', name: 'Tokelau', flag: '🇹🇰' },
  { code: '+676', name: 'Tonga', flag: '🇹🇴' },
  { code: '+1868', name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: '+216', name: 'Tunisia', flag: '🇹🇳' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+993', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: '+1649', name: 'Turks and Caicos Islands', flag: '🇹🇨' },
  { code: '+688', name: 'Tuvalu', flag: '🇹🇻' },
  { code: '+256', name: 'Uganda', flag: '🇺🇬' },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: '+998', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: '+678', name: 'Vanuatu', flag: '🇻🇺' },
  { code: '+39', name: 'Vatican City', flag: '🇻🇦' },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+1284', name: 'British Virgin Islands', flag: '🇻🇬' },
  { code: '+1340', name: 'U.S. Virgin Islands', flag: '🇻🇮' },
  { code: '+681', name: 'Wallis and Futuna', flag: '🇼🇫' },
  { code: '+212', name: 'Western Sahara', flag: '🇪🇭' },
  { code: '+967', name: 'Yemen', flag: '🇾🇪' },
  { code: '+260', name: 'Zambia', flag: '🇿🇲' },
  { code: '+263', name: 'Zimbabwe', flag: '🇿🇼' },
];

interface CountryCodePickerProps {
  selectedCode: string;
  onSelect: (code: string) => void;
}

export default function CountryCodePicker({ selectedCode, onSelect }: CountryCodePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCountry = countries.find(c => c.code === selectedCode) || countries.find(c => c.name === 'India') || countries[0];

  // Filter countries based on search query
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.includes(searchQuery)
  );

  const renderCountryItem = ({ item }: { item: typeof countries[0] }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        onSelect(item.code);
        setModalVisible(false);
        setSearchQuery(''); // Clear search when selecting
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
        onRequestClose={() => {
          setModalVisible(false);
          setSearchQuery('');
        }}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSearchQuery('');
              }}
            >
              <Ionicons name="close" size={20} color={COLORS.text || '#FFF'} />
            </TouchableOpacity>
          </View>
          
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.muted || '#888'} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search countries..."
              placeholderTextColor={COLORS.muted || '#888'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={(item, index) => `${item.code}-${item.name}-${index}`}
            style={styles.list}
            showsVerticalScrollIndicator={false}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.muted,
    backgroundColor: COLORS.inputBg || '#2A2A2A',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text || '#FFF',
    paddingVertical: 8,
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