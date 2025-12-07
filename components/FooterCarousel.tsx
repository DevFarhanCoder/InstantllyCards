import React, { useState, useRef, useEffect } from 'react';
import { View, Image, Dimensions, StyleSheet, ScrollView, Animated, TouchableOpacity, Modal, Text, Linking, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Ad, useAds } from '../hooks/useAds';
import { ensureAuth } from '../lib/auth';
import api from '../lib/api';

const { width: screenWidth } = Dimensions.get('window');

const SHOW_ADS = false; // Set to false to disable ads, true to enable

const FooterCarousel = () => {
  if (!SHOW_ADS) return null;  // add this for a while remove before push code 
  console.log('🔄 FooterCarousel: Component mounting/re-rendering');
  
  // Use shared hook for cached ads (supports 100+ ads smoothly)
  const { data: allAds = [], isLoading } = useAds();
  
  const [activeIndex, setActiveIndex] = useState(1); // Start at index 1 (first real ad)
  const [showModal, setShowModal] = useState(false);
  const [showSimpleModal, setShowSimpleModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  console.log(`📊 FooterCarousel: Current ad count - ${allAds.length} ads (cached)`);
  
  // Preload banner images for instant display
  useEffect(() => {
    if (allAds.length > 0) {
      allAds.forEach((ad) => {
        if ((ad as any)?.bannerImage?.uri) {
          Image.prefetch((ad as any).bannerImage.uri).catch(() => {
            console.log('Failed to prefetch banner for ad:', ad.id);
          });
        }
      });
      console.log('🖼️ Preloading banner images for', allAds.length, 'ads');
    }
  }, [allAds.length]);
  
  // Remove old API fetching useEffect - now using cached hook
  // Continuous loop setup happens below
  // old fetch logic was here; replaced by shared `useAds` hook above
  
  // Create infinite scroll data safely: [last, ...allAds, first]
  const infiniteAds = allAds && allAds.length > 0 ? [allAds[allAds.length - 1], ...allAds, allAds[0]] : [];

  // Load last viewed ad position and set initial scroll position
  useEffect(() => {
    if (!allAds || allAds.length === 0) return; // wait until we have ads
    const loadLastAdPosition = async () => {
      try {
        const lastAdIndex = await AsyncStorage.getItem('lastFooterAdIndex');
        let startIndex = 1; // Default to first ad
        
        if (lastAdIndex) {
          const parsedIndex = parseInt(lastAdIndex, 10);
          // Calculate next ad index (resume from next ad)
          const nextIndex = (parsedIndex % allAds.length) + 1;
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
  }, [allAds.length]);

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
        actualAdIndex = allAds.length;
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

  const handleAdPress = (ad: Ad) => {
    console.log('👆 Ad pressed:', {
      id: ad.id,
      name: ad.name,
      isFromApi: ad.isFromApi,
      hasFullBanner: ad.hasFullBanner
    });
    setSelectedAd(ad);
    // Check if ad has full banner
    if (ad.hasFullBanner) {
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
    // <View style={styles.container}>
    //   {/* Show loading state */}
    //   {isLoading && (
    //     <View style={styles.loadingContainer}>
    //       <ActivityIndicator size="small" color="#10B981" />
    //       <Text style={styles.loadingText}>Loading ads...</Text>
    //     </View>
    //   )}
      
    //   {/* Show empty state if no ads */}
    //   {!isLoading && allAds.length === 0 && (
    //     <View style={styles.emptyContainer}>
    //       <Text style={styles.emptyText}>No promotions available</Text>
    //     </View>
    //   )}
      
    //   {/* Show ads if available */}
    //   {!isLoading && allAds.length > 0 && (
    //     <ScrollView
    //       ref={scrollViewRef}
    //       horizontal
    //       pagingEnabled
    //       showsHorizontalScrollIndicator={false}
    //       onScroll={handleScroll}
    //       onMomentumScrollEnd={handleScrollEnd}
    //       scrollEventThrottle={16}
    //       style={styles.scrollView}
    //     >
    //       {infiniteAds.map((ad, index) => (
    //       <TouchableOpacity 
    //         key={`${ad.id}-${index}`} 
    //         style={styles.slide}
    //         activeOpacity={0.9}
    //         onPress={() => handleAdPress(ad)}
    //       >
    //         <Image
    //           source={ad.image}
    //           style={styles.image}
    //           resizeMode="cover"
    //           onLoadStart={() => {
    //             console.log(`🔄 [IMG LOAD] Starting to load image at index ${index}:`, {
    //               adId: ad.id,
    //               imageUri: ad.image?.uri || 'NO URI',
    //               isFromApi: ad.isFromApi
    //             });
    //           }}
    //           onError={(error) => {
    //             console.error(`❌ [IMG LOAD ERROR] Failed to load image at index ${index}:`);
    //             console.error(`   Ad ID: ${ad.id}`);
    //             console.error(`   Image URI: ${ad.image?.uri || 'NO URI'}`);
    //             console.error(`   Is from API: ${ad.isFromApi}`);
    //             console.error(`   Error:`, error.nativeEvent.error);
    //           }}
    //           onLoad={() => {
    //             console.log(`✅ [IMG LOAD SUCCESS] Image loaded at index ${index}:`, {
    //               adId: ad.id,
    //               imageUri: ad.image?.uri || 'NO URI',
    //               isFromApi: ad.isFromApi
    //             });
    //           }}
    //         />
    //       </TouchableOpacity>
    //     ))}
    //   </ScrollView>
    //   )}

    //   {/* Full Screen Ad Modal - Only for Test Ad */}
    //   <Modal
    //     visible={showModal}
    //     transparent={false}
    //     animationType="none"
    //     onRequestClose={() => setShowModal(false)}
    //   >
    //     <View style={styles.fullScreenModal}>
    //       {/* Full Screen Ad Image */}
    //       <Image
    //         source={(selectedAd as any)?.bannerImage || selectedAd?.image}
    //         style={styles.fullScreenImage}
    //         resizeMode="contain"
    //       />
          
    //       {/* Gradient Overlay */}
    //       <LinearGradient
    //         colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
    //         style={styles.gradientOverlay}
    //       />
          
    //       {/* Close Button */}
    //       <TouchableOpacity 
    //         style={styles.closeButton}
    //         onPress={() => setShowModal(false)}
    //       >
    //         <Ionicons name="close-circle" size={40} color="#FFFFFF" />
    //       </TouchableOpacity>
          
    //       {/* Buttons at Bottom - Horizontal Row */}
    //       <View style={styles.buttonContainer}>
    //         <View style={styles.buttonRow}>
    //           <TouchableOpacity 
    //             style={[styles.fullScreenButton, styles.callButton]}
    //             onPress={handleCall}
    //             disabled={isSearching}
    //             activeOpacity={0.8}
    //           >
    //             <Text style={styles.fullScreenButtonText}>Call</Text>
    //           </TouchableOpacity>
              
    //           <TouchableOpacity 
    //             style={[styles.fullScreenButton, styles.messageButton]}
    //             onPress={handleMessage}
    //             disabled={isSearching}
    //             activeOpacity={0.8}
    //           >
    //             {isSearching ? (
    //               <ActivityIndicator color="#FFFFFF" size="small" />
    //             ) : (
    //               <Text style={styles.fullScreenButtonText}>Message</Text>
    //             )}
    //           </TouchableOpacity>
    //         </View>
    //       </View>
    //     </View>
    //   </Modal>

    //   {/* Simple Popup Modal - For Regular Ads */}
    //   <Modal
    //     visible={showSimpleModal}
    //     transparent={true}
    //     animationType="none"
    //     onRequestClose={() => setShowSimpleModal(false)}
    //   >
    //     <TouchableOpacity 
    //       style={styles.simpleModalOverlay}
    //       activeOpacity={1}
    //       onPress={() => setShowSimpleModal(false)}
    //     >
    //       <View style={styles.simpleModalContent}>
    //         <Text style={styles.simpleModalTitle}>Choose an action</Text>
            
    //         <TouchableOpacity 
    //           style={styles.simpleModalButton}
    //           onPress={handleCall}
    //           disabled={isSearching}
    //         >
    //           <Text style={styles.simpleModalButtonText}>Call</Text>
    //         </TouchableOpacity>
            
    //         <TouchableOpacity 
    //           style={[styles.simpleModalButton, styles.simpleModalButtonMessage]}
    //           onPress={handleMessage}
    //           disabled={isSearching}
    //         >
    //           {isSearching ? (
    //             <ActivityIndicator color="#FFFFFF" />
    //           ) : (
    //             <Text style={styles.simpleModalButtonText}>Message</Text>
    //           )}
    //         </TouchableOpacity>
            
    //         <TouchableOpacity 
    //           style={[styles.simpleModalButton, styles.simpleModalButtonCancel]}
    //           onPress={() => setShowSimpleModal(false)}
    //           disabled={isSearching}
    //         >
    //           <Text style={[styles.simpleModalButtonText, styles.simpleCancelText]}>Cancel</Text>
    //         </TouchableOpacity>
    //       </View>
    //     </TouchableOpacity>
    //   </Modal>
    // </View>
    <></>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
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
