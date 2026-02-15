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
                style={styles.transferButton}
                onPress={() => onTransferPress(user)}
              >
                <Ionicons
                  name="arrow-forward-circle"
                  size={20}
                  color="#10B981"
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
});
