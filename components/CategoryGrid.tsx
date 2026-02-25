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
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, Animated, FlatList, TextInput } from 'react-native';
import SubCategoryModal from './SubCategoryModal';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';

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
  { name: 'Logistics', icon: <FontAwesome5 name="truck" size={24} color="#6B7280" /> },
  { name: 'Marketing', icon: <Ionicons name="megaphone" size={28} color="#6B7280" /> },
  { name: 'Consulting', icon: <MaterialIcons name="support-agent" size={28} color="#6B7280" /> },
  { name: 'Beauty', icon: <MaterialIcons name="face" size={28} color="#6B7280" /> },
  { name: 'Pets', icon: <Ionicons name="paw" size={28} color="#6B7280" /> },
  { name: 'Entertainment', icon: <Ionicons name="film" size={28} color="#6B7280" /> },
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

  // Fetch backend categories and merge with hardcoded
  const [backendCategories, setBackendCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res?.success && res?.data) {
          setBackendCategories(res.data);
        }
      } catch (error) {
        console.log('⚠️ Failed to fetch categories from backend, using hardcoded');
      }
    };
    fetchCategories();
  }, []);

  // Hardcoded subcategory map (baseline)
  const hardcodedSubcategoryMap: Record<string, string[]> = {
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

  // Hardcoded icon map for known categories
  const hardcodedIconMap: Record<string, React.ReactNode> = {
    'Automotive': <FontAwesome5 name="car" size={28} color="#6B7280" />,
    'Business': <MaterialIcons name="business-center" size={28} color="#6B7280" />,
    'Construction': <FontAwesome5 name="tools" size={28} color="#6B7280" />,
    'Education': <Ionicons name="school" size={28} color="#6B7280" />,
    'Health': <Ionicons name="medkit" size={28} color="#6B7280" />,
    'Lifestyle': <MaterialIcons name="style" size={28} color="#6B7280" />,
    'Rentals': <FontAwesome5 name="key" size={28} color="#6B7280" />,
    'Shopping': <MaterialIcons name="shopping-cart" size={28} color="#6B7280" />,
    'Technology': <Ionicons name="laptop" size={28} color="#6B7280" />,
    'Travel': <FontAwesome5 name="plane" size={28} color="#6B7280" />,
    'Services': <MaterialIcons name="miscellaneous-services" size={28} color="#6B7280" />,
  };

  // Smart icon resolver: maps category name keywords to proper vector icons
  const getCategoryIcon = (name: string): React.ReactNode => {
    // Check hardcoded map first
    if (hardcodedIconMap[name]) return hardcodedIconMap[name];
    // Keyword-based matching (case-insensitive)
    const n = name.toLowerCase();
    // Plumbing & pipes
    if (n.includes('plumb') || n.includes('pipe') || n.includes('tap') || n.includes('sanit')) return <FontAwesome5 name="wrench" size={28} color="#6B7280" />;
    // Carpentry & woodwork
    if (n.includes('carpent') || n.includes('wood') || n.includes('furniture') || n.includes('cabinet')) return <FontAwesome5 name="hammer" size={28} color="#6B7280" />;
    // Electrician & wiring
    if (n.includes('electric') || n.includes('wiring') || n.includes('power') || n.includes('solar') || n.includes('energy')) return <Ionicons name="flash" size={28} color="#6B7280" />;
    // Painting walls (before art/paint)
    if (n.includes('paint') && (n.includes('wall') || n.includes('house') || n.includes('contract'))) return <FontAwesome5 name="paint-roller" size={28} color="#6B7280" />;
    // Music & audio
    if (n.includes('music') || n.includes('audio') || n.includes('sing') || n.includes('instrument') || n.includes('band') || n.includes('dj')) return <Ionicons name="musical-notes" size={28} color="#6B7280" />;
    // School & academy
    if (n.includes('school') || n.includes('academy') || n.includes('institute')) return <Ionicons name="school" size={28} color="#6B7280" />;
    // Food & restaurant
    if (n.includes('food') || n.includes('restaurant') || n.includes('cook') || n.includes('kitchen') || n.includes('cafe') || n.includes('bakery') || n.includes('cake') || n.includes('sweet') || n.includes('catering')) return <Ionicons name="restaurant" size={28} color="#6B7280" />;
    // Sports & fitness
    if (n.includes('sport') || n.includes('gym') || n.includes('fitness') || n.includes('cricket') || n.includes('football') || n.includes('badminton') || n.includes('tennis') || n.includes('swim')) return <Ionicons name="football" size={28} color="#6B7280" />;
    // Art & design
    if (n.includes('art') || n.includes('design') || n.includes('craft') || n.includes('drawing') || n.includes('sketch')) return <Ionicons name="color-palette" size={28} color="#6B7280" />;
    // Photography & video
    if (n.includes('photo') || n.includes('camera') || n.includes('video') || n.includes('studio')) return <Ionicons name="camera" size={28} color="#6B7280" />;
    // Pets & animals
    if (n.includes('pet') || n.includes('animal') || n.includes('vet') || n.includes('dog') || n.includes('bird')) return <Ionicons name="paw" size={28} color="#6B7280" />;
    // Beauty & salon
    if (n.includes('beauty') || n.includes('salon') || n.includes('spa') || n.includes('makeup') || n.includes('parlour') || n.includes('parlor') || n.includes('hair') || n.includes('barber')) return <MaterialIcons name="face" size={28} color="#6B7280" />;
    // Legal & law
    if (n.includes('legal') || n.includes('law') || n.includes('advocate') || n.includes('court') || n.includes('notary')) return <Ionicons name="briefcase" size={28} color="#6B7280" />;
    // Finance & banking
    if (n.includes('finance') || n.includes('bank') || n.includes('loan') || n.includes('account') || n.includes('chartered')) return <MaterialIcons name="account-balance" size={28} color="#6B7280" />;
    // Insurance
    if (n.includes('insurance')) return <MaterialIcons name="security" size={28} color="#6B7280" />;
    // Real estate & property
    if (n.includes('real estate') || n.includes('property') || n.includes('apartment') || n.includes('flat') || n.includes('plot') || n.includes('broker')) return <MaterialIcons name="apartment" size={28} color="#6B7280" />;
    // Agriculture & farming
    if (n.includes('farm') || n.includes('agriculture') || n.includes('garden') || n.includes('nursery') || n.includes('plant') || n.includes('seed')) return <MaterialIcons name="grass" size={28} color="#6B7280" />;
    // Logistics & transport
    if (n.includes('logistic') || n.includes('transport') || n.includes('delivery') || n.includes('courier') || n.includes('packer') || n.includes('mover') || n.includes('cargo') || n.includes('freight')) return <FontAwesome5 name="truck" size={24} color="#6B7280" />;
    // Marketing & advertising
    if (n.includes('market') || n.includes('advertis') || n.includes('promo') || n.includes('seo') || n.includes('digital')) return <Ionicons name="megaphone" size={28} color="#6B7280" />;
    // Consulting
    if (n.includes('consult')) return <MaterialIcons name="support-agent" size={28} color="#6B7280" />;
    // Entertainment & movies
    if (n.includes('entertain') || n.includes('movie') || n.includes('theatre') || n.includes('drama') || n.includes('comedy') || n.includes('magic')) return <Ionicons name="film" size={28} color="#6B7280" />;
    // Automotive & vehicles
    if (n.includes('car ') || n.includes('auto') || n.includes('vehicle') || n.includes('motor') || n.includes('bike') || n.includes('mechanic') || n.includes('garage') || n.includes('tyre') || n.includes('tire')) return <FontAwesome5 name="car" size={28} color="#6B7280" />;
    // Fashion & tailoring
    if (n.includes('cloth') || n.includes('fashion') || n.includes('textile') || n.includes('tailor') || n.includes('boutique') || n.includes('stitch') || n.includes('embroid')) return <Ionicons name="shirt" size={28} color="#6B7280" />;
    // Doctor & medical
    if (n.includes('medic') || n.includes('doctor') || n.includes('hospital') || n.includes('clinic') || n.includes('health') || n.includes('dentist') || n.includes('physio') || n.includes('surgeon') || n.includes('pharma') || n.includes('ayurved') || n.includes('homeo')) return <Ionicons name="medkit" size={28} color="#6B7280" />;
    // Travel & tourism
    if (n.includes('travel') || n.includes('tour') || n.includes('flight') || n.includes('hotel') || n.includes('resort') || n.includes('visa') || n.includes('passport')) return <FontAwesome5 name="plane" size={28} color="#6B7280" />;
    // Technology & IT
    if (n.includes('tech') || n.includes('computer') || n.includes('software') || n.includes('web') || n.includes('app ') || n.includes('mobile') || n.includes('cctv') || n.includes('laptop')) return <Ionicons name="laptop" size={28} color="#6B7280" />;
    // Construction & building
    if (n.includes('build') || n.includes('construct') || n.includes('architect') || n.includes('cement') || n.includes('concrete') || n.includes('masonry') || n.includes('civil')) return <FontAwesome5 name="tools" size={28} color="#6B7280" />;
    // Dance
    if (n.includes('dance') || n.includes('choreograph')) return <Ionicons name="musical-notes" size={28} color="#6B7280" />;
    // Yoga & wellness
    if (n.includes('yoga') || n.includes('meditation') || n.includes('wellness') || n.includes('ayush')) return <MaterialIcons name="self-improvement" size={28} color="#6B7280" />;
    // Cleaning & housekeeping
    if (n.includes('clean') || n.includes('laundry') || n.includes('wash') || n.includes('housekeep') || n.includes('pest') || n.includes('dry clean')) return <MaterialIcons name="cleaning-services" size={28} color="#6B7280" />;
    // Trading & stocks
    if (n.includes('trad') || n.includes('stock') || n.includes('invest') || n.includes('mutual fund')) return <MaterialIcons name="trending-up" size={28} color="#6B7280" />;
    // Events & weddings
    if (n.includes('event') || n.includes('wedding') || n.includes('party') || n.includes('decoration') || n.includes('tent') || n.includes('mandap')) return <MaterialIcons name="celebration" size={28} color="#6B7280" />;
    // Home & interior
    if (n.includes('home') || n.includes('house') || n.includes('interior') || n.includes('decor') || n.includes('curtain') || n.includes('modular')) return <Ionicons name="home" size={28} color="#6B7280" />;
    // Books & stationery
    if (n.includes('book') || n.includes('library') || n.includes('publish') || n.includes('stationery')) return <Ionicons name="book" size={28} color="#6B7280" />;
    // Religious & spiritual
    if (n.includes('temple') || n.includes('church') || n.includes('mosque') || n.includes('pandit') || n.includes('puja') || n.includes('astrol') || n.includes('relig') || n.includes('spiritual')) return <FontAwesome5 name="pray" size={28} color="#6B7280" />;
    // Tutoring & coaching
    if (n.includes('tutor') || n.includes('coach') || n.includes('teach') || n.includes('class') || n.includes('training') || n.includes('learn')) return <Ionicons name="school" size={28} color="#6B7280" />;
    // Childcare
    if (n.includes('child') || n.includes('baby') || n.includes('kid') || n.includes('creche') || n.includes('daycare')) return <Ionicons name="people" size={28} color="#6B7280" />;
    // Grocery & daily needs
    if (n.includes('grocer') || n.includes('kirana') || n.includes('supermarket') || n.includes('daily need')) return <MaterialIcons name="shopping-cart" size={28} color="#6B7280" />;
    // Jewellery & gold
    if (n.includes('jewel') || n.includes('gold') || n.includes('silver') || n.includes('diamond') || n.includes('ornament')) return <Ionicons name="diamond" size={28} color="#6B7280" />;
    // Printing & press
    if (n.includes('print') || n.includes('press') || n.includes('banner') || n.includes('flex') || n.includes('signage')) return <Ionicons name="print" size={28} color="#6B7280" />;
    // AC & appliance repair
    if (n.includes('ac ') || n.includes('air condition') || n.includes('hvac') || n.includes('refrig') || n.includes('fridge') || n.includes('appliance')) return <Ionicons name="snow" size={28} color="#6B7280" />;
    // Security & guards
    if (n.includes('security') || n.includes('guard') || n.includes('safe') || n.includes('surveillance')) return <Ionicons name="shield-checkmark" size={28} color="#6B7280" />;
    // Water & tanker
    if (n.includes('water') || n.includes('tanker') || n.includes('borewell') || n.includes('purif')) return <Ionicons name="water" size={28} color="#6B7280" />;
    // Taxi & cab
    if (n.includes('taxi') || n.includes('cab') || n.includes('ride')) return <Ionicons name="car-sport" size={28} color="#6B7280" />;
    // Welding & metal
    if (n.includes('weld') || n.includes('metal') || n.includes('iron') || n.includes('steel') || n.includes('fabricat') || n.includes('gate') || n.includes('grill')) return <MaterialIcons name="construction" size={28} color="#6B7280" />;
    // Tools & repair (general catch-all)
    if (n.includes('repair') || n.includes('service') || n.includes('fix') || n.includes('maintenance') || n.includes('tool')) return <FontAwesome5 name="wrench" size={28} color="#6B7280" />;
    // Default fallback
    return <MaterialIcons name="category" size={28} color="#6B7280" />;
  };

  // Merge hardcoded categories + backend categories
  const { mergedCategories, mergedSubcategoryMap } = useMemo(() => {
    // Start with hardcoded categories
    const knownNames = new Set(categories.map(c => c.name));
    const mergedCats = [...categories];
    const mergedSubMap: Record<string, string[]> = { ...hardcodedSubcategoryMap };

    for (const apiCat of backendCategories) {
      if (knownNames.has(apiCat.name)) {
        // Existing category - merge subcategories
        const existing = new Set((mergedSubMap[apiCat.name] || []).map(s => s.toLowerCase()));
        const newSubs = (apiCat.subcategories || []).filter((s: string) => !existing.has(s.toLowerCase()));
        if (newSubs.length > 0) {
          mergedSubMap[apiCat.name] = [...(mergedSubMap[apiCat.name] || []), ...newSubs];
        }
      } else {
        // New category from backend (admin-approved)
        knownNames.add(apiCat.name);
        mergedCats.push({
          name: apiCat.name,
          icon: getCategoryIcon(apiCat.name),
          hasSubcategories: true,
        });
        mergedSubMap[apiCat.name] = apiCat.subcategories || [];
      }
    }

    return { mergedCategories: mergedCats, mergedSubcategoryMap: mergedSubMap };
  }, [backendCategories]);

  const initialCount = 11;
  const perRow = 4;
  let displayCategories = [];
  let showPlus = false;

  // Build a subcategory lookup for filtering (use merged)
  const subcategoryMap = mergedSubcategoryMap;

  // Filter categories based on search query
  const query = searchQuery.trim().toLowerCase();

  // Determine if we're matching category names or subcategory names
  let matchingCategoryNames: string[] = [];
  let matchingSubcategories: { category: string; subcategory: string }[] = [];

  if (query) {
    for (const cat of mergedCategories) {
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
    ? mergedCategories.filter((cat) => matchingCategoryNames.includes(cat.name))
    : mergedCategories;

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
    gridItems.push({ name: 'More', icon: <Ionicons name="add-circle" size={28} color="#CA8A04" />, isPlus: true });
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

  // Combine overflow backend categories + hardcoded moreCategories for the slider
  const overflowMergedCategories = mergedCategories.slice(initialCount).map(cat => ({
    name: cat.name,
    icon: getCategoryIcon(cat.name),
    hasSubcategories: true,
  }));
  const overflowNames = new Set(overflowMergedCategories.map(c => c.name.toLowerCase()));
  const allMoreCategories = [
    ...overflowMergedCategories,
    ...moreCategories.filter(c => !overflowNames.has(c.name.toLowerCase())),
  ];
  const filteredMoreCategories = sliderSearch.trim()
    ? allMoreCategories.filter((c) => c.name.toLowerCase().includes(sliderSearch.trim().toLowerCase()))
    : allMoreCategories;

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
                  <View style={[styles.iconBox, { backgroundColor: '#FEF9C3', borderColor: '#FACC15' }]}>{cat.icon}</View>
                  <Text style={styles.label}>More</Text>
                </TouchableOpacity>
              );
            } else if (cat.hasSubcategories) {
              const subcategories = subcategoryMap[cat.name] || [];
              const title = `${cat.name} Categories`;
              return (
                <TouchableOpacity key={cat.name} style={styles.item} onPress={() => setModal({ visible: true, title, subcategories })}>
                  <View style={styles.iconBox}>{getCategoryIcon(cat.name)}</View>
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
                      if (item.hasSubcategories) {
                        const subs = subcategoryMap[item.name] || [];
                        closeMoreSlider();
                        setModal({ visible: true, title: `${item.name} Categories`, subcategories: subs });
                      } else {
                        closeMoreSlider();
                      }
                    }}
                  >
                    <View style={styles.sliderIconBox}>{item.icon}</View>
                    <Text style={styles.sliderLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{item.name}</Text>
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
