import React, { useState, useRef, useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View, Linking, Modal, Share, Alert, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../lib/api";
import { Ionicons } from "@expo/vector-icons";
import BusinessAvatar from "./BusinessAvatar";
import BusinessCardTemplate from "./BusinessCardTemplate";
import { generateAndShareCardImage } from "../utils/cardImageGenerator";

export default function CardRow({ c, showEditButton = false, onRefresh }: { c: any; showEditButton?: boolean; onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [menuModalVisible, setMenuModalVisible] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(1));
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [userReferralCode, setUserReferralCode] = useState<string>('');
    const cardTemplateRef = useRef(null);
    
    // Get current user ID for proper cache invalidation
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const userId = await AsyncStorage.getItem("currentUserId");
                if (userId) setCurrentUserId(userId);
            } catch (error) {
                console.error("CardRow: Failed to fetch user ID:", error);
            }
        };
        fetchUserId();
    }, []);
    
    const companyName = c.companyName || c.name || "Business";
    const ownerName = c.name && c.name !== c.companyName ? c.name : (c.designation || "Business Owner");
    // Business avatar will handle fallback internally
    const location = c.companyAddress || c.location || "";

    const fullPersonal = c.personalCountryCode && c.personalPhone
        ? `+${c.personalCountryCode}${c.personalPhone}` : "";
    const fullCompany = c.companyCountryCode && c.companyPhone
        ? `+${c.companyCountryCode}${c.companyPhone}` : "";

    // Fetch user's referral code on component mount
    useEffect(() => {
        const fetchUserReferralCode = async () => {
            try {
                // Fetch referral code from API
                const response = await api.get('/credits/referral-stats');
                if (response.success && response.referralCode) {
                    setUserReferralCode(response.referralCode);
                    console.log('🎁 User referral code loaded:', response.referralCode);
                }
            } catch (error) {
                console.error('Error fetching user referral code:', error);
                // Fallback: try to get from AsyncStorage
                try {
                    const userStr = await AsyncStorage.getItem('user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        if (user.referralCode) {
                            setUserReferralCode(user.referralCode);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching from AsyncStorage:', err);
                }
            }
        };
        fetchUserReferralCode();
    }, []);

    const handleCardPress = () => {
        // ⚡ OPTIMIZATION: Immediate animation feedback
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 80,
                useNativeDriver: true,
            }),
        ]).start();

        // ⚡ OPTIMIZATION: Instant navigation without setTimeout - show skeleton immediately
        console.log("Navigating with data:", c.companyName || c.name);
        if (showEditButton) {
            router.push(`/builder?edit=${c._id}`);
        } else {
            // Navigate immediately with card data - skeleton will show while rendering
            router.push({
                pathname: "/(main)/card/[id]",
                params: { id: c._id}
            });
        }
    };

    const handleEditPress = () => {
        setMenuModalVisible(false);
        router.push(`/builder?edit=${c._id}`);
    };

    const handleCallPress = (e: any) => {
        e.stopPropagation();
        const num = fullCompany || fullPersonal;
        if (!num) return;
        Linking.openURL(`tel:${num}`);
    };

    const handleDeletePress = async () => {
        setMenuModalVisible(false);
        
        Alert.alert(
            "Delete Card",
            "Are you sure you want to delete this business card?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            console.log('🗑️ Starting delete for card:', c._id);
                            
                            // 🚀 OPTIMISTIC UPDATE: Remove from UI immediately
                            console.log('⚡ Optimistic removal: Updating cache before API call...');
                            queryClient.setQueryData<any[]>(["cards", currentUserId], (oldCards) => {
                                if (!oldCards) return oldCards;
                                const filtered = oldCards.filter((card: any) => card._id !== c._id);
                                console.log(`📊 Optimistic: Removed card from cache (${oldCards.length} → ${filtered.length})`);
                                return filtered;
                            });
                            
                            let deletionSuccessful = false;
                            
                            try {
                                // Delete from server
                                await api.del(`/cards/${c._id}`);
                                console.log('✅ Server confirmed deletion (200 OK)');
                                
                                // 🔥 PRODUCTION FIX: Verify deletion worked
                                console.log('🔍 Verifying card was actually deleted from database...');
                                await new Promise(resolve => setTimeout(resolve, 800)); // Wait 800ms for DB sync
                                
                                try {
                                    const verifyResponse = await api.get(`/cards`);
                                    const stillExists = verifyResponse?.data?.find((card: any) => card._id === c._id);
                                    
                                    if (stillExists) {
                                        console.log('❌ PRODUCTION BUG: Card still exists after delete! Attempting second delete...');
                                        
                                        // Try delete again
                                        await api.del(`/cards/${c._id}`);
                                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait longer
                                        
                                        // Check again
                                        const recheckResponse = await api.get(`/cards`);
                                        const stillExistsAgain = recheckResponse?.data?.find((card: any) => card._id === c._id);
                                        
                                        if (stillExistsAgain) {
                                            console.log('❌❌ Still exists after 2 deletes. Trying third time...');
                                            await api.del(`/cards/${c._id}`);
                                            await new Promise(resolve => setTimeout(resolve, 1000));
                                            
                                            // Final check
                                            const finalCheck = await api.get(`/cards`);
                                            const stillExistsFinal = finalCheck?.data?.find((card: any) => card._id === c._id);
                                            
                                            if (stillExistsFinal) {
                                                // Rollback optimistic update
                                                console.log('🔄 Rolling back optimistic update...');
                                                queryClient.invalidateQueries({ queryKey: ["cards", currentUserId] });
                                                throw new Error('Production server failed to delete card after 3 attempts. Please try again or contact support.');
                                            }
                                        }
                                        
                                        console.log('✅ Card deleted after multiple attempts!');
                                    } else {
                                        console.log('✅ Verified: Card successfully deleted from database');
                                    }
                                } catch (verifyError) {
                                    console.log('ℹ️ Could not verify deletion (network error), trusting optimistic update');
                                }
                                
                                deletionSuccessful = true;
                            } catch (deleteError: any) {
                                // 404 means card already deleted = SUCCESS
                                if (deleteError?.message?.includes("Not found") || 
                                    deleteError?.message?.includes("already been deleted") ||
                                    deleteError?.status === 404) {
                                    console.log('✅ Card already deleted (404) - treating as success');
                                    deletionSuccessful = true;
                                } else {
                                    // Real error - rollback optimistic update
                                    console.log('❌ Real delete error, rolling back...');
                                    queryClient.invalidateQueries({ queryKey: ["cards", currentUserId] });
                                    throw deleteError;
                                }
                            }
                            
                            // If deletion successful, keep optimistic update and mark queries stale
                            if (deletionSuccessful) {
                                // DON'T refetch immediately - production DB has lag
                                // Just mark queries as stale so next navigation refetches
                                console.log('✅ Keeping optimistic update, marking queries stale for next refetch');
                                queryClient.invalidateQueries({ 
                                    queryKey: ["cards", currentUserId],
                                    refetchType: 'none' // Mark stale but don't refetch now
                                });
                                queryClient.invalidateQueries({ 
                                    queryKey: ["cards"],
                                    refetchType: 'none'
                                });
                                
                                // Invalidate related queries in background
                                setTimeout(() => {
                                    queryClient.invalidateQueries({ queryKey: ["public-feed"] });
                                    queryClient.invalidateQueries({ queryKey: ['contacts-feed', currentUserId] });
                                    queryClient.invalidateQueries({ queryKey: ['profile'] });
                                }, 100);
                                
                                // Show success message
                                Alert.alert("Success", "Card deleted successfully");
                                console.log('✅✅✅ Card deletion complete - UI should update now');
                            }
                        } catch (error: any) {
                            console.error("❌ REAL Delete error:", error);
                            console.error("Card ID:", c._id);
                            console.error("Card userId:", c.userId);
                            
                            // Only show error for real failures (not 404)
                            let errorMessage = "Failed to delete card";
                            if (error?.message?.includes("permission") || error?.message?.includes("403")) {
                                errorMessage = "You don't have permission to delete this card.";
                            } else if (error?.message?.includes("network") || error?.message?.includes("Network")) {
                                errorMessage = "Network error. Please check your connection.";
                            }
                            
                            Alert.alert("Error", errorMessage);
                        }
                    }
                }
            ]
        );
    };

    const shareViaApp = async (method: string) => {
        try {
            setIsGeneratingImage(true);
            setImagesLoaded(false);
            
            console.log('📸 Generating business card image...');
            console.log('⏳ Waiting for images to load...');
            
            // Wait longer for network images and logo to load
            // This ensures both profile photo and logo are rendered
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            console.log('✅ Images should be loaded now');
            
            // Add referral code to card data
            const cardDataWithReferral = {
                ...c,
                referralCode: userReferralCode || 'INSTANTLLY'
            };
            
            // Generate and share the card image
            const result = await generateAndShareCardImage(
                cardTemplateRef,
                cardDataWithReferral,
                method as 'native' | 'whatsapp'
            );
            
            if (result.success) {
                console.log('✅ Card image shared successfully');
                setShareModalVisible(false);
            } else if (result.error !== 'cancelled' && result.error !== 'native_module_not_available') {
                // User didn't cancel and it's not a native module error (which already showed an alert)
                Alert.alert(
                    'Share Failed',
                    'Failed to generate card image. Please try again.',
                    [{ text: 'OK' }]
                );
            }
            
        } catch (error) {
            console.error('❌ Error sharing card:', error);
            Alert.alert(
                'Error',
                'Failed to share card. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsGeneratingImage(false);
            setImagesLoaded(false);
        }
    };

    return (
        <View>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity 
                    style={s.card} 
                    onPress={handleCardPress} 
                    activeOpacity={0.7}
                >
                    <BusinessAvatar 
                        companyPhoto={c.companyPhoto}
                        companyName={companyName}
                        size={80}
                        style={s.logo}
                    />
                    
                    <View style={s.info}>
                        <Text style={s.companyName} numberOfLines={1}>{companyName}</Text>
                        <Text style={s.ownerName} numberOfLines={1}>{ownerName}</Text>
                        {!!location && (
                            <Text style={s.location} numberOfLines={1}>{location}</Text>
                        )}
                    </View>
                    
                    <View style={s.actions}>
                        {showEditButton ? (
                            <TouchableOpacity 
                                onPress={(e) => { 
                                    e.stopPropagation(); 
                                    setMenuModalVisible(true); 
                                }} 
                                style={s.menuBtn}
                            >
                                <Text style={s.menuBtnText}>⋮</Text>
                            </TouchableOpacity>
                        ) : (
                            (fullCompany || fullPersonal) && (
                                <TouchableOpacity 
                                    onPress={handleCallPress} 
                                    style={s.callBtn}
                                >
                                    <Ionicons name="call" size={24} color="white" />
                                </TouchableOpacity>
                            )
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>

        {/* Hidden Card Template for Image Generation - Using opacity instead of off-screen positioning */}
        <View style={{ 
            position: 'absolute', 
            left: 0, 
            top: 0, 
            opacity: 0, 
            zIndex: -1,
            pointerEvents: 'none'
        }}>
            <View ref={cardTemplateRef} collapsable={false}>
                <BusinessCardTemplate
                    name={c.name || ''}
                    designation={c.designation || ''}
                    companyName={c.companyName || c.name || 'Company'}
                    personalPhone={fullPersonal}
                    companyPhone={fullCompany}
                    email={c.email}
                    companyEmail={c.companyEmail}
                    website={c.website}
                    companyWebsite={c.companyWebsite}
                    address={c.location || c.companyAddress}
                    companyAddress={c.companyAddress}
                    companyPhoto={c.companyPhoto}
                    location={c.location}
                    mapsLink={c.mapsLink}
                    companyMapsLink={c.companyMapsLink}
                    message={c.message}
                    linkedin={c.linkedin}
                    twitter={c.twitter}
                    instagram={c.instagram}
                    facebook={c.facebook}
                    youtube={c.youtube}
                    whatsapp={c.whatsapp}
                    telegram={c.telegram}
                />
            </View>
        </View>

        <Modal
            animationType="slide"
            transparent={true}
            visible={shareModalVisible}
            onRequestClose={() => !isGeneratingImage && setShareModalVisible(false)}
        >
            <View style={s.modalOverlay}>
                <View style={s.modalContent}>
                    {isGeneratingImage && (
                        <View style={s.loadingContainer}>
                            <ActivityIndicator size="large" color="#3B82F6" />
                            <Text style={s.loadingText}>Generating card image...</Text>
                            <Text style={s.loadingSubtext}>Loading profile photo and logo</Text>
                        </View>
                    )}
                    
                    <Pressable 
                        onPress={() => {
                            setShareModalVisible(false);
                            // Navigate to contact selection for in-app sharing
                            router.push(`/contacts/select?cardId=${c._id}&cardTitle=${encodeURIComponent(companyName)}` as any);
                        }} 
                        style={[s.shareOption, s.shareWithinAppOption]}
                        disabled={isGeneratingImage}
                    >
                        <Text style={[s.shareOptionText, s.shareWithinAppText]}>📱 Share within App</Text>
                    </Pressable>
                    
                    <Pressable 
                        onPress={() => shareViaApp('whatsapp')} 
                        style={s.shareOption}
                        disabled={isGeneratingImage}
                    >
                        <Text style={s.shareOptionText}>💬 Share to WhatsApp</Text>
                    </Pressable>
                    
                    <Pressable 
                        onPress={() => shareViaApp('native')} 
                        style={s.shareOption}
                        disabled={isGeneratingImage}
                    >
                        <Text style={s.shareOptionText}>🔗 Share Via</Text>
                    </Pressable>
                    
                    <Pressable 
                        onPress={() => setShareModalVisible(false)} 
                        style={[s.shareOption, s.cancelOption]}
                        disabled={isGeneratingImage}
                    >
                        <Text style={[s.shareOptionText, s.cancelText]}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>

        <Modal
            animationType="slide"
            transparent={true}
            visible={menuModalVisible}
            onRequestClose={() => setMenuModalVisible(false)}
        >
            <View style={s.modalOverlay}>
                <View style={s.modalContent}>
                    <Pressable onPress={() => { setMenuModalVisible(false); setShareModalVisible(true); }} style={s.shareOption}>
                        <Text style={s.shareOptionText}>Share Card</Text>
                    </Pressable>
                    
                    <Pressable onPress={handleEditPress} style={s.shareOption}>
                        <Text style={s.shareOptionText}>Edit Card</Text>
                    </Pressable>
                    
                    <Pressable onPress={handleDeletePress} style={[s.shareOption, s.deleteOption]}>
                        <Text style={[s.shareOptionText, s.deleteText]}>Delete Card</Text>
                    </Pressable>
                    
                    <Pressable onPress={() => setMenuModalVisible(false)} style={[s.shareOption, s.cancelOption]}>
                        <Text style={[s.shareOptionText, s.cancelText]}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#fff",
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        marginHorizontal: 4,
        position: "relative", // For loading overlay
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    avatarContainer: {
        position: "relative",
        marginRight: 16,
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#E5E7EB",
        marginRight: 12,
    },
    info: {
        flex: 1,
        justifyContent: "center",
    },
    companyName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
    },
    ownerName: {
        fontSize: 14,
        fontWeight: "500",
        color: "#6B7280",
        marginBottom: 4,
    },
    location: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    callBtn: {
        backgroundColor: "#3B82F6",
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    callIcon: {
        fontSize: 18,
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    menuBtn: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        minWidth: 40,
        alignItems: "center",
    },
    menuBtnText: {
        fontSize: 20,
        color: "#6B7280",
        fontWeight: "600",
    },
    deleteOption: {
        backgroundColor: '#FEE2E2',
    },
    deleteText: {
        color: '#DC2626',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
        color: '#111827',
    },
    shareOption: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    shareOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    cancelOption: {
        backgroundColor: '#FEE2E2',
        marginTop: 10,
    },
    cancelText: {
        color: '#DC2626',
    },
    shareWithinAppOption: {
        backgroundColor: '#EBF8FF',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    shareWithinAppText: {
        color: '#3B82F6',
        fontWeight: '700',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        marginBottom: 15,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    loadingSubtext: {
        marginTop: 5,
        fontSize: 12,
        color: '#9CA3AF',
    },
});
