import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';
import { formatIndianNumber } from '@/utils/formatNumber';
import { socketService } from '@/lib/socket';
import FooterCarousel from '@/components/FooterCarousel';
import CustomTabBar from '@/components/CustomTabBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCredits } from '@/contexts/CreditsContext';

const { width } = Dimensions.get('window');

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  note?: string;
  createdAt: string;
  balanceAfter?: number;
}

interface CreditBreakdown {
  quizCredits: number;
  referralCredits: number;
  signupBonus: number;
  selfDownloadCredits: number;
  transferReceived: number;
  transferSent: number;
  adDeductions: number;
}

export default function CreditsHistoryPage() {
  // Use global credits context
  const { credits: totalCredits, refreshCredits } = useCredits();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [breakdown, setBreakdown] = useState<CreditBreakdown>({
    quizCredits: 0,
    referralCredits: 0,
    signupBonus: 0,
    selfDownloadCredits: 0,
    transferReceived: 0,
    transferSent: 0,
    adDeductions: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  useEffect(() => {
    loadCreditsHistory();
  }, []);

  const loadCreditsHistory = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }

      // Fetch credits history (includes balance, breakdown, and transactions)
      const historyResponse = await api.get('/credits/history?limit=100');

      if (historyResponse.success) {
        // Refresh global credits
        await refreshCredits();
        setBreakdown(historyResponse.breakdown || {
          quizCredits: 0,
          referralCredits: 0,
          signupBonus: 0,
          selfDownloadCredits: 0,
          transferReceived: 0,
          transferSent: 0,
          adDeductions: 0,
        });
        
        // DEBUG: Log transaction amounts
        console.log('📊 Transaction data received:', historyResponse.transactions?.slice(0, 3).map((t: any) => ({
          type: t.type,
          description: t.description,
          amount: t.amount
        })));
        
        setTransactions(historyResponse.transactions || []);
      } else {
        console.error('Failed to load credits history:', historyResponse.message);
        Alert.alert(
          'Unable to Load',
          historyResponse.message || 'Failed to load credits history. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error loading credits history:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Network error occurred';
      Alert.alert(
        'Connection Error',
        `Could not load your credits history. ${errorMessage}`,
        [
          { text: 'Retry', onPress: () => loadCreditsHistory(isRefreshing) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCreditsHistory(true);
  };

  const getTransactionIcon = (type: string): string => {
    const iconMap: { [key: string]: string } = {
      'quiz_bonus': 'school',
      'referral_bonus': 'people',
      'signup_bonus': 'gift',
      'self_download_bonus': 'download',
      'transfer_received': 'arrow-down-circle',
      'transfer_sent': 'arrow-up-circle',
      'ad_deduction': 'megaphone',
      'admin_adjustment': 'settings',
    };
    return iconMap[type] || 'wallet';
  };

  const getTransactionColor = (type: string, amount?: number): string => {
    // If amount is negative, always show red
    if (amount !== undefined && amount < 0) {
      return '#EF4444';
    }
    const deductionTypes = ['transfer_sent', 'ad_deduction'];
    return deductionTypes.includes(type) ? '#EF4444' : '#10B981';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const BreakdownCard = ({ 
    title, 
    amount, 
    icon, 
    color
  }: { 
    title: string; 
    amount: number; 
    icon: string; 
    color: string;
  }) => (
    <View style={[styles.breakdownCard, { borderLeftColor: color }]}>
      <View style={styles.breakdownHeader}>
        <View style={[styles.breakdownIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.breakdownInfo}>
          <Text style={styles.breakdownTitle}>{title}</Text>
          <Text style={[styles.breakdownAmount, { color }]}>
            {amount > 0 ? '+' : ''}{formatIndianNumber(amount)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Credits History</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading credits history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credits History</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
      >
        {/* Total Credits Banner */}
        <View style={styles.totalCreditsBanner}>
          <LinearGradient
            colors={['#D1FAE5', '#A7F3D0']}
            style={styles.bannerGradient}
          >
            <View style={styles.totalCreditsContent}>
              <View style={styles.creditsLabelRow}>
                <Ionicons name="sparkles" size={16} color="#047857" />
                <Text style={styles.totalCreditsLabel}>Your Total Balance</Text>
              </View>
              <View style={styles.creditsAmountRow}>
                <Text style={styles.totalCreditsAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                  ₹{formatIndianNumber(totalCredits)}
                </Text>
              </View>
              <Text style={styles.creditsUnit}>Credits Available</Text>
              
              {/* Credit Expiry Info */}
              <View style={styles.expiryInfoContainer}>
                <Ionicons name="time-outline" size={14} color="#F97316" />
                <Text style={styles.expiryInfoText}>
                  Expires: <Text style={styles.expiryInfoDate}>31 March 2026</Text> • {(() => {
                    const today = new Date();
                    const expiryDate = new Date('2026-03-31');
                    const diffTime = expiryDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays > 0 ? diffDays : 0;
                  })()} days left
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Transfer Credits Button */}
        <View style={styles.transferCreditsSection}>
          <TouchableOpacity 
            style={styles.transferCreditsButton}
            onPress={() => router.push('/transfer-credits')}
            activeOpacity={0.8}
          >
            <View style={styles.transferButtonGradient}>
              <View style={styles.transferIconContainer}>
                <Ionicons name="swap-horizontal" size={24} color="#10B981" />
              </View>
              <View style={styles.transferButtonContent}>
                <Text style={styles.transferButtonTitle}>Transfer Credits</Text>
                <Text style={styles.transferButtonSubtitle}>Send credits to other users instantly</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#10B981" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Breakdown Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Credits Breakdown</Text>
            <View style={styles.breakdownBadge}>
              <Ionicons name="pie-chart" size={16} color="#10B981" />
              <Text style={styles.breakdownBadgeText}>Overview</Text>
            </View>
          </View>
          
          <View style={styles.breakdownGrid}>
            {/* Earnings Section */}
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownSectionTitle}>Earnings</Text>
              <View style={styles.breakdownCards}>
                <BreakdownCard
                  title="Transfer Received"
                  amount={breakdown.transferReceived}
                  icon="arrow-down-circle"
                  color="#10B981"
                />
              </View>
            </View>
            
            {/* Spending Section */}
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownSectionTitle}>Spending</Text>
              <View style={styles.spendingCardsHorizontal}>
                <BreakdownCard
                  title="Transfer Sent"
                  amount={-breakdown.transferSent}
                  icon="arrow-up-circle"
                  color="#EF4444"
                />
                <BreakdownCard
                  title="Ad Deductions"
                  amount={-breakdown.adDeductions}
                  icon="megaphone"
                  color="#DC2626"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {transactions.length > 5 && (
              <TouchableOpacity 
                onPress={() => setShowAllTransactions(!showAllTransactions)}
                activeOpacity={0.7}
                style={styles.viewMoreHeaderButton}
              >
                <Text style={styles.viewMoreHeaderText}>
                  {showAllTransactions ? "Show Less" : "View More"}
                </Text>
                <Ionicons 
                  name={showAllTransactions ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color="#10B981" 
                />
              </TouchableOpacity>
            )}
          </View>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your credit transactions will appear here</Text>
            </View>
          ) : (
            <View style={styles.transactionContainer}>
              {(showAllTransactions ? transactions : transactions.slice(0, 5))
                .filter(txn => txn.type !== 'signup_bonus')
                .map((txn, index) => {
                const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, 5);
                const isLastItem = index === displayedTransactions.length - 1;
                return (
                  <View key={txn._id} style={[styles.transactionCard, isLastItem && styles.lastTransactionCard]}>
                    <View style={[
                      styles.transactionIconContainer,
                      { backgroundColor: getTransactionColor(txn.type, txn.amount) + '15' }
                    ]}>
                      <Ionicons 
                        name={getTransactionIcon(txn.type) as any} 
                        size={22} 
                        color={getTransactionColor(txn.type, txn.amount)} 
                      />
                    </View>
                    
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>{txn.description}</Text>
                      {txn.note && (
                        <Text style={styles.transactionNote}>"{txn.note}"</Text>
                      )}
                      <Text style={styles.transactionDate}>{formatDate(txn.createdAt)}</Text>
                    </View>
                    
                    <View style={styles.transactionAmountContainer}>
                      <Text style={[
                        styles.transactionAmount,
                        { color: getTransactionColor(txn.type, txn.amount) }
                      ]}>
                        {txn.amount > 0 ? '+' : ''}{formatIndianNumber(txn.amount)}
                      </Text>
                    </View>
                  </View>
                );
              })}
              
              {transactions.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewMoreBottomButton}
                  onPress={() => setShowAllTransactions(!showAllTransactions)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewMoreBottomText}>
                    {showAllTransactions 
                      ? "Show Less" 
                      : `View ${transactions.length - 5} More Transaction${transactions.length - 5 > 1 ? 's' : ''}`
                    }
                  </Text>
                  <Ionicons 
                    name={showAllTransactions ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#10B981" 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Bottom spacing for footer carousel */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Carousel - Fixed at bottom */}
      <FooterCarousel withCustomTabBar={true} />
      
      {/* Bottom Tab Navigation */}
      <CustomTabBar />
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  totalCreditsBanner: {
    margin: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  bannerGradient: {
    borderRadius: 16,
  },
  totalCreditsContent: {
    padding: 22,
  },
  creditsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  totalCreditsLabel: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  creditsAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
    width: '100%',
  },
  totalCreditsAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#059669',
    flexShrink: 1,
  },
  creditsUnit: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '500',
  },
  expiryInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(5, 150, 105, 0.2)',
  },
  expiryInfoText: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '600',
  },
  expiryInfoDate: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  breakdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  breakdownBadgeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  breakdownGrid: {
    paddingHorizontal: 16,
  },
  breakdownSection: {
    marginBottom: 12,
  },
  breakdownSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    paddingLeft: 4,
  },
  breakdownCards: {
    flexDirection: 'row',
    gap: 10,
  },
  spendingCardsHorizontal: {
    flexDirection: 'column',
    gap: 10,
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  breakdownAmount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  transactionCountBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  transactionCountText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  viewMoreHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewMoreHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  transactionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastTransactionCard: {
    borderBottomWidth: 0,
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  transactionBalance: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
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
    marginTop: 8,
    textAlign: 'center',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F0FDF4',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  viewMoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  viewMoreBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F0FDF4',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  viewMoreBottomText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  transferCreditsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  transferCreditsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#10B98120',
  },
  transferButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  transferIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  transferButtonContent: {
    flex: 1,
  },
  transferButtonTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  transferButtonSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  expiryTextContainer: {
    flex: 1,
  },
  expiryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  expiryDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  expirySubtext: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },
});
