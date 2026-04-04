import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NetworkUser } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";
import UserCardNetwork from "./UserCardNetwork";

interface NetworkListViewProps {
  rootUser: NetworkUser;
  onTransferPress: (user: NetworkUser) => void;
  onViewNetwork: (user: NetworkUser) => void;
}

interface ExpandableSection {
  user: NetworkUser;
  level: number;
  parentName: string;
  isExpanded: boolean;
}

export default function NetworkListView({
  rootUser,
  onTransferPress,
  onViewNetwork,
}: NetworkListViewProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    root: true,
  });

  const toggleSection = (userId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const renderUserSection = (
    user: NetworkUser,
    level: number,
    parentName: string = "",
    isRoot: boolean = false,
  ) => {
    const isExpanded = expandedSections[user.id] || false;
    const hasChildren = user.directChildren.length > 0;

    return (
      <View
        key={user.id}
        style={[styles.sectionContainer, { marginLeft: level * scaleSize(16) }]}
      >
        {/* Section Header / User Card */}
        {isRoot ? (
          <View style={styles.rootSection}>
            <TouchableOpacity
              style={styles.rootCard}
              onPress={() => hasChildren && toggleSection(user.id)}
              activeOpacity={hasChildren ? 0.7 : 1}
            >
              <View style={styles.rootHeader}>
                <View style={styles.rootAvatar}>
                  <Ionicons name="person" size={24} color="#10B981" />
                </View>
                <View style={styles.rootInfo}>
                  <Text style={styles.rootName}>{user.name}</Text>
                  <Text style={styles.rootLabel}>You (Root)</Text>
                </View>
                {hasChildren && (
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#6B7280"
                  />
                )}
              </View>
              <View style={styles.rootStats}>
                <View style={styles.rootStat}>
                  <Ionicons name="people" size={16} color="#10B981" />
                  <Text style={styles.rootStatText}>
                    {user.totalNetworkCount} Users
                  </Text>
                </View>
                <View style={styles.rootStat}>
                  <Ionicons name="git-network" size={16} color="#3B82F6" />
                  <Text style={styles.rootStatText}>
                    {user.directChildren.length} Direct
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => hasChildren && toggleSection(user.id)}
            activeOpacity={hasChildren ? 0.7 : 1}
            style={styles.userCardWrapper}
          >
            <View style={styles.expandIconContainer}>
              {hasChildren && (
                <Ionicons
                  name={
                    isExpanded
                      ? "chevron-down-circle"
                      : "chevron-forward-circle"
                  }
                  size={20}
                  color="#6B7280"
                />
              )}
            </View>
            <View style={styles.userCardContent}>
              <UserCardNetwork
                user={user}
                onTransferPress={onTransferPress}
                onViewNetwork={onViewNetwork}
                showTransferButton={level === 1}
                isDirect={level === 1}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Expanded Children */}
        {isExpanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {user.directChildren.map((child) =>
              renderUserSection(child, level + 1, user.name, false),
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Scrollable List - Network Distribution section removed */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderUserSection(rootUser, 0, "", true)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleSize(20),
  },
  sectionContainer: {
    marginBottom: scaleSize(8),
  },
  rootSection: {
    marginBottom: scaleSize(16),
  },
  rootCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(16),
    padding: scaleSize(16),
    borderWidth: 2,
    borderColor: "#10B981",
  },
  rootHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleSize(12),
  },
  rootAvatar: {
    width: scaleSize(56),
    height: scaleSize(56),
    borderRadius: scaleSize(28),
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(12),
  },
  rootInfo: {
    flex: 1,
  },
  rootName: {
    fontSize: scaleFontSize(18),
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  rootLabel: {
    fontSize: scaleFontSize(16),
    color: "#10B981",
    fontWeight: "600",
  },
  rootStats: {
    flexDirection: "row",
    gap: 16,
  },
  rootStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rootStatText: {
    fontSize: scaleFontSize(16),
    color: "#1F2937",
    fontWeight: "600",
  },
  userCardWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandIconContainer: {
    width: scaleSize(30),
    alignItems: "center",
    justifyContent: "center",
  },
  userCardContent: {
    flex: 1,
  },
  childrenContainer: {
    marginTop: scaleSize(8),
  },
});
