import React, { useState, useCallback, useEffect } from 'react';
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
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getCurrentUser, getCurrentUserId } from '@/lib/useUser';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showEnquirySuccess, setShowEnquirySuccess] = useState(false);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiriesData, setEnquiriesData] = useState<any>(null);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  // Enquiry form state
  const [enquiryForm, setEnquiryForm] = useState({
    subject: '',
    message: '',
    phone: '',
    email: '',
  });

  console.log('🆔 DETAIL SCREEN ID:', id);

  /* ==============================
     FETCH BUSINESS
  =============================== */
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['business-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/business-listings/${id}`);
      // console.log('📦 API RESPONSE:', res.data);
      return res.data;
    },
  });

  /* ==============================
     FETCH REVIEWS
  =============================== */
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ['reviews', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/reviews/${id}/reviews?sort=latest&limit=20`);
      return res || { reviews: [], stats: { averageRating: 0, totalReviews: 0 } };
    },
    staleTime: 2 * 60 * 1000,
  });




  const business = data;
  const reviews = reviewsData?.reviews || [];
  const stats = reviewsData?.stats;
  const currentUserId = user?._id || user?.id;
  const userReview = React.useMemo(() => {
    if (!currentUserId || !reviews?.length) return null;

    return reviews.find((r: any) => {
      const reviewUserId =
        typeof r.userId === 'object'
          ? r.userId?._id
          : r.userId;

      return reviewUserId?.toString() === currentUserId?.toString();
    }) || null;
  }, [reviews, currentUserId]);

  // 👇 ADD DEBUG HERE
  useEffect(() => {
    console.log("DEBUG AFTER LOAD:", {
      userId: currentUserId,
      reviews,
      reviewsData,
      userReview
    });

  }, [reviewsData, userReview, currentUserId]);

  useEffect(() => {
    const loadUserId = async () => {
      const id = await getCurrentUserId();
      console.log("currentUserId:", id);
      
    };



    loadUserId();
    

  }, []);



  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((u) => {
        if (mounted) setUser(u);
      })
      .catch(() => {
        if (mounted) setUser(null);
      });
    return () => {
      mounted = false;
    };
  }, []);


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
    setShowEnquiryModal(true);
  };

  const handleEnquiryConfirm = async () => {
    setEnquiryLoading(true);
    try {
      await trackLead();

      const { subject, message, phone, email } = enquiryForm;
      if (!subject.trim() || !message.trim() || !phone.trim()) {
        Alert.alert('Validation', 'Please fill subject, message, and phone number.');
        setEnquiryLoading(false);
        return;
      }

      console.log('📨 [ENQUIRY API] Sending enquiry:', {
        businessId: id,
        subject: subject.substring(0, 50),
        messageLength: message.length,
        phone: phone.replace(/\d{6}/, 'XXXXXX'),
        hasEmail: !!email?.trim(),
      });

      // Call backend enquiry endpoint
      const response = await api.post(`/enquiries/${id}/enquiry`, {
        subject: subject.trim(),
        message: message.trim(),
        phone: phone.trim(),
        email: email?.trim() || undefined,
      });

      console.log('✅ [ENQUIRY API SUCCESS]', {
        businessId: id,
        enquiryId: response?.data?.enquiry?._id,
        status: response?.data?.enquiry?.status,
        createdAt: response?.data?.enquiry?.createdAt,
      });

      setShowEnquiryModal(false);
      setShowEnquirySuccess(true);
      setEnquiryForm({ subject: '', message: '', phone: '', email: '' });
      // Auto-close success modal after 2 seconds
      setTimeout(() => {
        setShowEnquirySuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('❌ [ENQUIRY API ERROR]', {
        businessId: id,
        error: error?.message,
        errorCode: error?.data?.error,
        status: error?.status,
        fullError: error?.data,
      });
      Alert.alert('Error', error?.message || 'Failed to send enquiry. Please try again.');
    } finally {
      setEnquiryLoading(false);
    }
  };

  const handleEnquiryCancel = () => {
    setShowEnquiryModal(false);
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
     COMPUTED VALUES
  =============================== */
  const fullAddress = business ? `${business.area || ''} ${business.city || ''} ${business.state || ''}`.trim() : '';
  const yearsInBusiness = business?.yearEstablished ? new Date().getFullYear() - business.yearEstablished : 0;


  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View>
            {/* Start a Review */}
            {/* Start a Review */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Start a review</Text>
              <TouchableOpacity
                style={styles.startReviewButton}
                onPress={() => router.push(`/businessCard/${id}/reviews`)}
              >
                <View style={styles.startReviewStars}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <Ionicons
                      key={i}
                      name={i < (userReview?.rating || 0) ? 'star' : 'star-outline'}
                      size={28}
                      color={i < (userReview?.rating || 0) ? '#FBBF24' : '#D1D5DB'}
                    />
                  ))}
                </View>
                {userReview ? (
                  <>
                    <Text style={styles.startReviewHint}>{userReview.title || 'Your review'}</Text>
                    <Text style={styles.startReviewHint}>
                      {new Date(userReview.createdAt).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity onPress={() => router.push(`/businessCard/${id}/reviews`)}>
                      <Text style={styles.startReviewHint}>Edit Review</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.startReviewHint}>Tap to rate & review</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>
              <Text style={styles.addressText}>
                {fullAddress || 'Address not available'}
              </Text>
            </View>

            {/* Photos */}
            <View style={styles.section}>
              <View style={styles.photoHeader}>
                <Text style={styles.sectionTitle}>Photos</Text>
              </View>
              <View style={styles.photosGrid}>
                {business?.media && business.media.length > 0 ? (
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
            {/* Write Review Button */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={() => router.push(`/businessCard/${id}/reviews`)}
              >
                <Ionicons name="star-outline" size={20} color="#fff" />
                <Text style={styles.writeReviewButtonText}>{userReview ? 'Edit Your Review' : 'Write a Review'}</Text>
              </TouchableOpacity>
            </View>

            {/* User's own review summary or empty */}
            <View style={styles.section}>
              {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Customer Reviews</Text>
                  <View style={styles.reviewStatsContainer}>
                    <View style={styles.ratingsSummary}>
                      <View style={styles.ratingBox}>
                        <Text style={styles.ratingNumber}>
                          {Number(stats?.averageRating ?? 0).toFixed(1)}
                        </Text>
                      </View>
                      <View style={styles.ratingsInfo}>
                        <Text style={styles.ratingsTitle}>
                          {stats?.totalReviews ?? 0} Reviews
                        </Text>
                        <Text style={styles.ratingsSubtitle}>Based on customer feedback</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.viewAllReviewsButton}
                    onPress={() => router.push(`/businessCard/${id}/reviews`)}
                  >
                    <Text style={styles.viewAllReviewsText}>View All Reviews</Text>
                    <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptyReviewContainer}>
                  <Ionicons name="star-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyReviewTitle}>No reviews yet</Text>
                  <Text style={styles.emptyReviewText}>
                    Be the first to share your experience!
                  </Text>
                </View>
              )}
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
            </View>

            <View style={styles.photosGrid}>
              {business?.media && business.media.length > 0 ? (
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
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !business) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Business not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


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
            <TouchableOpacity style={styles.headerIconButton} onPress={handleShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="share-social" size={24} color="#1F2937" />
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
            {business?.media && business.media.length > 0 ? (
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
                {business?.businessName || ''}
              </Text>
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>
                  {Number(stats?.averageRating ?? 0).toFixed(1)} ★
                </Text>
              </View>
              <Text style={styles.ratingsText}>
                {stats?.totalReviews ?? 0} Ratings
              </Text>
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

        {showWhatsApp && (
          <TouchableOpacity style={styles.bottomActionButtonWhatsApp} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.bottomActionText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Enquiry Form Modal */}
      <Modal
        visible={showEnquiryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleEnquiryCancel}
      >
        <SafeAreaView style={styles.enquiryModalContainer}>
          <ScrollView style={styles.enquiryModalScroll} showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.enquiryModalHeader}>
              <TouchableOpacity onPress={handleEnquiryCancel}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.enquiryModalTitle}>Send Enquiry</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Business Info */}
            <View style={styles.enquiryBusinessInfo}>
              <View style={styles.enquiryBusiness}>
                <Text style={styles.enquiryBusinessLabel}>Enquiry for</Text>
                <Text style={styles.enquiryBusinessName} numberOfLines={1}>
                  {business?.businessName || 'Business'}
                </Text>
              </View>
            </View>

            {/* Subject */}
            <View style={styles.enquiryFormField}>
              <Text style={styles.enquiryLabel}>Subject *</Text>
              <TextInput
                style={styles.enquiryInput}
                placeholder="What is your enquiry about?"
                placeholderTextColor="#9CA3AF"
                value={enquiryForm.subject}
                onChangeText={(text) => setEnquiryForm({ ...enquiryForm, subject: text })}
                maxLength={100}
              />
              <Text style={styles.charCount}>{enquiryForm.subject.length}/100</Text>
            </View>

            {/* Message */}
            <View style={styles.enquiryFormField}>
              <Text style={styles.enquiryLabel}>Message *</Text>
              <TextInput
                style={[styles.enquiryInput, styles.enquiryMessageInput]}
                placeholder="Please provide details about your enquiry..."
                placeholderTextColor="#9CA3AF"
                value={enquiryForm.message}
                onChangeText={(text) => setEnquiryForm({ ...enquiryForm, message: text })}
                maxLength={1000}
                multiline
              />
              <Text style={styles.charCount}>{enquiryForm.message.length}/1000</Text>
            </View>

            {/* Phone */}
            <View style={styles.enquiryFormField}>
              <Text style={styles.enquiryLabel}>Phone Number *</Text>
              <TextInput
                style={styles.enquiryInput}
                placeholder="+91 9876543210"
                placeholderTextColor="#9CA3AF"
                value={enquiryForm.phone}
                onChangeText={(text) => setEnquiryForm({ ...enquiryForm, phone: text })}
                keyboardType="phone-pad"
                maxLength={20}
              />
              <Text style={styles.charCount}>{enquiryForm.phone.length}/20</Text>
            </View>

            {/* Email */}
            <View style={styles.enquiryFormField}>
              <Text style={styles.enquiryLabel}>Email (Optional)</Text>
              <TextInput
                style={styles.enquiryInput}
                placeholder="your@email.com"
                placeholderTextColor="#9CA3AF"
                value={enquiryForm.email}
                onChangeText={(text) => setEnquiryForm({ ...enquiryForm, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={100}
              />
              <Text style={styles.charCount}>{enquiryForm.email.length}/100</Text>
            </View>

            {/* Submit Button */}
            <View style={styles.enquiryFormActions}>
              <TouchableOpacity
                style={[styles.enquiryCancelButton]}
                onPress={handleEnquiryCancel}
                disabled={enquiryLoading}
              >
                <Text style={styles.enquiryCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.enquirySubmitButton,
                  (enquiryLoading || !enquiryForm.subject.trim() || !enquiryForm.message.trim() || !enquiryForm.phone.trim())
                  && styles.enquiryButtonDisabled
                ]}
                onPress={handleEnquiryConfirm}
                disabled={enquiryLoading || !enquiryForm.subject.trim() || !enquiryForm.message.trim() || !enquiryForm.phone.trim()}
              >
                {enquiryLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.enquirySubmitText}>Send Enquiry</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Enquiry Success Modal */}
      <Modal
        visible={showEnquirySuccess}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEnquirySuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successHeader}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>

            <Text style={styles.successTitle}>Enquiry Sent!</Text>

            <Text style={styles.successDescription}>
              Your enquiry has been successfully sent to {business?.businessName}. {'\n\n'}
              <Text style={styles.successSubtext}>
                They will contact you  shortly.
              </Text>
            </Text>

            <TouchableOpacity
              style={styles.successCloseButton}
              onPress={() => setShowEnquirySuccess(false)}
            >
              <Text style={styles.successCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  visitReviewButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  visitReviewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
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
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    marginBottom: 16,
  },
  successHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  /* Review Styles */
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  writeReviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  reviewStatsContainer: {
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 0,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  reviewMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewPhotos: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  reviewPhotoThumbnail: {
    width: (width - 56) / 3,
    height: (width - 56) / 3,
    borderRadius: 6,
  },
  ownerReplyBox: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  ownerReplyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  ownerReplyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  helpfulText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  /* Write Review Modal Styles */
  writeReviewModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  writeReviewModalScroll: {
    flex: 1,
  },
  writeReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  writeReviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  writeReviewSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginVertical: 8,
  },
  writeReviewLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  writeReviewSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  ratingSelectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  ratingOption: {
    alignItems: 'center',
    padding: 8,
  },
  ratingOptionSelected: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  suggestionChipSelected: {
    backgroundColor: '#FFB800',
    borderColor: '#FF9800',
  },
  suggestionEmoji: {
    fontSize: 16,
  },
  suggestionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  suggestionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  reviewTitleInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 6,
  },
  reviewMessageInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 6,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  submitReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  submitReviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  /* Enquiry Modal Styles */
  enquiryModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  enquiryModalScroll: {
    flex: 1,
  },
  enquiryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  enquiryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  enquiryBusinessInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  enquiryBusiness: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  enquiryBusinessLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
    fontWeight: '500',
  },
  enquiryBusinessName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  enquiryFormField: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 8,
  },
  enquiryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  enquiryInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 6,
  },
  enquiryMessageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  enquiryFormActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginVertical: 8,
  },
  enquiryCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  enquiryCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  enquirySubmitButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 8,
  },
  enquirySubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  enquiryButtonDisabled: {
    opacity: 0.5,
  },

  successSubtext: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },

  successCloseButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },

  successCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  viewAllReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
  },
  viewAllReviewsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyReviewContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyReviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyReviewText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  startReviewButton: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  startReviewStars: {
    flexDirection: 'row',
    gap: 6,
  },
  startReviewHint: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
