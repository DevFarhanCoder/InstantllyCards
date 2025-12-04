import React, { useState, useEffect, useRef } from 'react';
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
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getCurrentUserId } from '../../lib/useUser';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with margins

interface GroupCard {
  _id: string;
  cardId: string;
  senderId: string;
  senderName: string;
  senderProfilePicture?: string;
  cardTitle: string;
  cardPhoto?: string;
  sentAt: string;
  message?: string;
  isFromMe?: boolean;
}

type TabType = 'sent' | 'received';

export default function GroupCardsScreen() {
  const { id: groupId, groupName } = useLocalSearchParams<{ id: string; groupName: string }>();
  const [sentCards, setSentCards] = useState<GroupCard[]>([]);
  const [receivedCards, setReceivedCards] = useState<GroupCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentRefreshing, setSentRefreshing] = useState(false);
  const [receivedRefreshing, setReceivedRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('received');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeScreen();
  }, [groupId]);

  const initializeScreen = async () => {
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        setCurrentUserId(userId);
        await loadGroupCards();
      }
    } catch (error) {
      console.error('Error initializing group cards screen:', error);
      Alert.alert('Error', 'Failed to load group cards');
    }
  };

  const loadGroupCards = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      console.log(`🎴 Loading cards for group: ${groupId}`);

      const response = await api.get(`/cards/group/${groupId}/summary`);

      if (response?.success && response.data) {
        const sent = response.data.sent?.cards || [];
        const received = response.data.received?.cards || [];
        
        console.log(`📊 Card processing:`, {
          sentCount: sent.length,
          receivedCount: received.length,
        });
        
        // Sort by sentAt date (most recent first)
        sent.sort((a: GroupCard, b: GroupCard) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        received.sort((a: GroupCard, b: GroupCard) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        
        console.log(`✅ Loaded ${sent.length} sent and ${received.length} received group cards`);
        setSentCards(sent);
        setReceivedCards(received);
      } else {
        console.log('📭 No cards found for this group');
        setSentCards([]);
        setReceivedCards([]);
      }
    } catch (error) {
      console.error('❌ Error loading group cards:', error);
      Alert.alert('Error', 'Failed to load group cards');
    } finally {
      setLoading(false);
    }
  };

  const onSentRefresh = async () => {
    setSentRefreshing(true);
    await loadGroupCards();
    setSentRefreshing(false);
  };

  const onReceivedRefresh = async () => {
    setReceivedRefreshing(true);
    await loadGroupCards();
    setReceivedRefreshing(false);
  };

  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    const offset = tab === 'sent' ? 0 : screenWidth;
    scrollViewRef.current?.scrollTo({ x: offset, animated: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleCardPress = (card: GroupCard) => {
    console.log(`🔍 Navigate to card details: ${card.cardId}`);
    // Navigate to view the card details using the correct route
    router.push(`/card/${card.cardId}?from=group&groupId=${groupId}` as any);
  };

  const renderCard = ({ item }: { item: GroupCard }) => {
    const isOwnCard = item.senderId === currentUserId;

    return (
      <TouchableOpacity
        style={styles.cardItem}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.7}
      >
        {item.cardPhoto ? (
          <Image 
            source={{ uri: item.cardPhoto }} 
            style={styles.cardLogo}
          />
        ) : (
          <View style={[styles.cardLogo, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.cardTitle?.charAt(0).toUpperCase() || 'C'}
            </Text>
          </View>
        )}

        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitleBold} numberOfLines={1} ellipsizeMode="tail">
              {item.cardTitle}
            </Text>
          </View>
          {item.message && (
            <Text style={styles.cardMeta} numberOfLines={1} ellipsizeMode="tail">
              "{item.message}"
            </Text>
          )}
        </View>

        <View style={styles.cardMetaRight}>
          <Text style={styles.cardDate}>{formatDate(item.sentAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (tabType: TabType) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="albums-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        {tabType === 'sent' ? 'No cards sent yet' : 'No cards received yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {tabType === 'sent' 
          ? 'Cards you share in this group will appear here'
          : 'Cards shared with you in this group will appear here'
        }
      </Text>
    </View>
  );

  const renderSentPage = () => {
    return (
      <View style={[styles.page, { width: screenWidth }]}>
        <FlatList
          data={sentCards}
          renderItem={renderCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => renderEmptyState('sent')}
          refreshControl={
            <RefreshControl
              refreshing={sentRefreshing}
              onRefresh={onSentRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderReceivedPage = () => {
    return (
      <View style={[styles.page, { width: screenWidth }]}>
        <FlatList
          data={receivedCards}
          renderItem={renderCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => renderEmptyState('received')}
          refreshControl={
            <RefreshControl
              refreshing={receivedRefreshing}
              onRefresh={onReceivedRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Cards</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading group cards...</Text>
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
        
        <Text style={styles.headerTitle}>Group Cards</Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => changeTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Cards Sent ({sentCards.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => changeTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Cards Received ({receivedCards.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swipable Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { 
            useNativeDriver: false,
            listener: (event: any) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const page = Math.round(offsetX / screenWidth);
              if (page === 0 && activeTab !== 'sent') {
                setActiveTab('sent');
              } else if (page === 1 && activeTab !== 'received') {
                setActiveTab('received');
              }
            }
          }
        )}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {renderSentPage()}
        {renderReceivedPage()}
      </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitleBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  cardMetaRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
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
  },
});