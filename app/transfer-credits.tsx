import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../lib/api';

const { width, height } = Dimensions.get('window');

// Responsive scaling functions
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive breakpoints
const isSmallDevice = width < 375;
const isLargeDevice = width >= 414;

// Professional Business Colors
const COLORS_THEME = {
  primary: '#1E3A5F',        // Deep Navy Blue
  primaryLight: '#2D5A87',   // Lighter Navy
  secondary: '#0A84FF',      // iOS Blue
  accent: '#34C759',         // Success Green
  warning: '#FF9500',        // Warning Orange
  error: '#FF3B30',          // Error Red
  background: '#F5F7FA',     // Light Gray Background
  surface: '#FFFFFF',        // White Surface
  surfaceAlt: '#F8FAFC',     // Alternative Surface
  text: '#1A1A2E',           // Dark Text
  textSecondary: '#6B7280',  // Gray Text
  textMuted: '#9CA3AF',      // Muted Text
  border: '#E5E7EB',         // Light Border
  borderFocus: '#0A84FF',    // Focus Border
  shadow: 'rgba(0, 0, 0, 0.08)',
  gradient1: '#1E3A5F',
  gradient2: '#2D5A87',
  gradient3: '#3B82F6',
};

interface User {
  _id: string;
  name: string;
  phone: string;
  profilePicture?: string;
}

export default function TransferCreditsScreen() {
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentContacts, setRecentContacts] = useState<User[]>([]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fetchBalance();
    fetchRecentContacts();
    
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoadingBalance(true);
      const response = await api.get('/credits/balance');
      if (response.success) {
        setBalance(response.credits || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchRecentContacts = async () => {
    try {
      const response = await api.get('/credits/recent-transfers');
      if (response.success && response.recentUsers) {
        setRecentContacts(response.recentUsers.slice(0, 5));
      }
    } catch (error) {
      // Silently fail - recent contacts are optional
      console.log('No recent contacts available');
    }
  };

  const searchUsers = async (query: string) => {
    const cleanedQuery = query.replace(/[^0-9]/g, '');
    
    if (cleanedQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await api.post('/credits/search-users', { 
        query: cleanedQuery,
        phonePrefix: cleanedQuery 
      });
      
      if (response.success) {
        setSearchResults(response.users || []);
      } else {
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 350);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSelectUser = (user: User) => {
    // Validate user data before navigating
    if (!user._id || !user.name || !user.phone) {
      console.error('Invalid user data:', user);
      return;
    }
    
    try {
      router.push({
        pathname: '/transfer-to-user',
        params: {
          userId: user._id,
          userName: user.name,
          userPhone: user.phone,
          userProfilePicture: user.profilePicture || '',
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 10) {
      return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
    }
    return phone;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Header with Balance */}
      <LinearGradient
        colors={[COLORS_THEME.gradient1, COLORS_THEME.gradient2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          {/* Top Navigation */}
          <View style={styles.topNav}>
            <TouchableOpacity 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }} 
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.screenTitle}>Transfer Credits</Text>
            
            <TouchableOpacity 
              onPress={() => {
                try {
                  router.push('/referral/credits-history');
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }} 
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Feather name="clock" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <Animated.View 
            style={[
              styles.balanceCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIconBg}>
                <MaterialCommunityIcons name="wallet-outline" size={24} color={COLORS_THEME.primary} />
              </View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>
            
            <View style={styles.balanceAmountRow}>
              {loadingBalance ? (
                <ActivityIndicator size="large" color={COLORS_THEME.primary} />
              ) : (
                <>
                  <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
                  <Text style={styles.balanceCurrency}>Credits</Text>
                </>
              )}
            </View>
            
            <View style={styles.balanceFooter}>
              <View style={styles.securityBadge}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS_THEME.accent} />
                <Text style={styles.securityText}>Secured Transfer</Text>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contentContainer}
      >
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Find Recipient</Text>
          <Text style={styles.sectionSubtitle}>Enter phone number to search</Text>
          
          <View style={[
            styles.searchBox,
            searchQuery.length > 0 && styles.searchBoxActive
          ]}>
            <View style={styles.searchIconContainer}>
              <Feather name="search" size={20} color={searchQuery ? COLORS_THEME.secondary : COLORS_THEME.textMuted} />
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search by phone number..."
              placeholderTextColor={COLORS_THEME.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            
            {isSearching && (
              <ActivityIndicator size="small" color={COLORS_THEME.secondary} style={styles.searchLoader} />
            )}
            
            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')} 
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={22} color={COLORS_THEME.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Search Results</Text>
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsBadgeText}>{searchResults.length}</Text>
              </View>
            </View>
            
            {searchResults.map((user, index) => (
              <Animated.View
                key={user._id}
                style={[
                  styles.userCard,
                  { opacity: fadeAnim }
                ]}
              >
                <TouchableOpacity
                  style={styles.userCardContent}
                  onPress={() => handleSelectUser(user)}
                  activeOpacity={0.7}
                >
                  <View style={styles.userAvatarSection}>
                    {user.profilePicture ? (
                      <Image source={{ uri: user.profilePicture }} style={styles.userAvatar} />
                    ) : (
                      <LinearGradient
                        colors={[COLORS_THEME.primaryLight, COLORS_THEME.primary]}
                        style={styles.userAvatarPlaceholder}
                      >
                        <Text style={styles.userInitials}>{getInitials(user.name)}</Text>
                      </LinearGradient>
                    )}
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  </View>
                  
                  <View style={styles.userDetails}>
                    <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                    <View style={styles.userPhoneRow}>
                      <Feather name="phone" size={13} color={COLORS_THEME.textSecondary} />
                      <Text style={styles.userPhone}>{formatPhoneNumber(user.phone)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.transferArrow}>
                    <LinearGradient
                      colors={[COLORS_THEME.secondary, COLORS_THEME.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.arrowBg}
                    >
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        {/* No Results */}
        {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="user-x" size={48} color={COLORS_THEME.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find any registered users{'\n'}with this phone number
            </Text>
          </View>
        )}

        {/* Recent Contacts */}
        {searchQuery.length === 0 && recentContacts.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Feather name="clock" size={18} color={COLORS_THEME.textSecondary} />
              <Text style={styles.recentTitle}>Recent Transfers</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentList}
            >
              {recentContacts.map((user) => (
                <TouchableOpacity
                  key={user._id}
                  style={styles.recentCard}
                  onPress={() => handleSelectUser(user)}
                  activeOpacity={0.7}
                >
                  {user.profilePicture ? (
                    <Image source={{ uri: user.profilePicture }} style={styles.recentAvatar} />
                  ) : (
                    <LinearGradient
                      colors={[COLORS_THEME.primaryLight, COLORS_THEME.primary]}
                      style={styles.recentAvatarPlaceholder}
                    >
                      <Text style={styles.recentInitials}>{getInitials(user.name)}</Text>
                    </LinearGradient>
                  )}
                  <Text style={styles.recentName} numberOfLines={1}>
                    {user.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Tips Section */}
        {searchQuery.length === 0 && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Quick Tips</Text>
            
            <View style={styles.tipCard}>
              <View style={styles.tipIconBg}>
                <Ionicons name="flash" size={18} color={COLORS_THEME.warning} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipHeading}>Instant Transfer</Text>
                <Text style={styles.tipText}>Credits are transferred instantly</Text>
              </View>
            </View>
            
            <View style={styles.tipCard}>
              <View style={[styles.tipIconBg, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS_THEME.accent} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipHeading}>100% Secure</Text>
                <Text style={styles.tipText}>All transfers are encrypted</Text>
              </View>
            </View>
            
            <View style={styles.tipCard}>
              <View style={[styles.tipIconBg, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="document-text" size={18} color={COLORS_THEME.secondary} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipHeading}>Transaction History</Text>
                <Text style={styles.tipText}>View all past transfers</Text>
              </View>
            </View>
          </View>
        )}


        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS_THEME.background,
  },
  headerGradient: {
    paddingBottom: 0,
  },
  safeHeader: {
    paddingBottom: verticalScale(20),
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(16),
  },
  navButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  screenTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: scale(20),
    borderRadius: moderateScale(20),
    padding: moderateScale(isSmallDevice ? 18 : 24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  balanceIconBg: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  balanceLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: COLORS_THEME.textSecondary,
    letterSpacing: 0.2,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: verticalScale(16),
  },
  balanceAmount: {
    fontSize: moderateScale(isSmallDevice ? 34 : 42),
    fontWeight: '800',
    color: COLORS_THEME.primary,
    letterSpacing: -1,
  },
  balanceCurrency: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS_THEME.textSecondary,
    marginLeft: scale(8),
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    gap: scale(6),
  },
  securityText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: COLORS_THEME.accent,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: verticalScale(24),
  },
  searchSection: {
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(isSmallDevice ? 20 : 22),
    fontWeight: '800',
    color: COLORS_THEME.text,
    marginBottom: verticalScale(6),
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: COLORS_THEME.textSecondary,
    marginBottom: verticalScale(16),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderWidth: 2,
    borderColor: COLORS_THEME.border,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchBoxActive: {
    borderColor: COLORS_THEME.secondary,
    shadowColor: COLORS_THEME.secondary,
    shadowOpacity: 0.15,
  },
  searchIconContainer: {
    marginRight: scale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: COLORS_THEME.text,
    paddingVertical: 0,
  },
  searchLoader: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  resultsSection: {
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  resultsTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: COLORS_THEME.text,
    flex: 1,
  },
  resultsBadge: {
    backgroundColor: COLORS_THEME.secondary,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  resultsBadgeText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(12),
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  userAvatarSection: {
    position: 'relative',
    marginRight: scale(14),
  },
  userAvatar: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    borderWidth: 2,
    borderColor: COLORS_THEME.border,
  },
  userAvatarPlaceholder: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitials: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    backgroundColor: COLORS_THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: COLORS_THEME.text,
    marginBottom: verticalScale(4),
  },
  userPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  userPhone: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: COLORS_THEME.textSecondary,
    letterSpacing: 0.5,
  },
  transferArrow: {
    marginLeft: scale(12),
  },
  arrowBg: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: verticalScale(50),
    paddingHorizontal: scale(40),
  },
  emptyIconContainer: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: COLORS_THEME.text,
    marginBottom: verticalScale(8),
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: COLORS_THEME.textSecondary,
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },
  recentSection: {
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(28),
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(16),
  },
  recentTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: COLORS_THEME.textSecondary,
  },
  recentList: {
    paddingRight: scale(20),
  },
  recentCard: {
    alignItems: 'center',
    marginRight: scale(isSmallDevice ? 16 : 20),
  },
  recentAvatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    marginBottom: verticalScale(8),
    borderWidth: 2,
    borderColor: COLORS_THEME.border,
  },
  recentAvatarPlaceholder: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(8),
  },
  recentInitials: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recentName: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: COLORS_THEME.text,
    maxWidth: scale(70),
    textAlign: 'center',
  },
  tipsSection: {
    paddingHorizontal: scale(16),
    marginTop: verticalScale(4),
  },
  tipsTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: COLORS_THEME.textSecondary,
    marginBottom: verticalScale(10),
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(10),
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  tipIconBg: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(14),
  },
  tipContent: {
    flex: 1,
  },
  tipHeading: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: COLORS_THEME.text,
  },
  tipText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: COLORS_THEME.textSecondary,
    marginTop: verticalScale(2),
  },
});
