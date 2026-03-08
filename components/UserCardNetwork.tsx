import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NetworkUser } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";
import { useMlmTransferStore } from "../lib/mlmTransferStore";
import {
  formatSecondsCompact,
  resolveTransferStatus,
  shouldShowTransferTimer,
  statusLabel,
} from "../lib/mlmTransferUi";

interface UserCardProps {
  user: NetworkUser;
  onTransferPress: (user: NetworkUser) => void;
  onViewNetwork?: (user: NetworkUser) => void;
  showTransferButton?: boolean;
  isDirect?: boolean; // Is this a direct referral of the root user
}

export default function UserCard({
  user,
  onTransferPress,
  onViewNetwork,
  showTransferButton = true,
  isDirect = false,
}: UserCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const slotLock = useMlmTransferStore((state) =>
    user.slotNumber ? state.slotLocksBySlotNumber[user.slotNumber] : undefined,
  );
  const transfer = useMlmTransferStore((state) =>
    user.transferId ? state.transfersById[user.transferId] : undefined,
  );
  const effectiveLocked = user.isLocked ?? slotLock?.isLocked ?? false;
  const effectiveLockReason =
    user.lockReason ?? slotLock?.lockReason ?? "Voucher requirement pending";
  const effectiveSeconds =
    transfer?.timeLeftSeconds ?? slotLock?.timeLeftSeconds ?? user.timeLeftSeconds;
  const currentVoucherCount =
    user.currentVoucherCount ?? transfer?.currentVoucherCount ?? 0;
  const requiredVoucherCount =
    user.requiredVoucherCount ?? transfer?.requiredVoucherCount ?? 0;
  const effectiveStatus = resolveTransferStatus(
    user.transferStatus ??
      transfer?.status ??
      (effectiveLocked ? "pending_unlock" : "unlocked"),
    currentVoucherCount,
    requiredVoucherCount,
  );
  const showTimer = shouldShowTransferTimer(
    effectiveStatus,
    currentVoucherCount,
    requiredVoucherCount,
  );

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevelColor = (level: number): string => {
    const colors = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];
    return colors[level % colors.length];
  };

  const formatCompact = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onViewNetwork && onViewNetwork(user)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onViewNetwork}
      >
        <View style={styles.cardContent}>
          {/* Left: Avatar and Info */}
          <View style={styles.leftSection}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: getLevelColor(user.level) + "30" },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: getLevelColor(user.level) },
                ]}
              >
                {getInitials(user.name)}
              </Text>
            </View>

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.name}
                </Text>
                {user.isActive && <View style={styles.activeDot} />}
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="gift" size={12} color="#6B7280" />
                  <Text style={styles.statText}>
                    {user.creditsReceived} credits
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="analytics" size={12} color="#6B7280" />
                  <Text style={styles.statText}>
                    ₹{formatCompact(Math.round(user.structuralCreditPool || 0))}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="layers" size={12} color="#6B7280" />
                  <Text style={styles.statText}>Level {user.level}</Text>
                </View>
              </View>
              {(effectiveLocked || user.transferId) && (
                <View style={styles.lockMetaRow}>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          effectiveStatus === "unlocked"
                            ? "#D1FAE5"
                            : effectiveStatus === "returned_timeout"
                              ? "#FEE2E2"
                              : "#DBEAFE",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color:
                            effectiveStatus === "unlocked"
                              ? "#065F46"
                              : effectiveStatus === "returned_timeout"
                                ? "#991B1B"
                                : "#1E3A8A",
                        },
                      ]}
                    >
                      {statusLabel(effectiveStatus)}
                    </Text>
                  </View>
                  {showTimer && typeof effectiveSeconds === "number" && (
                    <View style={styles.timerPill}>
                      <Ionicons name="timer-outline" size={12} color="#1E3A8A" />
                      <Text style={styles.timerPillText}>
                        {formatSecondsCompact(effectiveSeconds)}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {requiredVoucherCount > 0 && (
                <Text style={styles.progressText}>
                  Voucher Progress {currentVoucherCount}/{requiredVoucherCount}
                </Text>
              )}
              {effectiveLocked && !!effectiveLockReason && (
                <Text style={styles.lockReasonText}>{effectiveLockReason}</Text>
              )}
            </View>
          </View>

          {/* Right: Network Badge and Transfer Button */}
          <View style={styles.rightSection}>
            {user.totalNetworkCount > 0 && (
              <TouchableOpacity
                style={[
                  styles.networkBadge,
                  { backgroundColor: getLevelColor(user.level) + "20" },
                ]}
                onPress={() => onViewNetwork && onViewNetwork(user)}
              >
                <Ionicons
                  name="people"
                  size={14}
                  color={getLevelColor(user.level)}
                />
                <Text
                  style={[
                    styles.networkCount,
                    { color: getLevelColor(user.level) },
                  ]}
                >
                  {user.totalNetworkCount}
                </Text>
              </TouchableOpacity>
            )}

            {showTransferButton && isDirect && (
              <TouchableOpacity
                style={[
                  styles.transferButton,
                  effectiveLocked && styles.transferButtonDisabled,
                ]}
                onPress={() => !effectiveLocked && onTransferPress(user)}
                disabled={effectiveLocked}
              >
                <Ionicons
                  name={effectiveLocked ? "lock-closed" : "arrow-forward-circle"}
                  size={20}
                  color={effectiveLocked ? "#6B7280" : "#10B981"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(12),
    marginBottom: scaleSize(12),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  lockMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  statusPill: {
    borderRadius: scaleSize(8),
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(2),
  },
  statusPillText: {
    fontSize: scaleFontSize(11),
    fontWeight: "700",
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DBEAFE",
    borderRadius: scaleSize(8),
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(2),
  },
  timerPillText: {
    fontSize: scaleFontSize(11),
    fontWeight: "700",
    color: "#1E3A8A",
  },
  progressText: {
    fontSize: scaleFontSize(11),
    color: "#1E3A8A",
    marginBottom: 2,
  },
  lockReasonText: {
    fontSize: scaleFontSize(11),
    color: "#991B1B",
    marginBottom: 2,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scaleSize(14),
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(24),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(12),
  },
  avatarText: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#1F2937",
    marginRight: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: scaleFontSize(16),
    color: "#6B7280",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  networkBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(12),
    gap: 4,
  },
  networkCount: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
  },
  transferButton: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  transferButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
});
