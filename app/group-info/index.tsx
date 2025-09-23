import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, getCurrentUserId } from '@/lib/useUser';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';

interface DeviceContact {
  id: string;
  name: string;
  phoneNumber: string;
  isAppUser: boolean;
  userId?: string;
  profilePicture?: string;
  about?: string;
}

interface GroupInfo {
  id: string;
  name: string;
  description: string;
  icon?: string;
  members: string[]; // contact IDs
  admin: string; // current user ID
  createdAt: string;
  updatedAt: string;
}

export default function GroupInfoScreen() {
  const { selectedContactIds } = useLocalSearchParams<{ selectedContactIds: string }>();
  const [selectedContacts, setSelectedContacts] = useState<DeviceContact[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupIcon, setGroupIcon] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSelectedContacts();
  }, [selectedContactIds]);

  const loadSelectedContacts = async () => {
    if (!selectedContactIds) {
      console.log('❌ No selectedContactIds provided');
      return;
    }
    
    console.log('🔍 Loading selected contacts with IDs:', selectedContactIds);
    
    try {
      const contactIds = selectedContactIds.split(',');
      console.log('🔍 Split contact IDs:', contactIds);
      const contacts: DeviceContact[] = [];
      
      for (const contactId of contactIds) {
        console.log(`🔍 Looking for contact with ID: ${contactId}`);
        
        // First try to get contact data from temporary storage
        let contactData = await AsyncStorage.getItem(`temp_contact_${contactId}`);
        console.log(`🔍 temp_contact_${contactId}:`, contactData ? 'Found' : 'Not found');
        
        if (!contactData) {
          // If not found, try to get from stored contacts
          contactData = await AsyncStorage.getItem(`contact_${contactId}`);
          console.log(`🔍 contact_${contactId}:`, contactData ? 'Found' : 'Not found');
        }
        
        if (!contactData) {
          // If not found, try to get from device contacts storage
          contactData = await AsyncStorage.getItem(`device_contact_${contactId}`);
          console.log(`🔍 device_contact_${contactId}:`, contactData ? 'Found' : 'Not found');
        }
        
        if (contactData) {
          const contact = JSON.parse(contactData);
          console.log(`✅ Loaded contact:`, contact.name);
          contacts.push({
            id: contactId,
            name: contact.name,
            phoneNumber: contact.phoneNumber,
            isAppUser: contact.isAppUser || false,
            userId: contact.userId,
            profilePicture: contact.profilePicture,
            about: contact.about,
          });
        } else {
          console.warn(`❌ Contact data not found for ID: ${contactId}`);
        }
      }
      
      console.log('🔍 Final loaded contacts:', contacts.length, contacts.map(c => c.name));
      setSelectedContacts(contacts);
      console.log('📱 Loaded selected contacts:', contacts);
    } catch (error) {
      console.error('Error loading selected contacts:', error);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to set a group icon.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setGroupIcon(result.assets[0].uri);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'Please select at least one contact');
      return;
    }

    setLoading(true);

    try {
      // Get current user data using the utility function
      const userData = await getCurrentUser();
      if (!userData) {
        Alert.alert('Error', 'User not found. Please log in again.');
        setLoading(false);
        return;
      }

      const currentUserId = userData.id || userData._id;
      if (!currentUserId) {
        Alert.alert('Error', 'Invalid user data. Please log in again.');
        setLoading(false);
        return;
      }

      // Create group via backend API instead of local storage
      try {
        console.log('🚀 Creating group via backend API...');
        
        const memberIds = selectedContacts.map(c => c.userId || c.id).filter(Boolean);
        console.log('📝 Member IDs for group:', memberIds);
        
        const createGroupResponse = await api.post('/groups', {
          name: groupName.trim(),
          description: groupDescription.trim(),
          memberIds: memberIds,
          icon: groupIcon || ''
        });

        if (createGroupResponse && createGroupResponse.success) {
          console.log('✅ Group created successfully:', createGroupResponse.group);
          
          Alert.alert(
            'Success', 
            `Group "${groupName}" created successfully!\n\nInvite Code: ${createGroupResponse.inviteCode}\n\nAll members have been notified and can now see the group.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  setTimeout(() => {
                    try {
                      router.push('/chats');
                    } catch (error) {
                      console.error('Navigation error:', error);
                      router.push('/chats');
                    }
                  }, 100);
                }
              }
            ]
          );
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (apiError) {
        console.error('❌ Backend group creation failed:', apiError);
        Alert.alert('Error', 'Failed to create group. Please check your internet connection and try again.');
      }

    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.root} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>New Group</Text>
          <Text style={styles.contactCount}>{selectedContacts.length} members</Text>
        </View>
        <TouchableOpacity 
          onPress={createGroup}
          style={[styles.createButton, (!groupName.trim() || loading) && styles.disabledButton]}
          disabled={!groupName.trim() || loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Icon Section */}
        <View style={styles.iconSection}>
          <TouchableOpacity onPress={pickImage} style={styles.iconContainer}>
            {groupIcon ? (
              <Image source={{ uri: groupIcon }} style={styles.groupIcon} />
            ) : (
              <View style={styles.placeholderIcon}>
                <Ionicons name="camera" size={32} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.iconHint}>Tap to add group icon</Text>
        </View>

        {/* Group Info Form */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              placeholderTextColor="#9CA3AF"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />
            <Text style={styles.charCount}>{groupName.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Add a description"
              placeholderTextColor="#9CA3AF"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.charCount}>{groupDescription.length}/200</Text>
          </View>
        </View>

        {/* Selected Members */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Members ({selectedContacts.length})</Text>
          {selectedContacts.map((contact, index) => (
            <View key={contact.id} style={styles.memberItem}>
              <View style={styles.memberAvatar}>
                {contact.profilePicture ? (
                  <Image source={{ uri: contact.profilePicture }} style={styles.memberAvatarImage} />
                ) : (
                  <Text style={styles.memberAvatarText}>
                    {contact.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{contact.name}</Text>
                <Text style={styles.memberPhone}>{contact.phoneNumber}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  contactCount: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  createButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#4B5563",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  iconSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#000000",
  },
  iconContainer: {
    marginBottom: 12,
  },
  groupIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4B5563",
    borderStyle: "dashed",
  },
  iconHint: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#000000",
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#374151",
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
  },
  membersSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});