import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function AdsWithoutChannel() {
  const [activeTab, setActiveTab] = useState<"create" | "status">("create");
  const scrollViewRef = useRef<ScrollView>(null);

  const changeTab = (tab: "create" | "status") => {
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({ x: tab === "create" ? 0 : width, animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (offsetX >= width / 2) {
      setActiveTab("status");
    } else {
      setActiveTab("create");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
     

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "create" && styles.activeTab]}
          onPress={() => changeTab("create")}
        >
          <Text style={[styles.tabText, activeTab === "create" && styles.activeTabText]}>
            Create Ads
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "status" && styles.activeTab]}
          onPress={() => changeTab("status")}
        >
          <Text style={[styles.tabText, activeTab === "status" && styles.activeTabText]}>
            Status
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Pages */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {/* Create Ads Page */}
        <View style={[styles.page, { width }]}>
          <Text style={styles.contentText}>Here you can create new ads.</Text>
        </View>

        {/* Status Page */}
        <View style={[styles.page, { width }]}>
          <Text style={styles.contentText}>Check status of your ads here.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    position: "relative",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#0A0A0A" },
  headerLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#E5E5E5", // 👈 full-width light gray line
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 16, color: "#777", fontWeight: "500" },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#4F6AF3" },
  activeTabText: { color: "#4F6AF3", fontWeight: "600" },
  page: { flex: 1, justifyContent: "center", alignItems: "center" },
  contentText: { fontSize: 16, color: "#333" },
});
