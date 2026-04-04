export const formatSecondsCompact = (seconds?: number): string => {
  const safe = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

export const hasMetVoucherRequirement = (
  currentVoucherCount?: number,
  requiredVoucherCount?: number,
): boolean => {
  const required = Number(requiredVoucherCount) || 0;
  const current = Number(currentVoucherCount) || 0;
  return required > 0 && current >= required;
};

export const resolveTransferStatus = (
  status?: string,
  currentVoucherCount?: number,
  requiredVoucherCount?: number,
): string => {
  if (hasMetVoucherRequirement(currentVoucherCount, requiredVoucherCount)) {
    return "unlocked";
  }
  return status || "pending_unlock";
};

export const isPendingTransferStatus = (status?: string): boolean =>
  status === "pending_unlock" || status === "partial_timeout_review";

export const isTerminalTransferStatus = (status?: string): boolean =>
  status === "unlocked" || status === "returned_timeout";

export const shouldShowTransferTimer = (
  status?: string,
  currentVoucherCount?: number,
  requiredVoucherCount?: number,
): boolean => isPendingTransferStatus(resolveTransferStatus(status, currentVoucherCount, requiredVoucherCount));

export const statusLabel = (status?: string): string => {
  switch (status) {
    case "pending_unlock":
      return "Pending Unlock";
    case "unlocked":
      return "Unlocked";
    case "returned_timeout":
      return "Expired / Returned";
    case "partial_timeout_review":
      return "Under Review";
    default:
      return "Pending";
  }
};

export const statusColor = (status?: string): string => {
  switch (status) {
    case "unlocked":
      return "#10B981";
    case "returned_timeout":
      return "#EF4444";
    case "partial_timeout_review":
      return "#F59E0B";
    case "pending_unlock":
    default:
      return "#3B82F6";
  }
};

