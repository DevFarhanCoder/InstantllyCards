import {
  NetworkUser,
  NetworkMetrics,
  CreditStatistics,
  CreditTransferRecord,
} from "../types/network";

// Helper function to generate mock network users
const generateMockUsers = (
  parentLevel: number,
  parentName: string,
  count: number = 5,
  depth: number = 2,
): NetworkUser[] => {
  if (depth === 0) return [];

  const names = [
    "Zaara Khan",
    "Imran Ahmed",
    "Ayesha Ali",
    "Hassan Sheikh",
    "Fatima Malik",
    "Omar Hussain",
    "Sara Iqbal",
    "Ali Raza",
    "Zainab Aziz",
    "Bilal Farooq",
    "Maryam Siddiqui",
    "Usman Khan",
    "Hira Noor",
    "Fahad Abbas",
    "Aisha Riaz",
  ];

  return Array.from({ length: count }, (_, index) => {
    const level = parentLevel + 1;
    const networkCount = Math.max(0, Math.floor(Math.random() * 30));

    return {
      id: `user-${parentName}-${level}-${index}`,
      name: names[Math.floor(Math.random() * names.length)],
      avatar: undefined,
      creditsReceived: Math.floor(Math.random() * 1000) + 100,
      level,
      directChildren: generateMockUsers(
        level,
        `${parentName}-${index}`,
        5,
        depth - 1,
      ),
      totalNetworkCount: networkCount,
      joinedDate: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      commissionEarned: Math.floor(Math.random() * 5000),
      isActive: Math.random() > 0.2,
    };
  });
};

// Root user (logged in user)
export const mockRootUser: NetworkUser = {
  id: "root-user",
  name: "Farhan Rizwan", // The logged-in user
  avatar: undefined,
  creditsReceived: 0, // Root doesn't receive, they distribute
  level: 0,
  directChildren: generateMockUsers(0, "root", 5, 3), // Generate 3 levels deep
  totalNetworkCount: 0, // Will be calculated
  joinedDate: new Date().toISOString(),
  commissionEarned: 15750,
  isActive: true,
};

// Calculate total network count recursively
const calculateNetworkCount = (user: NetworkUser): number => {
  if (user.directChildren.length === 0) return 0;

  let count = user.directChildren.length;
  user.directChildren.forEach((child) => {
    count += calculateNetworkCount(child);
  });

  return count;
};

mockRootUser.totalNetworkCount = calculateNetworkCount(mockRootUser);

// Mock metrics
export const mockMetrics: NetworkMetrics = {
  availableCredits: 8500,
  totalVouchersTransferred: 42350,
  totalNetworkUsers: mockRootUser.totalNetworkCount,
  estimatedCommission: mockRootUser.commissionEarned || 0,
};

// Mock credit transfer records
const mockTransferRecords: CreditTransferRecord[] = [
  {
    id: "tx-001",
    recipientName: "Zaara Khan",
    recipientId: "user-root-1-0",
    amount: 5000,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
  {
    id: "tx-002",
    recipientName: "Imran Ahmed",
    recipientId: "user-root-1-1",
    amount: 3500,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
  {
    id: "tx-003",
    recipientName: "Ayesha Ali",
    recipientId: "user-root-1-2",
    amount: 2000,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "returned",
  },
  {
    id: "tx-004",
    recipientName: "Hassan Sheikh",
    recipientId: "user-root-1-3",
    amount: 4000,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
  {
    id: "tx-005",
    recipientName: "Fatima Malik",
    recipientId: "user-root-1-4",
    amount: 1500,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
];

// Mock credit statistics
export const mockCreditStatistics: CreditStatistics = {
  totalCreditReceived: 65000,
  totalCreditTransferred: 42350,
  totalCreditBalance: 8500,
  creditTransferToEachPerson: mockTransferRecords,
  creditTransferredReceivedBack: 2000,
};

// Helper to flatten the tree for list view
export const flattenNetworkTree = (
  user: NetworkUser,
  breadcrumb: string[] = [],
): Array<{ user: NetworkUser; breadcrumb: string[] }> => {
  const result: Array<{ user: NetworkUser; breadcrumb: string[] }> = [];

  const currentBreadcrumb = [...breadcrumb, user.name];

  user.directChildren.forEach((child) => {
    result.push({
      user: child,
      breadcrumb: currentBreadcrumb,
    });

    // Recursively add children
    result.push(...flattenNetworkTree(child, currentBreadcrumb));
  });

  return result;
};
