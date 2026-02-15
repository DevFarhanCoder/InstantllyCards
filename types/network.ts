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
}

export interface NetworkMetrics {
  availableCredits: number;
  totalVouchersTransferred: number;
  totalNetworkUsers: number;
  estimatedCommission: number;
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

export interface CreditTransferRecord {
  id: string;
  recipientName: string;
  recipientId: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "returned";
}

export interface CommissionSummary {
  totalEarned: number;
  totalWithdrawn: number;
  availableBalance: number;
  levelBreakdown: Array<{ level: number; amount: number }>;
}

export interface VoucherItem {
  _id: string;
  voucherNumber: string;
  MRP: number;
  issueDate: string;
  expiryDate: string;
  redeemedStatus: "unredeemed" | "redeemed" | "expired";
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
