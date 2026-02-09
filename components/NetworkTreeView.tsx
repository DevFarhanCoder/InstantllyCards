import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NetworkUser } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";
import UserCardNetwork from "./UserCardNetwork";

interface NetworkTreeViewProps {
  rootUser: NetworkUser;
  onTransferPress: (user: NetworkUser) => void;
  onViewNetwork: (user: NetworkUser) => void;
}

export default function NetworkTreeView({
  rootUser,
  onTransferPress,
  onViewNetwork,
}: NetworkTreeViewProps) {
  const renderTreeNode = (
    user: NetworkUser,
    isRoot: boolean = false,
    isLast: boolean = false,
    level: number = 0,
  ) => {
    const hasChildren = user.directChildren.length > 0;

    return (
      <View key={user.id} style={styles.nodeContainer}>
        {!isRoot && (
          <View style={styles.connectorContainer}>
            {/* Vertical line from parent */}
            <View
              style={[styles.verticalLine, isLast && styles.verticalLineShort]}
            />
            {/* Horizontal line to node */}
            <View style={styles.horizontalLine} />
          </View>
        )}

        <View style={[styles.nodeContent, isRoot && styles.rootNodeContent]}>
          {isRoot ? (
            <View style={styles.rootCard}>
              <View style={styles.rootHeader}>
                <View style={styles.rootAvatar}>
                  <Ionicons name="person" size={24} color="#10B981" />
                </View>
                <View style={styles.rootInfo}>
                  <Text style={styles.rootName}>{user.name}</Text>
                  <Text style={styles.rootLabel}>You (Root)</Text>
                </View>
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
            </View>
          ) : (
            <UserCardNetwork
              user={user}
              onTransferPress={onTransferPress}
              onViewNetwork={onViewNetwork}
              showTransferButton={level === 1}
              isDirect={level === 1}
            />
          )}

          {/* Children */}
          {hasChildren && (
            <View style={styles.childrenContainer}>
              {user.directChildren.map((child, index) => (
                <View key={child.id} style={styles.childWrapper}>
                  {renderTreeNode(
                    child,
                    false,
                    index === user.directChildren.length - 1,
                    level + 1,
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      horizontal
    >
      <ScrollView
        style={styles.verticalScroll}
        contentContainerStyle={styles.verticalScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.treeWrapper}>
          {renderTreeNode(rootUser, true, false, 0)}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(16),
  },
  verticalScroll: {
    flex: 1,
  },
  verticalScrollContent: {
    paddingBottom: scaleSize(20),
  },
  treeWrapper: {
    minWidth: "100%",
  },
  nodeContainer: {
    position: "relative",
  },
  connectorContainer: {
    position: "absolute",
    left: scaleSize(-20),
    top: 0,
    height: "50%",
    width: scaleSize(20),
  },
  verticalLine: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 2,
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.12)",
  },
  verticalLineShort: {
    height: "50%",
  },
  horizontalLine: {
    position: "absolute",
    right: 0,
    top: scaleSize(24),
    width: scaleSize(20),
    height: 2,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
  },
  nodeContent: {
    marginLeft: scaleSize(0),
  },
  rootNodeContent: {
    marginBottom: scaleSize(20),
  },
  rootCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scaleSize(16),
    padding: scaleSize(16),
    borderWidth: 2,
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  childrenContainer: {
    marginTop: scaleSize(16),
    marginLeft: scaleSize(20),
  },
  childWrapper: {
    marginBottom: scaleSize(12),
  },
});
