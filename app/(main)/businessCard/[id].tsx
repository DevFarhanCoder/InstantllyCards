// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   ScrollView,
//   TouchableOpacity,
//   Platform,
//   StatusBar,
//   Dimensions,
//   Linking,
//   Image,
// } from 'react-native';
// import { router, useLocalSearchParams } from 'expo-router';
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// const { width, height } = Dimensions.get('window');

// // Get status bar height for Android
// const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

// export default function BusinessCardDetailScreen() {
//   const params = useLocalSearchParams();
//   const [activeTab, setActiveTab] = useState('overview');

//   // Parse card data from params
//   let cardData = null;
//   try {
//     cardData = params.cardData ? JSON.parse(params.cardData as string) : null;
//   } catch (e) {
//     console.error('Error parsing card data:', e);
//   }

//   // Use actual card data or fallback to params
//   const businessData = cardData || {
//     companyName: params.name || 'Business Name',
//     servicesOffered: params.category || 'Category',
//     companyPhone: params.phone || '+91 9876543210',
//     companyEmail: params.email || 'business@example.com',
//     companyWebsite: params.website || 'www.business.com',
//     companyAddress: params.address || '123 Main Street, City, State - 123456',
//     aboutBusiness: params.description || 'Professional services provider with years of experience in the industry.',
//     establishedYear: params.established || '2015',
//     isVerified: params.verified === 'true' || false,
//     companyPhoto: params.photo || null,
//   };

//   const currentYear = new Date().getFullYear();
//   const establishedYear = businessData.establishedYear ? parseInt(businessData.establishedYear) : null;
//   const yearsInBusiness = establishedYear && establishedYear <= currentYear 
//     ? currentYear - establishedYear 
//     : null;

//   const handleCall = () => {
//     const phone = businessData.companyPhone || businessData.personalPhone;
//     if (phone) Linking.openURL(`tel:${phone}`);
//   };

//   const handleEmail = () => {
//     if (businessData.companyEmail) {
//       Linking.openURL(`mailto:${businessData.companyEmail}`);
//     }
//   };

//   const handleWhatsApp = () => {
//     const phone = businessData.companyPhone || businessData.personalPhone;
//     if (phone) {
//       const cleanPhone = phone.replace(/\D/g, '');
//       Linking.openURL(`https://wa.me/${cleanPhone}`);
//     }
//   };

//   const handleWebsite = () => {
//     if (businessData.companyWebsite) {
//       const url = businessData.companyWebsite.startsWith('http') 
//         ? businessData.companyWebsite 
//         : `https://${businessData.companyWebsite}`;
//       Linking.openURL(url);
//     }
//   };

//   const handleDirection = () => {
//     if (businessData.companyAddress) {
//       const address = encodeURIComponent(businessData.companyAddress);
//       const url = Platform.select({
//         ios: `maps:0,0?q=${address}`,
//         android: `geo:0,0?q=${address}`,
//       });
//       if (url) Linking.openURL(url);
//     }
//   };

//   const handleShare = () => {
//     console.log('Share card');
//   };

//   const handleEnquiry = () => {
//     console.log('Send enquiry');
//   };

//   const renderStarRating = () => {
//     return (
//       <View style={styles.starRatingRow}>
//         {[1, 2, 3, 4, 5].map((star) => (
//           <TouchableOpacity key={star} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
//             <Ionicons name="star-outline" size={40} color="#D1D5DB" />
//           </TouchableOpacity>
//         ))}
//       </View>
//     );
//   };

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'overview':
//         return (
//           <View>
//             {/* Start a Review */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Start a review</Text>
//               {renderStarRating()}
//             </View>

//             {/* Address */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Address</Text>
//               <Text style={styles.addressText}>
//                 {businessData.companyAddress || 'Address not available'}
//               </Text>
//               <View style={styles.addressActions}>
//                 <TouchableOpacity style={styles.directionLink} onPress={handleDirection}>
//                   <Ionicons name="navigate" size={16} color="#3B82F6" />
//                   <Text style={styles.directionText}>Direction</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.copyLink}>
//                   <Ionicons name="copy-outline" size={16} color="#3B82F6" />
//                   <Text style={styles.copyText}>Copy</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* Photos */}
//             <View style={styles.section}>
//               <View style={styles.photoHeader}>
//                 <Text style={styles.sectionTitle}>Photos</Text>
//                 <TouchableOpacity>
//                   <Text style={styles.uploadPhotosText}>⬆ Upload Photos</Text>
//                 </TouchableOpacity>
//               </View>
//               <View style={styles.photosGrid}>
//                 {businessData.companyPhoto ? (
//                   <Image 
//                     source={{ uri: `https://api-test.instantllycards.com${businessData.companyPhoto}` }}
//                     style={styles.photoThumbnail}
//                     resizeMode="cover"
//                   />
//                 ) : (
//                   <View style={styles.photoPlaceholder}>
//                     <MaterialIcons name="business" size={40} color="#9CA3AF" />
//                   </View>
//                 )}
//               </View>
//             </View>
//           </View>
//         );

//       case 'reviews':
//         return (
//           <View>
//             {/* Start a Review */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Start a review</Text>
//               {renderStarRating()}
//             </View>

//             {/* Reviews & Ratings */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
//               <View style={styles.ratingsSummary}>
//                 <View style={styles.ratingBox}>
//                   <Text style={styles.ratingNumber}>3.7</Text>
//                 </View>
//                 <View style={styles.ratingsInfo}>
//                   <Text style={styles.ratingsTitle}>95 Ratings</Text>
//                   <Text style={styles.ratingsSubtitle}>
//                     Jd rating index based on 95 ratings across the web
//                   </Text>
//                 </View>
//               </View>
//             </View>

//             {/* Recent Rating Trend */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Recent rating trend</Text>
//               <View style={styles.trendRow}>
//                 <View style={styles.trendBadge}>
//                   <Text style={styles.trendText}>2.0 ★</Text>
//                 </View>
//                 <View style={styles.trendBadge}>
//                   <Text style={styles.trendText}>1.0 ★</Text>
//                 </View>
//                 <View style={styles.trendBadge}>
//                   <Text style={styles.trendText}>1.0 ★</Text>
//                 </View>
//                 <View style={styles.trendBadge}>
//                   <Text style={styles.trendText}>5.0 ★</Text>
//                 </View>
//                 <View style={styles.trendBadge}>
//                   <Text style={styles.trendText}>5.0 ★</Text>
//                 </View>
//               </View>
//             </View>

//             {/* User Reviews Filter */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>User Reviews</Text>
//               <View style={styles.filterButtons}>
//                 <TouchableOpacity style={styles.filterButtonActive}>
//                   <Text style={styles.filterButtonActiveText}>Relevant</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.filterButtonInactive}>
//                   <Text style={styles.filterButtonInactiveText}>Latest</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.filterButtonInactive}>
//                   <Text style={styles.filterButtonInactiveText}>High to Low</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         );

//       case 'services':
//         return (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Services Offered</Text>
//             {businessData.servicesOffered ? (
//               <View style={styles.servicesContainer}>
//                 {businessData.servicesOffered.split(',').map((service, index) => (
//                   <View key={index} style={styles.serviceChip}>
//                     <Ionicons name="checkmark-circle" size={16} color="#10B981" />
//                     <Text style={styles.serviceText}>{service.trim()}</Text>
//                   </View>
//                 ))}
//               </View>
//             ) : (
//               <Text style={styles.noDataText}>No services information available</Text>
//             )}
//           </View>
//         );

//       case 'quickinfo':
//         return (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Quick Info</Text>

//             {businessData.companyPhone && (
//               <View style={styles.infoRow}>
//                 <View style={styles.infoIcon}>
//                   <Ionicons name="call" size={20} color="#3B82F6" />
//                 </View>
//                 <View style={styles.infoContent}>
//                   <Text style={styles.infoLabel}>Phone</Text>
//                   <Text style={styles.infoValue}>{businessData.companyPhone}</Text>
//                 </View>
//               </View>
//             )}

//             {businessData.companyEmail && (
//               <View style={styles.infoRow}>
//                 <View style={styles.infoIcon}>
//                   <Ionicons name="mail" size={20} color="#3B82F6" />
//                 </View>
//                 <View style={styles.infoContent}>
//                   <Text style={styles.infoLabel}>Email</Text>
//                   <Text style={styles.infoValue}>{businessData.companyEmail}</Text>
//                 </View>
//               </View>
//             )}

//             {businessData.companyWebsite && (
//               <View style={styles.infoRow}>
//                 <View style={styles.infoIcon}>
//                   <Ionicons name="globe" size={20} color="#3B82F6" />
//                 </View>
//                 <View style={styles.infoContent}>
//                   <Text style={styles.infoLabel}>Website</Text>
//                   <Text style={styles.infoValue}>{businessData.companyWebsite}</Text>
//                 </View>
//               </View>
//             )}

//             {businessData.companyAddress && (
//               <View style={styles.infoRow}>
//                 <View style={styles.infoIcon}>
//                   <Ionicons name="location" size={20} color="#3B82F6" />
//                 </View>
//                 <View style={styles.infoContent}>
//                   <Text style={styles.infoLabel}>Address</Text>
//                   <Text style={styles.infoValue}>{businessData.companyAddress}</Text>
//                 </View>
//               </View>
//             )}
//           </View>
//         );

//       case 'photos':
//         return (
//           <View style={styles.section}>
//             <View style={styles.photoHeader}>
//               <Text style={styles.sectionTitle}>Photos</Text>
//               <TouchableOpacity>
//                 <Text style={styles.uploadPhotosText}>⬆ Upload Photos</Text>
//               </TouchableOpacity>
//             </View>
//             <View style={styles.photosGrid}>
//               {businessData.companyPhoto ? (
//                 <Image 
//                   source={{ uri: `https://api-test.instantllycards.com${businessData.companyPhoto}` }}
//                   style={styles.photoLarge}
//                   resizeMode="cover"
//                 />
//               ) : (
//                 <View style={styles.photoPlaceholderLarge}>
//                   <MaterialIcons name="business" size={80} color="#9CA3AF" />
//                   <Text style={styles.noPhotosText}>No photos available</Text>
//                 </View>
//               )}
//             </View>
//           </View>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       {/* Header - Fixed positioning */}
//       <View style={styles.headerContainer}>
//         <View style={styles.header}>
//           <TouchableOpacity 
//             style={styles.backButton} 
//             onPress={() => router.back()}
//             hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//           >
//             <Ionicons name="arrow-back" size={24} color="#1F2937" />
//           </TouchableOpacity>
//           <View style={styles.headerActions}>
//             <TouchableOpacity style={styles.headerIconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
//               <Ionicons name="search" size={24} color="#1F2937" />
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.headerIconButton} onPress={handleShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
//               <Ionicons name="share-social" size={24} color="#1F2937" />
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.headerIconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
//               <Ionicons name="ellipsis-vertical" size={24} color="#1F2937" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>

//       <ScrollView 
//         style={styles.content}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Business Header Section */}
//         <View style={styles.businessHeader}>
//           <View style={styles.businessHeaderTop}>
//             {businessData.companyPhoto ? (
//               <Image 
//                 source={{ uri: `https://api-test.instantllycards.com${businessData.companyPhoto}` }}
//                 style={styles.businessImage}
//                 resizeMode="cover"
//               />
//             ) : (
//               <View style={styles.businessImagePlaceholder}>
//                 <MaterialIcons name="business" size={40} color="#9CA3AF" />
//               </View>
//             )}
//           </View>

//           <View style={styles.businessInfo}>
//             <View style={styles.thumbNameRow}>
//               <MaterialIcons name="thumb-up" size={18} color="#1F2937" />
//               <Text style={styles.businessName} numberOfLines={2}>
//                 {businessData.companyName}
//               </Text>
//             </View>

//             <View style={styles.ratingRow}>
//               <View style={styles.ratingBadge}>
//                 <Text style={styles.ratingBadgeText}>3.7 ★</Text>
//               </View>
//               <Text style={styles.ratingsText}>95 Ratings</Text>
//               {businessData.isVerified && (
//                 <View style={styles.verifiedBadge}>
//                   <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
//                 </View>
//               )}
//             </View>

//             <Text style={styles.addressSmall} numberOfLines={1}>
//               {businessData.companyAddress ? 
//                 `${businessData.companyAddress.substring(0, 35)}... • 🚗 126 min • 41.7 km` : 
//                 'Address not available'
//               }
//             </Text>

//             <Text style={styles.categoryText}>
//               {`Hospitals${yearsInBusiness && yearsInBusiness > 0 ? ` • ${yearsInBusiness} ${yearsInBusiness === 1 ? 'Year' : 'Years'} in Business` : ''}`}
//             </Text>
//           </View>
//         </View>

//         {/* Quick Actions - 4 Buttons */}
//         <View style={styles.quickActions}>
//           <TouchableOpacity style={styles.quickActionButton} onPress={handleCall}>
//             <View style={styles.quickActionIcon}>
//               <Ionicons name="call" size={24} color="#3B82F6" />
//             </View>
//             <Text style={styles.quickActionLabel}>Call</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.quickActionButton} onPress={handleWhatsApp}>
//             <View style={styles.quickActionIcon}>
//               <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
//             </View>
//             <Text style={styles.quickActionLabel}>WhatsApp</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.quickActionButton} onPress={handleEnquiry}>
//             <View style={styles.quickActionIcon}>
//               <Ionicons name="chatbox-outline" size={24} color="#1F2937" />
//             </View>
//             <Text style={styles.quickActionLabel}>Enquiry</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.quickActionButton} onPress={handleDirection}>
//             <View style={styles.quickActionIcon}>
//               <Ionicons name="navigate" size={24} color="#1F2937" />
//             </View>
//             <Text style={styles.quickActionLabel}>Direction</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Tabs */}
//         <View style={styles.tabsContainer}>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             <TouchableOpacity 
//               style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
//               onPress={() => setActiveTab('overview')}
//             >
//               <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
//                 Overview
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
//               onPress={() => setActiveTab('reviews')}
//             >
//               <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
//                 Reviews
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={[styles.tab, activeTab === 'services' && styles.tabActive]}
//               onPress={() => setActiveTab('services')}
//             >
//               <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
//                 Services
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={[styles.tab, activeTab === 'quickinfo' && styles.tabActive]}
//               onPress={() => setActiveTab('quickinfo')}
//             >
//               <Text style={[styles.tabText, activeTab === 'quickinfo' && styles.tabTextActive]}>
//                 Quick Info
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
//               onPress={() => setActiveTab('photos')}
//             >
//               <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
//                 Photos
//               </Text>
//             </TouchableOpacity>
//           </ScrollView>
//         </View>

//         {/* Tab Content */}
//         {renderTabContent()}

//         {/* Bottom Padding for sticky bar */}
//         <View style={{ height: 80 }} />
//       </ScrollView>

//       {/* Bottom Sticky Action Bar */}
//       <View style={styles.bottomBar}>
//         <TouchableOpacity style={styles.bottomActionButton} onPress={handleCall}>
//           <Ionicons name="call" size={18} color="#fff" />
//           <Text style={styles.bottomActionText}>Call Now</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.bottomActionButton} onPress={handleEnquiry}>
//           <Text style={styles.bottomActionText}>Enquire Now</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.bottomActionButtonWhatsApp} onPress={handleWhatsApp}>
//           <Ionicons name="logo-whatsapp" size={18} color="#fff" />
//           <Text style={styles.bottomActionText}>WhatsApp</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   headerContainer: {
//     backgroundColor: '#fff',
//     paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 3,
//       },
//       android: {
//         elevation: 4,
//       },
//     }),
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingTop: 12,
//     paddingBottom: 12,
//     backgroundColor: '#fff',
//     minHeight: 56,
//   },
//   backButton: {
//     padding: 4,
//     minWidth: 32,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerActions: {
//     flexDirection: 'row',
//     gap: 16,
//   },
//   headerIconButton: {
//     padding: 4,
//     minWidth: 32,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   content: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 20,
//   },
//   businessHeader: {
//     backgroundColor: '#fff',
//     paddingBottom: 16,
//   },
//   businessHeaderTop: {
//     paddingHorizontal: 16,
//     paddingTop: 16,
//   },
//   businessImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 8,
//   },
//   businessImagePlaceholder: {
//     width: 80,
//     height: 80,
//     borderRadius: 8,
//     backgroundColor: '#F3F4F6',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   businessInfo: {
//     paddingHorizontal: 16,
//     paddingTop: 12,
//   },
//   thumbNameRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: 6,
//     marginBottom: 8,
//   },
//   businessName: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1F2937',
//     flex: 1,
//     lineHeight: 26,
//   },
//   ratingRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     marginBottom: 8,
//     flexWrap: 'wrap',
//   },
//   ratingBadge: {
//     backgroundColor: '#16A34A',
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 4,
//   },
//   ratingBadgeText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '700',
//   },
//   ratingsText: {
//     fontSize: 14,
//     color: '#6B7280',
//   },
//   verifiedBadge: {
//     backgroundColor: '#DBEAFE',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   verifiedBadgeText: {
//     color: '#3B82F6',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   addressSmall: {
//     fontSize: 13,
//     color: '#6B7280',
//     marginBottom: 4,
//     lineHeight: 18,
//   },
//   categoryText: {
//     fontSize: 13,
//     color: '#6B7280',
//     lineHeight: 18,
//   },
//   quickActions: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     justifyContent: 'space-around',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   quickActionButton: {
//     alignItems: 'center',
//     minWidth: width * 0.2,
//   },
//   quickActionIcon: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#F3F4F6',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 6,
//   },
//   quickActionLabel: {
//     fontSize: 13,
//     color: '#1F2937',
//     fontWeight: '500',
//   },
//   tabsContainer: {
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   tab: {
//     paddingHorizontal: 20,
//     paddingVertical: 14,
//     borderBottomWidth: 2,
//     borderBottomColor: 'transparent',
//     minHeight: 50,
//     justifyContent: 'center',
//   },
//   tabActive: {
//     borderBottomColor: '#1F2937',
//   },
//   tabText: {
//     fontSize: 15,
//     color: '#6B7280',
//     fontWeight: '500',
//   },
//   tabTextActive: {
//     color: '#1F2937',
//     fontWeight: '700',
//   },
//   section: {
//     backgroundColor: '#fff',
//     paddingHorizontal: 16,
//     paddingVertical: 20,
//     marginTop: 8,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: 16,
//   },
//   starRatingRow: {
//     flexDirection: 'row',
//     gap: 8,
//     flexWrap: 'wrap',
//   },
//   addressText: {
//     fontSize: 15,
//     color: '#1F2937',
//     lineHeight: 22,
//     marginBottom: 12,
//   },
//   addressActions: {
//     flexDirection: 'row',
//     gap: 16,
//   },
//   directionLink: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingVertical: 4,
//   },
//   directionText: {
//     color: '#3B82F6',
//     fontSize: 15,
//     fontWeight: '600',
//   },
//   copyLink: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingVertical: 4,
//   },
//   copyText: {
//     color: '#3B82F6',
//     fontSize: 15,
//     fontWeight: '600',
//   },
//   photoHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   uploadPhotosText: {
//     color: '#3B82F6',
//     fontSize: 15,
//     fontWeight: '600',
//   },
//   photosGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   photoThumbnail: {
//     width: (width - 48) / 3,
//     height: (width - 48) / 3,
//     borderRadius: 8,
//   },
//   photoPlaceholder: {
//     width: (width - 48) / 3,
//     height: (width - 48) / 3,
//     borderRadius: 8,
//     backgroundColor: '#F3F4F6',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   photoLarge: {
//     width: '100%',
//     height: 200,
//     borderRadius: 8,
//   },
//   photoPlaceholderLarge: {
//     width: '100%',
//     height: 200,
//     borderRadius: 8,
//     backgroundColor: '#F3F4F6',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   noPhotosText: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#9CA3AF',
//   },
//   ratingsSummary: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 16,
//   },
//   ratingBox: {
//     width: 70,
//     height: 70,
//     backgroundColor: '#16A34A',
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   ratingNumber: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   ratingsInfo: {
//     flex: 1,
//   },
//   ratingsTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: 4,
//   },
//   ratingsSubtitle: {
//     fontSize: 13,
//     color: '#6B7280',
//     lineHeight: 18,
//   },
//   trendRow: {
//     flexDirection: 'row',
//     gap: 8,
//     flexWrap: 'wrap',
//   },
//   trendBadge: {
//     backgroundColor: '#F3F4F6',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 20,
//   },
//   trendText: {
//     fontSize: 14,
//     color: '#1F2937',
//     fontWeight: '600',
//   },
//   filterButtons: {
//     flexDirection: 'row',
//     gap: 8,
//     flexWrap: 'wrap',
//   },
//   filterButtonActive: {
//     backgroundColor: '#EFF6FF',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#3B82F6',
//   },
//   filterButtonActiveText: {
//     color: '#3B82F6',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   filterButtonInactive: {
//     backgroundColor: '#fff',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   filterButtonInactiveText: {
//     color: '#6B7280',
//     fontSize: 14,
//   },
//   servicesContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 10,
//   },
//   serviceChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#DCFCE7',
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 20,
//   },
//   serviceText: {
//     fontSize: 15,
//     color: '#166534',
//     marginLeft: 6,
//     fontWeight: '500',
//   },
//   noDataText: {
//     fontSize: 15,
//     color: '#9CA3AF',
//     fontStyle: 'italic',
//   },
//   infoRow: {
//     flexDirection: 'row',
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   infoIcon: {
//     width: 40,
//     alignItems: 'flex-start',
//     justifyContent: 'flex-start',
//     paddingTop: 2,
//   },
//   infoContent: {
//     flex: 1,
//   },
//   infoLabel: {
//     fontSize: 14,
//     color: '#9CA3AF',
//     marginBottom: 4,
//   },
//   infoValue: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#1F2937',
//     lineHeight: 22,
//   },
//   bottomBar: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     paddingBottom: Platform.OS === 'ios' ? 10 : 10,
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//     gap: 8,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: -2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 8,
//       },
//     }),
//   },
//   bottomActionButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#3B82F6',
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 6,
//     minHeight: 44,
//   },
//   bottomActionButtonWhatsApp: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#25D366',
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 6,
//     minHeight: 44,
//   },
//   bottomActionText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#fff',
//   },
// });

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;


// ADD THIS HELPER FUNCTION:
const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

export default function BusinessCardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  console.log('🆔 DETAIL SCREEN ID:', id);

  /* ==============================
     FETCH BUSINESS
  =============================== */
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['business-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/business-listings/${id}`);
      console.log('📦 API RESPONSE:', res.data);
      return res.data;
    },
  });

  const business = data;

  /* ==============================
     TRACKING
  =============================== */
  const trackClick = async () => {
    if (!id) return;
    try {
      await api.post(`/business-listings/${id}/click`);
    } catch { }
  };

  const trackLead = async () => {
    if (!id) return;
    try {
      await api.post(`/business-listings/${id}/lead`);
    } catch { }
  };

  /* ==============================
     VISIBILITY LOGIC
  =============================== */
  const showCall = !!business?.phone;
  const showWhatsApp = !!(business?.whatsapp || business?.phone);
  const showDirection = !!business?.city;

  /* ==============================
     ACTIONS
  =============================== */
  const handleCall = async () => {
    if (!business?.phone) return;
    await trackClick();
    await trackLead();
    Linking.openURL(`tel:${business.phone}`);
  };

  const handleWhatsApp = async () => {
    const phone = business?.whatsapp || business?.phone;
    if (!phone) return;
    await trackClick();
    await trackLead();
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}`);
  };

  const handleDirection = async () => {
    if (!business?.city) return;
    await trackClick();

    const address = encodeURIComponent(
      `${business.area || ''}, ${business.city}, ${business.state || ''}`
    );

    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`,
    });

    if (url) Linking.openURL(url);
  };

  const handleEnquiry = async () => {
    await trackLead();
    console.log('Enquiry clicked');
  };

  const handleShare = () => {
    console.log('Share clicked');
  };

  const handleEmail = () => {
    if (business?.email) {
      Linking.openURL(`mailto:${business.email}`);
    }
  };

  const handleWebsite = () => {
    if (business?.website) {
      const url = business.website.startsWith('http')
        ? business.website
        : `https://${business.website}`;
      Linking.openURL(url);
    }
  };

  /* ==============================
     LOADING
  =============================== */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  if (isError || !business) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Failed to load business</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /* ==============================
     DERIVED VALUES
  =============================== */
  const fullAddress = [
    business.plotNo,
    business.streetName,
    business.area,
    business.city,
    business.state
  ].filter(Boolean).join(', ');

  const yearsInBusiness = business.createdAt
    ? new Date().getFullYear() - new Date(business.createdAt).getFullYear()
    : null;

  /* ==============================
     TAB CONTENT
  =============================== */
  const renderStarRating = () => {
    return (
      <View style={styles.starRatingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
            <Ionicons name="star-outline" size={40} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View>
            {/* Start a Review */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Start a review</Text>
              {renderStarRating()}
            </View>

            {/* Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>
              <Text style={styles.addressText}>
                {fullAddress || 'Address not available'}
              </Text>
              <View style={styles.addressActions}>
                <TouchableOpacity style={styles.directionLink} onPress={handleDirection}>
                  <Ionicons name="navigate" size={16} color="#3B82F6" />
                  <Text style={styles.directionText}>Direction</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.copyLink}>
                  <Ionicons name="copy-outline" size={16} color="#3B82F6" />
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Photos */}
            <View style={styles.section}>
              <View style={styles.photoHeader}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <TouchableOpacity>
                  <Text style={styles.uploadPhotosText}>⬆ Upload Photos</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.photosGrid}>
                {business.media && business.media.length > 0 ? (
                  business.media.slice(0, 6).map((mediaItem: any, index: number) => (
                    <Image
                      key={index}
                      source={{ uri: getImageUrl(mediaItem.url) }}
                      style={styles.photoThumbnail}
                      resizeMode="cover"
                    />
                  ))
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <MaterialIcons name="business" size={40} color="#9CA3AF" />
                  </View>
                )}
              </View>
            </View>
          </View>
        );

      case 'reviews':
        return (
          <View>
            {/* Start a Review */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Start a review</Text>
              {renderStarRating()}
            </View>

            {/* Reviews & Ratings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
              <View style={styles.ratingsSummary}>
                <View style={styles.ratingBox}>
                  <Text style={styles.ratingNumber}>3.7</Text>
                </View>
                <View style={styles.ratingsInfo}>
                  <Text style={styles.ratingsTitle}>95 Ratings</Text>
                  <Text style={styles.ratingsSubtitle}>
                    Jd rating index based on 95 ratings across the web
                  </Text>
                </View>
              </View>
            </View>

            {/* Recent Rating Trend */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent rating trend</Text>
              <View style={styles.trendRow}>
                <View style={styles.trendBadge}>
                  <Text style={styles.trendText}>2.0 ★</Text>
                </View>
                <View style={styles.trendBadge}>
                  <Text style={styles.trendText}>1.0 ★</Text>
                </View>
                <View style={styles.trendBadge}>
                  <Text style={styles.trendText}>1.0 ★</Text>
                </View>
                <View style={styles.trendBadge}>
                  <Text style={styles.trendText}>5.0 ★</Text>
                </View>
                <View style={styles.trendBadge}>
                  <Text style={styles.trendText}>5.0 ★</Text>
                </View>
              </View>
            </View>

            {/* User Reviews Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>User Reviews</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity style={styles.filterButtonActive}>
                  <Text style={styles.filterButtonActiveText}>Relevant</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButtonInactive}>
                  <Text style={styles.filterButtonInactiveText}>Latest</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButtonInactive}>
                  <Text style={styles.filterButtonInactiveText}>High to Low</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'services':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Offered</Text>
            {business.category && business.category.length > 0 ? (
              <View style={styles.servicesContainer}>
                {business.category.map((service: string, index: number) => (
                  <View key={index} style={styles.serviceChip}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.serviceText}>{service.trim()}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No services information available</Text>
            )}
          </View>
        );

      case 'quickinfo':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Info</Text>

            {business.phone && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="call" size={20} color="#3B82F6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{business.phone}</Text>
                </View>
              </View>
            )}

            {business.email && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="mail" size={20} color="#3B82F6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{business.email}</Text>
                </View>
              </View>
            )}

            {business.website && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="globe" size={20} color="#3B82F6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Website</Text>
                  <Text style={styles.infoValue}>{business.website}</Text>
                </View>
              </View>
            )}

            {fullAddress && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="location" size={20} color="#3B82F6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{fullAddress}</Text>
                </View>
              </View>
            )}
          </View>
        );

      case 'photos':
        return (
          <View style={styles.section}>
            <View style={styles.photoHeader}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <TouchableOpacity>
                <Text style={styles.uploadPhotosText}>⬆ Upload Photos</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.photosGrid}>
              {business.media && business.media.length > 0 ? (
                business.media.map((mediaItem: any, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: getImageUrl(mediaItem.url) }}
                    style={styles.photoLarge}
                    resizeMode="cover"
                  />
                ))
              ) : (
                <View style={styles.photoPlaceholderLarge}>
                  <MaterialIcons name="business" size={80} color="#9CA3AF" />
                  <Text style={styles.noPhotosText}>No photos available</Text>
                </View>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  /* ==============================
     UI
  =============================== */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="search" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} onPress={handleShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="share-social" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="ellipsis-vertical" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Business Header Section */}
        <View style={styles.businessHeader}>
          <View style={styles.businessHeaderTop}>
            {business.media && business.media.length > 0 ? (
              <Image
                source={{ uri: getImageUrl(business.media[0].url) }}
                style={styles.businessImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.businessImagePlaceholder}>
                <MaterialIcons name="business" size={40} color="#9CA3AF" />
              </View>
            )}
          </View>

          <View style={styles.businessInfo}>
            <View style={styles.thumbNameRow}>
              <MaterialIcons name="thumb-up" size={18} color="#1F2937" />
              <Text style={styles.businessName} numberOfLines={2}>
                {business.businessName}
              </Text>
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>3.7 ★</Text>
              </View>
              <Text style={styles.ratingsText}>95 Ratings</Text>
              {business.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                </View>
              )}
            </View>

            <Text style={styles.addressSmall} numberOfLines={1}>
              {fullAddress ?
                `${fullAddress.substring(0, 35)}${fullAddress.length > 35 ? '...' : ''}` :
                'Address not available'
              }
            </Text>

            <Text style={styles.categoryText}>
              {business.category?.join(', ') || 'Category'}
              {yearsInBusiness && yearsInBusiness > 0 ? ` • ${yearsInBusiness} ${yearsInBusiness === 1 ? 'Year' : 'Years'} in Business` : ''}
            </Text>
          </View>
        </View>

        {/* Quick Actions - 4 Buttons */}
        <View style={styles.quickActions}>
          {showCall && (
            <TouchableOpacity style={styles.quickActionButton} onPress={handleCall}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="call" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.quickActionLabel}>Call</Text>
            </TouchableOpacity>
          )}

          {showWhatsApp && (
            <TouchableOpacity style={styles.quickActionButton} onPress={handleWhatsApp}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <Text style={styles.quickActionLabel}>WhatsApp</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.quickActionButton} onPress={handleEnquiry}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="chatbox-outline" size={24} color="#1F2937" />
            </View>
            <Text style={styles.quickActionLabel}>Enquiry</Text>
          </TouchableOpacity>

          {showDirection && (
            <TouchableOpacity style={styles.quickActionButton} onPress={handleDirection}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="navigate" size={24} color="#1F2937" />
              </View>
              <Text style={styles.quickActionLabel}>Direction</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                Reviews
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'services' && styles.tabActive]}
              onPress={() => setActiveTab('services')}
            >
              <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
                Services
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'quickinfo' && styles.tabActive]}
              onPress={() => setActiveTab('quickinfo')}
            >
              <Text style={[styles.tabText, activeTab === 'quickinfo' && styles.tabTextActive]}>
                Quick Info
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
              onPress={() => setActiveTab('photos')}
            >
              <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
                Photos
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Bottom Padding for sticky bar */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        {showCall && (
          <TouchableOpacity style={styles.bottomActionButton} onPress={handleCall}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.bottomActionText}>Call Now</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.bottomActionButton} onPress={handleEnquiry}>
          <Text style={styles.bottomActionText}>Enquire Now</Text>
        </TouchableOpacity>

        {showWhatsApp && (
          <TouchableOpacity style={styles.bottomActionButtonWhatsApp} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.bottomActionText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    minHeight: 56,
  },
  backButton: {
    padding: 4,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIconButton: {
    padding: 4,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  businessHeader: {
    backgroundColor: '#fff',
    paddingBottom: 16,
  },
  businessHeaderTop: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  businessImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  businessImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessInfo: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  thumbNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    lineHeight: 26,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  ratingsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  verifiedBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  addressSmall: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  categoryText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickActionButton: {
    alignItems: 'center',
    minWidth: width * 0.2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: 50,
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomColor: '#1F2937',
  },
  tabText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1F2937',
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  starRatingRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  addressText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 12,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 16,
  },
  directionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  directionText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  copyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  copyText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadPhotosText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumbnail: {
    width: (width - 48) / 3,
    height: (width - 48) / 3,
    borderRadius: 8,
  },
  photoPlaceholder: {
    width: (width - 48) / 3,
    height: (width - 48) / 3,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLarge: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  photoPlaceholderLarge: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotosText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  ratingsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingBox: {
    width: 70,
    height: 70,
    backgroundColor: '#16A34A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  ratingsInfo: {
    flex: 1,
  },
  ratingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingsSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  trendRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  trendBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  trendText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButtonActive: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  filterButtonActiveText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonInactive: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonInactiveText: {
    color: '#6B7280',
    fontSize: 14,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  serviceText: {
    fontSize: 15,
    color: '#166534',
    marginLeft: 6,
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 22,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    minHeight: 44,
  },
  bottomActionButtonWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    minHeight: 44,
  },
  bottomActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

