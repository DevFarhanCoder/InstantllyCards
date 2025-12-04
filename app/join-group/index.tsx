import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '../../lib/useUser';
import api from '../../lib/api';

export default function JoinGroupScreen() {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const joinGroup = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a group code');
      return;
    }

    if (joinCode.length !== 6) {
      Alert.alert('Error', 'Group code must be 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Get current user data using utility function
      const userData = await getCurrentUser();
      if (!userData) {
        Alert.alert('Error', 'User not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Join group via backend API
      console.log('🚀 Joining group via backend API...');
      
      const response = await api.post('/groups/join', {
        inviteCode: joinCode.trim().toUpperCase()
      });

      if (response.success) {
        console.log('✅ Successfully joined group:', response.group);
        
        Alert.alert(
          'Success',
          `You have successfully joined the group "${response.group.name}"!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setJoinCode('');
                router.push('/(tabs)/chats');
              }
            }
          ]
        );
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('❌ Group join failed:', error);
      
      const errorMessage = error.response?.data?.error || error.message;
      
      if (errorMessage?.includes('Invalid invite code') || errorMessage?.includes('404')) {
        Alert.alert('Error', 'Invalid group code. Please check and try again.');
      } else if (errorMessage?.includes('already a member')) {
        Alert.alert('Info', 'You are already a member of this group.');
      } else {
        Alert.alert('Error', 'Failed to join group. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Group</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Enter Group Code</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code shared by the group admin
        </Text>

        <TextInput
          style={styles.codeInput}
          placeholder="000000"
          placeholderTextColor="#9CA3AF"
          value={joinCode}
          onChangeText={setJoinCode}
          maxLength={6}
          keyboardType="numeric"
          autoFocus
        />

        <TouchableOpacity
          style={[styles.joinButton, (!joinCode.trim() || loading) && styles.joinButtonDisabled]}
          onPress={joinGroup}
          disabled={!joinCode.trim() || loading}
        >
          <Text style={styles.joinButtonText}>
            {loading ? 'Joining...' : 'Join Group'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
  },
  codeInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  joinButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#4B5563',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});