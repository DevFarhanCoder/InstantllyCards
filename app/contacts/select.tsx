import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Linking,
  AppState
} from "react-native";
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import api from "@/lib/api";
import { ensureAuth } from "@/lib/auth";

type DeviceContact = {
  id: string;
  name: string;
  phoneNumber: string;
  isAppUser: boolean;
  profilePicture?: string;
  userId?: string;
  about?: string;
};

type ContactSection = {
  title: string;
  data: DeviceContact[];
};

export default function ContactSelectScreen() {
  const { mode, groupId, cardId, cardTitle } = useLocalSearchParams<{ 
    mode?: string; 
    groupId?: string; 
    cardId?: string; 
    cardTitle?: string; 
  }>();
  
  const isGroupMode = mode === 'group';
  const isGroupAddMode = mode === 'group_add';
  const isCardShareMode = !!cardId; // Card sharing mode if cardId is present
  
  const [searchQuery, setSearchQuery] = useState("");
  const [contactsSynced, setContactsSynced] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<DeviceContact[]>([]);
  const queryClient = useQueryClient();

  // Check if contacts have been synced before
  useEffect(() => {
    const checkSyncStatus = async () => {
      try {
        const syncStatus = await AsyncStorage.getItem('contactsSynced');
        if (syncStatus === 'true') {
          setContactsSynced(true);
        } else {
          // Auto-sync contacts when screen loads for the first time
          await syncDeviceContacts();
        }
      } catch (error) {
        console.error('Error checking sync status:', error);
        // If there's an error, try to sync anyway
        await syncDeviceContacts();
      }
    };

    checkSyncStatus();
  }, []);

  // Function to sync device contacts with backend
  const syncDeviceContacts = async () => {
    if (contactsLoading) return; // Prevent duplicate sync requests
    
    try {
      setContactsLoading(true);
      console.log('Starting contact sync...');

      // Request contacts permission
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Contacts permission denied');
        Alert.alert('Permission Required', 'Please grant contacts permission to sync your contacts.');
        setContactsLoading(false);
        return;
      }

      // Get device contacts
      console.log('Getting device contacts...');
      const { data: deviceContacts } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });
      
      // Extract phone numbers with proper formatting
      const phoneNumbers = deviceContacts
        .filter((contact: any) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact: any) => ({
          name: contact.name || 'Unknown Contact',
          phoneNumber: contact.phoneNumbers[0]?.number?.replace(/\D/g, '') || ''
        }))
        .filter((contact: any) => contact.phoneNumber && contact.phoneNumber.length >= 10);

      console.log(`Found ${phoneNumbers.length} contacts with valid phone numbers`);

      // Send to backend to sync and store all contacts
      const token = await ensureAuth();
      if (token) {
        console.log(`Syncing ${phoneNumbers.length} contacts to backend...`);
        await api.post("/contacts/sync-all", { contacts: phoneNumbers });
        setContactsSynced(true);
        
        // Save sync status to AsyncStorage
        try {
          await AsyncStorage.setItem('contactsSynced', 'true');
          console.log('✅ Contacts synced successfully');
        } catch (storageError) {
          console.error('Error saving sync status:', storageError);
        }

        // Refresh the contact queries to show updated data
        queryClient.invalidateQueries({ queryKey: ["app-contacts"] });
        queryClient.invalidateQueries({ queryKey: ["stored-contacts"] });
      }
    } catch (error) {
      console.error('❌ Error syncing contacts:', error);
      Alert.alert('Sync Error', 'Failed to sync contacts. Please try again.');
    } finally {
      setContactsLoading(false);
    }
  };

  // Function to refresh contact app status
  const refreshContactStatus = async () => {
    try {
      const token = await ensureAuth();
      if (!token) {
        console.log("❌ No auth token, skipping contact refresh");
        return;
      }

      console.log("🔄 Refreshing contact status...");
      const response = await api.post("/contacts/refresh-app-status");
      console.log("✅ Contact refresh response:", response);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["stored-contacts"] });
      console.log("✅ Contacts refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing contact status:", error);
      // Only show error alerts for critical failures
      if (error && typeof error === 'object' && 'status' in error && error.status !== 404) {
        Alert.alert("Error", "Failed to refresh contact status. Please try again.");
      }
    }
  };

  // Refresh contacts when screen becomes focused
  useFocusEffect(
    React.useCallback(() => {
      refreshContactStatus();
    }, [])
  );

  // Refresh contacts when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        refreshContactStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Fetch stored contacts from backend - this contains all the info we need
  const storedContactsQuery = useQuery({
    queryKey: ["stored-contacts"],
    queryFn: async () => {
      try {
        const token = await ensureAuth();
        if (!token) return [];

        const response = await api.get("/contacts/all");
        console.log("Stored contacts response:", response);
        
        // The API returns { success: true, data: [...] }
        return response.data || [];
      } catch (error) {
        console.error("Error fetching stored contacts:", error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    enabled: contactsSynced, // Only fetch if contacts have been synced
  });

  // Determine overall loading state
  const queryLoading = storedContactsQuery.isLoading;
  const isLoading = !!(queryLoading || contactsLoading);

  // Use stored contacts or empty array if loading
  const storedContacts = storedContactsQuery.data || [];

  console.log("Stored contacts data:", storedContacts);
  console.log("Stored contacts length:", storedContacts.length);
  console.log("Contacts synced:", contactsSynced);

  // Create processed contacts from stored contacts (they already have isAppUser info)
  const processedContacts = storedContacts.map((contact: any) => ({
    id: contact._id || Math.random().toString(),
    name: contact.name,
    phoneNumber: contact.phoneNumber,
    isAppUser: contact.isAppUser,
    profilePicture: contact.profilePicture,
    userId: contact.appUserId, // The populated user ID for app users
    about: contact.about || (contact.isAppUser ? "Available" : undefined) // Use API about or default
  }));

  const handleInvite = async (contact: DeviceContact) => {
    try {
      const message = `Let's chat on InstantllyCards!\nIt's fast, simple and secure app we can use to create business cards, messages and calls each other for free. Get it at https://instantllycards.com (demo link for now).`;

      // Format phone number for WhatsApp (remove any non-digits and ensure it starts with country code)
      let phoneNumber = contact.phoneNumber.replace(/\D/g, '');
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '91' + phoneNumber.substring(1); // Add India country code if starts with 0
      } else if (!phoneNumber.startsWith('91')) {
        phoneNumber = '91' + phoneNumber; // Add India country code if not present
      }

      // Try WhatsApp first
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      const smsUrl = `sms:${contact.phoneNumber}?body=${encodeURIComponent(message)}`;

      // Check if WhatsApp is available
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to SMS if WhatsApp is not available
        const canOpenSMS = await Linking.canOpenURL(smsUrl);
        if (canOpenSMS) {
          await Linking.openURL(smsUrl);
        } else {
          Alert.alert('Error', 'Cannot open messaging app');
        }
      }
    } catch (error) {
      console.error('Error opening messaging app:', error);
      Alert.alert('Error', 'Failed to open messaging app');
    }
  };

  const handleStartChat = async (contact: DeviceContact) => {
    if (contact.isAppUser && contact.userId) {
      console.log('💬 Starting chat with:', contact.name, 'userId:', contact.userId);
      
      // Store contact information locally for future reference
      const contactInfo = {
        name: contact.name,
        profilePicture: contact.profilePicture,
        about: contact.about,
        phoneNumber: contact.phoneNumber,
        userId: contact.userId
      };
      
      try {
        await AsyncStorage.setItem(`contact_${contact.userId}`, JSON.stringify(contactInfo));
        console.log('💾 Contact info stored locally:', contactInfo);
      } catch (error) {
        console.error('Error storing contact info:', error);
      }
      
      router.push({
        pathname: `/chat/[userId]`,
        params: { 
          userId: contact.userId,
          name: contact.name
        }
      });
    } else {
      console.log('❌ Cannot start chat - not an app user or missing userId:', contact);
      Alert.alert('Error', 'Unable to start chat with this contact');
    }
  };

  const handleContactSelect = (contact: DeviceContact) => {
    const isSelected = selectedContacts.some(c => c.id === contact.id);
    
    if (isSelected) {
      // Remove from selection
      setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
    } else {
      // Add to selection
      setSelectedContacts(prev => [...prev, contact]);
    }
  };

  const addMembersToGroup = async () => {
    if (!groupId || selectedContacts.length === 0) return;

    try {
      // Load current group info
      const groupData = await AsyncStorage.getItem(`group_${groupId}`);
      if (!groupData) {
        Alert.alert('Error', 'Group not found');
        return;
      }

      const group = JSON.parse(groupData);
      
      // Get new member IDs to add
      const newMemberIds = selectedContacts.map(c => c.userId || c.id);
      
      // Check if any members are already in the group
      const alreadyInGroup = newMemberIds.filter(id => group.members.includes(id));
      if (alreadyInGroup.length > 0) {
        Alert.alert('Info', 'Some selected contacts are already in the group');
        return;
      }

      // Update group members
      const updatedGroup = {
        ...group,
        members: [...group.members, ...newMemberIds],
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(`group_${groupId}`, JSON.stringify(updatedGroup));

      // Store contact data for new members
      for (const contact of selectedContacts) {
        await AsyncStorage.setItem(`contact_${contact.userId || contact.id}`, JSON.stringify(contact));
      }

      // Add system message
      const messagesData = await AsyncStorage.getItem(`group_messages_${groupId}`);
      const messages = messagesData ? JSON.parse(messagesData) : [];
      
      const memberNames = selectedContacts.map(c => c.name).join(', ');
      const systemMessage = {
        id: `msg_system_${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        text: `${memberNames} ${selectedContacts.length === 1 ? 'was' : 'were'} added to the group`,
        timestamp: new Date().toISOString(),
        type: 'system',
      };
      
      messages.push(systemMessage);
      await AsyncStorage.setItem(`group_messages_${groupId}`, JSON.stringify(messages));

      console.log('✅ Members added to group successfully');
      
      Alert.alert(
        'Success',
        `${selectedContacts.length} member${selectedContacts.length === 1 ? '' : 's'} added to the group!`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error adding members to group:', error);
      Alert.alert('Error', 'Failed to add members. Please try again.');
    }
  };

  const shareCardWithContacts = async () => {
    if (!cardId || selectedContacts.length === 0) return;

    try {
      const token = await ensureAuth();
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      // Show progress
      Alert.alert('Sharing', 'Sending card to selected contacts...');

      const sharePromises = selectedContacts.map(async (contact) => {
        if (!contact.userId) {
          console.log(`⚠️ Skipping ${contact.name} - not an app user`);
          return { success: false, contact: contact.name, reason: 'Not an app user' };
        }

        try {
          const response = await api.post(`/cards/${cardId}/share`, {
            recipientId: contact.userId,
            message: `Check out my business card!`
          });

          console.log(`✅ Card shared with ${contact.name}:`, response);
          return { success: true, contact: contact.name };
        } catch (error: any) {
          console.error(`❌ Failed to share with ${contact.name}:`, error);
          
          // Handle specific error cases
          if (error.response?.status === 404) {
            return { success: false, contact: contact.name, reason: 'Card not found' };
          } else {
            return { success: false, contact: contact.name, reason: 'Share failed' };
          }
        }
      });

      const results = await Promise.all(sharePromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      // Refresh the sent cards query to show the new shares
      queryClient.invalidateQueries({ queryKey: ["sent-cards"] });

      // Show results
      let alertMessage = '';
      if (successful.length > 0) {
        alertMessage += `Card successfully shared with ${successful.length} contact${successful.length === 1 ? '' : 's'}:\n`;
        alertMessage += successful.map(r => `• ${r.contact}`).join('\n');
      }
      
      if (failed.length > 0) {
        if (alertMessage) alertMessage += '\n\n';
        alertMessage += `Failed to share with ${failed.length} contact${failed.length === 1 ? '' : 's'}:\n`;
        alertMessage += failed.map(r => `• ${r.contact} (${r.reason})`).join('\n');
      }

      Alert.alert(
        successful.length === selectedContacts.length ? 'Success!' : 'Partial Success',
        alertMessage,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Error sharing card:', error);
      Alert.alert('Error', 'Failed to share card. Please try again.');
    }
  };

  const storeSelectedContactsAndNavigate = async () => {
    try {
      // Store each selected contact in AsyncStorage
      for (const contact of selectedContacts) {
        const contactKey = `temp_contact_${contact.id}`;
        await AsyncStorage.setItem(contactKey, JSON.stringify(contact));
      }
      
      // Navigate with contact IDs
      const contactIds = selectedContacts.map(c => c.id).join(',');
      router.push(`/group-info?selectedContactIds=${contactIds}` as any);
    } catch (error) {
      console.error('Error storing contacts:', error);
      Alert.alert('Error', 'Failed to prepare group creation. Please try again.');
    }
  };

  const filteredContacts = processedContacts.filter((contact: DeviceContact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );

  // Create sections for app users and non-app users
  const filteredAppUsers = filteredContacts.filter((contact: DeviceContact) => contact.isAppUser);
  const filteredNonAppUsers = filteredContacts.filter((contact: DeviceContact) => !contact.isAppUser);

  const contactSections: ContactSection[] = [
    ...(filteredAppUsers.length > 0 ? [{
      title: "Contacts on InstantllyCards",
      data: filteredAppUsers
    }] : []),
    ...(filteredNonAppUsers.length > 0 ? [{
      title: "Invite to InstantllyCards",
      data: filteredNonAppUsers
    }] : [])
  ];

  const renderContactItem = ({ item }: { item: DeviceContact }) => {
    if (item.isAppUser) {
      const isSelected = selectedContacts.some(contact => contact.id === item.id);
      
      // App user layout: Profile pic + Name/Status + Chat/Select button
      return (
        <View style={styles.appUserItem}>
          <View style={styles.appUserAvatar}>
            {item.profilePicture ? (
              <Image source={{ uri: item.profilePicture }} style={styles.appUserAvatarImage} />
            ) : (
              <Text style={styles.appUserAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            )}
          </View>

          <View style={styles.appUserInfo}>
            <Text style={styles.appUserName}>{item.name}</Text>
            <Text style={styles.appUserStatus}>{item.about || "Available"}</Text>
          </View>

          {(isGroupMode || isGroupAddMode || isCardShareMode) ? (
            <TouchableOpacity
              style={[styles.selectButton, isSelected && styles.selectedButton]}
              onPress={() => handleContactSelect(item)}
            >
              {isSelected ? (
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              ) : (
                <View style={styles.selectCircle} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => handleStartChat(item)}
            >
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    } else {
      // Non-app user layout: Standard avatar + Name + Phone + Invite button (not selectable for groups or card sharing)
      const isDisabled = isGroupMode || isGroupAddMode || isCardShareMode;
      
      return (
        <TouchableOpacity
          style={[styles.nonAppUserItem, isDisabled && styles.disabledItem]}
          onPress={() => !isDisabled && handleInvite(item)}
          disabled={isDisabled}
        >
          <View style={styles.nonAppUserAvatar}>
            <Text style={styles.nonAppUserAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>

          <View style={styles.nonAppUserInfo}>
            <Text style={styles.nonAppUserName}>{item.name}</Text>
            <Text style={styles.nonAppUserPhone}>{item.phoneNumber}</Text>
            {isCardShareMode && (
              <Text style={styles.nonAppUserNote}>Card sharing requires app users</Text>
            )}
          </View>

          {!isDisabled && (
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => handleInvite(item)}
            >
              <Text style={styles.inviteButtonText}>Invite</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    }
  };

  const renderSectionHeader = ({ section }: { section: ContactSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.title === "Contacts on InstantllyCards" && (
        <Text style={styles.sectionSubtitle}>Tap to start chatting</Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select contact</Text>
          <Text style={styles.contactCount}>{processedContacts.length} contacts</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>
            {contactsLoading ? 'Syncing contacts...' : 'Loading contacts...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {isCardShareMode 
              ? "Share Card" 
              : isGroupMode 
                ? "Add members" 
                : isGroupAddMode 
                  ? "Add members" 
                  : "Select contact"
            }
          </Text>
          <Text style={styles.contactCount}>
            {(isGroupMode || isGroupAddMode || isCardShareMode) && selectedContacts.length > 0 
              ? `${selectedContacts.length} selected`
              : `${processedContacts.length} contacts`
            }
          </Text>
          {isCardShareMode && cardTitle && (
            <Text style={styles.cardTitle} numberOfLines={1}>
              Sharing: {decodeURIComponent(cardTitle)}
            </Text>
          )}
        </View>
        {((isGroupMode || isGroupAddMode || isCardShareMode) && selectedContacts.length > 0) ? (
          <TouchableOpacity 
            onPress={() => {
              if (isCardShareMode) {
                // Share card with selected contacts
                shareCardWithContacts();
              } else if (isGroupAddMode && groupId) {
                // Add members to existing group
                addMembersToGroup();
              } else {
                // Store selected contacts before navigation
                console.log('🔍 Storing selected contacts before navigation:', selectedContacts.map(c => ({name: c.name, id: c.id})));
                storeSelectedContactsAndNavigate();
              }
            }} 
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>
              {isCardShareMode ? 'Share' : isGroupAddMode ? 'Add' : 'Next'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => {
            // Manual refresh: re-sync contacts and refresh queries
            syncDeviceContacts();
            refreshContactStatus();
          }} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#D1D5DB" style={styles.searchIcon} />

          <TextInput
            style={styles.searchInput}
            placeholder="Search name or number"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
            selectionColor="#22C55E"
            autoCorrect={false}
            autoCapitalize="none"
            underlineColorAndroid="transparent" // ✅ fix Android underline
            numberOfLines={1}                   // ✅ keep single line
          />
        </View>
      </View>


      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionEmoji}>👥</Text>
          </View>
          <Text style={styles.quickActionText}>New group</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionEmoji}>👤</Text>
          </View>
          <Text style={styles.quickActionText}>New contact</Text>
        </TouchableOpacity>
      </View>

      {/* Contacts List */}
      <SectionList
        sections={contactSections}
        keyExtractor={(item: DeviceContact, index: number) => `${item.phoneNumber}-${index}`}
        renderItem={renderContactItem}
        renderSectionHeader={renderSectionHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false}
        refreshing={!!(isLoading)}
        onRefresh={() => {
          // Manual refresh: re-sync contacts and refresh queries
          syncDeviceContacts();
          storedContactsQuery.refetch();
          refreshContactStatus();
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No contacts found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or pull to refresh</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: 0, // Let SafeAreaView handle top padding
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16, // Increased padding to avoid overlap
    backgroundColor: "#000000",
    paddingTop: 8, // Extra top padding for safety
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  contactCount: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  cardTitle: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9CA3AF",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#000000",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8, // spacing between icon & text
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "400",
    paddingVertical: 0,         // fixes text clipping
    includeFontPadding: false,  // aligns properly
    textAlignVertical: "center" // centers vertically
  },
  menuButton: {
    padding: 6,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "#6B7280",
  },
  menuIcon: {
    fontSize: 18,
    color: "#FFFFFF",
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#000000",
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
    paddingVertical: 8,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  quickActionEmoji: {
    fontSize: 18,
  },
  quickActionText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18, // Larger font size
    color: "#FFFFFF", // White instead of gray
    paddingHorizontal: 16,
    paddingVertical: 16, // Increased vertical padding
    backgroundColor: "#000000",
    fontWeight: "700", // More bold
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    paddingHorizontal: 16,
    paddingBottom: 12, // Increased padding
    backgroundColor: "#000000",
  },
  sectionHeader: {
    backgroundColor: "#000000",
    paddingTop: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#000000",
  },
  contactAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20, // Larger font for bigger avatar
    fontWeight: "600",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  actionContainer: {
    alignItems: "flex-end",
  },
  chatButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  inviteButton: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  inviteButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  // Non-app user styles
  nonAppUserItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  nonAppUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4B5563",
    justifyContent: "center",
    alignItems: "center",
  },
  nonAppUserAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  nonAppUserAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  nonAppUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nonAppUserName: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    marginBottom: 2,
  },
  nonAppUserPhone: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  nonAppUserNote: {
    fontSize: 12,
    color: "#F59E0B",
    fontStyle: "italic",
    marginTop: 2,
  },
  // App user specific styles (Image 1 layout - like WhatsApp contact list)
  appUserItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333333",
  },
  appUserAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4B5563",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  appUserAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  appUserAvatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  appUserInfo: {
    flex: 1,
  },
  appUserName: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  appUserStatus: {
    fontSize: 14,
    color: "#22C55E", // Green color for "Available"
  },
  // Multi-select styles for group creation
  selectButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4B5563",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedButton: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  selectCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  disabledItem: {
    opacity: 0.5,
  },
  nextButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});