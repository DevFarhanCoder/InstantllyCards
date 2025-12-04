import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, Image, Dimensions, Linking, RefreshControl } from "react-native";
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
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [userName, setUserName] = React.useState<string>("");
  const queryClient = useQueryClient();

  // Fetch user name for profile initial
  React.useEffect(() => {
    const fetchUserName = async () => {
      try {
        const name = await AsyncStorage.getItem("user_name");
        if (name) setUserName(name);
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };
    fetchUserName();
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
        
        return result.data || [];
      } catch (error) {
        console.error("❌ Home: Error fetching contacts feed:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 mins
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 mins
    refetchOnMount: false, // Don't refetch every time component mounts
    refetchOnWindowFocus: false, // Don't refetch when app comes to foreground
    refetchInterval: false, // No auto-refetch - only on manual refresh
  });

  // Manual refresh handler
  const handleRefresh = React.useCallback(() => {
    console.log("🔄 Manual refresh triggered");
    queryClient.invalidateQueries({ queryKey: ["contacts-feed"] });
  }, [queryClient]);

  // Filter cards based on search query
  const filteredCards = React.useMemo(() => {
    if (!searchQuery.trim() || !feedQ.data) return feedQ.data || [];
    
    const query = searchQuery.toLowerCase();
    return feedQ.data.filter((card: any) => {
      const companyName = (card.companyName || "").toLowerCase();
      const name = (card.name || "").toLowerCase();
      const keywords = (card.keywords || "").toLowerCase();
      const location = (card.companyAddress || card.location || "").toLowerCase();
      
      return companyName.includes(query) || 
             name.includes(query) || 
             keywords.includes(query) ||
             location.includes(query);
    });
  }, [feedQ.data, searchQuery]);

  console.log("🎯 Home: Query state:", { 
    isLoading: feedQ.isLoading, 
    isRefetching: feedQ.isRefetching,
    isError: feedQ.isError, 
    dataLength: feedQ.data?.length,
    filteredLength: filteredCards?.length 
  });

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
});
