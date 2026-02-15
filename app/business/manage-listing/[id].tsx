/**
 * Single Listing Dashboard
 * Detailed view for a specific business promotion
 * Supports Overview, Media, Performance, and Settings tabs
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

type TabType = 'overview' | 'media' | 'performance' | 'settings';

export default function SingleListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // ADD THIS:
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const listing = listingData?.promotion;
  const analytics = analyticsData?.analytics;

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

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Listing screen focused - refetching data');
      refetchListing();
      refetchAnalytics();
    }, [refetchListing, refetchAnalytics])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchListing(), refetchAnalytics()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchListing, refetchAnalytics]);




  const handleUpgrade = useCallback(() => {
    router.push({
      pathname: '/(tabs)/business/upgrade/[id]',
      params: { id },
    } as any);
  }, [id]);

  const handleEdit = useCallback(() => {
    if (!listing) return;

    const isPro = listing.listingType === 'promoted';

    // If FREE → show upgrade message
    if (!isPro) {
      Alert.alert(
        'Pro Feature',
        'Editing is available only for Pro listings. Upgrade your listing to unlock advanced editing and better visibility.',
        [
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    // If PRO → Feature coming soon
    Alert.alert(
      'Coming Soon',
      'Advanced listing editing will be available in the next update. Stay tuned!',
      [{ text: 'OK' }]
    );
  }, [listing, handleUpgrade]);


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
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="pencil" size={20} color="#FFFFFF" />
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
          {(['overview', 'media', 'performance', 'settings'] as TabType[]).map(
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
    </SafeAreaView>
  );
}

// ============================================
// Summary Card Component
// ============================================
interface SummaryCardProps {
  listing: BusinessPromotion;
  onEdit: () => void;
  onUpgrade: () => void;
}

// const SummaryCard: React.FC<SummaryCardProps> = ({ listing, onEdit, onUpgrade }) => (
//   <View style={styles.summaryCard}>
//     <View style={styles.summaryHeader}>
//       <View style={styles.summaryTitleSection}>
//         <Text style={styles.businessName}>{listing.businessName}</Text>
//         <View style={styles.badgeRow}>
//           <Badge type="type" value={listing.listingType} />
//           <Badge type="status" value={listing.status} />
//         </View>
//       </View>
//       <TouchableOpacity style={styles.dotsButton}>
//         <Ionicons name="ellipsis-vertical" size={20} color="#666" />
//       </TouchableOpacity>
//     </View>

//     <View style={styles.buttonRow}>
//       <TouchableOpacity style={styles.editButton} onPress={onEdit}>
//         <Ionicons name="pencil" size={16} color="#4F6AF3" />
//         <Text style={styles.editButtonText}>Edit</Text>
//       </TouchableOpacity>
//       {listing.listingType === 'free' && (
//         <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
//           <Ionicons name="star" size={16} color="#FFFFFF" />
//           <Text style={styles.upgradeButtonText}>Upgrade</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   </View>
// );

const SummaryCard: React.FC<SummaryCardProps> = ({
  listing,
  onEdit,
  onUpgrade,
}) => {
  const isUpgradeComingSoon = true; // 🔥 toggle when ready

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
        {/* EDIT BUTTON - More Premium */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onEdit}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Edit Listing</Text>
        </TouchableOpacity>

        {/* UPGRADE BUTTON */}
        {listing.listingType === 'free' && (
          <TouchableOpacity
            style={[
              styles.upgradeProButton,
              isUpgradeComingSoon && styles.disabledUpgrade,
            ]}
            onPress={() => {
              if (!isUpgradeComingSoon) onUpgrade();
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="rocket-outline" size={18} color="#4F6AF3" />
            <Text style={styles.upgradeProText}>Upgrade to Pro</Text>

            {isUpgradeComingSoon && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
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

});
