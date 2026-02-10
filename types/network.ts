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

export interface CreditStatistics {
  totalCreditReceived: number;
  totalCreditTransferred: number;
  totalCreditBalance: number;
  creditTransferToEachPerson: CreditTransferRecord[];
  creditTransferredReceivedBack: number;
}

export interface CreditTransferRecord {
  id: string;
  recipientName: string;
  recipientId: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "returned";
}

export type ViewMode = "list" | "tree";

export interface TransferCreditsData {
  recipientId: string;
  recipientName: string;
  amount: number;
  note?: string;
}
