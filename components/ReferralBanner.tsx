import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Link } from 'expo-router';
import api from '@/lib/api';

const { width } = Dimensions.get('window');

interface ReferralBannerProps {
  style?: any;
}

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalCreditsEarned: number;
}

export default function ReferralBanner({ style }: ReferralBannerProps) {
  const [config, setConfig] = useState<{ signupBonus: number; referralReward: number } | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configResponse, statsResponse] = await Promise.all([
        api.get('/credits/config'),
        api.get('/credits/referral-stats')
      ]);
      setConfig(configResponse.config);
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  };

  const handlePress = () => {
    try {
      router.push('/(tabs)/../referral' as any);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to replace
      router.replace('/referral' as any);
    }
  };

  if (!config) return null;

  const friendsCount = stats?.totalReferrals || 0;

  return (
    <Link href="/referral" asChild>
      <TouchableOpacity style={styles.container} activeOpacity={0.9}>
        <View style={styles.iconContainer}>
          <Ionicons name="gift" size={22} color="#8B5CF6" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Refer & Earn {config.referralReward} Credits</Text>
          <Text style={styles.subtitle}>
            {friendsCount === 0 ? 'Start inviting friends' : `${friendsCount} friend${friendsCount === 1 ? '' : 's'} joined`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
