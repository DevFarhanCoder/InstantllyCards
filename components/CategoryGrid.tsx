const travelSubcategories = [
  'Hotels',
  'Resorts',
  'Hostels',
  'PG Accommodations',
  'Travel Agents',
  'Domestic Tours',
  'International Tours',
  'Visa Assistance',
  'International Air Ticketing',
  'Train Ticketing',
];
const technologySubcategories = [
  'CCTV Systems',
  'Security Systems',
  'Computer Repairs',
  'Laptop Repairs',
  'Mobile & Internet Services',
  'Refrigerator Repairs',
  'Appliance Repairs',
  'Computer Training Institutes',
  'Website & App Development',
];
const shoppingSubcategories = [
  'Cake Shops & Bakeries',
  'Daily Needs Stores',
  'Groceries',
  'Florists',
  'Restaurants',
  'Food Delivery Services',
  'Online Food Ordering',
  'Foreign Exchange Services',
  'Furniture Stores',
  'Wallpapers & Home Decor',
  'Water Suppliers',
  'Medical Stores & Pharmacies',
  'Optical Stores',
  'Pet Shops',
  'Pet Care Services',
  'Online Shopping',
  'T-Shirt Printing',
];
const rentalsSubcategories = [
  'Bus on Hire',
  'Car & Cab Rentals',
  'Generators on Hire',
  'Equipment Rentals',
  'Tempos on Hire',
];
const lifestyleSubcategories = [
  'Astrologers',
  'Beauty Salons',
  'Bridal Makeup Artists',
  'Makeup Artists',
  'Dance Classes',
  'Music Classes',
  'Fitness Centres',
  'Gyms',
  'Photographers & Videographers',
  'Tattoo Artists',
  'Weight Loss Centres',
  'Movies',
  'Online Movie Platforms',
  'Parties & Nightlife',
];
const healthSubcategories = [
  'General Physicians',
  'General Surgeons',
  'Cardiologists',
  'Child Specialists',
  'Paediatricians',
  'Dentists',
  'Dermatologists',
  'Skin & Hair Specialists',
  'ENT Doctors',
  'Eye Specialists',
  'Ophthalmologists',
  'Gastroenterologists',
  'Gynaecologists & Obstetricians',
  'Neurologists',
  'Orthopaedic Doctors',
  'Ayurvedic Doctors',
  'Homeopathic Doctors',
  'Pathology Labs',
  'Physiotherapists',
  'Vaccination Centres',
  'Hearing Aids & Solutions',
];
const educationSubcategories = [
  'Schools & Educational Institutions',
  'Playgroups',
  'Kindergartens',
  'Home Tutors',
  'Tutorials & Coaching Classes',
  'Training Institutes',
  'Language Classes',
  'Motor Training Schools',
  'Overseas Education Consultants',
  'Yoga & Wellness Classes',
];
const constructionSubcategories = [
  'Borewell Contractors',
  'Builders & Contractors',
  'Carpentry Contractors',
  'Civil Contractors',
  'Electrical Contractors',
  'Electricians',
  'False Ceiling Contractors',
  'Home Services',
  'Housekeeping Services',
  'Modular Kitchen Designers',
  'Painting Contractors',
  'Plumbers',
  'Ready Mix Concrete Suppliers',
  'Waterproofing Contractors',
];
import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import SubCategoryModal from './SubCategoryModal';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const automotiveSubcategories = [
  'Automobile Dealers',
  'Car Insurance Agents',
  'Car Loans & Finance',
  'Car Repairs & Services',
  'Taxi & Cab Services',
  'Tempos on Hire',
  'Towing Services',
  'Transporters & Logistics',
];

const businessSubcategories = [
  'Bulk SMS & Digital Marketing',
  'Chartered Accountants',
  'Business Consultants',
  'GST Registration Consultants',
  'Income Tax Consultants',
  'Registration Consultants',
  'Event Organizers',
  'Party Organisers',
  'Wedding Planners & Requisites',
  'Interior Designers',
  'Lawyers & Legal Services',
  'Logistics & Supply Chain',
  'Online Passport Agents',
  'Packers & Movers',
  'Repairs & Maintenance Services',
  'Website Designers & Developers',
];

const categories = [
  { name: 'Automotive', icon: <FontAwesome5 name="car" size={28} color="#6B7280" />, hasSubcategories: true },
  { name: 'Business', icon: <MaterialIcons name="business-center" size={28} color="#6B7280" />, hasSubcategories: true },
  { name: 'Construction', icon: <FontAwesome5 name="tools" size={28} color="#6B7280" />, hasSubcategories: true },
  { name: 'Education', icon: <Ionicons name="school" size={28} color="#6B7280" />, hasSubcategories: true },
  { name: 'Health', icon: <Ionicons name="medkit" size={28} color="#6B7280" />, hasSubcategories: true },
  { name: 'Lifestyle', icon: <MaterialIcons name="style" size={28} color="#6B7280" />, hasSubcategories: true },
  { name: 'Rentals', icon: <FontAwesome5 name="key" size={28} color="#6B7280" />, hasSubcategories: true },
  { name: 'Shopping', icon: <MaterialIcons name="shopping-cart" size={28} color="#6B7280" />, hasSubcategories: true },
  { name: 'Technology', icon: <Ionicons name="laptop" size={28} color="#6B7280" />, hasSubcategories: true },
  { name: 'Travel', icon: <FontAwesome5 name="plane" size={28} color="#6B7280" />, hasSubcategories: true },
];

const styles = StyleSheet.create({
  gridContainer: {
    marginTop: 0,
    marginBottom: 8,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 0,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 0,
    paddingVertical: 0,
    minWidth: Dimensions.get('window').width / 5,
    maxWidth: Dimensions.get('window').width / 4,
  },
  iconBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 10,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  showMoreBtn: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  plusIcon: {
    width: 52,
    height: 52,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  showLessBtn: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#374151',
  },
  subcategoryItem: {
    paddingVertical: 8,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subcategoryText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'left',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#6B7280',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default function CategoryGrid() {
  const [showMore, setShowMore] = useState(false);
    const [modal, setModal] = useState({
      visible: false,
      title: '',
      subcategories: [] as string[],
    });
  const initialCount = 5;
  const perRow = 4;
  let displayCategories = [];
  let showPlus = false;

  if (showMore) {
    displayCategories = categories;
  } else {
    // Show first N, then + icon if more
    if (categories.length > initialCount) {
      displayCategories = categories.slice(0, initialCount);
      showPlus = true;
    } else {
      displayCategories = categories;
    }
  }

  // Fill the row with the + icon if needed
  let gridItems = [...displayCategories];
  if (!showMore && showPlus) {
    gridItems.push({ name: 'More', icon: <Ionicons name="add-circle" size={28} color="#6B7280" />, isPlus: true });
  }

  // Split into rows
  const rows = [];
  for (let i = 0; i < gridItems.length; i += perRow) {
    rows.push(gridItems.slice(i, i + perRow));
  }

  // If expanded, inject Show Less button in the third row after Travel
  let showLessInserted = false;
  if (showMore && rows.length >= 3) {
    // Find index of Travel in the third row
    const thirdRow = rows[2];
    const travelIdx = thirdRow.findIndex(cat => cat.name === 'Travel');
    if (travelIdx !== -1) {
      // Insert Show Less after Travel
      thirdRow.splice(travelIdx + 1, 0, { name: 'ShowLess', isShowLess: true });
      showLessInserted = true;
    }
  }

  return (
    <View style={styles.gridContainer}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((cat, catIdx) => {
            if (cat.isPlus) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setShowMore(true)}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>More</Text>
                </TouchableOpacity>
              );
            } else if (cat.isShowLess) {
              return (
                <TouchableOpacity key={"showless-btn"} style={styles.item} onPress={() => setShowMore(false)}>
                  <View style={styles.iconBox}><Ionicons name="remove-circle" size={28} color="#6B7280" /></View>
                  <Text style={styles.label}>Show Less</Text>
                </TouchableOpacity>
              );
            } else if (cat.hasSubcategories) {
              let subcategories = [];
              let title = '';
              switch (cat.name) {
                case 'Automotive':
                  subcategories = automotiveSubcategories;
                  title = 'Automotive Categories';
                  break;
                case 'Business':
                  subcategories = businessSubcategories;
                  title = 'Business Categories';
                  break;
                case 'Construction':
                  subcategories = constructionSubcategories;
                  title = 'Construction Categories';
                  break;
                case 'Education':
                  subcategories = educationSubcategories;
                  title = 'Education Categories';
                  break;
                case 'Health':
                  subcategories = healthSubcategories;
                  title = 'Health Categories';
                  break;
                case 'Lifestyle':
                  subcategories = lifestyleSubcategories;
                  title = 'Lifestyle Categories';
                  break;
                case 'Rentals':
                  subcategories = rentalsSubcategories;
                  title = 'Rentals Categories';
                  break;
                case 'Shopping':
                  subcategories = shoppingSubcategories;
                  title = 'Shopping Categories';
                  break;
                case 'Technology':
                  subcategories = technologySubcategories;
                  title = 'Technology Categories';
                  break;
                case 'Travel':
                  subcategories = travelSubcategories;
                  title = 'Travel Categories';
                  break;
                default:
                  break;
              }
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setModal({ visible: true, title, subcategories })}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>{cat.name}</Text>
                </TouchableOpacity>
              );
            } else {
              return (
                <View key={cat.name} style={styles.item}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>{cat.name}</Text>
                </View>
              );
            }
          })}
          {row.length < perRow &&
            Array.from({ length: perRow - row.length }).map((_, i) => (
              <View key={"empty-" + i} style={[styles.item, { backgroundColor: 'transparent' }]} />
            ))}
        </View>
      ))}
      {/* Full Screen SubCategory Modal with Search */}
      <SubCategoryModal
        visible={modal.visible}
        onClose={() => setModal({ ...modal, visible: false })}
        title={modal.title}
        subcategories={modal.subcategories}
      />
    </View>
  );
}
