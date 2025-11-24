import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, getCurrentUserId } from '@/lib/useUser';
import api from '@/lib/api';

interface GroupInfo {
  _id: string;
  id: string;
  name: string;
  description: string;
  icon?: string;
  members: any[];
  admin: any;
  joinCode: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupMember {
  _id?: string;
  id: string;
  name: string;
  profilePicture?: string;
  phoneNumber?: string;
  phone?: string;
  isAdmin?: boolean;
}

interface GroupCard {
  _id: string;
  cardId: string;
  senderId?: string;
  senderName?: string;
  senderProfilePicture?: string;
  cardTitle: string;
  cardPhoto?: string;
  sentAt: string;
  sharedAt?: string;
  createdAt?: string;
  message?: string;
  isFromMe?: boolean;
}

interface GroupCardsSummary {
  sent: {
    count: number;
    cards: GroupCard[];
  };
  received: {
    count: number;
    cards: GroupCard[];
  };
}

export default function GroupDetailsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cardsSummary, setCardsSummary] = useState<GroupCardsSummary | null>(null);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [activeCardsTab, setActiveCardsTab] = useState<'sent' | 'received'>('sent');
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    loadGroupDetails();
    loadGroupCards();
  }, [id]);

  // Reload group details when returning to screen
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Group details screen focused - reloading data');
      loadGroupDetails();
    }, [id])
  );

  const loadGroupDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // Get current user ID using utility function
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        Alert.alert('Error', 'User not found. Please log in again.');
        router.back();
        return;
      }
      setCurrentUserId(currentUserId);

      // Fetch group details from backend API
      console.log('🔍 Fetching group details from API for group:', id);
      
      const response = await api.get('/groups');
      if (response && response.success && response.groups) {
        // Find the specific group by ID
        const group = response.groups.find((g: any) => g._id === id || g.id === id);
        
        if (group) {
          console.log('✅ Found group:', group);
          
          const groupInfo: GroupInfo = {
            _id: group._id,
            id: group._id,
            name: group.name,
            description: group.description || '',
            icon: group.icon,
            members: group.members || [],
            admin: group.admin,
            joinCode: group.joinCode,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
          };
          
          setGroupInfo(groupInfo);
          setIsAdmin(group.admin._id === currentUserId || group.admin === currentUserId);

          // Process group members from API response
          const members: GroupMember[] = [];
          console.log('🔍 Processing group members:', group.members);
          
          if (group.members && Array.isArray(group.members)) {
            for (const member of group.members) {
              const memberData: GroupMember = {
                _id: member._id,
                id: member._id,
                name: member.name || 'Unknown User',
                profilePicture: member.profilePicture,
                phoneNumber: member.phone || member.phoneNumber || 'N/A',
                isAdmin: (member._id === group.admin._id) || (member._id === group.admin),
              };
              
              members.push(memberData);
              console.log('✅ Added member from API:', memberData.name);
            }
          }
          
          setGroupMembers(members);
          setLoading(false);
          console.log('✅ Group details loaded successfully from API');
        } else {
          console.log('❌ Group not found in API response');
          setLoading(false);
          Alert.alert('Error', 'Group not found.');
          router.back();
        }
      } else {
        console.log('❌ Failed to fetch groups from API');
        // Fallback to local storage if API fails
        loadGroupDetailsFromStorage();
      }
    } catch (error) {
      console.error('Error loading group details from API:', error);
      // Fallback to local storage if API fails
      loadGroupDetailsFromStorage();
    }
  };

  const loadGroupDetailsFromStorage = async () => {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) return;

      // Load group info from local storage (fallback)
      const groupData = await AsyncStorage.getItem(`group_${id}`);
      if (groupData) {
        const group: any = JSON.parse(groupData);
        setGroupInfo(group);
        setIsAdmin(group.admin === currentUserId);

        // Load group members from local storage
        const members: GroupMember[] = [];
        console.log('🔍 Loading group members from storage:', group.members);
        
        for (const memberId of group.members) {
          console.log('🔍 Loading member:', memberId);
          
          if (memberId === currentUserId) {
            // Add current user
            const userData = await getCurrentUser();
            members.push({
              _id: currentUserId,
              id: currentUserId,
              name: userData?.name || 'You',
              phoneNumber: userData?.phone || 'current user',
              isAdmin: memberId === group.admin,
            });
            console.log('✅ Added current user to members');
          } else {
            // Try different storage keys for contacts
            let memberData = null;
            
            // Try contact_${memberId} first
            const contactData1 = await AsyncStorage.getItem(`contact_${memberId}`);
            if (contactData1) {
              memberData = JSON.parse(contactData1);
              console.log('✅ Found contact data with key contact_${memberId}');
            } else {
              // Try temp_contact_${memberId}
              const contactData2 = await AsyncStorage.getItem(`temp_contact_${memberId}`);
              if (contactData2) {
                memberData = JSON.parse(contactData2);
                console.log('✅ Found contact data with key temp_contact_${memberId}');
              } else {
                console.log('❌ No contact data found for member:', memberId);
              }
            }
            
            if (memberData) {
              members.push({
                _id: memberId,
                id: memberId,
                name: memberData.name,
                profilePicture: memberData.profilePicture,
                phoneNumber: memberData.phoneNumber,
                isAdmin: memberId === group.admin,
              });
              console.log('✅ Added member to list:', memberData.name);
            } else {
              // Fallback: add with just the ID
              members.push({
                _id: memberId,
                id: memberId,
                name: 'Unknown User',
                phoneNumber: 'N/A',
                isAdmin: memberId === group.admin,
              });
              console.log('⚠️ Added unknown member:', memberId);
            }
          }
        }
        setGroupMembers(members);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading group details from storage:', error);
      setLoading(false);
    }
  };

  const loadGroupCards = async () => {
    if (!id) return;
    
    try {
      setCardsLoading(true);
      console.log('🔍 Loading group cards for group:', id);
      
      // Fetch group cards summary from backend API
      const response = await api.get(`/cards/group/${id}/summary`);
      if (response && response.success) {
        console.log('✅ Group cards loaded:', response.data);
        setCardsSummary(response.data);
      } else {
        console.log('❌ Failed to load group cards');
      }
    } catch (error) {
      console.error('Error loading group cards:', error);
    } finally {
      setCardsLoading(false);
    }
  };

  const addMembers = () => {
    router.push(`/contacts/select?mode=group_add&groupId=${id}` as any);
  };

  const navigateToCard = (cardId: string) => {
    router.push(`/(main)/card/${cardId}` as any);
  };

  const removeMember = (memberId: string, memberName: string) => {
    if (!isAdmin) {
      Alert.alert('Permission Denied', 'Only group admins can remove members.');
      return;
    }

    if (memberId === currentUserId) {
      Alert.alert('Error', 'You cannot remove yourself. Use "Leave Group" instead.');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!groupInfo) return;

              // Update group members
              const updatedMembers = groupInfo.members.filter(id => id !== memberId);
              const updatedGroup = {
                ...groupInfo,
                members: updatedMembers,
                updatedAt: new Date().toISOString(),
              };

              await AsyncStorage.setItem(`group_${id}`, JSON.stringify(updatedGroup));

              // Add system message
              const messagesData = await AsyncStorage.getItem(`group_messages_${id}`);
              const messages = messagesData ? JSON.parse(messagesData) : [];
              
              const systemMessage = {
                id: `msg_system_${Date.now()}`,
                senderId: 'system',
                senderName: 'System',
                text: `${memberName} was removed from the group`,
                timestamp: new Date().toISOString(),
                type: 'system',
              };
              
              messages.push(systemMessage);
              await AsyncStorage.setItem(`group_messages_${id}`, JSON.stringify(messages));

              // Reload group details
              loadGroupDetails();

              Alert.alert('Success', `${memberName} has been removed from the group.`);
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member. Please try again.');
            }
          },
        },
      ]
    );
  };

  const makeAdmin = (memberId: string, memberName: string) => {
    if (!isAdmin) {
      Alert.alert('Permission Denied', 'Only group admins can change admin status.');
      return;
    }

    Alert.alert(
      'Make Admin',
      `Are you sure you want to make ${memberName} an admin of this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Admin',
          onPress: async () => {
            try {
              if (!groupInfo) return;

              // Update group admin
              const updatedGroup = {
                ...groupInfo,
                admin: memberId,
                updatedAt: new Date().toISOString(),
              };

              await AsyncStorage.setItem(`group_${id}`, JSON.stringify(updatedGroup));

              // Add system message
              const messagesData = await AsyncStorage.getItem(`group_messages_${id}`);
              const messages = messagesData ? JSON.parse(messagesData) : [];
              
              const systemMessage = {
                id: `msg_system_${Date.now()}`,
                senderId: 'system',
                senderName: 'System',
                text: `${memberName} is now an admin`,
                timestamp: new Date().toISOString(),
                type: 'system',
              };
              
              messages.push(systemMessage);
              await AsyncStorage.setItem(`group_messages_${id}`, JSON.stringify(messages));

              // Reload group details
              loadGroupDetails();

              Alert.alert('Success', `${memberName} is now an admin of this group.`);
            } catch (error) {
              console.error('Error making admin:', error);
              Alert.alert('Error', 'Failed to update admin status. Please try again.');
            }
          },
        },
      ]
    );
  };

  const leaveGroup = () => {
    if (isAdmin && groupMembers.length > 1) {
      Alert.alert(
        'Transfer Admin',
        'You are the admin of this group. Please transfer admin rights to another member before leaving.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowLeaveConfirm(true);
  };

  const confirmLeaveGroup = async () => {
    try {
      if (!groupInfo) return;

      // Remove current user from group members
      const updatedMembers = groupInfo.members.filter(memberId => memberId !== currentUserId);
      
      if (updatedMembers.length === 0) {
        // Last member leaving - delete the group
        await AsyncStorage.removeItem(`group_${id}`);
        await AsyncStorage.removeItem(`group_messages_${id}`);
        
        const groupsListData = await AsyncStorage.getItem('groups_list');
        if (groupsListData) {
          const groupsList = JSON.parse(groupsListData);
          const updatedList = groupsList.filter((groupId: string) => groupId !== id);
          await AsyncStorage.setItem('groups_list', JSON.stringify(updatedList));
        }
      } else {
        // Update group without current user
        const updatedGroup = {
          ...groupInfo,
          members: updatedMembers,
          updatedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(`group_${id}`, JSON.stringify(updatedGroup));

        // Add system message about user leaving
        const messagesData = await AsyncStorage.getItem(`group_messages_${id}`);
        const messages = messagesData ? JSON.parse(messagesData) : [];
        
        const systemMessage = {
          id: `msg_system_${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          text: 'You left the group',
          timestamp: new Date().toISOString(),
          type: 'system',
        };
        
        messages.push(systemMessage);
        await AsyncStorage.setItem(`group_messages_${id}`, JSON.stringify(messages));
      }

      setShowLeaveConfirm(false);
      
      // Navigate back to chats
      router.replace('/(tabs)/chats' as any);
      
      Alert.alert('Success', 'You have left the group.');
    } catch (error) {
      console.error('Error leaving group:', error);
      Alert.alert('Error', 'Failed to leave group. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const copyJoinCode = () => {
    if (groupInfo?.joinCode) {
      // In React Native, we can't directly copy to clipboard without expo-clipboard
      // For now, show an alert with the code
      Alert.alert(
        'Group Join Code', 
        `${groupInfo.joinCode}\n\nShare this code with others to let them join the group.`,
        [{ text: 'OK' }]
      );
    }
  };



  const selectGroupImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to change the group image');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaTypeOptions?.Images ?? (ImagePicker as any).MediaType?.Images ?? ['Images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        if (!groupInfo) return;
        
        // Update group info with new image
        const updatedGroup = {
          ...groupInfo,
          icon: imageUri,
          updatedAt: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(`group_${id}`, JSON.stringify(updatedGroup));
        
        // Update groups list for other screens
        try {
          const groupsListData = await AsyncStorage.getItem('groups_list');
          if (groupsListData) {
            const groupsList = JSON.parse(groupsListData);
            const updatedGroupsList = groupsList.map((group: any) => {
              if (group.id === id || group._id === id) {
                return { ...group, icon: imageUri };
              }
              return group;
            });
            await AsyncStorage.setItem('groups_list', JSON.stringify(updatedGroupsList));
          }
        } catch (error) {
          console.error('Error updating groups list:', error);
        }

        // Try to update via API (optional)
        try {
          await api.put(`/groups/${id}`, {
            icon: imageUri
          });
          console.log('✅ Group photo updated on server');
        } catch (apiError) {
          console.error('❌ Failed to update group photo on server:', apiError);
        }
        
        // Add system message about image change
        const messagesData = await AsyncStorage.getItem(`group_messages_${id}`);
        const messages = messagesData ? JSON.parse(messagesData) : [];
        
        const currentUser = await getCurrentUser();
        const memberName = currentUser?.name || 'A member';
        
        const systemMessage = {
          id: `msg_system_${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          text: `${memberName} updated the group photo`,
          timestamp: new Date().toISOString(),
          type: 'system',
        };
        
        messages.push(systemMessage);
        await AsyncStorage.setItem(`group_messages_${id}`, JSON.stringify(messages));
        
        // Update local state
        setGroupInfo(updatedGroup);
        setShowImagePicker(false);
        
        Alert.alert('Success', 'Group photo updated successfully');
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to update group photo');
    }
  };

  const removeGroupImage = async () => {
    try {
      if (!groupInfo) return;
      
      const updatedGroup = {
        ...groupInfo,
        icon: '',
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(`group_${id}`, JSON.stringify(updatedGroup));
      
      // Update groups list for other screens
      try {
        const groupsListData = await AsyncStorage.getItem('groups_list');
        if (groupsListData) {
          const groupsList = JSON.parse(groupsListData);
          const updatedGroupsList = groupsList.map((group: any) => {
            if (group.id === id || group._id === id) {
              return { ...group, icon: '' };
            }
            return group;
          });
          await AsyncStorage.setItem('groups_list', JSON.stringify(updatedGroupsList));
        }
      } catch (error) {
        console.error('Error updating groups list:', error);
      }

      // Try to update via API (optional)
      try {
        await api.put(`/groups/${id}`, {
          icon: ''
        });
        console.log('✅ Group photo removed on server');
      } catch (apiError) {
        console.error('❌ Failed to remove group photo on server:', apiError);
      }
      
      // Add system message
      const messagesData = await AsyncStorage.getItem(`group_messages_${id}`);
      const messages = messagesData ? JSON.parse(messagesData) : [];
      
      const currentUser = await getCurrentUser();
      const memberName = currentUser?.name || 'A member';
      
      const systemMessage = {
        id: `msg_system_${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        text: `${memberName} removed the group photo`,
        timestamp: new Date().toISOString(),
        type: 'system',
      };
      
      messages.push(systemMessage);
      await AsyncStorage.setItem(`group_messages_${id}`, JSON.stringify(messages));
      
      setGroupInfo(updatedGroup);
      setShowImagePicker(false);
      
      Alert.alert('Success', 'Group photo removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      Alert.alert('Error', 'Failed to remove group photo');
    }
  };

  const renderMemberItem = (member: GroupMember) => (
    <TouchableOpacity
      key={member.id}
      style={styles.memberItem}
      onPress={() => {
        if (isAdmin && member.id !== currentUserId) {
          Alert.alert(
            'Member Actions',
            `What would you like to do with ${member.name}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              ...(member.isAdmin ? [] : [
                {
                  text: 'Make Admin',
                  onPress: () => makeAdmin(member.id, member.name),
                },
              ]),
              {
                text: 'Remove from Group',
                style: 'destructive',
                onPress: () => removeMember(member.id, member.name),
              },
            ]
          );
        }
      }}
    >
      <View style={styles.memberAvatar}>
        {member.profilePicture ? (
          <Image source={{ uri: member.profilePicture }} style={styles.memberAvatarImage} />
        ) : (
          <Text style={styles.memberAvatarText}>
            {member.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName}>{member.name}</Text>
          {member.isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberPhone}>{member.phoneNumber}</Text>
      </View>
      {isAdmin && member.id !== currentUserId && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  const renderCardItem = (card: GroupCard) => (
    <TouchableOpacity
      key={card._id}
      style={styles.cardItem}
      onPress={() => navigateToCard(card.cardId)}
    >
      <View style={styles.cardImageContainer}>
        {card.cardPhoto ? (
          <Image source={{ uri: card.cardPhoto }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardPlaceholder}>
            <Ionicons name="card" size={24} color="#9CA3AF" />
          </View>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{card.cardTitle}</Text>
        {card.senderName && !card.isFromMe && (
          <Text style={styles.cardSender}>Shared by {card.senderName}</Text>
        )}
        <Text style={styles.cardDate}>
          {new Date(card.sentAt).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </Text>
        {card.message && (
          <Text style={styles.cardMessage} numberOfLines={2}>
            {card.message}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Group Info</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading group info...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Info Section */}
        <View style={styles.groupInfoSection}>
          <TouchableOpacity 
            style={styles.groupIcon}
            onPress={() => {
              setShowImagePicker(true);
            }}
          >
            {groupInfo?.icon ? (
              <Image source={{ uri: groupInfo.icon }} style={styles.groupIconImage} />
            ) : (
              <Ionicons name="people" size={48} color="#FFFFFF" />
            )}
            <View style={styles.editIconOverlay}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupName}>{groupInfo?.name || name}</Text>
          </View>
          
          {groupInfo?.description && (
            <Text style={styles.groupDescription}>{groupInfo.description}</Text>
          )}
          <Text style={styles.groupDetails}>
            Created {formatDate(groupInfo?.createdAt || '')}
          </Text>
          
          {/* Join Code Section */}
          {groupInfo?.joinCode && (
            <TouchableOpacity style={styles.joinCodeContainer} onPress={copyJoinCode}>
              <View style={styles.joinCodeRow}>
                <Ionicons name="key-outline" size={16} color="#9CA3AF" />
                <Text style={styles.joinCodeLabel}>Join Code: </Text>
                <Text style={styles.joinCodeText}>{groupInfo.joinCode}</Text>
                <Ionicons name="copy-outline" size={16} color="#3B82F6" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Group Cards Interface Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Group Cards</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                console.log('🔄 Manual refresh of group cards');
                loadGroupCards();
              }}
              disabled={cardsLoading}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={cardsLoading ? "#9CA3AF" : "#3B82F6"} 
              />
            </TouchableOpacity>
          </View>
          
          {cardsLoading ? (
            <View style={styles.cardsLoadingContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingTextSmall}>Loading group cards...</Text>
            </View>
          ) : cardsSummary ? (
            <View style={styles.groupCardsInterface}>
              {/* Tab Buttons */}
              <View style={styles.cardsTabContainer}>
                <TouchableOpacity
                  style={[styles.cardsTab, activeCardsTab === 'sent' && styles.cardsActiveTab]}
                  onPress={() => setActiveCardsTab('sent')}
                >
                  <Text style={[styles.cardsTabText, activeCardsTab === 'sent' && styles.cardsActiveTabText]}>
                    Cards Sent ({cardsSummary.sent.count})
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.cardsTab, activeCardsTab === 'received' && styles.cardsActiveTab]}
                  onPress={() => setActiveCardsTab('received')}
                >
                  <Text style={[styles.cardsTabText, activeCardsTab === 'received' && styles.cardsActiveTabText]}>
                    Cards Received ({cardsSummary.received.count})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Cards List */}
              {activeCardsTab === 'sent' ? (
                cardsSummary.sent.cards.length > 0 ? (
                  <FlatList
                    data={cardsSummary.sent.cards}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.cardItem}
                        onPress={() => navigateToCard(item.cardId)}
                      >
                        <View style={styles.cardImageContainer}>
                          {item.cardPhoto ? (
                            <Image source={{ uri: item.cardPhoto }} style={styles.cardImage} />
                          ) : (
                            <View style={styles.cardPlaceholder}>
                              <Ionicons name="card" size={24} color="#9CA3AF" />
                            </View>
                          )}
                        </View>
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardTitle}>{item.cardTitle}</Text>
                          {item.message && (
                            <Text style={styles.cardMessage} numberOfLines={1}>
                              {item.message}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.cardDate}>
                          {new Date(item.sharedAt || item.createdAt || item.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </TouchableOpacity>
                    )}
                    scrollEnabled={false}
                  />
                ) : (
                  <Text style={styles.emptyText}>No cards sent yet</Text>
                )
              ) : (
                cardsSummary.received.cards.length > 0 ? (
                  <FlatList
                    data={cardsSummary.received.cards}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.cardItem}
                        onPress={() => navigateToCard(item.cardId)}
                      >
                        <View style={styles.cardImageContainer}>
                          {item.cardPhoto ? (
                            <Image source={{ uri: item.cardPhoto }} style={styles.cardImage} />
                          ) : (
                            <View style={styles.cardPlaceholder}>
                              <Ionicons name="card" size={24} color="#9CA3AF" />
                            </View>
                          )}
                        </View>
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardTitle}>{item.cardTitle}</Text>
                          {item.message && (
                            <Text style={styles.cardMessage} numberOfLines={1}>
                              {item.message}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.cardDate}>
                          {new Date(item.sharedAt || item.createdAt || item.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </TouchableOpacity>
                    )}
                    scrollEnabled={false}
                  />
                ) : (
                  <Text style={styles.emptyText}>No cards received yet</Text>
                )
              )}
            </View>
          ) : (
            <View style={styles.cardsEmptyState}>
              <Ionicons name="card-outline" size={48} color="#6B7280" />
              <Text style={styles.cardsEmptyTitle}>Cards Not Available</Text>
              <Text style={styles.cardsEmptySubtitle}>
                Unable to load group cards at this time
              </Text>
            </View>
          )}
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Members ({groupMembers.length})
            </Text>
            {isAdmin && (
              <TouchableOpacity onPress={addMembers} style={styles.addButton}>
                <Ionicons name="person-add" size={20} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>
          {groupMembers.map(renderMemberItem)}
        </View>



        {/* Actions Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionItem} onPress={leaveGroup}>
            <Ionicons name="exit-outline" size={24} color="#EF4444" />
            <Text style={styles.actionTextDanger}>Leave Group</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      )}

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerContainer}>
            <Text style={styles.imagePickerTitle}>Group Photo</Text>
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={selectGroupImage}
            >
              <Ionicons name="camera" size={24} color="#3B82F6" />
              <Text style={styles.imagePickerOptionText}>Select Photo</Text>
            </TouchableOpacity>
            {groupInfo?.icon && (
              <TouchableOpacity
                style={styles.imagePickerOption}
                onPress={removeGroupImage}
              >
                <Ionicons name="trash" size={24} color="#EF4444" />
                <Text style={[styles.imagePickerOptionText, { color: '#EF4444' }]}>Remove Photo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.imagePickerCancel}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.imagePickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Leave Group Confirmation Modal */}
      <Modal
        visible={showLeaveConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Leave Group</Text>
            <Text style={styles.modalText}>
              Are you sure you want to leave "{groupInfo?.name}"? You will no longer receive messages from this group.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowLeaveConfirm(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={confirmLeaveGroup}
              >
                <Text style={styles.modalButtonTextPrimary}>Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#000000",
    borderBottomWidth: 0.5,
    borderBottomColor: "#333333",
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
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: "#000000",
  },
  loadingText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 16,
    textAlign: "center",
  },
  groupInfoSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: "#000000",
    borderBottomWidth: 8,
    borderBottomColor: "#1F2937",
  },
  groupIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#4B5563",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  groupIconImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 22,
  },
  groupDetails: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  joinCodeContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  joinCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  joinCodeLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    marginLeft: 6,
  },
  joinCodeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
    marginLeft: 4,
    marginRight: 8,
    letterSpacing: 1,
  },
  section: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#000000",
    borderBottomWidth: 8,
    borderBottomColor: "#1F2937",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#1F2937",
  },
  addButton: {
    padding: 8,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333333",
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4B5563",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  memberPhone: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  actionTextDanger: {
    fontSize: 16,
    color: "#EF4444",
    marginLeft: 12,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#D1D5DB",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: "#374151",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D1D5DB",
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  
  // Cards Section Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#3B82F6",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  cardsTabContainer: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  cardsTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  cardsActiveTab: {
    backgroundColor: "#3B82F6",
  },
  cardsTabText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  cardsActiveTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cardsContainer: {
    marginTop: 8,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333333",
  },
  cardImageContainer: {
    marginRight: 12,
  },
  cardImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  cardPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  cardSender: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 14,
    color: "#D1D5DB",
    fontStyle: "italic",
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 32,
    fontStyle: "italic",
  },
  
  // Group Cards Interface Styles
  groupCardsInterface: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  cardsLoadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingTextSmall: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  cardsSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardsSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  cardsSummaryIconContainer: {
    marginBottom: 8,
  },
  cardsSummaryNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardsSummaryLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  cardsSummaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#374151",
    marginHorizontal: 16,
  },
  recentCardsContainer: {
    marginTop: 8,
  },
  recentCardsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  recentCardsScroll: {
    marginBottom: 16,
  },
  recentCardsContent: {
    paddingHorizontal: 0,
  },
  recentCardItem: {
    width: 120,
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
  },
  recentCardImageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  recentCardImage: {
    width: 96,
    height: 60,
    borderRadius: 8,
  },
  recentCardPlaceholder: {
    width: 96,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTypeIndicator: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1F2937",
  },
  cardTypeIndicatorReceived: {
    backgroundColor: "#3B82F6",
  },
  recentCardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 4,
    lineHeight: 18,
  },
  recentCardSender: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  recentCardDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  viewAllCardsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  viewAllCardsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
    marginRight: 4,
  },
  cardsEmptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  cardsEmptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  cardsEmptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  
  // Admin Edit Styles
  editIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#000000",
  },
  groupNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editNameIcon: {
    marginLeft: 8,
  },
  nameEditContainer: {
    width: "100%",
    alignItems: "center",
  },
  nameEditInput: {
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    width: "80%",
    marginBottom: 16,
  },
  nameEditButtons: {
    flexDirection: "row",
    gap: 12,
  },
  nameEditButtonCancel: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#374151",
  },
  nameEditButtonTextCancel: {
    color: "#D1D5DB",
    fontWeight: "500",
  },
  nameEditButtonSave: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
  },
  nameEditButtonTextSave: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  
  // Image Picker Modal Styles
  imagePickerContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: 300,
    width: "100%",
  },
  imagePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
  },
  imagePickerOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#111827",
  },
  imagePickerOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  imagePickerCancel: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  imagePickerCancelText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
});