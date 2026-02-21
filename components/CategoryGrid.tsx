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
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, Animated, FlatList, TextInput } from 'react-native';
import SubCategoryModal from './SubCategoryModal';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';

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

const servicesSubcategories = [
  'Courier Services',
  'Pest Control',
  'Security Services',
  'Cleaning Services',
  'Laundry & Dry Cleaning',
  'Catering Services',
  'Photography Services',
  'Printing Services',
  'AC Repair & Services',
  'Appliance Installation',
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
  { name: 'Services', icon: <MaterialIcons name="miscellaneous-services" size={28} color="#6B7280" />, hasSubcategories: true },
];

// 12 dummy categories shown in the "More" slider
const moreCategories = [
  { name: 'Real Estate', icon: <MaterialIcons name="apartment" size={28} color="#6B7280" /> },
  { name: 'Finance', icon: <MaterialIcons name="account-balance" size={28} color="#6B7280" /> },
  { name: 'Insurance', icon: <MaterialIcons name="security" size={28} color="#6B7280" /> },
  { name: 'Legal', icon: <Ionicons name="briefcase" size={28} color="#6B7280" /> },
  { name: 'Food', icon: <Ionicons name="restaurant" size={28} color="#6B7280" /> },
  { name: 'Agriculture', icon: <MaterialIcons name="grass" size={28} color="#6B7280" /> },
  { name: 'Sports', icon: <Ionicons name="football" size={28} color="#6B7280" /> },
  { name: 'Entertainment', icon: <Ionicons name="film" size={28} color="#6B7280" /> },
  { name: 'Logistics', icon: <FontAwesome5 name="truck" size={24} color="#6B7280" /> },
  { name: 'Marketing', icon: <Ionicons name="megaphone" size={28} color="#6B7280" /> },
  { name: 'Consulting', icon: <MaterialIcons name="support-agent" size={28} color="#6B7280" /> },
  { name: 'Beauty', icon: <MaterialIcons name="face" size={28} color="#6B7280" /> },
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
  // ── Subcategory search results ──
  subSearchContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  subSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  subSearchIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subSearchText: {
    flex: 1,
  },
  subSearchName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  subSearchCategory: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  // ── More slider styles ──
  sliderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  sliderContainer: {
    width: '75%',
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sliderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  sliderItem: {
    alignItems: 'center',
    width: Dimensions.get('window').width * 0.75 / 3 - 16,
    marginVertical: 10,
  },
  sliderIconBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  sliderSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sliderSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    paddingVertical: 0,
  },
});

export default function CategoryGrid({ searchQuery = '' }: { searchQuery?: string }) {
  const [showMore, setShowMore] = useState(false);
  const [showMoreSlider, setShowMoreSlider] = useState(false);
  const [sliderSearch, setSliderSearch] = useState('');
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
    const [modal, setModal] = useState({
      visible: false,
      title: '',
      subcategories: [] as string[],
    });
  const initialCount = 11;
  const perRow = 4;
  let displayCategories = [];
  let showPlus = false;

  // Build a subcategory lookup for filtering
  const subcategoryMap: Record<string, string[]> = {
    'Automotive': automotiveSubcategories,
    'Business': businessSubcategories,
    'Construction': constructionSubcategories,
    'Education': educationSubcategories,
    'Health': healthSubcategories,
    'Lifestyle': lifestyleSubcategories,
    'Rentals': rentalsSubcategories,
    'Shopping': shoppingSubcategories,
    'Technology': technologySubcategories,
    'Travel': travelSubcategories,
    'Services': servicesSubcategories,
  };

  // Filter categories based on search query
  const query = searchQuery.trim().toLowerCase();

  // Determine if we're matching category names or subcategory names
  let matchingCategoryNames: string[] = [];
  let matchingSubcategories: { category: string; subcategory: string }[] = [];

  if (query) {
    for (const cat of categories) {
      const subs = subcategoryMap[cat.name] || [];
      if (cat.name.toLowerCase().includes(query)) {
        // Category name matches → show category in grid
        matchingCategoryNames.push(cat.name);
      } else {
        // Check subcategories
        const matched = subs.filter((sub) => sub.toLowerCase().includes(query));
        for (const sub of matched) {
          matchingSubcategories.push({ category: cat.name, subcategory: sub });
        }
      }
    }
  }

  const isSubcategorySearch = query && matchingCategoryNames.length === 0 && matchingSubcategories.length > 0;

  const filteredCategories = query
    ? categories.filter((cat) => matchingCategoryNames.includes(cat.name))
    : categories;

  if (query && !isSubcategorySearch) {
    // When searching categories, show all matching (no More/Less)
    displayCategories = filteredCategories;
  } else {
    // Show first 11 categories, then + icon
    if (filteredCategories.length > initialCount) {
      displayCategories = filteredCategories.slice(0, initialCount);
      showPlus = true;
    } else {
      displayCategories = filteredCategories;
      // Always show More button if not searching
      if (!query) showPlus = true;
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

  // Open the More slider
  const openMoreSlider = () => {
    setShowMoreSlider(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMoreSlider = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowMoreSlider(false);
      setSliderSearch('');
    });
  };

  const filteredMoreCategories = sliderSearch.trim()
    ? moreCategories.filter((c) => c.name.toLowerCase().includes(sliderSearch.trim().toLowerCase()))
    : moreCategories;

  return (
    <View style={styles.gridContainer}>
      {/* When searching subcategories, show them as a list */}
      {isSubcategorySearch ? (
        <View style={styles.subSearchContainer}>
          {matchingSubcategories.map((item, idx) => (
            <TouchableOpacity
              key={`${item.category}-${item.subcategory}-${idx}`}
              style={styles.subSearchItem}
              activeOpacity={0.7}
              onPress={() => {
                router.push({
                  pathname: '/business-cards',
                  params: { subcategory: item.subcategory, category: `${item.category} Categories` },
                });
              }}
            >
              <View style={styles.subSearchIcon}>
                <Ionicons name="pricetag" size={16} color="#3B82F6" />
              </View>
              <View style={styles.subSearchText}>
                <Text style={styles.subSearchName}>{item.subcategory}</Text>
                <Text style={styles.subSearchCategory}>{item.category}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
      <>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((cat, catIdx) => {
            if (cat.isPlus) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={openMoreSlider}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>More</Text>
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
                case 'Services':
                  subcategories = servicesSubcategories;
                  title = 'Services Categories';
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
      </>
      )}
      {/* Full Screen SubCategory Modal with Search */}
      <SubCategoryModal
        visible={modal.visible}
        onClose={() => setModal({ ...modal, visible: false })}
        title={modal.title}
        subcategories={modal.subcategories}
      />

      {/* More Categories Right Slider */}
      <Modal
        visible={showMoreSlider}
        transparent
        animationType="none"
        onRequestClose={closeMoreSlider}
      >
        <TouchableOpacity
          style={styles.sliderOverlay}
          activeOpacity={1}
          onPress={closeMoreSlider}
        >
          <Animated.View
            style={[
              styles.sliderContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderTitle}>More Categories</Text>
                <TouchableOpacity onPress={closeMoreSlider} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <View style={styles.sliderSearchRow}>
                <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.sliderSearchInput}
                  placeholder="Search categories..."
                  placeholderTextColor="#9CA3AF"
                  value={sliderSearch}
                  onChangeText={setSliderSearch}
                />
                {sliderSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setSliderSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
              <FlatList
                data={filteredMoreCategories}
                keyExtractor={(item) => item.name}
                numColumns={3}
                contentContainerStyle={{ paddingBottom: 40 }}
                columnWrapperStyle={{ justifyContent: 'flex-start', marginBottom: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.sliderItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      closeMoreSlider();
                    }}
                  >
                    <View style={styles.sliderIconBox}>{item.icon}</View>
                    <Text style={styles.sliderLabel}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
