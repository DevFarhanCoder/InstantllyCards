import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ContactInfoScreen() {
  const { userId, name, phone } = useLocalSearchParams<{ 
    userId: string; 
    name: string; 
    phone: string; 
  }>();

  const handleDeleteChat = () => {
    Alert.alert(
      'Delete Chat', 
      `This will delete the entire chat history with ${name}.`, 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            // TODO: Implement delete chat functionality
            router.back();
            router.back(); // Go back to chats list
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact info</Text>
        <View style={styles.headerSpace} />
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileImageText}>
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.contactName}>{name || 'Unknown'}</Text>
        <Text style={styles.phoneNumber}>{phone || 'No phone number'}</Text>
        
        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutLabel}>About</Text>
          <Text style={styles.aboutText}>Available</Text>
        </View>
      </View>

      {/* Actions Section */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteChat}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Delete Chat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerSpace: {
    width: 40, // Balance the back button
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  profileImageContainer: {
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  phoneNumber: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 32,
    textAlign: 'center',
  },
  aboutSection: {
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  aboutLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '500',
  },
  aboutText: {
    fontSize: 16,
    color: '#111827',
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 12,
    fontWeight: '500',
  },
});