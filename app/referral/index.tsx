import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Clipboard,
  Share,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
// Dynamically import native modules to prevent crash when not available
let RNShare: any = null;
try {
  RNShare = require("react-native-share").default;
  console.log("✅ react-native-share loaded");
} catch (error) {
  console.log("⚠️ react-native-share not available, will use expo-sharing fallback");
}
let captureRef: any = null;
try {
  captureRef = require("react-native-view-shot").captureRef;
  console.log("✅ react-native-view-shot loaded for referral");
} catch (error) {
  console.log("⚠️ react-native-view-shot not available");
}
let ExpoSharing: any = null;
try {
  ExpoSharing = require("expo-sharing");
  console.log("✅ expo-sharing loaded");
} catch (error) {
  console.log("⚠️ expo-sharing not available");
}
let ExpoFileSystem: any = null;
try {
  ExpoFileSystem = require("expo-file-system/legacy");
  console.log("✅ expo-file-system loaded");
} catch (error) {
  console.log("⚠️ expo-file-system not available");
}
import api from "@/lib/api";
import { formatIndianNumber } from "@/utils/formatNumber";
import FooterCarousel from "@/components/FooterCarousel";
import CustomTabBar from "@/components/CustomTabBar";
import ReferralBanner from "@/components/ReferralBanner";
import BusinessCardTemplate from "@/components/BusinessCardTemplate";

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalCreditsEarned: number;
  recentReferrals: Array<{
    name: string;
    phone: string;
    createdAt: string;
  }>;
}

interface CreditConfig {
  signupBonus: number;
  referralReward: number;
}

export default function ReferralPage() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [config, setConfig] = useState<CreditConfig | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [userPhone, setUserPhone] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [userCard, setUserCard] = useState<any>(null);
  const [componentError, setComponentError] = useState<string | null>(null);
  const cardTemplateRef = useRef<View>(null);
  const [cardReady, setCardReady] = useState(false);

  // Compute formatted phone numbers for the card template (same as card/[id].tsx)
  const fullPersonal = useMemo(() => {
    if (!userCard?.personalPhone) return "";
    return userCard?.personalCountryCode
      ? `+${userCard.personalCountryCode}${userCard.personalPhone}`
      : userCard.personalPhone;
  }, [userCard?.personalCountryCode, userCard?.personalPhone]);

  const fullCompany = useMemo(() => {
    if (!userCard?.companyPhone) return "";
    return userCard?.companyCountryCode
      ? `+${userCard.companyCountryCode}${userCard.companyPhone}`
      : userCard.companyPhone;
  }, [userCard?.companyCountryCode, userCard?.companyPhone]);

  const loadReferralData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }

      // Fetch referral stats, credit config, and user balance
      // Use Promise.allSettled to handle partial failures gracefully
      const [statsResult, configResult, creditsResult, profileResult, cardsResult] =
        await Promise.allSettled([
          api.get("/credits/referral-stats"),
          api.get("/credits/config"),
          api.get("/credits/balance"),
          api.get("/users/profile"),
          api.get("/cards"),
        ]);

      // Extract values from settled promises
      const statsResponse =
        statsResult.status === "fulfilled" ? statsResult.value : null;
      const configResponse =
        configResult.status === "fulfilled" ? configResult.value : null;
      const creditsResponse =
        creditsResult.status === "fulfilled" ? creditsResult.value : null;
      const profileResponse =
        profileResult.status === "fulfilled" ? profileResult.value : null;
      const cardsResponse =
        cardsResult.status === "fulfilled" ? cardsResult.value : null;

      console.log(
        "📊 Referral Stats Response:",
        JSON.stringify(statsResponse, null, 2),
      );
      console.log("🔑 Referral Code:", statsResponse?.referralCode);
      console.log("🔍 Full stats object:", statsResponse);

      if (statsResponse) {
        setStats(statsResponse);
      }
      if (configResponse?.config) {
        setConfig(configResponse.config);
      }
      if (creditsResponse) {
        setUserCredits(creditsResponse.credits || 0);
      }
      if (profileResponse?.user) {
        setUserName(profileResponse.user.name || "");
        setUserPhone(profileResponse.user.phone || "");
      }

      // Set user's first card for sharing
      if (cardsResponse) {
        let cards: any[] = [];
        if (cardsResponse && typeof cardsResponse === 'object' && 'data' in cardsResponse) {
          cards = cardsResponse.data || [];
        } else if (Array.isArray(cardsResponse)) {
          cards = cardsResponse;
        }
        if (cards.length > 0) {
          setUserCard(cards[0]);
        }
      }

      // Force a re-render check
      console.log(
        "✅ State updated - referralCode should be:",
        statsResponse?.referralCode,
      );
    } catch (error: any) {
      console.error("Error loading referral data:", error);
      setComponentError(error?.message || "Failed to load referral data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);

  // Auto-refresh when screen comes into focus (but not on initial mount)
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if already loaded (skip initial mount)
      if (stats || userCredits > 0) {
        console.log("🔄 Auto-refreshing referral data...");
        loadReferralData(true);
      }
    }, [stats, userCredits]),
  );

  // Error screen
  if (componentError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referral Program</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text
            style={{ color: "#EF4444", marginTop: 16, textAlign: "center" }}
          >
            {componentError}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setComponentError(null);
              setLoading(true);
              loadReferralData();
            }}
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: "#8B5CF6",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReferralData(true);
  };

  const handleShare = async () => {
    if (!stats?.referralCode || !config) {
      Alert.alert(
        "Please Wait",
        "Your referral code is being generated. Please try again in a moment.",
        [{ text: "OK", onPress: handleRefresh }],
      );
      return;
    }

    if (!userCard) {
      Alert.alert(
        "No Card Found",
        "Please create a business card first before sharing your referral.",
        [{ text: "OK", onPress: () => router.push("/builder" as any) }],
      );
      return;
    }

    try {
      setIsSharing(true);

      const playStoreUrl = `https://play.google.com/store/apps/details?id=com.instantllycards.www.twa&referrer=utm_source%3Dreferral%26utm_campaign%3D${stats.referralCode}`;

      // Original referral earning message
      const message = `*Earn ₹1200 to ₹6000+ per day Without Investment*

▪️ *I Got ₹300 Credit* I have downloaded this app & Got ₹300 Credit & App is very good for Visiting Card Management Advantage is shown in the video link given below
▪️ *You will get ₹300 Credit* When you download you will also get ₹300 Credit.
▪️ *Referral Bonus ₹300 Credit* When you download i will also get ₹300 Credit.
▪️ *How to earn ₹6000 per day* If you send Referral Message to 6 Groups & in each group 500 persons are member then your message will go to 3000 persons & normally 20 to 50 person download the Mobile App so on 20 Person you get ₹300 each so Total is ₹6000 per day
▪️ *What to do for Getting Referral Income* Download the Referral Message & Referral Link & Send this Message & Link to your WhatsApp Groups

*Important Links*
▪️ *Touch this link to Download the App with Referral Code* ${playStoreUrl}
▪️ *Video to Know Advantage of the Application & How to use it* https://drive.google.com/drive/folders/1ZkLP2dFwOkaBk-najKBIxLXfXUqw8C8l?usp=sharing
▪️ *If you have any problem then join this whatsApp Group and write the Problem you are getting* https://chat.whatsapp.com/G2bHGLYnlKRETTt7sxtqDl
▪️ *Video for Channel Partner Explanation* https://drive.google.com/drive/folders/1W8AqKhg67PyxQtRIH50hmknzD1Spz6mo?usp=sharing`;

      // --- Step 1: Capture the BusinessCardTemplate as an image ---
      let imageUri: string | null = null;
      console.log("🔍 Share debug - captureRef:", !!captureRef, "| cardTemplateRef.current:", !!cardTemplateRef.current, "| cardReady:", cardReady, "| userCard:", !!userCard);
      
      if (captureRef && cardTemplateRef.current) {
        try {
          // Wait for template to render fully (images, layout, etc.)
          await new Promise(resolve => setTimeout(resolve, 3000));
          const capturedUri = await captureRef(cardTemplateRef.current, {
            format: "png",
            quality: 1,
            result: "tmpfile",
          });
          console.log("✅ Business card template captured:", capturedUri);
          
          // Copy to a known writable location with proper extension for sharing
          if (ExpoFileSystem && capturedUri) {
            const destUri = ExpoFileSystem.cacheDirectory + "referral_card_" + Date.now() + ".png";
            await ExpoFileSystem.copyAsync({ from: capturedUri, to: destUri });
            const fileInfo = await ExpoFileSystem.getInfoAsync(destUri);
            console.log("📊 Image copied to:", destUri, "| exists:", fileInfo.exists, "| size:", fileInfo.size);
            if (fileInfo.exists && fileInfo.size > 0) {
              imageUri = destUri;
            } else {
              // Use original if copy had issues but original exists
              imageUri = capturedUri;
            }
          } else {
            imageUri = capturedUri;
          }
        } catch (captureError: any) {
          console.warn("⚠️ Could not capture card template:", captureError?.message || captureError);
        }
      } else {
        console.warn("⚠️ Cannot capture card image.", 
          !captureRef ? "react-native-view-shot not loaded." : "",
          !cardTemplateRef.current ? "Card template ref not attached (card may not be rendered yet)." : ""
        );
      }

      console.log("🔍 Share debug - imageUri:", imageUri, "| RNShare:", !!RNShare, "| ExpoSharing:", !!ExpoSharing);

      // --- Step 2: Share with image using best available method ---
      if (imageUri) {
        let shared = false;
        
        // Method A: react-native-share (supports image + message together)
        if (RNShare && !shared) {
          try {
            console.log("📤 Trying react-native-share with image...");
            const filePrefix = Platform.OS === "android" ? "file://" : "";
            const shareUrl = imageUri.startsWith("file://") ? imageUri : filePrefix + imageUri;
            await RNShare.open({
              title: "Join InstantllyCards",
              message: message,
              url: shareUrl,
              type: "image/png",
              subject: "Join InstantllyCards",
            });
            shared = true;
            console.log("✅ Shared via react-native-share");
          } catch (shareError: any) {
            if (shareError?.message === "User did not share") {
              shared = true; // User cancelled, don't retry
            } else {
              console.warn("⚠️ react-native-share failed:", shareError?.message);
            }
          }
        }

        // Method B: expo-sharing (reliable Expo-managed fallback, shares image file)
        if (ExpoSharing && !shared) {
          try {
            const isAvailable = await ExpoSharing.isAvailableAsync();
            if (isAvailable) {
              console.log("📤 Trying expo-sharing with image...");
              // expo-sharing only shares the file, so copy message to clipboard first
              Clipboard.setString(message);
              Alert.alert(
                "Referral Message Copied!",
                "The referral message has been copied to your clipboard. Paste it along with the card image.",
                [{ text: "OK" }]
              );
              await ExpoSharing.shareAsync(imageUri, {
                mimeType: "image/png",
                dialogTitle: "Share Referral Card",
              });
              shared = true;
              console.log("✅ Shared via expo-sharing");
            }
          } catch (expoShareError: any) {
            console.warn("⚠️ expo-sharing failed:", expoShareError?.message);
          }
        }

        // Method C: Text-only fallback
        if (!shared) {
          console.log("📤 Falling back to text-only share");
          await Share.share({ message, title: "Join InstantllyCards" });
        }
      } else {
        // No image captured - text-only share
        console.log("📤 No image available, sharing text only");
        await Share.share({ message, title: "Join InstantllyCards" });
      }
    } catch (error: any) {
      if (error?.message !== "User did not share") {
        console.error("Error sharing:", error);
        Alert.alert(
          "Error",
          `Failed to share referral: ${error?.message || "Unknown error"}. Please try again.`,
          [{ text: "OK" }],
        );
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (!stats?.referralCode) return;
    const referralLink = `https://play.google.com/store/apps/details?id=com.instantllycards.www.twa&referrer=utm_source%3Dreferral%26utm_campaign%3D${stats.referralCode}`;
    Clipboard.setString(referralLink);
    Alert.alert("Copied!", "Referral link copied to clipboard");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referral Program</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral Program</Text>
        <TouchableOpacity
          onPress={() => router.push("/transfer-credits")}
          style={styles.transferButton}
        >
          <Ionicons name="swap-horizontal" size={20} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom + 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#8B5CF6"]}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Refer & Earn Banner - above the credits card */}
        <ReferralBanner style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 12 }} />

        <TouchableOpacity
          style={styles.creditsBannerContainer}
          onPress={() => router.push("/referral/credits-history" as any)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["#ECFDF5", "#D1FAE5"]}
            style={styles.creditsBanner}
          >
            <View style={styles.creditsContent}>
              {userName && (
                <View style={styles.userInfoRow}>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={18} color="#059669" />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{userName}</Text>
                    {userPhone && (
                      <Text style={styles.userPhone}>{userPhone}</Text>
                    )}
                  </View>
                </View>
              )}
              <View style={styles.creditsLabelRow}>
                <Ionicons name="sparkles" size={16} color="#059669" />
                <Text style={styles.creditsLabel}>
                  Available Balance Credit
                </Text>
              </View>
              <View style={styles.creditsAmountRow}>
                <Text
                  style={styles.creditsAmount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  ₹{formatIndianNumber(userCredits || 0)}
                </Text>
              </View>
              <Text style={styles.creditsUnit}>Ready to use</Text>
              <Text style={styles.expiryDateText}>Expires: 31 December 2026 • {(() => {
                const today = new Date();
                const expiryDate = new Date('2026-12-31');
                const diffTime = expiryDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays > 0 ? diffDays : 0;
              })()} days left</Text>
            </View>
          </LinearGradient>
          <View style={styles.creditsHintContainer}>
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text style={styles.creditsHintText}>
              {" "}
              View transaction history
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* Track Referral Status Button */}
        <TouchableOpacity
          style={styles.trackStatusButton}
          onPress={() => router.push("/referral/track-status" as any)}
        >
          <Ionicons name="trending-up" size={20} color="#FFFFFF" />
          <Text style={styles.trackStatusText}>Track Referral Status</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/referral/track-status" as any)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.statIconContainer, { backgroundColor: "#EDE9FE" }]}
            >
              <Ionicons name="people" size={26} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>
              {formatIndianNumber(stats?.totalReferrals || 0)}
            </Text>
            <Text style={styles.statLabel}>Successful</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#FEF3C7" }]}
            >
              <Ionicons name="gift" size={26} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>
              {formatIndianNumber(stats?.totalCreditsEarned || 0)}
            </Text>
            <Text style={styles.statLabel}>Credits</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </View>

        {/* Referral Link Card */}
        <View style={styles.referralLinkCard}>
          <Text style={styles.referralLinkTitle}>Your Unique Code</Text>
          <Text style={styles.referralLinkSubtitle}>
            Share with friends to earn rewards
          </Text>

          <TouchableOpacity
            style={styles.codeBox}
            onPress={handleCopyLink}
            activeOpacity={0.7}
          >
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>REFERRAL CODE</Text>
              <Text style={styles.codeText}>
                {stats?.referralCode ? stats.referralCode : "Loading..."}
              </Text>
              <Text style={styles.tapToCopyText}>Tap to copy link</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButtonMain, isSharing && { opacity: 0.7 }]}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="share-social" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.shareButtonMainText}>
              {isSharing ? "Sharing..." : "Share Referral Link"}
            </Text>
            {!isSharing && <Ionicons name="arrow-forward-circle" size={20} color="#FFFFFF" />}
          </TouchableOpacity>

          <View style={styles.shareHint}>
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            <Ionicons name="chatbubbles" size={16} color="#007AFF" />
            <Ionicons name="mail" size={16} color="#EA4335" />
            <Text style={styles.shareHintText}>
              WhatsApp, SMS, Email & more
            </Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksCard}>
          <View style={styles.howItWorksHeader}>
            <View style={styles.howItWorksBadge}>
              <Text style={styles.howItWorksIcon}>💡</Text>
            </View>
            <View>
              <Text style={styles.howItWorksTitle}>How It Works</Text>
              <Text style={styles.howItWorksSubtitle}>
                3 simple steps to earn
              </Text>
            </View>
          </View>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Share Your Link</Text>
                <Text style={styles.stepText}>
                  Click on the share referral link button to share your unique
                  code with your friends via any Platform
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Friend Signs Up</Text>
                <Text style={styles.stepText}>
                  They download the app, register and receive{" "}
                  <Text style={styles.highlight}>
                    {config?.signupBonus || 200} bonus credits
                  </Text>
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>You Both Win!</Text>
                <Text style={styles.stepText}>
                  You get{" "}
                  <Text style={styles.highlight}>
                    {config?.referralReward || 300} credits
                  </Text>{" "}
                  instantly when they complete signup
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.benefitsBanner}>
            <Ionicons name="trophy" size={20} color="#F59E0B" />
            <Text style={styles.benefitsText}>
              Unlimited referrals = Unlimited earnings!
            </Text>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Hidden BusinessCardTemplate for image capture
          - Card template is 1050x600px - container must be big enough
          - Using transform translateY to move off-screen (Android still renders transformed views)
          - collapsable={false} prevents Android from optimizing away the view
      */}
      {userCard && (
        <View style={{ position: 'absolute', left: 0, top: 0, zIndex: -1, pointerEvents: 'none', transform: [{ translateY: -10000 }] }}>
          <View 
            ref={cardTemplateRef} 
            collapsable={false} 
            onLayout={() => {
              console.log('✅ Card template rendered and laid out');
              setCardReady(true);
            }}
            style={{ backgroundColor: '#FFFFFF', width: 1050, height: 600 }}
          >
            <BusinessCardTemplate
              name={userCard.name || ''}
              designation={userCard.designation || ''}
              companyName={userCard.companyName || userCard.name || 'Company'}
              personalPhone={fullPersonal}
              companyPhone={fullCompany}
              email={userCard.email}
              companyEmail={userCard.companyEmail}
              website={userCard.website}
              companyWebsite={userCard.companyWebsite}
              address={userCard.location || userCard.companyAddress}
              companyAddress={userCard.companyAddress}
              companyPhoto={userCard.companyPhoto}
              location={userCard.location}
              mapsLink={userCard.mapsLink}
              companyMapsLink={userCard.companyMapsLink}
              message={userCard.message}
              linkedin={userCard.linkedin}
              twitter={userCard.twitter}
              instagram={userCard.instagram}
              facebook={userCard.facebook}
              youtube={userCard.youtube}
              whatsapp={userCard.whatsapp}
              telegram={userCard.telegram}
            />
          </View>
        </View>
      )}

      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 60,
          left: 0,
          right: 0,
        }}
      >
        <FooterCarousel />
      </View>
      <CustomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 4,
  },
  transferButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  creditsBannerContainer: {
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  creditsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 22,
  },
  creditsHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 4,
  },
  creditsHintText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  creditsContent: {
    flex: 1,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#A7F3D0",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "500",
  },
  creditsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  creditsLabel: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  creditsAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
    width: "100%",
  },
  creditsAmount: {
    fontSize: 36,
    fontWeight: "900",
    color: "#10B981",
    flexShrink: 1,
  },
  creditsUnit: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "500",
  },
  expiryDateText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "400",
    marginTop: 2,
    opacity: 0.8,
  },
  creditsIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  trackStatusButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  trackStatusText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  statIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  statValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "500",
  },
  referralLinkCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  referralLinkTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  referralLinkSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 20,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#8B5CF6",
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    backgroundColor: "#FAF5FF",
  },
  codeSection: {
    flex: 1,
    paddingRight: 8,
  },
  codeLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 6,
    letterSpacing: 1.2,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  codeText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#8B5CF6",
    marginBottom: 8,
    letterSpacing: 2,
  },
  linkPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkText: {
    fontSize: 11,
    color: "#8B5CF6",
    fontWeight: "500",
    flex: 1,
  },
  tapToCopyText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "400",
    marginTop: 4,
  },
  copyIconButton: {
    alignItems: "center",
    gap: 6,
  },
  copyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  copyText: {
    fontSize: 11,
    color: "#8B5CF6",
    fontWeight: "700",
  },
  shareButtonMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    borderRadius: 14,
    padding: 22,
    gap: 12,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  shareButtonMainText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  shareHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    gap: 8,
  },
  shareHintText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    marginLeft: 4,
  },
  howItWorksCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  howItWorksHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    gap: 12,
  },
  howItWorksBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  howItWorksIcon: {
    fontSize: 26,
  },
  howItWorksTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  howItWorksSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  stepsList: {
    gap: 0,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 12,
  },
  stepNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    fontWeight: "400",
  },
  stepConnector: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
    marginLeft: 54,
  },
  highlight: {
    color: "#8B5CF6",
    fontWeight: "700",
  },
  benefitsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    padding: 14,
    borderRadius: 12,
    marginTop: 18,
    gap: 8,
  },
  benefitsText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
  },
});
