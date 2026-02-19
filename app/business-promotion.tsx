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
  BackHandler,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../lib/api';
import { validateGST, validatePAN } from '../utils/gstPanValidation';

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

// Generate time options for time picker (1 AM, 2 AM, 3 AM... style)
const generateTimeOptions = (): Array<string | { label: string; value: string }> => {
  const times: Array<string | { label: string; value: string }> = ['24 hours'];
  for (let hour = 1; hour <= 12; hour++) {
    // AM times
    const amHour24 = hour === 12 ? 0 : hour;
    const amHourStr = amHour24.toString().padStart(2, '0');
    times.push({ label: `${hour} AM`, value: `${amHourStr}:00` });

    // PM times
    const pmHour24 = hour === 12 ? 12 : hour + 12;
    const pmHourStr = pmHour24.toString().padStart(2, '0');
    times.push({ label: `${hour} PM`, value: `${pmHourStr}:00` });
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

export default function BusinessPromotionScreen() {
  const params = useLocalSearchParams<{
    listingType?: 'FREE' | 'PREMIUM';
    promotionId?: string;
  }>();
  const listingType = params.listingType || 'FREE';

  // const params = useLocalSearchParams<{ category?: string }>();
  const [currentStep, setCurrentStep] = useState<FormStep>('business');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(['']);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [businessHoursModalVisible, setBusinessHoursModalVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<'open' | 'close'>('open');
  const [timePickerDay, setTimePickerDay] = useState<string>('');
  // const [promotionId, setPromotionId] = useState<string | null>(null);
  const [promotionId, setPromotionId] = useState<string | null>(
    params.promotionId || null
  );

  const [loading, setLoading] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState({
    Sunday: { open: false, openTime: '09:00', closeTime: '18:00' },
    Monday: { open: false, openTime: '09:00', closeTime: '18:00' },
    Tuesday: { open: false, openTime: '09:00', closeTime: '18:00' },
    Wednesday: { open: false, openTime: '09:00', closeTime: '18:00' },
    Thursday: { open: false, openTime: '09:00', closeTime: '18:00' },
    Friday: { open: false, openTime: '09:00', closeTime: '18:00' },
    Saturday: { open: false, openTime: '09:00', closeTime: '18:00' },
  });
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    category: [] as string[],
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    area: '',
    pincode: '',
    plotNo: '',
    buildingName: '',
    streetName: '',
    landmark: '',
    city: '',
    state: '',
    description: '',
    gstNumber: '',
    panNumber: '',
  });

  // Validation errors for GST and PAN
  const [gstError, setGstError] = useState<string | null>(null);
  const [panError, setPanError] = useState<string | null>(null);

  // Validation errors for required fields
  const [businessNameError, setBusinessNameError] = useState<string | null>(null);
  const [ownerNameError, setOwnerNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [localityError, setLocalityError] = useState<string | null>(null);
  const [streetError, setStreetError] = useState<string | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);
  const [stateError, setStateError] = useState<string | null>(null);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!promotionId) return;

    const fetchPromotion = async () => {
      try {
        const res = await api.get(`/business-promotion/${promotionId}`);
        const p = res.promotion;
        if (!p) return;

        // If already active free → go to profile
        if (p.status === 'active' && listingType === 'FREE') {
          router.replace('/profile');
          return;
        }

        // Fill form
        setFormData({
          businessName: p.businessName || '',
          ownerName: p.ownerName || '',
          category: p.category || [],
          email: p.email || '',
          phone: p.phone || '',
          whatsapp: p.whatsapp || '',
          website: p.website || '',
          area: p.area || '',
          pincode: p.pincode || '',
          plotNo: p.plotNo || '',
          buildingName: p.buildingName || '',
          streetName: p.streetName || '',
          landmark: p.landmark || '',
          city: p.city || '',
          state: p.state || '',
          description: p.description || '',
          gstNumber: p.gstNumber || '',
          panNumber: p.panNumber || '',
        });

        if (p.businessHours) {
          setWeeklySchedule(p.businessHours);
        }

        setCurrentStep(p.currentStep || 'business');

      } catch (err) {
        console.log('Error loading promotion', err);
      }
    };

    fetchPromotion();
  }, [promotionId]);




  // Validate GST number
  const handleGSTChange = (text: string) => {
    const upperText = text.toUpperCase();
    updateField('gstNumber', upperText);

    if (upperText.trim() === '') {
      setGstError(null);
      return;
    }

    const validation = validateGST(upperText);
    if (!validation.isValid) {
      setGstError(validation.error || 'Invalid GST number');
    } else {
      setGstError(null);
    }
  };

  // Validate PAN number
  const handlePANChange = (text: string) => {
    const upperText = text.toUpperCase();
    updateField('panNumber', upperText);

    if (upperText.trim() === '') {
      setPanError(null);
      return;
    }

    const validation = validatePAN(upperText);
    if (!validation.isValid) {
      setPanError(validation.error || 'Invalid PAN number');
    } else {
      setPanError(null);
    }
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

  const handleAddCustomCategory = () => {
    if (customCategoryInput.trim()) {
      if (selectedCategory) {
        // Adding custom subcategory
        addCategory(`${selectedCategory} - ${customCategoryInput.trim()}`);
      } else {
        // Adding custom category (no main category)
        addCategory(customCategoryInput.trim());
      }
      setCustomCategoryInput('');
      setShowCustomInput(false);
      setCategoryModalVisible(false);
      setSelectedCategory(null);
      setSearchQuery('');
    }
  };

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [currentStep]);

  const handleNext = async () => {
    // Clear previous errors
    setBusinessNameError(null);
    setOwnerNameError(null);
    setEmailError(null);
    setPhoneError(null);

    // Validate required fields for current step
    if (currentStep === 'business') {
      let hasError = false;

      // Required: Business Name, Owner Name
      if (!formData.businessName.trim()) {
        setBusinessNameError('Business Name is required');
        hasError = true;
      }
      if (!formData.ownerName.trim()) {
        setOwnerNameError('Owner Name is required');
        hasError = true;
      }

      if (hasError) return;

      // Validate GST and PAN if they are entered
      if (formData.gstNumber.trim() !== '') {
        const gstValidation = validateGST(formData.gstNumber);
        if (!gstValidation.isValid) {
          Alert.alert('Invalid GST Number', gstValidation.error || 'Please enter a valid GST number or leave it empty');
          return;
        }
      }

      if (formData.panNumber.trim() !== '') {
        const panValidation = validatePAN(formData.panNumber);
        if (!panValidation.isValid) {
          Alert.alert('Invalid PAN Number', panValidation.error || 'Please enter a valid PAN number or leave it empty');
          return;
        }
      }
    }

    if (currentStep === 'contact') {
      let hasError = false;

      // Required: Email, Phone Number
      if (!formData.email.trim()) {
        setEmailError('Email Address is required');
        hasError = true;
      } else {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setEmailError('Please enter a valid email address');
          hasError = true;
        }
      }

      if (!formData.phone.trim() || phoneNumbers.every(p => !p.trim())) {
        setPhoneError('At least one Phone Number is required');
        hasError = true;
      }

      if (hasError) return;
    }

    // Save current step progress before moving to next
    setLoading(true);
    const progressMap = {
      business: 25,
      category: 50,
      contact: 75,
      location: 100,
    };


    try {

      const nextStepMap = {
        business: 'category',
        category: 'contact',
        contact: 'location',
        location: 'location',
      };

      const promotionData: any = {
        ...formData,
        status: 'draft',
        progress: progressMap[currentStep],
        stepIndex: {
          business: 1,
          category: 2,
          contact: 3,
          location: 4,
        }[currentStep],
        currentStep: nextStepMap[currentStep],  // 👈 ADD THIS
        ...(promotionId && { promotionId }),
      };

      if (currentStep === 'business') {
        promotionData.businessHours = weeklySchedule;
      }

      const response = await api.post('/business-promotion', promotionData);

      if (response.promotion?._id) {
        setPromotionId(response.promotion._id);
      }

      // Move to next step
      if (currentStep === 'business') {
        setCurrentStep('category');
      } else if (currentStep === 'category') {
        setCurrentStep('contact');
      } else if (currentStep === 'contact') {
        setCurrentStep('location');
      }

      setLoading(false);
    } catch (error: any) {
      console.error('❌ Error saving progress:', error);
      setLoading(false);

      // Still allow navigation even if save fails
      if (currentStep === 'business') {
        setCurrentStep('category');
      } else if (currentStep === 'category') {
        setCurrentStep('contact');
      } else if (currentStep === 'contact') {
        setCurrentStep('location');
      }
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

  const handleSubmit = async () => {
    // Clear previous errors
    setPincodeError(null);
    setLocalityError(null);
    setStreetError(null);
    setCityError(null);
    setStateError(null);

    // Validate all required fields for location step
    let hasError = false;

    if (!formData.pincode.trim()) {
      setPincodeError('Pincode is required');
      hasError = true;
    }
    if (!formData.buildingName.trim()) {
      setLocalityError('Business Locality is required');
      hasError = true;
    }
    if (!formData.streetName.trim()) {
      setStreetError('Street / Road Name is required');
      hasError = true;
    }
    if (!formData.city.trim()) {
      setCityError('City is required');
      hasError = true;
    }
    if (!formData.state.trim()) {
      setStateError('State is required');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);

    try {
      console.log('📝 [BUSINESS-PROMOTION] Saving form data:', formData);

      const progressMap = {
        business: 25,
        category: 50,
        contact: 75,
        location: 100,
      };


      // Prepare data for backend
      const promotionData: any = {
        ...formData,
        status: currentStep === 'location' ? 'submitted' : 'draft',
        progress: progressMap[currentStep],
        stepIndex: {
          business: 1,
          category: 2,
          contact: 3,
          location: 4,
        }[currentStep],
        ...(promotionId && { promotionId }), // Include promotionId if updating
      };
      if (currentStep === 'business') {
        promotionData.businessHours = weeklySchedule;
      }

      // Call API to save/update promotion
      const response = await api.post('/business-promotion', promotionData);

      console.log('✅ [BUSINESS-PROMOTION] Form saved successfully:', response);

      // Store promotion ID for future updates
      const finalPromotionId = response.promotion?._id || promotionId;
      if (!finalPromotionId) {
        throw new Error('Promotion ID is missing');
      }
      setPromotionId(finalPromotionId);


      // If completed all steps, navigate to pricing
      if (currentStep === 'location') {
        if (listingType === 'FREE') {
          // 1️⃣ Activate free
          await api.post(`/business-promotion/${finalPromotionId}/activate-free`);

          // 2️⃣ Redirect to profile
          router.replace('/profile');
        } else {
          // PREMIUM → Pricing
          router.push({
            pathname: '/promotion-pricing',
            params: { promotionId: finalPromotionId }
          });
        }
      }


      setLoading(false);

    } catch (error: any) {
      console.error('❌ [BUSINESS-PROMOTION] Error saving form:', error);
      setLoading(false);

      Alert.alert(
        'Error',
        error?.message || 'Failed to save business promotion. Please try again.',
        [{ text: 'OK' }]
      );
    }
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
          onChangeText={(text) => {
            updateField('businessName', text);
            if (text.trim()) setBusinessNameError(null);
          }}
        />
        {businessNameError && (
          <Text style={styles.errorText}>{businessNameError}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Owner Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          placeholderTextColor="#999"
          value={formData.ownerName}
          onChangeText={(text) => {
            updateField('ownerName', text);
            if (text.trim()) setOwnerNameError(null);
          }}
        />
        {ownerNameError && (
          <Text style={styles.errorText}>{ownerNameError}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Hours</Text>
        <TouchableOpacity
          style={styles.businessHoursButton}
          onPress={() => setBusinessHoursModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={(() => {
            const openDays = Object.entries(weeklySchedule).filter(([_, hours]) => hours.open);
            return openDays.length > 0 ? styles.businessHoursTextFilled : styles.businessHoursText;
          })()}>
            {(() => {
              const openDays = Object.entries(weeklySchedule).filter(([_, hours]) => hours.open);
              if (openDays.length === 0) return 'Set business hours';
              if (openDays.length === 7) return 'Open 7 days a week';
              return `Open ${openDays.length} day${openDays.length > 1 ? 's' : ''} a week`;
            })()}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>
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
          style={[styles.input, gstError && styles.inputError]}
          placeholder="22AAAAA0000A1Z5"
          placeholderTextColor="#999"
          value={formData.gstNumber}
          onChangeText={handleGSTChange}
          autoCapitalize="characters"
          maxLength={15}
        />
        {gstError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{gstError}</Text>
          </View>
        )}
        <Text style={styles.helperText}>Format: 2 digits state code + 10 digit PAN + 3 characters</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PAN Number (Optional)</Text>
        <TextInput
          style={[styles.input, panError && styles.inputError]}
          placeholder="ABCDE1234F"
          placeholderTextColor="#999"
          value={formData.panNumber}
          onChangeText={handlePANChange}
          autoCapitalize="characters"
          maxLength={10}
        />
        {panError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{panError}</Text>
          </View>
        )}
        <Text style={styles.helperText}>Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)</Text>
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
          onChangeText={(text) => {
            updateField('email', text);
            if (text.trim()) setEmailError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {emailError && (
          <Text style={styles.errorText}>{emailError}</Text>
        )}
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
                onChangeText={(text) => {
                  updatePhoneNumber(index, text);
                  if (text.trim()) setPhoneError(null);
                }}
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
        {phoneError && (
          <Text style={styles.errorText}>{phoneError}</Text>
        )}
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
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#6B7280" style={styles.infoIcon} />
        <Text style={styles.infoText}>Provide the address that customers will use to find this business.</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Area</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter area"
          placeholderTextColor="#999"
          value={formData.area}
          onChangeText={(text) => updateField('area', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pincode *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter pincode"
          placeholderTextColor="#999"
          value={formData.pincode}
          onChangeText={(text) => {
            updateField('pincode', text);
            if (text.trim()) setPincodeError(null);
          }}
          keyboardType="number-pad"
          maxLength={6}
        />
        {pincodeError && (
          <Text style={styles.errorText}>{pincodeError}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Plot No. / Bldg No. / Wing / Shop No. / Floor</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Behram Baug, 605"
          placeholderTextColor="#999"
          value={formData.plotNo}
          onChangeText={(text) => updateField('plotNo', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Locality *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Range Heights"
          placeholderTextColor="#999"
          value={formData.buildingName}
          onChangeText={(text) => {
            updateField('buildingName', text);
            if (text.trim()) setLocalityError(null);
          }}
        />
        {localityError && (
          <Text style={styles.errorText}>{localityError}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Street / Road Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Behram Baug"
          placeholderTextColor="#999"
          value={formData.streetName}
          onChangeText={(text) => {
            updateField('streetName', text);
            if (text.trim()) setStreetError(null);
          }}
        />
        {streetError && (
          <Text style={styles.errorText}>{streetError}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Landmark</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Oshiwara"
          placeholderTextColor="#999"
          value={formData.landmark}
          onChangeText={(text) => updateField('landmark', text)}
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
            onChangeText={(text) => {
              updateField('city', text);
              if (text.trim()) setCityError(null);
            }}
          />
          {cityError && (
            <Text style={styles.errorText}>{cityError}</Text>
          )}
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            placeholder="State"
            placeholderTextColor="#999"
            value={formData.state}
            onChangeText={(text) => {
              updateField('state', text);
              if (text.trim()) setStateError(null);
            }}
          />
          {stateError && (
            <Text style={styles.errorText}>{stateError}</Text>
          )}
        </View>
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
            <View
              style={styles.stepItem}
            >
              <View style={[styles.stepCircle, currentStep === 'business' && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, currentStep === 'business' && styles.stepNumberActive]}>1</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 'business' && styles.stepLabelActive]}>Business</Text>
            </View>
            <View style={styles.stepLine} />
            <View
              style={styles.stepItem}
            >
              <View style={[styles.stepCircle, currentStep === 'category' && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, currentStep === 'category' && styles.stepNumberActive]}>2</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 'category' && styles.stepLabelActive]}>Category</Text>
            </View>
            <View style={styles.stepLine} />
            <View
              style={styles.stepItem}
            >
              <View style={[styles.stepCircle, currentStep === 'contact' && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, currentStep === 'contact' && styles.stepNumberActive]}>3</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 'contact' && styles.stepLabelActive]}>Contact</Text>
            </View>
            <View style={styles.stepLine} />
            <View
              style={styles.stepItem}
            >
              <View style={[styles.stepCircle, currentStep === 'location' && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, currentStep === 'location' && styles.stepNumberActive]}>4</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 'location' && styles.stepLabelActive]}>Location</Text>
            </View>
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
              disabled={loading}
            >
              <Text style={styles.buttonSecondaryText}>Back</Text>
            </TouchableOpacity>
          )}

          {currentStep !== 'location' ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, currentStep === 'business' && styles.buttonFull]}
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Save & Continue</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Save & Continue</Text>
              )}
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
          setShowCustomInput(false);
          setCustomCategoryInput('');
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
                    setShowCustomInput(false);
                    setCustomCategoryInput('');
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
                  setShowCustomInput(false);
                  setCustomCategoryInput('');
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

            {/* Add Custom Category Button */}
            {!showCustomInput && (
              <TouchableOpacity
                style={styles.addCustomButton}
                onPress={() => setShowCustomInput(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={22} color="#2563EB" />
                <Text style={styles.addCustomButtonText}>
                  {selectedCategory ? 'Add Custom Subcategory' : 'Add Custom Category'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Custom Input Field */}
            {showCustomInput && (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customInput}
                  placeholder={selectedCategory ? 'Enter custom subcategory name' : 'Enter custom category name'}
                  placeholderTextColor="#9CA3AF"
                  value={customCategoryInput}
                  onChangeText={setCustomCategoryInput}
                  autoFocus
                />
                <View style={styles.customInputButtons}>
                  <TouchableOpacity
                    style={styles.customInputCancelButton}
                    onPress={() => {
                      setShowCustomInput(false);
                      setCustomCategoryInput('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.customInputCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.customInputAddButton,
                      !customCategoryInput.trim() && styles.customInputAddButtonDisabled
                    ]}
                    onPress={handleAddCustomCategory}
                    disabled={!customCategoryInput.trim()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.customInputAddText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

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

      {/* Business Hours Modal */}
      <Modal
        visible={businessHoursModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBusinessHoursModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Business Hours</Text>
              <TouchableOpacity
                onPress={() => setBusinessHoursModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.businessHoursScrollView}>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <View key={day} style={styles.scheduleRow}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayName}>{day}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setWeeklySchedule(prev => ({
                          ...prev,
                          [day]: { ...prev[day], open: !prev[day].open }
                        }));
                      }}
                      style={styles.toggleContainer}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.toggleSwitch,
                        weeklySchedule[day].open && styles.toggleSwitchActive
                      ]}>
                        <View style={[
                          styles.toggleThumb,
                          weeklySchedule[day].open && styles.toggleThumbActive
                        ]} />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {weeklySchedule[day].open ? (
                    <View style={styles.timePickersContainer}>
                      <View style={styles.timePickerGroup}>
                        <Text style={styles.timeLabel}>Opens at</Text>
                        <TouchableOpacity
                          style={styles.timeButton}
                          onPress={() => {
                            setTimePickerDay(day);
                            setTimePickerMode('open');
                            setTimePickerVisible(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.timeButtonText}>
                            {(() => {
                              const time = weeklySchedule[day].openTime;
                              const [hours] = time.split(':');
                              const hour = parseInt(hours);
                              const isPM = hour >= 12;
                              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                              return `${displayHour} ${isPM ? 'PM' : 'AM'}`;
                            })()}
                          </Text>
                          <Ionicons name="chevron-down" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.timePickerGroup}>
                        <Text style={styles.timeLabel}>Closes at</Text>
                        <TouchableOpacity
                          style={styles.timeButton}
                          onPress={() => {
                            setTimePickerDay(day);
                            setTimePickerMode('close');
                            setTimePickerVisible(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.timeButtonText}>
                            {(() => {
                              const time = weeklySchedule[day].closeTime;
                              const [hours] = time.split(':');
                              const hour = parseInt(hours);
                              const isPM = hour >= 12;
                              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                              return `${displayHour} ${isPM ? 'PM' : 'AM'}`;
                            })()}
                          </Text>
                          <Ionicons name="chevron-down" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.closedText}>Closed</Text>
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setBusinessHoursModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={timePickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.timePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {timePickerMode === 'open' ? 'Opens at' : 'Closes at'}
              </Text>
              <TouchableOpacity
                onPress={() => setTimePickerVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TIME_OPTIONS}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => {
                if (typeof item === 'string') {
                  // "24 hours" option
                  return (
                    <TouchableOpacity
                      style={styles.timeOption}
                      onPress={() => {
                        setWeeklySchedule(prev => ({
                          ...prev,
                          [timePickerDay]: {
                            ...prev[timePickerDay],
                            openTime: '00:00',
                            closeTime: '23:59'
                          }
                        }));
                        setTimePickerVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timeOptionText}>{item}</Text>
                    </TouchableOpacity>
                  );
                } else {
                  return (
                    <TouchableOpacity
                      style={styles.timeOption}
                      onPress={() => {
                        setWeeklySchedule(prev => ({
                          ...prev,
                          [timePickerDay]: {
                            ...prev[timePickerDay],
                            [timePickerMode === 'open' ? 'openTime' : 'closeTime']: item.value
                          }
                        }));
                        setTimePickerVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timeOptionText}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                }
              }}
              style={styles.timeOptionsList}
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
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontStyle: 'italic',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  addCustomButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 8,
  },
  customInputContainer: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  customInputButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  customInputCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  customInputCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  customInputAddButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  customInputAddButtonDisabled: {
    backgroundColor: '#BFDBFE',
    opacity: 0.6,
  },
  customInputAddText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  businessHoursButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  businessHoursText: {
    fontSize: 15,
    color: '#9CA3AF',
    flex: 1,
  },
  businessHoursTextFilled: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  businessHoursScrollView: {
    maxHeight: 450,
    paddingHorizontal: 20,
  },
  scheduleRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  toggleContainer: {
    padding: 4,
  },
  toggleSwitch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#3B82F6',
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  timePickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 16,
  },
  timePickerGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  timeButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 15,
    color: '#6B7280',
  },
  closedText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingLeft: 8,
  },
  timePickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '70%',
    width: '100%',
  },
  timeOptionsList: {
    paddingHorizontal: 20,
  },
  timeOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  doneButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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