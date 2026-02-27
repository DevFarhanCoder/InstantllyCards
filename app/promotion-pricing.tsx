import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import api from '@/lib/api';

type AreaType = 'pincode' | 'tehsil' | 'district';

type PricingPlan = {
  _id: string;
  areaType: AreaType;
  rank: number;
  rankLabel: string;
  amount: number;
  currency: string;
  durationDays: number;
  priorityScore: number;
};

type Quote = {
  _id: string;
  areaType: AreaType;
  rank: number;
  amount: number;
  durationDays: number;
  currency: string;
};

type CatalogResponse = { success: boolean; plans: PricingPlan[] };
type QuoteResponse = { success: boolean; quote: Quote };
type CreateOrderResponse = {
  success: boolean;
  order: { _id: string; status: string; paymentOrderId: string };
  checkout?: { keyId: string; amount: number; currency: string; razorpayOrderId: string };
};
type VerifyResponse = {
  success: boolean;
  message: string;
  order: { status: string };
  promotion: { listingType: string; status: string; priorityScore: number };
};

const getRazorpayCheckout = (): { open: (options: Record<string, any>) => Promise<any> } | null => {
  try {
    const req = (global as any).eval?.('require');
    if (!req) return null;
    return req('react-native-razorpay')?.default || null;
  } catch {
    return null;
  }
};

export default function PromotionPricing() {
  const { promotionId } = useLocalSearchParams<{ promotionId?: string }>();

  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [areaType, setAreaType] = useState<AreaType | ''>('');
  const [rank, setRank] = useState<number | null>(null);
  const [durationDays, setDurationDays] = useState<number | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [rankModalVisible, setRankModalVisible] = useState(false);
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [webCheckoutVisible, setWebCheckoutVisible] = useState(false);
  const [webCheckoutHtml, setWebCheckoutHtml] = useState('');
  const webCheckoutResolveRef = React.useRef<((value: any) => void) | null>(null);
  const webCheckoutRejectRef = React.useRef<((reason?: any) => void) | null>(null);
  const checkoutMode: 'native' | 'web' = getRazorpayCheckout() ? 'native' : 'web';

  const loadCatalog = async () => {
    try {
      setCatalogLoading(true);
      setCatalogError(null);

      const response = await api.get<CatalogResponse>('/promotion-pricing/catalog');
      if (!response?.success || !Array.isArray(response.plans)) {
        throw new Error('Invalid pricing catalog response');
      }

      setPlans(response.plans);
      const firstPlan = response.plans[0];
      if (firstPlan) {
        setAreaType(firstPlan.areaType);
        setRank(firstPlan.rank);
        setDurationDays(firstPlan.durationDays);
      }
    } catch (error: any) {
      setCatalogError(error?.message || 'Failed to load pricing catalog');
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const durationOptions = useMemo(() => {
    const unique = Array.from(new Set(plans.map((p) => p.durationDays)));
    return unique.sort((a, b) => a - b);
  }, [plans]);

  const rankOptions = useMemo(() => {
    const map = new Map<number, string>();
    plans.forEach((plan) => {
      if (!map.has(plan.rank)) map.set(plan.rank, plan.rankLabel || `Rank ${plan.rank}`);
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label: value === 21 ? 'No Rank' : label }))
      .sort((a, b) => a.value - b.value);
  }, [plans]);

  const chartRows = useMemo(() => {
    if (!durationDays) return [];
    const filtered = plans.filter((p) => p.durationDays === durationDays);
    const rankMap = new Map<number, { rank: number; pincode?: number; tehsil?: number; district?: number }>();

    filtered.forEach((plan) => {
      if (!rankMap.has(plan.rank)) rankMap.set(plan.rank, { rank: plan.rank });
      const row = rankMap.get(plan.rank)!;
      row[plan.areaType] = plan.amount;
    });

    return Array.from(rankMap.values()).sort((a, b) => a.rank - b.rank);
  }, [plans, durationDays]);

  const loadQuote = async () => {
    if (!areaType || !rank || !durationDays) return;
    try {
      setQuoteLoading(true);
      setQuoteError(null);
      const response = await api.get<QuoteResponse>('/promotion-pricing/quote', {
        params: { areaType, rank, durationDays },
      });
      if (!response?.success || !response.quote) {
        throw new Error('Invalid quote response');
      }
      setQuote(response.quote);
    } catch (error: any) {
      setQuote(null);
      setQuoteError(error?.message || 'Failed to fetch quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    loadQuote();
  }, [areaType, rank, durationDays]);

  const verifyRazorpayPayment = async (
    orderId: string,
    payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ) => {
    console.log('[PAYMENT] verify-payment request', {
      orderId,
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      hasSignature: !!payload.razorpay_signature,
    });
    const response = await api.post<VerifyResponse>(`/promotion-pricing/orders/${orderId}/verify-payment`, payload);
    console.log('[PAYMENT] verify-payment response', response);
    if (!response?.success) {
      throw new Error('Payment verification failed');
    }
    Alert.alert('Success', response.message || 'Payment verified and listing activated');
    router.replace('/profile');
  };

  const openWebRazorpayCheckout = (options: Record<string, any>) =>
    new Promise<any>((resolve, reject) => {
      webCheckoutResolveRef.current = resolve;
      webCheckoutRejectRef.current = reject;
      const serialized = encodeURIComponent(JSON.stringify(options));
      const html = `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body style="margin:0;background:#fff;">
    <script>
      (function () {
        try {
          var options = JSON.parse(decodeURIComponent("${serialized}"));
          options.handler = function (response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', payload: response }));
          };
          var rzp = new Razorpay(options);
          rzp.on('payment.failed', function (response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'failed', payload: response && response.error ? response.error : response }));
          });
          rzp.open();
        } catch (e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', payload: String(e && e.message ? e.message : e) }));
        }
      })();
    </script>
  </body>
</html>`;
      setWebCheckoutHtml(html);
      setWebCheckoutVisible(true);
    });

  const handlePayNow = async () => {
    if (!promotionId) {
      Alert.alert('Error', 'Promotion ID is missing. Please go back and submit listing again.');
      return;
    }

    if (!areaType || !rank || !durationDays) {
      Alert.alert('Error', 'Please select area type, rank, and duration.');
      return;
    }

    if (!quote) {
      Alert.alert('Error', 'Unable to proceed without a valid quote. Please retry.');
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentError(null);

      console.log('[PAYMENT] create order request', {
        businessPromotionId: promotionId,
        areaType,
        rank,
        durationDays,
        paymentProvider: 'razorpay',
      });
      const createOrderResponse = await api.post<CreateOrderResponse>('/promotion-pricing/orders', {
        businessPromotionId: promotionId,
        areaType,
        rank,
        durationDays,
        paymentProvider: 'razorpay',
      });
      console.log('[PAYMENT] create order response', createOrderResponse);

      if (!createOrderResponse?.success || !createOrderResponse.order?._id) {
        throw new Error('Failed to create payment order');
      }

      if (!createOrderResponse.checkout) {
        setPaymentError(
          'Razorpay checkout payload is missing for this order. Please try again or contact support.'
        );
        return;
      }

      const razorpay = getRazorpayCheckout();
      if (!razorpay) {
        console.log('[PAYMENT] native razorpay unavailable, falling back to web checkout');
      }

      const checkoutOptions: any = {
        key: createOrderResponse.checkout.keyId,
        amount: createOrderResponse.checkout.amount,
        currency: createOrderResponse.checkout.currency,
        name: 'InstantllyCards',
        description: `Promotion - ${areaType} - Rank ${rank}`,
        order_id: createOrderResponse.checkout.razorpayOrderId,
        theme: { color: '#2563EB' },
      };

      console.log('[PAYMENT] razorpay checkout init', {
        orderId: createOrderResponse.order._id,
        razorpayOrderId: createOrderResponse.checkout.razorpayOrderId,
        amount: createOrderResponse.checkout.amount,
        currency: createOrderResponse.checkout.currency,
      });
      const razorpayResult = razorpay
        ? await razorpay.open(checkoutOptions)
        : await openWebRazorpayCheckout(checkoutOptions);
      console.log('[PAYMENT] razorpay checkout success', {
        razorpay_order_id: razorpayResult?.razorpay_order_id,
        razorpay_payment_id: razorpayResult?.razorpay_payment_id,
        hasSignature: !!razorpayResult?.razorpay_signature,
      });

      await verifyRazorpayPayment(createOrderResponse.order._id, {
        razorpay_order_id:
          razorpayResult.razorpay_order_id || createOrderResponse.checkout.razorpayOrderId,
        razorpay_payment_id: razorpayResult.razorpay_payment_id,
        razorpay_signature: razorpayResult.razorpay_signature,
      });
    } catch (error: any) {
      console.log('[PAYMENT] payment flow error', {
        message: error?.message,
        code: error?.code,
        description: error?.description,
      });
      if (error?.code === 2 || String(error?.description || '').toLowerCase().includes('cancel')) {
        setPaymentError('Payment was cancelled.');
      } else {
        setPaymentError(error?.message || 'Payment failed. Please try again.');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  if (catalogLoading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.helperText}>Loading pricing catalog...</Text>
      </SafeAreaView>
    );
  }

  if (catalogError) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>{catalogError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCatalog}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotion Pricing</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.selectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Promotion Configuration</Text>
            <View
              style={[
                styles.modeBadge,
                checkoutMode === 'native' ? styles.modeBadgeNative : styles.modeBadgeWeb,
              ]}
            >
              <Text
                style={[
                  styles.modeBadgeText,
                  checkoutMode === 'native' ? styles.modeBadgeTextNative : styles.modeBadgeTextWeb,
                ]}
              >
                {checkoutMode === 'native' ? 'Native SDK' : 'WebView Fallback'}
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Area Type</Text>
            <TouchableOpacity style={styles.pickerContainer} onPress={() => setAreaModalVisible(true)}>
              <Text style={styles.pickerText}>{areaType ? areaType.toUpperCase() : 'Select area type'}</Text>
              <Ionicons name="chevron-down" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ranking</Text>
            <TouchableOpacity style={styles.pickerContainer} onPress={() => setRankModalVisible(true)}>
              <Text style={styles.pickerText}>
                {rank !== null ? (rank === 21 ? 'No Rank' : `Rank ${rank}`) : 'Select ranking'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration</Text>
            <TouchableOpacity style={styles.pickerContainer} onPress={() => setDurationModalVisible(true)}>
              <Text style={styles.pickerText}>
                {durationDays !== null ? `${durationDays} days` : 'Select duration'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.priceDisplay}>
            <Text style={styles.priceLabel}>Current Quote</Text>
            {quoteLoading ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : quote ? (
              <Text style={styles.priceValue}>
                {quote.currency} {quote.amount}
              </Text>
            ) : (
              <Text style={styles.priceValue}>-</Text>
            )}
          </View>

          {quoteError ? (
            <View style={styles.quoteErrorContainer}>
              <Text style={styles.errorText}>{quoteError}</Text>
              <TouchableOpacity style={styles.quoteRetryButton} onPress={loadQuote}>
                <Text style={styles.quoteRetryText}>Retry Quote</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {paymentError ? <Text style={styles.errorText}>{paymentError}</Text> : null}
        </View>

        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Catalog (for selected duration)</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.rankColumn]}>Rank</Text>
            <Text style={[styles.tableHeaderCell, styles.priceColumn]}>Pincode</Text>
            <Text style={[styles.tableHeaderCell, styles.priceColumn]}>Tehsil</Text>
            <Text style={[styles.tableHeaderCell, styles.priceColumn]}>District</Text>
          </View>
          {chartRows.map((row) => (
            <View key={row.rank} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.rankColumn]}>{row.rank === 21 ? 'No Rank' : `Rank ${row.rank}`}</Text>
              <Text style={[styles.tableCell, styles.priceColumn]}>{row.pincode ?? '-'}</Text>
              <Text style={[styles.tableCell, styles.priceColumn]}>{row.tehsil ?? '-'}</Text>
              <Text style={[styles.tableCell, styles.priceColumn]}>{row.district ?? '-'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.payButton, paymentLoading && styles.payButtonDisabled]}
          onPress={handlePayNow}
          disabled={paymentLoading || quoteLoading}
        >
          {paymentLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="card" size={24} color="#FFFFFF" style={styles.payIcon} />
              <Text style={styles.payButtonText}>Pay Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <SelectionModal
        visible={areaModalVisible}
        title="Select Area Type"
        options={[
          { label: 'Pincode', value: 'pincode' },
          { label: 'Tehsil', value: 'tehsil' },
          { label: 'District', value: 'district' },
        ]}
        selected={areaType}
        onSelect={(value) => {
          setAreaType(value as AreaType);
          setAreaModalVisible(false);
        }}
        onClose={() => setAreaModalVisible(false)}
      />

      <SelectionModal
        visible={rankModalVisible}
        title="Select Ranking"
        options={rankOptions.map((o) => ({ label: o.label, value: String(o.value) }))}
        selected={rank !== null ? String(rank) : ''}
        onSelect={(value) => {
          setRank(Number(value));
          setRankModalVisible(false);
        }}
        onClose={() => setRankModalVisible(false)}
      />

      <SelectionModal
        visible={durationModalVisible}
        title="Select Duration"
        options={durationOptions.map((d) => ({ label: `${d} days`, value: String(d) }))}
        selected={durationDays !== null ? String(durationDays) : ''}
        onSelect={(value) => {
          setDurationDays(Number(value));
          setDurationModalVisible(false);
        }}
        onClose={() => setDurationModalVisible(false)}
      />

      <Modal visible={webCheckoutVisible} animationType="slide" onRequestClose={() => {
        setWebCheckoutVisible(false);
        webCheckoutRejectRef.current?.(new Error('Checkout closed'));
      }}>
        <SafeAreaView style={styles.container}>
          <View style={styles.webHeader}>
            <TouchableOpacity
              style={styles.webCloseButton}
              onPress={() => {
                setWebCheckoutVisible(false);
                webCheckoutRejectRef.current?.(new Error('Checkout cancelled by user'));
              }}
            >
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.webHeaderTitle}>Secure Payment</Text>
            <View style={styles.webHeaderSpacer} />
          </View>
          <WebView
            source={{ html: webCheckoutHtml }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data || '{}');
                if (data.type === 'success') {
                  setWebCheckoutVisible(false);
                  webCheckoutResolveRef.current?.(data.payload || {});
                } else {
                  setWebCheckoutVisible(false);
                  webCheckoutRejectRef.current?.(new Error(data?.payload?.description || data?.payload || 'Checkout failed'));
                }
              } catch (e: any) {
                setWebCheckoutVisible(false);
                webCheckoutRejectRef.current?.(new Error(e?.message || 'Checkout parsing failed'));
              }
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function SelectionModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: Array<{ label: string; value: string }>;
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.rankingScrollView}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.rankingOption, selected === option.value && styles.rankingOptionSelected]}
                onPress={() => onSelect(option.value)}
              >
                <Text
                  style={[
                    styles.rankingOptionText,
                    selected === option.value && styles.rankingOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {selected === option.value && <Ionicons name="checkmark-circle" size={24} color="#2563EB" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centeredContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
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
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  placeholder: { width: 40 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  selectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modeBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeBadgeNative: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  modeBadgeWeb: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modeBadgeTextNative: {
    color: '#047857',
  },
  modeBadgeTextWeb: {
    color: '#C2410C',
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '700', color: '#000000', marginBottom: 10 },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerText: { fontSize: 16, color: '#000000', flex: 1 },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 8,
  },
  priceLabel: { fontSize: 16, fontWeight: '600', color: '#1E40AF' },
  priceValue: { fontSize: 20, fontWeight: '700', color: '#2563EB' },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tableTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableCell: { fontSize: 13, color: '#374151', textAlign: 'center' },
  rankColumn: { flex: 1.2 },
  priceColumn: { flex: 1 },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  payButtonDisabled: { opacity: 0.6 },
  payIcon: { marginRight: 8 },
  payButtonText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  rankingScrollView: { maxHeight: 400 },
  rankingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rankingOptionSelected: { backgroundColor: '#EFF6FF' },
  rankingOptionText: { fontSize: 16, color: '#111827' },
  rankingOptionTextSelected: { fontWeight: '600', color: '#2563EB' },
  retryButton: { marginTop: 16, backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  errorText: { marginTop: 8, color: '#DC2626', fontSize: 13 },
  quoteErrorContainer: { marginTop: 8, gap: 8 },
  quoteRetryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quoteRetryText: { color: '#111827', fontWeight: '600', fontSize: 12 },
  helperText: { marginTop: 12, color: '#6B7280' },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  webCloseButton: { padding: 6 },
  webHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  webHeaderSpacer: { width: 34 },
});
