import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import api from '@/lib/api';

type AreaType = 'pincode' | 'tehsil' | 'district' | 'division' | 'state' | 'zone' | 'india';

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
type VoucherInfo = {
  id: string;
  companyName: string;
  mrp: number;
  expiresAt?: string;
};
type VoucherBalanceResponse = {
  success: boolean;
  voucher?: VoucherInfo | null;
  balance?: number;
  totalValue?: number;
  expired?: boolean;
};
type CreateOrderResponse = {
  success: boolean;
  order: {
    _id: string;
    status: string;
    paymentOrderId?: string;
    amount?: number;
    payableAmount?: number;
    voucherQtyApplied?: number;
    voucherAmountApplied?: number;
    voucherStatus?: string;
    areaType?: AreaType;
    rank?: number;
    durationDays?: number;
  };
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

const AREA_TYPES: AreaType[] = [
  'pincode',
  'tehsil',
  'district',
  'division',
  'state',
  'zone',
  'india',
];

const AREA_TYPE_LABELS: Record<AreaType, string> = {
  pincode: 'Pincode',
  tehsil: 'Tehsil',
  district: 'District',
  division: 'Division',
  state: 'State',
  zone: 'Zone',
  india: 'India',
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
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherInfo, setVoucherInfo] = useState<VoucherInfo | null>(null);
  const [voucherBalance, setVoucherBalance] = useState(0);
  const [voucherTotalValue, setVoucherTotalValue] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<CreateOrderResponse["order"] | null>(null);
  const [voucherApplied, setVoucherApplied] = useState(false);

  const resumingRef = useRef(false);
  const lastPromptedOrderIdRef = useRef<string | null>(null);

  const [rankModalVisible, setRankModalVisible] = useState(false);
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);

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

  const loadVoucherBalance = async () => {
    try {
      setVoucherLoading(true);
      const response = await api.get<VoucherBalanceResponse>('/promotion-pricing/voucher-balance');
      if (!response?.success) {
        throw new Error('Failed to load voucher balance');
      }
      setVoucherInfo(response.voucher || null);
      setVoucherBalance(Number(response.balance || 0));
      setVoucherTotalValue(Number(response.totalValue || 0));
    } catch {
      setVoucherInfo(null);
      setVoucherBalance(0);
      setVoucherTotalValue(0);
    } finally {
      setVoucherLoading(false);
    }
  };

  useEffect(() => {
    loadVoucherBalance();
  }, []);

  const describeOrderSelection = (order: CreateOrderResponse["order"]) => {
    const orderArea = order.areaType ? AREA_TYPE_LABELS[order.areaType] : "Unknown area";
    const orderRank =
      order.rank === 21 ? "No Rank" : order.rank ? `Rank ${order.rank}` : "Unknown rank";
    const orderDuration = order.durationDays ? `${order.durationDays} days` : "Unknown duration";
    return `${orderArea} · ${orderRank} · ${orderDuration}`;
  };

  const applyOrderState = (order: CreateOrderResponse["order"]) => {
    setOrderId(order._id);
    setOrderData(order);
    setVoucherApplied(
      order.voucherStatus === "reserved" || order.voucherStatus === "applied",
    );
  };

  const resumePendingOrder = (order: CreateOrderResponse["order"]) => {
    if (!order.areaType || order.rank === undefined || order.durationDays === undefined) {
      return;
    }
    resumingRef.current = true;
    setAreaType(order.areaType);
    setRank(order.rank);
    setDurationDays(order.durationDays);
    applyOrderState(order);
    setTimeout(() => {
      resumingRef.current = false;
    }, 0);
  };

  const cancelPendingOrder = async (order: CreateOrderResponse["order"]) => {
    try {
      await api.post(`/promotion-pricing/orders/${order._id}/cancel`, {});
      if (orderId === order._id) {
        setOrderId(null);
        setOrderData(null);
        setVoucherApplied(false);
      }
      lastPromptedOrderIdRef.current = null;
      await loadVoucherBalance();
      Alert.alert("Order Cancelled", "Your pending order was cancelled and vouchers were returned.");
    } catch (error: any) {
      Alert.alert("Cancel Failed", error?.message || "Unable to cancel the pending order");
    }
  };

  const isSameSelection = (order: CreateOrderResponse["order"]) => {
    return (
      order.areaType === areaType &&
      Number(order.rank) === Number(rank) &&
      Number(order.durationDays) === Number(durationDays)
    );
  };

  const fetchPendingByPromotion = async (promptIfDifferent: boolean) => {
    if (!promotionId) return null;
    const response = await api.get<CreateOrderResponse>(
      "/promotion-pricing/orders/pending-by-promotion",
      { params: { businessPromotionId: promotionId } },
    );
    if (response?.success && response.order?._id) {
      const order = response.order;
      if (isSameSelection(order)) {
        applyOrderState(order);
        return order;
      }
      if (
        promptIfDifferent &&
        lastPromptedOrderIdRef.current !== order._id
      ) {
        lastPromptedOrderIdRef.current = order._id;
        Alert.alert(
          "Pending Order Found",
          `You already have a pending order for ${describeOrderSelection(order)}. Please resume or cancel it before creating a new one.`,
          [
            { text: "Resume", onPress: () => resumePendingOrder(order) },
            { text: "Cancel", style: "destructive", onPress: () => cancelPendingOrder(order) },
          ],
        );
      }
      return order;
    }
    return null;
  };

  const durationOptions = useMemo(() => {
    const unique = Array.from(new Set(plans.map((p) => p.durationDays)));
    return unique.sort((a, b) => a - b);
  }, [plans]);

  const areaTypeOptions = useMemo(() => {
    const available = new Set(plans.map((p) => p.areaType));
    return AREA_TYPES.filter((type) => available.has(type)).map((type) => ({
      label: AREA_TYPE_LABELS[type],
      value: type,
    }));
  }, [plans]);

  const tableColumns = useMemo(() => {
    const available = new Set(plans.map((p) => p.areaType));
    const types = AREA_TYPES.filter((type) => available.has(type));
    const shortLabels: Record<AreaType, string> = {
      pincode: 'PIN',
      tehsil: 'TEH',
      district: 'DIST',
      division: 'DIV',
      state: 'STATE',
      zone: 'ZONE',
      india: 'INDIA',
    };
    const flexMap: Record<AreaType, number> = {
      pincode: 0.9,
      tehsil: 0.9,
      district: 1,
      division: 1,
      state: 1.1,
      zone: 1.1,
      india: 1.2,
    };
    return [
      { key: 'rank', label: 'RANK', flex: 0.8, isRank: true },
      ...types.map((type) => ({
        key: type,
        label: shortLabels[type],
        flex: flexMap[type],
        areaType: type,
      })),
    ];
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
    const rankMap = new Map<number, { rank: number } & Partial<Record<AreaType, number>>>();

    filtered.forEach((plan) => {
      if (!rankMap.has(plan.rank)) rankMap.set(plan.rank, { rank: plan.rank });
      const row = rankMap.get(plan.rank)!;
      row[plan.areaType] = plan.amount;
    });

    return Array.from(rankMap.values()).sort((a, b) => a.rank - b.rank);
  }, [plans, durationDays]);

  const payableAmount = Number(orderData?.payableAmount ?? quote?.amount ?? 0);

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

  useEffect(() => {
    // Reset order/voucher state when selection changes
    if (resumingRef.current) {
      return;
    }
    lastPromptedOrderIdRef.current = null;
    setOrderId(null);
    setOrderData(null);
    setVoucherApplied(false);
    if (promotionId && areaType && rank && durationDays) {
      fetchPendingByPromotion(true);
    }
  }, [areaType, rank, durationDays, promotionId]);

  const fetchPendingOrder = async () => {
    if (!promotionId || !areaType || !rank || !durationDays) return null;
    const response = await api.get<CreateOrderResponse>(
      "/promotion-pricing/orders/pending",
      {
        params: {
          businessPromotionId: promotionId,
          areaType,
          rank,
          durationDays,
        },
      },
    );
    if (response?.success && response.order?._id) {
      setOrderId(response.order._id);
      setOrderData(response.order);
      setVoucherApplied(
        response.order.voucherStatus === "reserved" ||
          response.order.voucherStatus === "applied",
      );
      return response.order;
    }
    return null;
  };

  const ensureOrder = async () => {
    if (orderId && orderData) return orderData;
    if (!promotionId) {
      throw new Error('Promotion ID is missing. Please go back and submit listing again.');
    }
    if (!areaType || !rank || !durationDays) {
      throw new Error('Please select area type, rank, and duration.');
    }
    const pendingForPromotion = await fetchPendingByPromotion(false);
    if (pendingForPromotion && !isSameSelection(pendingForPromotion)) {
      throw new Error(
        "You already have a pending order for this promotion. Please resume or cancel it before creating a new one.",
      );
    }
    const pending = await fetchPendingOrder();
    if (pending) return pending;
    const createOrderResponse = await api.post<CreateOrderResponse>('/promotion-pricing/orders', {
      businessPromotionId: promotionId,
      areaType,
      rank,
      durationDays,
      paymentProvider: 'razorpay',
      deferPaymentOrder: true,
    });
    if (!createOrderResponse?.success || !createOrderResponse.order?._id) {
      throw new Error('Failed to create promotion order');
    }
    setOrderId(createOrderResponse.order._id);
    setOrderData(createOrderResponse.order);
    return createOrderResponse.order;
  };

  const handleApplyVouchers = async () => {
    try {
      setPaymentError(null);
      setVoucherLoading(true);
      const order = await ensureOrder();
      const response = await api.post<CreateOrderResponse>(
        `/promotion-pricing/orders/${order._id}/apply-vouchers`,
        {},
      );
      if (!response?.success) {
        throw new Error('Failed to apply vouchers');
      }
      if (response.order) {
        setOrderData(response.order);
        setVoucherApplied(true);
      }
      await loadVoucherBalance();
    } catch (error: any) {
      Alert.alert('Voucher Apply Failed', error?.message || 'Unable to apply vouchers');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleVoucherInfo = () => {
    Alert.alert(
      'Redeem Vouchers',
      'When you tap “Redeem Vouchers”, your Instantlly vouchers reduce the price of this promotion. We keep those vouchers aside for this order. If you don’t finish payment, the vouchers return to your balance after a short time. You can come back later and continue.',
    );
  };

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

      const order = await ensureOrder();
      const payableAmount = Number(orderData?.payableAmount ?? order.amount ?? quote.amount ?? 0);

      if (payableAmount <= 0 && orderData?.voucherStatus === 'reserved') {
        const confirmResponse = await api.post(`/promotion-pricing/orders/${order._id}/confirm-voucher`, {});
        if (!confirmResponse?.success) {
          throw new Error('Failed to confirm voucher redemption');
        }
        Alert.alert('Success', confirmResponse.message || 'Voucher redemption successful');
        router.replace('/profile');
        return;
      }

      const paymentOrderResponse = await api.post<CreateOrderResponse>(
        `/promotion-pricing/orders/${order._id}/create-payment-order`,
        {},
      );

      if (!paymentOrderResponse?.success || !paymentOrderResponse.checkout) {
        setPaymentError('Razorpay checkout payload is missing for this order.');
        return;
      }

      const razorpay = getRazorpayCheckout();
      if (!razorpay) {
        setPaymentError('Razorpay SDK is not available on this device.');
        return;
      }

      const checkoutOptions: any = {
        key: paymentOrderResponse.checkout.keyId,
        amount: paymentOrderResponse.checkout.amount,
        currency: paymentOrderResponse.checkout.currency,
        name: 'InstantllyCards',
        description: `Promotion - ${areaType} - Rank ${rank}`,
        order_id: paymentOrderResponse.checkout.razorpayOrderId,
        theme: { color: '#2563EB' },
      };

      const razorpayResult = await razorpay.open(checkoutOptions);

      await verifyRazorpayPayment(order._id, {
        razorpay_order_id:
          razorpayResult?.razorpay_order_id || paymentOrderResponse.checkout.razorpayOrderId,
        razorpay_payment_id: razorpayResult?.razorpay_payment_id,
        razorpay_signature: razorpayResult?.razorpay_signature,
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
            <Text style={styles.sectionTitle}>Selection Parameters</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Select area type, rank, and duration. Quote updates instantly.
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Area Type</Text>
            <TouchableOpacity style={styles.pickerContainer} onPress={() => setAreaModalVisible(true)}>
              <Text style={styles.pickerText}>
                {areaType ? AREA_TYPE_LABELS[areaType] : 'Select area type'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ranking</Text>
            <TouchableOpacity style={styles.pickerContainer} onPress={() => setRankModalVisible(true)}>
              <Text style={styles.pickerText}>
                {rank !== null ? (rank === 21 ? 'No Rank' : `Rank ${rank}`) : 'Select ranking'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration</Text>
            <TouchableOpacity style={styles.pickerContainer} onPress={() => setDurationModalVisible(true)}>
              <Text style={styles.pickerText}>
                {durationDays !== null ? `${durationDays} days` : 'Select duration'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.priceDisplay}>
            <View>
              <Text style={styles.priceLabel}>CURRENT QUOTE</Text>
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
            <TouchableOpacity
              style={styles.quoteRefreshButton}
              onPress={loadQuote}
              disabled={quoteLoading}
            >
              <Ionicons name="refresh" size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>

          <View style={styles.voucherCard}>
            <View style={styles.voucherHeader}>
              <Text style={styles.voucherTitle}>Instantlly Voucher Balance</Text>
              <View style={styles.voucherHeaderRight}>
                <TouchableOpacity onPress={handleVoucherInfo} style={styles.voucherInfoButton}>
                  <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
                </TouchableOpacity>
                {voucherLoading ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : null}
              </View>
            </View>
            {voucherInfo ? (
              <>
                <Text style={styles.voucherMeta}>
                  {voucherBalance} voucher(s) · ₹{voucherInfo.mrp} each
                </Text>
                <Text style={styles.voucherMeta}>
                  Total Value: ₹{voucherTotalValue}
                </Text>
              </>
            ) : (
              <Text style={styles.voucherMeta}>No Instantlly vouchers available.</Text>
            )}

            <TouchableOpacity
              style={[
                styles.voucherApplyButton,
                (voucherBalance <= 0 || voucherApplied || voucherLoading) && styles.voucherApplyButtonDisabled,
              ]}
              onPress={handleApplyVouchers}
              disabled={voucherBalance <= 0 || voucherApplied || voucherLoading}
            >
              <Text style={styles.voucherApplyText}>
                {voucherApplied ? 'Vouchers Redeemed' : 'Redeem Vouchers'}
              </Text>
            </TouchableOpacity>

            {voucherApplied && orderData?.voucherQtyApplied ? (
              <Text style={styles.voucherAppliedNote}>
                Applied {orderData.voucherQtyApplied} voucher(s) · -₹{orderData.voucherAmountApplied || 0}
              </Text>
            ) : null}
          </View>

          {voucherApplied ? (
            <View style={styles.payableCard}>
              <Text style={styles.payableLabel}>PAYABLE NOW</Text>
              <Text style={styles.payableValue}>₹{payableAmount}</Text>
            </View>
          ) : null}

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
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              {tableColumns.map((column, index) => (
                <Text
                  key={column.key}
                  style={[
                    styles.tableHeaderCell,
                    { flex: column.flex },
                    index !== tableColumns.length - 1 && styles.tableCellBorder,
                  ]}
                >
                  {column.label}
                </Text>
              ))}
            </View>
            {chartRows.map((row, index) => (
              <View
                key={row.rank}
                style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
              >
                {tableColumns.map((column, colIndex) => (
                  <Text
                    key={column.key}
                    style={[
                      styles.tableCell,
                      { flex: column.flex },
                      colIndex !== tableColumns.length - 1 && styles.tableCellBorder,
                    ]}
                  >
                    {column.isRank
                      ? row.rank === 21
                        ? 'NR'
                        : `${row.rank}`
                      : (row as any)[column.key] ?? '-'}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.summaryBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#166534" />
          <Text style={styles.summaryText}>
            This pricing reflects your Platinum tier benefits.
          </Text>
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
              <Text style={styles.payButtonText}>
                {voucherApplied && payableAmount <= 0
                  ? 'Confirm Voucher'
                  : payableAmount > 0
                    ? `Pay ₹${payableAmount}`
                    : 'Pay Now'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <SelectionModal
        visible={areaModalVisible}
        title="Select Area Type"
        options={areaTypeOptions}
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
  sectionSubtitle: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerText: { fontSize: 14, color: '#111827', flex: 1 },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 8,
  },
  priceLabel: { fontSize: 10, fontWeight: '800', color: '#2563EB', letterSpacing: 0.6 },
  priceValue: { fontSize: 22, fontWeight: '800', color: '#2563EB', marginTop: 2 },
  quoteRefreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
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
  tableTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 3,
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableCellBorder: {
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  tableCell: {
    fontSize: 9,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    paddingVertical: 5,
    paddingHorizontal: 3,
  },
  voucherCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  voucherHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voucherInfoButton: {
    padding: 2,
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  voucherMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  voucherApplyButton: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  voucherApplyButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  voucherApplyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voucherAppliedNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
  payableCard: {
    marginTop: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  payableLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.6,
  },
  payableValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#166534',
    marginTop: 4,
  },
  summaryBanner: {
    marginTop: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: { fontSize: 11, color: '#166534', flex: 1 },
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
});
