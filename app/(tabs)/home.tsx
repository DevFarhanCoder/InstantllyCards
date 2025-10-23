import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, Image, Dimensions, Linking, RefreshControl } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import FAB from "@/components/FAB";
import CardRow from "@/components/CardRow";
import FooterCarousel from "@/components/FooterCarousel";

type Card = any;

const { width: screenWidth } = Dimensions.get('window');

const handleAdClick = () => {
  const url = 'https://ldoia.com/';
  Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
};

export default function Home() {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const queryClient = useQueryClient();

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

        const apiBase = process.env.EXPO_PUBLIC_API_BASE || "https://instantlly-cards-backend-6ki0.onrender.com";
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
    staleTime: 10000, // Reduced from 30s to 10s - cards become stale faster
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Auto-refetch every 30 seconds for real-time updates
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
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  searchWrapper: {
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
    paddingVertical: 14,
    marginRight: 2,
  },
  searchInput: {
    fontSize: 16,
    color: "#6B7280",
    padding: 0,
  },
  searchButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: {
    fontSize: 20,
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
