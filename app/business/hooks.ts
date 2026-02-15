/**
 * Custom Hooks for Business Listings
 * Handles all API calls and business logic for listings
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  BusinessPromotion,
  ListingAnalytics,
  ListingsListResponse,
  ListingResponse,
  AnalyticsResponse,
  MediaUploadResponse,
} from './types';

/**
 * Fetch all listings for the current user
 */
export const useListings = () => {
  return useQuery<ListingsListResponse>({
    queryKey: ['business-promotions'],
    queryFn: async () => {
      const response = await api.get<ListingsListResponse>('/business-promotion');
      return response;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

/**
 * Fetch a single listing by ID
 */
export const useListing = (id: string | null) => {
  return useQuery<ListingResponse>({
    queryKey: ['business-promotion', id],
    queryFn: async () => {
      if (!id) throw new Error('Listing ID is required');
      const response = await api.get<ListingResponse>(`/business-promotion/${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

/**
 * Fetch analytics for a listing
 */
export const useListingAnalytics = (id: string | null) => {
  return useQuery<AnalyticsResponse>({
    queryKey: ['business-promotion-analytics', id],
    queryFn: async () => {
      if (!id) throw new Error('Listing ID is required');
      const response = await api.get<AnalyticsResponse>(
        `/business-promotion/${id}/analytics`
      );
      return response;
    },
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Toggle listing status (active/inactive)
 */
export const useToggleListingStatus = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/business-promotion/${id}/toggle-status`, {});
      return response;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['business-promotion', id] });
      queryClient.invalidateQueries({ queryKey: ['business-promotions'] });
    },
  });
};

/**
 * Delete a listing
 */
export const useDeleteListing = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.del(`/business-promotion/${id}`);
    },
    onSuccess: () => {
      // Invalidate all listing queries
      queryClient.invalidateQueries({ queryKey: ['business-promotions'] });
      queryClient.removeQueries({ queryKey: ['business-promotion', id] });
    },
  });
};

/**
 * Upload media/images for a listing
 */
export const useUploadListingMedia = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post<MediaUploadResponse>(
        `/business-promotion/${id}/media`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-promotion', id] });
    },
  });
};

/**
 * Record impression/view for a listing
 */
export const useRecordImpression = () => {
  return useMutation({
    mutationFn: async (listingId: string) => {
      await api.post(`/business-listing/${listingId}/impression`, {});
    },
  });
};

/**
 * Record click for a listing
 */
export const useRecordClick = () => {
  return useMutation({
    mutationFn: async (listingId: string) => {
      await api.post(`/business-listing/${listingId}/click`, {});
    },
  });
};

/**
 * Record lead for a listing
 */
export const useRecordLead = () => {
  return useMutation({
    mutationFn: async (listingId: string) => {
      await api.post(`/business-listing/${listingId}/lead`, {});
    },
  });
};
