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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';

const { width } = Dimensions.get('window');

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCredits, setTotalCredits] = useState(0);
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

      setTotalCredits(historyResponse.totalCredits || 0);
      setBreakdown(historyResponse.breakdown || {
        quizCredits: 0,
        referralCredits: 0,
        signupBonus: 0,
        selfDownloadCredits: 0,
        transferReceived: 0,
        transferSent: 0,
        adDeductions: 0,
      });
      setTransactions(historyResponse.transactions || []);
    } catch (error) {
      console.error('Error loading credits history:', error);
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

  const getTransactionColor = (type: string): string => {
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
            {amount > 0 ? '+' : ''}{amount.toLocaleString()}
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
          <View style={styles.bannerBackground}>
            <View style={styles.bannerGlowEffect} />
          </View>
          <View style={styles.totalCreditsContent}>
            <View style={styles.totalCreditsIconCircle}>
              <View style={styles.iconGlow}>
                <Ionicons name="wallet" size={42} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.totalCreditsLabel}>Your Total Balance</Text>
            <View style={styles.amountContainer}>
              <View style={styles.currencyBadge}>
                <Ionicons name="sparkles" size={20} color="#FFD700" />
              </View>
              <Text style={styles.totalCreditsAmount}>{totalCredits.toLocaleString()}</Text>
            </View>
            <View style={styles.creditsUnitContainer}>
              <Text style={styles.totalCreditsUnit}>Credits Available</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>
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
              <View style={styles.breakdownCards}>
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
              {(showAllTransactions ? transactions : transactions.slice(0, 5)).map((txn, index) => {
                const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, 5);
                const isLastItem = index === displayedTransactions.length - 1;
                return (
                  <View key={txn._id} style={[styles.transactionCard, isLastItem && styles.lastTransactionCard]}>
                    <View style={[
                      styles.transactionIconContainer,
                      { backgroundColor: getTransactionColor(txn.type) + '15' }
                    ]}>
                      <Ionicons 
                        name={getTransactionIcon(txn.type) as any} 
                        size={22} 
                        color={getTransactionColor(txn.type)} 
                      />
                    </View>
                    
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>{txn.description}</Text>
                      <Text style={styles.transactionDate}>{formatDate(txn.createdAt)}</Text>
                    </View>
                    
                    <View style={styles.transactionAmountContainer}>
                      <Text style={[
                        styles.transactionAmount,
                        { color: getTransactionColor(txn.type) }
                      ]}>
                        {txn.amount > 0 ? '+' : ''}{txn.amount.toLocaleString()}
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
      </ScrollView>
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
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  bannerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#10B981',
  },
  bannerGlowEffect: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  totalCreditsContent: {
    padding: 28,
    alignItems: 'center',
  },
  totalCreditsIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  iconGlow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  totalCreditsLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currencyBadge: {
    marginRight: 8,
    marginTop: 4,
  },
  totalCreditsAmount: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  creditsUnitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalCreditsUnit: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#10B981',
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
    gap: 6,
  },
  breakdownCard: {
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
});
