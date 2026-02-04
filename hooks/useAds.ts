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
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      // console.log("📡 [MOBILE STEP 1] useAds: Fetching ads from API...");

      try {
        const response = await api.get("/ads/active");

        // console.log("📥 [MOBILE STEP 2] Response received");
        // console.log("📥 Response type:", typeof response);
        // console.log(
        //   "📥 Response keys:",
        //   response ? Object.keys(response).join(", ") : "null",
        // );

        // Check if response is valid JSON (not HTML error page)
        if (typeof response === "string") {
          console.error(
            "❌ Network error fetching ads: Received HTML instead of JSON",
          );
          console.error("Response preview:", response.substring(0, 200));
          return [];
        }

        console.log("📊 Response structure:", {
          success: response?.success,
          count: response?.count,
          dataLength: response?.data?.length,
          imageBaseUrl: response?.imageBaseUrl,
        });

        if (
          response &&
          response.success &&
          response.data &&
          response.data.length > 0
        ) {
          const defaultImageBase =
            process.env.EXPO_PUBLIC_API_BASE || process.env.API_BASE || "";
          const imageBaseUrl = response.imageBaseUrl || defaultImageBase;

          if (!imageBaseUrl) {
            console.warn(
              "⚠️ No image base configured. Set EXPO_PUBLIC_API_BASE or API_BASE to construct image URLs from ads response.",
            );
          }

          // console.log(
          //   `� [MOBILE STEP 3] Processing ${response.data.length} ads from API...`,
          // );
          // console.log(
          //   "🌐 Image Base URL:",
          //   imageBaseUrl || "(none configured)",
          // );

          // Check first ad structure
          // if (response.data[0]) {
          //   console.log(
          //     "📸 [MOBILE STEP 4] First ad RAW DATA:",
          //     JSON.stringify(response.data[0], null, 2),
          //   );
          //   console.log("🔍 [MOBILE STEP 4.5] Field check:", {
          //     hasBottomMediaUrl: "bottomMediaUrl" in response.data[0],
          //     bottomMediaUrlValue: response.data[0].bottomMediaUrl,
          //     hasBottomMediaType: "bottomMediaType" in response.data[0],
          //     bottomMediaTypeValue: response.data[0].bottomMediaType,
          //     hasBottomImageGridFS: "bottomImageGridFS" in response.data[0],
          //   });
          // }

          // Format ads for carousel - sorted by priority (backend already sorted)
          // ✅ UPDATED: Now using GridFS URLs instead of base64
          // const formattedApiAds: Ad[] = response.data.map((ad: any, index: number) => {
          //   // Build full image URLs using GridFS endpoints
          //   const bottomImageUri = ad.bottomImageUrl
          //     ? `${imageBaseUrl}${ad.bottomImageUrl}`
          //     : null;

          //   const fullscreenImageUri = ad.fullscreenImageUrl
          //     ? `${imageBaseUrl}${ad.fullscreenImageUrl}`
          //     : null;

          //   if (index === 0) {
          //     console.log(`🖼️  [MOBILE STEP 5] Constructing image URLs for first ad:`);
          //     console.log(`   Bottom Image: ${bottomImageUri}`);
          //     console.log(`   Fullscreen Image: ${fullscreenImageUri || 'N/A'}`);
          //   }

          //   return {
          //     id: `api-${ad._id}`,
          //     image: bottomImageUri ? { uri: bottomImageUri } : { uri: '' },
          //     phone: ad.phoneNumber,
          //     name: ad.title || 'Ad from Dashboard',
          //     hasFullBanner: !!ad.fullscreenImageUrl,
          //     bannerImage: fullscreenImageUri ? { uri: fullscreenImageUri } : undefined,
          //     isFromApi: true,
          //     priority: ad.priority || 5,
          //   };
          // });

          const formattedApiAds: Ad[] = response.data.map(
            (ad: any, index: number) => {
              // 🔥 FIX: API returns bottomImageUrl, not bottomMediaUrl
              // Build full image URLs using GridFS endpoints
              const bottomMediaUrl = ad.bottomImageUrl
                ? `${imageBaseUrl}${ad.bottomImageUrl}`
                : null;

              const fullscreenMediaUrl = ad.fullscreenImageUrl
                ? `${imageBaseUrl}${ad.fullscreenImageUrl}`
                : null;

              // if (index === 0) {
              //   console.log(
              //     `✅ [MOBILE STEP 5] Constructing image URLs for first ad:`,
              //   );
              //   console.log(`   Bottom Image: ${bottomMediaUrl}`);
              //   console.log(
              //     `   Fullscreen Image: ${fullscreenMediaUrl || "N/A"}`,
              //   );
              // }

              return {
                id: `api-${ad._id}`,
                phone: ad.phoneNumber,
                name: ad.title || "Ad",
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

          // console.log(
          //   `✅ [MOBILE STEP 6] Formatted ${formattedApiAds.length} API ads with GridFS URLs`,
          // );
          // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

          return formattedApiAds;
        } else {
          // console.log('⚠️  [MOBILE WARNING] No API ads available in response');
          // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          return [];
        }
      } catch (error) {
        console.error(
          "❌ Network error fetching ads:",
          error instanceof Error ? error : String(error),
        );
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          if ("status" in error) {
            console.error("HTTP status:", (error as any).status);
          }
        }
        // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Return empty array instead of throwing to prevent app crash
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
