import { VoucherItem } from "../types/network";

export const VOUCHER_CACHE_MAX_AGE_MS = 30000;

interface VoucherCacheEntry {
  vouchers: VoucherItem[];
  fetchedAt: number;
}

let voucherListCache: VoucherCacheEntry | null = null;

export const getVoucherListCache = () => voucherListCache;

export const setVoucherListCache = (vouchers: VoucherItem[]) => {
  voucherListCache = {
    vouchers,
    fetchedAt: Date.now(),
  };
};

export const isVoucherListCacheFresh = (
  maxAgeMs: number = VOUCHER_CACHE_MAX_AGE_MS,
) => {
  if (!voucherListCache) return false;
  return Date.now() - voucherListCache.fetchedAt <= maxAgeMs;
};

export const getCachedAvailableVoucherCount = () => {
  if (!voucherListCache) return null;
  const count =
    voucherListCache.vouchers?.filter(
      (voucher) =>
        !voucher.redeemedStatus || voucher.redeemedStatus === "unredeemed",
    ).length ?? 0;
  return count;
};
