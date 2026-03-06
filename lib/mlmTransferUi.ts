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

export const statusLabel = (status?: string): string => {
  switch (status) {
    case "pending_unlock":
      return "Pending Unlock";
    case "unlocked":
      return "Unlocked";
    case "returned_timeout":
      return "Returned";
    case "partial_timeout_review":
      return "Review";
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

