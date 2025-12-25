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
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
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
  const [showAutomotiveSub, setShowAutomotiveSub] = useState(false);
  const [showBusinessSub, setShowBusinessSub] = useState(false);
  const [showConstructionSub, setShowConstructionSub] = useState(false);
  const [showEducationSub, setShowEducationSub] = useState(false);
  const [showHealthSub, setShowHealthSub] = useState(false);
  const [showLifestyleSub, setShowLifestyleSub] = useState(false);
  const [showRentalsSub, setShowRentalsSub] = useState(false);
  const [showShoppingSub, setShowShoppingSub] = useState(false);
  const [showTechnologySub, setShowTechnologySub] = useState(false);
  const [showTravelSub, setShowTravelSub] = useState(false);
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
            } else if (cat.name === 'Automotive' && cat.hasSubcategories) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setShowAutomotiveSub(true)}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>{cat.name}</Text>
                </TouchableOpacity>
              );
            } else if (cat.name === 'Business' && cat.hasSubcategories) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setShowBusinessSub(true)}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>{cat.name}</Text>
                </TouchableOpacity>
              );
            } else if (cat.name === 'Construction' && cat.hasSubcategories) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setShowConstructionSub(true)}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>{cat.name}</Text>
                </TouchableOpacity>
              );
            } else if (cat.name === 'Education' && cat.hasSubcategories) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setShowEducationSub(true)}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>{cat.name}</Text>
                </TouchableOpacity>
              );
            } else if (cat.name === 'Health' && cat.hasSubcategories) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setShowHealthSub(true)}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>{cat.name}</Text>
                </TouchableOpacity>
              );
            } else if (cat.name === 'Lifestyle' && cat.hasSubcategories) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setShowLifestyleSub(true)}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>{cat.name}</Text>
                </TouchableOpacity>
              );
            } else if (cat.name === 'Rentals' && cat.hasSubcategories) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setShowRentalsSub(true)}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>{cat.name}</Text>
                </TouchableOpacity>
              );
            } else if (cat.name === 'Shopping' && cat.hasSubcategories) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setShowShoppingSub(true)}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>{cat.name}</Text>
                </TouchableOpacity>
              );
            } else if (cat.name === 'Technology' && cat.hasSubcategories) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setShowTechnologySub(true)}>
                  <View style={styles.iconBox}>{cat.icon}</View>
                  <Text style={styles.label}>{cat.name}</Text>
                </TouchableOpacity>
              );
            } else if (cat.name === 'Travel' && cat.hasSubcategories) {
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setShowTravelSub(true)}>
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
      {/* Automotive Subcategories Modal */}
      <Modal
        visible={showAutomotiveSub}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAutomotiveSub(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Automotive Categories</Text>
            {automotiveSubcategories.map((sub, idx) => (
              <View key={sub} style={styles.subcategoryItem}>
                <Text style={styles.subcategoryText}>{sub}</Text>
              </View>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setShowAutomotiveSub(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Business Subcategories Modal */}
      <Modal
        visible={showBusinessSub}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBusinessSub(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Business Categories</Text>
            {businessSubcategories.map((sub, idx) => (
              <View key={sub} style={styles.subcategoryItem}>
                <Text style={styles.subcategoryText}>{sub}</Text>
              </View>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setShowBusinessSub(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Construction Subcategories Modal */}
      <Modal
        visible={showConstructionSub}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConstructionSub(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Construction Categories</Text>
            {constructionSubcategories.map((sub, idx) => (
              <View key={sub} style={styles.subcategoryItem}>
                <Text style={styles.subcategoryText}>{sub}</Text>
              </View>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setShowConstructionSub(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Education Subcategories Modal */}
      <Modal
        visible={showEducationSub}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEducationSub(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Education Categories</Text>
            {educationSubcategories.map((sub, idx) => (
              <View key={sub} style={styles.subcategoryItem}>
                <Text style={styles.subcategoryText}>{sub}</Text>
              </View>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setShowEducationSub(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Rentals Subcategories Modal */}
                <Modal
                  visible={showRentalsSub}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={() => setShowRentalsSub(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Rentals Categories</Text>
                      {rentalsSubcategories.map((sub, idx) => (
                        <View key={sub} style={styles.subcategoryItem}>
                          <Text style={styles.subcategoryText}>{sub}</Text>
                        </View>
                      ))}
                      <Pressable style={styles.closeButton} onPress={() => setShowRentalsSub(false)}>
                        <Text style={styles.closeButtonText}>Close</Text>
                      </Pressable>
                    </View>
                  </View>
                </Modal>
                {/* Lifestyle Subcategories Modal */}
                <Modal
                  visible={showLifestyleSub}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={() => setShowLifestyleSub(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Lifestyle Categories</Text>
                      {lifestyleSubcategories.map((sub, idx) => (
                        <View key={sub} style={styles.subcategoryItem}>
                          <Text style={styles.subcategoryText}>{sub}</Text>
                        </View>
                      ))}
                      <Pressable style={styles.closeButton} onPress={() => setShowLifestyleSub(false)}>
                        <Text style={styles.closeButtonText}>Close</Text>
                      </Pressable>
                    </View>
                  </View>
                </Modal>
                {/* Health Subcategories Modal */}
                <Modal
                  visible={showHealthSub}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={() => setShowHealthSub(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Health Categories</Text>
                      <ScrollView 
                        style={{width: '100%', maxHeight: 350, marginBottom: 12}}
                        contentContainerStyle={{alignItems: 'flex-start', paddingBottom: 0}}
                        showsVerticalScrollIndicator={true}
                      >
                        {healthSubcategories.map((sub, idx) => (
                          <View key={sub} style={[styles.subcategoryItem, {paddingVertical: 10, borderBottomWidth: idx === healthSubcategories.length - 1 ? 0 : 1}]}> 
                            <Text style={[styles.subcategoryText, {textAlign: 'left', fontSize: 15}]}>{sub}</Text>
                          </View>
                        ))}
                      </ScrollView>
                      <View style={{width: '100%', borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 8, paddingTop: 12, alignItems: 'center'}}>
                        <Pressable style={styles.closeButton} onPress={() => setShowHealthSub(false)}>
                          <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Modal>
                {/* Shopping Subcategories Modal */}
                <Modal
                  visible={showShoppingSub}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={() => setShowShoppingSub(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Shopping Categories</Text>
                      <ScrollView 
                        style={{width: '100%', maxHeight: 350, marginBottom: 12}}
                        contentContainerStyle={{alignItems: 'flex-start', paddingBottom: 0}}
                        showsVerticalScrollIndicator={true}
                      >
                        {shoppingSubcategories.map((sub, idx) => (
                          <View key={sub} style={[styles.subcategoryItem, {paddingVertical: 10, borderBottomWidth: idx === shoppingSubcategories.length - 1 ? 0 : 1}]}> 
                            <Text style={[styles.subcategoryText, {textAlign: 'left', fontSize: 15}]}>{sub}</Text>
                          </View>
                        ))}
                      </ScrollView>
                      <View style={{width: '100%', borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 8, paddingTop: 12, alignItems: 'center'}}>
                        <Pressable style={styles.closeButton} onPress={() => setShowShoppingSub(false)}>
                          <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Modal>
                 {/* Travel Subcategories Modal */}
                      <Modal
                        visible={showTravelSub}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setShowTravelSub(false)}
                      >
                        <View style={styles.modalOverlay}>
                          <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Travel Categories</Text>
                            <ScrollView 
                              style={{width: '100%', maxHeight: 350, marginBottom: 12}}
                              contentContainerStyle={{alignItems: 'flex-start', paddingBottom: 0}}
                              showsVerticalScrollIndicator={true}
                            >
                              {travelSubcategories.map((sub, idx) => (
                                <View key={sub} style={[styles.subcategoryItem, {paddingVertical: 10, borderBottomWidth: idx === travelSubcategories.length - 1 ? 0 : 1}]}> 
                                  <Text style={[styles.subcategoryText, {textAlign: 'left', fontSize: 15}]}>{sub}</Text>
                                </View>
                              ))}
                            </ScrollView>
                            <View style={{width: '100%', borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 8, paddingTop: 12, alignItems: 'center'}}>
                              <Pressable style={styles.closeButton} onPress={() => setShowTravelSub(false)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      </Modal>
                {/* Technology Subcategories Modal */}
                <Modal
                  visible={showTechnologySub}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={() => setShowTechnologySub(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Technology Categories</Text>
                      <ScrollView 
                        style={{width: '100%', maxHeight: 350, marginBottom: 12}}
                        contentContainerStyle={{alignItems: 'flex-start', paddingBottom: 0}}
                        showsVerticalScrollIndicator={true}
                      >
                        {technologySubcategories.map((sub, idx) => (
                          <View key={sub} style={[styles.subcategoryItem, {paddingVertical: 10, borderBottomWidth: idx === technologySubcategories.length - 1 ? 0 : 1}]}> 
                            <Text style={[styles.subcategoryText, {textAlign: 'left', fontSize: 15}]}>{sub}</Text>
                          </View>
                        ))}
                      </ScrollView>
                      <View style={{width: '100%', borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 8, paddingTop: 12, alignItems: 'center'}}>
                        <Pressable style={styles.closeButton} onPress={() => setShowTechnologySub(false)}>
                          <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Modal>
    </View>
  );
}
