import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import CardRow from "../../components/CardRow";

export default function BusCard() {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [currentUserId, setCurrentUserId] = React.useState<string>("");
  const queryClient = useQueryClient();

  // Fetch user ID
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        let userId = await AsyncStorage.getItem("currentUserId");
        if (userId) {
          setCurrentUserId(userId);
        } else {
          try {
            const token = await AsyncStorage.getItem("token");
            if (token) {
              const apiBase =
                Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE ||
                "https://api.instantllycards.com";
              const response = await fetch(`${apiBase}/api/auth/profile`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });
              if (response.ok) {
                const profileData = await response.json();
                if (profileData._id) {
                  userId = profileData._id.toString();
                  await AsyncStorage.setItem("currentUserId", userId);
                  setCurrentUserId(userId);
                }
              }
            }
          } catch (apiError) {
            console.error("❌ BusCard: Failed to fetch user ID:", apiError);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  // Contacts feed - show cards from my contacts
  const feedQ = useQuery({
    queryKey: ["contacts-feed", currentUserId],
    enabled: !!currentUserId,
    queryFn: async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return [];

        const apiBase =
          Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE ||
          "https://api.instantllycards.com";
        const url = `${apiBase}/api/cards/feed/contacts`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data || [];
      } catch (error) {
        console.error("❌ BusCard: Error fetching contacts feed:", error);
        return [];
      }
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  // Refetch when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (currentUserId) {
        queryClient.invalidateQueries({
          queryKey: ["contacts-feed", currentUserId],
        });
      }
    }, [currentUserId, queryClient]),
  );

  // Manual refresh handler
  const handleRefresh = React.useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["contacts-feed", currentUserId],
    });
  }, [queryClient, currentUserId]);

  // Filter cards: exclude own cards, deduplicate, search
  const filteredCards = React.useMemo(() => {
    let cards = feedQ.data || [];

    // Filter out user's own cards
    if (currentUserId) {
      cards = cards.filter((card: any) => {
        const cardUserId = (card.userId || card.owner || "").toString();
        return cardUserId !== currentUserId;
      });
    }

    // Deduplicate by _id
    const uniqueCards = Array.from(
      new Map(cards.map((card: any) => [card._id, card])).values(),
    ) as any[];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return uniqueCards.filter((card: any) => {
        const name = (card.name || "").toLowerCase();
        const company = (card.company || "").toLowerCase();
        const designation = (card.designation || "").toLowerCase();
        const category = (card.category || "").toLowerCase();
        return (
          name.includes(q) ||
          company.includes(q) ||
          designation.includes(q) ||
          category.includes(q)
        );
      });
    }

    return uniqueCards;
  }, [feedQ.data, currentUserId, searchQuery]);

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.headerRow}>
        <Text style={s.headerTitle}>AllCards</Text>
      </View>

      {/* Search Bar */}
      <View style={s.searchBarRow}>
        <View style={s.searchBarContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={s.searchIcon}
          />
          <TextInput
            style={s.searchInput}
            placeholder="Search business cards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={s.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cards List */}
      {feedQ.isLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={(it: any) => it._id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16 }}>
              <CardRow c={item} />
            </View>
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
          initialNumToRender={5}
          windowSize={5}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="card-outline" size={64} color="#D1D5DB" />
              <Text style={s.emptyTxt}>No business cards yet</Text>
              <Text style={s.emptySubTxt}>
                Sync your contacts to see business cards from your network!
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  searchBarRow: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  empty: {
    flex: 1,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTxt: {
    color: "#6B7280",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "500",
  },
  emptySubTxt: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 40,
  },
});
