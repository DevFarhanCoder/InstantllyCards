import React, { useState, useRef, useEffect } from 'react';
import { View, Image, Dimensions, StyleSheet, ScrollView, Animated, TouchableOpacity, Modal, Text, Linking, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '@/lib/api';
import { ensureAuth } from '@/lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

// Ad data with phone numbers
const ads = [
  { id: 1, image: require('../assets/images/Footer Ads-02.jpg'), phone: '+919867477227', name: 'Ad 1' },
  { id: 2, image: require('../assets/images/Footer Ads-01.jpg'), phone: '+919867477227', name: 'Ad 2' },
  { id: 3, image: require('../assets/images/Footer Ads-03.jpg'), phone: '+919820329571', name: 'Ad 3' },
];

const FooterCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<typeof ads[0] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Auto-scroll functionality - changed to 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % 3;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * screenWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 10000); // Change slide every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / screenWidth);
    setActiveIndex(currentIndex);
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
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {ads.map((ad, index) => (
          <TouchableOpacity 
            key={ad.id} 
            style={styles.slide}
            activeOpacity={0.9}
            onPress={() => handleAdPress(ad)}
          >
            <Image
              source={ad.image}
              style={styles.image}
              resizeMode="stretch"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

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
  pagination: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
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
