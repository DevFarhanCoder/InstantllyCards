import React, { useEffect, useRef, useState } from 'react';
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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import FooterCarousel from '../../components/FooterCarousel';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
const PAGE_LIMIT = 20;

type ListingRating = {
  averageRating?: number;
  totalReviews?: number;
};

type BusinessListing = {
  _id: string;
  businessName?: string;
  description?: string;
  aboutBusiness?: string;
  listingType?: 'free' | 'promoted';
  media?: Array<{ url: string }>;
  phone?: string;
  whatsapp?: string;
  area?: string;
  city?: string;
  establishedYear?: string | number;
  isVerified?: boolean;
  rating?: ListingRating;
};

type ListingsResponse = {
  success: boolean;
  data: BusinessListing[];
  meta?: { page: number; limit: number; total: number; pages: number };
};

const getImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

export default function BusinessCardsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { subcategory, category } = useLocalSearchParams<{ subcategory?: string; category?: string }>();
  const [search, setSearch] = useState('');
  const [businessCards, setBusinessCards] = useState<BusinessListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);
  const [page, setPage] = useState(1);
  const impressionSeenRef = useRef<Set<string>>(new Set());

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: BusinessListing }> }) => {
    viewableItems.forEach((viewable) => {
      const listingId = viewable?.item?._id;
      if (!listingId || impressionSeenRef.current.has(listingId)) return;
      impressionSeenRef.current.add(listingId);
      api.post(`/business-listings/${listingId}/impression`).catch(() => {
        impressionSeenRef.current.delete(listingId);
      });
    });
  }).current;

  const fetchBusinessCards = async (pageToLoad: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const response = await api.get<ListingsResponse>('/business-listings', {
        params: {
          subcategory,
          page: pageToLoad,
          limit: PAGE_LIMIT,
        },
      });

      if (!response?.success) {
        throw new Error('Failed to load listings');
      }

      const list = Array.isArray(response.data) ? response.data : [];
      setBusinessCards((prev) => (append ? [...prev, ...list] : list));
      setMeta(response.meta || null);
      setPage(pageToLoad);
    } catch (err: any) {
      if (!append) {
        setError(err?.message || 'Failed to load businesses');
        setBusinessCards([]);
      }
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    impressionSeenRef.current.clear();
    fetchBusinessCards(1, false);
  }, [subcategory]);

  const handleLoadMore = () => {
    if (loading || loadingMore) return;
    if (!meta || page >= meta.pages) return;
    fetchBusinessCards(page + 1, true);
  };

  const filteredCards = businessCards.filter((card) => {
    const businessName = card.businessName?.toLowerCase() || '';
    const description = card.description?.toLowerCase() || '';
    return businessName.includes(search.toLowerCase()) || description.includes(search.toLowerCase());
  });

  const trackLead = async (listingId?: string) => {
    if (!listingId) return;
    try {
      await api.post(`/business-listings/${listingId}/lead`);
    } catch {
      // non-blocking tracking
    }
  };

  const handleCall = (phone: string, listingId?: string) => {
    trackLead(listingId);
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string, listingId?: string) => {
    trackLead(listingId);
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`);
  };

  const handleDirection = (address: string, listingId?: string) => {
    trackLead(listingId);
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
    });
    if (url) Linking.openURL(url);
  };

  const renderBusinessCard = ({ item }: { item: BusinessListing }) => {
    const phone = item.phone;
    const address = `${item.area || ''}, ${item.city || ''}`;
    const currentYear = new Date().getFullYear();
    const establishedYear = item.establishedYear ? parseInt(String(item.establishedYear), 10) : null;
    const yearsInBusiness =
      establishedYear && establishedYear <= currentYear ? currentYear - establishedYear : null;
    const averageRating =
      typeof item?.rating?.averageRating === 'number' ? item.rating.averageRating.toFixed(1) : 'N/A';
    const totalReviews = typeof item?.rating?.totalReviews === 'number' ? item.rating.totalReviews : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={async () => {
          try {
            await api.post(`/business-listings/${item._id}/click`);
          } catch {
            // non-blocking tracking
          }

          router.push({
            pathname: `/businessCard/${item._id}`,
            params: { cardData: JSON.stringify(item) },
          } as Href);
        }}
      >
        <View style={styles.cardImageSection}>
          {item.media && item.media.length > 0 ? (
            <Image source={{ uri: getImageUrl(item.media[0]?.url) }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <MaterialIcons name="business" size={48} color="#9CA3AF" />
            </View>
          )}

          {item.listingType === 'promoted' && (
            <View style={styles.topSearchBadge}>
              <Ionicons name="flash" size={12} color="#fff" />
              <Text style={styles.topSearchText}>Top Sponsored</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.nameRow}>
            {item.isVerified ? (
              <View style={styles.verifiedBadgeSmall}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.thumbIconRow}>
            <MaterialIcons name="thumb-up" size={16} color="#1F2937" />
            <Text style={styles.businessName} numberOfLines={2}>
              {item.businessName || 'Business'}
            </Text>
          </View>

          <View style={styles.ratingBox}>
            <Text style={styles.ratingText}>{averageRating} ★</Text>
            <Text style={styles.ratingsCount}>
              {totalReviews} {totalReviews === 1 ? 'Rating' : 'Ratings'}
            </Text>
          </View>

          <Text style={styles.address} numberOfLines={1}>
            {address.trim() ? address : 'Address not available'}
          </Text>

          {yearsInBusiness && yearsInBusiness > 0 ? (
            <Text style={styles.experience}>
              {yearsInBusiness} {yearsInBusiness === 1 ? 'Year' : 'Years'} in Business
            </Text>
          ) : null}

          {item.aboutBusiness ? (
            <View style={styles.reviewSnippet}>
              <Ionicons name="chatbox-outline" size={16} color="#EF4444" />
              <Text style={styles.reviewText} numberOfLines={2}>
                "{item.aboutBusiness}"
              </Text>
            </View>
          ) : null}

          <View style={styles.actionButtonsRow}>
            {phone ? (
              <>
                <TouchableOpacity
                  style={styles.actionButtonPrimary}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCall(phone, item._id);
                  }}
                >
                  <Ionicons name="call" size={18} color="#fff" />
                  <Text style={styles.actionButtonPrimaryText}>Call Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButtonSecondary}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleWhatsApp(item.whatsapp || phone, item._id);
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  <Text style={styles.actionButtonSecondaryText}>WhatsApp</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {address.trim() ? (
              <TouchableOpacity
                style={styles.actionButtonSecondary}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDirection(address, item._id);
                }}
              >
                <Ionicons name="navigate" size={18} color="#6B7280" />
                <Text style={styles.actionButtonSecondaryText}>Direction</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder={`${subcategory || 'Search businesses'}`}
              placeholderTextColor="#1F2937"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <Text style={styles.headerSubtitle}>{category || ''}</Text>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{filteredCards.length} Results for your search</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color="#DC2626" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchBusinessCards(1, false)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item._id}
          renderItem={renderBusinessCard}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: 120 + tabBarHeight },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="business-center" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No businesses found</Text>
            </View>
          }
        />
      )}

      <FooterCarousel showPromoteButton={true} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 4 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  backButton: { padding: 4, minWidth: 32, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    gap: 8,
    minHeight: 44,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1F2937', fontWeight: '500', padding: 0, minHeight: 24 },
  headerSubtitle: {
    fontSize: 12,
    color: '#333333',
    paddingHorizontal: 16,
    paddingBottom: 8,
    letterSpacing: 0.2,
    fontWeight: '400',
  },
  resultsHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  resultsCount: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  listContainer: { paddingBottom: 16 },
  card: {
    backgroundColor: '#fff',
    marginBottom: 8,
    flexDirection: 'row',
    minHeight: 160,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  cardImageSection: { width: width * 0.37, minWidth: 120, maxWidth: 160, height: 160, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
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
  topSearchText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  verifiedBadgeSmall: { backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  verifiedText: { color: '#3B82F6', fontSize: 11, fontWeight: '600' },
  thumbIconRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  businessName: { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1, lineHeight: 20 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  ratingText: {
    backgroundColor: '#16A34A',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 13,
    fontWeight: '700',
  },
  ratingsCount: { fontSize: 13, color: '#6B7280' },
  address: { fontSize: 13, color: '#6B7280', marginBottom: 4, lineHeight: 18 },
  experience: { fontSize: 13, color: '#16A34A', marginBottom: 6 },
  reviewSnippet: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 6 },
  reviewText: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', flex: 1, lineHeight: 16 },
  actionButtonsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
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
  actionButtonPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
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
  actionButtonSecondaryText: { color: '#1F2937', fontSize: 13 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 24 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 16, textAlign: 'center' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  loadingText: { fontSize: 16, color: '#6B7280', marginTop: 16 },
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
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loadMoreContainer: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadMoreText: { color: '#6B7280', fontSize: 13 },
});
