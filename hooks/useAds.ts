import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Ad type definition
export type Ad = {
  id: number | string;
  image: any;
  phone: string;
  name: string;
  hasFullBanner?: boolean;
  bannerImage?: any;
  isFromApi?: boolean;
  priority?: number;
};

/**
 * Shared hook to fetch ads from API with React Query caching
 * 
 * This hook implements a queue-based rotation system:
 * - Fetches ads sorted by priority (high to low) and creation date (newest first)
 * - Caches for 5-30 minutes to prevent redundant API calls
 * - Auto-refreshes every 10 minutes in background
 * - Supports 100+ ads with smooth continuous loop
 * 
 * Benefits:
 * - Prevents multiple API calls (4 pages sharing same data)
 * - No "no ads" flickering
 * - New ads added smoothly on background refresh
 * - Continuous loop without interruption
 */
export function useAds() {
  return useQuery({
    queryKey: ['footer-ads'],
    queryFn: async () => {
      console.log('📡 useAds: Fetching ads from API...');
      try {
        const response = await api.get('/ads/active');
        console.log('📥 useAds: API response:', JSON.stringify(response, null, 2));
        
        if (response && response.success && response.data && response.data.length > 0) {
          console.log(`📦 useAds: Processing ${response.data.length} ads from API...`);
          
          // Format ads for carousel - sorted by priority (backend already sorted)
          const formattedApiAds: Ad[] = response.data.map((ad: any) => ({
            id: `api-${ad._id}`,
            image: { uri: ad.bottomImage },
            phone: ad.phoneNumber,
            name: ad.title || 'Ad from Dashboard',
            hasFullBanner: !!ad.fullscreenImage,
            bannerImage: ad.fullscreenImage ? { uri: ad.fullscreenImage } : undefined,
            isFromApi: true,
            priority: ad.priority || 5,
          }));
          
          console.log(`✅ useAds: Formatted ${formattedApiAds.length} API ads`);
          return formattedApiAds;
        } else {
          console.log('⚠️ useAds: No API ads available in response');
          return [];
        }
      } catch (error) {
        console.error('❌ useAds: Error fetching ads:', error);
        return [];
      }
    },
    
    // Cache configuration for smooth 100+ ads queue
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - kept in memory (increased for 100+ ads)
    
    // Don't refetch on component mount/focus (use cache)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    
    // Auto-refresh every 10 minutes in background (smooth queue updates)
    refetchInterval: 10 * 60 * 1000,
    
    // Retry configuration
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Enable background refetching for continuous smooth updates
    refetchIntervalInBackground: true,
  });
}
