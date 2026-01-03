import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type FormStep = 'business' | 'category' | 'contact' | 'location';

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
    'Schools & Educational Institutions', 'Playgroups', 'Kindergartens',
    'Home Tutors', 'Tutorials & Coaching Classes', 'Training Institutes',
    'Language Classes', 'Motor Training Schools', 'Overseas Education Consultants',
    'Yoga & Wellness Classes',
  ],
  'Construction': [
    'Borewell Contractors', 'Builders & Contractors', 'Carpentry Contractors',
    'Civil Contractors', 'Electrical Contractors', 'Electricians',
    'False Ceiling Contractors', 'Home Services', 'Housekeeping Services',
    'Modular Kitchen Designers', 'Painting Contractors', 'Plumbers',
    'Ready Mix Concrete Suppliers', 'Waterproofing Contractors',
  ],
  'Automotive': [
    'Automobile Dealers', 'Car Insurance Agents', 'Car Loans & Finance',
    'Car Repairs & Services', 'Taxi & Cab Services', 'Towing Services',
    'Transporters & Logistics',
  ],
  'Business': [
    'Bulk SMS & Digital Marketing', 'Chartered Accountants', 'Business Consultants',
    'GST Registration Consultants', 'Income Tax Consultants', 'Registration Consultants',
    'Event Organizers', 'Party Organisers', 'Wedding Planners & Requisites',
    'Interior Designers', 'Lawyers & Legal Services', 'Logistics & Supply Chain',
    'Online Passport Agents', 'Packers & Movers', 'Repairs & Maintenance Services',
    'Website Designers & Developers',
  ],
};

export default function BusinessPromotionScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [currentStep, setCurrentStep] = useState<FormStep>('business');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(['']);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    category: [] as string[],
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: '',
    gstNumber: '',
    panNumber: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  const addCategory = (category: string) => {
    if (!formData.category.includes(category)) {
      setFormData(prev => ({
        ...prev,
        category: [...prev.category, category]
      }));
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.filter(cat => cat !== categoryToRemove)
    }));
  };

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, '']);
  };

  const updatePhoneNumber = (index: number, value: string) => {
    const newPhones = [...phoneNumbers];
    newPhones[index] = value;
    setPhoneNumbers(newPhones);
    updateField('phone', newPhones.filter(p => p.trim() !== '').join(', '));
  };

  const removePhoneNumber = (index: number) => {
    const newPhones = phoneNumbers.filter((_, i) => i !== index);
    setPhoneNumbers(newPhones.length > 0 ? newPhones : ['']);
    updateField('phone', newPhones.filter(p => p.trim() !== '').join(', '));
  };

  const filteredSubcategories = selectedCategory
    ? SERVICE_CATEGORIES[selectedCategory as keyof typeof SERVICE_CATEGORIES].filter(sub =>
        sub.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep === 'business') {
      setCurrentStep('category');
    } else if (currentStep === 'category') {
      setCurrentStep('contact');
    } else if (currentStep === 'contact') {
      setCurrentStep('location');
    }
  };

  const handleBack = () => {
    if (currentStep === 'location') {
      setCurrentStep('contact');
    } else if (currentStep === 'contact') {
      setCurrentStep('category');
    } else if (currentStep === 'category') {
      setCurrentStep('business');
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    console.log('Business Form Submitted:', formData);
    router.push('/promotion-pricing');
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'business':
        return 'Business Information';
      case 'category':
        return 'Business Category';
      case 'contact':
        return 'Contact Details';
      case 'location':
        return 'Location & Credentials';
      default:
        return 'Business Information';
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'business':
        return 1;
      case 'category':
        return 2;
      case 'contact':
        return 3;
      case 'location':
        return 4;
      default:
        return 1;
    }
  };

  const renderBusinessInfo = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your business name"
          placeholderTextColor="#999"
          value={formData.businessName}
          onChangeText={(text) => updateField('businessName', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Owner Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          placeholderTextColor="#999"
          value={formData.ownerName}
          onChangeText={(text) => updateField('ownerName', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Brief description of your business"
          placeholderTextColor="#999"
          value={formData.description}
          onChangeText={(text) => updateField('description', text)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>GST Number (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="22AAAAA0000A1Z5"
          placeholderTextColor="#999"
          value={formData.gstNumber}
          onChangeText={(text) => updateField('gstNumber', text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={15}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PAN Number (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="ABCDE1234F"
          placeholderTextColor="#999"
          value={formData.panNumber}
          onChangeText={(text) => updateField('panNumber', text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={10}
        />
      </View>
    </View>
  );

  const renderCategory = () => (
    <View style={styles.stepContent}>
      <View style={styles.categoryWrapper}>
        <Text style={styles.categoryTitle}>Add Business Category</Text>
        <Text style={styles.categorySubtitle}>Choose the right business categories so your customer can easily find you</Text>
        
        <TouchableOpacity
          style={styles.categoryTextField}
          onPress={() => setCategoryModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.categoryTextInput, formData.category.length === 0 && styles.placeholderText]}>
            {formData.category.length > 0 ? `${formData.category.length} service${formData.category.length > 1 ? 's' : ''} selected` : 'Type Business Category'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Selected Categories as Chips */}
        {formData.category.length > 0 && (
          <View style={styles.chipsContainer}>
            {formData.category.map((cat, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{cat}</Text>
                <TouchableOpacity
                  onPress={() => removeCategory(cat)}
                  style={styles.chipRemove}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const renderContactDetails = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="business@example.com"
          placeholderTextColor="#999"
          value={formData.email}
          onChangeText={(text) => updateField('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        {phoneNumbers.map((phone, index) => (
          <View key={index} style={styles.phoneNumberRow}>
            <View style={styles.phoneInputWrapper}>
              <TextInput
                style={styles.phoneInputField}
                placeholder="+91 98765 43210"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={(text) => updatePhoneNumber(index, text)}
                keyboardType="phone-pad"
              />
              {index > 0 && (
                <TouchableOpacity
                  style={styles.removePhoneButton}
                  onPress={() => removePhoneNumber(index)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addPhoneButton}
          onPress={addPhoneNumber}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
          <Text style={styles.addPhoneText}>Add Phone</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>WhatsApp Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+91 98765 43210"
          placeholderTextColor="#999"
          value={formData.whatsapp}
          onChangeText={(text) => updateField('whatsapp', text)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Website (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="www.yourbusiness.com"
          placeholderTextColor="#999"
          value={formData.website}
          onChangeText={(text) => updateField('website', text)}
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderLocation = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Address *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Street address, building, landmark"
          placeholderTextColor="#999"
          value={formData.address}
          onChangeText={(text) => updateField('address', text)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor="#999"
            value={formData.city}
            onChangeText={(text) => updateField('city', text)}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            placeholder="State"
            placeholderTextColor="#999"
            value={formData.state}
            onChangeText={(text) => updateField('state', text)}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PIN Code *</Text>
        <TextInput
          style={styles.input}
          placeholder="123456"
          placeholderTextColor="#999"
          value={formData.pincode}
          onChangeText={(text) => updateField('pincode', text)}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Promotion</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicatorContainer}>
          <View style={styles.stepIndicator}>
            <TouchableOpacity 
              style={styles.stepItem}
              onPress={() => setCurrentStep('business')}
              activeOpacity={0.7}
            >
              <View style={[styles.stepCircle, currentStep === 'business' && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, currentStep === 'business' && styles.stepNumberActive]}>1</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 'business' && styles.stepLabelActive]}>Business</Text>
            </TouchableOpacity>
            <View style={styles.stepLine} />
            <TouchableOpacity 
              style={styles.stepItem}
              onPress={() => setCurrentStep('category')}
              activeOpacity={0.7}
            >
              <View style={[styles.stepCircle, currentStep === 'category' && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, currentStep === 'category' && styles.stepNumberActive]}>2</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 'category' && styles.stepLabelActive]}>Category</Text>
            </TouchableOpacity>
            <View style={styles.stepLine} />
            <TouchableOpacity 
              style={styles.stepItem}
              onPress={() => setCurrentStep('contact')}
              activeOpacity={0.7}
            >
              <View style={[styles.stepCircle, currentStep === 'contact' && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, currentStep === 'contact' && styles.stepNumberActive]}>3</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 'contact' && styles.stepLabelActive]}>Contact</Text>
            </TouchableOpacity>
            <View style={styles.stepLine} />
            <TouchableOpacity 
              style={styles.stepItem}
              onPress={() => setCurrentStep('location')}
              activeOpacity={0.7}
            >
              <View style={[styles.stepCircle, currentStep === 'location' && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, currentStep === 'location' && styles.stepNumberActive]}>4</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 'location' && styles.stepLabelActive]}>Location</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step Title */}
        <View style={styles.stepTitleContainer}>
          <Text style={styles.stepTitle}>{getStepTitle()}</Text>
          <Text style={styles.stepSubtitle}>Step {getStepNumber()} of 4</Text>
        </View>

        {/* Form Content */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {currentStep === 'business' && renderBusinessInfo()}
          {currentStep === 'category' && renderCategory()}
          {currentStep === 'contact' && renderContactDetails()}
          {currentStep === 'location' && renderLocation()}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {currentStep !== 'business' && (
            <TouchableOpacity 
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonSecondaryText}>Back</Text>
            </TouchableOpacity>
          )}
          
          {currentStep !== 'location' ? (
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary, currentStep === 'business' && styles.buttonFull]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonPrimaryText}>Save & Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonPrimaryText}>Save &Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setCategoryModalVisible(false);
          setSelectedCategory(null);
          setSearchQuery('');
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
                    setCategoryModalVisible(false);
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
                  setCategoryModalVisible(false);
                  setSelectedCategory(null);
                  setSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.modalSearchIcon} />
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
                      addCategory(`${selectedCategory} - ${item}`);
                      setCategoryModalVisible(false);
                      setSelectedCategory(null);
                      setSearchQuery('');
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
  keyboardView: {
    flex: 1,
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
  stepIndicatorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  stepLine: {
    height: 2,
    flex: 0.8,
    backgroundColor: '#E5E7EB',
    marginBottom: 30,
  },
  stepTitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  stepContent: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownText: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 13,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
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
  searchIcon: {
    marginRight: 8,
  },
  modalSearchIcon: {
    marginRight: 8,
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
  categoryWrapper: {
    flex: 1,
    paddingTop: 10,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  categorySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
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
    justifyContent: 'space-between',
  },
  categoryTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  chipText: {
    fontSize: 14,
    color: '#5B21B6',
    fontWeight: '500',
    marginRight: 6,
  },
  chipRemove: {
    marginLeft: 2,
  },
  phoneNumberRow: {
    marginBottom: 12,
  },
  phoneInputWrapper: {
    position: 'relative',
    width: '100%',
  },
  phoneInputField: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
    paddingRight: 45,
  },
  removePhoneButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -11 }],
  },
  addPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  addPhoneText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '600',
    marginLeft: 6,
  },
});