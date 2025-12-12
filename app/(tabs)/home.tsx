import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, Image, Dimensions, Linking, RefreshControl, Modal } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import CardRow from "../../components/CardRow";
import FooterCarousel from "../../components/FooterCarousel";
import FAB from "../../components/FAB";



type Card = any;

const { width: screenWidth } = Dimensions.get('window');

const handleAdClick = () => {
  const url = 'https://ldoia.com/';
  Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
};

export default function Home() {
  console.log("🏠 HOME: Component rendering...");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [userName, setUserName] = React.useState<string>("");
  const [currentUserId, setCurrentUserId] = React.useState<string>("");
  const [showVideoTest, setShowVideoTest] = React.useState(false);
  const queryClient = useQueryClient();

  // Fetch user name and ID for profile initial and filtering
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const name = await AsyncStorage.getItem("user_name");
        if (name) setUserName(name);
        
        let userId = await AsyncStorage.getItem("currentUserId");
        if (userId) {
          setCurrentUserId(userId);
          console.log("🔍 Home: Current user ID loaded from storage:", userId);
        } else {
          // Fallback: Fetch from profile API if not in storage
          console.log("⚠️ Home: No user ID in storage, fetching from profile API...");
          try {
            const token = await AsyncStorage.getItem("token");
            if (token) {
              const apiBase = process.env.EXPO_PUBLIC_API_BASE || "https://api.instantllycards.com";
              const response = await fetch(`${apiBase}/api/auth/profile`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              if (response.ok) {
                const profileData = await response.json();
                if (profileData._id) {
                  userId = profileData._id.toString();
                  await AsyncStorage.setItem("currentUserId", userId);
                  setCurrentUserId(userId);
                  console.log("✅ Home: User ID fetched from profile and stored:", userId);
                }
              }
            }
          } catch (apiError) {
            console.error("❌ Home: Failed to fetch user ID from profile:", apiError);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  // Contacts feed - only show cards from my contacts (privacy-focused)
  const feedQ = useQuery({
    queryKey: ["contacts-feed"],
    queryFn: async () => {
      console.log("📱 Home: Fetching contacts feed...");
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.log("❌ Home: No auth token found");
          return [];
        }

        // AWS Cloud primary, Render backup handled by api.ts
        const apiBase = process.env.EXPO_PUBLIC_API_BASE || "https://api.instantllycards.com";
        const url = `${apiBase}/api/cards/feed/contacts`;
        console.log("🔍 Home: Fetching from URL:", url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("✅ Home: Contacts Feed Response:", result.success ? "Success" : "Failed");
        console.log("📊 Home: Total contacts:", result.meta?.totalContacts);
        console.log("📇 Home: Cards count:", result.meta?.totalCards);
        console.log("📋 Home: Cards in feed:", result.data?.map((c: any) => c.name).join(', '));
        
        return result.data || [];
      } catch (error) {
        console.error("❌ Home: Error fetching contacts feed:", error);
        return [];
      }
    },
    staleTime: 30 * 1000, // 30 seconds - reduced cache time
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 mins
    refetchOnMount: true, // Refetch when screen loads to get fresh data
    refetchOnWindowFocus: true, // Refetch when app comes to foreground
    refetchInterval: false, // No auto-refetch - only on manual refresh
  });

  // Manual refresh handler
  const handleRefresh = React.useCallback(() => {
    console.log("🔄 Manual refresh triggered");
    queryClient.invalidateQueries({ queryKey: ["contacts-feed"] });
  }, [queryClient]);

  // Filter cards: 1) Exclude user's own cards, 2) Deduplicate, 3) Apply search query
  const filteredCards = React.useMemo(() => {
    let cards = feedQ.data || [];
    
    console.log("🔍 Home Filter - Starting with cards:", cards.length);
    console.log("🔍 Home Filter - Current User ID:", currentUserId || "NOT SET");
    
    // CRITICAL: Filter out user's own cards (extra safety on client side)
    if (currentUserId) {
      const beforeFilter = cards.length;
      cards = cards.filter((card: any) => {
        const cardUserId = (card.userId || card.owner || "").toString();
        const isOwnCard = cardUserId === currentUserId;
        
        console.log(`🔍 Card: "${card.name}" | cardUserId: ${cardUserId} | currentUserId: ${currentUserId} | isOwn: ${isOwnCard}`);
        
        if (isOwnCard) {
          console.log("🚫 Home: Filtering out user's own card:", card.name);
        }
        return !isOwnCard;
      });
      console.log(`✅ Home Filter - Filtered ${beforeFilter - cards.length} own cards. Remaining: ${cards.length}`);
    } else {
      console.warn("⚠️ Home Filter - No currentUserId set, cannot filter own cards!");
    }
    
    // Deduplicate cards by _id to prevent React key errors
    const uniqueCards = Array.from(
      new Map(cards.map((card: any) => [card._id, card])).values()
    );
    console.log(`✅ Home Filter - After deduplication: ${uniqueCards.length} cards`);
    
    // Apply search filter
    if (!searchQuery.trim()) return uniqueCards;
    
    const query = searchQuery.toLowerCase();
    return uniqueCards.filter((card: any) => {
      const companyName = (card.companyName || "").toLowerCase();
      const name = (card.name || "").toLowerCase();
      const keywords = (card.keywords || "").toLowerCase();
      const location = (card.companyAddress || card.location || "").toLowerCase();
      
      return companyName.includes(query) || 
             name.includes(query) || 
             keywords.includes(query) ||
             location.includes(query);
    });
  }, [feedQ.data, searchQuery, currentUserId]);

  console.log("🎯 Home: Query state:", { 
    isLoading: feedQ.isLoading, 
    isRefetching: feedQ.isRefetching,
    isError: feedQ.isError, 
    dataLength: feedQ.data?.length,
    filteredLength: filteredCards?.length 
  });

  console.log("🎨 HOME: About to render SafeAreaView");

  return (
    <SafeAreaView style={s.root}>
      {/* Search Header */}
      <View style={s.searchContainer}>
        <View style={s.searchWrapper}>
          <View style={s.searchBox}>
            <TextInput
              style={s.searchInput}
              placeholder="Search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={s.searchButton}>
            <Text style={s.searchIcon}></Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={s.profileButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <View style={s.profileGradientBorder}>
            <View style={s.profileInner}>
              <Text style={s.profileInitial}>
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {feedQ.isLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={(it: any) => it._id}
          renderItem={({ item }) => <CardRow c={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 180 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyTxt}>No cards yet.</Text>
              <Text style={s.emptySubTxt}>
                Create your first card or sync your contacts to see cards from your network!
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={feedQ.isRefetching && !feedQ.isLoading}
              onRefresh={handleRefresh}
              colors={["#3B82F6"]}
              tintColor="#3B82F6"
            />
          }
        />
      )}

      {/* Footer Carousel */}
      <FooterCarousel />

      <FAB />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6FA" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 30,
    padding: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  searchBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 2,
  },
  searchInput: {
    fontSize: 16,
    color: "#6B7280",
    padding: 0,
  },
  searchButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  profileButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  profileGradientBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#2196F3",
    backgroundColor: "#D84315",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#D84315",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  empty: { flex: 1, height: 240, alignItems: "center", justifyContent: "center" },
  emptyTxt: { color: "#6B7280", fontSize: 18, textAlign: "center", fontWeight: "500" },
  emptySubTxt: { color: "#9CA3AF", fontSize: 14, textAlign: "center", marginTop: 8 },
  testButton: {
    position: "absolute",
    top: 50,
    right: 16,
    backgroundColor: "#3B82F6",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1000,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  videoTestContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  videoTestTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  videoPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  videoPlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoPlaceholderSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  playVideoButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playVideoText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  videoPlayer: {
    width: "100%",
    height: 200,
    backgroundColor: "#000000",
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  videoOverlay: {
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: {
    fontSize: 64,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  playText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  videoTestMessage: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  knowMoreButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  knowMoreText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  closeButtonText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
});
