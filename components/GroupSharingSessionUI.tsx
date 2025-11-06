import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import groupSharingService, { GroupSharingSession, GroupParticipant } from '@/lib/groupSharingService';
import CustomToast, { ToastType } from './CustomToast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/lib/api';
import { ensureAuth } from '@/lib/auth';

const { width } = Dimensions.get('window');

interface Card {
  _id: string;
  name: string;
  profilePhoto?: string;
  jobTitle?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
}

interface GroupSharingSessionUIProps {
  visible: boolean;
  session: GroupSharingSession | null;
  isAdmin: boolean;
  onClose: () => void;
  onQuit: () => void;
  onCreateGroup: () => void;
}

export default function GroupSharingSessionUI({
  visible,
  session,
  isAdmin,
  onClose,
  onQuit,
  onCreateGroup,
}: GroupSharingSessionUIProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [defaultCardId, setDefaultCardId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [sharingComplete, setSharingComplete] = useState(false);
  const [sharingResults, setSharingResults] = useState<any>(null);
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  
  const showToast = (message: string, type: ToastType = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Load user's cards from API
  useEffect(() => {
    if (visible) {
      loadCards();
      // Update participants from session
      if (session?.participants) {
        setParticipants(session.participants);
      }
    }
  }, [visible, session]);

  // Real-time monitoring for participant changes
  useEffect(() => {
    if (!visible || !session) return;

    const checkSessionStatus = async () => {
      try {
        const currentSession = await groupSharingService.getCurrentSession();
        
        if (!currentSession) {
          console.log('⏰ Session expired or not found');
          showToast('Session ended', 'info');
          onQuit();
          return;
        }

        // Update participants list
        if (currentSession.participants) {
          setParticipants(currentSession.participants);
        }

        // For non-admin: Close if admin quits
        if (!isAdmin && (currentSession.status === 'completed' || currentSession.status === 'expired')) {
          console.log('⏰ Admin ended the session');
          showToast('Admin ended the session', 'info');
          onQuit();
        }
      } catch (error) {
        console.error('❌ Failed to get session status:', error);
      }
    };

    // Check every 2 seconds
    const statusInterval = setInterval(checkSessionStatus, 2000);

    return () => {
      clearInterval(statusInterval);
      console.log('🛑 Stopped group sharing polling');
    };
  }, [visible, session, isAdmin]);

  const loadCards = async () => {
    try {
      setIsLoading(true);
      console.log('📥 GroupSession: Loading user cards...');
      
      // Get auth token
      const token = await ensureAuth();
      if (!token) {
        console.warn('⚠️ GroupSession: No auth token found');
        showToast('Please login to continue', 'error');
        setCards([]);
        return;
      }

      // Fetch cards from API (same as My Cards screen)
      const response = await api.get('/cards');
      console.log('📥 GroupSession: API Response:', response);
      
      let fetchedCards: Card[] = [];
      if (response && typeof response === 'object' && 'data' in response) {
        fetchedCards = response.data || [];
      } else if (Array.isArray(response)) {
        fetchedCards = response;
      }
      
      console.log('📥 GroupSession: Fetched cards count:', fetchedCards.length);
      setCards(fetchedCards);
      
      // Get current default card from user data
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const currentCardId = user.currentCardId;
        
        if (currentCardId && fetchedCards.some((c: Card) => c._id === currentCardId)) {
          console.log('✅ GroupSession: Setting default card:', currentCardId);
          setDefaultCardId(currentCardId);
          setSelectedCards([currentCardId]);
        } else if (fetchedCards.length > 0) {
          // Auto-select first card as default
          console.log('✅ GroupSession: Auto-selecting first card');
          setDefaultCardId(fetchedCards[0]._id);
          setSelectedCards([fetchedCards[0]._id]);
        }
      } else if (fetchedCards.length > 0) {
        console.log('✅ GroupSession: Auto-selecting first card (no user data)');
        setDefaultCardId(fetchedCards[0]._id);
        setSelectedCards([fetchedCards[0]._id]);
      }
    } catch (error) {
      console.error('❌ GroupSession: Error loading cards:', error);
      showToast('Failed to load cards', 'error');
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardPress = (cardId: string) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const handleSetDefault = async (cardId: string) => {
    setDefaultCardId(cardId);
    // Ensure default card is also selected
    if (!selectedCards.includes(cardId)) {
      setSelectedCards([...selectedCards, cardId]);
    }

    // Update default card in AsyncStorage
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.currentCardId = cardId;
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        showToast('Default card updated', 'success');
      }
    } catch (error) {
      console.error('Error updating default card:', error);
    }
  };

  const handleSetCards = async () => {
    if (selectedCards.length === 0) {
      showToast('Please select at least one card to share', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const success = await groupSharingService.setCardsToShare(
        selectedCards,
        defaultCardId || selectedCards[0]
      );
      
      if (success) {
        showToast('Cards set successfully!', 'success');
      } else {
        showToast('Failed to set cards. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Error setting cards', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSharing = async () => {
    if (selectedCards.length === 0) {
      showToast('Please select at least one card to share', 'warning');
      return;
    }
    
    setIsLoading(true);
    try {
      // Just set the cards in the session - don't execute yet
      const setSuccess = await groupSharingService.setCardsToShare(
        selectedCards,
        defaultCardId || selectedCards[0]
      );

      if (!setSuccess) {
        showToast('Failed to set cards. Please try again.', 'error');
        setIsLoading(false);
        return;
      }

      console.log(`✅ ${isAdmin ? 'Admin' : 'Participant'} set ${selectedCards.length} cards in session`);
      
      if (isAdmin) {
        showToast('Cards ready! Now choose: Create Group or Quit Sharing', 'success');
      } else {
        showToast('Cards ready! Waiting for admin to execute.', 'success');
      }
      
      // Show completion screen
      setSharingComplete(true);
      
    } catch (error) {
      showToast('Error setting cards', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuitSharing = async () => {
    setIsLoading(true);
    try {
      if (isAdmin) {
        // Admin executes card sharing WITHOUT group name (saves to Messaging tabs - SharedCard)
        console.log('🚪 Admin chose Quit Sharing - executing peer-to-peer sharing');
        const result = await groupSharingService.executeCardSharing(); // No groupName
        
        if (!result.success) {
          throw new Error('Failed to save shared cards');
        }
        
        console.log('✅ Cards saved to Messaging tabs:', result.summary);
        
        // End the session
        await groupSharingService.endSession();
        
        showToast(`${result.summary?.totalShares || 0} cards saved to Messaging tabs!`, 'success');
      } else {
        // Non-admin just leaves
        showToast('Thanks for participating!', 'success');
      }
      
      setTimeout(() => {
        onQuit();
      }, 1500);
    } catch (error) {
      console.error('❌ Error in handleQuitSharing:', error);
      showToast('Error ending session', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCard = (card: Card) => {
    const isSelected = selectedCards.includes(card._id);
    const isDefault = defaultCardId === card._id;

    return (
      <TouchableOpacity
        key={card._id}
        style={[styles.cardItem, isSelected && styles.cardItemSelected]}
        onPress={() => handleCardPress(card._id)}
        onLongPress={() => handleSetDefault(card._id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Profile Photo */}
          <View style={styles.cardAvatarContainer}>
            {card.profilePhoto ? (
              <Image source={{ uri: card.profilePhoto }} style={styles.cardAvatar} />
            ) : (
              <View style={styles.cardAvatarPlaceholder}>
                <Ionicons name="person" size={28} color="#9CA3AF" />
              </View>
            )}
          </View>

          {/* Card Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{card.name || 'Unnamed Card'}</Text>
          </View>

          {/* Selection Indicator */}
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            </View>
          )}
        </View>

        {/* Default Badge */}
        {isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCompletionScreen = () => {
    const selectedCount = selectedCards.length;
    
    return (
      <View style={styles.completionContainer}>
        <View style={styles.completionIcon}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>
        <Text style={styles.completionTitle}>
          {isAdmin ? 'Ready to Share!' : 'Cards Ready!'}
        </Text>
        <Text style={styles.completionSubtitle}>
          {isAdmin 
            ? `${selectedCount} card${selectedCount !== 1 ? 's' : ''} from all participants ready to be shared`
            : `${selectedCount} card${selectedCount !== 1 ? 's' : ''} marked. Waiting for admin.`
          }
        </Text>
        {isAdmin && (
          <Text style={styles.completionSubtitle}>
            Choose how to share these cards:
          </Text>
        )}
        
        <View style={styles.adminActions}>
          {isAdmin ? (
            <>
              <TouchableOpacity
                style={styles.createGroupButton}
                onPress={onCreateGroup}
                disabled={isLoading}
              >
                <Ionicons name="people" size={20} color="#FFFFFF" />
                <Text style={styles.createGroupButtonText}>Create New Group</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quitButton}
                onPress={handleQuitSharing}
                disabled={isLoading}
              >
                <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
                <Text style={styles.quitButtonText}>Share to Messaging</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.quitButton}
              onPress={handleQuitSharing}
              disabled={isLoading}
            >
              <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
              <Text style={styles.quitButtonText}>Quit Sharing</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (!visible || !session) return null;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Sharing Session</Text>
          <View style={styles.headerRight} />
        </View>

        {sharingComplete ? (
          renderCompletionScreen()
        ) : (
          <>
            {/* Info Section */}
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Select Cards to Share</Text>
              <Text style={styles.infoSubtitle}>
                Tap to select, long press to set as default
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.selectedCount}>
                  {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
                </Text>
                <Text style={styles.participantCount}>
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Cards List */}
            <ScrollView style={styles.cardsContainer} contentContainerStyle={styles.cardsContent}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text style={styles.loadingText}>Loading your cards...</Text>
                </View>
              ) : cards.length === 0 ? (
                <View style={styles.noCardsContainer}>
                  <Ionicons name="card-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.noCardsText}>No Cards Yet</Text>
                  <Text style={styles.noCardsSubtext}>Create a card to get started</Text>
                </View>
              ) : (
                <View style={styles.cardsGrid}>
                  {cards.map(renderCard)}
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.startSharingButton,
                  selectedCards.length === 0 && styles.startSharingButtonDisabled
                ]}
                onPress={handleStartSharing}
                disabled={isLoading || selectedCards.length === 0}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="share-social" size={20} color="#FFFFFF" />
                    <Text style={styles.startSharingButtonText}>
                      {isAdmin ? 'Share My Cards' : 'Share My Cards'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Toast */}
        <CustomToast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  headerRight: {
    width: 40,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  participantCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  cardsContainer: {
    flex: 1,
  },
  cardsContent: {
    padding: 16,
  },
  cardsGrid: {
    gap: 12,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardItemSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F4FF',
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatarContainer: {
    marginRight: 12,
  },
  cardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  cardAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  checkmark: {
    marginLeft: 8,
  },
  defaultBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardJobTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionsContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  startSharingButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startSharingButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  startSharingButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 12,
  },
  noCardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noCardsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  noCardsSubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
    marginTop: 16,
  },
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  completionIcon: {
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  adminActions: {
    width: '100%',
    gap: 12,
  },
  createGroupButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createGroupButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quitButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  participantWaitingContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  participantWaitingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
    textAlign: 'center',
  },
  participantWaitingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
