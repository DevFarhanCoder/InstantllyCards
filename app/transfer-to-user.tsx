import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
  Image,
  Alert,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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

// Professional Business Colors - matching transfer-credits.tsx
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
  gradient1: '#1E3A5F',
  gradient2: '#2D5A87',
};

interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  date: string;
}

export default function TransferToUserScreen() {
  const params = useLocalSearchParams();
  
  // Validate required params
  const hasValidParams = params.userId && params.userName && params.userPhone;
  
  // Parse user data from params (with fallbacks to prevent crashes)
  const selectedUser = {
    _id: (params.userId as string) || '',
    name: (params.userName as string) || 'Unknown User',
    phone: (params.userPhone as string) || '',
    profilePicture: params.userProfilePicture as string | undefined,
  };

  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Redirect if missing required params
    if (!hasValidParams) {
      Alert.alert(
        'Error',
        'Missing user information. Please select a user first.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }
          }
        ]
      );
      return;
    }
    
    fetchBalance();
    
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
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
      Alert.alert('Error', 'Failed to load your balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    
    const amountNum = parseInt(numericValue);
    if (numericValue === '') {
      setAmountError('');
    } else if (amountNum < 10) {
      setAmountError('Minimum transfer amount is 10 credits');
    } else if (amountNum > balance) {
      setAmountError('Amount exceeds available balance');
    } else if (amountNum > 10000) {
      setAmountError('Maximum transfer is 10,000 credits');
    } else {
      setAmountError('');
    }
  };

  const handleQuickAmount = (value: number) => {
    if (value === -1) {
      handleAmountChange(balance.toString());
    } else {
      handleAmountChange(value.toString());
    }
  };

  const handleConfirmTransfer = () => {
    if (!amount || amountError) {
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = async () => {
    setShowConfirmModal(false);
    setIsTransferring(true);
    
    try {
      const response = await api.post('/credits/transfer', {
        toUserId: selectedUser._id,
        amount: parseInt(amount),
        note: note || ''
      });
      
      if (response.success) {
        setBalance(response.newBalance);
        setTransaction(response.transaction);
        
        setTimeout(() => {
          setIsTransferring(false);
          setShowSuccessModal(true);
        }, 300);
      } else {
        setIsTransferring(false);
        Alert.alert('Transfer Failed', response.message || 'Unable to complete transfer');
      }
    } catch (error: any) {
      setIsTransferring(false);
      console.error('Transfer error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to transfer credits';
      Alert.alert('Transfer Failed', errorMessage);
    }
  };

  const handleDone = () => {
    setShowSuccessModal(false);
    // Safe navigation back
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleViewHistory = () => {
    setShowSuccessModal(false);
    // Navigate to credits history
    try {
      router.push('/referral/credits-history');
    } catch (error) {
      console.error('Failed to navigate to history:', error);
      // Fallback to going back
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
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

  const isTransferDisabled = !amount || !!amountError || parseInt(amount) < 10;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS_THEME.gradient1, COLORS_THEME.gradient2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <View style={styles.topNav}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.screenTitle}>Send Credits</Text>
            
            <TouchableOpacity 
              onPress={() => router.push('/referral/credits-history')} 
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Feather name="clock" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.contentContainer}
        >
          {/* Recipient Card */}
          <Animated.View 
            style={[
              styles.recipientSection,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <View style={styles.recipientCard}>
              <View style={styles.recipientHeader}>
                <Feather name="send" size={16} color={COLORS_THEME.secondary} />
                <Text style={styles.recipientLabel}>Sending to</Text>
              </View>
              
              <View style={styles.recipientInfo}>
                <View style={styles.avatarSection}>
                  {selectedUser.profilePicture ? (
                    <Image source={{ uri: selectedUser.profilePicture }} style={styles.avatar} />
                  ) : (
                    <LinearGradient
                      colors={[COLORS_THEME.primaryLight, COLORS_THEME.primary]}
                      style={styles.avatarPlaceholder}
                    >
                      <Text style={styles.avatarInitials}>{getInitials(selectedUser.name)}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                </View>
                
                <View style={styles.recipientDetails}>
                  <Text style={styles.recipientName} numberOfLines={1}>{selectedUser.name}</Text>
                  <View style={styles.phoneRow}>
                    <Feather name="phone" size={14} color={COLORS_THEME.textSecondary} />
                    <Text style={styles.recipientPhone}>{formatPhoneNumber(selectedUser.phone)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Amount Section */}
          <Animated.View 
            style={[
              styles.amountSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.amountCard}>
              {/* Balance Row */}
              <View style={styles.balanceRow}>
                <View style={styles.balanceLeft}>
                  <MaterialCommunityIcons name="wallet-outline" size={20} color={COLORS_THEME.primary} />
                  <Text style={styles.balanceLabel}>Available</Text>
                </View>
                {loadingBalance ? (
                  <ActivityIndicator size="small" color={COLORS_THEME.primary} />
                ) : (
                  <Text style={styles.balanceValue}>{balance.toLocaleString()} credits</Text>
                )}
              </View>

              {/* Amount Input */}
              <View style={styles.amountInputContainer}>
                <Text style={styles.amountPrefix}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor={COLORS_THEME.textMuted}
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <Text style={styles.amountSuffix}>credits</Text>
              </View>

              {/* Quick Amounts */}
              <View style={styles.quickAmounts}>
                {[100, 250, 500, 1000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.quickAmountBtn,
                      amount === val.toString() && styles.quickAmountBtnActive
                    ]}
                    onPress={() => handleQuickAmount(val)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.quickAmountText,
                      amount === val.toString() && styles.quickAmountTextActive
                    ]}>
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.quickAmountBtn, styles.quickAmountBtnAll]}
                  onPress={() => handleQuickAmount(-1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickAmountTextAll}>MAX</Text>
                </TouchableOpacity>
              </View>

              {/* Limits Info */}
              <View style={styles.limitsRow}>
                <Text style={styles.limitsText}>
                  Min: 10 • Max: {Math.min(10000, balance).toLocaleString()}
                </Text>
              </View>

              {/* Error */}
              {amountError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={COLORS_THEME.error} />
                  <Text style={styles.errorText}>{amountError}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* Note Section */}
          <Animated.View 
            style={[
              styles.noteSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Feather name="message-square" size={16} color={COLORS_THEME.textSecondary} />
                <Text style={styles.noteLabel}>Add a note (optional)</Text>
              </View>
              <TextInput
                style={styles.noteInput}
                placeholder="What's this transfer for?"
                placeholderTextColor={COLORS_THEME.textMuted}
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={100}
              />
              <Text style={styles.noteCharCount}>{note.length}/100</Text>
            </View>
          </Animated.View>

          {/* Summary */}
          {amount && !amountError && parseInt(amount) >= 10 && (
            <Animated.View 
              style={[
                styles.summarySection,
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Transfer Amount</Text>
                  <Text style={styles.summaryValue}>{parseInt(amount).toLocaleString()} credits</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelTotal}>Balance After Transfer</Text>
                  <Text style={styles.summaryValueTotal}>
                    {(balance - parseInt(amount)).toLocaleString()} credits
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.sendButton, isTransferDisabled && styles.sendButtonDisabled]}
          onPress={handleConfirmTransfer}
          disabled={isTransferDisabled}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isTransferDisabled ? ['#CBD5E1', '#94A3B8'] : [COLORS_THEME.secondary, COLORS_THEME.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendButtonGradient}
          >
            <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
            <Text style={styles.sendButtonText}>
              {amount && parseInt(amount) >= 10 
                ? `Send ${parseInt(amount).toLocaleString()} Credits`
                : 'Enter Amount'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBg}>
                <Feather name="send" size={28} color={COLORS_THEME.primary} />
              </View>
              <Text style={styles.modalTitle}>Confirm Transfer</Text>
              <Text style={styles.modalSubtitle}>Please review the details below</Text>
            </View>
            
            <View style={styles.confirmCard}>
              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>Recipient</Text>
                <Text style={styles.confirmValue}>{selectedUser.name}</Text>
              </View>
              
              <View style={styles.confirmDivider} />
              
              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>Amount</Text>
                <Text style={styles.confirmValueHighlight}>
                  {amount ? parseInt(amount).toLocaleString() : '0'} credits
                </Text>
              </View>
              
              {note ? (
                <>
                  <View style={styles.confirmDivider} />
                  <View style={styles.confirmItem}>
                    <Text style={styles.confirmLabel}>Note</Text>
                    <Text style={styles.confirmValue} numberOfLines={2}>{note}</Text>
                  </View>
                </>
              ) : null}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleFinalConfirm}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS_THEME.secondary, COLORS_THEME.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmBtnGradient}
                >
                  <Text style={styles.confirmBtnText}>Confirm & Send</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleDone}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={['#34C759', '#30D158']}
                style={styles.successIconBg}
              >
                <Ionicons name="checkmark" size={48} color="#FFFFFF" />
              </LinearGradient>
            </View>
            
            <Text style={styles.successTitle}>Transfer Successful!</Text>
            <Text style={styles.successAmount}>
              {transaction?.amount.toLocaleString()} credits sent
            </Text>
            <Text style={styles.successRecipient}>to {selectedUser.name}</Text>
            
            <View style={styles.transactionCard}>
              <View style={styles.transactionItem}>
                <Text style={styles.transactionLabel}>Transaction ID</Text>
                <Text style={styles.transactionValue}>#{transaction?.transactionId}</Text>
              </View>
              <View style={styles.transactionItem}>
                <Text style={styles.transactionLabel}>Date</Text>
                <Text style={styles.transactionValue}>{transaction?.date}</Text>
              </View>
              <View style={styles.transactionItem}>
                <Text style={styles.transactionLabel}>New Balance</Text>
                <Text style={styles.transactionValueBold}>{balance.toLocaleString()} credits</Text>
              </View>
            </View>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.historyBtn}
                onPress={handleViewHistory}
                activeOpacity={0.7}
              >
                <Feather name="clock" size={18} color={COLORS_THEME.primary} />
                <Text style={styles.historyBtnText}>View History</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={handleDone}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS_THEME.secondary, COLORS_THEME.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.doneBtnGradient}
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      <Modal
        visible={isTransferring}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.loadingModal}>
            <ActivityIndicator size="large" color={COLORS_THEME.primary} />
            <Text style={styles.loadingText}>Processing transfer...</Text>
            <Text style={styles.loadingSubtext}>Please wait</Text>
          </View>
        </View>
      </Modal>
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
    paddingBottom: verticalScale(12),
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: verticalScale(20),
    paddingHorizontal: scale(20),
  },
  recipientSection: {
    marginBottom: verticalScale(20),
  },
  recipientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(isSmallDevice ? 16 : 20),
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(16),
  },
  recipientLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: COLORS_THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
    marginRight: scale(16),
  },
  avatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    borderWidth: 3,
    borderColor: COLORS_THEME.border,
  },
  avatarPlaceholder: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: COLORS_THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: COLORS_THEME.text,
    marginBottom: verticalScale(6),
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  recipientPhone: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: COLORS_THEME.textSecondary,
    letterSpacing: 0.5,
  },
  amountSection: {
    marginBottom: verticalScale(20),
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(isSmallDevice ? 18 : 24),
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: verticalScale(20),
    borderBottomWidth: 1,
    borderBottomColor: COLORS_THEME.border,
    marginBottom: verticalScale(24),
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  balanceLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: COLORS_THEME.textSecondary,
  },
  balanceValue: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: COLORS_THEME.primary,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(24),
  },
  amountPrefix: {
    fontSize: moderateScale(isSmallDevice ? 28 : 36),
    fontWeight: '300',
    color: COLORS_THEME.textMuted,
    marginRight: scale(4),
  },
  amountInput: {
    fontSize: moderateScale(isSmallDevice ? 38 : 48),
    fontWeight: '800',
    color: COLORS_THEME.text,
    textAlign: 'center',
    minWidth: scale(80),
    paddingVertical: 0,
  },
  amountSuffix: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: COLORS_THEME.textSecondary,
    marginLeft: scale(8),
    alignSelf: 'flex-end',
    marginBottom: verticalScale(8),
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(isSmallDevice ? 6 : 8),
    marginBottom: verticalScale(16),
  },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    backgroundColor: COLORS_THEME.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
  },
  quickAmountBtnActive: {
    backgroundColor: '#E0F2FE',
    borderColor: COLORS_THEME.secondary,
  },
  quickAmountText: {
    fontSize: moderateScale(isSmallDevice ? 12 : 14),
    fontWeight: '700',
    color: COLORS_THEME.text,
  },
  quickAmountTextActive: {
    color: COLORS_THEME.secondary,
  },
  quickAmountBtnAll: {
    backgroundColor: COLORS_THEME.primary,
    borderColor: COLORS_THEME.primary,
  },
  quickAmountTextAll: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  limitsRow: {
    alignItems: 'center',
  },
  limitsText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: COLORS_THEME.textMuted,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginTop: verticalScale(16),
    padding: moderateScale(12),
    backgroundColor: '#FEF2F2',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: COLORS_THEME.error,
    flex: 1,
  },
  noteSection: {
    marginBottom: verticalScale(20),
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(12),
  },
  noteLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: COLORS_THEME.textSecondary,
  },
  noteInput: {
    fontSize: moderateScale(15),
    fontWeight: '500',
    color: COLORS_THEME.text,
    minHeight: verticalScale(60),
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  noteCharCount: {
    fontSize: moderateScale(11),
    fontWeight: '500',
    color: COLORS_THEME.textMuted,
    textAlign: 'right',
    marginTop: verticalScale(8),
  },
  summarySection: {
    marginBottom: verticalScale(20),
  },
  summaryCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  summaryLabel: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: COLORS_THEME.textSecondary,
  },
  summaryValue: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: COLORS_THEME.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#BAE6FD',
    marginVertical: verticalScale(8),
  },
  summaryLabelTotal: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: COLORS_THEME.text,
  },
  summaryValueTotal: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: COLORS_THEME.secondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(32),
    borderTopWidth: 1,
    borderTopColor: COLORS_THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  sendButton: {
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    shadowColor: COLORS_THEME.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  sendButtonDisabled: {
    shadowOpacity: 0.05,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(18),
    gap: scale(10),
  },
  sendButtonText: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(isSmallDevice ? 22 : 28),
    width: '100%',
    maxWidth: scale(400),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  modalIconBg: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: COLORS_THEME.text,
    marginBottom: verticalScale(4),
  },
  modalSubtitle: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: COLORS_THEME.textSecondary,
  },
  confirmCard: {
    backgroundColor: COLORS_THEME.surfaceAlt,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(24),
  },
  confirmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
  },
  confirmLabel: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: COLORS_THEME.textSecondary,
  },
  confirmValue: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: COLORS_THEME.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  confirmValueHighlight: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: COLORS_THEME.secondary,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: COLORS_THEME.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: scale(12),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(14),
    backgroundColor: COLORS_THEME.surfaceAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
  },
  cancelBtnText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: COLORS_THEME.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: moderateScale(14),
    overflow: 'hidden',
  },
  confirmBtnGradient: {
    paddingVertical: verticalScale(16),
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Success Modal
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(isSmallDevice ? 24 : 32),
    width: '100%',
    maxWidth: scale(400),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  successIconContainer: {
    marginBottom: verticalScale(24),
  },
  successIconBg: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: moderateScale(isSmallDevice ? 22 : 26),
    fontWeight: '800',
    color: COLORS_THEME.text,
    marginBottom: verticalScale(8),
  },
  successAmount: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: COLORS_THEME.text,
  },
  successRecipient: {
    fontSize: moderateScale(15),
    fontWeight: '500',
    color: COLORS_THEME.textSecondary,
    marginBottom: verticalScale(24),
  },
  transactionCard: {
    width: '100%',
    backgroundColor: COLORS_THEME.surfaceAlt,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(28),
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
  },
  transactionLabel: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: COLORS_THEME.textSecondary,
  },
  transactionValue: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: COLORS_THEME.text,
  },
  transactionValueBold: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: COLORS_THEME.primary,
  },
  successActions: {
    width: '100%',
    flexDirection: 'row',
    gap: scale(12),
  },
  historyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(14),
    backgroundColor: '#F0F7FF',
  },
  historyBtnText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: COLORS_THEME.primary,
  },
  doneBtn: {
    flex: 1,
    borderRadius: moderateScale(14),
    overflow: 'hidden',
  },
  doneBtnGradient: {
    paddingVertical: verticalScale(16),
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Loading Modal
  loadingModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(40),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  loadingText: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: COLORS_THEME.text,
    marginTop: verticalScale(20),
  },
  loadingSubtext: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: COLORS_THEME.textSecondary,
    marginTop: verticalScale(6),
  },
});
