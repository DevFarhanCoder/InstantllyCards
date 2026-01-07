import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../lib/theme';
import api from '../lib/api';

const { width} = Dimensions.get('window');

// Custom colors not in theme
const PRIMARY_COLOR = '#7C3AED';
const SECONDARY_COLOR = '#A78BFA';
const ACCENT_COLOR = '#EC4899';
const TEXT_SECONDARY = '#4B5563';
const TEXT_LIGHT = '#9CA3AF';
const ERROR_COLOR = '#EF4444';
const SUCCESS_COLOR = '#10B981';

interface User {
  _id: string;
  name: string;
  phone: string;
  profilePicture?: string;
}

interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  date: string;
}

export default function TransferCreditsScreen() {
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [amountError, setAmountError] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Fetch user's balance on mount
  useEffect(() => {
    fetchBalance();
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

  // Search users function with API call
  const searchUsers = async (query: string) => {
    // Remove spaces and special characters, keep only digits
    const cleanedQuery = query.replace(/[^0-9]/g, '');
    
    console.log('\n🔍 ========== SEARCH START ==========');
    console.log('🔍 [FRONTEND] Original query:', query);
    console.log('🔍 [FRONTEND] Cleaned query:', cleanedQuery);
    
    if (cleanedQuery.length < 2) {
      console.log('⚠️ [FRONTEND] Query too short (<2 digits)');
      console.log('🔍 ========== SEARCH END ==========\n');
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      console.log('📡 [FRONTEND] Sending POST to /credits/search-users');
      console.log('📡 [FRONTEND] Request body:', { query: cleanedQuery, phonePrefix: cleanedQuery });
      
      // Send both 'query' (new) and 'phonePrefix' (old) for backward compatibility
      const response = await api.post('/credits/search-users', { 
        query: cleanedQuery,
        phonePrefix: cleanedQuery 
      });
      
      console.log('📥 [FRONTEND] Full Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        const userCount = response.users?.length || 0;
        console.log('✅ [FRONTEND] Success! Found', userCount, 'users');
        if (userCount > 0) {
          console.log('👥 [FRONTEND] User details:');
          response.users.forEach((u: any, i: number) => {
            console.log(`   ${i + 1}. ${u.name} - ${u.phone}`);
          });
        } else {
          console.log('📭 [FRONTEND] No users matched the search');
        }
        setSearchResults(response.users || []);
      } else {
        console.log('❌ [FRONTEND] Search failed:', response.message);
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('❌❌❌ [FRONTEND] Search error caught!');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      Alert.alert(
        'Search Error',
        `Failed to search users: ${error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      console.log('🔍 ========== SEARCH END ==========\n');
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 400); // Faster response

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setAmount('');
    setNote('');
    setAmountError('');
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    
    // Validate amount
    const amountNum = parseInt(numericValue);
    if (numericValue === '') {
      setAmountError('');
    } else if (amountNum < 10) {
      setAmountError('Minimum amount is 10 credits');
    } else if (amountNum > balance) {
      setAmountError('Insufficient balance');
    } else if (amountNum > 10000) {
      setAmountError('Maximum amount is 10,000 credits');
    } else {
      setAmountError('');
    }
  };

  const handleQuickAmount = (value: number) => {
    if (value === -1) {
      // "All" button
      handleAmountChange(balance.toString());
    } else {
      handleAmountChange(value.toString());
    }
  };

  const handleConfirmTransfer = () => {
    if (!selectedUser || !amount || amountError) {
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = async () => {
    setShowConfirmModal(false);
    setIsTransferring(true);
    
    try {
      const response = await api.post('/credits/transfer', {
        toUserId: selectedUser?._id,
        amount: parseInt(amount),
        note: note || ''
      });
      
      if (response.success) {
        // Update balance
        setBalance(response.newBalance);
        
        // Set transaction data from response
        setTransaction(response.transaction);
        
        // Show success modal
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
    // Reset form
    setSelectedUser(null);
    setAmount('');
    setNote('');
    setAmountError('');
    setTransaction(null);
  };

  const handleViewHistory = () => {
    setShowSuccessModal(false);
    // Navigate to transaction history
    router.push('/referral/credits-history');
  };

  const isTransferDisabled = !selectedUser || !amount || !!amountError || parseInt(amount) < 10;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#9333EA', '#7C3AED', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transfer Credits</Text>
          <TouchableOpacity onPress={() => router.push('/referral/credits-history')} style={styles.historyIconButton}>
            <Ionicons name="time-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Balance Card - Always visible at top */}
        <View style={styles.balanceCardWrapper}>
          <LinearGradient
            colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceContent}>
              <View style={styles.balanceIconContainer}>
                <Ionicons name="wallet" size={32} color="rgba(255,255,255,0.9)" />
              </View>
              <View style={styles.balanceTextContainer}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                {loadingBalance ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginTop: 8 }} />
                ) : (
                  <View style={styles.balanceAmountRow}>
                    <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
                    <Text style={styles.balanceUnit}>credits</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Search Section - Now First */}
        {!selectedUser && (
          <View style={styles.searchSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="search" size={22} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.searchSectionTitle}>Find Recipient</Text>
                <Text style={styles.searchSectionSubtitle}>Search by phone number</Text>
              </View>
            </View>
            <View style={[styles.searchContainer, searchQuery.length > 0 && styles.searchContainerActive]}>
              <View style={styles.phoneIconContainer}>
                <Ionicons name="call" size={20} color="#7C3AED" />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter phone number (e.g., 01712345678)"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
              {isSearching && (
                <ActivityIndicator size="small" color={PRIMARY_COLOR} style={styles.searchLoader} />
              )}
              {searchQuery.length > 0 && !isSearching && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                  <Ionicons name="close-circle" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.resultsContainer}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsLabel}>Search Results</Text>
                  <View style={styles.resultsCount}>
                    <Text style={styles.resultsCountText}>{searchResults.length}</Text>
                  </View>
                </View>
                {searchResults.map((user) => (
                  <TouchableOpacity
                    key={user._id}
                    style={styles.userResultCard}
                    onPress={() => handleSelectUser(user)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.userAvatarContainer}>
                      <View style={styles.userAvatar}>
                        {user.profilePicture ? (
                          <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
                        ) : (
                          <Ionicons name="person" size={28} color="#7C3AED" />
                        )}
                      </View>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{user.name}</Text>
                      <View style={styles.phoneRow}>
                        <Ionicons name="call" size={14} color="#6B7280" />
                        <Text style={styles.userPhone}>{user.phone}</Text>
                      </View>
                    </View>
                    <View style={styles.selectButton}>
                      <Text style={styles.selectButtonText}>Select</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <View style={styles.noResults}>
                <View style={styles.noResultsIconContainer}>
                  <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                </View>
                <Text style={styles.noResultsText}>No users found</Text>
                <Text style={styles.noResultsSubtext}>Make sure the phone number is registered in the system</Text>
              </View>
            )}
          </View>
        )}



        {/* Selected Recipient */}
        {selectedUser && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="send" size={22} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Recipient</Text>
                <Text style={styles.sectionSubtitle}>Sending credits to</Text>
              </View>
            </View>
            <View style={styles.selectedUserCard}>
              <View style={styles.userAvatarContainer}>
                <View style={styles.userAvatarLarge}>
                  {selectedUser.profilePicture ? (
                    <Image source={{ uri: selectedUser.profilePicture }} style={styles.avatarImageLarge} />
                  ) : (
                    <Ionicons name="person" size={32} color="#7C3AED" />
                  )}
                </View>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userNameSelected}>{selectedUser.name}</Text>
                <View style={styles.phoneRow}>
                  <Ionicons name="call" size={14} color="#6B7280" />
                  <Text style={styles.userPhone}>{selectedUser.phone}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClearSelection} style={styles.clearButton}>
                <Ionicons name="close-circle" size={28} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Amount Input */}
        {selectedUser && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="cash" size={22} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Amount</Text>
                <Text style={styles.sectionSubtitle}>How many credits to send</Text>
              </View>
            </View>
            <View style={[styles.amountContainer, amount && styles.amountContainerFilled]}>
              <View style={styles.amountInputWrapper}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor="#CBD5E1"
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <Text style={styles.amountCurrency}>credits</Text>
              </View>
            </View>
            
            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountContainer}>
              <TouchableOpacity
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(100)}
              >
                <Text style={styles.quickAmountText}>100</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(500)}
              >
                <Text style={styles.quickAmountText}>500</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(1000)}
              >
                <Text style={styles.quickAmountText}>1000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAmountButton, styles.allButton]}
                onPress={() => handleQuickAmount(-1)}
              >
                <Text style={[styles.quickAmountText, styles.allButtonText]}>All</Text>
              </TouchableOpacity>
            </View>

            {/* Min/Max Info */}
            <View style={styles.amountInfoContainer}>
              <Text style={styles.amountInfoText}>
                Min: 10 • Max: {Math.min(10000, balance).toLocaleString()}
              </Text>
            </View>

            {/* Error Message */}
            {amountError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={ERROR_COLOR} />
                <Text style={styles.errorText}>{amountError}</Text>
              </View>
            )}

            {/* Optional Note */}
            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>Note (Optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a message..."
                placeholderTextColor="#9CA3AF"
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={100}
              />
            </View>
          </View>
        )}

        {/* Transfer Button */}
        {selectedUser && (
          <TouchableOpacity
            style={[styles.transferButton, isTransferDisabled && styles.transferButtonDisabled]}
            onPress={handleConfirmTransfer}
            disabled={isTransferDisabled}
          >
            <LinearGradient
              colors={isTransferDisabled ? ['#ccc', '#999'] : [PRIMARY_COLOR, SECONDARY_COLOR]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.transferButtonGradient}
            >
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.transferButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔄 Confirm Transfer</Text>
            
            <View style={styles.confirmDetails}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>From:</Text>
                <Text style={styles.confirmValue}>You ({balance.toLocaleString()} credits)</Text>
              </View>
              
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>To:</Text>
                <Text style={styles.confirmValue}>{selectedUser?.name}</Text>
              </View>
              
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Amount:</Text>
                <Text style={[styles.confirmValue, styles.amountHighlight]}>
                  {amount ? parseInt(amount).toLocaleString() : '0'} credits
                </Text>
              </View>
              
              {note && (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Note:</Text>
                  <Text style={styles.confirmValue}>{note}</Text>
                </View>
              )}

              <View style={styles.feeDivider} />
              
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabelBold}>You will pay:</Text>
                <Text style={[styles.confirmValueBold, styles.amountHighlight]}>
                  {amount ? parseInt(amount).toLocaleString() : '0'} credits
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleFinalConfirm}
              >
                <LinearGradient
                  colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>Confirm Transfer</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={SUCCESS_COLOR} />
            </View>
            
            <Text style={styles.successTitle}>✅ Success!</Text>
            
            <Text style={styles.successMessage}>
              Transferred {transaction?.amount.toLocaleString()} credits
            </Text>
            <Text style={styles.successRecipient}>
              to {selectedUser?.name}
            </Text>
            
            <View style={styles.transactionDetails}>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Transaction ID:</Text>
                <Text style={styles.transactionValue}>#{transaction?.transactionId}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Date:</Text>
                <Text style={styles.transactionValue}>{transaction?.date}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>New Balance:</Text>
                <Text style={styles.transactionValue}>{balance.toLocaleString()} credits</Text>
              </View>
            </View>

            <View style={styles.successButtons}>
              <TouchableOpacity
                style={[styles.successButton, styles.historyButton]}
                onPress={handleViewHistory}
              >
                <Ionicons name="time-outline" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.historyButtonText}>View History</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.successButton, styles.doneButton]}
                onPress={handleDone}
              >
                <LinearGradient
                  colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.doneButtonGradient}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal for Transfer */}
      <Modal
        visible={isTransferring}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingVertical: 40 }]}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={[styles.modalTitle, { marginTop: 20, marginBottom: 0 }]}>
              Processing Transfer...
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  headerGradient: {
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  historyIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  balanceCardWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  balanceCard: {
    borderRadius: 32,
    padding: 0,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 25,
    elevation: 18,
    overflow: 'hidden',
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 28,
    gap: 20,
  },
  balanceIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceTextContainer: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  balanceUnit: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  searchSectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  searchContainerActive: {
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.2,
    backgroundColor: '#FEFEFE',
    transform: [{ scale: 1.01 }],
  },
  phoneIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  searchLoader: {
    marginLeft: 12,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  resultsLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  resultsCount: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  userResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#F3E8FF',
  },
  userAvatarContainer: {
    marginRight: 14,
  },
  userAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#DDD6FE',
  },
  userAvatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#DDD6FE',
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  avatarImageLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
    flexShrink: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  userNameSelected: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.3,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    flexShrink: 0,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  noResultsIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  noResultsExample: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noResultsExampleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  noResultsExampleText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    marginVertical: 4,
    fontFamily: 'monospace',
  },
  selectedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#DDD6FE',
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
  },
  amountContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#F3E8FF',
  },
  amountContainerFilled: {
    borderColor: '#A78BFA',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.25,
    backgroundColor: '#FEFEFE',
  },
  amountInputWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    fontSize: 56,
    fontWeight: '900',
    color: '#7C3AED',
    textAlign: 'center',
    minWidth: 140,
    letterSpacing: -1.5,
    paddingVertical: 10,
  },
  amountCurrency: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  quickAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: PRIMARY_COLOR,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  quickAmountText: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY_COLOR,
    letterSpacing: 0.5,
  },
  allButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  allButtonText: {
    color: '#fff',
  },
  amountInfoContainer: {
    marginTop: 16,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  amountInfoText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    fontSize: 14,
    color: ERROR_COLOR,
    fontWeight: '600',
    flex: 1,
  },
  noteContainer: {
    marginTop: 20,
  },
  noteLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontWeight: '500',
  },
  transferButton: {
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  transferButtonDisabled: {
    opacity: 0.5,
  },
  transferButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  transferButtonText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  confirmDetails: {
    marginBottom: 28,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  confirmLabelBold: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.2,
  },
  confirmValueBold: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
    letterSpacing: 0.2,
  },
  amountHighlight: {
    color: '#7C3AED',
  },
  feeDivider: {
    height: 2,
    backgroundColor: '#E8E8E8',
    marginVertical: 18,
    borderRadius: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 14,
  },
  modalButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.3,
  },
  confirmButton: {
    flex: 1,
  },
  confirmButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  successMessage: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  successRecipient: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '600',
  },
  transactionDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 22,
    marginBottom: 32,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  transactionValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  successButtons: {
    flexDirection: 'row',
    gap: 14,
  },
  successButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  historyButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  historyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.3,
  },
  doneButton: {
    flex: 1,
  },
  doneButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
