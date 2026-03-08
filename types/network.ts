// Network and Voucher System Types

export interface NetworkUser {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  creditsReceived: number;
  level: number;
  directChildren: NetworkUser[];
  totalNetworkCount: number; // Total users under this node
  directCount?: number;
  structuralCreditPool?: number;
  joinedDate: string;
  commissionEarned?: number;
  isActive: boolean;
  isPlaceholder?: boolean; // For special credits placeholder slots
  slotNumber?: number;
  transferId?: string | null;
  isLocked?: boolean;
  lockReason?: string | null;
  timeLeftSeconds?: number;
  transferStatus?: string;
  requiredVoucherCount?: number;
  currentVoucherCount?: number;
}

export interface NetworkMetrics {
  availableCredits: number;
  totalVouchersTransferred: number;
  totalNetworkUsers: number;
  virtualCommission: number; // Changed from estimatedCommission
  currentDiscountPercent?: number;
  vouchersFigure?: number; // For admin special credits vouchers
}

export interface CreditStatistics {
  totalCreditReceived: number;
  totalCreditTransferred: number;
  totalCreditBalance: number;
  creditTransferToEachPerson: CreditTransferRecord[];
  creditTransferredReceivedBack: number;
  activeCredits?: number;
  timers?: CreditTimer[];
}

export interface CreditTimer {
  creditId: string;
  status: string;
  paymentStatus: string;
  expiresAt?: string;
  transferExpiresAt?: string;
  remainingTransfers: number;
}

export interface MlmActiveTransfer {
  transferId: string;
  status: "pending_unlock" | "unlocked" | "returned_timeout" | "partial_timeout_review" | string;
  requiredVoucherCount?: number;
  currentVoucherCount?: number;
  timerStartedAt?: string;
  expiresAt?: string;
  timeLeftSeconds?: number;
  slotCount?: number;
  slotAmount?: number;
  unlockedSlots?: number;
  totalCreditAmount?: number;
}

export interface DistributionCredit {
  level?: number;
  creditsToTransfer: number;
  recipientName: string;
  recipientPhone: string;
  recipientId: string;
  vouchersShared?: number;
  status?: string;
  requiredVoucherCount?: number;
  currentVoucherCount?: number;
  isLocked?: boolean;
  timeLeft?: string;
  transferId?: string | null;
  slotNumber?: number;
  lockReason?: string | null;
  timeLeftSeconds?: number;
}

export interface CreditTransferRecord {
  id: string;
  recipientName: string;
  recipientId: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "returned";
}

export interface DiscountSummary {
  currentLevel: number;
  discountPercent: number;
  payableAmount: number;
  virtualCommission: number;
  disclaimer: string;
  nextLevelTarget?: {
    level: number;
    remainingDownline: number;
    targetDiscountPercent: number;
  };
}

export interface VoucherItem {
  _id: string;
  voucherNumber: string;
  MRP: number;
  issueDate: string;
  expiryDate: string;
  redeemedStatus: "unredeemed" | "redeemed" | "expired";
  redeemedAt?: string;
  source?: "purchase" | "transfer" | "admin";
  transferredFrom?: {
    _id: string;
    name: string;
    phone: string;
  };
  transferredAt?: string;
  transferHistory?: Array<{
    from: string;
    to: string;
    transferredAt: string;
  }>;
  originalOwner?: {
    _id: string;
    name: string;
    phone: string;
  };
  userId?: {
    _id: string;
    name: string;
    phone: string;
  };
  isSpecialCreditsVoucher?: boolean;
  isBalanceVoucher?: boolean;
  quantity?: number;
}

export interface VoucherHistory {
  purchased: number;
  received: number;
  sent: number;
  all: VoucherItem[];
}

export interface DirectBuyer {
  id: string;
  name: string;
  phone: string;
  level: number;
  teamSize: number;
  joinedDate: string;
}

export type ViewMode = "list" | "tree";

export interface TransferCreditsData {
  recipientId: string;
  recipientName: string;
  amount: number;
  note?: string;
}
