import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { ensureAuth } from '@/lib/auth';
import BusinessAvatar from '@/components/BusinessAvatar';

interface UserCard {
  _id: string;
  title: string;
  name?: string;
  companyName?: string;
  preview?: string;
  companyPhoto?: string;
  cardType: string;
  createdAt: string;
  isPublic: boolean;
}

export default function SelectCardForContactsScreen() {
  const { recipientId, recipientName } = useLocalSearchParams<{ recipientId?: string; recipientName?: string }>();
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Log recipient info on mount
  useEffect(() => {
    console.log('📋 SelectCardForContacts Screen Loaded');
    console.log('👤 Recipient Info:', {
      recipientId,
      recipientName,
      hasRecipient: !!(recipientId && recipientName)
    });
  }, [recipientId, recipientName]);

  useEffect(() => {
    loadUserCards();
  }, []);

  const loadUserCards = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading user cards for sharing...');

      // Ensure authentication token is present
      await ensureAuth();

      // Use the correct cards endpoint
      const response = await api.get('/cards');
      console.log('📋 Raw cards API response:', JSON.stringify(response, null, 2));

      if (response && response.data) {
        const userCards = Array.isArray(response.data) ? response.data : [];
        console.log(`✅ Loaded ${userCards.length} user cards from API`);
        
        // Process and map the cards to ensure they have the required structure
        const processedCards = userCards.map((card: any) => {
          return {
            _id: card._id || card.id,
            title: card.companyName || card.name || card.title || card.cardTitle || 'Untitled Card',
            name: card.name,
            companyName: card.companyName,
            preview: card.companyPhoto || card.preview || card.cardPreview || card.image || card.profilePicture,
            companyPhoto: card.companyPhoto,
            cardType: card.cardType || card.type || 'business',
            createdAt: card.createdAt || card.created_at || new Date().toISOString(),
            isPublic: card.isPublic !== undefined ? card.isPublic : true
          };
        });
        
        console.log('📋 Processed cards:', processedCards);
        setCards(processedCards);
      } else {
        console.log('📭 No cards found');
        setCards([]);
      }
    } catch (error) {
      console.error('❌ Error loading user cards:', error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserCards();
    setRefreshing(false);
  };

  const handleSelectCard = (card: UserCard) => {
    console.log(`✅ Selected card for sharing:`, {
      cardId: card._id,
      title: card.title,
      companyName: card.companyName,
      name: card.name
    });
    setSelectedCardId(card._id);
  };

  const handleSendCard = async () => {
    if (!selectedCardId) {
      console.log('⚠️ No card selected');
      return;
    }
    
    const selectedCard = cards.find(c => c._id === selectedCardId);
    if (!selectedCard) {
      console.log('❌ Selected card not found in cards array');
      return;
    }

    const cardTitle = selectedCard.companyName || selectedCard.name || selectedCard.title || 'Business Card';

    console.log('📦 Preparing to send card:', {
      selectedCardId: selectedCard._id,
      cardTitle,
      recipientId,
      recipientName,
      hasRecipient: !!(recipientId && recipientName)
    });

    // If we have a recipient (came from viewing someone's card), send directly to them
    if (recipientId && recipientName) {
      try {
        setSending(true);
        console.log(`📤 Sending card ${selectedCard._id} to ${recipientName} (${recipientId})`);
        console.log('🔗 API call: POST /cards/' + selectedCard._id + '/share with recipientId:', recipientId);
        
        // Call API to share card with specific user
        const response = await api.post(`/cards/${selectedCard._id}/share`, {
          recipientId: recipientId,
        });

        console.log('✅ API Response:', response);

        if (response.success) {
          console.log('🎉 Card sent successfully! Navigating to Messaging > Sent tab');
          // Navigate directly to Messaging > Sent tab without showing alert
          router.push('/(tabs)/chats?tab=sent');
        } else {
          throw new Error(response.message || 'Failed to share card');
        }
      } catch (error: any) {
        console.error('❌ Error sharing card:', error);
        
        // Check if it's a duplicate share error (409 status or "already" in message)
        const errorMessage = error.message || error?.data?.message || '';
        const isDuplicateError = error.status === 409 || 
                                 errorMessage.toLowerCase().includes('already') ||
                                 errorMessage.toLowerCase().includes('duplicate');
        
        if (isDuplicateError) {
          // Get the sent card for highlighting
          try {
            const sentCardsResponse = await api.get<{ success: boolean; data: any[] }>('/cards/sent');
            const sentCards = sentCardsResponse?.data || [];
            
            // Find the sent card to this recipient
            const sentCardToHighlight = sentCards.find((sentCard: any) => 
              sentCard.cardId === selectedCard._id && sentCard.recipientId === recipientId
            );
            
            Alert.alert(
              'Card Already Sent',
              `You have already sent this card to ${recipientName}.\n\nYou can only send a card once to each user.`,
              [{
                text: 'OK',
                onPress: () => {
                  // Navigate to Sent tab with highlight parameter
                  if (sentCardToHighlight) {
                    console.log('📍 Navigating to Sent tab with highlight:', sentCardToHighlight._id);
                    router.push(`/(tabs)/chats?tab=sent&highlightCardId=${sentCardToHighlight._id}`);
                  } else {
                    // Fallback to just opening Sent tab
                    router.push('/(tabs)/chats?tab=sent');
                  }
                }
              }]
            );
          } catch (fetchError) {
            // Fallback if we can't fetch sent cards
            Alert.alert(
              'Card Already Sent',
              `You have already sent this card to ${recipientName}.\n\nYou can only send a card once to each user.`,
              [{
                text: 'OK',
                onPress: () => {
                  router.push('/(tabs)/chats?tab=sent');
                }
              }]
            );
          }
        } else {
          // Show generic error for other types of errors
          Alert.alert(
            'Error',
            errorMessage || 'Failed to share card. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } finally {
        setSending(false);
      }
    } else {
      // No specific recipient - navigate to contacts selection
      router.push(`/contacts/select?cardId=${selectedCard._id}&cardTitle=${encodeURIComponent(cardTitle)}` as any);
    }
  };

  const renderCard = ({ item }: { item: UserCard }) => {
    const displayTitle = item.companyName || item.name || item.title || 'Untitled Card';
    const isSelected = selectedCardId === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.cardItem,
          isSelected && styles.cardItemSelected
        ]}
        onPress={() => handleSelectCard(item)}
        activeOpacity={0.7}
      >
        <BusinessAvatar
          companyPhoto={item.companyPhoto || item.preview}
          companyName={displayTitle}
          size={48}
          backgroundColor="#6B7280"
        />
        <Text style={styles.cardTitle} numberOfLines={1}>
          {displayTitle}
        </Text>
        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark-circle" size={28} color="#10B981" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {recipientName ? `Share to ${recipientName}` : 'Select Cards to Share'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Cards to Share</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          {recipientName ? `Select a card to send to ${recipientName}` : 'Tap to select'}
        </Text>

        {cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Cards Yet</Text>
            <Text style={styles.emptyText}>
              Create your first business card to share with contacts
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/builder')}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={cards}
              renderItem={renderCard}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#3B82F6"
                />
              }
            />
            {selectedCardId && (
              <TouchableOpacity
                style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                onPress={handleSendCard}
                activeOpacity={0.8}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.sendButtonText}>Sending...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.sendButtonText}>
                      {recipientName ? 'Send Card' : 'Continue to Contacts'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 100,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardItemSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 2.5,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -50,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 20,
    gap: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
