import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, StyleSheet, Text, View, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import api from "@/lib/api";
import CardRow from "@/components/CardRow";
import { ensureAuth } from "@/lib/auth";

type Card = any;

export default function MyCards() {
  const queryClient = useQueryClient();
  
  const q = useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      console.log("MyCards: Fetching user cards...");
      try {
        const token = await ensureAuth();
        console.log("MyCards: Auth token:", token ? "Present" : "Missing");
        
        if (!token) {
          return [];
        }
        
        const response = await api.get("/cards");
        console.log("MyCards: API Response:", response);
        
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data || [];
        }
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error("MyCards: Error fetching cards:", error);
        return [];
      }
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["cards"] });
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerTitle}>My Business Cards</Text>
        </View>
        <TouchableOpacity 
          style={s.addButton}
          onPress={() => router.push('/builder')}
        >
          <Text style={s.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={q.data ?? []}
        keyExtractor={(it: any) => it._id}
        renderItem={({ item }) => <CardRow c={item} showEditButton={true} onRefresh={handleRefresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching}
            onRefresh={handleRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTxt}>You haven't created any cards yet.</Text>
            <Text style={s.emptySubTxt}>Tap the + button to create your first card</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#3B82F6",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "300",
    lineHeight: 24,
  },
  empty: { 
    flex: 1, 
    height: 300, 
    alignItems: "center", 
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTxt: { 
    color: "#6B7280", 
    fontSize: 18, 
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubTxt: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
