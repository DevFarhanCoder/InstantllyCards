import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  AppState,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import SummaryCard from "./SummaryCard";
import VoucherStatsCard from "./VoucherStatsCard";
import NetworkTreeView from "./NetworkTreeView";
import NetworkListView from "./NetworkListView";
import TransferCreditsModal from "./TransferCreditsModal";
import SpecialCreditsTransferModal from "./SpecialCreditsTransferModal";
import VoucherTransferModal from "./VoucherTransferModal";
import NetworkDetailBottomSheet from "./NetworkDetailBottomSheet";
import DiscountDashboardCard from "./DiscountDashboardCard";
import DirectBuyersList from "./DirectBuyersList";
import BuyVoucherScreen from "./BuyVoucherScreen";
import DistributionCreditsTable from "./DistributionCreditsTable";
import MLMTransferStatusCard from "./MLMTransferStatusCard";
import api from "../lib/api";
import {
  DiscountSummary,
  CreditStatistics,
  DirectBuyer,
  NetworkMetrics,
  NetworkUser,
  VoucherItem,
  ViewMode,
} from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";
import { useMlmTransferStore } from "../lib/mlmTransferStore";
import { formatSecondsCompact } from "../lib/mlmTransferUi";

interface VoucherDashboardProps {
  onBack: () => void;
  voucherId?: string;
  isActive?: boolean;
}

export default function VoucherDashboard({
  onBack,
  voucherId,
  isActive = true,
}: VoucherDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [specialTransferModalVisible, setSpecialTransferModalVisible] =
    useState(false);
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(
    null,
  );
  const [selectedCampaignVoucherId, setSelectedCampaignVoucherId] = useState<
    string | null
  >(voucherId || null);
  const [selectedSlotCredits, setSelectedSlotCredits] = useState<number>(0);
  const [voucherTransferModalVisible, setVoucherTransferModalVisible] =
    useState(false);
  const [selectedRecipient, setSelectedRecipient] =
    useState<NetworkUser | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(
    null,
  );
  const [detailSheetVisible, setDetailSheetVisible] = useState(false);
  const [detailUser, setDetailUser] = useState<NetworkUser | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [showBuyVoucherScreen, setShowBuyVoucherScreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    availableCredits: 0,
    totalVouchersTransferred: 0,
    totalNetworkUsers: 0,
    virtualCommission: 0,
    currentDiscountPercent: 0,
  });
  const [creditStats, setCreditStats] = useState<CreditStatistics>({
    totalCreditReceived: 0,
    totalCreditTransferred: 0,
    totalCreditBalance: 0,
    creditTransferToEachPerson: [],
    creditTransferredReceivedBack: 0,
    activeCredits: 0,
    timers: [],
  });
  const [discountSummary, setDiscountSummary] = useState<DiscountSummary>({
    currentLevel: 1,
    discountPercent: 40,
    payableAmount: 3600,
    virtualCommission: 0,
    disclaimer:
      "This amount represents savings unlocked via discounts and is not withdrawable.",
  });
  const [rootUser, setRootUser] = useState<NetworkUser | null>(null);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [directBuyers, setDirectBuyers] = useState<DirectBuyer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMLMUser, setIsMLMUser] = useState(false); // Track if user came via introducer
  const [distributionCredits, setDistributionCredits] = useState<any[]>([]); // Credits to be transferred
  const [isVoucherAdmin, setIsVoucherAdmin] = useState(false); // Track if user is voucher admin
  const [hasSpecialCredits, setHasSpecialCredits] = useState(false); // Track if user has special credits slots
  const [specialCredits, setSpecialCredits] = useState<any>(null); // Special credits data for admin
  const [networkSlots, setNetworkSlots] = useState<any[]>([]); // Network slots with placeholders
  const [slotsSummary, setSlotsSummary] = useState<any>(null);
  const transfersById = useMlmTransferStore((state) => state.transfersById);
  const syncDashboardTransfers = useMlmTransferStore(
    (state) => state.setFromDashboard,
  );
  const syncDistributionLocks = useMlmTransferStore(
    (state) => state.setFromDistribution,
  );
  const syncSlotLocks = useMlmTransferStore((state) => state.setFromSlots);
  const clearMlmTransferState = useMlmTransferStore((state) => state.clear);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const foregroundDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const activeVoucherIdRef = useRef<string | null>(voucherId || null);
  const requestSeqRef = useRef(0);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const activeTransfers = useMemo(
    () => Object.values(transfersById),
    [transfersById],
  );

  const mapTree = (node: any): NetworkUser => {
    const children = (node.directChildren || []).map(mapTree);
    // Show only immediate depth children count for each node.
    const totalNetworkCount = children.length;

    return {
      id: node.id,
      name: node.name,
      phone: node.phone,
      avatar: undefined,
      creditsReceived: 0,
      level: node.level || 0,
      directChildren: children,
      totalNetworkCount,
      directCount: node.directCount || children.length,
      structuralCreditPool: node.structuralCreditPool,
      joinedDate: node.joinedDate,
      commissionEarned: 0,
      isActive: true,
    };
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const pickPayload = (res: any) =>
    res?.success !== undefined ? res : res?.data;

  const withRetry = async <T,>(
    fn: () => Promise<T>,
    retries = 2,
  ): Promise<T> => {
    let lastErr: any;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await fn();
      } catch (err: any) {
        lastErr = err;
        const status = err?.status ?? 0;
        const transient =
          status === 0 ||
          status >= 500 ||
          err?.name === "AbortError" ||
          err?.message?.includes("Network") ||
          err?.message?.includes("Failed to fetch");
        if (!transient || attempt === retries) break;
        await sleep(500 * 2 ** attempt);
      }
    }
    throw lastErr;
  };

  const normalizeSlotsPayload = (slots: any[] = []) =>
    slots.map((slot: any) => ({
      id: slot.recipientId || `slot-${slot.slotNumber}`,
      slotNumber: slot.slotNumber,
      status: slot.status,
      isPlaceholder:
        slot?.isPlaceholder === true ||
        slot?.isAvailable === true ||
        slot?.status === "available",
      name: slot.recipientName || slot.name || "",
      phone: slot.recipientPhone || slot.phone || "",
      credits: slot.creditAmount ?? slot.credits ?? 0,
      recipientLevel: slot.recipientLevel || slot.level || 1,
      sentAt: slot.sentAt,
      transferId: slot.transferId ?? null,
      isLocked: slot.isLocked === true,
      lockReason: slot.lockReason ?? null,
      timeLeftSeconds: Number(slot.timeLeftSeconds) || 0,
    }));

  const getVoucherScopedTransfer = (payload: any, _dashboard: any) => {
    const transfers = Array.isArray(payload?.activeTransfers)
      ? payload.activeTransfers
      : [];

    if (!transfers.length) {
      return [];
    }

    const sortByLatest = (items: any[]) =>
      [...items].sort((a, b) => {
        const aTime = Date.parse(a?.timerStartedAt || a?.expiresAt || 0);
        const bTime = Date.parse(b?.timerStartedAt || b?.expiresAt || 0);
        return bTime - aTime;
      });

    const pendingUnlock = sortByLatest(
      transfers.filter((transfer) => transfer?.status === "pending_unlock"),
    );
    if (pendingUnlock.length > 0) {
      return [pendingUnlock[0]];
    }

    const unlocked = sortByLatest(
      transfers.filter((transfer) => transfer?.status === "unlocked"),
    );
    if (unlocked.length > 0) {
      return [unlocked[0]];
    }

    return [sortByLatest(transfers)[0]];
  };

  const getUnlockedSpecialCredits = (slots: any[] = []) =>
    slots.reduce((sum, slot) => {
      const isAvailable = slot?.status === "available" || slot?.isAvailable === true;
      if (isAvailable && slot?.isLocked === false) {
        return sum + (Number(slot?.creditAmount ?? slot?.credits) || 0);
      }
      return sum;
    }, 0);

  const loadDashboard = async (showLoader: boolean = true) => {
    const requestId = ++requestSeqRef.current;
    const requestedVoucherId = voucherId || null;
    const isStale = () => requestId !== requestSeqRef.current;
    const isVoucherStale = (id: string | null) =>
      activeVoucherIdRef.current !== id;

    try {
      if (showLoader) {
        setLoading(true);
      }
      setTreeLoading(true);
      if (voucherId) {
        setSlotsLoading(true);
      }
      setError(null);
      const treeVoucherParam = voucherId ? `&voucherId=${voucherId}` : "";
      const treePath = `/mlm/network/tree?depth=3&perParentLimit=5${treeVoucherParam}`;
      const buyersPath = `/mlm/network/direct-buyers?limit=10${voucherId ? `&voucherId=${voucherId}` : ""}`;

      const [
        overview,
        creditDashboard,
        discount,
        voucherRes,
        userProfile,
        distributionRes,
        treeRes,
        buyerRes,
      ] = await Promise.all([
        withRetry(() => api.get("/mlm/overview")),
        withRetry(() => api.get("/mlm/credits/dashboard")),
        withRetry(() => api.get("/mlm/discount/summary")),
        withRetry(() => api.get("/mlm/vouchers?limit=20")),
        withRetry(() => api.get("/users/profile")),
        withRetry(() => api.get("/mlm/distribution-credits")),
        withRetry(() => api.get(treePath)),
        withRetry(() => api.get(buyersPath)),
      ]);
      if (isStale()) return;
      if (isVoucherStale(requestedVoucherId)) return;
      const pOverview = pickPayload(overview);
      const pCreditDashboard = pickPayload(creditDashboard);
      const pDiscount = pickPayload(discount);
      const pVoucherRes = pickPayload(voucherRes);
      const pUserProfile = pickPayload(userProfile);
      const pDistributionRes = pickPayload(distributionRes);
      const pTreeRes = pickPayload(treeRes);
      const pBuyerRes = pickPayload(buyerRes);

      // Check if user is voucher admin from overview
      const isAdmin = pOverview?.user?.isVoucherAdmin === true;
      setIsVoucherAdmin(isAdmin);

      // Check if user has special credits (slots > 0)
      const userHasSpecialCredits =
        pOverview?.user?.specialCredits?.availableSlots > 0;
      setHasSpecialCredits(userHasSpecialCredits);

      let specialCreditsData = null;
      let specialActiveTransfers: any[] = [];
      let networkSlotsData: any[] | null = null;
      let voucherScopedSlots: any[] = [];
      let slotsLoaded = false;
      const voucherSlotsErrorMessage =
        "Failed to load voucher slots for this campaign.";

      // When a specific voucher is selected, ALWAYS load per-voucher data
      // for ALL users — ensures every voucher shows its own isolated stats (zeros for new vouchers).
      // NOTE: Non-admin users receive slots under the SENDER's campaign voucher ID (e.g. DoubtX).
      // If they navigate via their OWN Instantlly voucher, filtering by that voucher ID would
      // return 0 slots. So for non-admins we always load the global (unfiltered) view.
      if (voucherId) {
        try {
          const voucherParam = voucherId ? `?voucherId=${voucherId}` : "";
          const specialDashboardPath = `/mlm/special-credits/dashboard${voucherParam}`;
          const specialNetworkPath = `/mlm/special-credits/network${voucherParam}`;
          const specialSlotsPath = `/mlm/special-credits/slots${voucherParam}`;

          const [specialCreditsRes, networkSlotsRes, slotsRes] =
            await Promise.all([
              withRetry(() => api.get(specialDashboardPath)),
              withRetry(() => api.get(specialNetworkPath)),
              withRetry(() => api.get(specialSlotsPath)),
            ]);
          if (isStale()) return;
          if (isVoucherStale(requestedVoucherId)) return;
          const pSpecialCreditsRes = pickPayload(specialCreditsRes);
          const pNetworkSlotsRes = pickPayload(networkSlotsRes);
          const pSlotsRes = pickPayload(slotsRes);

          if (pSpecialCreditsRes?.dashboard) {
            specialCreditsData = pSpecialCreditsRes.dashboard;
            setSpecialCredits(specialCreditsData);
          }
          specialActiveTransfers = getVoucherScopedTransfer(
            pSpecialCreditsRes,
            pSpecialCreditsRes?.dashboard,
          );

          const slotsPayload = pSlotsRes?.slots;
          if (!Array.isArray(slotsPayload)) {
            setNetworkSlots([]);
            setSlotsSummary(null);
            setSpecialCredits(null);
            setSlotsLoading(false);
            setTreeLoading(false);
            setError(voucherSlotsErrorMessage);
            return;
          }

          voucherScopedSlots = slotsPayload;
          setSlotsSummary(pSlotsRes?.summary ?? null);
          if (Array.isArray(slotsPayload)) {
            slotsLoaded = true;
            syncSlotLocks(slotsPayload);
            const normalizedSlots = normalizeSlotsPayload(slotsPayload);
            const networkUsersBySlotNumber = new Map<number, any>();
            (pNetworkSlotsRes?.networkUsers || []).forEach((slot: any) => {
              const slotNumber = Number(slot?.slotNumber);
              if (Number.isFinite(slotNumber)) {
                networkUsersBySlotNumber.set(slotNumber, slot);
              }
            });
            networkSlotsData = normalizedSlots.map((slot) => {
              const networkSlot = networkUsersBySlotNumber.get(slot.slotNumber);
              if (!networkSlot) {
                return slot;
              }
              return {
                ...slot,
                name: networkSlot.name || slot.name,
                phone: networkSlot.phone || slot.phone,
                credits: networkSlot.credits ?? slot.credits,
                recipientLevel:
                  networkSlot.recipientLevel ?? slot.recipientLevel,
                sentAt: networkSlot.sentAt || slot.sentAt,
                isPlaceholder:
                  networkSlot.isPlaceholder ?? slot.isPlaceholder,
              };
            });
            setNetworkSlots(networkSlotsData);
          } else {
            setNetworkSlots([]);
            setSlotsSummary(null);
            setSpecialCredits(null);
            setSlotsLoading(false);
            setTreeLoading(false);
            setError(voucherSlotsErrorMessage);
            return;
          }
          setSlotsLoading(false);
        } catch (err) {
          console.error("Special credits load error", err);
          clearMlmTransferState();
          setSlotsLoading(false);
          setNetworkSlots([]);
          setSlotsSummary(null);
          setSpecialCredits(null);
          setTreeLoading(false);
          setError(voucherSlotsErrorMessage);
          return;
        }
      } else {
        setSlotsLoading(false);
        setSlotsSummary(null);
        setNetworkSlots([]);
        setSpecialCredits(null);
      }

      if (voucherId) {
        // Per-voucher mode: show isolated data for the selected voucher only.
        const totalSlotsForVoucher = specialCreditsData?.slots?.total ?? 0;
        if (!isAdmin && totalSlotsForVoucher === 0 && !userHasSpecialCredits) {
          setShowBuyVoucherScreen(true);
        } else {
          setShowBuyVoucherScreen(false);
        }
        const unlockedVoucherCredits =
          getUnlockedSpecialCredits(voucherScopedSlots);
        setMetrics({
          availableCredits: unlockedVoucherCredits,
          totalVouchersTransferred:
            specialCreditsData?.specialCredits?.totalSent ?? 0,
          totalNetworkUsers: specialCreditsData?.slots?.used ?? 0,
          virtualCommission: specialCreditsData?.specialCredits?.totalSent ?? 0,
          currentDiscountPercent: 0,
          vouchersFigure: specialCreditsData?.vouchersFigure ?? 0,
        });
      } else if (pOverview?.metrics) {
        // No specific voucher — global view (original behaviour)
        if ((isAdmin || userHasSpecialCredits) && specialCreditsData) {
          setMetrics({
            availableCredits: specialCreditsData.specialCredits?.balance || 0,
            totalVouchersTransferred:
              specialCreditsData.specialCredits?.totalSent || 0,
            totalNetworkUsers: specialCreditsData.slots?.used || 0,
            virtualCommission:
              specialCreditsData.specialCredits?.totalSent || 0,
            currentDiscountPercent: 0,
            vouchersFigure:
              specialCreditsData.vouchersFigure ||
              pOverview.metrics?.vouchersFigure ||
              0,
          });
        } else {
          setMetrics(pOverview.metrics);
        }
      }

      if (pCreditDashboard) {
        syncDashboardTransfers(
          voucherId
            ? specialActiveTransfers
            : [
                ...(pCreditDashboard.activeTransfers || []),
                ...specialActiveTransfers,
              ],
        );
        setCreditStats({
          totalCreditReceived: pCreditDashboard.totalCreditsReceived || 0,
          totalCreditTransferred: pCreditDashboard.totalCreditsTransferred || 0,
          totalCreditBalance: pCreditDashboard.creditBalance || 0,
          creditTransferToEachPerson: pCreditDashboard.recentTransfers || [],
          creditTransferredReceivedBack: 0,
          activeCredits: pCreditDashboard.activeCredits || 0,
          timers: pCreditDashboard.timers || [],
        });
      }

      if (pDiscount?.summary) {
        setDiscountSummary(pDiscount.summary);
      }

      if (pTreeRes?.tree) {
        const treeRoot = mapTree(pTreeRes.tree);
        // Hydrate creditsReceived from slots data for voucher mode
        // (slots override only runs for global view below; voucher mode uses tree + slot credits)
        if (networkSlotsData && networkSlotsData.length > 0) {
          const creditByRecipientId = new Map<string, number>();
          for (const slot of networkSlotsData) {
            if (!slot.isPlaceholder && slot.id) {
              creditByRecipientId.set(slot.id, slot.credits || 0);
            }
          }
          const hydrateCredits = (node: any): any => ({
            ...node,
            creditsReceived:
              creditByRecipientId.get(node.id) ?? node.creditsReceived,
            directChildren: (node.directChildren || []).map(hydrateCredits),
          });
          setRootUser(hydrateCredits(treeRoot));
        } else {
          setRootUser(treeRoot);
        }
      }
      setTreeLoading(false);

      // For both global and voucher-scoped views, admin/special users use the
      // slots-based grid so the full picture (available + sent) matches the admin panel.
      if (
        voucherId &&
        slotsLoaded &&
        networkSlotsData !== null &&
        networkSlotsData.length > 0
      ) {
        // Show ALL slots — sent (filled) + available (placeholders)
        // so the full slot count matches the admin panel
        const allSlots = networkSlotsData;
        const transferSnapshot = useMlmTransferStore.getState().transfersById;
        const slotLockSnapshot =
          useMlmTransferStore.getState().slotLocksBySlotNumber;

        const rootNode: NetworkUser = {
          id: pOverview?.user?.id || "user",
          name: pOverview?.user?.name || "User",
          phone: pOverview?.user?.phone || "",
          avatar: undefined,
          creditsReceived: 0,
          level: pOverview?.user?.level || 1,
          directChildren: allSlots.map((slot: any) => ({
            ...(slot.transferId && transferSnapshot[slot.transferId]
              ? {
                  transferStatus: transferSnapshot[slot.transferId].status,
                  requiredVoucherCount:
                    transferSnapshot[slot.transferId].requiredVoucherCount,
                  currentVoucherCount:
                    transferSnapshot[slot.transferId].currentVoucherCount,
                }
              : {}),
            id: slot.id || `slot-${slot.slotNumber}`,
            name: slot.isPlaceholder ? `Slot ${slot.slotNumber}` : slot.name,
            phone: slot.isPlaceholder ? "" : slot.phone || "",
            avatar: undefined,
            creditsReceived: slot.credits || 0,
            level: slot.recipientLevel || slot.level || 1,
            directChildren: [],
            totalNetworkCount: 0,
            directCount: 0,
            joinedDate: slot.sentAt || new Date().toISOString(),
            commissionEarned: 0,
            isActive: !slot.isPlaceholder,
            isPlaceholder: slot.isPlaceholder || false,
            slotNumber: slot.slotNumber,
            transferId: slot.transferId ?? null,
            isLocked:
              slot.isLocked === true ||
              slotLockSnapshot[slot.slotNumber]?.isLocked === true,
            lockReason:
              slot.lockReason ??
              slotLockSnapshot[slot.slotNumber]?.lockReason ??
              null,
            timeLeftSeconds:
              Number(slot.timeLeftSeconds) ||
              slotLockSnapshot[slot.slotNumber]?.timeLeftSeconds ||
              0,
          })),
          totalNetworkCount: allSlots.length,
          directCount: allSlots.length,
          joinedDate: pOverview?.user?.createdAt || new Date().toISOString(),
          commissionEarned: 0,
          isActive: true,
        };
        setRootUser(rootNode);
      }

      if (pVoucherRes?.vouchers) {
        setVouchers(pVoucherRes.vouchers);
      } else {
        setVouchers([]);
      }

      // Check if user is MLM user (came via introducer)
      if (pUserProfile?.user?.introducerId) {
        setIsMLMUser(true);
      }

      // Load distribution credits
      if (pDistributionRes?.credits) {
        syncDistributionLocks(pDistributionRes.credits);
        setDistributionCredits(pDistributionRes.credits);
      }

      if (pBuyerRes?.buyers) {
        setDirectBuyers(pBuyerRes.buyers);
      }
    } catch (err: any) {
      if (isStale()) return;
      console.error("MLM dashboard load error", err);
      setError(err?.message || "Failed to load dashboard");
      setVouchers([]);
      setTreeLoading(false);
      setSlotsLoading(false);
    } finally {
      if (isStale()) return;
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const loadDashboardRef = useRef(loadDashboard);

  useEffect(() => {
    loadDashboardRef.current = loadDashboard;
  }, [loadDashboard]);

  useEffect(() => {
    if (!isActive) return;
    activeVoucherIdRef.current = voucherId || null;
    setSelectedCampaignVoucherId(voucherId || null);
    setSelectedSlotNumber(null);
    setSelectedSlotCredits(0);
    clearMlmTransferState();
    setNetworkSlots([]);
    setSlotsSummary(null);
    setSpecialCredits(null);
    loadDashboard(true);
  }, [voucherId, isActive, clearMlmTransferState]);

  useEffect(() => {
    if (!isActive) return;
    const countdownInterval = setInterval(() => {
      useMlmTransferStore.getState().tick();
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    pollIntervalRef.current = setInterval(() => {
      loadDashboardRef.current(false);
    }, 20000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [voucherId, isActive]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (!isActive) return;
      if (state === "active") {
        if (foregroundDebounceRef.current) {
          clearTimeout(foregroundDebounceRef.current);
        }
        foregroundDebounceRef.current = setTimeout(() => {
          loadDashboardRef.current(false);
        }, 500);
      }
    });

    return () => {
      if (foregroundDebounceRef.current) {
        clearTimeout(foregroundDebounceRef.current);
        foregroundDebounceRef.current = null;
      }
      sub.remove();
      clearMlmTransferState();
    };
  }, [isActive]);

  const handleTransferPress = (user: NetworkUser) => {
    if (user.isLocked) {
      const message = user.lockReason
        ? `${user.lockReason}${typeof user.timeLeftSeconds === "number" ? `\nTime left: ${formatSecondsCompact(user.timeLeftSeconds)}` : ""}`
        : "This transfer is locked until voucher requirements are met.";
      Alert.alert("Transfer Locked", message);
      return;
    }

    // For users with special credits (admin OR regular users with slots) clicking placeholder slots
    if ((isVoucherAdmin || hasSpecialCredits) && user.isPlaceholder) {
      const slotNumber = user.slotNumber ?? null;
      if (!voucherId || !slotNumber) {
        Alert.alert(
          "Voucher Required",
          "Please open a voucher campaign before sending special credits.",
        );
        return;
      }
      setSelectedSlotNumber(slotNumber);
      setSelectedSlotCredits(user.creditsReceived || 0);
      setSelectedCampaignVoucherId(voucherId);
      setSpecialTransferModalVisible(true);
    } else {
      // Regular transfer modal for non-placeholder users
      setSelectedRecipient(user);
      setTransferModalVisible(true);
    }
  };

  const handleBuyerTransferCredits = async (buyerId: string) => {
    try {
      const buyer = directBuyers.find((b) => b.id === buyerId);
      if (!buyer) return;

      // Show transfer modal for the buyer
      setSelectedRecipient({
        id: buyer.id,
        name: buyer.name,
        phone: buyer.phone,
        level: 1,
        directChildren: [],
        totalNetworkCount: 0,
        creditsReceived: 0,
        joinedDate: "",
        isActive: true,
      });
      setTransferModalVisible(true);
    } catch (error: any) {
      console.error("Buyer credit transfer error:", error);
    }
  };

  const handleBuyerTransferVouchers = async (buyerId: string) => {
    try {
      const buyer = directBuyers.find((b) => b.id === buyerId);
      if (!buyer) return;

      if (isVoucherAdmin) {
        // Admin can transfer vouchers to anyone - use admin transfer
        handleAdminVoucherTransfer();
      } else {
        // Find an unredeemed voucher to transfer (exclude special voucher)
        const unredeemedVoucher = vouchers.find(
          (v) =>
            v.redeemedStatus === "unredeemed" &&
            v._id !== "instantlly-special-credits" &&
            !v.isSpecialCreditsVoucher,
        );

        if (!unredeemedVoucher) {
          // No vouchers available - this is normal, just return silently
          return;
        }

        // Set the voucher and show voucher transfer modal
        setSelectedVoucher(unredeemedVoucher);
        setVoucherTransferModalVisible(true);
      }
    } catch (error: any) {
      console.error("Buyer voucher transfer error:", error);
    }
  };

  const handleDistributionTransfer = async (
    recipientId: string,
    amount: number,
  ) => {
    try {
      await api.post("/mlm/credits/transfer", {
        receiverId: recipientId,
        amount,
        note: "Distribution credit transfer",
      });
      await loadDashboard();
    } catch (error: any) {
      console.error("Distribution transfer error:", error);
    }
  };

  const handleTransferConfirm = (amount: number, note: string) => {
    if (!selectedRecipient) return;
    api
      .post("/mlm/credits/transfer", {
        receiverId: selectedRecipient.id,
        amount,
        note,
      })
      .then(() => loadDashboard())
      .finally(() => setTransferModalVisible(false));
  };

  const handleSpecialCreditsTransfer = async (phone: string) => {
    const scopedVoucherId = selectedCampaignVoucherId || voucherId || null;
    try {
      if (!scopedVoucherId || !selectedSlotNumber) {
        throw new Error("Missing voucher or slot context for special transfer.");
      }
      await api.post("/mlm/special-credits/send", {
        recipientPhone: phone,
        slotNumber: selectedSlotNumber,
        voucherId: scopedVoucherId,
      });
      await loadDashboard();
      setSpecialTransferModalVisible(false);
      Alert.alert("Success", "Credits transferred successfully!");
    } catch (error: any) {
      console.error("Special credits transfer error:", {
        voucherId: scopedVoucherId,
        slotNumber: selectedSlotNumber,
        error,
      });
      
      // Extract error message from various possible locations
      let errorMessage = "Failed to transfer credits. Please try again.";
      
      // Check different error structures
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.data?.lockReason) {
        errorMessage = error.data.lockReason;
      }
      
      // Add time left if available
      const timeLeftSeconds = Number(error?.data?.timeLeftSeconds);
      if (Number.isFinite(timeLeftSeconds) && timeLeftSeconds > 0) {
        errorMessage += `\nTime left: ${formatSecondsCompact(timeLeftSeconds)}`;
      }
      
      throw new Error(errorMessage);
    }
  };

  const handleViewNetwork = (user: NetworkUser) => {
    setDetailUser(user);
    setBreadcrumb([rootUser?.name || "You", user.name]);
    setDetailSheetVisible(true);
  };

  const handleUserSelectInSheet = (
    user: NetworkUser,
    newBreadcrumb: string[],
  ) => {
    setDetailUser(user);
    setBreadcrumb(newBreadcrumb);
  };

  const handleVoucherTransfer = (voucher: VoucherItem) => {
    setSelectedVoucher(voucher);
    setVoucherTransferModalVisible(true);
  };

  const handleAdminVoucherTransfer = () => {
    if (!voucherId) {
      Alert.alert(
        "Voucher Required",
        "Please open a voucher campaign before transferring admin vouchers.",
      );
      return;
    }

    setSelectedCampaignVoucherId(voucherId);

    // For admin, create a virtual voucher object to open the modal
    const adminVoucher: VoucherItem = {
      _id: "admin-voucher-transfer",
      voucherNumber: "ADMIN-TRANSFER",
      MRP: 1200,
      issueDate: new Date().toISOString(),
      expiryDate: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      redeemedStatus: "unredeemed",
      isSpecialCreditsVoucher: true,
    };
    setSelectedVoucher(adminVoucher);
    setVoucherTransferModalVisible(true);
  };

  const handleVoucherTransferConfirm = async (
    targetVoucherId: string,
    recipientPhone: string,
    quantity: number,
  ) => {
    try {
      // If admin is transferring, use special endpoint to create vouchers
      if (isVoucherAdmin && targetVoucherId === "admin-voucher-transfer") {
        const scopedVoucherId = selectedCampaignVoucherId || voucherId || null;
        if (!scopedVoucherId) {
          throw new Error("Missing voucher context for admin voucher transfer.");
        }
        await api.post(`/mlm/vouchers/admin-transfer`, {
          recipientPhone,
          quantity,
          voucherId: scopedVoucherId,
        });
      } else {
        // Regular user transferring their own voucher
        await api.post(`/mlm/vouchers/${targetVoucherId}/transfer`, {
          recipientPhone,
          quantity,
        });
      }
      await loadDashboard();
      setVoucherTransferModalVisible(false);
    } catch (error: any) {
      console.error("Voucher transfer error:", error);
      throw error; // Re-throw to let modal handle error display
    }
  };

  const ViewToggle = () => {
    const slideAnim = React.useRef(
      new Animated.Value(viewMode === "list" ? 0 : 1),
    ).current;

    React.useEffect(() => {
      Animated.spring(slideAnim, {
        toValue: viewMode === "list" ? 0 : 1,
        useNativeDriver: true,
      }).start();
    }, [viewMode]);

    return (
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === "list" && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode("list")}
        >
          <Ionicons
            name="list"
            size={20}
            color={viewMode === "list" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={[
              styles.toggleButtonText,
              viewMode === "list" && styles.toggleButtonTextActive,
            ]}
          >
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === "tree" && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode("tree")}
        >
          <Ionicons
            name="git-network"
            size={20}
            color={viewMode === "tree" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={[
              styles.toggleButtonText,
              viewMode === "tree" && styles.toggleButtonTextActive,
            ]}
          >
            Tree
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonChip} />
          <View style={styles.skeletonChip} />
          <View style={styles.skeletonChip} />
        </View>
        <ActivityIndicator size="small" color="#10B981" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadDashboard(true)}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!rootUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No network data available</Text>
      </View>
    );
  }
  // Show Buy Voucher Screen if navigated
  if (showBuyVoucherScreen) {
    return (
      <BuyVoucherScreen
        onBack={() => setShowBuyVoucherScreen(false)}
        onSuccess={loadDashboard}
      />
    );
  }

  const availableVouchers = vouchers.filter(
    (v) => !v.redeemedStatus || v.redeemedStatus === "unredeemed",
  ).length;
  const redeemedVouchers = vouchers.filter(
    (v) => v.redeemedStatus === "redeemed",
  ).length;
  const treeChildrenCount = rootUser?.directChildren?.length || 0;
  const isSlotsEmpty =
    !!voucherId && !slotsLoading && networkSlots.length === 0;
  const isVoucherTreeEmpty =
    !!voucherId && !treeLoading && treeChildrenCount === 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#FFFFFF", "#F9FAFB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Vouchers & Network</Text>
            <Text style={styles.headerSubtitle}>
              {isVoucherAdmin
                ? "Sales Target at Special Discount"
                : "5× Referral Credit Distribution"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() =>
                router.push(
                  `/referral/credits-history${voucherId ? `?voucherId=${voucherId}` : ""}` as any,
                )
              }
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={20} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Network Overview Stats */}
        <SummaryCard metrics={metrics} isVoucherAdmin={isVoucherAdmin} />
        <MLMTransferStatusCard transfers={activeTransfers} />

        {/* Voucher Stats Card - Clickable to Buy - HIDDEN for Admin and Special Credits Users */}
        {!isVoucherAdmin && !hasSpecialCredits && (
          <VoucherStatsCard
            totalVouchers={vouchers.length}
            availableVouchers={availableVouchers}
            redeemedVouchers={redeemedVouchers}
            onBuyNowPress={() => setShowBuyVoucherScreen(true)}
          />
        )}

        {/* Distribution Credits Table - Only for MLM users */}
        {isMLMUser && distributionCredits.length > 0 && (
          <DistributionCreditsTable
            credits={distributionCredits}
            onTransfer={handleDistributionTransfer}
          />
        )}

        {/* Discount Dashboard - HIDDEN for Admin */}
        {!isVoucherAdmin && <DiscountDashboardCard summary={discountSummary} />}

        {/* Voucher List - COMPLETELY HIDDEN */}
        {/* Removed as per requirements */}

        {/* Direct Buyers - Only show if there are buyers */}
        {directBuyers && directBuyers.length > 0 && (
          <DirectBuyersList
            buyers={directBuyers}
            onTransferCredits={handleBuyerTransferCredits}
            onTransferVouchers={handleBuyerTransferVouchers}
            onTransfer={isVoucherAdmin ? handleAdminVoucherTransfer : undefined}
          />
        )}

        {/* View Toggle */}
        <ViewToggle />

        {/* Network Visualization */}
        <View style={styles.networkContainer}>
          {isSlotsEmpty && (
            <View style={styles.emptySlotsBanner}>
              <Ionicons name="layers-outline" size={16} color="#9A3412" />
              <Text style={styles.emptySlotsText}>
                0 slots for this voucher campaign.
              </Text>
            </View>
          )}
          {isVoucherTreeEmpty && (
            <View style={styles.emptyVoucherTreeBanner}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#1D4ED8"
              />
              <Text style={styles.emptyVoucherTreeText}>
                No network yet for this voucher campaign.
              </Text>
            </View>
          )}
          {viewMode === "list" ? (
            <NetworkListView
              rootUser={rootUser}
              onTransferPress={handleTransferPress}
              onViewNetwork={handleViewNetwork}
            />
          ) : (
            <NetworkTreeView
              rootUser={rootUser}
              onTransferPress={handleTransferPress}
              onViewNetwork={handleViewNetwork}
            />
          )}
        </View>
      </ScrollView>

      {/* Transfer Credits Modal */}
      <TransferCreditsModal
        visible={transferModalVisible}
        recipient={selectedRecipient}
        availableCredits={metrics.availableCredits}
        onClose={() => setTransferModalVisible(false)}
        onConfirm={handleTransferConfirm}
      />

      {/* Special Credits Transfer Modal - For Admin */}
      <SpecialCreditsTransferModal
        visible={specialTransferModalVisible}
        slotNumber={selectedSlotNumber}
        creditAmount={selectedSlotCredits}
        onClose={() => setSpecialTransferModalVisible(false)}
        onConfirm={handleSpecialCreditsTransfer}
      />

      {/* Network Detail Bottom Sheet */}
      <NetworkDetailBottomSheet
        visible={detailSheetVisible}
        user={detailUser}
        breadcrumb={breadcrumb}
        onClose={() => setDetailSheetVisible(false)}
        onUserSelect={handleUserSelectInSheet}
        onTransferPress={handleTransferPress}
      />

      {/* Voucher Transfer Modal */}
      <VoucherTransferModal
        visible={voucherTransferModalVisible}
        voucher={selectedVoucher}
        onClose={() => setVoucherTransferModalVisible(false)}
        onConfirm={handleVoucherTransferConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(16),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: scaleSize(4),
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: scaleSize(12),
  },
  headerTitle: {
    fontSize: scaleFontSize(22),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: scaleFontSize(14),
    color: "#6B7280",
  },
  headerActions: {
    flexDirection: "row",
    gap: scaleSize(8),
  },
  historyButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: scaleSize(10),
    padding: scaleSize(10),
    justifyContent: "center",
    alignItems: "center",
  },
  transferVoucherButton: {
    borderRadius: scaleSize(12),
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  transferVoucherGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: scaleSize(14),
    paddingVertical: scaleSize(10),
  },
  transferVoucherText: {
    fontSize: scaleFontSize(13),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoButton: {
    padding: scaleSize(4),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scaleSize(20),
    paddingBottom: scaleSize(100),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: scaleSize(20),
  },
  loadingText: {
    fontSize: scaleFontSize(16),
    color: "#64748B",
    marginTop: scaleSize(12),
  },
  skeletonCard: {
    width: "100%",
    height: scaleSize(90),
    borderRadius: scaleSize(14),
    backgroundColor: "#E5E7EB",
    marginBottom: scaleSize(14),
  },
  skeletonRow: {
    flexDirection: "row",
    gap: scaleSize(8),
    marginBottom: scaleSize(14),
  },
  skeletonChip: {
    width: scaleSize(80),
    height: scaleSize(26),
    borderRadius: scaleSize(999),
    backgroundColor: "#E5E7EB",
  },
  errorText: {
    fontSize: scaleFontSize(16),
    color: "#EF4444",
    textAlign: "center",
    marginBottom: scaleSize(12),
  },
  retryButton: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(10),
  },
  retryText: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#0F172A",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: scaleSize(12),
    padding: scaleSize(4),
    marginBottom: scaleSize(20),
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleSize(12),
    borderRadius: scaleSize(10),
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#10B981",
  },
  toggleButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
  },
  networkContainer: {
    flex: 1,
    minHeight: scaleSize(400),
  },
  emptyVoucherTreeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#DBEAFE",
    borderRadius: scaleSize(10),
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(10),
    marginBottom: scaleSize(12),
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  emptyVoucherTreeText: {
    fontSize: scaleFontSize(13),
    color: "#1E3A8A",
    fontWeight: "600",
  },
  emptySlotsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFEDD5",
    borderRadius: scaleSize(10),
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(10),
    marginBottom: scaleSize(8),
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  emptySlotsText: {
    fontSize: scaleFontSize(13),
    color: "#9A3412",
    fontWeight: "600",
  },
  debugPanel: {
    backgroundColor: "#111827",
    borderRadius: scaleSize(10),
    padding: scaleSize(10),
    marginBottom: scaleSize(12),
  },
  debugTitle: {
    color: "#F9FAFB",
    fontSize: scaleFontSize(12),
    fontWeight: "700",
    marginBottom: scaleSize(6),
  },
  debugText: {
    color: "#D1D5DB",
    fontSize: scaleFontSize(11),
    marginBottom: 2,
  },
});
