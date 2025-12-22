import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/lib/api';

const { width } = Dimensions.get('window');

interface ReferralBannerProps {
  style?: any;
}

export default function ReferralBanner({ style }: ReferralBannerProps) {
  const [config, setConfig] = useState<{ signupBonus: number; referralReward: number } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await api.get('/credits/config');
      setConfig(response.config);
    } catch (error) {
      console.error('Error loading credit config:', error);
    }
  };

  const handlePress = () => {
    router.push('/referral');
  };

  if (!config) return null;

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={handlePress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#3B82F6', '#2563EB', '#1D4ED8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="gift" size={32} color="#FFFFFF" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Invite Friends & Earn Credits!</Text>
          <Text style={styles.subtitle}>
            Get {config.referralReward} credits for each friend who signs up
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
