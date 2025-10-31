import React, { useState, useRef, useEffect } from 'react';
import { View, Image, Dimensions, StyleSheet, ScrollView, Animated, TouchableOpacity, Modal, Text, Linking, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '@/lib/api';
import { ensureAuth } from '@/lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

// Ad data with phone numbers
const ads = [
  // Rajesh Modi - 9867477227
  { id: 2, image: require('../assets/images/Footer Ads_02-05.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  { id: 3, image: require('../assets/images/Footer Ads_02-06.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  { id: 4, image: require('../assets/images/Footer Ads_02-11.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  { id: 5, image: require('../assets/images/Footer Ads_02-02.jpg'), phone: '+919867477227', name: 'Rajesh Modi', hasFullBanner: true, bannerImage: require('../assets/images/Instantlly Cards_Full Page Ad-01.jpg') },
  { id: 6, image: require('../assets/images/Footer Ads_02-01.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  { id: 7, image: require('../assets/images/Footer Ads_02-08.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  { id: 8, image: require('../assets/images/Footer Ads_02-09.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  { id: 9, image: require('../assets/images/Footer Ads_02-04.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  { id: 10, image: require('../assets/images/Footer Ads_02-21.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  { id: 11, image: require('../assets/images/Footer Ads_02-37.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  { id: 12, image: require('../assets/images/Footer Ads_02-36.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  { id: 13, image: require('../assets/images/Footer Ads_02-12.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  { id: 14, image: require('../assets/images/Footer Ads_02-10.jpg'), phone: '+919867477227', name: 'Rajesh Modi' },
  
  // Ingit Dave - 8879221111
  { id: 15, image: require('../assets/images/Footer Ads_02-07.jpg'), phone: '+918879221111', name: 'Ingit Dave' },
  { id: 16, image: require('../assets/images/Footer Ads_02-31.jpg'), phone: '+918879221111', name: 'Ingit Dave' },
  { id: 17, image: require('../assets/images/Footer Ads_02-32.jpg'), phone: '+918879221111', name: 'Ingit Dave' },
  { id: 18, image: require('../assets/images/Footer Ads_02-33.jpg'), phone: '+918879221111', name: 'Ingit Dave' },
  
  // Arun Kamal - 9833001167
  { id: 19, image: require('../assets/images/Footer Ads_02-19.jpg'), phone: '+919833001167', name: 'Arun Kamal' },
  
  // Shabbir - 9820329571
  { id: 20, image: require('../assets/images/Footer Ads_02-03.jpg'), phone: '+919820329571', name: 'Shabbir' },
  
  // Aakash Jugraj - 9004444476
  { id: 21, image: require('../assets/images/Footer Ads_02-34.jpg'), phone: '+919004444476', name: 'Aakash Jugraj' },
  
  // Ganesh Kandalkar - 9867304372
  { id: 22, image: require('../assets/images/Footer Ads_02-35.jpg'), phone: '+919867304372', name: 'Ganesh Kandalkar' },
  
  // Sengel Dsouza - 8976260702
  { id: 23, image: require('../assets/images/Footer Ads_02-38.jpg'), phone: '+918976260702', name: 'Sengel Dsouza' },
  { id: 24, image: require('../assets/images/Footer Ads_02-39.jpg'), phone: '+918976260702', name: 'Sengel Dsouza' },
  { id: 25, image: require('../assets/images/Footer Ads_02-40.jpg'), phone: '+918976260702', name: 'Sengel Dsouza' },
  { id: 26, image: require('../assets/images/Footer Ads_02-41.jpg'), phone: '+918976260702', name: 'Sengel Dsouza' },
  { id: 27, image: require('../assets/images/Footer Ads_02-42.jpg'), phone: '+918976260702', name: 'Sengel Dsouza' },
  
  // Vibhuti Jain - 9820658293
  { id: 28, image: require('../assets/images/Footer Ads_02-22.jpg'), phone: '+919820658293', name: 'Vibhuti Jain' },
  { id: 29, image: require('../assets/images/Footer Ads_02-20.jpg'), phone: '+919820658293', name: 'Vibhuti Jain' },
  { id: 30, image: require('../assets/images/Footer Ads_02-26.jpg'), phone: '+919820658293', name: 'Vibhuti Jain' },
  { id: 31, image: require('../assets/images/Footer Ads_02-46.jpg'), phone: '+919820658293', name: 'Vibhuti Jain' },
  { id: 32, image: require('../assets/images/Footer Ads_02-47.jpg'), phone: '+919820658293', name: 'Vibhuti Jain' },
  { id: 33, image: require('../assets/images/Footer Ads_02-51.jpg'), phone: '+919820658293', name: 'Vibhuti Jain' },
  { id: 34, image: require('../assets/images/Footer Ads_02-52.jpg'), phone: '+919820658293', name: 'Vibhuti Jain' },
  { id: 35, image: require('../assets/images/Footer Ads_02-58.jpg'), phone: '+919820658293', name: 'Vibhuti Jain' },
  { id: 36, image: require('../assets/images/Footer Ads_02-49.jpg'), phone: '+919820658293', name: 'Vibhuti Jain' },
  
  // Dr. Pooja Shah - 9167379734
  { id: 37, image: require('../assets/images/Footer Ads_02-53.jpg'), phone: '+919167379734', name: 'Dr. Pooja Shah' },
  { id: 38, image: require('../assets/images/Footer Ads_02-54.jpg'), phone: '+919167379734', name: 'Dr. Pooja Shah' },
  { id: 39, image: require('../assets/images/Footer Ads_02-55.jpg'), phone: '+919167379734', name: 'Dr. Pooja Shah' },
  { id: 40, image: require('../assets/images/Footer Ads_02-56.jpg'), phone: '+919167379734', name: 'Dr. Pooja Shah' },
  { id: 41, image: require('../assets/images/Footer Ads_02-57.jpg'), phone: '+919167379734', name: 'Dr. Pooja Shah' },
  
  // DevDas Pandit - 8452856993
  { id: 42, image: require('../assets/images/Footer Ads_02-61.jpg'), phone: '+918452856993', name: 'DevDas Pandit' },
  
  // Mohit Gupta - 9820364494
  { id: 43, image: require('../assets/images/Footer Ads_02-62.jpg'), phone: '+919820364494', name: 'Mohit Gupta' },
];

const FooterCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(1); // Start at index 1 (first real ad)
  const [showModal, setShowModal] = useState(false);
  const [showSimpleModal, setShowSimpleModal] = useState(false);
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
    // Check if ad has full banner
    if ((ad as any).hasFullBanner) {
      setShowModal(true); // Show full-screen modal
    } else {
      setShowSimpleModal(true); // Show simple popup
    }
  };

  const handleMessage = async () => {
    if (!selectedAd) return;
    
    setIsSearching(true);
    try {
      const token = await ensureAuth();
      if (!token) {
        setShowModal(false);
        setIsSearching(false);
        Alert.alert('Error', 'Please log in to send messages');
        return;
      }

      const phoneWithoutPlus = selectedAd.phone.replace('+', '');
      
      console.log('🔍 Searching for user with phone:', selectedAd.phone);

      try {
        const response = await api.get(`/users/search-by-phone/${phoneWithoutPlus}`);
        
        if (response && response.user) {
          const user = response.user;
          console.log('✅ Found user in database:', user.name, user._id);
          
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
        
        setShowModal(false);
        setIsSearching(false);
        
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
    } catch (error: any) {
      console.error('❌ Error opening chat:', error);
      setShowModal(false);
      setIsSearching(false);
      
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

  const handleCall = async () => {
    if (!selectedAd) return;
    
    try {
      // First, send a message with the default card
      const token = await ensureAuth();
      if (token) {
        const phoneWithoutPlus = selectedAd.phone.replace('+', '');
        
        console.log('📤 Sending default card to advertiser before call:', selectedAd.phone);
        
        try {
          // Search for user by phone number
          const response = await api.get(`/users/search-by-phone/${phoneWithoutPlus}`);
          
          if (response && response.user) {
            const user = response.user;
            console.log('✅ Found advertiser in database:', user.name, user._id);
            
            // Get user's default card
            const cardsResponse = await api.get('/cards');
            const defaultCard = cardsResponse.data?.find((card: any) => card.isDefault) || cardsResponse.data?.[0];
            
            if (defaultCard) {
              // Send the default card as a message
              await api.post('/messages/send', {
                recipientId: user._id,
                content: 'Here is my card',
                cardId: defaultCard._id
              });
              console.log('✅ Default card sent to advertiser');
            }
          } else {
            console.log('⚠️ Advertiser not found in database, skipping card send');
          }
        } catch (error) {
          console.log('⚠️ Error sending card, proceeding to call anyway:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error in pre-call card send:', error);
    }
    
    // Close modal and make the call
    setShowModal(false);
    
    // Make the call
    const phoneNumber = `tel:${selectedAd.phone}`;
    Linking.openURL(phoneNumber).catch((err) => {
      Alert.alert('Error', 'Unable to make a call. Please try again.');
      console.error('Failed to open phone dialer:', err);
    });
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

      {/* Full Screen Ad Modal - Only for Test Ad */}
      <Modal
        visible={showModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.fullScreenModal}>
          {/* Full Screen Ad Image */}
          <Image
            source={(selectedAd as any)?.bannerImage || selectedAd?.image}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
            style={styles.gradientOverlay}
          />
          
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowModal(false)}
          >
            <Ionicons name="close-circle" size={40} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Buttons at Bottom - Horizontal Row */}
          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.fullScreenButton, styles.callButton]}
                onPress={handleCall}
                disabled={isSearching}
                activeOpacity={0.8}
              >
                <Text style={styles.fullScreenButtonText}>Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.fullScreenButton, styles.messageButton]}
                onPress={handleMessage}
                disabled={isSearching}
                activeOpacity={0.8}
              >
                {isSearching ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.fullScreenButtonText}>Message</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Simple Popup Modal - For Regular Ads */}
      <Modal
        visible={showSimpleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSimpleModal(false)}
      >
        <TouchableOpacity 
          style={styles.simpleModalOverlay}
          activeOpacity={1}
          onPress={() => setShowSimpleModal(false)}
        >
          <View style={styles.simpleModalContent}>
            <Text style={styles.simpleModalTitle}>Choose an action</Text>
            
            <TouchableOpacity 
              style={styles.simpleModalButton}
              onPress={handleCall}
              disabled={isSearching}
            >
              <Text style={styles.simpleModalButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.simpleModalButton, styles.simpleModalButtonMessage]}
              onPress={handleMessage}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.simpleModalButtonText}>Message</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.simpleModalButton, styles.simpleModalButtonCancel]}
              onPress={() => setShowSimpleModal(false)}
              disabled={isSearching}
            >
              <Text style={[styles.simpleModalButtonText, styles.simpleCancelText]}>Cancel</Text>
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

  // Full Screen Modal Styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 4,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  fullScreenButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  callButton: {
    backgroundColor: '#10B981',
  },
  messageButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  fullScreenButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#EF4444',
  },

  // Simple Modal Styles
  simpleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  simpleModalContent: {
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
  simpleModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  simpleModalButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  simpleModalButtonMessage: {
    backgroundColor: '#3B82F6',
  },
  simpleModalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  simpleModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  simpleCancelText: {
    color: '#6B7280',
  },
});

export default FooterCarousel;
