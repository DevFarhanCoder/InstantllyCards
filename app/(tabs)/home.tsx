import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, Image, Dimensions, Linking } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";
import FAB from "@/components/FAB";
import CardRow from "@/components/CardRow";

type Card = any;

const { width: screenWidth } = Dimensions.get('window');

export default function Home() {
  const tabH = useBottomTabBarHeight();
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Function to handle ad click
  const handleAdClick = () => {
    const url = 'https://ldoia.com/'; // Replace with your actual TPL website URL
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  // Public feed of all users' cards - use correct backend endpoint
  const feedQ = useQuery({
    queryKey: ["public-feed"],
    queryFn: async () => {
      console.log("Home: Fetching public feed...");
      try {
        // Direct fetch to bypass auth issues - this endpoint doesn't need auth
        const apiBase = process.env.EXPO_PUBLIC_API_BASE || "https://instantlly-cards-backend.onrender.com";
        const url = `${apiBase}/api/cards/feed/public`;
        console.log("Home: Fetching from URL:", url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("Home: Raw API Response:", result);
        console.log("Home: Feed data:", result.data);
        console.log("Home: Data type:", typeof result.data, "Length:", result.data?.length);
        
        // Backend returns { data: [...] } format
        return result.data || [];
      } catch (error) {
        console.error("Home: Error fetching public feed:", error);
        return [];
      }
    },
  });

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

  console.log("Home: Query state:", { 
    isLoading: feedQ.isLoading, 
    isError: feedQ.isError, 
    error: feedQ.error,
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
              <Text style={s.emptyTxt}>No business cards available yet.</Text>
              <Text style={s.emptySubTxt}>Check back later for new cards!</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          refreshing={false}
          onRefresh={() => feedQ.refetch()}
        />
      )}

      {/* Ad Section - Stuck directly to bottom navigation */}
      <View style={[s.adContainer, { bottom: 0 }]}>
        <TouchableOpacity style={s.adTouchable} activeOpacity={0.8} onPress={handleAdClick}>
          <Image 
            source={{ uri: 'https://i.ibb.co/BVJzsw4L/tplad-backup.jpg' }} 
            style={s.adImage}
            resizeMode="stretch"
          />
        </TouchableOpacity>
      </View>

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
  adContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 0, // Remove padding - back to full width
    paddingVertical: 0, // Remove padding
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  adTouchable: {
    borderRadius: 0, // Remove border radius - back to full width
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  adImage: {
    width: '100%',
    height: 100, // Optimal height for the ad
    borderRadius: 0, // Remove border radius
  },
});
