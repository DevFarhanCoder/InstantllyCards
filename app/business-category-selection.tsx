import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Categories with their subcategories
const SERVICE_CATEGORIES: Record<string, string[]> = {
  'Travel': [
    'Hotels', 'Resorts', 'Hostels', 'PG Accommodations', 'Travel Agents',
    'Domestic Tours', 'International Tours', 'Visa Assistance',
    'International Air Ticketing', 'Train Ticketing',
  ],
  'Technology': [
    'CCTV Systems', 'Security Systems', 'Computer Repairs', 'Laptop Repairs',
    'Mobile & Internet Services', 'Refrigerator Repairs', 'Appliance Repairs',
    'Computer Training Institutes', 'Website & App Development',
  ],
  'Shopping': [
    'Cake Shops & Bakeries', 'Daily Needs Stores', 'Groceries', 'Florists',
    'Restaurants', 'Food Delivery Services', 'Online Food Ordering',
    'Foreign Exchange Services', 'Furniture Stores', 'Wallpapers & Home Decor',
    'Water Suppliers', 'Medical Stores & Pharmacies', 'Optical Stores',
    'Pet Shops', 'Pet Care Services', 'Online Shopping', 'T-Shirt Printing',
  ],
  'Rentals': [
    'Bus on Hire', 'Car & Cab Rentals', 'Generators on Hire',
    'Equipment Rentals', 'Tempos on Hire',
  ],
  'Lifestyle': [
    'Astrologers', 'Beauty Salons', 'Bridal Makeup Artists', 'Makeup Artists',
    'Dance Classes', 'Music Classes', 'Fitness Centres', 'Gyms',
    'Photographers & Videographers', 'Tattoo Artists', 'Weight Loss Centres',
    'Movies', 'Online Movie Platforms', 'Parties & Nightlife',
  ],
  'Health': [
    'General Physicians', 'General Surgeons', 'Cardiologists',
    'Child Specialists', 'Paediatricians', 'Dentists', 'Dermatologists',
    'Skin & Hair Specialists', 'ENT Doctors', 'Eye Specialists',
    'Ophthalmologists', 'Gastroenterologists', 'Gynaecologists & Obstetricians',
    'Neurologists', 'Orthopaedic Doctors', 'Ayurvedic Doctors',
    'Homeopathic Doctors', 'Pathology Labs', 'Physiotherapists',
    'Vaccination Centres', 'Hearing Aids & Solutions',
  ],
  'Education': [
    'Schools', 'Colleges & Universities', 'Coaching Centres',
    'Skill Development Centres', 'Playschools',
  ],
  'Construction': [
    'Architects', 'Interior Designers', 'Civil Contractors',
    'Construction Material Dealers', 'Plumbers', 'Electricians',
    'Carpenters', 'Painters', 'Pest Control Services',
  ],
  'Automotive': [
    'Car Repair & Services', 'Bike Repair & Services', 'Car Dealers',
    'Bike Dealers', 'Spare Parts Dealers', 'Tyre Dealers',
  ],
  'Business': [
    'CA & Chartered Accountants', 'Lawyers', 'Printing Services',
    'Courier Services', 'Packing & Moving Services', 'Event Organisers',
    'Advertising Agencies', 'Marriage Bureau', 'Security Services',
    'Website Designers & Developers',
  ],
};

export default function BusinessCategorySelection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState('');

  const handleSelectCategory = (category: string) => {
    setSelectedValue(category);
    setModalVisible(false);
    setSelectedCategory(null);
    setSearchQuery('');
    // Navigate back with selected category
    setTimeout(() => {
      router.back();
    }, 100);
  };

  const filteredSubcategories = selectedCategory
    ? SERVICE_CATEGORIES[selectedCategory as keyof typeof SERVICE_CATEGORIES].filter(sub =>
        sub.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Business Category</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '33%' }]} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Add Business Category</Text>
        <Text style={styles.subtitle}>Choose the right business categories so your customer can easily find you</Text>

        {/* Text Field that opens modal */}
        <TouchableOpacity
          style={styles.categoryTextField}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <Text style={[styles.categoryTextInput, !selectedValue && styles.placeholderText]}>
            {selectedValue || 'Type Business Category'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal for category selection */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedCategory(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => {
                  if (selectedCategory) {
                    setSelectedCategory(null);
                  } else {
                    setModalVisible(false);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedCategory ? selectedCategory : 'Select Category'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedCategory(null);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={selectedCategory ? 'Search subcategories...' : 'Search categories...'}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Categories or Subcategories List */}
            <FlatList
              data={selectedCategory ? filteredSubcategories : Object.keys(SERVICE_CATEGORIES).filter(cat =>
                cat.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => {
                    if (selectedCategory) {
                      handleSelectCategory(`${selectedCategory} - ${item}`);
                    } else {
                      setSelectedCategory(item);
                      setSearchQuery('');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryItemText}>{item}</Text>
                  {!selectedCategory && (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  categoryTextField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  categoryTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryItemText: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
});
