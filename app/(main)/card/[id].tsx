// app/(main)/card/[id].tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Linking, TouchableOpacity, Share, ActivityIndicator, Animated } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ensureAuth } from "../../../lib/auth";
import api from "../../../lib/api";
import BusinessAvatar from "../../../components/BusinessAvatar";


export default function CardDetail() {
  const { id, cardData } = useLocalSearchParams<{ id: string; cardData: string }>();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ⚡ Animated shimmer effect for skeleton
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const isUnmounted = useRef(false);
  const hasInitialized = useRef(false);

  // ⚡ OPTIMIZATION: Memoize calculated values - MUST be before any returns (Rules of Hooks)
  const fullPersonal = useMemo(() => {
    if (!card?.personalPhone) return "";
    return card?.personalCountryCode 
      ? `+${card.personalCountryCode}${card.personalPhone}`
      : card.personalPhone;
  }, [card?.personalCountryCode, card?.personalPhone]);

  const fullCompany = useMemo(() => {
    if (!card?.companyPhone) return "";
    return card?.companyCountryCode
      ? `+${card.companyCountryCode}${card.companyPhone}`
      : card.companyPhone;
  }, [card?.companyCountryCode, card?.companyPhone]);

  // Memoize keywords array
  const keywords = useMemo(() => {
    return card?.keywords ? card.keywords.split(',').map((k: string) => k.trim()) : [];
  }, [card?.keywords]);

  // Memoize services array from servicesOffered string
  const services = useMemo(() => {
    return card?.servicesOffered ? card.servicesOffered.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  }, [card?.servicesOffered]);

  // ⚡ Shimmer animation effect
  useEffect(() => {
    if (loading) {
      // Start shimmer animation
      shimmerAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.current.start();
    } else {
      // Stop animation when loading completes
      if (shimmerAnimation.current) {
        shimmerAnimation.current.stop();
        shimmerAnimation.current = null;
      }
    }

    // ⚡ CRITICAL: Cleanup animation on unmount
    return () => {
      if (shimmerAnimation.current) {
        shimmerAnimation.current.stop();
        shimmerAnimation.current = null;
      }
    };
  }, [loading, shimmerAnim]);

  // ⚡ RESET state when navigating to new card (prevents stuck screens)
  useFocusEffect(
    useCallback(() => {
      // Reset tracking flags when screen focuses
      isUnmounted.current = false;
      hasInitialized.current = false;
      
      // Cleanup when screen loses focus
      return () => {
        isUnmounted.current = true;
        // Stop any ongoing animations
        if (shimmerAnimation.current) {
          shimmerAnimation.current.stop();
          shimmerAnimation.current = null;
        }
      };
    }, [])
  );

  // ⚡ SMOOTH FLOW: Parse card data asynchronously to avoid UI blocking
  useEffect(() => {
    // Prevent re-initialization if already done
    if (hasInitialized.current) {
      console.log("⏭️ Skipping re-initialization - already loaded");
      return;
    }

    const initializeCard = async () => {
      // Early exit if component unmounted
      if (isUnmounted.current) return;

      try {
        setLoading(true);
        setError(null);

        if (cardData) {
          console.log("📄 Parsing cached card data...");
          
          // ⚡ Defer parsing to prevent blocking
          await new Promise(resolve => setTimeout(resolve, 0));
          
          // Check unmount again before parsing
          if (isUnmounted.current) return;
          
          const parsedCard = JSON.parse(cardData);
          
          // Check unmount before updating state
          if (isUnmounted.current) return;
          
          // Small delay for smooth transition
          await new Promise(resolve => setTimeout(resolve, 50));
          
          if (!isUnmounted.current) {
            setCard(parsedCard);
            setLoading(false);
            hasInitialized.current = true;
            console.log("✅ Card rendered from cache");
          }
          
          // ⚡ ALWAYS fetch fresh data in background to get updated fields
          if (id && !isUnmounted.current) {
            console.log("🔄 Fetching fresh data in background...");
            await fetchCardById(id);
          }
          return;
        }
        
        // No cached data - fetch from server
        if (id && !isUnmounted.current) {
          console.log("🔍 No cache - fetching card:", id);
          await fetchCardById(id);
          hasInitialized.current = true;
        } else {
          if (!isUnmounted.current) {
            setError("No card ID provided");
            setLoading(false);
          }
        }
      } catch (parseError) {
        console.error("❌ Parse error:", parseError);
        // Fallback to fetching if parse fails
        if (id && !isUnmounted.current) {
          await fetchCardById(id);
          hasInitialized.current = true;
        } else {
          if (!isUnmounted.current) {
            setError("Invalid card data");
            setLoading(false);
          }
        }
      }
    };

    initializeCard();

    // Cleanup function
    return () => {
      isUnmounted.current = true;
    };
  }, [id, cardData]);

  const fetchCardById = async (cardId: string) => {
    try {
      // Early exit if unmounted
      if (isUnmounted.current) return;

      setLoading(true);
      setError(null);
      
      const token = await ensureAuth();
      if (!token || isUnmounted.current) {
        if (!isUnmounted.current) {
          setError("Authentication required");
          setLoading(false);
        }
        return;
      }

      console.log("🔍 Fetching card with ID:", cardId);
      
      // ⚡ OPTIMIZATION: Fetch from all sources in PARALLEL instead of sequential
      const [userCardsResult, publicFeedResult, directCardResult] = await Promise.allSettled([
        api.get('/cards').catch(() => ({ data: [] })),
        api.get('/cards/feed/public').catch(() => ({ data: [] })),
        api.get(`/cards/${cardId}`).catch(() => ({ data: null }))
      ]);

      // Check if component unmounted during fetch
      if (isUnmounted.current) return;

      let foundCard = null;

      // Check user's cards first
      if (userCardsResult.status === 'fulfilled' && userCardsResult.value?.data) {
        const userCards = userCardsResult.value.data || [];
        foundCard = userCards.find((c: any) => c._id === cardId);
        if (foundCard) {
          console.log("✅ Found in user's cards:", foundCard.companyName || foundCard.name);
          setCard(foundCard);
          setLoading(false);
          return;
        }
      }

      // Check public feed
      if (publicFeedResult.status === 'fulfilled' && publicFeedResult.value?.data) {
        const publicCards = publicFeedResult.value.data || [];
        foundCard = publicCards.find((c: any) => c._id === cardId);
        if (foundCard) {
          console.log("✅ Found in public feed:", foundCard.companyName || foundCard.name);
          setCard(foundCard);
          setLoading(false);
          return;
        }
      }

      // Check direct endpoint
      if (directCardResult.status === 'fulfilled' && directCardResult.value?.data) {
        foundCard = directCardResult.value.data;
        if (foundCard && foundCard._id === cardId) {
          console.log("✅ Found via direct endpoint:", foundCard.companyName || foundCard.name);
          setCard(foundCard);
          setLoading(false);
          return;
        }
      }

      console.log("❌ Card not found in any source");
      if (!isUnmounted.current) {
        setError("Card not found or no access");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error fetching card:", error);
      if (!isUnmounted.current) {
        setError("Failed to load card");
        setLoading(false);
      }
    }
  };

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleWhatsApp = (whatsapp: string) => {
    if (whatsapp) {
      const num = whatsapp.replace(/^https?:\/\/(wa\.me\/)/, "");
      Linking.openURL(`https://wa.me/${num}`);
    }
  };

  const handleWebsite = (website: string) => {
    if (website) {
      const url = website.startsWith('http') ? website : `https://${website}`;
      Linking.openURL(url);
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  if (loading) {
    const shimmerOpacity = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    const SkeletonBox = ({ style }: any) => (
      <Animated.View style={[style, { opacity: shimmerOpacity }]} />
    );

    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={s.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Loading...</Text>
          <View style={{ width: 80 }} />
        </View>
        
        {/* ⚡ SMOOTH Animated Skeleton Loading UI */}
        <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
          {/* Photo skeleton */}
          <SkeletonBox style={s.skeletonPhoto} />
          
          {/* Title skeleton */}
          <SkeletonBox style={s.skeletonTitle} />
          
          {/* Subtitle skeleton */}
          <SkeletonBox style={s.skeletonSubtitle} />
          
          {/* Keywords skeleton */}
          <View style={s.skeletonKeywords}>
            <SkeletonBox style={s.skeletonTag} />
            <SkeletonBox style={s.skeletonTag} />
            <SkeletonBox style={s.skeletonTag} />
          </View>
          
          {/* Contact info skeleton */}
          <View style={s.skeletonSection}>
            <SkeletonBox style={s.skeletonSectionTitle} />
            <SkeletonBox style={s.skeletonContactItem} />
            <SkeletonBox style={s.skeletonContactItem} />
            <SkeletonBox style={s.skeletonContactItem} />
          </View>
          
          {/* Location skeleton */}
          <View style={s.skeletonSection}>
            <SkeletonBox style={s.skeletonSectionTitle} />
            <SkeletonBox style={s.skeletonLine} />
          </View>
          
          {/* Loading indicator at bottom */}
          <View style={s.loadingCenter}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={s.loadingText}>Loading card details...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !card) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={s.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Business Details</Text>
        </View>
        <View style={s.loading}>
          <Text style={s.errorText}>{error || "Card not found"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header with Back Button */}
      <View style={s.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={s.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Business Details</Text>
        <View style={s.shareHeaderButton} />
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Top Section with Avatar */}
        <View style={s.topSection}>
          {/* Business Photo with fallback avatar */}
          <BusinessAvatar 
            companyPhoto={card.companyPhoto}
            companyName={card.companyName}
            size={120}
            style={s.photo}
            backgroundColor="#EFF6FF"
          />

          {/* Company Name */}
          <Text style={s.companyName}>{card.companyName || card.name}</Text>

          {/* Services as Categories */}
          {services.length > 0 && (
            <View style={s.infoRow}>
              <Text style={s.infoText}>{services.slice(0, 2).join(' • ')}</Text>
            </View>
          )}

          {/* Established Year */}
          {card.establishedYear && (
            <View style={s.ratingRow}>
              <View style={s.estContainer}>
                <Ionicons name="calendar" size={16} color="#6B7280" />
                <Text style={s.estText}>Est. {card.establishedYear}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Action Buttons - Circular */}
        <View style={s.actionsContainer}>
          <TouchableOpacity 
            style={s.actionButton} 
            onPress={() => handleCall(fullCompany || fullPersonal)}
          >
            <View style={[s.actionCircle, s.callCircle]}>
              <Ionicons name="call" size={24} color="#FFFFFF" />
            </View>
            <Text style={s.actionLabel}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.actionButton}
            onPress={() => handleEmail(card.companyEmail || card.email)}
          >
            <View style={[s.actionCircle, s.emailCircle]}>
              <Ionicons name="mail" size={24} color="#FFFFFF" />
            </View>
            <Text style={s.actionLabel}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.actionButton}
            onPress={() => {
              const mapsUrl = card.companyMapsLink || card.mapsLink;
              if (mapsUrl) Linking.openURL(mapsUrl);
            }}
          >
            <View style={[s.actionCircle, s.directionCircle]}>
              <Ionicons name="navigate" size={24} color="#FFFFFF" />
            </View>
            <Text style={s.actionLabel}>Direction</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.actionButton}
            onPress={() => handleWebsite(card.companyWebsite || card.website)}
          >
            <View style={[s.actionCircle, s.websiteCircle]}>
              <Ionicons name="globe" size={24} color="#FFFFFF" />
            </View>
            <Text style={s.actionLabel}>Website</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        {(card.aboutBusiness || card.message) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.messageText}>{card.aboutBusiness || card.message}</Text>
          </View>
        )}

        {/* Contact Information */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Contact Information</Text>
          
          {(() => {
            console.log('� All Card Data:', {
              companyEmail: card.companyEmail,
              email: card.email,
              companyWebsite: card.companyWebsite,
              website: card.website,
              companyAddress: card.companyAddress,
              location: card.location,
              businessHours: card.businessHours,
              servicesOffered: card.servicesOffered,
              establishedYear: card.establishedYear,
              aboutBusiness: card.aboutBusiness,
              message: card.message
            });
            return null;
          })()}
          
          {(fullCompany || fullPersonal) && (
            <View style={s.contactRow}>
              <View style={s.contactIconContainer}>
                <Ionicons name="call" size={20} color="#3B82F6" />
              </View>
              <View style={s.contactContent}>
                <Text style={s.contactLabel}>Phone</Text>
                <TouchableOpacity onPress={() => handleCall(fullCompany || fullPersonal)}>
                  <Text style={s.contactValue}>{fullCompany || fullPersonal}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {(card.companyEmail || card.email) && (
            <View style={s.contactRow}>
              <View style={s.contactIconContainer}>
                <Ionicons name="mail" size={20} color="#3B82F6" />
              </View>
              <View style={s.contactContent}>
                <Text style={s.contactLabel}>Email</Text>
                <TouchableOpacity onPress={() => handleEmail(card.companyEmail || card.email)}>
                  <Text style={s.contactValue}>{card.companyEmail || card.email}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {(card.companyWebsite || card.website) && (
            <View style={s.contactRow}>
              <View style={s.contactIconContainer}>
                <Ionicons name="globe" size={20} color="#3B82F6" />
              </View>
              <View style={s.contactContent}>
                <Text style={s.contactLabel}>Website</Text>
                <TouchableOpacity onPress={() => handleWebsite(card.companyWebsite || card.website)}>
                  <Text style={s.contactValue}>{card.companyWebsite || card.website}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {(card.companyAddress || card.location) && (
            <View style={s.contactRow}>
              <View style={s.contactIconContainer}>
                <Ionicons name="location" size={20} color="#3B82F6" />
              </View>
              <View style={s.contactContent}>
                <Text style={s.contactLabel}>Address</Text>
                <Text style={s.contactValue}>{card.companyAddress || card.location}</Text>
              </View>
            </View>
          )}

          {card.businessHours && (() => {
            try {
              const schedule = JSON.parse(card.businessHours);
              const openDays = Object.entries(schedule).filter(([_, hours]: [string, any]) => hours.open);
              if (openDays.length > 0) {
                return (
                  <View style={s.contactRow}>
                    <View style={s.contactIconContainer}>
                      <Ionicons name="time" size={20} color="#3B82F6" />
                    </View>
                    <View style={s.contactContent}>
                      <Text style={s.contactLabel}>Business Hours</Text>
                      {openDays.map(([day, hours]: [string, any]) => {
                        const formatTime = (time: string) => {
                          const [hoursStr] = time.split(':');
                          const hour = parseInt(hoursStr);
                          const isPM = hour >= 12;
                          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          return `${displayHour} ${isPM ? 'PM' : 'AM'}`;
                        };
                        return (
                          <Text key={day} style={s.scheduleText}>
                            {day}: {formatTime(hours.openTime)} - {formatTime(hours.closeTime)}
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                );
              }
            } catch (e) {
              // Fallback for old format
              return (
                <View style={s.contactRow}>
                  <View style={s.contactIconContainer}>
                    <Ionicons name="time" size={20} color="#3B82F6" />
                  </View>
                  <View style={s.contactContent}>
                    <Text style={s.contactLabel}>Business Hours</Text>
                    <Text style={s.contactValue}>{card.businessHours}</Text>
                  </View>
                </View>
              );
            }
            return null;
          })()}
        </View>

        {/* Services Section */}
        {services.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Services Offered</Text>
            <View style={s.servicesContainer}>
              {services.map((service: string, index: number) => (
                <View key={index} style={s.serviceChip}>
                  <Text style={s.checkIcon}>✓</Text>
                  <Text style={s.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Social Media */}
        {(card.linkedin || card.twitter || card.instagram || card.facebook || card.youtube || card.telegram) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Social Media</Text>
            <View style={s.socialContainer}>
              {card.linkedin && (
                <TouchableOpacity style={s.socialButton} onPress={() => Linking.openURL(card.linkedin)}>
                  <Text style={s.socialText}>LinkedIn</Text>
                </TouchableOpacity>
              )}
              {card.twitter && (
                <TouchableOpacity style={s.socialButton} onPress={() => Linking.openURL(card.twitter)}>
                  <Text style={s.socialText}>Twitter</Text>
                </TouchableOpacity>
              )}
              {card.instagram && (
                <TouchableOpacity style={s.socialButton} onPress={() => Linking.openURL(card.instagram)}>
                  <Text style={s.socialText}>Instagram</Text>
                </TouchableOpacity>
              )}
              {card.facebook && (
                <TouchableOpacity style={s.socialButton} onPress={() => Linking.openURL(card.facebook)}>
                  <Text style={s.socialText}>Facebook</Text>
                </TouchableOpacity>
              )}
              {card.youtube && (
                <TouchableOpacity style={s.socialButton} onPress={() => Linking.openURL(card.youtube)}>
                  <Text style={s.socialText}>YouTube</Text>
                </TouchableOpacity>
              )}
              {card.telegram && (
                <TouchableOpacity style={s.socialButton} onPress={() => Linking.openURL(card.telegram)}>
                  <Text style={s.socialText}>Telegram</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={s.bottomActions}>
        {(fullCompany || fullPersonal) && (
          <TouchableOpacity 
            style={s.primaryButton} 
            onPress={() => handleCall(fullCompany || fullPersonal)}
          >
            <Text style={s.primaryButtonText}>📞 Call Now</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={s.secondaryButton} 
          onPress={() => {
            // Navigate to card selection screen with recipient info
            const recipientName = card.companyName || card.name || 'Contact';
            const recipientId = card.userId || card.owner || card._id;
            router.push(`/select-card-for-contacts?recipientId=${recipientId}&recipientName=${encodeURIComponent(recipientName)}` as any);
          }}
        >
          <Text style={s.secondaryButtonText}>🔗 Share My Card</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  backText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  loading: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: { 
    fontSize: 16, 
    color: "#6B7280",
    marginTop: 16,
    fontWeight: "500",
  },
  errorText: { fontSize: 16, color: "#DC2626" },
  // Top Section with Avatar and Info
  topSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarRow: {
    alignItems: "center",
    marginBottom: 16,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  estContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  starIcon: {
    fontSize: 18,
    color: "#FBBF24",
  },
  ratingCount: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  // Circular Action Buttons
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
  },
  actionButton: {
    alignItems: "center",
    gap: 8,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
    textAlign: "center",
  },
  // Sections
  section: { 
    marginBottom: 28,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  // Contact Rows
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  contactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  contactIconBlue: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 4,
    fontWeight: "500",
  },
  contactValue: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  scheduleText: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
    marginBottom: 4,
  },
  // Services
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  checkIcon: {
    fontSize: 14,
    color: "#10B981",
    marginRight: 6,
    fontWeight: "700",
  },
  serviceText: {
    fontSize: 14,
    color: "#065F46",
    fontWeight: "500",
  },
  // Social Media
  socialContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  socialButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Bottom Actions
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  // ⚡ Animated Skeleton loading styles
  skeletonPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "#E5E7EB",
  },
  skeletonTitle: {
    width: "80%",
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 12,
  },
  skeletonSubtitle: {
    width: "60%",
    height: 20,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 24,
  },
  skeletonKeywords: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  skeletonTag: {
    width: 80,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  skeletonSection: {
    marginBottom: 24,
  },
  skeletonSectionTitle: {
    width: "40%",
    height: 20,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  skeletonContactItem: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginBottom: 8,
  },
  skeletonLine: {
    width: "100%",
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  loadingCenter: {
    alignItems: "center",
    paddingVertical: 40,
  },
  shareHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  shareIcon: {
    fontSize: 20,
    color: "#3B82F6",
  },
  backIcon: {
    fontSize: 20,
    color: "#3B82F6",
    fontWeight: "600",
  },
  star: {
    fontSize: 16,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  reviews: {
    fontSize: 12,
    color: "#6B7280",
  },
  calendarIcon: {
    fontSize: 14,
  },
  estText: {
    fontSize: 12,
    color: "#6B7280",
  },
  dot: {
    fontSize: 14,
    color: "#D1D5DB",
  },
  photo: {
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callCircle: {
    backgroundColor: "#10B981",
  },
  emailCircle: {
    backgroundColor: "#3B82F6",
  },
  directionCircle: {
    backgroundColor: "#F472B6",
  },
  websiteCircle: {
    backgroundColor: "#8B5CF6",
  },
});