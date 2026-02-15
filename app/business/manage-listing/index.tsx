/**
 * My Listings Screen
 * Displays all business promotions/listings for the user
 * Multi-listing SaaS architecture
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { ListingCard } from '../components';
import { BusinessPromotion, ListingsListResponse } from '../types';
import api from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function MyListingsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();


  // Fetch listings from API
  const {
    data: listingsData,
    isLoading,
    error,
    refetch,
  } = useQuery<ListingsListResponse>({
    queryKey: ['business-promotions'],
    queryFn: async () => {
      try {
        const response = await api.get<ListingsListResponse>('/business-promotion');
        return response;
      } catch (err) {
        console.error('Error fetching listings:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Listings screen focused - refetching data');
      refetch();
    }, [refetch])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error('Error refreshing listings:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleCreateListing = useCallback(() => {
    // Route to create new listing - to be implemented
    router.push('/business-promotiontype' as any);
  }, []);

  const handleListingPress = useCallback(
    (listingId: string) => {
      console.log('📍 Navigating to listing:', listingId);
      router.push({
        pathname: '/business/manage-listing/[id]',
        params: { id: listingId },
      } as any);
    },
    []
  );

  const listings = listingsData?.promotions || [];

  // Loading state
  if (isLoading && !refreshing) {
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
            <Text style={styles.headerTitle}>My Listings</Text>
            <View style={{ width: 32 }} />
          </View>
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F6AF3" />
          <Text style={styles.loadingText}>Loading your listings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
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
            <Text style={styles.headerTitle}>My Listings</Text>
            <View style={{ width: 32 }} />
          </View>
        </LinearGradient>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to Load Listings</Text>
          <Text style={styles.errorMessage}>
            {error instanceof Error ? error.message : 'An error occurred'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (listings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
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
            <Text style={styles.headerTitle}>My Listings</Text>
            <View style={{ width: 32 }} />
          </View>
        </LinearGradient>

        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No Listings Yet</Text>
          <Text style={styles.emptyMessage}>
            Create your first business listing to get started
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateListing}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create First Listing</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main list view
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
          <Text style={styles.headerTitle}>My Listings</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleCreateListing}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View>
          <Text style={styles.infoTitle}>Total Listings</Text>
          <Text style={styles.infoValue}>{listings.length}</Text>
        </View>
        <TouchableOpacity
          style={styles.createNewButton}
          onPress={handleCreateListing}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createNewButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Listings List */}
      <FlatList
        data={listings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => handleListingPress(item._id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4F6AF3"
            colors={['#4F6AF3', '#6B7FFF']}
          />
        }
        onEndReachedThreshold={0.3}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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

  // Loading state
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

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#4F6AF3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#4F6AF3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Error state
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
  },
  errorMessage: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
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

  // Info card
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4F6AF3',
  },
  createNewButton: {
    flexDirection: 'row',
    backgroundColor: '#4F6AF3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  createNewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // List content
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
