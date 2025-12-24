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
    color, 
    emoji 
  }: { 
    title: string; 
    amount: number; 
    icon: string; 
    color: string; 
    emoji: string; 
  }) => (
    <View style={[styles.breakdownCard, { borderLeftColor: color }]}>
      <View style={styles.breakdownHeader}>
        <View style={[styles.breakdownIconContainer, { backgroundColor: color + '20' }]}>
          <Text style={styles.breakdownEmoji}>{emoji}</Text>
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
          <View style={styles.totalCreditsIconCircle}>
            <Ionicons name="wallet" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.totalCreditsLabel}>Total Balance</Text>
          <Text style={styles.totalCreditsAmount}>{totalCredits.toLocaleString()}</Text>
          <Text style={styles.totalCreditsUnit}>Credits</Text>
        </View>

        {/* Breakdown Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credits Breakdown</Text>
          
          <BreakdownCard
            title="Transfer Received"
            amount={breakdown.transferReceived}
            icon="arrow-down-circle"
            color="#10B981"
            emoji="⬇️"
          />
          
          <BreakdownCard
            title="Transfer Sent"
            amount={-breakdown.transferSent}
            icon="arrow-up-circle"
            color="#EF4444"
            emoji="⬆️"
          />
          
          <BreakdownCard
            title="Ad Deductions"
            amount={-breakdown.adDeductions}
            icon="megaphone"
            color="#EF4444"
            emoji="📢"
          />
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your credit transactions will appear here</Text>
            </View>
          ) : (
            transactions.map((txn, index) => {
              const isLastItem = index === transactions.length - 1;
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
            })
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
    padding: 24,
    backgroundColor: '#10B981',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  totalCreditsIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  totalCreditsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  totalCreditsAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  totalCreditsUnit: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  breakdownEmoji: {
    fontSize: 24,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  breakdownAmount: {
    fontSize: 24,
    fontWeight: '700',
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
});
