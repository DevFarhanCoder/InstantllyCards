import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { ensureAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';

interface ReceivedCard {
  _id: string;
  cardId: string;
  senderId: string;
  senderName: string;
  cardTitle: string;
  receivedAt: string;
  isViewed: boolean;
  cardPhoto?: string;
}

export default function ReceivedCardsFromSender() {
  const { senderId, senderName } = useLocalSearchParams<{ senderId: string; senderName: string }>();
  const [cards, setCards] = useState<ReceivedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Reload cards when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCards();
    }, [senderId])
  );

  const loadCards = async () => {
    try {
      setLoading(true);
      const token = await ensureAuth();
      if (!token) {
        router.back();
        return;
      }

      console.log('📋 Loading cards for senderId:', senderId);
      console.log('📋 Sender name:', senderName);
      
      // Fetch all received cards filtered by sender
      const response = await api.get(`/cards/received?senderId=${senderId}&limit=100`);
      console.log('📋 API response:', {
        success: response.success,
        totalCards: response.data?.length || 0,
        sampleCard: response.data?.[0] ? {
          senderId: response.data[0].senderId,
          senderName: response.data[0].senderName,
          cardTitle: response.data[0].cardTitle
        } : null
      });
      
      if (response.success && response.data) {
        // Filter on client side as well to be safe
        const filteredCards = response.data.filter((card: ReceivedCard) => card.senderId === senderId);
        console.log('📋 Filtered cards count:', filteredCards.length);
        setCards(filteredCards);
      }
    } catch (error) {
      console.error('Error loading cards from sender:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = ({ item }: { item: ReceivedCard }) => (
    <TouchableOpacity
      style={[styles.cardItem, !item.isViewed && styles.unseenCard]}
      onPress={async () => {
        router.push({ pathname: `/(main)/card/[id]`, params: { id: item.cardId } } as any);
        if (!item.isViewed) {
          try {
            await api.post(`/cards/shared/${item._id}/view`);
            // Invalidate the received cards query to refresh the main list
            queryClient.invalidateQueries({ queryKey: ["received-cards"] });
            loadCards(); // Reload to update viewed status
          } catch (error) {
            console.error('Failed to mark card as viewed:', error);
          }
        }
      }}
    >
      {item.cardPhoto ? (
        <Image source={{ uri: item.cardPhoto }} style={styles.cardPhoto} />
      ) : (
        <View style={[styles.cardPhoto, styles.cardPhotoPlaceholder]}>
          <Ionicons name="card" size={24} color="#9CA3AF" />
        </View>
      )}
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.cardTitle}
        </Text>
        <Text style={styles.cardDate}>
          {new Date(item.receivedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      {!item.isViewed && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Cards from {senderName}</Text>
          <Text style={styles.headerSubtitle}>{cards.length} card{cards.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Cards List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading cards...</Text>
        </View>
      ) : cards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-open-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No cards found</Text>
          <Text style={styles.emptySubtext}>You haven't received any cards from {senderName} yet</Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          renderItem={renderCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unseenCard: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  cardPhoto: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  cardPhotoPlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
