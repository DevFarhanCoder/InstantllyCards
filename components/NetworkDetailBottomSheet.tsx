import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NetworkUser } from "../types/network";
import { scaleFontSize, scaleSize } from "../lib/responsive";
// import { BlurView } from "expo-blur"; // Temporarily disabled - requires native rebuild
import UserCardNetwork from "./UserCardNetwork";

interface NetworkDetailBottomSheetProps {
  visible: boolean;
  user: NetworkUser | null;
  breadcrumb: string[];
  onClose: () => void;
  onUserSelect: (user: NetworkUser, newBreadcrumb: string[]) => void;
  onTransferPress: (user: NetworkUser) => void;
}

export default function NetworkDetailBottomSheet({
  visible,
  user,
  breadcrumb,
  onClose,
  onUserSelect,
  onTransferPress,
}: NetworkDetailBottomSheetProps) {
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!user) return null;

  const handleUserSelect = (selectedUser: NetworkUser) => {
    if (selectedUser.directChildren.length > 0) {
      const newBreadcrumb = [...breadcrumb, selectedUser.name];
      onUserSelect(selectedUser, newBreadcrumb);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.sheetContent,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
              </TouchableOpacity>
              <View>
                <Text style={styles.title}>Network Details</Text>
                <Text style={styles.subtitle}>
                  {user.directChildren.length} Direct{" "}
                  {user.directChildren.length === 1 ? "User" : "Users"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Breadcrumb Navigation */}
          {breadcrumb.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.breadcrumbContainer}
              contentContainerStyle={styles.breadcrumbContent}
            >
              {breadcrumb.map((crumb, index) => (
                <View key={index} style={styles.breadcrumbItem}>
                  <Text style={styles.breadcrumbText}>{crumb}</Text>
                  {index < breadcrumb.length - 1 && (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#6B7280"
                    />
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {/* User Info Card */}
          <View style={styles.userInfoCard}>
            <View style={styles.userInfoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Credits Received</Text>
                <Text style={styles.infoValue}>{user.creditsReceived}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Level</Text>
                <Text style={styles.infoValue}>{user.level}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Total Network</Text>
                <Text style={styles.infoValue}>{user.totalNetworkCount}</Text>
              </View>
            </View>
          </View>

          {/* Direct Children List */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Direct Referrals</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {user.directChildren.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#6B7280" />
                <Text style={styles.emptyText}>No direct referrals yet</Text>
              </View>
            ) : (
              user.directChildren.map((child) => (
                <UserCardNetwork
                  key={child.id}
                  user={child}
                  onTransferPress={onTransferPress}
                  onViewNetwork={handleUserSelect}
                  showTransferButton={false}
                  isDirect={false}
                />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent backdrop
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  sheetContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
    maxHeight: "85%",
    paddingTop: scaleSize(12),
  },
  handleBar: {
    width: scaleSize(40),
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: scaleSize(16),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scaleSize(20),
    paddingBottom: scaleSize(16),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: scaleSize(4),
  },
  title: {
    fontSize: scaleFontSize(20),
    fontWeight: "700",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: scaleFontSize(16),
    color: "#6B7280",
    marginTop: 2,
  },
  breadcrumbContainer: {
    maxHeight: scaleSize(40),
    marginBottom: scaleSize(16),
    paddingHorizontal: scaleSize(20),
  },
  breadcrumbContent: {
    alignItems: "center",
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: scaleSize(8),
  },
  breadcrumbText: {
    fontSize: scaleFontSize(16),
    color: "#10B981",
    fontWeight: "600",
    marginRight: scaleSize(4),
  },
  userInfoCard: {
    backgroundColor: "#F9FAFB",
    marginHorizontal: scaleSize(20),
    borderRadius: scaleSize(12),
    padding: scaleSize(16),
    marginBottom: scaleSize(16),
  },
  userInfoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: scaleFontSize(16),
    color: "#6B7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: scaleFontSize(18),
    fontWeight: "700",
    color: "#1F2937",
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
  listHeader: {
    paddingHorizontal: scaleSize(20),
    paddingBottom: scaleSize(12),
  },
  listTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scaleSize(20),
    paddingBottom: scaleSize(20),
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleSize(40),
  },
  emptyText: {
    fontSize: scaleFontSize(16),
    color: "#6B7280",
    marginTop: scaleSize(12),
  },
});
