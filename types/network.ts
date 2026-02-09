// Network and Voucher System Types

export interface NetworkUser {
  id: string;
  name: string;
  avatar?: string;
  creditsReceived: number;
  level: number;
  directChildren: NetworkUser[];
  totalNetworkCount: number; // Total users under this node
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

export type ViewMode = "list" | "tree";

export interface TransferCreditsData {
  recipientId: string;
  recipientName: string;
  amount: number;
  note?: string;
}
