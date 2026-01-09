import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

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
      // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      // console.log('📡 [MOBILE STEP 1] useAds: Fetching ads from API...');
      
      try {
        const response = await api.get('/ads/active');
        
        // console.log('📥 [MOBILE STEP 2] useAds: API response received');
        
        // Check if response is valid JSON (not HTML error page)
        if (typeof response === 'string') {
          console.error('❌ Network error fetching ads: Received HTML instead of JSON');
          console.error('Response preview:', response.substring(0, 200));
          return [];
        }
        
        // console.log('📊 Response structure:', {
        //   success: response?.success,
        //   count: response?.count,
        //   dataLength: response?.data?.length,
        //   imageBaseUrl: response?.imageBaseUrl,
        //   timestamp: response?.timestamp
        // });
        
        if (response && response.success && response.data && response.data.length > 0) {
          const defaultImageBase = process.env.EXPO_PUBLIC_API_BASE || process.env.API_BASE || '';
          const imageBaseUrl = response.imageBaseUrl || defaultImageBase;

          if (!imageBaseUrl) {
            console.warn('⚠️ No image base configured. Set EXPO_PUBLIC_API_BASE or API_BASE to construct image URLs from ads response.');
          }

          // console.log(`[MOBILE STEP 3] Processing ${response.data.length} ads from API...`);
          // console.log('Image Base URL:', imageBaseUrl || '(none configured)');
          
          // Check first ad structure
          // if (response.data[0]) {
          //   console.log('First ad structure:', {
          //     _id: response.data[0]._id,
          //     title: response.data[0].title,
          //     bottomImageUrl: response.data[0].bottomImageUrl,
          //     fullscreenImageUrl: response.data[0].fullscreenImageUrl,
          //     hasBottomImage: response.data[0].hasBottomImage,
          //     hasFullscreenImage: response.data[0].hasFullscreenImage,
          //     hasLegacyBottomImage: !!response.data[0].bottomImage,
          //     hasLegacyFullscreenImage: !!response.data[0].fullscreenImage
          //   });
          // }
          
          // Format ads for carousel - sorted by priority (backend already sorted)
          // ✅ UPDATED: Now using GridFS URLs for images
          const formattedApiAds: Ad[] = response.data
            .filter((ad: any) => {
              // Filter out video ads (should already be filtered by backend, but double-check)
              if (ad.adType === 'video') {
                console.warn(`⚠️  Skipping video ad "${ad.title}" (ID: ${ad._id}) - Video ads not supported in bottom carousel`);
                return false;
              }
              
              // Filter out ads without valid bottom image
              const hasValidBottomImage = ad.bottomImageUrl && ad.bottomImageUrl.trim() !== '';
              if (!hasValidBottomImage) {
                console.warn(`⚠️  Skipping ad "${ad.title}" (ID: ${ad._id}) - No bottom image URL`);
              }
              return hasValidBottomImage;
            })
            .map((ad: any, index: number) => {
              const bottomImageUri = `${imageBaseUrl}${ad.bottomImageUrl}`;
              const fullscreenImageUri = ad.fullscreenImageUrl 
                ? `${imageBaseUrl}${ad.fullscreenImageUrl}`
                : null;
              
              // if (index === 0) {
              //   console.log(`🖼️  [MOBILE STEP 5] Constructing URLs for first ad:`);
              //   console.log(`   Bottom Image: ${bottomImageUri}`);
              //   console.log(`   Fullscreen Image: ${fullscreenImageUri || 'N/A'}`);
              // }
              
              return {
                id: `api-${ad._id}`,
                image: { uri: bottomImageUri },
                phone: ad.phoneNumber,
                name: ad.title || 'Ad from Dashboard',
                hasFullBanner: !!ad.fullscreenImageUrl,
                bannerImage: fullscreenImageUri 
                  ? { uri: fullscreenImageUri } 
                  : undefined,
                isFromApi: true,
                priority: ad.priority || 5,
              };
            });
          
          // console.log(`✅ [MOBILE STEP 6] Formatted ${formattedApiAds.length} API ads (filtered out invalid ads)`);
          // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          
          return formattedApiAds;
        } else {
          // console.log('⚠️  [MOBILE WARNING] No API ads available in response');
          // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          return [];
        }
      } catch (error) {
        console.error('❌ Network error fetching ads:', error instanceof Error ? error : String(error));
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          if ('status' in error) {
            console.error('HTTP status:', (error as any).status);
          }
        }
        // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Return empty array instead of throwing to prevent app crash
        return [];
      }
    },
    
    // Cache configuration for smooth 100+ ads queue
    staleTime: 0, // FORCE FRESH DATA - no cache for testing
    gcTime: 1000, // 1 second - clear quickly
    
    // Don't refetch on component mount/focus (use cache)
    refetchOnMount: true, // FORCE REFETCH for testing
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    
    // Auto-refresh every 10 minutes in background (smooth queue updates)
    refetchInterval: 10 * 60 * 1000,
    
    // Retry configuration
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Enable background refetching for continuous smooth updates
    refetchIntervalInBackground: true,
  });
}
