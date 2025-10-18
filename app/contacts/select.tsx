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
  const [selectedContacts, setSelectedContacts] = useState<DeviceContact[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<any[]>([]);
  const queryClient = useQueryClient();

  // Check if contacts have been synced before
  useEffect(() => {
    const checkSyncStatus = async () => {
      try {
        const syncStatus = await AsyncStorage.getItem('contactsSynced');
        if (syncStatus === 'true') {
          setContactsSynced(true);
        }
        // Removed auto-sync - users must manually sync from Chats tab
      } catch (error) {
        console.error('Error checking sync status:', error);
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

      // Send to backend in batches to handle large contact lists
      const token = await ensureAuth();
      if (token) {
        const BATCH_SIZE = 500; // Send 500 contacts at a time
        const totalBatches = Math.ceil(phoneNumbers.length / BATCH_SIZE);
        
        console.log(`Syncing ${phoneNumbers.length} contacts in ${totalBatches} batches...`);
        
        for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
          const batch = phoneNumbers.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
          
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
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        setContactsSynced(true);
        
        // Save sync status to AsyncStorage
        try {
          await AsyncStorage.setItem('contactsSynced', 'true');
          console.log('✅ All contacts synced successfully');
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

      // Get stored contacts from backend to compare
      const token = await ensureAuth();
      if (!token) return;

      const storedResponse = await api.get('/contacts/all?page=1&limit=10000'); // Get all stored contacts
      const storedPhoneNumbers = new Set(
        (storedResponse.data || []).map((contact: any) => contact.phoneNumber)
      );

      // Find NEW contacts (device contacts not in MongoDB)
      const newContacts = devicePhoneNumbers.filter(
        contact => !storedPhoneNumbers.has(contact.phoneNumber)
      );

      console.log(`📊 Smart refresh results:
        - Total device contacts: ${devicePhoneNumbers.length}
        - Stored contacts: ${storedPhoneNumbers.size}
        - New contacts found: ${newContacts.length}`);

      // Use the new smart sync endpoint that handles all the logic
      console.log(`🔄 Smart syncing contacts (checking for new ones)...`);
      const syncResponse = await api.post("/contacts/smart-sync", { contacts: devicePhoneNumbers });
      
      console.log('📊 Smart sync response:', syncResponse);
      
      // Only refresh contact status if new contacts were actually added
      if (syncResponse.stats && syncResponse.stats.syncedContacts > 0) {
        await api.post("/contacts/refresh-app-status");
        
        // Invalidate queries to show updated data
        queryClient.invalidateQueries({ queryKey: ["stored-contacts"] });
        queryClient.invalidateQueries({ queryKey: ["app-contacts"] });
        
        Alert.alert(
          '🎉 Contacts Updated', 
          `Found and synced ${syncResponse.stats.newContacts} new contact${syncResponse.stats.newContacts > 1 ? 's' : ''}.\n\n` +
          `📱 ${syncResponse.stats.newAppUsers} of them are using the app!`
        );
      } else {
        Alert.alert('✅ Up to date', 'No new contacts found. Your contact list is up to date.');
      }
      
    } catch (error) {
      console.error('❌ Error in smart refresh:', error);
      Alert.alert('Error', 'Failed to refresh contacts. Please try again.');
    } finally {
      setIsSmartRefreshing(false);
    }
  };

  // Add debouncing to prevent excessive calls
  const [lastRefresh, setLastRefresh] = useState(0);

  // Refresh contacts when screen becomes focused (debounced)
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Only refresh if more than 30 seconds have passed
      if (now - lastRefresh > 30000) {
        refreshContactStatus();
        setLastRefresh(now);
      }
    }, [lastRefresh])
  );

  // Refresh contacts when app becomes active (debounced)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        const now = Date.now();
        // Only refresh if more than 30 seconds have passed
        if (now - lastRefresh > 30000) {
          refreshContactStatus();
          setLastRefresh(now);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [lastRefresh]);

  // Fetch stored contacts from backend with pagination - this contains all the info we need
  const [contactsPage, setContactsPage] = useState(1);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  
  const storedContactsQuery = useQuery({
    queryKey: ["stored-contacts", contactsPage],
    queryFn: async () => {
      try {
        const token = await ensureAuth();
        if (!token) return { data: [], pagination: { hasMore: false } };

        const response = await api.get(`/contacts/all?page=${contactsPage}&limit=1000`);
        console.log("Stored contacts response:", response);
        
        // The API returns { success: true, data: [...], pagination: {...} }
        return {
          data: response.data || [],
          pagination: response.pagination || { hasMore: false }
        };
      } catch (error) {
        console.error("Error fetching stored contacts:", error);
        return { data: [], pagination: { hasMore: false } };
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes (increased from 2)
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes (gcTime is the new name for cacheTime)
    enabled: contactsSynced, // Only fetch if contacts have been synced
  });

  // Append new contacts when page changes
  useEffect(() => {
    if (storedContactsQuery.data) {
      const { data, pagination } = storedContactsQuery.data;
      if (contactsPage === 1) {
        setAllContacts(data);
      } else {
        setAllContacts(prev => [...prev, ...data]);
      }
      setHasMoreContacts(pagination.hasMore);
    }
  }, [storedContactsQuery.data, contactsPage]);

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

  // Use accumulated contacts or empty array if loading
  const storedContacts = allContacts;
  const availableGroups = groupsQuery.data || [];

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
    about: contact.about || (contact.isAppUser ? "Available" : undefined), // Use API about or default
    itemType: 'contact' as const
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

  const shareCardWithContactsAndGroups = async () => {
    if (!cardId || (selectedContacts.length === 0 && selectedGroups.length === 0)) return;

    try {
      const token = await ensureAuth();
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      // Show progress
      Alert.alert('Sharing', 'Sending card to selected contacts and groups...');

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

      // Show results
      let alertMessage = '';
      if (successful.length > 0) {
        const successfulContacts = successful.filter(r => r.type === 'contact');
        const successfulGroups = successful.filter(r => r.type === 'group');
        
        if (successfulContacts.length > 0) {
          alertMessage += `Card successfully shared with ${successfulContacts.length} contact${successfulContacts.length === 1 ? '' : 's'}:\n`;
          alertMessage += successfulContacts.map(r => `• ${r.target}`).join('\n');
        }
        
        if (successfulGroups.length > 0) {
          if (alertMessage) alertMessage += '\n\n';
          alertMessage += `Card successfully shared to ${successfulGroups.length} group${successfulGroups.length === 1 ? '' : 's'}:\n`;
          alertMessage += successfulGroups.map(r => `• ${r.target}`).join('\n');
        }
      }
      
      if (failed.length > 0) {
        const failedContacts = failed.filter(r => r.type === 'contact');
        const failedGroups = failed.filter(r => r.type === 'group');
        
        if (failedContacts.length > 0) {
          if (alertMessage) alertMessage += '\n\n';
          alertMessage += `Failed to share with ${failedContacts.length} contact${failedContacts.length === 1 ? '' : 's'}:\n`;
          alertMessage += failedContacts.map(r => `• ${r.target} (${r.reason})`).join('\n');
        }
        
        if (failedGroups.length > 0) {
          if (alertMessage) alertMessage += '\n\n';
          alertMessage += `Failed to share to ${failedGroups.length} group${failedGroups.length === 1 ? '' : 's'}:\n`;
          alertMessage += failedGroups.map(r => `• ${r.target} (${r.reason})`).join('\n');
        }
      }

      const totalSelected = selectedContacts.length + selectedGroups.length;
      Alert.alert(
        successful.length === totalSelected ? 'Success!' : 'Partial Success',
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
            {(isGroupMode || isGroupAddMode || isCardShareMode) && (selectedContacts.length > 0 || selectedGroups.length > 0)
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
        
        {/* Smart Refresh Button - Always visible */}
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