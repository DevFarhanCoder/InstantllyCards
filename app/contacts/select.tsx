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
  itemType: 'contact';
};

type GroupItem = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  memberCount: number;
  itemType: 'group';
};

type SelectableItem = DeviceContact | GroupItem;

type ListSection = {
  title: string;
  data: SelectableItem[];
  type: 'contacts' | 'groups';
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Loading contacts...");
  const [selectedContacts, setSelectedContacts] = useState<DeviceContact[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<any[]>([]);
  const [totalContacts, setTotalContacts] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Check if contacts have been synced before - NO AUTO-SYNC
  useEffect(() => {
    const checkSyncStatusAndLoad = async () => {
      try {
        const syncTimestamp = await AsyncStorage.getItem('contactsSyncTimestamp');
        
        if (syncTimestamp) {
          // Contacts were synced before - just load from DB
          setContactsSynced(true);
          const lastSyncDate = new Date(parseInt(syncTimestamp));
          console.log(`✅ Contacts synced previously (${lastSyncDate.toLocaleString()}). Loading from database...`);
        } else {
          // Never synced - show prompt
          console.log('⚠️ Contacts not synced yet. User needs to sync from Chats tab.');
          setContactsSynced(false);
        }
      } catch (error) {
        console.error('Error checking sync status:', error);
        setContactsSynced(false);
      }
    };

    checkSyncStatusAndLoad();
  }, []);

  // Function to sync device contacts with backend
  const syncDeviceContacts = async () => {
    if (contactsLoading) return; // Prevent duplicate sync requests
    
    try {
      setContactsLoading(true);
      setLoadingProgress(5);
      setLoadingMessage('Starting contact sync...');
      console.log('Starting contact sync...');

      // Request contacts permission
      setLoadingProgress(10);
      setLoadingMessage('Requesting permissions...');
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Contacts permission denied');
        Alert.alert('Permission Required', 'Please grant contacts permission to sync your contacts.');
        setContactsLoading(false);
        return;
      }

      // Get device contacts
      setLoadingProgress(20);
      setLoadingMessage('Reading device contacts...');
      console.log('Getting device contacts...');
      const { data: deviceContacts } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });
      
      // Extract phone numbers with proper formatting
      setLoadingProgress(30);
      setLoadingMessage('Processing contacts...');
      const phoneNumbers = deviceContacts
        .filter((contact: any) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact: any) => ({
          name: contact.name || 'Unknown Contact',
          phoneNumber: contact.phoneNumbers[0]?.number?.replace(/\D/g, '') || ''
        }))
        .filter((contact: any) => contact.phoneNumber && contact.phoneNumber.length >= 10);

      console.log(`Found ${phoneNumbers.length} contacts with valid phone numbers`);

      // Send to backend in batches to handle large contact lists
      const token = await ensureAuth();
      if (token) {
        const BATCH_SIZE = 200; // Send 200 contacts at a time (reduced from 500)
        const totalBatches = Math.ceil(phoneNumbers.length / BATCH_SIZE);
        
        console.log(`Syncing ${phoneNumbers.length} contacts in ${totalBatches} batches...`);
        
        for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
          const batch = phoneNumbers.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
          
          // Update progress (30% to 90% range for syncing)
          const syncProgress = 30 + ((batchNumber / totalBatches) * 60);
          setLoadingProgress(Math.round(syncProgress));
          setLoadingMessage(`Syncing batch ${batchNumber}/${totalBatches}...`);
          
          console.log(`Syncing batch ${batchNumber}/${totalBatches} (${batch.length} contacts)...`);
          
          try {
            await api.post("/contacts/sync-all", { contacts: batch });
            console.log(`✅ Batch ${batchNumber}/${totalBatches} synced successfully`);
          } catch (batchError) {
            console.error(`❌ Error syncing batch ${batchNumber}:`, batchError);
            // Continue with next batch even if one fails
          }
          
          // Small delay between batches to prevent server overload
          if (i + BATCH_SIZE < phoneNumbers.length) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay to 1 second
          }
        }
        
        setLoadingProgress(95);
        setLoadingMessage('Finalizing sync...');
        setContactsSynced(true);
        
        // Save sync timestamp to AsyncStorage
        try {
          const timestamp = Date.now().toString();
          await AsyncStorage.setItem('contactsSyncTimestamp', timestamp);
          await AsyncStorage.setItem('contactsSynced', 'true'); // Keep for backward compatibility
          console.log('✅ All contacts synced successfully');
        } catch (storageError) {
          console.error('Error saving sync status:', storageError);
        }

        setLoadingProgress(100);
        setLoadingMessage('Sync complete!');

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

  // Smart sync function that only fetches NEW contacts (not already in MongoDB)
  const [isSmartRefreshing, setIsSmartRefreshing] = useState(false);
  
  const smartRefreshNewContacts = async () => {
    if (isSmartRefreshing || contactsLoading) return;
    
    try {
      setIsSmartRefreshing(true);
      console.log('🔍 Smart refresh: Looking for new contacts...');
      
      // Show immediate feedback
      console.log('🔄 Checking for new contacts...');

      // Get device contacts permission
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant contacts permission to check for new contacts.');
        return;
      }

      // Get current device contacts
      const { data: deviceContacts } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });
      
      const devicePhoneNumbers = deviceContacts
        .filter((contact: any) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact: any) => ({
          name: contact.name || 'Unknown Contact',
          phoneNumber: contact.phoneNumbers[0]?.number?.replace(/\D/g, '') || ''
        }))
        .filter((contact: any) => contact.phoneNumber && contact.phoneNumber.length >= 10);

      // Get stored contacts from backend to compare (fetch in chunks)
      const token = await ensureAuth();
      if (!token) return;

      console.log('📥 Fetching stored contacts in chunks...');
      let allStoredContacts: any[] = [];
      let currentPage = 1;
      let hasMore = true;
      
      // Fetch stored contacts in pages of 500
      while (hasMore) {
        try {
          const storedResponse = await api.get(`/contacts/all?page=${currentPage}&limit=500`);
          const pageContacts = storedResponse.data || [];
          allStoredContacts = [...allStoredContacts, ...pageContacts];
          
          console.log(`📄 Fetched page ${currentPage}: ${pageContacts.length} contacts (total: ${allStoredContacts.length})`);
          
          // Check if there are more pages
          hasMore = storedResponse.pagination?.hasMore || false;
          currentPage++;
          
          // Small delay between page fetches
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`❌ Error fetching contacts page ${currentPage}:`, error);
          hasMore = false; // Stop on error
        }
      }
      
      const storedPhoneNumbers = new Set(
        allStoredContacts.map((contact: any) => contact.phoneNumber)
      );

      // Find NEW contacts (device contacts not in MongoDB)
      const newContacts = devicePhoneNumbers.filter(
        contact => !storedPhoneNumbers.has(contact.phoneNumber)
      );

      console.log(`📊 Smart refresh results:
        - Total device contacts: ${devicePhoneNumbers.length}
        - Stored contacts: ${storedPhoneNumbers.size}
        - New contacts found: ${newContacts.length}`);

      // Use the new smart sync endpoint that handles all the logic (send in chunks if many contacts)
      console.log(`🔄 Smart syncing contacts (checking for new ones)...`);
      
      // Send in batches if there are many contacts
      const SYNC_BATCH_SIZE = 200;
      if (devicePhoneNumbers.length > SYNC_BATCH_SIZE) {
        const totalBatches = Math.ceil(devicePhoneNumbers.length / SYNC_BATCH_SIZE);
        console.log(`📦 Sending ${devicePhoneNumbers.length} contacts in ${totalBatches} batches...`);
        
        for (let i = 0; i < devicePhoneNumbers.length; i += SYNC_BATCH_SIZE) {
          const batch = devicePhoneNumbers.slice(i, i + SYNC_BATCH_SIZE);
          const batchNumber = Math.floor(i / SYNC_BATCH_SIZE) + 1;
          
          try {
            await api.post("/contacts/smart-sync", { contacts: batch });
            console.log(`✅ Smart sync batch ${batchNumber}/${totalBatches} completed`);
            
            // Delay between batches
            if (i + SYNC_BATCH_SIZE < devicePhoneNumbers.length) {
              await new Promise(resolve => setTimeout(resolve, 800));
            }
          } catch (error) {
            console.error(`❌ Error in smart sync batch ${batchNumber}:`, error);
          }
        }
      } else {
        // If contacts are few, send all at once
        await api.post("/contacts/smart-sync", { contacts: devicePhoneNumbers });
      }
      
      console.log('✅ Smart sync completed');
      
      // Only refresh contact status if needed
      await api.post("/contacts/refresh-app-status");
        
      // Invalidate queries to show updated data
      queryClient.invalidateQueries({ queryKey: ["stored-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["app-contacts"] });
      
      // Show brief success message without blocking
      if (newContacts.length > 0) {
        console.log(`🎉 Found and synced ${newContacts.length} new contact(s)`);
      } else {
        console.log('✅ No new contacts found');
      }
      
    } catch (error) {
      console.error('❌ Error in smart refresh:', error);
    } finally {
      setIsSmartRefreshing(false);
    }
  };

  // Reset pagination when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Contact select screen focused - resetting to page 1');
      
      // Reset pagination to page 1 to avoid loading empty pages
      setContactsPage(1);
      setAllContacts([]);
      setHasMoreContacts(true);
      
      // Increment reset key to force new query fetch
      setResetKey(prev => prev + 1);
      
      console.log('✅ Pagination reset complete');
      
      // Also refetch the query immediately if contacts are synced
      if (contactsSynced) {
        console.log('🔄 Refetching contacts query on focus...');
        setTimeout(() => {
          storedContactsQuery.refetch();
        }, 100);
      }
    }, [contactsSynced])
  );

  // No auto-refresh on app state changes - contacts are cached
  // Users can manually refresh if needed
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active - using cached contacts');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Fetch stored contacts from backend with pagination - this contains all the info we need
  const [contactsPage, setContactsPage] = useState(1);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [resetKey, setResetKey] = useState(0); // Add reset key to force query refetch
  
  const storedContactsQuery = useQuery({
    queryKey: ["stored-contacts", contactsPage, resetKey], // Include resetKey in query key
    queryFn: async () => {
      try {
        const token = await ensureAuth();
        if (!token) return { data: [], pagination: { hasMore: false } };

        console.log(`📱 Fetching contacts from backend (page ${contactsPage}, resetKey: ${resetKey})...`);
        const response = await api.get(`/contacts/all?page=${contactsPage}&limit=500`);
        console.log(`✅ Stored contacts response: ${response.data?.length || 0} contacts on page ${contactsPage}`);
        
        // The API returns { success: true, data: [...], pagination: {...} }
        return {
          data: response.data || [],
          pagination: response.pagination || { hasMore: false }
        };
      } catch (error) {
        console.error("❌ Error fetching stored contacts:", error);
        return { data: [], pagination: { hasMore: false } };
      }
    },
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    enabled: contactsSynced, // Only fetch if contacts have been synced
    refetchOnMount: false, // Use cached data, don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Append new contacts when page changes OR when resetKey changes
  useEffect(() => {
    console.log(`🔍 Effect triggered - resetKey: ${resetKey}, Page: ${contactsPage}, Query status: ${storedContactsQuery.status}, Has data: ${!!storedContactsQuery.data}`);
    
    if (storedContactsQuery.data) {
      const { data, pagination } = storedContactsQuery.data;
      
      console.log(`📄 Page ${contactsPage} loaded: ${data.length} contacts (hasMore: ${pagination.hasMore})`);
      
      if (contactsPage === 1) {
        console.log(`📝 Setting allContacts to ${data.length} contacts (page 1)`);
        setAllContacts(data);
        setLoadingProgress(30); // Initial load progress
        setLoadingMessage(`Loading contacts... ${data.length} loaded`);
      } else {
        console.log(`📝 Appending ${data.length} contacts to existing contacts`);
        setAllContacts(prev => {
          const newContacts = [...prev, ...data];
          console.log(`📊 Total contacts after append: ${newContacts.length}`);
          
          // Update progress based on pages loaded
          const estimatedProgress = Math.min(30 + (contactsPage * 15), 90);
          setLoadingProgress(estimatedProgress);
          setLoadingMessage(`Loading contacts... ${newContacts.length} loaded`);
          
          return newContacts;
        });
      }
      setHasMoreContacts(pagination.hasMore);
      
      // If no more contacts, set progress to 100%
      if (!pagination.hasMore) {
        setLoadingProgress(100);
        setLoadingMessage("Contacts loaded!");
      }
      
      console.log(`📊 Page ${contactsPage} processing complete`);
    } else {
      console.log(`⚠️ No data in query yet`);
      if (storedContactsQuery.isLoading) {
        setLoadingProgress(10);
        setLoadingMessage("Fetching contacts...");
      }
    }
  }, [storedContactsQuery.data, resetKey, storedContactsQuery.isLoading, contactsPage]); // Remove contactsPage from dependencies to prevent infinite loop

  // Reset to page 1 when contactsSynced changes
  useEffect(() => {
    setContactsPage(1);
    setAllContacts([]);
    setHasMoreContacts(true);
  }, [contactsSynced]);

  // Fetch groups when in card sharing mode
  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      try {
        const token = await ensureAuth();
        if (!token) return [];

        const response = await api.get("/groups");
        console.log("Groups response:", response);
        
        return response.groups || [];
      } catch (error) {
        console.error("Error fetching groups:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    enabled: isCardShareMode, // Only fetch groups when in card sharing mode
  });

  // Determine overall loading state
  const queryLoading = storedContactsQuery.isLoading && contactsPage === 1;
  const groupsLoading = groupsQuery.isLoading && isCardShareMode;
  const isLoading = !!(queryLoading || contactsLoading || groupsLoading);
  
  // Show loading screen ONLY on initial load (page 1) AND when we have no contacts yet
  // Skip loading screen in card share mode - show contacts immediately even if refetching
  const showLoadingScreen = !isCardShareMode && isLoading && allContacts.length === 0 && !storedContactsQuery.data;

  // Use accumulated contacts or cached query data in card share mode
  const storedContacts = allContacts.length > 0 ? allContacts : (isCardShareMode && storedContactsQuery.data?.data ? storedContactsQuery.data.data : allContacts);
  const availableGroups = groupsQuery.data || [];

  console.log("📊 DEBUG - Contacts State:");
  console.log("  - allContacts length:", allContacts.length);
  console.log("  - storedContacts length:", storedContacts.length);
  console.log("  - contactsSynced:", contactsSynced);
  console.log("  - showLoadingScreen:", showLoadingScreen);
  console.log("  - Query status:", storedContactsQuery.status);
  console.log("  - Query has data:", !!storedContactsQuery.data);

  // Create processed contacts from stored contacts (they already have isAppUser info)
  const processedContacts = storedContacts.map((contact: any) => ({
    id: contact._id || Math.random().toString(),
    name: contact.name,
    phoneNumber: contact.phoneNumber,
    isAppUser: contact.isAppUser,
    profilePicture: contact.profilePicture,
    // Use appUserId._id if it's populated as object, or appUserId if it's a string, fallback to empty string
    userId: contact.appUserId?._id || contact.appUserId || contact.userId || '',
    about: contact.about || (contact.isAppUser ? "Available" : undefined), // Use API about or default
    itemType: 'contact' as const
  }));

  console.log("  - processedContacts length:", processedContacts.length);

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
      
      // Validate that userId is a MongoDB ObjectId (24 hex characters), not a phone number
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(contact.userId);
      
      if (!isValidObjectId) {
        console.error('❌ Invalid userId format (not MongoDB ObjectId):', contact.userId);
        Alert.alert('Error', 'Unable to start chat. Invalid user ID.');
        return;
      }
      
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
      
      // Final validation before navigation
      if (!contact.userId) {
        console.error('❌ userId is still undefined after all attempts');
        Alert.alert('Error', 'Unable to start chat. User ID not found.');
        return;
      }
      
      router.push({
        pathname: `/chat/[userId]`,
        params: { 
          userId: contact.userId as string,
          name: contact.name
        }
      });
    } else {
      console.log('❌ Cannot start chat - not an app user or missing userId:', contact);
      Alert.alert('Error', 'This contact is not on InstantllyCards yet');
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

  const handleGroupSelect = (group: any) => {
    const isSelected = selectedGroups.some(g => g._id === group._id);
    
    if (isSelected) {
      // Remove from selection
      setSelectedGroups(prev => prev.filter(g => g._id !== group._id));
    } else {
      // Add to selection
      setSelectedGroups(prev => [...prev, group]);
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

      console.log(`✅ ${selectedContacts.length} member(s) added to group successfully`);
      
      // Navigate back immediately without popup
      router.back();
    } catch (error) {
      console.error('Error adding members to group:', error);
    }
  };

  const shareCardWithContactsAndGroups = async () => {
    if (!cardId || (selectedContacts.length === 0 && selectedGroups.length === 0)) return;

    try {
      const token = await ensureAuth();
      if (!token) {
        return;
      }

      console.log('🔄 Sharing card to contacts and groups...');

      // Check if any selected contacts have already received this card
      try {
        const sentCardsResponse = await api.get<{ success: boolean; data: any[] }>('/cards/sent');
        const sentCards = sentCardsResponse?.data || [];
        
        // Find duplicates - contacts who already received this card
        const duplicates = selectedContacts.filter(contact => 
          sentCards.some((sentCard: any) => 
            sentCard.cardId === cardId && sentCard.recipientId === contact.userId
          )
        );

        if (duplicates.length > 0) {
          const duplicateNames = duplicates.map(c => c.name).join(', ');
          Alert.alert(
            'Card Already Sent',
            `You have already sent this card to: ${duplicateNames}.\n\nYou can only send a card once to each user.`,
            [{ text: 'OK' }]
          );
          return; // Stop the sharing process
        }
      } catch (error) {
        console.error('Error checking for duplicate shares:', error);
        // Continue anyway if we can't check
      }

      const sharePromises: Promise<any>[] = [];

      // Share to contacts
      selectedContacts.forEach((contact) => {
        if (contact.userId) {
          sharePromises.push(
            api.post(`/cards/${cardId}/share`, {
              recipientId: contact.userId,
              message: `Check out my business card!`
            }).then(() => ({ success: true, target: contact.name, type: 'contact' }))
            .catch((error: any) => {
              console.error(`❌ Failed to share with ${contact.name}:`, error);
              return { 
                success: false, 
                target: contact.name, 
                type: 'contact',
                reason: error.response?.status === 404 ? 'Card not found' : 'Share failed'
              };
            })
          );
        } else {
          sharePromises.push(
            Promise.resolve({ 
              success: false, 
              target: contact.name, 
              type: 'contact',
              reason: 'Not an app user' 
            })
          );
        }
      });

      // Share to groups
      selectedGroups.forEach((group) => {
        sharePromises.push(
          api.post(`/cards/${cardId}/share-to-group`, {
            groupId: group._id,
            message: `Check out my business card!`
          }).then(() => ({ success: true, target: group.name, type: 'group' }))
          .catch((error: any) => {
            console.error(`❌ Failed to share to group ${group.name}:`, error);
            return { 
              success: false, 
              target: group.name, 
              type: 'group',
              reason: error.response?.status === 404 ? 'Group not found' : 'Share failed'
            };
          })
        );
      });

      const results = await Promise.all(sharePromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      // Refresh relevant queries
      queryClient.invalidateQueries({ queryKey: ["sent-cards"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });

      // Log results silently
      const successfulContacts = successful.filter(r => r.type === 'contact');
      const successfulGroups = successful.filter(r => r.type === 'group');
      const failedItems = failed.filter(r => !r.success);
      
      if (successfulContacts.length > 0) {
        console.log(`✅ Card shared with ${successfulContacts.length} contact(s):`, successfulContacts.map(r => r.target));
      }
      
      if (successfulGroups.length > 0) {
        console.log(`✅ Card shared to ${successfulGroups.length} group(s):`, successfulGroups.map(r => r.target));
      }
      
      if (failedItems.length > 0) {
        console.log(`❌ Failed to share with ${failedItems.length} recipient(s):`, failedItems.map(r => `${r.target} (${r.reason})`));
      }

      // Navigate back immediately without popup
      router.back();

    } catch (error) {
      console.error('Error sharing card:', error);
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

  // Fetch total contacts count from /contacts/count API
  useEffect(() => {
    const fetchTotalContacts = async () => {
      try {
        const token = await ensureAuth();
        if (!token) return;
        const response = await api.get('/contacts/count');
        if (response && typeof response.total === 'number') {
          setTotalContacts(response.total);
        }
      } catch (error) {
        setTotalContacts(null);
      }
    };
    fetchTotalContacts();
  }, []);

  const filteredContacts = processedContacts.filter((contact: DeviceContact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );

  const filteredGroups = isCardShareMode ? availableGroups.filter((group: any) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Create sections for groups (if in card share mode), app users and non-app users
  const filteredAppUsers = filteredContacts.filter((contact: DeviceContact) => contact.isAppUser);
  const filteredNonAppUsers = filteredContacts.filter((contact: DeviceContact) => !contact.isAppUser);

  const contactSections: ListSection[] = [
    ...(isCardShareMode && filteredGroups.length > 0 ? [{
      title: "Groups",
      data: filteredGroups.map((group: any) => ({
        id: group._id,
        name: group.name,
        description: group.description,
        icon: group.icon,
        memberCount: group.members?.length || 0,
        itemType: 'group' as const
      })),
      type: "groups" as const
    }] : []),
    ...(filteredAppUsers.length > 0 ? [{
      title: "Contacts on InstantllyCards",
      data: filteredAppUsers,
      type: "contacts" as const
    }] : []),
    ...(filteredNonAppUsers.length > 0 ? [{
      title: "Invite to InstantllyCards",
      data: filteredNonAppUsers,
      type: "contacts" as const
    }] : [])
  ];

  const renderGroupItem = ({ item }: { item: GroupItem }) => {
    const isSelected = selectedGroups.some(group => group._id === item.id);
    
    return (
      <View style={styles.groupItem}>
        <View style={styles.groupAvatar}>
          {item.icon ? (
            <Image source={{ uri: item.icon }} style={styles.groupAvatarImage} />
          ) : (
            <Ionicons name="people" size={24} color="#FFFFFF" />
          )}
        </View>

        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupDescription}>
            {item.memberCount} member{item.memberCount === 1 ? '' : 's'}
            {item.description ? ` • ${item.description}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.selectButton, isSelected && styles.selectedButton]}
          onPress={() => handleGroupSelect({ _id: item.id, name: item.name, description: item.description, icon: item.icon, members: [] })}
        >
          {isSelected ? (
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          ) : (
            <View style={styles.selectCircle} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

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

  const renderSectionHeader = ({ section }: { section: ListSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.title === "Contacts on InstantllyCards" && (
        <Text style={styles.sectionSubtitle}>Tap to start chatting</Text>
      )}
    </View>
  );

  if (showLoadingScreen) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select contact</Text>
          <Text style={styles.contactCount}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${loadingProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(loadingProgress)}%</Text>
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
            {typeof totalContacts === 'number'
              ? `${totalContacts} total contact${totalContacts === 1 ? '' : 's'}`
              : (isGroupMode || isGroupAddMode || isCardShareMode) && (selectedContacts.length > 0 || selectedGroups.length > 0)
                ? `${selectedContacts.length + selectedGroups.length} selected`
                : isCardShareMode 
                  ? `${processedContacts.length} contacts • ${availableGroups.length} groups`
                  : `${processedContacts.length} contacts`
            }
          </Text>
          {isCardShareMode && cardTitle && (
            <Text style={styles.cardTitle} numberOfLines={1}>
              Sharing: {decodeURIComponent(cardTitle)}
            </Text>
          )}
        </View>
        
        {/* Smart Refresh Button - Hide in card share mode */}
        {!isCardShareMode && (
          <TouchableOpacity 
            onPress={smartRefreshNewContacts}
            style={[styles.smartRefreshButton, isSmartRefreshing && styles.smartRefreshButtonDisabled]}
            disabled={isSmartRefreshing}
          >
            {isSmartRefreshing ? (
              <ActivityIndicator size="small" color="#22C55E" />
            ) : (
              <Ionicons name="refresh-outline" size={22} color="#22C55E" />
            )}
          </TouchableOpacity>
        )}
        {((isGroupMode || isGroupAddMode || isCardShareMode) && (selectedContacts.length > 0 || selectedGroups.length > 0)) ? (
          <TouchableOpacity 
            onPress={() => {
              if (isCardShareMode) {
                // Share card with selected contacts and groups
                shareCardWithContactsAndGroups();
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
        ) : null}
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


      {/* Contacts and Groups List */}
      <SectionList
        sections={contactSections}
        keyExtractor={(item: SelectableItem, index: number) => {
          if (item.itemType === 'contact') {
            return `contact-${item.phoneNumber}-${index}`;
          } else {
            return `group-${item.id}-${index}`;
          }
        }}
        renderItem={({ item }) => {
          if (item.itemType === 'group') {
            return renderGroupItem({ item: item as GroupItem });
          } else {
            return renderContactItem({ item: item as DeviceContact });
          }
        }}
        renderSectionHeader={renderSectionHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false}
        refreshing={!!(isLoading)}
        onRefresh={() => {
          // Manual refresh: only refresh status of existing contacts (no full re-sync)
          // Full sync is only done manually from Chats tab "Sync Contacts" button
          setContactsPage(1);
          setAllContacts([]);
          storedContactsQuery.refetch();
          if (isCardShareMode) {
            groupsQuery.refetch();
          }
          refreshContactStatus();
        }}
        onEndReached={() => {
          // Load more contacts when user scrolls to bottom
          if (hasMoreContacts && !storedContactsQuery.isFetching && contactsSynced) {
            console.log(`Loading more contacts - page ${contactsPage + 1}`);
            setContactsPage(prev => prev + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          storedContactsQuery.isFetching && contactsPage > 1 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={{ color: '#888', marginTop: 8 }}>Loading more contacts...</Text>
            </View>
          ) : null
        }
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
  smartRefreshButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartRefreshButtonDisabled: {
    opacity: 0.6,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 24,
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#1F2937',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
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
  // Group styles
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#000000",
    borderBottomWidth: 0.5,
    borderBottomColor: "#333333",
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4B5563",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  groupAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});