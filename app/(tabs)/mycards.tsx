import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, StyleSheet, Text, View, RefreshControl, TouchableOpacity, Pressable, Modal, Animated } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import api from "@/lib/api";
import CardRow from "@/components/CardRow";
import { ensureAuth } from "@/lib/auth";
import FooterCarousel from "@/components/FooterCarousel";
import GroupSharingModal from "@/components/GroupSharingModal";
import GroupConnectionUI from "@/components/GroupConnectionUI";
import groupSharingService, { GroupSharingSession } from "@/lib/groupSharingService";
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

type Card = any;

export default function MyCards() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  
  // Group sharing states
  const [showGroupSharingModal, setShowGroupSharingModal] = useState(false);
  const [groupSharingMode, setGroupSharingMode] = useState<'create' | 'join'>('create');
  const [showGroupConnection, setShowGroupConnection] = useState(false);
  const [currentGroupSession, setCurrentGroupSession] = useState<GroupSharingSession | null>(null);
  const [showFABMenu, setShowFABMenu] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  
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

  // Group sharing handlers
  const handleCreateGroupSharing = () => {
    console.log('🎯 MyCards: handleCreateGroupSharing called');
    setShowFABMenu(false);
    setShowTooltip(false);
    setGroupSharingMode('create');
    setShowGroupSharingModal(true);
    console.log('🎯 MyCards: Modal should open now');
  };

  const handleJoinGroupSharing = () => {
    console.log('🎯 MyCards: handleJoinGroupSharing called');
    setShowFABMenu(false);
    setShowTooltip(false);
    setGroupSharingMode('join');
    setShowGroupSharingModal(true);
    console.log('🎯 MyCards: Join modal should open now');
  };

  const handleGroupSharingSuccess = (session: GroupSharingSession, code?: string) => {
    console.log('🎉 MyCards: handleGroupSharingSuccess called', { code, sessionId: session?.id });
    setCurrentGroupSession(session);
    setShowGroupSharingModal(false);
    setShowGroupConnection(true);
    console.log('🎉 MyCards: Connection UI should open now');
  };

  const handleGroupConnectionComplete = () => {
    console.log('✅ MyCards: handleGroupConnectionComplete called');
    setShowGroupConnection(false);
    setCurrentGroupSession(null);
    console.log('✅ MyCards: User can now select cards to share');
    // User can now select cards to share
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

      {/* Footer Carousel */}
      <FooterCarousel />

      {/* Floating Action Button with Menu */}
      <GroupSharingFAB
        showMenu={showFABMenu}
        showTooltip={showTooltip}
        onToggleMenu={() => {
          setShowFABMenu(!showFABMenu);
          if (!showFABMenu) setShowTooltip(false);
        }}
        onCreateGroupSharing={handleCreateGroupSharing}
        onJoinGroupSharing={handleJoinGroupSharing}
        onCloseMenu={() => setShowFABMenu(false)}
      />

      {/* Group Sharing Modal */}
      <GroupSharingModal
        visible={showGroupSharingModal}
        mode={groupSharingMode}
        onClose={() => setShowGroupSharingModal(false)}
        onSuccess={handleGroupSharingSuccess}
      />

      {/* Group Connection UI */}
      {showGroupConnection && currentGroupSession && (
        <GroupConnectionUI
          visible={showGroupConnection}
          session={currentGroupSession}
          isAdmin={currentGroupSession.adminId === 'current_user'}
          onClose={() => setShowGroupConnection(false)}
          onConnect={handleGroupConnectionComplete}
        />
      )}
    </SafeAreaView>
  );
}

// Floating Action Button Component for Group Sharing
function GroupSharingFAB({
  showMenu,
  showTooltip,
  onToggleMenu,
  onCreateGroupSharing,
  onJoinGroupSharing,
  onCloseMenu
}: {
  showMenu: boolean;
  showTooltip: boolean;
  onToggleMenu: () => void;
  onCreateGroupSharing: () => void;
  onJoinGroupSharing: () => void;
  onCloseMenu: () => void;
}) {
  const FOOTER_CAROUSEL_HEIGHT = 100;
  const SIZE = 56;
  const bottom = FOOTER_CAROUSEL_HEIGHT + 16;

  return (
    <>
      {/* Menu Options */}
      {showMenu && (
        <View style={[fabStyles.menuContainer, { bottom: bottom + SIZE + 10 }]}>
          <TouchableOpacity 
            style={fabStyles.menuItem}
            onPress={onCreateGroupSharing}
          >
            <Ionicons name="people" size={20} color="#6366F1" style={{ marginRight: 12 }} />
            <Text style={fabStyles.menuText}>Create Group Sharing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[fabStyles.menuItem, { borderBottomWidth: 0 }]}
            onPress={onJoinGroupSharing}
          >
            <Ionicons name="enter" size={20} color="#10B981" style={{ marginRight: 12 }} />
            <Text style={fabStyles.menuText}>Join Via Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tooltip */}
      {showTooltip && !showMenu && (
        <View style={[fabStyles.tooltip, { bottom: bottom + SIZE / 2 - 20 }]}>
          <Text style={fabStyles.tooltipText}>Share your cards with groups!</Text>
          <View style={fabStyles.tooltipArrow} />
        </View>
      )}
      
      {/* Overlay to close menu */}
      {showMenu && (
        <Pressable 
          style={fabStyles.overlay} 
          onPress={onCloseMenu} 
        />
      )}
      
      {/* FAB Button */}
      <Pressable
        onPress={onToggleMenu}
        style={[
          fabStyles.fab, 
          { 
            right: 18, 
            bottom, 
            width: SIZE, 
            height: SIZE, 
            borderRadius: SIZE / 2,
            transform: [{ rotate: showMenu ? '45deg' : '0deg' }]
          }
        ]}
        accessibilityRole="button"
        accessibilityLabel="Group sharing options"
      >
        <Ionicons name="people" size={28} color="#FFFFFF" />
      </Pressable>
    </>
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

const fabStyles = StyleSheet.create({
  fab: {
    position: "absolute",
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 50,
  },
  menuContainer: {
    position: "absolute",
    right: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 60,
    minWidth: 220,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  menuText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  tooltip: {
    position: "absolute",
    right: 90,
    backgroundColor: "#1F2937",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    zIndex: 55,
    maxWidth: 200,
  },
  tooltipText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  tooltipArrow: {
    position: "absolute",
    right: -6,
    top: "50%",
    marginTop: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "#1F2937",
    borderRightColor: "transparent",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 55,
  },
});
