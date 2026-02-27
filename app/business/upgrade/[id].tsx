import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Promotion = {
  _id: string;
  businessName: string;
  listingIntent?: 'free' | 'promoted';
  listingType?: 'free' | 'promoted';
  status?: string;
  paymentStatus?: 'not_required' | 'pending' | 'paid';
};

type ListingResponse = {
  success: boolean;
  promotion: Promotion;
};

type UpgradeResponse = {
  success: boolean;
  message: string;
  promotion: {
    _id: string;
    listingIntent: 'promoted';
    listingType: 'promoted';
    status: string;
    paymentStatus: 'pending' | 'paid';
  };
  nextAction?: 'pending_payment' | 'complete_form' | 'create_new';
};

export default function UpgradeToProScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [listing, setListing] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadListing = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ListingResponse>(`/business-promotion/${id}`);
      if (!response?.promotion?._id) {
        throw new Error('Listing not found');
      }
      setListing(response.promotion);
    } catch (e: any) {
      setError(e?.message || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  const handleUpgrade = useCallback(async () => {
    if (!id) return;
    try {
      setUpgrading(true);
      const response = await api.post<UpgradeResponse>(`/business-promotion/${id}/upgrade-to-pro`, {});
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to upgrade listing');
      }

      setListing((prev) =>
        prev
          ? {
              ...prev,
              listingIntent: 'promoted',
              listingType: 'promoted',
              status: response.promotion?.status || prev.status,
              paymentStatus: response.promotion?.paymentStatus || prev.paymentStatus,
            }
          : prev
      );

      if (response.nextAction === 'pending_payment') {
        router.replace({
          pathname: '/promotion-pricing',
          params: { promotionId: id },
        });
        return;
      }

      Alert.alert('Success', response.message || 'Listing upgraded successfully.');
      router.back();
    } catch (e: any) {
      if (e?.status === 400) {
        Alert.alert('Upgrade Failed', 'Complete business profile before upgrading to Pro.');
        return;
      }
      if (e?.status === 403) {
        Alert.alert('Upgrade Failed', 'You are not allowed to upgrade this listing.');
        return;
      }
      if (e?.status === 404) {
        Alert.alert('Upgrade Failed', 'Listing not found.');
        return;
      }
      if (e?.status === 409) {
        Alert.alert('Already Upgraded', 'This listing is already promoted.');
        return;
      }
      Alert.alert('Upgrade Failed', e?.message || 'Unable to process upgrade right now.');
    } finally {
      setUpgrading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#4F6AF3" />
          <Text style={styles.stateText}>Loading listing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4F6AF3', '#6B7FFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade to Pro</Text>
          <View style={styles.iconButton} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load listing</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadListing}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.businessName}>{listing?.businessName || 'Business Listing'}</Text>
              <Text style={styles.metaText}>
                Current Type: {(listing?.listingType || listing?.listingIntent || 'free').toUpperCase()}
              </Text>
              <Text style={styles.metaText}>After upgrade: PROMOTED (Payment Required)</Text>
            </View>

            <View style={styles.benefitCard}>
              <Text style={styles.sectionTitle}>Why Upgrade</Text>
              <Text style={styles.benefitItem}>- Higher ranking visibility in business feed</Text>
              <Text style={styles.benefitItem}>- Better impression and lead opportunities</Text>
              <Text style={styles.benefitItem}>- Access to paid priority scoring</Text>
            </View>

            <View style={styles.noteCard}>
              <Ionicons name="information-circle-outline" size={18} color="#4F6AF3" />
              <Text style={styles.noteText}>
                You will continue to pricing and payment after this step. Your listing becomes promoted only after successful payment verification.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.upgradeButton, upgrading && styles.disabledButton]}
              onPress={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.upgradeText}>Upgrade & Continue</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={upgrading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerGradient: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  content: { padding: 16, gap: 12 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 10, color: '#6B7280', fontSize: 13, fontWeight: '600' },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  businessName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6 },
  metaText: { fontSize: 13, color: '#4B5563', fontWeight: '600', marginTop: 2 },

  benefitCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 8 },
  benefitItem: { fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 6 },

  noteCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  noteText: { flex: 1, fontSize: 12, color: '#4338CA', fontWeight: '600', lineHeight: 17 },

  upgradeButton: {
    marginTop: 8,
    backgroundColor: '#4F6AF3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  upgradeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  cancelText: { color: '#4B5563', fontSize: 14, fontWeight: '700' },
  disabledButton: { opacity: 0.7 },

  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTitle: { color: '#B91C1C', fontSize: 15, fontWeight: '800', marginBottom: 6 },
  errorMessage: { color: '#7F1D1D', fontSize: 13, fontWeight: '600' },
  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: { color: '#B91C1C', fontSize: 12, fontWeight: '700' },
});

