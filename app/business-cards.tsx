// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   FlatList,
//   TouchableOpacity,
//   TextInput,
//   Platform,
//   StatusBar,
//   Dimensions,
//   Image,
//   ActivityIndicator,
// } from 'react-native';
// import { router, useLocalSearchParams, Href, useFocusEffect } from 'expo-router';
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import api from '../lib/api';

// const { width } = Dimensions.get('window');

// // Mock business card data - Replace with actual API call later
// const generateMockCards = (subcategory: string) => {
//   const mockCards = [];
//   for (let i = 1; i <= 20; i++) {
//     mockCards.push({
//       id: `${subcategory}-${i}`,
//       name: `Business ${i}`,
//       category: subcategory,
//       phone: `+91 ${9000000000 + i}`,
//       email: `business${i}@example.com`,
//       address: `${i} Main Street, City`,
//       description: `Professional ${subcategory} services provider`,
//       rating: (4 + Math.random()).toFixed(1),
//       verified: Math.random() > 0.5,
//     });
//   }
//   return mockCards;
// };

// export default function BusinessCardsScreen() {
//   const { subcategory, category } = useLocalSearchParams();
//   const [search, setSearch] = useState('');
//   const [businessCards, setBusinessCards] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

//   // Fetch real business cards from API
//   const fetchBusinessCards = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       console.log('🔍 Fetching cards for subcategory:', subcategory);

//       // Fetch all cards from the feed
//       const response = await api.get('/cards/feed/public');

//       if (response && response.data) {
//         const allCards = Array.isArray(response.data) ? response.data : [];

//         // Filter cards that have the selected subcategory in their servicesOffered
//         const filteredCards = allCards.filter((card: any) => {
//           if (!card.servicesOffered) return false;

//           // servicesOffered is a comma-separated string
//           const services = card.servicesOffered.split(',').map((s: string) => s.trim().toLowerCase());
//           return services.includes((subcategory as string).toLowerCase());
//         });

//         console.log(`✅ Found ${filteredCards.length} cards for "${subcategory}"`);
//         setBusinessCards(filteredCards);
//       } else {
//         setBusinessCards([]);
//       }
//     } catch (err) {
//       console.error('❌ Error fetching business cards:', err);
//       setError('Failed to load business cards');
//       setBusinessCards([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch cards on mount and when subcategory changes
//   useEffect(() => {
//     fetchBusinessCards();
//   }, [subcategory]);

//   // Refetch cards when screen comes into focus (after delete/edit)
//   useFocusEffect(
//     React.useCallback(() => {
//       console.log('🔄 Business cards screen focused - refreshing list');
//       fetchBusinessCards();
//     }, [subcategory])
//   );

//   const filteredCards = businessCards.filter((card: any) =>
//     (card.companyName?.toLowerCase().includes(search.toLowerCase()) ||
//     card.name?.toLowerCase().includes(search.toLowerCase()) ||
//     card.aboutBusiness?.toLowerCase().includes(search.toLowerCase()))
//   );

//   const renderBusinessCard = ({ item }) => (
//     <TouchableOpacity 
//       style={styles.card}
//       activeOpacity={0.7}
//       onPress={() => {
//         // Navigate to card detail screen with actual card data
//         router.push({
//           pathname: `/card/${item._id}`,
//           params: { cardData: JSON.stringify(item) }
//         } as Href);
//       }}
//     >
//       <View style={styles.cardHeader}>
//         <View style={styles.avatarContainer}>
//           <View style={styles.avatar}>
//             {item.companyPhoto ? (
//               <Image 
//                 source={{ uri: `https://api-test.instantllycards.com${item.companyPhoto}` }} 
//                 style={styles.avatarImage}
//               />
//             ) : (
//               <MaterialIcons name="business" size={32} color="#3B82F6" />
//             )}
//           </View>
//         </View>

//         <View style={styles.cardInfo}>
//           <View style={styles.nameRow}>
//             <Text style={styles.businessName} numberOfLines={1}>
//               {item.companyName || item.name}
//             </Text>
//           </View>
//           <Text style={styles.category} numberOfLines={1}>
//             {item.servicesOffered?.split(',')[0] || subcategory}
//           </Text>
//           {item.establishedYear && (
//             <Text style={styles.established}>Est. {item.establishedYear}</Text>
//           )}
//         </View>
//       </View>

//       <View style={styles.cardBody}>
//         <Text style={styles.description} numberOfLines={2}>
//           {item.aboutBusiness || item.message || `Professional ${subcategory} services`}
//         </Text>
//       </View>

//       <View style={styles.cardFooter}>
//         <View style={styles.contactInfo}>
//           {(item.companyPhone || item.personalPhone) && (
//             <View style={styles.contactItem}>
//               <Ionicons name="call" size={14} color="#6B7280" />
//               <Text style={styles.contactText} numberOfLines={1}>
//                 {item.companyPhone || item.personalPhone}
//               </Text>
//             </View>
//           )}
//           {item.companyAddress && (
//             <View style={styles.contactItem}>
//               <Ionicons name="location" size={14} color="#6B7280" />
//               <Text style={styles.contactText} numberOfLines={1}>{item.companyAddress}</Text>
//             </View>
//           )}
//         </View>
//         <TouchableOpacity 
//           style={styles.viewButton}
//           onPress={(e) => {
//             e.stopPropagation();
//             router.push({
//               pathname: `/card/${item._id}`,
//               params: { cardData: JSON.stringify(item) }
//             } as Href);
//           }}
//         >
//           <Text style={styles.viewButtonText}>View</Text>
//           <Ionicons name="arrow-forward" size={14} color="#3B82F6" />
//         </TouchableOpacity>
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity 
//           style={styles.backButton} 
//           onPress={() => router.back()}
//           hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//         >
//           <Ionicons name="arrow-back" size={24} color="#1F2937" />
//         </TouchableOpacity>
//         <View style={styles.headerTextContainer}>
//           <Text style={styles.headerTitle} numberOfLines={1}>{subcategory}</Text>
//           <Text style={styles.headerSubtitle} numberOfLines={1}>{category}</Text>
//         </View>
//       </View>

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchBar}>
//           <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search businesses..."
//             placeholderTextColor="#9CA3AF"
//             value={search}
//             onChangeText={setSearch}
//             autoCapitalize="none"
//             autoCorrect={false}
//           />
//           {search.length > 0 && (
//             <TouchableOpacity 
//               onPress={() => setSearch('')}
//               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//             >
//               <Ionicons name="close-circle" size={20} color="#9CA3AF" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Results Count */}
//       <View style={styles.resultsHeader}>
//         <Text style={styles.resultsCount}>
//           {filteredCards.length} {filteredCards.length === 1 ? 'business' : 'businesses'} found
//         </Text>
//         <View style={styles.viewToggle}>
//           <TouchableOpacity 
//             style={[styles.toggleButton, viewMode === 'list' && styles.toggleActive]}
//             onPress={() => setViewMode('list')}
//           >
//             <Ionicons name="list" size={18} color={viewMode === 'list' ? '#3B82F6' : '#9CA3AF'} />
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={[styles.toggleButton, viewMode === 'grid' && styles.toggleActive]}
//             onPress={() => setViewMode('grid')}
//           >
//             <Ionicons name="grid" size={18} color={viewMode === 'grid' ? '#3B82F6' : '#9CA3AF'} />
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Business Cards List */}
//       {loading ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#3B82F6" />
//           <Text style={styles.loadingText}>Loading businesses...</Text>
//         </View>
//       ) : error ? (
//         <View style={styles.emptyContainer}>
//           <Ionicons name="alert-circle" size={64} color="#DC2626" />
//           <Text style={styles.emptyText}>{error}</Text>
//           <TouchableOpacity 
//             style={styles.retryButton}
//             onPress={fetchBusinessCards}
//           >
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredCards}
//           keyExtractor={(item) => item._id || item.id}
//           renderItem={renderBusinessCard}
//           contentContainerStyle={styles.listContainer}
//           showsVerticalScrollIndicator={false}
//           ListEmptyComponent={
//             <View style={styles.emptyContainer}>
//               <MaterialIcons name="business-center" size={64} color="#D1D5DB" />
//               <Text style={styles.emptyText}>No businesses found</Text>
//               <Text style={styles.emptySubtext}>
//                 No cards match "{subcategory}"
//               </Text>
//             </View>
//           }
//         />
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-start',
//     paddingHorizontal: 16,
//     paddingTop: 50,
//     paddingBottom: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 2,
//       },
//     }),
//   },
//   backButton: {
//     padding: 4,
//     marginRight: 12,
//   },
//   headerTextContainer: {
//     flex: 1,
//     marginHorizontal: 12,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1F2937',
//   },
//   headerSubtitle: {
//     fontSize: 13,
//     color: '#6B7280',
//     marginTop: 2,
//   },
//   searchContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F3F4F6',
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#1F2937',
//     padding: 0,
//   },
//   resultsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//   },
//   resultsCount: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#1F2937',
//   },
//   viewToggle: {
//     flexDirection: 'row',
//     backgroundColor: '#F3F4F6',
//     borderRadius: 8,
//     padding: 2,
//   },
//   toggleButton: {
//     padding: 6,
//     borderRadius: 6,
//     marginHorizontal: 2,
//   },
//   toggleActive: {
//     backgroundColor: '#fff',
//   },
//   listContainer: {
//     padding: 16,
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.08,
//         shadowRadius: 8,
//       },
//       android: {
//         elevation: 3,
//       },
//     }),
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//   },
//   avatarContainer: {
//     position: 'relative',
//   },
//   avatar: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: '#EFF6FF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     borderColor: '#DBEAFE',
//   },
//   verifiedBadge: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//   },
//   cardInfo: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   nameRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   businessName: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1F2937',
//     flex: 1,
//   },
//   category: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginTop: 2,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 6,
//   },
//   rating: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginLeft: 4,
//   },
//   cardBody: {
//     marginTop: 12,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#F3F4F6',
//   },
//   description: {
//     fontSize: 14,
//     color: '#6B7280',
//     lineHeight: 20,
//   },
//   cardFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 12,
//   },
//   contactInfo: {
//     flex: 1,
//   },
//   contactItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   contactText: {
//     fontSize: 13,
//     color: '#6B7280',
//     marginLeft: 6,
//     flex: 1,
//   },
//   viewButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#EFF6FF',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   viewButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#3B82F6',
//     marginRight: 4,
//   },
//   emptyContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 80,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#6B7280',
//     marginTop: 16,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#9CA3AF',
//     marginTop: 4,
//   },
//   loadingContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 80,
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#6B7280',
//     marginTop: 16,
//   },
//   retryButton: {
//     marginTop: 16,
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   avatarImage: {
//     width: '100%',
//     height: '100%',
//   },
//   established: {
//     fontSize: 12,
//     color: '#9CA3AF',
//     marginTop: 2,
//   },
// });

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams, Href, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import api from '../lib/api';

const { width, height } = Dimensions.get('window');

// Get status bar height for Android
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

export default function BusinessCardsScreen() {
  const { subcategory, category } = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [businessCards, setBusinessCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
    viewableItems.forEach((viewable: any) => {
      if (viewable.item?._id) {
        api.post(`/business-listings/${viewable.item._id}/impression`);
      }
    });
  }).current;
  // Fetch real business cards from API
  const fetchBusinessCards = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching promoted businesses for:', subcategory);
      const response = await api.get('/business-listings', {
        params: {
          subcategory: subcategory,
          // city: optional future
        }
      });
      console.log('📊 API Response:', response);

      if (response?.success) {
        setBusinessCards(response.data || []);
      } else {
        setBusinessCards([]);
      }

    } catch (err) {
      console.error('❌ Error fetching business listings:', err);
      setError('Failed to load businesses');
      setBusinessCards([]);
    } finally {
      setLoading(false);
    }
  };


  // Fetch cards on mount and when subcategory changes
  useEffect(() => {
    fetchBusinessCards();
  }, [subcategory]);

  // Refetch cards when screen comes into focus (after delete/edit)
  // useFocusEffect(
  //   React.useCallback(() => {
  //     console.log('🔄 Business cards screen focused - refreshing list');
  //     fetchBusinessCards();
  //   }, [subcategory])
  // );

  // const filteredCards = businessCards.filter((card: any) =>
  // (card.companyName?.toLowerCase().includes(search.toLowerCase()) ||
  //   card.name?.toLowerCase().includes(search.toLowerCase()) ||
  //   card.aboutBusiness?.toLowerCase().includes(search.toLowerCase()))
  // );
  const filteredCards = businessCards.filter((card: any) =>
  card.businessName?.toLowerCase().includes(search.toLowerCase()) ||
  card.description?.toLowerCase().includes(search.toLowerCase())
);




  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`);
  };

  const handleDirection = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleShare = (item: any) => {
    console.log('Share:', item.businessName);
  };

  const renderBusinessCard = ({ item, index }) => {
    const phone = item.phone
    const address = `${item.area || ''}, ${item.city || ''}`;
    const currentYear = new Date().getFullYear();
    const establishedYear = item.establishedYear ? parseInt(item.establishedYear) : null;
    const yearsInBusiness = establishedYear && establishedYear <= currentYear ? currentYear - establishedYear : null;




    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={async () => {
          try {
            await api.post(`/business-listings/${item._id}/click`);
          } catch (e) { }

          router.push({
            pathname: `/businessCard/${item._id}`,
            params: { cardData: JSON.stringify(item) }
          } as Href);
        }}

      >
        {/* Card Image Section */}
        <View style={styles.cardImageSection}>
          {item.companyPhoto ? (
            <Image
              source={{ uri: `https://api-test.instantllycards.com${item.companyPhoto}` }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <MaterialIcons name="business" size={48} color="#9CA3AF" />
            </View>
          )}

          {/* Badge on image */}
          {item.listingType === 'promoted' && (
            <View style={styles.topSearchBadge}>
              <Ionicons name="flash" size={12} color="#fff" />
              <Text style={styles.topSearchText}>Top Sponsored</Text>
            </View>
          )}


        </View>

        {/* Card Content Section */}
        <View style={styles.cardContent}>
          {/* Verified Badge + Business Name */}
          <View style={styles.nameRow}>
            {item.isVerified ? (
              <View style={styles.verifiedBadgeSmall}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.thumbIconRow}>
            <MaterialIcons name="thumb-up" size={16} color="#1F2937" />
            <Text style={styles.businessName} numberOfLines={2}>
              {item.businessName}
            </Text>
          </View>

          {/* Rating Box */}
          <View style={styles.ratingBox}>
            <Text style={styles.ratingText}>3.7 ★</Text>
            <Text style={styles.ratingsCount}>95 Ratings</Text>
          </View>

          {/* Address + Distance */}
          <Text style={styles.address} numberOfLines={1}>
            {address ? `${address.substring(0, 30)}... - 41.7 km` : 'Address not available - 41.7 km'}
          </Text>

          {/* Years in Business */}
          {yearsInBusiness && yearsInBusiness > 0 ? (
            <Text style={styles.experience}>
              {yearsInBusiness} {yearsInBusiness === 1 ? 'Year' : 'Years'} in Business
            </Text>
          ) : null}

          {/* Review Snippet */}
          {item.aboutBusiness && item.aboutBusiness.trim() !== '' ? (
            <View style={styles.reviewSnippet}>
              <Ionicons name="chatbox-outline" size={16} color="#EF4444" />
              <Text style={styles.reviewText} numberOfLines={2}>
                "{item.aboutBusiness.substring(0, 60)}..."
              </Text>
            </View>
          ) : null}

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {phone ? (
              <>
                <TouchableOpacity
                  style={styles.actionButtonPrimary}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCall(phone);
                  }}
                >
                  <Ionicons name="call" size={18} color="#fff" />
                  <Text style={styles.actionButtonPrimaryText}>Call Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButtonSecondary}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleWhatsApp(phone);
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  <Text style={styles.actionButtonSecondaryText}>WhatsApp</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {address ? (
              <TouchableOpacity
                style={styles.actionButtonSecondary}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDirection(address);
                }}
              >
                <Ionicons name="navigate" size={18} color="#6B7280" />
                <Text style={styles.actionButtonSecondaryText}>Direction</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={(e) => {
                e.stopPropagation();
                handleShare(item);
              }}
            >
              <Ionicons name="share-social" size={18} color="#6B7280" />
              <Text style={styles.actionButtonSecondaryText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header with Search - Fixed positioning */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder={`${subcategory}`}
              placeholderTextColor="#1F2937"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity>
              <Ionicons name="mic" size={22} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity>
            <Ionicons name="share-social" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>{category}</Text>

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredCards.length} Results for your search
          </Text>
        </View>
      </View>

      {/* Business Cards List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color="#DC2626" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchBusinessCards}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderBusinessCard}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="business-center" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No businesses found</Text>
              <Text style={styles.emptySubtext}>
                No cards match "{subcategory}"
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  backButton: {
    padding: 4,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    gap: 8,
    minHeight: 44, // Ensures minimum touch target size
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    padding: 0,
    minHeight: 24,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultsCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    marginBottom: 8,
    flexDirection: 'row',
    minHeight: 160,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardImageSection: {
    width: width * 0.37, // 37% of screen width for better responsiveness
    minWidth: 120,
    maxWidth: 160,
    height: 160,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSearchBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  topSearchText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  verifiedBadgeSmall: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '600',
  },
  thumbIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    lineHeight: 20,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  ratingText: {
    backgroundColor: '#16A34A',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 13,
    fontWeight: '700',
  },
  ratingsCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  address: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  experience: {
    fontSize: 13,
    color: '#16A34A',
    marginBottom: 6,
  },
  reviewSnippet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 6,
  },
  reviewText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    gap: 4,
    minHeight: 36,
  },
  actionButtonPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    minHeight: 36,
  },
  actionButtonSecondaryText: {
    color: '#1F2937',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
