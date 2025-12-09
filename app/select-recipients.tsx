import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getCurrentUserId } from '@/lib/useUser';

type Recipient = {
  senderId: string;
  senderName: string;
  senderProfilePicture?: string;
};

export default function SelectRecipientsScreen() {
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (params.recipients) {
      try {
        const parsedRecipients = JSON.parse(params.recipients as string);
        setRecipients(parsedRecipients);
      } catch (error) {
        console.error('Error parsing recipients:', error);
        Alert.alert('Error', 'Failed to load recipients');
        router.back();
      }
    }
  }, [params.recipients]);

  const toggleRecipient = (senderId: string) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(senderId)) {
      newSelected.delete(senderId);
    } else {
      newSelected.add(senderId);
    }
    setSelectedRecipients(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRecipients.size === recipients.length) {
      // Deselect all
      setSelectedRecipients(new Set());
    } else {
      // Select all
      setSelectedRecipients(new Set(recipients.map(r => r.senderId)));
    }
  };

  const handleSendCards = async () => {
    if (selectedRecipients.size === 0) {
      Alert.alert('No Selection', 'Please select at least one person to send your card to');
      return;
    }

    try {
      setSending(true);
      const currentUserId = await getCurrentUserId();
      
      // Get user's cards
      const cardsResponse = await api.get('/cards');
      const userCards = cardsResponse.data;

      if (!userCards || userCards.length === 0) {
        Alert.alert('No Cards', 'You don\'t have any cards to send');
        setSending(false);
        return;
      }

      // Send cards to all selected recipients
      const sendPromises = Array.from(selectedRecipients).map(async (recipientId) => {
        try {
          // Send all cards to this recipient
          const cardSendPromises = userCards.map((card: any) =>
            api.post(`/cards/${card._id}/share`, {
              recipientId: recipientId,
            })
          );
          await Promise.all(cardSendPromises);
          return { success: true, recipientId };
        } catch (error) {
          console.error(`Failed to send cards to ${recipientId}:`, error);
          return { success: false, recipientId };
        }
      });

      const results = await Promise.all(sendPromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      console.log(`✅ Cards sent successfully to ${successCount} recipients`);
      
      // Invalidate and refetch queries immediately to show new cards
      console.log('🔄 Invalidating and refetching sent-cards queries...');
      await queryClient.invalidateQueries({ 
        queryKey: ["sent-cards"],
        refetchType: 'active' // Refetch active queries immediately
      });
      await queryClient.refetchQueries({ 
        queryKey: ["sent-cards"],
        type: 'active'
      });
      console.log('✅ Sent cards refreshed');

      setSending(false);

      if (failCount === 0) {
        Alert.alert(
          'Success',
          `Cards sent to ${successCount} ${successCount === 1 ? 'person' : 'people'}`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          'Partial Success',
          `Cards sent to ${successCount} ${successCount === 1 ? 'person' : 'people'}. Failed for ${failCount}.`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error sending cards:', error);
      setSending(false);
      Alert.alert('Error', 'Failed to send cards. Please try again.');
    }
  };

  const renderRecipient = ({ item }: { item: Recipient }) => {
    const isSelected = selectedRecipients.has(item.senderId);

    return (
      <TouchableOpacity
        style={styles.recipientCard}
        onPress={() => toggleRecipient(item.senderId)}
        activeOpacity={0.7}
      >
        <View style={styles.recipientInfo}>
          {item.senderProfilePicture ? (
            <Image
              source={{ uri: item.senderProfilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color="#9CA3AF" />
            </View>
          )}
          <Text style={styles.recipientName}>{item.senderName}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Cards</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Select All Section */}
      <View style={styles.selectAllContainer}>
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={toggleSelectAll}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, selectedRecipients.size === recipients.length && recipients.length > 0 && styles.checkboxSelected]}>
            {selectedRecipients.size === recipients.length && recipients.length > 0 && (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.selectAllText}>
            {selectedRecipients.size === recipients.length && recipients.length > 0 ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.selectedCount}>
          {selectedRecipients.size} of {recipients.length} selected
        </Text>
      </View>

      {/* Recipients List */}
      <FlatList
        data={recipients}
        keyExtractor={(item) => item.senderId}
        renderItem={renderRecipient}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recipients found</Text>
          </View>
        }
      />

      {/* Send Button */}
      {recipients.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (selectedRecipients.size === 0 || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendCards}
            disabled={selectedRecipients.size === 0 || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.sendButtonText}>
                  Send to {selectedRecipients.size} {selectedRecipients.size === 1 ? 'Person' : 'People'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  selectAllContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 12,
  },
  selectedCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    paddingVertical: 8,
  },
  recipientCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
