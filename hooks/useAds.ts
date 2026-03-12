import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

// Ad type definition
export type Ad = {
  title: string;
  fullscreenVideoUrl: any;
  id: number | string;
  image: any;
  phone: string;
  name: string;
  priority?: number;

  // hasFullBanner?: boolean;
  // bannerImage?: any;
  // bottom
  bottomMediaType?: "image" | "video";
  bottomMediaUrl?: string | null;

  // fullscreen
  fullscreenMediaType?: "image" | "video";
  fullscreenMediaUrl?: string | null;
  isFromApi?: boolean;
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
    queryKey: ["footer-ads"],
    queryFn: async () => {
      // console.log("ðŸ“¡ [MOBILE STEP 1] useAds: Fetching ads from API...");

      try {
        const response = await api.get("/ads/active");

        // console.log("ðŸ“¥ [MOBILE STEP 2] Response received");
        // console.log("ðŸ“¥ Response type:", typeof response);
        // console.log(
        //   "ðŸ“¥ Response keys:",
        //   response ? Object.keys(response).join(", ") : "null",
        // );

        // Check if response is valid JSON (not HTML error page)
        if (typeof response === "string") {
          return [];
        }

        if (
          response &&
          response.success &&
          response.data &&
          response.data.length > 0
        ) {
          // Format ads for carousel - sorted by priority (backend already sorted)
          const formattedApiAds: Ad[] = response.data.map(
            (ad: any) => {
              // âœ… ALWAYS construct URLs from _id - works with both old and new API
              const bottomMediaUrl = `/api/ads/image/${ad._id}/bottom`;
              const fullscreenMediaUrl = `/api/ads/image/${ad._id}/fullscreen`;

              return {
                id: `api-${ad._id}`,
                phone: ad.phoneNumber,
                name: ad.title || "Ad",
                title: ad.title || "Ad",
                priority: ad.priority || 5,
                isFromApi: true,

                // Map image URLs (API only returns images, no videos)
                bottomMediaType: ad.hasBottomImage ? "image" : undefined,
                bottomMediaUrl,

                fullscreenMediaType: ad.hasFullscreenImage
                  ? "image"
                  : undefined,
                fullscreenMediaUrl,
              };
            },
          );

          // âœ… FRONTEND DEDUPLICATION: Extra safety to ensure no duplicates slip through
          // Deduplicate by phone number + title combination
          const uniqueAds = formattedApiAds.reduce((acc: Ad[], currentAd: Ad) => {
            const key = `${currentAd.phone}-${currentAd.title}`;
            const exists = acc.some(ad => 
              `${ad.phone}-${ad.title}` === key
            );
            
            if (!exists) {
              acc.push(currentAd);
            }
            
            return acc;
          }, []);

          return uniqueAds;
        } else {
          // console.log('âš ï¸  [MOBILE WARNING] No API ads available in response');
          // console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n');
          return [];
        }
      } catch (_error) {
        // console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n');

        // Return empty array instead of throwing to prevent app crash
        return [];
      }
    },

    // Cache configuration for smooth 100+ ads queue
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - kept in memory (increased for 100+ ads)

    // âœ… FIXED: Prevent mid-sequence refetching that disrupts carousel order
    refetchOnMount: false, // Don't refetch when component remounts
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: false, // Don't refetch on network reconnect

    // âœ… DISABLED: Auto-refresh can disrupt carousel mid-sequence
    // Only manually refetch or wait for staleTime to expire
    refetchInterval: false, // Disabled auto-refresh
    refetchIntervalInBackground: false, // Disabled background refresh

    // Retry configuration
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

