/**
 * Single Listing Dashboard
 * Detailed view for a specific business promotion
 * Supports Overview, Media, Performance, Feedback, and Settings tabs
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
  Switch,
  FlatList,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, StatCard, InfoRow, SectionCard } from '../components';
import {
  BusinessPromotion,
  ListingAnalytics,
  ListingResponse,
  AnalyticsResponse,
  ToggleStatusResponse,
} from '../types';
import { isPromotedListing } from '../utils';
import api from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from "expo-image-picker";



const { width } = Dimensions.get('window');

// ADD THIS HELPER FUNCTION HERE:
const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

type TabType = 'overview' | 'media' | 'performance' | 'feedback' | 'settings';

export default function SingleListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // ADD THIS:
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = useState(false);

  // Feedback states
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [respondModalVisible, setRespondModalVisible] = useState(false);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [respondText, setRespondText] = useState('');
  const [upgradeCheckpointVisible, setUpgradeCheckpointVisible] = useState(false);

  if (!id) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Invalid listing ID</Text>
      </SafeAreaView>
    );
  }



  // Fetch listing details
  const {
    data: listingData,
    isLoading: listingLoading,
    error: listingError,
    refetch: refetchListing,
  } = useQuery<ListingResponse>({
    queryKey: ['business-promotion', id],
    queryFn: async () => {
      const response = await api.get<ListingResponse>(`/business-promotion/${id}`);
      return response;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });



  // Fetch analytics
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery<AnalyticsResponse>({
    queryKey: ['business-promotion-analytics', id],
    queryFn: async () => {
      const response = await api.get<AnalyticsResponse>(
        `/business-promotion/${id}/analytics`
      );
      return response;
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch review stats
  const {
    data: reviewStatsData,
    isLoading: reviewStatsLoading,
    refetch: refetchReviewStats,
  } = useQuery({
    queryKey: ['review-stats', id],
    queryFn: async () => {
      const response = await api.get(`/reviews/${id}/review-stats`);
      return response;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch reviews
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      console.log('📖 [OWNER FETCH REVIEWS API] Fetching business reviews:', { businessId: id });
      try {
        const response = await api.get(`/reviews/${id}/reviews?sort=latest&limit=20`);
        console.log('✅ [OWNER FETCH REVIEWS API SUCCESS]', {
          businessId: id,
          reviewCount: response?.reviews?.length || 0,
          averageRating: response?.stats?.averageRating,
          totalReviews: response?.stats?.totalReviews,
        });
        return response;
      } catch (error: any) {
        console.error('❌ [OWNER FETCH REVIEWS API ERROR]', {
          businessId: id,
          error: error?.message,
          status: error?.status,
        });
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch enquiries
  const {
    data: enquiriesData,
    isLoading: enquiriesLoading,
    refetch: refetchEnquiries,
  } = useQuery({
    queryKey: ['enquiries', id],
    queryFn: async () => {
      console.log('📥 [OWNER FETCH ENQUIRIES API] Fetching business enquiries:', { businessId: id });
      try {
        const response = await api.get(`/enquiries/${id}/enquiries?sort=latest&limit=20`);
        console.log('✅ [OWNER FETCH ENQUIRIES API SUCCESS]', {
          businessId: id,
          enquiryCount: response?.enquiries?.length || 0,
          newEnquiries: response?.stats?.new,
          respondedEnquiries: response?.stats?.responded,
          closedEnquiries: response?.stats?.closed,
        });
        return response;
      } catch (error: any) {
        console.error('❌ [OWNER FETCH ENQUIRIES API ERROR]', {
          businessId: id,
          error: error?.message,
          status: error?.status,
        });
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch enquiry stats
  const {
    data: enquiryStatsData,
    isLoading: enquiryStatsLoading,
    refetch: refetchEnquiryStats,
  } = useQuery({
    queryKey: ['enquiry-stats', id],
    queryFn: async () => {
      console.log('📊 [OWNER FETCH ENQUIRY STATS API] Fetching enquiry stats:', { businessId: id });
      try {
        const response = await api.get(`/enquiries/${id}/enquiry-stats`);
        console.log('✅ [OWNER FETCH ENQUIRY STATS API SUCCESS]', {
          businessId: id,
          totalEnquiries: response?.totalEnquiries,
          newEnquiries: response?.newEnquiries,
          avgResponseTime: response?.avgResponseTime,
          responseRate: response?.responseRate,
        });
        return response;
      } catch (error: any) {
        console.error('❌ [OWNER FETCH ENQUIRY STATS API ERROR]', {
          businessId: id,
          error: error?.message,
          status: error?.status,
        });
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const listing = listingData?.promotion;
  const analytics = analyticsData?.analytics;
  const canEditListing = useMemo(() => isPromotedListing(listing), [listing]);

  // Toggle status mutation
  const { mutate: toggleStatus, isPending: isTogglingStatus } = useMutation({
    mutationFn: async () => {
      const response = await api.patch<ToggleStatusResponse>(
        `/business-promotion/${id}/toggle-status`,
        {}
      );
      return response;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Listing status updated');
      refetchListing();
    },
    onError: (error: any) => {
      Alert.alert('Error', 'Failed to update listing status');
      console.error(error);
    },
  });

  // Delete listing mutation
  const { mutate: deleteListing, isPending: isDeletingListing } = useMutation({
    mutationFn: async () => {
      await api.del(`/business-promotion/${id}`);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Listing deleted successfully');
      setTimeout(() => {
        router.back();
      }, 1000);
    },
    onError: (error: any) => {
      Alert.alert('Error', 'Failed to delete listing');
      console.error(error);
    },
  });

  // Delete image mutation
  const { mutate: deleteImage, isPending: isDeletingImage } = useMutation({
    mutationFn: async (mediaId: string) => {
      console.log('🗑️ Deleting image:', mediaId);
      await api.del(`/business-promotion/${id}/media/${mediaId}`);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Image deleted successfully');
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['business-promotion', id] });
      refetchListing();
    },
    onError: (error: any) => {
      Alert.alert('Error', 'Failed to delete image');
      console.error('Delete image error:', error);
    },
  });

  // Reply to review mutation
  const { mutate: replyToReview, isPending: isReplyingToReview } = useMutation({
    mutationFn: async (variables: { reviewId: string; message: string }) => {
      console.log('💬 [REVIEW REPLY API] Posting reply to review:', {
        reviewId: variables.reviewId,
        messageLength: variables.message.length,
        businessId: id,
      });
      try {
        const response = await api.post(`/reviews/${variables.reviewId}/reply`, {
          message: variables.message,
        });
        console.log('✅ [REVIEW REPLY API SUCCESS]', {
          reviewId: variables.reviewId,
          repliedAt: response?.ownerReply?.repliedAt,
          message: response?.ownerReply?.message?.substring(0, 50),
        });
        return response;
      } catch (error: any) {
        console.error('❌ [REVIEW REPLY API ERROR]', {
          reviewId: variables.reviewId,
          businessId: id,
          error: error?.message,
          status: error?.status,
          errorData: error?.data,
        });
        throw error;
      }
    },
    onSuccess: () => {
      Alert.alert('Success', 'Reply posted successfully');
      refetchReviews();
      setReplyModalVisible(false);
      setReplyText('');
      setSelectedReviewId(null);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to post reply');
      console.error(error);
    },
  });

  // Respond to enquiry mutation
  const { mutate: respondToEnquiry, isPending: isRespondingToEnquiry } = useMutation({
    mutationFn: async (variables: { enquiryId: string; message: string }) => {
      console.log('💌 [ENQUIRY RESPOND API] Responding to enquiry:', {
        enquiryId: variables.enquiryId,
        messageLength: variables.message.length,
        businessId: id,
      });
      try {
        const response = await api.post(`/enquiries/${variables.enquiryId}/respond`, {
          message: variables.message,
        });
        console.log('✅ [ENQUIRY RESPOND API SUCCESS]', {
          enquiryId: variables.enquiryId,
          status: response?.enquiry?.status,
          lastResponseAt: response?.enquiry?.lastResponseAt,
          responseCount: response?.enquiry?.responses?.length,
        });
        return response;
      } catch (error: any) {
        console.error('❌ [ENQUIRY RESPOND API ERROR]', {
          enquiryId: variables.enquiryId,
          businessId: id,
          error: error?.message,
          status: error?.status,
          errorData: error?.data,
        });
        throw error;
      }
    },
    onSuccess: () => {
      Alert.alert('Success', 'Response sent successfully');
      refetchEnquiries();
      refetchEnquiryStats();
      setRespondModalVisible(false);
      setRespondText('');
      setSelectedEnquiryId(null);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to send response');
      console.error(error);
    },
  });

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Listing screen focused - refetching data');
      refetchListing();
      refetchAnalytics();
      refetchReviews();
      refetchEnquiries();
      refetchReviewStats();
      refetchEnquiryStats();
    }, [refetchListing, refetchAnalytics, refetchReviews, refetchEnquiries, refetchReviewStats, refetchEnquiryStats])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchListing(),
        refetchAnalytics(),
        refetchReviews(),
        refetchEnquiries(),
        refetchReviewStats(),
        refetchEnquiryStats(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchListing, refetchAnalytics, refetchReviews, refetchEnquiries, refetchReviewStats, refetchEnquiryStats]);




  const handleUpgrade = useCallback(() => {
    setUpgradeCheckpointVisible(true);
  }, [id]);

  const handleContinueUpgrade = useCallback(() => {
    setUpgradeCheckpointVisible(false);
    router.push({
      pathname: '/business/upgrade/[id]',
      params: { id },
    } as any);
  }, [id]);

  const handleEdit = useCallback(() => {
    if (!listing) return;

    if (!canEditListing) {
      Alert.alert(
        'Premium Feature',
        'Editing is available only for premium listings. Upgrade this listing to unlock editing.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: handleUpgrade },
        ]
      );
      return;
    }

    router.push({
      pathname: '/business-promotion',
      params: {
        promotionId: listing._id,
        listingType: 'PREMIUM',
        mode: 'edit',
      },
    } as any);
  }, [listing, canEditListing, handleUpgrade]);


  const handleToggleStatus = useCallback(() => {
    if (isTogglingStatus) return;
    toggleStatus();
  }, [toggleStatus, isTogglingStatus]);

  const handleDeleteListing = useCallback(() => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!isDeletingListing) {
              deleteListing();
            }
          },
        },
      ]
    );
  }, [deleteListing, isDeletingListing]);

  // REPLACE ENTIRE FUNCTION:
  const handlePickImage = useCallback(async () => {
    if (!listing?._id || uploadingImage) return;  // ADD uploadingImage check

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Allow access to photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,  // ADD THIS LINE
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setUploadingImage(true);  // ADD THIS

    try {
      const formData = new FormData();

      // ADD THESE LINES FOR FILE TYPE:
      const uriParts = asset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append("image", {
        uri: asset.uri,
        name: `image-${Date.now()}.${fileType}`,  // CHANGED
        type: `image/${fileType}`,  // CHANGED
      } as any);

      console.log('📤 Uploading image...');  // ADD THIS

      const response = await api.post(
        `/business-promotion/${listing._id}/media`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log('✅ Upload response:', response);  // ADD THIS

      Alert.alert("Success", "Image uploaded successfully");

      // ADD THESE LINES:
      queryClient.invalidateQueries({ queryKey: ['business-promotion', id] });
      await refetchListing();
    } catch (err: any) {
      console.error('❌ Upload error:', err);  // CHANGED
      Alert.alert("Error", err?.message || "Upload failed");  // CHANGED
    } finally {
      setUploadingImage(false);  // ADD THIS
    }
  }, [listing?._id, uploadingImage, refetchListing, queryClient, id]);  // UPDATE DEPENDENCIES


  // ADD THIS ENTIRE FUNCTION:
  const handleDeleteImage = useCallback((mediaId: string) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!isDeletingImage) {
              deleteImage(mediaId);
            }
          },
        },
      ]
    );
  }, [deleteImage, isDeletingImage]);

  // Loading state
  if (listingLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#4F6AF3', '#6B7FFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.headerGradient,
            { paddingTop: insets.top + 10 }
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Listing Details</Text>
            <View style={{ width: 32 }} />
          </View>
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F6AF3" />
          <Text style={styles.loadingText}>Loading listing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (listingError || !listing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#4F6AF3', '#6B7FFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.headerGradient,
            { paddingTop: insets.top + 10 }
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Listing Details</Text>
            <View style={{ width: 32 }} />
          </View>
        </LinearGradient>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to Load Listing</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetchListing()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#4F6AF3', '#6B7FFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.headerGradient,
          { paddingTop: insets.top + 10 }
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Listing Details</Text>
          <TouchableOpacity
            style={[styles.headerButton, !canEditListing && styles.headerButtonDisabled]}
            onPress={handleEdit}
            disabled={!canEditListing}
          >
            <Ionicons name={canEditListing ? 'pencil' : 'lock-closed'} size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#4F6AF3"
          />
        }
      >
        {/* Summary Card */}
        <SummaryCard
          listing={listing}
          canEdit={canEditListing}
          onEdit={handleEdit}
          onUpgrade={handleUpgrade}
        />

        {/* Stats Row */}
        {analytics && (
          <View style={styles.statsRow}>
            <StatCard
              icon="eye"
              label="Impressions"
              value={analytics.impressions}
            />
            <StatCard
              icon="hand-left"
              label="Clicks"
              value={analytics.clicks}
            />
            <StatCard
              icon="chatbubble"
              label="Leads"
              value={analytics.leads}
            />
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['overview', 'media', 'performance', 'feedback', 'settings'] as TabType[]).map(
            (tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
        <View style={styles.tabDivider} />

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && <OverviewTab listing={listing} />}
          {activeTab === 'media' && (
            <MediaTab
              listing={listing}
              onAddImage={handlePickImage}
              onDeleteImage={handleDeleteImage}
              uploadingImage={uploadingImage}
              isDeletingImage={isDeletingImage}
            />
          )}
          {activeTab === 'performance' && (
            <PerformanceTab listing={listing} analytics={analytics} />
          )}
          {activeTab === 'feedback' && (
            <FeedbackTab
              reviews={reviewsData?.reviews || []}
              reviewStats={reviewStatsData?.stats}
              reviewsLoading={reviewsLoading}
              enquiries={enquiriesData?.enquiries || []}
              enquiryStats={enquiryStatsData?.stats}
              enquiriesLoading={enquiriesLoading}
              onReplyToReview={(reviewId) => {
                setSelectedReviewId(reviewId);
                setReplyModalVisible(true);
              }}
              onRespondToEnquiry={(enquiryId) => {
                setSelectedEnquiryId(enquiryId);
                setRespondModalVisible(true);
              }}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              listing={listing}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteListing}
              isToggling={isTogglingStatus}
              isDeleting={isDeletingListing}
            />
          )}
        </View>
      </ScrollView>

      {/* Reply to Review Modal */}
      {replyModalVisible && (
        <ReplyReviewModal
          visible={replyModalVisible}
          reviewId={selectedReviewId}
          onClose={() => {
            setReplyModalVisible(false);
            setReplyText('');
            setSelectedReviewId(null);
          }}
          onReply={() => {
            if (selectedReviewId && replyText.trim()) {
              replyToReview({ reviewId: selectedReviewId, message: replyText });
            }
          }}
          replyText={replyText}
          onReplyTextChange={setReplyText}
          isSubmitting={isReplyingToReview}
        />
      )}

      {/* Respond to Enquiry Modal */}
      {respondModalVisible && (
        <RespondEnquiryModal
          visible={respondModalVisible}
          enquiryId={selectedEnquiryId}
          onClose={() => {
            setRespondModalVisible(false);
            setRespondText('');
            setSelectedEnquiryId(null);
          }}
          onRespond={() => {
            if (selectedEnquiryId && respondText.trim()) {
              respondToEnquiry({ enquiryId: selectedEnquiryId, message: respondText });
            }
          }}
          respondText={respondText}
          onRespondTextChange={setRespondText}
          isSubmitting={isRespondingToEnquiry}
        />
      )}

      <Modal
        visible={upgradeCheckpointVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpgradeCheckpointVisible(false)}
      >
        <View style={styles.checkpointOverlay}>
          <View style={styles.checkpointCard}>
            <Text style={styles.checkpointTitle}>Upgrade to Pro</Text>
            <Text style={styles.checkpointSubtext}>
              Your listing type will move from Free to Pro and payment will be required to activate promoted visibility.
            </Text>

            <View style={styles.checkpointList}>
              <Text style={styles.checkpointItem}>- Better ranking and priority in listing feed</Text>
              <Text style={styles.checkpointItem}>- More visibility and lead potential</Text>
              <Text style={styles.checkpointItem}>- Listing remains Free if you cancel now</Text>
            </View>

            <View style={styles.checkpointActions}>
              <TouchableOpacity
                style={[styles.cancelButton, styles.checkpointActionButton]}
                onPress={() => setUpgradeCheckpointVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, styles.checkpointActionButton]}
                onPress={handleContinueUpgrade}
              >
                <Text style={styles.submitButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================
// Summary Card Component
// ============================================
interface SummaryCardProps {
  listing: BusinessPromotion;
  canEdit: boolean;
  onEdit: () => void;
  onUpgrade: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  listing,
  canEdit,
  onEdit,
  onUpgrade,
}) => {
  return (
    <View style={styles.summaryCard}>
      {/* Header */}
      <View style={styles.summaryHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.businessName}>{listing.businessName}</Text>

          <View style={styles.badgeRow}>
            <Badge type="type" value={listing.listingType} />
            <Badge type="status" value={listing.status} />
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        {/* EDIT BUTTON - Premium only */}
        <TouchableOpacity
          style={[styles.primaryButton, !canEdit && styles.primaryButtonDisabled]}
          onPress={onEdit}
          disabled={!canEdit}
          activeOpacity={0.85}
        >
          <Ionicons name={canEdit ? 'create-outline' : 'lock-closed-outline'} size={18} color="#FFFFFF" />
          <Text style={[styles.primaryButtonText, !canEdit && styles.primaryButtonTextDisabled]}>
            {canEdit ? 'Edit Listing' : 'Premium Only'}
          </Text>
        </TouchableOpacity>

        {/* UPGRADE BUTTON */}
        {listing.listingType === 'free' && (
          <TouchableOpacity
            style={styles.upgradeProButton}
            onPress={onUpgrade}
            activeOpacity={0.85}
          >
            <Ionicons name="rocket-outline" size={18} color="#4F6AF3" />
            <Text style={styles.upgradeProText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        )}
      </View>
      {!canEdit && (
        <Text style={styles.lockHintText}>
          Editing is unlocked for premium listings only.
        </Text>
      )}
    </View>
  );
};

// ============================================
// Overview Tab
// ============================================
interface OverviewTabProps {
  listing: BusinessPromotion;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ listing }) => (
  <View style={styles.tabSection}>
    {listing.description && (
      <SectionCard title="Description">
        <Text style={styles.descriptionText}>{listing.description}</Text>
      </SectionCard>
    )}

    <SectionCard title="Business Details">
      <InfoRow
        label="Category"
        value={listing.category}
        icon="pricetag"
        showDivider={true}
      />
      <InfoRow
        label="Area"
        value={listing.area}
        icon="location"
        showDivider={true}
      />
      <InfoRow
        label="City"
        value={listing.city}
        icon="location"
        showDivider={true}
      />
      <InfoRow
        label="State"
        value={listing.state}
        icon="location"
        showDivider={!!listing.pincode}
      />
      {listing.pincode && (
        <InfoRow label="ZIP Code" value={listing.pincode} icon="location" showDivider={false} />
      )}
    </SectionCard>

    <SectionCard title="Contact Information">
      <InfoRow
        label="Phone"
        value={listing.phone}
        icon="call"
        showDivider={true}
      />
      <InfoRow
        label="Email"
        value={listing.email}
        icon="mail"
        showDivider={false}
      />
    </SectionCard>

    {listing.gstNumber && (
      <SectionCard title="GST Details">
        <InfoRow label="GST Number" value={listing.gstNumber} icon="document-text" showDivider={false} />
      </SectionCard>
    )}
  </View>
);

// ============================================
// Media Tab
// ============================================
interface MediaTabProps {
  listing: BusinessPromotion;
  onAddImage: () => void;
  onDeleteImage: (mediaId: string) => void;
  uploadingImage: boolean;
  isDeletingImage: boolean;

}

// REPLACE ENTIRE MediaTab COMPONENT:
const MediaTab: React.FC<MediaTabProps> = ({
  listing,
  onAddImage,
  onDeleteImage,      // ADD THIS
  uploadingImage,     // ADD THIS
  isDeletingImage,    // ADD THIS
}) => {
  console.log('🖼️ Media data:', listing.media);  // ADD THIS

  return (
    <View style={styles.tabSection}>
      <View style={styles.mediaHeader}>
        <Text style={styles.sectionTitle}>Business Images</Text>
        <TouchableOpacity
          style={[styles.addImageButton, uploadingImage && styles.disabledButton]}  // CHANGE THIS
          onPress={onAddImage}
          disabled={uploadingImage}  // ADD THIS
        >
          {uploadingImage ? (  // ADD THIS BLOCK
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addImageText}>Add Image</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {listing.media && listing.media.length > 0 ? (
        <View style={styles.imageGrid}>
          {listing.media.map((image: any, index: number) => {
            console.log(`Image ${index}:`, image);  // ADD THIS
            return (
              <View key={image._id || index} style={styles.imageContainer}>
                <Image
                  source={{ uri: getImageUrl(image.url) }}  // USE HELPER FUNCTION
                  style={styles.image}
                  resizeMode="cover"
                  // ADD THESE HANDLERS:
                  onError={(error) => {
                    console.error('Image load error:', error);
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', image.url);
                  }}
                />
                <TouchableOpacity
                  style={styles.deleteImageButton}
                  onPress={() => onDeleteImage(image._id)}  // CHANGE THIS
                  disabled={isDeletingImage}                // ADD THIS
                >
                  {isDeletingImage ? (  // ADD THIS BLOCK
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyMediaState}>
          <Ionicons name="image-outline" size={48} color="#CCC" />
          <Text style={styles.emptyStateText}>No images yet</Text>
          <TouchableOpacity
            style={[styles.emptyAddButton, uploadingImage && styles.disabledButton]}  // CHANGE THIS
            onPress={onAddImage}
            disabled={uploadingImage}  // ADD THIS
          >
            {uploadingImage ? (  // ADD THIS BLOCK
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.emptyAddButtonText}>+ Add Image</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};


// ============================================
// Performance Tab
// ============================================
interface PerformanceTabProps {
  listing: BusinessPromotion;
  analytics?: ListingAnalytics;
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({ listing, analytics }) => (
  <View style={styles.tabSection}>
    {analytics && (
      <>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceCard}>
            <Ionicons name="eye" size={24} color="#4F6AF3" />
            <Text style={styles.performanceValue}>{analytics.impressions}</Text>
            <Text style={styles.performanceLabel}>Impressions</Text>
          </View>
          <View style={styles.performanceCard}>
            <Ionicons name="hand-left" size={24} color="#4F6AF3" />
            <Text style={styles.performanceValue}>{analytics.clicks}</Text>
            <Text style={styles.performanceLabel}>Clicks</Text>
          </View>
          <View style={styles.performanceCard}>
            <Ionicons name="bar-chart" size={24} color="#4F6AF3" />
            <Text style={styles.performanceValue}>{analytics.ctr.toFixed(2)}%</Text>
            <Text style={styles.performanceLabel}>CTR</Text>
          </View>
          <View style={styles.performanceCard}>
            <Ionicons name="chatbubble" size={24} color="#4F6AF3" />
            <Text style={styles.performanceValue}>{analytics.leads}</Text>
            <Text style={styles.performanceLabel}>Leads</Text>
          </View>
        </View>

        <SectionCard title="Priority Score">
          <View style={styles.scoreContainer}>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreProgress,
                  { width: `${analytics.priorityScore}%` },
                ]}
              />
            </View>
            <Text style={styles.scoreText}>
              {analytics.priorityScore} - {getVisibilityLabel(analytics.priorityScore)}
            </Text>
          </View>
        </SectionCard>
      </>
    )}

    {listing.listingType === 'promoted' && listing.expiryDate && (
      <SectionCard title="Premium Details">
        <InfoRow
          label="Expiry Date"
          value={new Date(listing.expiryDate).toLocaleDateString()}
          icon="calendar"
          showDivider={false}
        />
      </SectionCard>
    )}
  </View>
);

// ============================================
// Settings Tab
// ============================================
interface SettingsTabProps {
  listing: BusinessPromotion;
  onToggleStatus: () => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  listing,
  onToggleStatus,
  onDelete,
  isToggling,
  isDeleting,
}) => (
  <View style={styles.tabSection}>
    <SectionCard title="Listing Status">
      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>Active / Inactive</Text>
          <Text style={styles.toggleSubtitle}>
            {listing.status === 'active'
              ? 'Your listing is active'
              : 'Your listing is inactive'}
          </Text>
        </View>
        <Switch
          value={listing.status === 'active'}
          onValueChange={onToggleStatus}
          disabled={isToggling}
          trackColor={{ false: '#CCC', true: '#86EFAC' }}
          thumbColor={listing.status === 'active' ? '#10B981' : '#999'}
        />
      </View>
    </SectionCard>

    <TouchableOpacity
      style={styles.deleteButton}
      onPress={onDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <ActivityIndicator size="small" color="#EF4444" />
      ) : (
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      )}
      <Text style={styles.deleteButtonText}>
        {isDeleting ? 'Deleting...' : 'Delete Listing'}
      </Text>
    </TouchableOpacity>
  </View>
);

// ============================================
// Feedback Tab
// ============================================
interface FeedbackTabProps {
  reviews: any[];
  reviewStats: any;
  reviewsLoading: boolean;
  enquiries: any[];
  enquiryStats: any;
  enquiriesLoading: boolean;
  onReplyToReview: (reviewId: string) => void;
  onRespondToEnquiry: (enquiryId: string) => void;
}

const FeedbackTab: React.FC<FeedbackTabProps> = ({
  reviews,
  reviewStats,
  reviewsLoading,
  enquiries,
  enquiryStats,
  enquiriesLoading,
  onReplyToReview,
  onRespondToEnquiry,
}) => {
  console.log("📊 Review Stats:", reviewStats);
  return (
    <View style={styles.tabSection}>
      {/* Review Stats */}
      {reviewStats && (
        <SectionCard title="Review Statistics">
          <View style={styles.statsGrid}>
            <View style={styles.statGridItem}>
              <Text style={styles.statLabel}>Total Reviews</Text>
              <Text style={styles.statValueLarge}>{reviewStats.totalReviews}</Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statLabel}>Avg Rating</Text>
              <Text style={styles.statValueLarge}>{Number(reviewStats?.averageRating ?? 0).toFixed(1)}</Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statLabel}>Reply Rate</Text>
              <Text style={styles.statValueLarge}>  {Number(reviewStats?.replyRate ?? 0).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statLabel}>Positive %</Text>
              <Text style={styles.statValueLarge}>  {Number(reviewStats?.positiveReviewPercent ?? 0).toFixed(0)}%
              </Text>
            </View>
          </View>
        </SectionCard>
      )}

      {/* Reviews Section */}
      <SectionCard title="Recent Reviews">
        {reviewsLoading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="small" color="#4F6AF3" />
          </View>
        ) : reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <View key={review._id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View>
                  <Text style={styles.reviewerName}>{review.userName}</Text>
                  <View style={styles.ratingRow}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < review.rating ? 'star' : 'star-outline'}
                        size={14}
                        color={i < review.rating ? '#FFB800' : '#CCC'}
                      />
                    ))}
                    <Text style={styles.ratingText}>({review.rating}.0)</Text>
                  </View>
                </View>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.reviewMessage}>{review.message}</Text>

              {review.photos && review.photos.length > 0 && (
                <View style={styles.reviewPhotos}>
                  {review.photos.slice(0, 3).map((photo: any, idx: number) => (
                    <Image
                      key={idx}
                      source={{ uri: photo.url }}
                      style={styles.reviewPhotoThumbnail}
                    />
                  ))}
                </View>
              )}

              {review.ownerReply ? (
                <View style={styles.ownerReplyBox}>
                  <Text style={styles.ownerReplyLabel}>Your Reply</Text>
                  <Text style={styles.ownerReplyText}>{review.ownerReply.message}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => onReplyToReview(review._id)}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="#4F6AF3" />
                  <Text style={styles.replyButtonText}>Reply</Text>
                </TouchableOpacity>
              )}
              <View style={styles.divider} />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No reviews yet</Text>
        )}
      </SectionCard>

      {/* Enquiry Stats */}
      {enquiryStats && (
        <SectionCard title="Enquiry Statistics">
          <View style={styles.statsGrid}>
            <View style={styles.statGridItem}>
              <Text style={styles.statLabel}>New</Text>
              <Text style={styles.statValueLarge}>{enquiryStats.newEnquiries}</Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statLabel}>Responded</Text>
              <Text style={styles.statValueLarge}>{enquiryStats.respondedEnquiries}</Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statLabel}>Closed</Text>
              <Text style={styles.statValueLarge}>{enquiryStats.closedEnquiries}</Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statLabel}>Avg Response</Text>
              <Text style={styles.statValueSmall}>{enquiryStats.averageResponseTime}</Text>
            </View>
          </View>
        </SectionCard>
      )}

      {/* Enquiries Section */}
      <SectionCard title="Recent Enquiries">
        {enquiriesLoading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="small" color="#4F6AF3" />
          </View>
        ) : enquiries && enquiries.length > 0 ? (
          enquiries.map((enquiry) => (
            <View key={enquiry._id} style={styles.enquiryCard}>
              <View style={styles.enquiryHeader}>
                <View style={styles.enquiryTitleSection}>
                  <Text style={styles.enquiryName}>{enquiry.userName}</Text>
                  <Text style={styles.enquirySubject}>{enquiry.subject}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: enquiry.status === 'new' ? '#FEE2E2' : enquiry.status === 'responded' ? '#DBEAFE' : '#E5E7EB' }]}>
                  <Text style={[styles.statusBadgeText, { color: enquiry.status === 'new' ? '#DC2626' : enquiry.status === 'responded' ? '#0284C7' : '#666' }]}>
                    {enquiry.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.enquiryMessage}>{enquiry.message}</Text>
              <View style={styles.enquiryFooter}>
                <Text style={styles.enquiryPhone}>{enquiry.userPhone}</Text>
                <Text style={styles.enquiryDate}>
                  {new Date(enquiry.createdAt).toLocaleDateString()}
                </Text>
              </View>

              {enquiry.status !== 'closed' && (
                <TouchableOpacity
                  style={styles.respondButton}
                  onPress={() => onRespondToEnquiry(enquiry._id)}
                >
                  <Ionicons name="send-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.respondButtonText}>
                    {enquiry.status === 'responded' ? 'Add Response' : 'Respond'}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={styles.divider} />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No enquiries yet</Text>
        )}
      </SectionCard>
    </View>
  );
};

// ============================================
// Reply Review Modal
// ============================================
interface ReplyReviewModalProps {
  visible: boolean;
  reviewId: string | null;
  onClose: () => void;
  onReply: () => void;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  isSubmitting: boolean;
}

const ReplyReviewModal: React.FC<ReplyReviewModalProps> = ({
  visible,
  onClose,
  onReply,
  replyText,
  onReplyTextChange,
  isSubmitting,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Reply to Review</Text>
          <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
            <Ionicons name="close" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.modalLabel}>Your Reply</Text>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Write your appreciation or response..."
              placeholderTextColor="#CCC"
              value={replyText}
              onChangeText={onReplyTextChange}
              multiline
              maxLength={500}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>
              {replyText.length}/500
            </Text>
          </View>
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.cancelButton, isSubmitting && styles.disabledButton]}
            onPress={onClose}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, (isSubmitting || !replyText.trim()) && styles.disabledButton]}
            onPress={onReply}
            disabled={isSubmitting || !replyText.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Post Reply</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ============================================
// Respond Enquiry Modal
// ============================================
interface RespondEnquiryModalProps {
  visible: boolean;
  enquiryId: string | null;
  onClose: () => void;
  onRespond: () => void;
  respondText: string;
  onRespondTextChange: (text: string) => void;
  isSubmitting: boolean;
}

const RespondEnquiryModal: React.FC<RespondEnquiryModalProps> = ({
  visible,
  onClose,
  onRespond,
  respondText,
  onRespondTextChange,
  isSubmitting,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Respond to Enquiry</Text>
          <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
            <Ionicons name="close" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.modalLabel}>Your Response</Text>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Respond to customer enquiry..."
              placeholderTextColor="#CCC"
              value={respondText}
              onChangeText={onRespondTextChange}
              multiline
              maxLength={1000}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>
              {respondText.length}/1000
            </Text>
          </View>
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.cancelButton, isSubmitting && styles.disabledButton]}
            onPress={onClose}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, (isSubmitting || !respondText.trim()) && styles.disabledButton]}
            onPress={onRespond}
            disabled={isSubmitting || !respondText.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Send Response</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ============================================
// Helper Functions
// ============================================
const getVisibilityLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
};

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonDisabled: {
    opacity: 0.45,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },

  // Loading/Error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // ADD THIS STYLE:
  disabledButton: {
    opacity: 0.6,
  },

  // Summary Card
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryTitleSection: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dotsButton: {
    padding: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#4F6AF3',
    backgroundColor: '#F0F4FF',
    gap: 6,
  },
  editButtonText: {
    color: '#4F6AF3',
    fontSize: 13,
    fontWeight: '700',
  },
  upgradeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#4F6AF3',
    gap: 6,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 0,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingBottom: 12,
    paddingTop: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4F6AF3',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#4F6AF3',
    fontWeight: '700',
  },
  tabDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  tabSection: {
    gap: 16,
  },

  // Overview Tab
  descriptionText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },

  // Media Tab
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addImageButton: {
    flexDirection: 'row',
    backgroundColor: '#4F6AF3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  addImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageContainer: {
    width: (width - 52) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',  // ADD THIS LINE

  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyMediaState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyAddButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4F6AF3',
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Performance Tab
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  performanceCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 8,
  },
  performanceLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginTop: 4,
  },
  scoreContainer: {
    gap: 10,
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  // Settings Tab
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFFFFF',
    gap: 8,
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4F6AF3',
    gap: 6,
    shadowColor: '#4F6AF3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonTextDisabled: {
    color: '#E5E7EB',
  },

  upgradeProButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4F6AF3',
    gap: 6,
    position: 'relative',
  },

  upgradeProText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F6AF3',
  },
  lockHintText: {
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  disabledUpgrade: {
    opacity: 0.7,
  },

  comingSoonBadge: {
    position: 'absolute',
    top: -8,
    right: -6,
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },

  comingSoonText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Feedback Tab
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  statGridItem: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValueLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4F6AF3',
  },
  statValueSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F6AF3',
  },
  loadingCenter: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  // Review Card
  reviewCard: {
    marginBottom: 16,
    paddingBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  reviewMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewPhotos: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  reviewPhotoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4F6AF3',
    backgroundColor: '#F0F4FF',
    gap: 6,
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F6AF3',
  },
  ownerReplyBox: {
    backgroundColor: '#F0F4FF',
    borderLeftWidth: 3,
    borderLeftColor: '#4F6AF3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  ownerReplyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F6AF3',
    marginBottom: 4,
  },
  ownerReplyText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  // Enquiry Card
  enquiryCard: {
    marginBottom: 16,
    paddingBottom: 16,
  },
  enquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  enquiryTitleSection: {
    flex: 1,
  },
  enquiryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  enquirySubject: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F6AF3',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  enquiryMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  enquiryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  enquiryPhone: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F6AF3',
  },
  enquiryDate: {
    fontSize: 12,
    color: '#999',
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#4F6AF3',
    gap: 6,
  },
  respondButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Modal Styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  textInputContainer: {
    position: 'relative',
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#1A1A1A',
    minHeight: 100,
    fontFamily: 'System',
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#4F6AF3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkpointCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkpointOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
  },
  checkpointTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  checkpointSubtext: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    lineHeight: 18,
  },
  checkpointList: {
    marginTop: 12,
    marginBottom: 16,
    gap: 8,
  },
  checkpointItem: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  checkpointActions: {
    flexDirection: 'row',
    gap: 10,
  },
  checkpointActionButton: {
    flex: 1,
  },

});



