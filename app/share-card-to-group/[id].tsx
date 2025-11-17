import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { getCurrentUserId } from '@/lib/useUser';
import { ensureAuth } from '@/lib/auth';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with margins

interface UserCard {
  _id: string;
  title: string;
  preview?: string;
  cardType: string;
  createdAt: string;
  isPublic: boolean;
}

export default function ShareCardToGroupScreen() {
  const { id: groupId, groupName } = useLocalSearchParams<{ id: string; groupName: string }>();
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadUserCards();
  }, []);

  const loadUserCards = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading user cards for sharing...');

      // Ensure authentication token is present
      await ensureAuth();

      // Use the correct cards endpoint based on existing patterns
      const response = await api.get('/cards');
      console.log('📋 Raw cards API response:', JSON.stringify(response, null, 2));

      if (response && response.data) {
        const userCards = Array.isArray(response.data) ? response.data : [];
        console.log(`✅ Loaded ${userCards.length} user cards from API`);
        
        // Process and map the cards to ensure they have the required structure
        const processedCards = userCards.map((card: any) => {
          console.log('📋 Processing card:', card);
          return {
            _id: card._id || card.id,
            title: card.name || card.title || card.cardTitle || 'Untitled Card',
            preview: card.preview || card.cardPreview || card.image || card.profilePicture,
            cardType: card.cardType || card.type || 'business',
            createdAt: card.createdAt || card.created_at || new Date().toISOString(),
            isPublic: card.isPublic !== undefined ? card.isPublic : true
          };
        });
        
        console.log('📋 Processed cards:', processedCards);
        setCards(processedCards);
      } else if (response && response.success === false) {
        console.log('📭 API returned success: false, no cards found');
        setCards([]);
      } else {
        console.log('📭 Unexpected API response structure:', response);
        setCards([]);
      }
    } catch (error) {
      console.error('❌ Error loading user cards:', error);
      if (error && typeof error === 'object') {
        console.error('❌ Error response:', JSON.stringify(error, null, 2));
      }
      // Don't show alert immediately, let user see empty state with create option
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

  const shareCardToGroup = async () => {
    if (!selectedCard || !groupId) return;

    try {
      setSharing(true);
      console.log(`📤 Sharing card ${selectedCard._id} to group ${groupId}`);
      console.log(`📤 Selected card details:`, selectedCard);
      console.log(`📤 Message:`, message.trim());

      // Ensure authentication
      await ensureAuth();

      // Use the correct API endpoint format from existing code
      const sharePayload = {
        groupId: groupId,
        message: message.trim() || 'Check out my business card!'
      };

      console.log(`📤 Share payload:`, sharePayload);
      console.log(`📤 Using endpoint: /cards/${selectedCard._id}/share-to-group`);

      // Use the correct endpoint format: /cards/${cardId}/share-to-group
      const cardId = selectedCard._id;
      const endpoint = `/cards/${cardId}/share-to-group`;
      console.log(`📤 Constructed endpoint: ${endpoint}`);
      const response = await api.post(endpoint, sharePayload);
      console.log(`📤 API response:`, response);

      console.log(`📤 API response:`, JSON.stringify(response, null, 2));

      // Check if the response indicates success
      if (response && (response.success !== false)) {
        Alert.alert(
          'Card Shared!',
          `Your card "${selectedCard.title}" has been shared to ${groupName || 'the group'}.`,
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        console.error('❌ API response indicates failure:', response);
        throw new Error(response?.error || response?.message || 'Failed to share card');
      }
    } catch (error) {
      console.error('❌ Error sharing card:', error);
      if (error && typeof error === 'object') {
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      }
      
      // Show more specific error message
      let errorMessage = 'Failed to share card to group';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Failed to share card: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSharing(false);
    }
  };

  const renderCard = ({ item }: { item: UserCard }) => {
    const isSelected = selectedCard?._id === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.cardContainer,
          isSelected && styles.selectedCardContainer
        ]}
        onPress={() => setSelectedCard(item)}
        activeOpacity={0.8}
      >
        {/* Selection indicator */}
        <View style={[
          styles.selectionIndicator,
          isSelected && styles.selectedIndicator
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>

        <View style={styles.cardPreview}>
          {item.preview ? (
            <Image 
              source={{ uri: item.preview }} 
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderCard}>
              <Ionicons name="card" size={32} color="#9CA3AF" />
              <Text style={styles.cardTypeText}>{item.cardType}</Text>
            </View>
          )}
          
          {/* Card overlay with title */}
          <View style={styles.cardOverlay}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        </View>

        {/* Card info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitleFull} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.cardMeta}>
            <Ionicons 
              name={item.isPublic ? "globe-outline" : "lock-closed-outline"} 
              size={12} 
              color="#6B7280" 
            />
            <Text style={styles.cardVisibility}>
              {item.isPublic ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="card-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No cards available</Text>
      <Text style={styles.emptySubtitle}>
        You can create a new card or refresh to reload your existing cards
      </Text>
      
      <View style={styles.emptyActions}>
        <TouchableOpacity 
          style={styles.refreshCardsButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={20} color="#3B82F6" />
          <Text style={styles.refreshCardsButtonText}>Refresh Cards</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.createCardButton}
          onPress={() => router.push('/builder')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createCardButtonText}>Create New Card</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Card</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Share to {groupName}</Text>
        
        <TouchableOpacity 
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Instruction */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Select a card to share with the group
        </Text>
      </View>

      {/* Cards List */}
      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Message Input & Share Button */}
      {selectedCard && (
        <View style={styles.shareContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Add a message (optional)..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={200}
          />
          
          <TouchableOpacity
            style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
            onPress={shareCardToGroup}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="share" size={20} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share Card</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    flex: 1,
  },
  refreshButton: {
    padding: 8,
  },
  placeholder: {
    width: 36,
    height: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  instructionContainer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  instructionText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  selectedCardContainer: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  selectedIndicator: {
    backgroundColor: '#3B82F6',
  },
  cardPreview: {
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTypeText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  cardInfo: {
    padding: 12,
  },
  cardTitleFull: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardVisibility: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  shareContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  shareButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshCardsButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshCardsButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createCardButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createCardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});