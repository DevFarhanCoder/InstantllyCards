import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, Link, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import FooterCarousel from "../../components/FooterCarousel";
import FAB from "../../components/FAB";
import CategoryGrid from "../../components/CategoryGrid";
import PopularBusiness from "../../components/PopularBusiness";
import { FEATURE_FLAGS } from "../../lib/featureFlags";
import { formatIndianNumber, formatAmount } from "../../utils/formatNumber";

export default function Home() {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [userName, setUserName] = React.useState<string>("");
  const [currentUserId, setCurrentUserId] = React.useState<string>("");
  const [userCredits, setUserCredits] = React.useState<number>(0);
  const [creditsLoading, setCreditsLoading] = React.useState(true);

  // Fetch user name and ID for profile initial and filtering
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const name = await AsyncStorage.getItem("user_name");
        if (name) setUserName(name);

        let userId = await AsyncStorage.getItem("currentUserId");
        if (userId) {
          setCurrentUserId(userId);
          // console.log("🔍 Home: Current user ID loaded from storage:", userId);
        } else {
          // Fallback: Fetch from profile API if not in storage
          // console.log("⚠️ Home: No user ID in storage, fetching from profile API...");
          try {
            const token = await AsyncStorage.getItem("token");
            if (token) {
              const apiBase =
                Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE ||
                "https://api.instantllycards.com";
              const response = await fetch(`${apiBase}/api/auth/profile`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });
              if (response.ok) {
                const profileData = await response.json();
                if (profileData._id) {
                  userId = profileData._id.toString();
                  await AsyncStorage.setItem("currentUserId", userId);
                  setCurrentUserId(userId);
                  // console.log("✅ Home: User ID fetched from profile and stored:", userId);
                }
              }
            }
          } catch (apiError) {
            console.error(
              "❌ Home: Failed to fetch user ID from profile:",
              apiError,
            );
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  // Fetch user credits
  const fetchCredits = React.useCallback(async () => {
    try {
      setCreditsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const apiBase =
          Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE ||
          "https://api.instantllycards.com";
        console.log(
          "💰 Home: Fetching credits from:",
          `${apiBase}/api/credits/balance`,
        );

        // Add cache busting to force fresh data
        const response = await fetch(
          `${apiBase}/api/credits/balance?t=${Date.now()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        console.log("💰 Home: Credits response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(
            "💰 Home: Credits data received:",
            JSON.stringify(data, null, 2),
          );
          console.log("💰 Home: Raw credits value:", data.credits);
          setUserCredits(data.credits || 0);
          console.log("✅ Home: Credits set to:", data.credits || 0);
        } else {
          const errorText = await response.text();
          console.error(
            "❌ Home: Credits fetch failed:",
            response.status,
            errorText,
          );
        }
      } else {
        console.error("❌ Home: No auth token found for credits");
      }
    } catch (error) {
      console.error("❌ Home: Error fetching credits:", error);
    } finally {
      setCreditsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Refetch credits when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // console.log("🔄 Home: Screen focused, refreshing credits...");
      fetchCredits();
    }, [fetchCredits]),
  );

  // Manual refresh handler
  const handleRefresh = React.useCallback(() => {
    fetchCredits();
  }, [fetchCredits]);
  return (
    <SafeAreaView style={s.root}>
      {/* Custom Header */}
      <View style={s.headerRow}>
        {/* Profile Left */}
        <TouchableOpacity
          style={s.profileButton}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.7}
        >
          <View style={s.profileGradientBorder}>
            <View style={s.profileInner}>
              <Text style={s.profileInitial}>
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        {/* Title Center */}
        <View style={s.headerTitleLogoContainer}>
          <Text style={s.headerTitleLogo}>
            <Text style={s.headerTitleOrange}>Instant</Text>
            <Text style={s.headerTitleCyan}>lly</Text>
          </Text>
        </View>
        {/* Credits Right */}
        <Link href="/referral" asChild>
          <TouchableOpacity
            style={s.creditsButton}
            activeOpacity={0.7}
            onPress={() => {
              console.log(
                "🪙 Credits button pressed - Current value:",
                userCredits,
              );
              console.log("🪙 Formatted value:", formatAmount(userCredits));
            }}
          >
            <View style={s.creditsIconContainer}>
              <Text style={s.coinIcon}>🪙</Text>
              {creditsLoading ? (
                <ActivityIndicator size="small" color="#F59E0B" />
              ) : (
                <Text style={s.creditsCount}>
                  {(() => {
                    console.log(
                      "💰 Rendering credits - Raw:",
                      userCredits,
                      "Formatted:",
                      formatAmount(userCredits),
                    );
                    return formatAmount(userCredits);
                  })()}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Search Bar - Static at the top */}
      <View style={s.searchBarRow}>
        <View style={s.searchBarContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={s.searchIcon}
          />
          <TextInput
            style={s.searchInputModern}
            placeholder="Search categories & subcategories"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={s.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Categories Header with Arrow and Promote Button */}
        {FEATURE_FLAGS.SHOW_CATEGORIES && (
          <View style={s.categoriesHeaderRow}>
            <View style={s.categoriesWithArrow}>
              <Text style={s.categoriesHeaderText}>Categories</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#EF4444"
                style={s.categoriesArrow}
              />
            </View>
            {FEATURE_FLAGS.SHOW_PROMOTE_BUSINESS && (
              <TouchableOpacity
                style={s.promoteBusinessButton}
                onPress={() => router.push("/business-promotiontype")}
                activeOpacity={0.8}
              >
                <Text style={s.promoteButtonText}>Promote Business</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {FEATURE_FLAGS.SHOW_CATEGORIES && <CategoryGrid searchQuery={searchQuery} />}

        {/* Popular Business Slider */}
        <PopularBusiness />
      </ScrollView>

      {/* Footer Carousel */}
      <FooterCarousel showPromoteButton={true} />

      <FAB />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  headerTitleLogoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleLogo: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerTitleCyan: {
    color: "#00C3FF",
    fontWeight: "900",
  },
  headerTitleBlue: {
    color: "#0090FF",
    fontWeight: "900",
  },
  headerTitleOrange: {
    color: "#151C32",
    fontWeight: "900",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 18,
  },
  cardsHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 1,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  cardsHeadingLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D1D5DB",
  },
  cardsHeadingText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    paddingHorizontal: 16,
    letterSpacing: 0.5,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInputModern: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchBarRow: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    borderRadius: 30,
    padding: 2,
    fontSize: 18,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  searchBox: {
    lineHeight: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 2,
  },
  searchInput: {
    fontSize: 16,
    color: "#6B7280",
    padding: 0,
  },
  searchButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconWhite: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  creditsButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  creditsIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#F59E0B",
    justifyContent: "center",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    gap: 4,
  },
  creditsCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
  },
  coinIcon: {
    fontSize: 18,
  },
  profileButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  profileGradientBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#3B82F6",
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  profileInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  empty: {
    flex: 1,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTxt: {
    color: "#6B7280",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "500",
  },
  emptySubTxt: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  testButton: {
    position: "absolute",
    top: 50,
    right: 16,
    backgroundColor: "#3B82F6",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1000,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  videoTestContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  videoTestTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  videoPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  videoPlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoPlaceholderSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  playVideoButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playVideoText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  videoPlayer: {
    width: "100%",
    height: 200,
    backgroundColor: "#000000",
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  videoOverlay: {
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: {
    fontSize: 64,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  playText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  videoTestMessage: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  knowMoreButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  knowMoreText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  closeButtonText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  categoriesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 1,
    marginBottom: 8,
  },
  categoriesWithArrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoriesHeaderText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 0.3,
  },
  categoriesArrow: {
    marginTop: 2,
  },
  promoteBusinessButton: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#EF4444",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  promoteIcon: {
    marginRight: 10,
  },
  promoteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
