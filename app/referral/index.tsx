import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Alert,
  Clipboard,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalCreditsEarned: number;
  recentReferrals: Array<{
    name: string;
    phone: string;
    createdAt: string;
  }>;
}

interface CreditConfig {
  signupBonus: number;
  referralReward: number;
}

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [config, setConfig] = useState<CreditConfig | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      
      // Fetch referral stats, credit config, and user balance
      const [statsResponse, configResponse, creditsResponse] = await Promise.all([
        api.get('/credits/referral-stats'),
        api.get('/credits/config'),
        api.get('/credits/balance')
      ]);
      
      console.log('📊 Referral Stats Response:', JSON.stringify(statsResponse, null, 2));
      console.log('🔑 Referral Code:', statsResponse?.referralCode);
      console.log('🔍 Full stats object:', statsResponse);
      
      setStats(statsResponse);
      setConfig(configResponse.config);
      setUserCredits(creditsResponse.credits || 0);
      
      // Force a re-render check
      console.log('✅ State updated - referralCode should be:', statsResponse?.referralCode);
    } catch (error) {
      console.error('Error loading referral data:', error);
      Alert.alert('Error', 'Failed to load referral information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReferralData(true);
  };

  const handleShare = async () => {
    if (!stats?.referralCode || !config) return;

    // Generate Play Store link with referral code embedded
    const playStoreUrl = `https://play.google.com/store/apps/details?id=com.instantllycards.www.twa&referrer=utm_source%3Dreferral%26utm_campaign%3D${stats.referralCode}`;

    const message = `🎁 Join InstantllyCards and get ${config.signupBonus} free credits!\n\nDownload the app now:\n${playStoreUrl}\n\nYou'll automatically get ${config.signupBonus} credits, and I'll get ${config.referralReward} credits!`;

    try {
      await Share.share({
        message,
        title: 'Join InstantllyCards'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyLink = () => {
    if (!stats?.referralCode) return;
    const referralLink = `instantllycards.com/signup?ref=${stats.referralCode}`;
    Clipboard.setString(referralLink);
    Alert.alert('Copied!', 'Referral link copied to clipboard');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referral Program</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral Program</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Credits Balance Banner */}
        <View style={styles.creditsBanner}>
          <View style={styles.creditsContent}>
            <Text style={styles.creditsLabel}>Your Balance</Text>
            <Text style={styles.creditsAmount}>{userCredits.toLocaleString()}</Text>
            <Text style={styles.creditsUnit}>Credits</Text>
          </View>
          <View style={styles.creditsIconCircle}>
            <Ionicons name="wallet" size={32} color="#10B981" />
          </View>
        </View>

        {/* Track Referral Status Button */}
        <TouchableOpacity 
          style={styles.trackStatusButton}
          onPress={() => router.push('/referral/track-status')}
        >
          <Ionicons name="trending-up" size={20} color="#FFFFFF" />
          <Text style={styles.trackStatusText}>Track Referral Status</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="people" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{stats?.totalReferrals || 0}</Text>
            <Text style={styles.statLabel}>Friends Invited</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="gift" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats?.totalCreditsEarned || 0}</Text>
            <Text style={styles.statLabel}>Credits Earned</Text>
          </View>
        </View>

        {/* Referral Link Card */}
        <View style={styles.referralLinkCard}>
          <Text style={styles.referralLinkTitle}>Your Referral Link</Text>
          <Text style={styles.referralLinkSubtitle}>Share this link with friends</Text>
          
          <View style={styles.codeBox}>
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>CODE:</Text>
              <Text style={styles.codeText}>
                {stats?.referralCode ? stats.referralCode : 'Loading...'}
              </Text>
              <Text style={styles.linkText}>
                instantllycards.com/signup?ref={stats?.referralCode || 'Loading'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCopyLink} style={styles.copyIconButton}>
              <Ionicons name="link" size={20} color="#8B5CF6" />
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareButtonMain} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonMainText}>Share via WhatsApp, SMS & More</Text>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksCard}>
          <View style={styles.howItWorksHeader}>
            <Text style={styles.howItWorksIcon}>💡</Text>
            <Text style={styles.howItWorksTitle}>How It Works</Text>
          </View>
          
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Share your referral link via WhatsApp, SMS, or any app
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Your friend signs up using your link and gets {config?.signupBonus || 200} credits
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                You earn {config?.referralReward || 300} credits for each successful referral
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  creditsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  creditsContent: {
    flex: 1,
  },
  creditsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  creditsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 2,
  },
  creditsUnit: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  creditsIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  trackStatusText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  referralLinkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  referralLinkTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  referralLinkSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codeSection: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 8,
    letterSpacing: 1,
  },
  linkText: {
    fontSize: 12,
    color: '#8B5CF6',
  },
  copyIconButton: {
    alignItems: 'center',
    paddingLeft: 12,
    gap: 4,
  },
  copyText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  shareButtonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  shareButtonMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  howItWorksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  howItWorksIcon: {
    fontSize: 24,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    paddingTop: 6,
  },
});
