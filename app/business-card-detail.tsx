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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function BusinessCardDetailScreen() {
  const params = useLocalSearchParams();
  const [isSaved, setIsSaved] = useState(false);

  // Mock data - Replace with actual data from params or API
  const businessData = {
    name: params.name || 'Business Name',
    category: params.category || 'Category',
    subcategory: params.subcategory || 'Subcategory',
    phone: params.phone || '+91 9876543210',
    email: params.email || 'business@example.com',
    website: 'www.business.com',
    address: '123 Main Street, City, State - 123456',
    description: 'Professional services provider with years of experience in the industry. We offer quality services to all our customers.',
    rating: '4.5',
    reviews: 128,
    verified: true,
    hours: 'Mon-Sat: 9:00 AM - 6:00 PM',
    established: '2015',
    services: ['Service 1', 'Service 2', 'Service 3', 'Service 4'],
  };

  const handleCall = () => {
    Linking.openURL(`tel:${businessData.phone}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${businessData.email}`);
  };

  const handleWebsite = () => {
    Linking.openURL(`https://${businessData.website}`);
  };

  const handleDirection = () => {
    // Open maps
    const address = encodeURIComponent(businessData.address);
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`,
    });
    Linking.openURL(url);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share card');
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Details</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Business Card Header */}
        <View style={styles.topSection}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <MaterialIcons name="business" size={56} color="#3B82F6" />
              </View>
              {businessData.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={28} 
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.businessName}>{businessData.name}</Text>
          
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>{businessData.subcategory}</Text>
            <View style={styles.dot} />
            <Text style={styles.categoryText}>{businessData.category}</Text>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#FBBF24" />
              <Text style={styles.rating}>{businessData.rating}</Text>
              <Text style={styles.reviews}>({businessData.reviews} reviews)</Text>
            </View>
            <View style={styles.establishedContainer}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.established}>Est. {businessData.established}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions - Circular Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <View style={[styles.actionCircle, styles.callCircle]}>
              <Ionicons name="call" size={28} color="#16A34A" />
            </View>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <View style={[styles.actionCircle, styles.emailCircle]}>
              <MaterialIcons name="email" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.actionLabel}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDirection}>
            <View style={[styles.actionCircle, styles.directionCircle]}>
              <Ionicons name="navigate" size={28} color="#EF4444" />
            </View>
            <Text style={styles.actionLabel}>Direction</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleWebsite}>
            <View style={[styles.actionCircle, styles.websiteCircle]}>
              <Ionicons name="globe-outline" size={28} color="#9333EA" />
            </View>
            <Text style={styles.actionLabel}>Website</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{businessData.description}</Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="call" size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{businessData.phone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail" size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{businessData.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="globe" size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Website</Text>
              <Text style={styles.infoValue}>{businessData.website}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="location" size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{businessData.address}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="time" size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Business Hours</Text>
              <Text style={styles.infoValue}>{businessData.hours}</Text>
            </View>
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          <View style={styles.servicesContainer}>
            {businessData.services.map((service, index) => (
              <View key={index} style={styles.serviceChip}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Add some bottom padding */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Call Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color="#3B82F6" />
          <Text style={styles.secondaryButtonText}>Share Card</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  topSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  saveButton: {
    padding: 8,
  },
  businessName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 15,
    color: '#6B7280',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 6,
  },
  reviews: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 4,
  },
  establishedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  established: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  callCircle: {
    backgroundColor: '#DCFCE7',
  },
  emailCircle: {
    backgroundColor: '#DBEAFE',
  },
  directionCircle: {
    backgroundColor: '#FEE2E2',
  },
  websiteCircle: {
    backgroundColor: '#F3E8FF',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
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
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
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
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

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

// const { width } = Dimensions.get('window');

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
//           <TouchableOpacity key={star}>
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
      
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity 
//           style={styles.backButton} 
//           onPress={() => router.back()}
//           hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//         >
//           <Ionicons name="arrow-back" size={24} color="#1F2937" />
//         </TouchableOpacity>
//         <View style={styles.headerActions}>
//           <TouchableOpacity style={styles.headerIconButton}>
//             <Ionicons name="search" size={24} color="#1F2937" />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.headerIconButton} onPress={handleShare}>
//             <Ionicons name="share-social" size={24} color="#1F2937" />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.headerIconButton}>
//             <Ionicons name="ellipsis-vertical" size={24} color="#1F2937" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView 
//         style={styles.content}
//         showsVerticalScrollIndicator={false}
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
//               <Text style={styles.businessName}>{businessData.companyName}</Text>
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

//             <Text style={styles.addressSmall}>
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

//         {/* Bottom Padding */}
//         <View style={{ height: 100 }} />
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
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     paddingBottom: 12,
//     backgroundColor: '#fff',
//   },
//   backButton: {
//     padding: 4,
//   },
//   headerActions: {
//     flexDirection: 'row',
//     gap: 16,
//   },
//   headerIconButton: {
//     padding: 4,
//   },
//   content: {
//     flex: 1,
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
//     alignItems: 'center',
//     gap: 6,
//     marginBottom: 8,
//   },
//   businessName: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1F2937',
//     flex: 1,
//   },
//   ratingRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     marginBottom: 8,
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
//   },
//   categoryText: {
//     fontSize: 13,
//     color: '#6B7280',
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
//     minWidth: 70,
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
//     width: 100,
//     height: 100,
//     borderRadius: 8,
//   },
//   photoPlaceholder: {
//     width: 100,
//     height: 100,
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
//   },
//   bottomBar: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     paddingHorizontal: 12,
//     paddingVertical: 10,
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
//   },
//   bottomActionText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#fff',
//   },
// });