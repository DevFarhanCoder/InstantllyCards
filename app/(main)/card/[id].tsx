// app/(main)/card/[id].tsx
import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Linking, TouchableOpacity, Share, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/lib/api";
import { ensureAuth } from "@/lib/auth";

export default function CardDetail() {
  const { id, cardData } = useLocalSearchParams<{ id: string; cardData: string }>();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  // ⚡ OPTIMIZATION: Memoize calculated values - MUST be before any returns (Rules of Hooks)
  const fullPersonal = useMemo(() => {
    return card?.personalCountryCode && card?.personalPhone
      ? `+${card.personalCountryCode}${card.personalPhone}` : "";
  }, [card?.personalCountryCode, card?.personalPhone]);

  const fullCompany = useMemo(() => {
    return card?.companyCountryCode && card?.companyPhone
      ? `+${card.companyCountryCode}${card.companyPhone}` : "";
  }, [card?.companyCountryCode, card?.companyPhone]);

  // Memoize keywords array
  const keywords = useMemo(() => {
    return card?.keywords ? card.keywords.split(',').map((k: string) => k.trim()) : [];
  }, [card?.keywords]);

  // Parse the card data from navigation params or fetch it
  useEffect(() => {
    const initializeCard = async () => {
      if (cardData) {
        try {
          console.log("📄 Using cached card data");
          const parsedCard = JSON.parse(cardData);
          
          // Immediately set the card without delay - instant rendering
          setCard(parsedCard);
          setLoading(false);
        } catch (error) {
          console.error("❌ Error parsing card data:", error);
          // Only fetch if parsing fails
          if (id) {
            await fetchCardById(id);
          } else {
            setError("Invalid card data");
            setLoading(false);
          }
        }
      } else if (id) {
        console.log("🔍 No cached data, fetching card with ID:", id);
        await fetchCardById(id);
      } else {
        setError("No card ID or data provided");
        setLoading(false);
      }
    };

    initializeCard();
  }, [id, cardData]);

  const fetchCardById = async (cardId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await ensureAuth();
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      console.log("🔍 Fetching card with ID:", cardId);
      
      // ⚡ OPTIMIZATION: Fetch from all sources in PARALLEL instead of sequential
      const [userCardsResult, publicFeedResult, directCardResult] = await Promise.allSettled([
        api.get('/cards').catch(() => ({ data: [] })),
        api.get('/cards/feed/public').catch(() => ({ data: [] })),
        api.get(`/cards/${cardId}`).catch(() => ({ data: null }))
      ]);

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
      setError("Card not found or no access");
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching card:", error);
      setError("Failed to load card");
      setLoading(false);
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
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Business Profile</Text>
          <View style={{ width: 80 }} />
        </View>
        
        {/* Skeleton Loading UI */}
        <ScrollView style={s.content}>
          <View style={s.skeletonPhoto} />
          <View style={s.skeletonTitle} />
          <View style={s.skeletonSubtitle} />
          <View style={s.skeletonSection}>
            <View style={s.skeletonLine} />
            <View style={s.skeletonLine} />
            <View style={s.skeletonLine} />
          </View>
          <View style={s.loadingCenter}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={s.loadingText}>Loading business card...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !card) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
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
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Business Profile</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Business Photo with optimized loading */}
        {card.companyPhoto && (
          <Image 
            source={{ uri: card.companyPhoto }} 
            style={s.photo}
            resizeMode="cover"
            progressiveRenderingEnabled={true}
            fadeDuration={200}
          />
        )}

        {/* Company Name */}
        <Text style={s.companyName}>{card.companyName || card.name}</Text>

        {/* Personal Info */}
        {card.name && card.name !== card.companyName && (
          <Text style={s.personName}>{card.name}</Text>
        )}
        {card.designation && (
          <Text style={s.designation}>{card.designation}</Text>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <View style={s.keywordsSection}>
            <Text style={s.sectionTitle}>Specialties</Text>
            <View style={s.keywordsContainer}>
              {keywords.map((keyword: string, index: number) => (
                <View key={index} style={s.keywordTag}>
                  <Text style={s.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact Information */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Contact Information</Text>
          
          {(fullCompany || fullPersonal) && (
            <TouchableOpacity 
              style={s.contactItem} 
              onPress={() => handleCall(fullCompany || fullPersonal)}
            >
              <Text style={s.contactIcon}>📞</Text>
              <Text style={s.contactText}>{fullCompany || fullPersonal}</Text>
            </TouchableOpacity>
          )}

          {(card.companyEmail || card.email) && (
            <TouchableOpacity 
              style={s.contactItem} 
              onPress={() => handleEmail(card.companyEmail || card.email)}
            >
              <Text style={s.contactIcon}>📧</Text>
              <Text style={s.contactText}>{card.companyEmail || card.email}</Text>
            </TouchableOpacity>
          )}

          {(card.companyWebsite || card.website) && (
            <TouchableOpacity 
              style={s.contactItem} 
              onPress={() => handleWebsite(card.companyWebsite || card.website)}
            >
              <Text style={s.contactIcon}>🌐</Text>
              <Text style={s.contactText}>{card.companyWebsite || card.website}</Text>
            </TouchableOpacity>
          )}

          {card.whatsapp && (
            <TouchableOpacity 
              style={s.contactItem} 
              onPress={() => handleWhatsApp(card.whatsapp)}
            >
              <Text style={s.contactIcon}>💬</Text>
              <Text style={s.contactText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Location */}
        {(card.companyAddress || card.location) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Location</Text>
            <Text style={s.locationText}>{card.companyAddress || card.location}</Text>
          </View>
        )}

        {/* Message */}
        {card.message && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.messageText}>{card.message}</Text>
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
            const shareContent = {
              title: `${card.companyName || card.name}'s Business Card`,
              message: `Check out ${card.companyName || card.name}'s business profile!\n\nCompany: ${card.companyName || card.name}\nLocation: ${card.companyAddress || card.location || 'N/A'}\nPhone: ${fullCompany || fullPersonal || 'N/A'}\n\nConnect with them today!`,
            };
            
            Share.share({
              message: shareContent.message,
              title: shareContent.title,
            }).catch((error) => console.error('Error sharing:', error));
          }}
        >
          <Text style={s.secondaryButtonText}>🔗 Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  },
  content: { flex: 1, padding: 16 },
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
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "#E5E7EB",
  },
  companyName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  personName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 4,
  },
  designation: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  keywordsSection: { marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  keywordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  keywordTag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  keywordText: { fontSize: 14, color: "#4338CA", fontWeight: "600" },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIcon: { fontSize: 20, marginRight: 12 },
  contactText: { fontSize: 16, color: "#374151", flex: 1 },
  locationText: {
    fontSize: 16,
    color: "#374151",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  messageText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  socialContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  socialButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  socialText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Skeleton loading styles
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
  skeletonSection: {
    marginBottom: 24,
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
});
