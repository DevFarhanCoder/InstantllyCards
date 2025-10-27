import React, { useState, useRef, useEffect } from 'react';
import { View, Image, Dimensions, StyleSheet, ScrollView, Animated, TouchableOpacity, Modal, Text, Linking, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '@/lib/api';
import { ensureAuth } from '@/lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

// Ad data with phone numbers
const ads = [
  // Rajesh Modi - 9867477227 (10 ads)
  { id: 1, image: require('../assets/images/Footer Ads_02-05.jpg'), phone: '+919867477227', name: 'Rajesh Modi - AI Video' },
  { id: 2, image: require('../assets/images/Footer Ads_02-06.jpg'), phone: '+919867477227', name: 'Rajesh Modi - Gold Co-operative' },
  { id: 3, image: require('../assets/images/Footer Ads_02-01.jpg'), phone: '+919867477227', name: 'Rajesh Modi - Bhajan Wani' },
  { id: 4, image: require('../assets/images/Footer Ads_02-08.jpg'), phone: '+919867477227', name: 'Rajesh Modi - Fixed Deposit' },
  { id: 5, image: require('../assets/images/Footer Ads_02-02.jpg'), phone: '+919867477227', name: 'Rajesh Modi - NA Plot' },
  { id: 6, image: require('../assets/images/Footer Ads_02-09.jpg'), phone: '+919867477227', name: 'Rajesh Modi - Kasara Resort' },
  { id: 7, image: require('../assets/images/Footer Ads_02-11.jpg'), phone: '+919867477227', name: 'Rajesh Modi - Pavitram Jewellery' },
  { id: 8, image: require('../assets/images/Footer Ads_02-13.jpg'), phone: '+919867477227', name: 'Rajesh Modi - Watch' },
  { id: 9, image: require('../assets/images/Footer Ads_02-04.jpg'), phone: '+919867477227', name: 'Rajesh Modi - AI Poster' },
  { id: 10, image: require('../assets/images/Footer Ads_02-21.jpg'), phone: '+919867477227', name: 'Rajesh Modi - Yaadon Ki Baraat' },
  
  // Ingit Dave - 8879221111 (1 ad)
  { id: 11, image: require('../assets/images/Footer Ads_02-07.jpg'), phone: '+918879221111', name: 'Ingit Dave - Plot Mahabaleshwar' },
  
  // Arun Kamal - 9833001167 (1 ad)
  { id: 12, image: require('../assets/images/Footer Ads_02-19.jpg'), phone: '+919833001167', name: 'Arun Kamal - Ghasmanchal' },
  
  // Shabbir - 9820329571 (1 ad)
  { id: 13, image: require('../assets/images/Footer Ads_02-03.jpg'), phone: '+919820329571', name: 'Shabbir - Power Connect' },
];

const FooterCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(1); // Start at index 1 (first real ad)
  const [showModal, setShowModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<typeof ads[0] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Create infinite scroll data: [last, ...ads, first]
  const infiniteAds = [ads[ads.length - 1], ...ads, ads[0]];

  // Load last viewed ad position and set initial scroll position
  useEffect(() => {
    const loadLastAdPosition = async () => {
      try {
        const lastAdIndex = await AsyncStorage.getItem('lastFooterAdIndex');
        let startIndex = 1; // Default to first ad
        
        if (lastAdIndex) {
          const parsedIndex = parseInt(lastAdIndex, 10);
          // Calculate next ad index (resume from next ad)
          const nextIndex = (parsedIndex % ads.length) + 1;
          startIndex = nextIndex;
          console.log(`📺 Resuming ads from index ${nextIndex} (last viewed: ${parsedIndex})`);
        } else {
          console.log('📺 Starting ads from beginning');
        }
        
        setActiveIndex(startIndex);
        
        // Scroll to the resumed position
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: startIndex * screenWidth,
            animated: false,
          });
          setIsInitialized(true);
        }, 100);
      } catch (error) {
        console.error('Error loading last ad position:', error);
        // Fallback to first ad
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: screenWidth,
            animated: false,
          });
          setIsInitialized(true);
        }, 100);
      }
    };
    
    loadLastAdPosition();
  }, []);

  // Auto-scroll functionality - infinite loop
  useEffect(() => {
    if (!isInitialized) return; // Don't start auto-scroll until initialized
    
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        let nextIndex = prevIndex + 1;
        
        // Check if we need to handle boundary
        if (nextIndex >= infiniteAds.length - 1) {
          // We're about to go to the duplicate first slide
          scrollViewRef.current?.scrollTo({
            x: nextIndex * screenWidth,
            animated: true,
          });
          
          // After animation, jump to real first slide
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              x: screenWidth,
              animated: false,
            });
          }, 300);
          
          return 1; // Reset to first real ad
        } else {
          scrollViewRef.current?.scrollTo({
            x: nextIndex * screenWidth,
            animated: true,
          });
          return nextIndex;
        }
      });
    }, 5000); // Change slide every 5 seconds (increased from 3 seconds)

    return () => clearInterval(interval);
  }, [infiniteAds.length, isInitialized]);

  // Save current ad position whenever it changes
  useEffect(() => {
    const saveAdPosition = async () => {
      if (!isInitialized) return;
      
      // Calculate the actual ad index (accounting for infinite scroll duplicates)
      let actualAdIndex = activeIndex;
      if (actualAdIndex === 0) {
        actualAdIndex = ads.length;
      } else if (actualAdIndex === infiniteAds.length - 1) {
        actualAdIndex = 1;
      } else {
        actualAdIndex = activeIndex;
      }
      
      // Normalize to actual ad array index (1-based becomes 0-based, but we store 1-based)
      const adArrayIndex = actualAdIndex; // Keep as is since infiniteAds uses 1-based for real ads
      
      try {
        await AsyncStorage.setItem('lastFooterAdIndex', adArrayIndex.toString());
        console.log(`💾 Saved ad position: ${adArrayIndex}`);
      } catch (error) {
        console.error('Error saving ad position:', error);
      }
    };
    
    saveAdPosition();
  }, [activeIndex, isInitialized]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / screenWidth);
    setActiveIndex(currentIndex);
  };

  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / screenWidth);
    
    // Handle infinite scroll wrapping
    if (currentIndex === 0) {
      // Scrolled to the duplicate last item, jump to real last item
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: (infiniteAds.length - 2) * screenWidth, // Jump to real last ad
          animated: false,
        });
        setActiveIndex(infiniteAds.length - 2);
      }, 50);
    } else if (currentIndex === infiniteAds.length - 1) {
      // Scrolled to the duplicate first item, jump to real first item
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: screenWidth, // Jump to real first ad
          animated: false,
        });
        setActiveIndex(1);
      }, 50);
    }
  };

  const handleAdPress = (ad: typeof ads[0]) => {
    setSelectedAd(ad);
    setShowModal(true);
  };

  const handleMessage = async () => {
    if (!selectedAd) return;
    
    setIsSearching(true);
    try {
      // Search for user by phone number in the database
      const token = await ensureAuth();
      if (!token) {
        setShowModal(false);
        setIsSearching(false);
        Alert.alert('Error', 'Please log in to send messages');
        return;
      }

      // Remove the + symbol for the search (backend will match multiple formats)
      const phoneWithoutPlus = selectedAd.phone.replace('+', '');
      
      console.log('🔍 Searching for user with phone:', selectedAd.phone);
      console.log('🔍 Phone for API:', phoneWithoutPlus);

      try {
        // Try to search for the user in the database
        const response = await api.get(`/users/search-by-phone/${phoneWithoutPlus}`);
        
        if (response && response.user) {
          const user = response.user;
          console.log('✅ Found user in database:', user.name, user._id);
          
          // User exists - navigate to chat with their name
          setShowModal(false);
          setIsSearching(false);
          
          router.push({
            pathname: `/chat/[userId]`,
            params: { 
              userId: user._id,
              name: user.name,
              phone: selectedAd.phone,
              preFillMessage: 'I am Interested'
            }
          });
        }
      } catch (error) {
        console.log('⚠️ User not found in database, opening chat with phone number');
        
        // User doesn't exist - navigate to chat with phone number as identifier
        setShowModal(false);
        setIsSearching(false);
        
        router.push({
          pathname: `/chat/[userId]`,
          params: { 
            userId: phoneWithoutPlus, // Use phone as temporary userId
            name: selectedAd.phone, // Use phone number as display name
            phone: selectedAd.phone,
            isPhoneOnly: 'true', // Flag to indicate this is a non-registered user
            preFillMessage: 'I am Interested'
          }
        });
      }
    } catch (error: any) {
      console.error('❌ Error opening chat:', error);
      setShowModal(false);
      setIsSearching(false);
      
      // Even if there's an error, try to open chat with phone number
      const phoneWithoutPlus = selectedAd.phone.replace('+', '');
      router.push({
        pathname: `/chat/[userId]`,
        params: { 
          userId: phoneWithoutPlus,
          name: selectedAd.phone,
          phone: selectedAd.phone,
          isPhoneOnly: 'true',
          preFillMessage: 'I am Interested'
        }
      });
    }
  };

  const handleCall = () => {
    setShowModal(false);
    if (selectedAd) {
      const phoneNumber = `tel:${selectedAd.phone}`;
      Linking.openURL(phoneNumber).catch((err) => {
        Alert.alert('Error', 'Unable to make a call. Please try again.');
        console.error('Failed to open phone dialer:', err);
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {infiniteAds.map((ad, index) => (
          <TouchableOpacity 
            key={`${ad.id}-${index}`} 
            style={styles.slide}
            activeOpacity={0.9}
            onPress={() => handleAdPress(ad)}
          >
            <Image
              source={ad.image}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>



      {/* Action Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose an action</Text>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleMessage}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalButtonText}>Message</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonCall]}
              onPress={handleCall}
              disabled={isSearching}
            >
              <Text style={styles.modalButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => setShowModal(false)}
              disabled={isSearching}
            >
              <Text style={[styles.modalButtonText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: 100,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalButtonCall: {
    backgroundColor: '#22C55E',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelText: {
    color: '#6B7280',
  },
});

export default FooterCarousel;
