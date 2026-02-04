/**
 * Compatibility wrapper for older code that expected a Play Store referrer helper.
 *
 * We no longer rely on native install-referrer libraries. Instead, deep-linking
 * via `Linking.getInitialURL()` is used (see `src/utils/referral.ts`).
 *
 * This file preserves the exported function name for any callers but delegates
 * to the safe deep-linking implementation.
 */
import { captureInitialReferralIfPresent } from '../utils/referral';

export async function getPlayStoreReferrer(): Promise<string | null> {
  // Delegate to the safe deep-link based capture function.
  return await captureInitialReferralIfPresent();
}

export async function resetReferrerProcessing(): Promise<void> {
  // No-op: deep-linking approach only uses pending_referral_code key.
  return;
}
