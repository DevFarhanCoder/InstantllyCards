import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, TextInput, Alert, ActivityIndicator, Modal, Image, BackHandler, FlatList } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { searchPostalCodes as searchLocalPostalCodes } from '@/constants/postalCodes';
import { useRouter } from "expo-router";
import { getCurrentUser } from '@/lib/useUser';

const { width } = Dimensions.get("window");

// Format number with Indian number system (lakhs, crores)
const formatIndianNumber = (num: number): string => {
  const numStr = num.toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  if (otherNumbers !== '') {
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }
  return lastThree;
};

export default function AdsWithoutChannel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "status">("create");
  const scrollViewRef = useRef<ScrollView>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>('');
  const [pinCodeSuggestions, setPinCodeSuggestions] = useState<Array<{postalCode: string, displayName: string}>>([]);
  const [showPinSuggestions, setShowPinSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewAd, setPreviewAd] = useState<any>(null);

  // Load user's phone number and location on mount
  useEffect(() => {
    loadUserPhone();
    getCurrentLocation();
  }, []);

  // Fetch ads when userPhoneNumber is loaded and status tab is active
  useEffect(() => {
    if (activeTab === 'status' && userPhoneNumber) {
      fetchAds();
    }
  }, [userPhoneNumber, activeTab]);

  // Handle Android back button when menu is open
  useEffect(() => {
    const backAction = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [openMenuId]);

  const loadUserPhone = async () => {
    try {
      // First try to get from user profile
      const user = await getCurrentUser();
      if (user?.phone) {
        console.log('✅ Loaded phone from user profile:', user.phone);
        setUserPhoneNumber(user.phone);
        return;
      }

      // Fallback to AsyncStorage (for backward compatibility)
      const savedPhone = await AsyncStorage.getItem('userPhoneNumber');
      if (savedPhone) {
        console.log('✅ Loaded phone from AsyncStorage:', savedPhone);
        setUserPhoneNumber(savedPhone);
      } else {
        console.log('⚠️ No phone number found. User needs to create an ad first or login.');
      }
    } catch (error) {
      console.error('❌ Failed to load user phone:', error);
    }
  };

  const saveUserPhone = async (phone: string) => {
    try {
      const formattedPhone = phone.startsWith('+91') ? phone : '+91' + phone;
      await AsyncStorage.setItem('userPhoneNumber', formattedPhone);
      setUserPhoneNumber(formattedPhone);
    } catch (error) {
      console.error('Failed to save user phone:', error);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    bottomImage: '',
    fullscreenImage: '',
    phoneNumber: '',
    pinCode: '',
    startDate: '',
    endDate: '',
    priority: 5,
  });

  const changeTab = (tab: "create" | "status") => {
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({ x: tab === "create" ? 0 : width, animated: true });
    
    // Fetch ads when switching to status tab
    if (tab === "status") {
      fetchAds();
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (offsetX >= width / 2) {
      setActiveTab("status");
      fetchAds();
    } else {
      setActiveTab("create");
    }
  };

  const fetchAds = async () => {
    if (!userPhoneNumber) {
      console.log('⏳ Waiting for phone number to load...');
      return;
    }

    setLoadingAds(true);
    try {
      console.log(`📱 Fetching ads for phone: ${userPhoneNumber}`);
      
      // Try the new my-ads endpoint first
      let response = await fetch(
        `http://192.168.0.102:8080/api/ads/my-ads?phoneNumber=${encodeURIComponent(userPhoneNumber)}`
      );
      
      // If my-ads endpoint not available yet (400/404), fallback to fetching all and filtering
      if (!response.ok) {
        console.log('⚠️ my-ads endpoint not ready, using fallback method');
        
        // Fetch all ads with admin token and filter client-side
        response = await fetch('http://192.168.0.102:8080/api/ads?approvalStatus=all', {
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDVjNDlmMGVhNjllMTczMWE4YmU1MCIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjMxODEwMDgsImV4cCI6MTc2Mzc4NTgwOH0.EurOhS259RX5pIuN9ldguLe1Xoy11FOjKedkSaz6pfM',
          },
        });
      }
      
      const data = await response.json();
      if (response.ok) {
        let allAds = data.data || [];
        
        // Filter to show only this user's ads if we used the fallback method
        if (data.pagination) {
          // This means we got all ads, need to filter
          allAds = allAds.filter((ad: any) => ad.phoneNumber === userPhoneNumber);
        }
        
        setAds(allAds);
        console.log(`✅ Loaded ${allAds.length} ads for status tab`);
      } else {
        console.error('❌ Failed to fetch ads:', data.message);
        Alert.alert('Error', data.message || 'Failed to load your ads');
      }
    } catch (error) {
      console.error('❌ Network error fetching ads:', error);
      Alert.alert('Error', 'Failed to load your ads. Please check your internet connection.');
    } finally {
      setLoadingAds(false);
    }
  };

  const handleDeleteClick = (adId: string) => {
    setAdToDelete(adId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!adToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`http://192.168.0.102:8080/api/ads/${adToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDVjNDlmMGVhNjllMTczMWE4YmU1MCIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjMxODEwMDgsImV4cCI6MTc2Mzc4NTgwOH0.EurOhS259RX5pIuN9ldguLe1Xoy11FOjKedkSaz6pfM',
        },
      });

      if (response.ok) {
        // Refresh ads list
        fetchAds();
        setShowDeleteModal(false);
        setAdToDelete(null);
        Alert.alert('Success', 'Advertisement deleted successfully');
      } else {
        Alert.alert('Error', 'Failed to delete advertisement');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete advertisement');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setAdToDelete(null);
  };

  const handleEdit = (ad: any) => {
    // Populate form with ad data
    setFormData({
      title: ad.title,
      bottomImage: ad.bottomImage ? ad.bottomImage.replace('https://instantlly-cards-backend-6ki0.onrender.com', 'http://192.168.0.102:8080') : '',
      fullscreenImage: ad.fullscreenImage ? ad.fullscreenImage.replace('https://instantlly-cards-backend-6ki0.onrender.com', 'http://192.168.0.102:8080') : '',
      phoneNumber: ad.phoneNumber,
      pinCode: ad.pinCode || '',
      startDate: ad.startDate,
      endDate: ad.endDate,
      priority: ad.priority || 5,
    });
    setEditingAdId(ad._id);
    setShowForm(true);
    // Switch to Create tab
    changeTab('create');
  };

  const pickImage = async (type: 'bottom' | 'fullscreen') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'bottom' ? [624, 174] : [624, 1000],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (type === 'bottom') {
        setFormData({ ...formData, bottomImage: base64Image });
      } else {
        setFormData({ ...formData, fullscreenImage: base64Image });
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.bottomImage || !formData.phoneNumber || !formData.startDate || !formData.endDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Save user's phone number for filtering
      await saveUserPhone(formData.phoneNumber);

      // Format phone number
      const phoneNumber = formData.phoneNumber.startsWith('+91') 
        ? formData.phoneNumber 
        : '+91' + formData.phoneNumber;

      // For EDITING existing ads, use the old admin endpoint
      if (editingAdId) {
        const submitData: any = {
          ...formData,
          phoneNumber,
        };

        const response = await fetch(
          `http://192.168.0.102:8080/api/ads/${editingAdId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDVjNDlmMGVhNjllMTczMWE4YmU1MCIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjMxODEwMDgsImV4cCI6MTc2Mzc4NTgwOH0.EurOhS259RX5pIuN9ldguLe1Xoy11FOjKedkSaz6pfM',
            },
            body: JSON.stringify(submitData),
          }
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        const data = await response.json();

        if (response.ok) {
          setShowSuccessModal(true);
          setTimeout(() => {
            setFormData({
              title: '',
              bottomImage: '',
              fullscreenImage: '',
              phoneNumber: '',
              pinCode: '',
              startDate: '',
              endDate: '',
              priority: 5,
            });
            setShowForm(false);
            setUploadProgress(0);
            setEditingAdId(null);
            fetchAds();
          }, 2000);
        } else {
          console.error(`❌ Failed to update ad:`, data);
          Alert.alert('Error', data.message || 'Failed to update advertisement');
          setUploadProgress(0);
        }
      } else {
        // For NEW ads, use the regular /api/ads endpoint WITHOUT admin token
        // This will create ads with 'pending' status that require admin approval
        
        const submitData: any = {
          ...formData,
          phoneNumber,
          uploaderName: 'Mobile User',
        };

        const response = await fetch(
          'http://192.168.0.102:8080/api/ads',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // NO Authorization header - this makes it a mobile user upload (pending status)
            },
            body: JSON.stringify(submitData),
          }
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        const data = await response.json();

        console.log(`📤 Mobile App - New Ad Creation Response:`, data);

        if (response.ok) {
          // Show success modal
          setShowSuccessModal(true);
          
          // Reset form after a delay
          setTimeout(() => {
            setFormData({
              title: '',
              bottomImage: '',
              fullscreenImage: '',
              phoneNumber: '',
              pinCode: '',
              startDate: '',
              endDate: '',
              priority: 5,
            });
            setShowForm(false);
            setUploadProgress(0);
            setEditingAdId(null);
            // Refresh ads list
            fetchAds();
          }, 2000);
        } else {
          console.error(`❌ Failed to create ad:`, data);
          Alert.alert('Error', data.message || 'Failed to create advertisement');
          setUploadProgress(0);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to ${editingAdId ? 'update' : 'create'} advertisement`);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      bottomImage: '',
      fullscreenImage: '',
      phoneNumber: '',
      pinCode: '',
      startDate: '',
      endDate: '',
      priority: 5,
    });
    setShowForm(false);
    setEditingAdId(null);
  };

  const openDatePicker = (type: 'start' | 'end') => {
    setShowDatePicker(type);
  };

  const confirmDate = (dateString: string) => {
    if (showDatePicker === 'start') {
      setFormData({ ...formData, startDate: dateString });
    } else if (showDatePicker === 'end') {
      setFormData({ ...formData, endDate: dateString });
    }
    setShowDatePicker(null);
  };

  // Get user's current location for better postal code suggestions
  const getCurrentLocation = async () => {
    try {
      console.log('📍 Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('⚠️ Location permission denied');
        return;
      }

      console.log('📍 Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      console.log('✅ User location obtained:', location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.log('❌ Error getting location:', error);
    }
  };

  // OpenStreetMap Nominatim API - FREE worldwide postal code search (No API key needed!)
  const searchPostalCodes = async (query: string) => {
    console.log('🔍 Nominatim API called with query:', query);
    
    if (query.length < 3) {
      console.log('❌ Query too short (minimum 3 characters)');
      setPinCodeSuggestions([]);
      setShowPinSuggestions(false);
      return;
    }

    try {
      // OpenStreetMap Nominatim - FREE, no API key required!
      // Use postalcode parameter for better postal code-specific results
      // Add viewbox based on user location to prioritize nearby results
      let url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(query)}&format=json&limit=15&addressdetails=1&dedupe=0`;
      
      // If user location is available, add it to prioritize nearby results
      if (userLocation) {
        // Create a bounding box around user's location (approx 200km radius)
        const latDelta = 2; // roughly 200km
        const lonDelta = 2;
        const viewbox = [
          userLocation.longitude - lonDelta,
          userLocation.latitude + latDelta,
          userLocation.longitude + lonDelta,
          userLocation.latitude - latDelta
        ].join(',');
        
        url += `&viewbox=${viewbox}&bounded=0`;
        console.log('📍 Using user location for prioritized search');
      }
      
      console.log('📡 Fetching from OpenStreetMap Nominatim...');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'InstantllyCards/1.0 (Contact: your@email.com)' // Required by Nominatim
        }
      });
      const data = await response.json();
      
      console.log('📦 Nominatim Response count:', data.length);
      console.log('📦 Raw data sample:', data.slice(0, 2));

      if (data && data.length > 0) {
        const suggestions = data.map((item: any) => {
          console.log('🏘️ Full address details:', JSON.stringify(item.address, null, 2));
          console.log('📍 Display name:', item.display_name);
          
          // Extract all possible location details from Nominatim response
          const addr = item.address || {};
          const postcode = addr.postcode || addr.postal_code || '';
          const road = addr.road || '';
          const suburb = addr.suburb || '';
          const neighbourhood = addr.neighbourhood || '';
          const quarter = addr.quarter || '';
          const district = addr.district || '';
          const borough = addr.borough || '';
          const county = addr.county || '';
          const town = addr.town || '';
          const village = addr.village || '';
          const hamlet = addr.hamlet || '';
          const city = addr.city || '';
          const municipality = addr.municipality || '';
          const city_district = addr.city_district || '';
          const state = addr.state || addr.province || addr.region || addr.state_district || '';
          const country = addr.country || '';
          const country_code = addr.country_code?.toUpperCase() || '';
          
          // Build comprehensive display name with hierarchical location details
          let displayParts = [];
          
          // 1. Postal code (always first if available)
          if (postcode) displayParts.push(postcode);
          
          // 2. Most specific location (road/neighbourhood/quarter)
          if (road) displayParts.push(road);
          if (neighbourhood && neighbourhood !== road) displayParts.push(neighbourhood);
          if (quarter && quarter !== neighbourhood && quarter !== road) displayParts.push(quarter);
          
          // 3. Suburb/Borough level
          if (suburb && !displayParts.includes(suburb)) displayParts.push(suburb);
          if (borough && borough !== suburb && !displayParts.includes(borough)) displayParts.push(borough);
          
          // 4. Village/Hamlet (small settlements)
          if (hamlet && !displayParts.includes(hamlet)) displayParts.push(hamlet);
          if (village && village !== hamlet && !displayParts.includes(village)) displayParts.push(village);
          
          // 5. Town level
          if (town && town !== village && !displayParts.includes(town)) displayParts.push(town);
          
          // 6. City level
          if (city && city !== town && !displayParts.includes(city)) displayParts.push(city);
          if (municipality && municipality !== city && municipality !== town && !displayParts.includes(municipality)) {
            displayParts.push(municipality);
          }
          if (city_district && city_district !== city && !displayParts.includes(city_district)) {
            displayParts.push(city_district);
          }
          
          // 7. District/County level
          if (district && !displayParts.includes(district)) displayParts.push(district);
          if (county && county !== district && !displayParts.includes(county)) displayParts.push(county);
          
          // 8. State level
          if (state && !displayParts.some(part => part === state)) displayParts.push(state);
          
          // 9. Country (always last)
          if (country) displayParts.push(country);
          
          // Build display name with fallback to ensure it's never empty
          let displayName = displayParts.length > 0 ? displayParts.join(', ') : item.display_name;
          
          // Fallback if display name is still empty or just whitespace
          if (!displayName || displayName.trim() === '') {
            displayName = item.display_name || `${postcode || 'Unknown Location'}`;
          }
          
          // For postal code value, prefer actual postcode
          const codeValue = postcode || displayParts[0] || item.display_name.split(',')[0];

          console.log('✨ Final display:', displayName);
          console.log('✨ Code value:', codeValue);

          return {
            postalCode: codeValue,
            displayName: displayName,
            lat: item.lat,
            lon: item.lon,
            country_code: country_code, // Add country code to help distinguish
          };
        });

        console.log('✅ Formatted suggestions count:', suggestions.length);
        console.log('✅ Suggestions:', suggestions.map((s: any) => s.displayName));
        setPinCodeSuggestions(suggestions);
        setShowPinSuggestions(true);
      } else {
        console.log('⚠️ No results from Nominatim, trying local database...');
        // Fallback to local database
        const results = searchLocalPostalCodes(query);
        if (results.length > 0) {
          const suggestions = results.map((item: any) => {
            const displayParts = [item.code];
            if (item.area) displayParts.push(item.area);
            displayParts.push(item.city, item.state, item.country);
            return {
              postalCode: item.code,
              displayName: displayParts.join(', '),
            };
          });
          setPinCodeSuggestions(suggestions);
          setShowPinSuggestions(true);
        } else {
          setPinCodeSuggestions([]);
          setShowPinSuggestions(true); // Show "no results" message
        }
      }
    } catch (error) {
      console.error('❌ Nominatim API Error:', error);
      // Fallback to local database on error
      console.log('⚠️ Falling back to local database...');
      const results = searchLocalPostalCodes(query);
      if (results.length > 0) {
        const suggestions = results.map((item: any) => {
          const displayParts = [item.code];
          if (item.area) displayParts.push(item.area);
          displayParts.push(item.city, item.state, item.country);
          return {
            postalCode: item.code,
            displayName: displayParts.join(', '),
          };
        });
        setPinCodeSuggestions(suggestions);
        setShowPinSuggestions(true);
      } else {
        setPinCodeSuggestions([]);
        setShowPinSuggestions(false);
      }
    }
  };

  // Debounce postal code search - 500ms to reduce API calls and save costs
  useEffect(() => {
    console.log('⏱️ useEffect triggered, pinCode:', formData.pinCode);
    const timer = setTimeout(() => {
      if (formData.pinCode && formData.pinCode.length >= 3) {
        console.log('✅ Calling Google Places API with:', formData.pinCode);
        searchPostalCodes(formData.pinCode);
      } else {
        console.log('❌ Clearing suggestions, length:', formData.pinCode?.length);
        setPinCodeSuggestions([]);
        setShowPinSuggestions(false);
      }
    }, 500); // 500ms debounce - saves API costs by reducing requests

    return () => clearTimeout(timer);
  }, [formData.pinCode]);

  const selectPinCode = (postalCode: string, displayName: string) => {
    console.log('🎯 selectPinCode called with:', { postalCode, displayName });
    setFormData({ ...formData, pinCode: postalCode });
    setSelectedLocation(displayName);
    setShowPinSuggestions(false);
    setPinCodeSuggestions([]);
    console.log('✅ Selected location set to:', displayName);
  };

  const renderDatePicker = () => {
    const currentDate = showDatePicker === 'start' ? formData.startDate : formData.endDate;
    const markedDate = currentDate ? { [currentDate]: { selected: true, selectedColor: '#2563EB' } } : {};

    return (
      <Modal
        visible={showDatePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>
                Select {showDatePicker === 'start' ? 'Start' : 'End'} Date
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                <Text style={styles.datePickerClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Calendar
              current={currentDate || undefined}
              markedDates={markedDate}
              onDayPress={(day) => {
                confirmDate(day.dateString);
              }}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#374151',
                selectedDayBackgroundColor: '#2563EB',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#2563EB',
                dayTextColor: '#111827',
                textDisabledColor: '#D1D5DB',
                dotColor: '#2563EB',
                selectedDotColor: '#ffffff',
                arrowColor: '#2563EB',
                monthTextColor: '#111827',
                indicatorColor: '#2563EB',
                textDayFontFamily: 'System',
                textMonthFontFamily: 'System',
                textDayHeaderFontFamily: 'System',
                textDayFontWeight: '400',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 14,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 12,
              }}
              style={styles.calendar}
            />

            <View style={styles.datePickerActions}>
              <TouchableOpacity 
                style={styles.datePickerCancelBtn}
                onPress={() => setShowDatePicker(null)}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {renderDatePicker()}
      
      {/* Credit Display - only show when form is not open */}
      {!showForm && (
        <View style={styles.creditDisplayContainer}>
          <Text style={styles.creditLabel}>Total Credits</Text>
          <View style={styles.creditRow}>
           <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.creditAmount}>{formatIndianNumber(500000)}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("../src/routes/credits")}>
            <Text style={styles.noSpendingLimit}>See Transaction  &gt;</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "create" && styles.activeTab]}
          onPress={() => changeTab("create")}
        >
          <Text style={[styles.tabText, activeTab === "create" && styles.activeTabText, styles.uploadTabText]}>
            Upload Ads
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "status" && styles.activeTab]}
          onPress={() => changeTab("status")}
        >
          <Text style={[styles.tabText, activeTab === "status" && styles.activeTabText]}>
            Status
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        <View style={[styles.page, { width }]}>
          {!showForm ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Upload New Advertisement</Text>
              <Text style={styles.emptyStateText}>Click the button below to upload a new advertisement for your business</Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => setShowForm(true)}
              >
                <View style={styles.createButtonContent}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.buttonIcon}>📄</Text>
                  </View>
                  <Text style={styles.createButtonText}>Upload New Ads</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
          <ScrollView 
            style={styles.formContainer}
            scrollEnabled={!showPinSuggestions}
            nestedScrollEnabled={true}
          >
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{editingAdId ? 'Edit Advertisement' : 'Upload New Advertisement'}</Text>
            </View>

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Advertisement Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="e.g., Summer Sale 2024"
                placeholderTextColor="#999"
              />
            </View>

            {/* Bottom Image */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📱 Bottom Banner Image (Required)</Text>
              <Text style={styles.sectionDescription}>
                This image appears in the bottom carousel. Recommended size: <Text style={styles.bold}>624 × 174 pixels</Text>
              </Text>
              <TouchableOpacity style={styles.fileButton} onPress={() => pickImage('bottom')}>
                <Text style={styles.fileButtonText}>
                  {formData.bottomImage ? '✓ Image Selected' : 'Choose File'}
                </Text>
              </TouchableOpacity>
              {formData.bottomImage && (
                <View style={styles.preview}>
                  <Text style={styles.previewLabel}>Preview:</Text>
                  <Image 
                    source={{ uri: formData.bottomImage }} 
                    style={styles.previewImageActual}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>

            {/* Fullscreen Image */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🖼️ Fullscreen Image (Optional)</Text>
              <Text style={styles.sectionDescription}>
                This image appears when user taps the bottom banner. Recommended size: <Text style={styles.bold}>624 × 1000 pixels</Text>
              </Text>
              <Text style={styles.helperText}>💡 If not provided, users will see Call/Message/Cancel buttons when they tap the banner.</Text>
              <TouchableOpacity style={styles.fileButton} onPress={() => pickImage('fullscreen')}>
                <Text style={styles.fileButtonText}>
                  {formData.fullscreenImage ? '✓ Image Selected' : 'Choose File'}
                </Text>
              </TouchableOpacity>
              {formData.fullscreenImage && (
                <View style={styles.preview}>
                  <Text style={styles.previewLabel}>Preview:</Text>
                  <Image 
                    source={{ uri: formData.fullscreenImage }} 
                    style={styles.previewImageFullscreen}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>

            {/* Phone Number */}
            <View style={styles.section}>
              <Text style={styles.label}>📞 Phone Number (for Call/Message buttons)</Text>
              <TextInput
                style={styles.input}
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                placeholder="+919876543210"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
              <Text style={styles.smallHelperText}>Used for Call/Message buttons in the mobile app</Text>
            </View>

            {/* Pin Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>📍 Enter Pin code</Text>
              <View style={styles.pinCodeContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.pinCode}
                  onChangeText={(text) => {
                    setFormData({ ...formData, pinCode: text });
                    setSelectedLocation(''); // Clear selected location when user types
                  }}
                  placeholder="e.g., 400001"
                  placeholderTextColor="#999"
                  onFocus={() => {
                    if (formData.pinCode.length >= 2 && pinCodeSuggestions.length > 0) {
                      setShowPinSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow tap on suggestion
                    setTimeout(() => setShowPinSuggestions(false), 300);
                  }}
                />
                {showPinSuggestions && pinCodeSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <ScrollView
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="always"
                      scrollEventThrottle={16}
                      bounces={false}
                    >
                      {pinCodeSuggestions.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.suggestionItem,
                            index === pinCodeSuggestions.length - 1 && styles.suggestionItemLast
                          ]}
                          onPress={() => {
                            console.log('Selected:', item.postalCode, item.displayName);
                            selectPinCode(item.postalCode, item.displayName);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.suggestionCode}>{item.postalCode}</Text>
                          <Text style={styles.suggestionArea} numberOfLines={2}>{item.displayName}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {showPinSuggestions && pinCodeSuggestions.length === 0 && (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>❌ No postal codes found</Text>
        
                  </View>
                )}
              </View>
              {selectedLocation && selectedLocation.trim() !== '' ? (
                <View style={styles.selectedLocationContainer}>
                  <Text style={styles.selectedLocationLabel}>📍 Selected Location:</Text>
                  <Text style={styles.selectedLocationText}>{selectedLocation}</Text>
                </View>
              ) : formData.pinCode && formData.pinCode.trim() !== '' && pinCodeSuggestions.length > 0 && !showPinSuggestions ? (
                <View style={styles.selectedLocationContainer}>
                  <Text style={styles.selectedLocationLabel}>💡 Suggestion:</Text>
                  <Text style={styles.selectedLocationText}>{pinCodeSuggestions[0].displayName}</Text>
                  <TouchableOpacity 
                    onPress={() => selectPinCode(pinCodeSuggestions[0].postalCode, pinCodeSuggestions[0].displayName)}
                    style={{ marginTop: 8 }}
                  >
                    <Text style={[styles.smallHelperText, { color: '#2563EB', fontWeight: '600' }]}>
                      Tap here to select this location
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : formData.pinCode && formData.pinCode.trim() !== '' ? (
                <View style={styles.selectedLocationContainer}>
                  <Text style={styles.selectedLocationLabel}>ℹ️ Pin Code Entered:</Text>
                  <Text style={styles.selectedLocationText}>{formData.pinCode}</Text>
                  <Text style={styles.smallHelperText}>Type at least 3 characters to see suggestions</Text>
                </View>
              ) : (
                <Text style={styles.smallHelperText}>Enter postal code</Text>
              )}
            </View>

            {/* Schedule Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📅 Schedule</Text>
              <Text style={styles.sectionDescription}>
                Ad will automatically become active between these dates
              </Text>
              
              <View style={styles.dateRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.label}>Start Date</Text>
                  <TouchableOpacity onPress={() => openDatePicker('start')}>
                    <View style={styles.dateInputContainer}>
                      <Text style={[styles.dateInputText, !formData.startDate && styles.dateInputPlaceholder]}>
                        {formData.startDate || 'YYYY-MM-DD'}
                      </Text>
                      <Text style={styles.dateInputIcon}>📅</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.dateColumn}>
                  <Text style={styles.label}>End Date</Text>
                  <TouchableOpacity onPress={() => openDatePicker('end')}>
                    <View style={styles.dateInputContainer}>
                      <Text style={[styles.dateInputText, !formData.endDate && styles.dateInputPlaceholder]}>
                        {formData.endDate || 'YYYY-MM-DD'}
                      </Text>
                      <Text style={styles.dateInputIcon}>📅</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <View style={{ flex: 1 }}>
                {isSubmitting && uploadProgress > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Uploading...</Text>
                      <Text style={styles.progressPercent}>{uploadProgress}%</Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                      <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
                    </View>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Text style={styles.submitButtonText}>
                      {uploadProgress === 100 ? 'Uploading 100%' : `Uploading ${uploadProgress}%`}
                    </Text>
                  ) : (
                    <Text style={styles.submitButtonText}>{editingAdId ? 'Update Advertisement' : 'Create Advertisement'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
          )}
        </View>

        <View style={[styles.page, { width }]}>
          <ScrollView style={styles.statusContainer}>
            {loadingAds ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Loading ads...</Text>
              </View>
            ) : ads.length === 0 ? (
              <View style={styles.emptyStatusContainer}>
                <Text style={styles.emptyStatusIcon}>📢</Text>
                <Text style={styles.emptyStatusText}>You haven't created any ads</Text>
                <Text style={styles.emptyStatusSubtext}>Switch to the Create Ads tab to create your first advertisement!</Text>
              </View>
            ) : (
              <View style={styles.adsListContainer}>
                {ads.map((ad, index) => {
                  // Check approval status
                  const approvalStatus = ad.approvalStatus || ad.status || 'pending';
                  const isPendingApproval = approvalStatus === 'pending' || approvalStatus === 'Pending';
                  const isRejectedApproval = approvalStatus === 'rejected' || approvalStatus === 'Rejected';
                  const isApprovedStatus = approvalStatus === 'approved' || approvalStatus === 'Approved';
                  
                  // Approval status text
                  let approvalText = 'Pending';
                  if (isApprovedStatus) approvalText = 'Approved';
                  else if (isRejectedApproval) approvalText = 'Rejected';
                  
                  // Date-based advertisement status (always calculate)
                  const now = new Date();
                  const start = new Date(ad.startDate);
                  const end = new Date(ad.endDate);
                  const isActive = now >= start && now <= end;
                  const isExpired = now > end;
                  const isScheduled = now < start;
                  
                  // Ad status text
                  let adStatusText = 'Scheduled';
                  if (isActive) adStatusText = 'Active';
                  else if (isExpired) adStatusText = 'Expired';
                  
                  return (
                    <View key={ad._id || index} style={styles.adCardWrapper}>
                      <View style={styles.adCard}>
                        <View style={styles.adCardContent}>
                          <View style={styles.cardRow}>
                            {/* Left: Status badge and title */}
                            <View style={styles.cardLeft}>
                              {/* Ad Status badge at top */}
                              <View style={[
                                styles.statusBadgeSimple,
                                isActive && styles.statusBadgeActiveNew,
                                isExpired && styles.statusBadgeExpiredNew,
                                isScheduled && styles.statusBadgeScheduledNew
                              ]}>
                                <View style={[
                                  styles.statusDot,
                                  isActive && styles.statusDotActive,
                                  isExpired && styles.statusDotExpired,
                                  isScheduled && styles.statusDotScheduled
                                ]} />
                                <Text style={[
                                  styles.statusBadgeText,
                                  isActive && styles.statusBadgeTextActive,
                                  isExpired && styles.statusBadgeTextExpired,
                                  isScheduled && styles.statusBadgeTextScheduled
                                ]}>
                                  {adStatusText}
                                </Text>
                              </View>
                              <Text style={styles.cardTitle} numberOfLines={1}>{ad.title}</Text>
                              <Text style={styles.cardSubtitle} numberOfLines={1}>{ad.phoneNumber}</Text>
                              <Text style={styles.cardSubtitle} numberOfLines={1}>
                                {new Date(ad.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(ad.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </Text>
                            </View>

                            {/* Right: View Image and Menu buttons */}
                            <View style={styles.cardActions}>
                              <TouchableOpacity 
                                style={styles.viewImageButton}
                                onPress={() => {
                                  console.log('Previewing Ad:', ad);
                                  if (ad.bottomImage) {
                                    console.log('Bottom Image Source:', ad.bottomImage);
                                  }
                                  if (ad.fullscreenImage) {
                                    console.log('Fullscreen Image Source:', ad.fullscreenImage);
                                  }
                                  setPreviewAd(ad);
                                  setShowImagePreview(true);
                                }}
                              >
                                <Ionicons name="eye-outline" size={18} color="#6B7280" />
                                <Text style={styles.viewImageText}>Image</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity 
                                style={styles.menuButtonCard}
                                onPress={() => setOpenMenuId(openMenuId === ad._id ? null : ad._id)}
                              >
                                <Text style={styles.menuDotsCard}>⋮</Text>
                              </TouchableOpacity>
                            </View>

                            {openMenuId === ad._id && (
                              <View style={styles.menuDropdownCard}>
                                <TouchableOpacity 
                                  style={styles.menuItem}
                                  onPress={() => {
                                    setOpenMenuId(null);
                                    handleEdit(ad);
                                  }}
                                >
                                  <Text style={styles.menuItemText}>Edit</Text>
                                </TouchableOpacity>
                                <View style={styles.menuDivider} />
                                <TouchableOpacity 
                                  style={styles.menuItem}
                                  onPress={() => {
                                    setOpenMenuId(null);
                                    handleDeleteClick(ad._id);
                                  }}
                                >
                                  <Text style={[styles.menuItemText, styles.menuItemTextDelete]}>Delete</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                          
                          {/* Admin Status - Bottom Right */}
                          <View style={styles.adminStatusContainer}>
                            <Text style={styles.adminStatusLabel}>Admin Status:</Text>
                            <View style={styles.adminStatusBadge}>
                              <Text style={styles.adminStatusIcon}>
                                {isPendingApproval && '⏳'}
                                {isApprovedStatus && '✔️'}
                                {isRejectedApproval && '❌'}
                              </Text>
                              <Text style={[
                                styles.adminStatusTextPlain,
                                isPendingApproval && styles.statusBadgeTextPending,
                                isApprovedStatus && styles.statusBadgeTextApproved,
                                isRejectedApproval && styles.statusBadgeTextRejected
                              ]}>
                                {approvalText}
                              </Text>
                            </View>
                          </View>
                          
                          {/* Rejection Reason - Show if rejected */}
                          {isRejectedApproval && ad.rejectionReason && (
                            <View style={styles.rejectionReasonContainer}>
                              <Text style={styles.rejectionReasonLabel}>Rejection Reason:</Text>
                              <Text style={styles.rejectionReasonText}>{ad.rejectionReason}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successCheckmarkCircle}>
              <Text style={styles.successCheckmark}>✓</Text>
            </View>
            <Text style={styles.successTitle}>
              {editingAdId 
                ? 'Advertisement updated successfully!' 
                : 'Advertisement submitted for approval!'}
            </Text>
            {!editingAdId && (
              <Text style={styles.successSubtext}>
                Your ad is pending admin approval. You can view its status in the Status tab.
              </Text>
            )}
            <TouchableOpacity 
              style={styles.successButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <View style={styles.imagePreviewOverlay}>
          <View style={styles.imagePreviewContent}>
            <View style={styles.imagePreviewHeader}>
              <Text style={styles.imagePreviewTitle}>Ad Images</Text>
              <TouchableOpacity 
                style={styles.imagePreviewCloseButton}
                onPress={() => setShowImagePreview(false)}
              >
                <Text style={styles.imagePreviewCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.imagePreviewScroll}>
              {previewAd?.bottomImage && (
                <View style={styles.imageSection}>
                  <Text style={styles.imageSectionLabel}>Bottom Banner (624×174)</Text>
                  <Image 
                    source={{ uri: previewAd.bottomImage ? previewAd.bottomImage.replace('https://instantlly-cards-backend-6ki0.onrender.com', 'http://192.168.0.102:8080') : '' }} 
                    style={styles.previewBottomImage}
                    resizeMode="contain"
                  />
                </View>
              )}
              {previewAd?.fullscreenImage && (
                <View style={styles.imageSection}>
                  <Text style={styles.imageSectionLabel}>Fullscreen Image (624×1000)</Text>
                  <Image 
                    source={{ uri: previewAd.fullscreenImage ? previewAd.fullscreenImage.replace('https://instantlly-cards-backend-6ki0.onrender.com', 'http://192.168.0.102:8080') : '' }} 
                    style={styles.previewFullscreenImage}
                    resizeMode="contain"
                  />
                </View>
              )}
              {!previewAd?.bottomImage && !previewAd?.fullscreenImage && (
                <View style={styles.noImagesContainer}>
                  <Text style={styles.noImagesText}>No images available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Ad?</Text>
            <Text style={styles.deleteModalText}>Are you sure you want to delete?</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={styles.deleteCancelButton}
                onPress={cancelDelete}
                disabled={isDeleting}
              >
                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteConfirmButton, isDeleting && styles.deleteConfirmButtonDisabled]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  creditDisplayContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  creditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  coinIcon: {
    fontSize: 28,
  },
  creditAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#10B981",
  },
  creditLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  noSpendingLimit: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "500",
  },
  adCardWrapper: {
    position: "relative",
    marginBottom: 0,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 16, color: "#777", fontWeight: "500" },
  uploadTabText: { marginLeft: -50 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#4F6AF3" },
  activeTabText: { color: "#4F6AF3", fontWeight: "600" },
  page: { flex: 1 },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  createButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonIcon: {
    fontSize: 14,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  inputGroup: {
    marginBottom: 24,
  },
  section: {
    paddingTop: 24,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
    lineHeight: 16,
  },
  smallHelperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  bold: {
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  phonePrefix: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    backgroundColor: "#F3F4F6",
    borderRightWidth: 1,
    borderRightColor: "#D1D5DB",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  fileButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  fileButtonText: {
    fontSize: 14,
    color: "#374151",
  },
  preview: {
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  previewImage: {
    height: 128,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImageActual: {
    height: 128,
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F3F4F6",
  },
  previewImageFullscreen: {
    height: 192,
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F3F4F6",
  },
  previewPlaceholder: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    gap: 16,
  },
  dateColumn: {
    flex: 1,
    position: "relative",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
    paddingRight: 40,
  },
  dateInputContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateInputText: {
    fontSize: 14,
    color: "#111827",
  },
  dateInputPlaceholder: {
    color: "#999",
  },
  dateInputIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  datePickerModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  datePickerClose: {
    fontSize: 24,
    color: "#6B7280",
    fontWeight: "400",
  },
  calendar: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  datePickerCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
  },
  datePickerCancelText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 24,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 200,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  statusContainer: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 0,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  emptyStatusContainer: {
    paddingVertical: 80,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyStatusIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStatusText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStatusSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  adsListContainer: {
    gap: 6,
  },
  adCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  adCardContent: {
    padding: 16,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
    marginBottom: 8,
  },
  statusBadgeSimple: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  statusBadgesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  menuButtonCard: {
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  menuDotsCard: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6B7280",
    lineHeight: 20,
  },
  menuDropdownCard: {
    position: "absolute",
    top: 45,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    minWidth: 130,
    zIndex: 1000,
  },
  headerSpacer: {
    flex: 1,
  },
  statusBadgeCompact: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeActiveNew: {
    backgroundColor: "#D1FAE5",
    borderWidth: 0,
  },
  statusBadgeExpiredNew: {
    backgroundColor: "#FECACA",
    borderWidth: 0,
  },
  statusBadgeScheduledNew: {
    backgroundColor: "#FEF3C7",
    borderWidth: 0,
  },
  statusBadgePendingNew: {
    backgroundColor: "#FED7AA",
    borderWidth: 0,
  },
  statusBadgeRejectedNew: {
    backgroundColor: "#FCA5A5",
    borderWidth: 0,
  },
  statusBadgeApprovedNew: {
    backgroundColor: "#BBF7D0",
    borderWidth: 0,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0,
  },
  statusBadgeTextActive: {
    color: "#059669",
  },
  statusBadgeTextExpired: {
    color: "#DC2626",
  },
  statusBadgeTextScheduled: {
    color: "#D97706",
  },
  statusBadgeTextPending: {
    color: "#EA580C",
  },
  statusBadgeTextRejected: {
    color: "#DC2626",
  },
  statusBadgeTextApproved: {
    color: "#16A34A",
  },
  statusDotActive: {
    backgroundColor: "#059669",
  },
  statusDotExpired: {
    backgroundColor: "#DC2626",
  },
  statusDotScheduled: {
    backgroundColor: "#D97706",
  },
  statusDotPending: {
    backgroundColor: "#EA580C",
  },
  statusDotRejected: {
    backgroundColor: "#DC2626",
  },
  statusDotApproved: {
    backgroundColor: "#16A34A",
  },
  menuButtonCompact: {
    padding: 4,
    backgroundColor: "#F9FAFB",
    borderRadius: 4,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  menuDotsCompact: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B7280",
    lineHeight: 16,
  },
  menuDropdownCompact: {
    position: "absolute",
    top: 35,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    minWidth: 130,
    zIndex: 1000,
  },
  adTitleClean: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 24,
    marginBottom: 12,
    letterSpacing: 0,
  },
  infoGrid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  infoIconText: {
    fontSize: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 20,
  },
  adHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  menuButtonInline: {
    padding: 3,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadgeInline: {
    flex: 1,
  },
  menuDropdownInline: {
    position: "absolute",
    top: 28,
    left: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 120,
    zIndex: 1000,
  },
  statusIconOnly: {
    position: "absolute",
    top: -10,
    right: -10,
    zIndex: 10,
  },
  statusIconBoxLarge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  statusIconTextLarge: {
    fontSize: 15,
    fontWeight: "bold",
  },
  statusTextBadge: {
    position: "absolute",
    top: 10,
    left: 42,
  },
  statusBadgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    overflow: "hidden",
  },
  statusBadgeLabelScheduled: {
    color: "#D97706",
    backgroundColor: "#FEF3C7",
  },
  statusBadgeLabelActive: {
    color: "#059669",
    backgroundColor: "#D1FAE5",
  },
  statusBadgeLabelExpired: {
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
  },
  adTitleMain: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
    marginTop: 0,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  adTitleWithStatus: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    lineHeight: 24,
  },
  adHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    gap: 7,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  statusIconBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIconBoxScheduled: {
    backgroundColor: "#FEF3C7",
  },
  statusIconBoxActive: {
    backgroundColor: "#D1FAE5",
  },
  statusIconBoxExpired: {
    backgroundColor: "#FEE2E2",
  },
  statusDotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    letterSpacing: 0.3,
  },
  statusBadgeCompactActive: {
    backgroundColor: "#D1FAE5",
  },
  statusBadgeCompactExpired: {
    backgroundColor: "#FEE2E2",
  },
  statusNotificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  statusNotificationDotActive: {
    backgroundColor: "#10B981",
  },
  statusNotificationDotExpired: {
    backgroundColor: "#EF4444",
  },
  adMetaSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  adMetaItem: {
    flex: 1,
  },
  adMetaLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  adMetaValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 16,
  },
  adMetaSeparator: {
    width: 1,
    height: 32,
    backgroundColor: "#E5E7EB",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
  },
  statusChipActive: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  statusChipExpired: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  statusChipScheduled: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusChipTextActive: {
    color: "#059669",
  },
  statusChipTextExpired: {
    color: "#DC2626",
  },
  statusChipTextScheduled: {
    color: "#2563EB",
  },
  scheduledBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  scheduledIcon: {
    fontSize: 14,
  },
  scheduledText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
  },
  adInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  adInfoLeft: {
    flex: 1,
    gap: 8,
  },
  adInfoRow: {
    gap: 4,
  },
  adInfoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  adInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  adInfoRight: {
    alignItems: "center",
  },
  scheduledBadgeNew: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    minWidth: 90,
  },
  scheduledIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  scheduledIconText: {
    fontSize: 18,
  },
  scheduledTextNew: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statusBadgeVertical: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 90,
  },
  statusBadgeVerticalActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  statusBadgeVerticalExpired: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  statusIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  statusDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusDotLargeActive: {
    backgroundColor: "#10B981",
  },
  statusDotLargeExpired: {
    backgroundColor: "#EF4444",
  },
  statusTextVertical: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statusTextVerticalActive: {
    color: "#059669",
  },
  statusTextVerticalExpired: {
    color: "#DC2626",
  },
  progressBarBackground: {
    width: "100%",
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 9999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 9999,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  menuButton: {
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  menuButtonTopLeft: {
    position: "absolute",
    top: 10,
    left: 10,
    padding: 2,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  menuDots: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6B7280",
    lineHeight: 20,
  },
  menuDotsVertical: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B7280",
    lineHeight: 16,
  },
  menuDropdown: {
    position: "absolute",
    top: 35,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 120,
    zIndex: 1000,
  },
  menuDropdownTopLeft: {
    position: "absolute",
    top: 10,
    left: 38,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 120,
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  menuItemTextDelete: {
    color: "#DC2626",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  statusBadgeNew: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActiveNew: {
    backgroundColor: "#D1FAE5",
  },
  statusExpiredNew: {
    backgroundColor: "#FEE2E2",
  },
  statusScheduledNew: {
    backgroundColor: "#DBEAFE",
  },
  statusTextNew: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: "#065F46",
  },
  statusTextExpired: {
    color: "#991B1B",
  },
  statusTextScheduled: {
    color: "#1E40AF",
  },
  adInfoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  adInfoContent: {
    flex: 1,
    justifyContent: "center",
  },
  dateArrow: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModalContent: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    minWidth: 320,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  successCheckmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successCheckmark: {
    fontSize: 48,
    color: "#10B981",
    fontWeight: "bold",
    textAlign: "center",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 26,
  },
  successSubtext: {
    fontSize: 14,
    color: "#D1D5DB",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  successButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 14,
    minWidth: 140,
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  deleteModalText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  deleteCancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  deleteCancelButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  deleteConfirmButtonDisabled: {
    opacity: 0.6,
  },
  deleteConfirmButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  pinCodeContainer: {
    position: "relative",
    zIndex: 1000,
    overflow: "visible",
  },
  searchingIndicator: {
    position: "absolute",
    right: 12,
    top: 12,
    zIndex: 10,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
    height: 400,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionCode: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  suggestionArea: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  selectedLocationContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  selectedLocationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 4,
  },
  selectedLocationText: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    margin: 8,
  },
  noResultsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsSubtext: {
    fontSize: 12,
    color: "#78350F",
    textAlign: "left",
    lineHeight: 18,
  },
  adThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#F3F4F6",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  infoButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  viewImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  viewImageText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewContent: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  imagePreviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  imagePreviewCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreviewCloseText: {
    fontSize: 20,
    color: "#6B7280",
    fontWeight: "700",
  },
  imagePreviewScroll: {
    maxHeight: 600,
  },
  imageSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  imageSectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  previewBottomImage: {
    width: "100%",
    height: 174,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  previewFullscreenImage: {
    width: "100%",
    height: 400,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  noImagesContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noImagesText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  adminStatusContainer: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  adminStatusLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  adminStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rejectionReasonContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 6,
  },
  rejectionReasonLabel: {
    fontSize: 11,
    color: "#991B1B",
    fontWeight: "700",
    marginBottom: 4,
  },
  rejectionReasonText: {
    fontSize: 12,
    color: "#DC2626",
    lineHeight: 16,
  },
  adminStatusIcon: {
    fontSize: 12,
  },
  adminStatusTextPlain: {
    fontSize: 12,
    fontWeight: "600",
  },
});
