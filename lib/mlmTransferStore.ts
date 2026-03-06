import { create } from "zustand";

export type MlmTransferStatus =
  | "pending_unlock"
  | "unlocked"
  | "returned_timeout"
  | "partial_timeout_review"
  | string;

export interface MlmActiveTransfer {
  transferId: string;
  status: MlmTransferStatus;
  requiredVoucherCount?: number;
  currentVoucherCount?: number;
  timerStartedAt?: string;
  expiresAt?: string;
  timeLeftSeconds?: number;
  slotCount?: number;
  slotAmount?: number;
  unlockedSlots?: number;
}

export interface MlmSlotLock {
  slotNumber: number;
  transferId?: string | null;
  isLocked: boolean;
  lockReason?: string | null;
  timeLeftSeconds?: number;
}

interface MlmTransferState {
  transfersById: Record<string, MlmActiveTransfer>;
  slotLocksBySlotNumber: Record<number, MlmSlotLock>;
  lastSyncAt: number | null;
  setFromDashboard: (activeTransfers?: any[]) => void;
  setFromDistribution: (credits?: any[]) => void;
  setFromSlots: (slots?: any[]) => void;
  tick: () => void;
  clear: () => void;
}

const toInt = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const useMlmTransferStore = create<MlmTransferState>((set) => ({
  transfersById: {},
  slotLocksBySlotNumber: {},
  lastSyncAt: null,

  setFromDashboard: (activeTransfers = []) =>
    set((state) => {
      if (!Array.isArray(activeTransfers)) return state;

      const nextTransfers: Record<string, MlmActiveTransfer> = {};
      activeTransfers.forEach((item) => {
        const transferId = item?.transferId;
        if (!transferId) return;
        nextTransfers[transferId] = {
          transferId,
          status: item?.status || "pending_unlock",
          requiredVoucherCount: toInt(item?.requiredVoucherCount, 0),
          currentVoucherCount: toInt(item?.currentVoucherCount, 0),
          timerStartedAt: item?.timerStartedAt,
          expiresAt: item?.expiresAt,
          timeLeftSeconds: toInt(item?.timeLeftSeconds, 0),
          slotCount: toInt(item?.slotCount, 0),
          slotAmount: toInt(item?.slotAmount, 0),
          unlockedSlots: toInt(item?.unlockedSlots, 0),
        };
      });

      return {
        ...state,
        transfersById: nextTransfers,
        lastSyncAt: Date.now(),
      };
    }),

  setFromDistribution: (credits = []) =>
    set((state) => {
      if (!Array.isArray(credits)) return state;
      const nextLocks = { ...state.slotLocksBySlotNumber };

      credits.forEach((row) => {
        const slotNumber = Number(row?.slotNumber);
        if (!Number.isFinite(slotNumber) || slotNumber <= 0) return;

        const existing = nextLocks[slotNumber];
        nextLocks[slotNumber] = {
          slotNumber,
          transferId: row?.transferId ?? existing?.transferId ?? null,
          // Legacy compatibility: missing field means unlocked
          isLocked: row?.isLocked === true,
          lockReason: row?.lockReason ?? existing?.lockReason ?? null,
          timeLeftSeconds: toInt(
            row?.timeLeftSeconds,
            existing?.timeLeftSeconds ?? 0,
          ),
        };
      });

      return {
        ...state,
        slotLocksBySlotNumber: nextLocks,
        lastSyncAt: Date.now(),
      };
    }),

  setFromSlots: (slots = []) =>
    set((state) => {
      if (!Array.isArray(slots)) return state;
      const nextLocks = { ...state.slotLocksBySlotNumber };

      slots.forEach((slot) => {
        const slotNumber = Number(slot?.slotNumber);
        if (!Number.isFinite(slotNumber) || slotNumber <= 0) return;
        const existing = nextLocks[slotNumber];
        nextLocks[slotNumber] = {
          slotNumber,
          transferId: slot?.transferId ?? existing?.transferId ?? null,
          // Legacy compatibility: missing field means unlocked
          isLocked: slot?.isLocked === true,
          lockReason: slot?.lockReason ?? existing?.lockReason ?? null,
          timeLeftSeconds: toInt(
            slot?.timeLeftSeconds,
            existing?.timeLeftSeconds ?? 0,
          ),
        };
      });

      return {
        ...state,
        slotLocksBySlotNumber: nextLocks,
        lastSyncAt: Date.now(),
      };
    }),

  tick: () =>
    set((state) => {
      const nextTransfers: Record<string, MlmActiveTransfer> = {};
      Object.entries(state.transfersById).forEach(([transferId, transfer]) => {
        const secs = Math.max(0, toInt(transfer.timeLeftSeconds, 0) - 1);
        nextTransfers[transferId] = { ...transfer, timeLeftSeconds: secs };
      });

      const nextLocks: Record<number, MlmSlotLock> = {};
      Object.entries(state.slotLocksBySlotNumber).forEach(([slotKey, lock]) => {
        const slotNumber = Number(slotKey);
        const secs = Math.max(0, toInt(lock.timeLeftSeconds, 0) - 1);
        nextLocks[slotNumber] = { ...lock, timeLeftSeconds: secs };
      });

      return {
        ...state,
        transfersById: nextTransfers,
        slotLocksBySlotNumber: nextLocks,
      };
    }),

  clear: () => ({ transfersById: {}, slotLocksBySlotNumber: {}, lastSyncAt: null }),
}));

