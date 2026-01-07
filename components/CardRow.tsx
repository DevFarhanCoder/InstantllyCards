import React, { useState, useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View, Linking, Modal, Share, Alert, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { Ionicons } from "@expo/vector-icons";
import BusinessAvatar from "./BusinessAvatar";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CardRow({ c, showEditButton = false, onRefresh }: { c: any; showEditButton?: boolean; onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [menuModalVisible, setMenuModalVisible] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(1));
    const [currentUserId, setCurrentUserId] = useState<string>("");
    
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
                params: { id: c._id, cardData: JSON.stringify(c) }
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
        // Build WhatsApp message with all card details in key-value format
        let whatsappMessage = `*This is My Visiting Card*\n\n`;
        
        // Personal Details Section - Only include if at least one field exists
        const hasPersonalDetails = c.name || fullPersonal || c.email || c.website || c.location || c.mapsLink;
        if (hasPersonalDetails) {
            whatsappMessage += `*Personal*\n`;
            if (c.name) whatsappMessage += `*Name* - ${c.name}\n`;
            if (fullPersonal) whatsappMessage += `*Mob No* - ${fullPersonal}\n`;
            if (c.email) whatsappMessage += `*Email ID* - ${c.email}\n`;
            if (c.website) whatsappMessage += `*Website* - ${c.website}\n`;
            if (c.location) whatsappMessage += `*Address* - ${c.location}\n`;
            if (c.mapsLink) whatsappMessage += `*Google Map* - ${c.mapsLink}\n`;
        }
        
        // Company Details Section - Only include if at least one field exists
        const hasCompanyDetails = c.companyName || c.designation || fullCompany || c.companyEmail || c.companyWebsite || c.companyAddress || c.companyMapsLink || c.message;
        if (hasCompanyDetails) {
            whatsappMessage += `\n*Company*\n`;
            if (c.companyName) whatsappMessage += `*Company Name* - ${c.companyName}\n`;
            if (c.designation) whatsappMessage += `*Designation* - ${c.designation}\n`;
            if (fullCompany) whatsappMessage += `*Mob No* - ${fullCompany}\n`;
            if (c.companyEmail) whatsappMessage += `*Email ID* - ${c.companyEmail}\n`;
            if (c.companyWebsite) whatsappMessage += `*Website* - ${c.companyWebsite}\n`;
            if (c.companyAddress) whatsappMessage += `*Address* - ${c.companyAddress}\n`;
            if (c.companyMapsLink) whatsappMessage += `*Google Map* - ${c.companyMapsLink}\n`;
            if (c.message) whatsappMessage += `*About Business* - ${c.message}\n`;
        }
        
        // Social Media Section - Only include if at least one field exists
        const hasSocialMedia = c.linkedin || c.facebook || c.instagram || c.twitter || c.youtube || c.telegram;
        if (hasSocialMedia) {
            whatsappMessage += `\n*Social Media*\n`;
            if (c.linkedin) whatsappMessage += `*LinkedIn* - ${c.linkedin}\n`;
            if (c.facebook) whatsappMessage += `*Facebook* - ${c.facebook}\n`;
            if (c.instagram) whatsappMessage += `*Instagram* - ${c.instagram}\n`;
            if (c.twitter) whatsappMessage += `*Twitter* - ${c.twitter}\n`;
            if (c.youtube) whatsappMessage += `*YouTube* - ${c.youtube}\n`;
            if (c.telegram) whatsappMessage += `*Telegram* - ${c.telegram}\n`;
        }
        
        // Keywords section if available
        if (c.keywords && c.keywords.trim()) {
            whatsappMessage += `\n*Keywords/Services*\n`;
            whatsappMessage += `${c.keywords}\n`;
        }
        
        // App Promotion
        whatsappMessage += `\nI have created this *Digital Visiting Card FREE From Instantlly Cards From Play Store* & Shared Google Play Store Link so you can also download and Create Your Visiting Card & you can send me your Card also, so I do not have to type all your information and i will get Full Details of your in Instantlly Cards.\n\n`;
        whatsappMessage += `*Google Play Store Link*\nhttps://play.google.com/store/apps/details?id=com.instantllycards.www.twa`;

        const shareContent = {
            title: `${companyName}'s Business Card`,
            message: whatsappMessage,
            url: `https://instantllycards.com/card/${c._id}`
        };

        try {
            switch (method) {
                case 'native':
                    await Share.share({
                        message: shareContent.message,
                        title: shareContent.title,
                    });
                    break;
                case 'whatsapp':
                    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareContent.message)}`;
                    await Linking.openURL(whatsappUrl);
                    break;
                default:
                    await Share.share({
                        message: shareContent.message,
                        title: shareContent.title,
                    });
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
        setShareModalVisible(false);
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

        <Modal
            animationType="slide"
            transparent={true}
            visible={shareModalVisible}
            onRequestClose={() => setShareModalVisible(false)}
        >
            <View style={s.modalOverlay}>
                <View style={s.modalContent}>
                    <Pressable 
                        onPress={() => {
                            setShareModalVisible(false);
                            // Navigate to contact selection for in-app sharing
                            router.push(`/contacts/select?cardId=${c._id}&cardTitle=${encodeURIComponent(companyName)}` as any);
                        }} 
                        style={[s.shareOption, s.shareWithinAppOption]}
                    >
                        <Text style={[s.shareOptionText, s.shareWithinAppText]}>📱 Share Within App</Text>
                    </Pressable>
                    
                    <Pressable onPress={() => shareViaApp('whatsapp')} style={s.shareOption}>
                        <Text style={s.shareOptionText}>Share to WhatsApp</Text>
                    </Pressable>
                    
                    <Pressable onPress={() => shareViaApp('native')} style={s.shareOption}>
                        <Text style={s.shareOptionText}>Share Via</Text>
                    </Pressable>
                    
                    <Pressable onPress={() => setShareModalVisible(false)} style={[s.shareOption, s.cancelOption]}>
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
});
