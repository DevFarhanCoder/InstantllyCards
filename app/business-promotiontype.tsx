import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import api from '@/lib/api';

const { width: screenWidth } = Dimensions.get('window');

type ListingType = 'FREE' | 'PREMIUM';

interface ListingOption {
    type: ListingType;
    title: string;
    subtitle: string;
    features: string[];
    ctaText: string;
    recommended?: boolean;
    accentColor: string;
    backgroundColor: string;
    borderColor: string;
}

const LISTING_OPTIONS: ListingOption[] = [
    {
        type: 'FREE',
        title: 'Free Business Listing',
        subtitle: 'Perfect for getting started',
        features: [
            'Online business presence',
            'Trust building with customers',
            'Upload photos & details',
            'Organic discovery in listings',
        ],
        ctaText: 'Continue with Free',
        accentColor: '#059669',
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    {
        type: 'PREMIUM',
        title: 'Premium Business Listing',
        subtitle: 'Maximize your business growth',
        features: [
            'Higher ranking than competitors',
            'Increased customer visibility',
            'Direct customer leads (call / enquiry)',
            'Performance insights & analytics',
        ],
        ctaText: 'Go Premium',
        recommended: true,
        accentColor: '#2563EB',
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE',
    },
];

export default function ChooseBusinessListingTypeScreen() {
    const [selectedType, setSelectedType] = useState<ListingType | null>(null);
    const params = useLocalSearchParams<{ promotionId?: string }>();

    useEffect(() => {
        api.get('/business-promotion/in-progress')
            .then(res => {
                if (res.promotion) {
                    router.replace({
                        pathname: '/business-promotion',
                        params: {
                            promotionId: res.promotion._id,
                            listingType: res.promotion.listingType === 'promoted'
                                ? 'PREMIUM'
                                : 'FREE'
                        }
                    });
                }
            });
    }, []);


    const handleSelectType = (type: ListingType) => {
        setSelectedType(type);
    };

    const handleContinue = () => {
        if (!selectedType) return;
        router.push({
            pathname: '/business-promotion',
            params: { listingType: selectedType } // 👈 PASS TYPE
        });
    };

    const renderListingCard = (option: ListingOption) => {
        const isSelected = selectedType === option.type;

        return (
            <TouchableOpacity
                key={option.type}
                style={[
                    styles.listingCard,
                    isSelected && styles.listingCardSelected,
                    { borderColor: isSelected ? option.accentColor : option.borderColor },
                ]}
                onPress={() => {
                    handleSelectType(option.type)
                }}
                activeOpacity={0.8}
            >
                {/* Recommended Badge */}
                {option.recommended && (
                    <View style={[styles.recommendedBadge, { backgroundColor: option.accentColor }]}>
                        <Ionicons name="star" size={12} color="#FFFFFF" />
                        <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                )}

                {/* Card Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                        <View
                            style={[
                                styles.iconCircle,
                                { backgroundColor: option.backgroundColor, borderColor: option.borderColor },
                            ]}
                        >
                            <Ionicons
                                name={option.type === 'FREE' ? 'business-outline' : 'rocket-outline'}
                                size={24}
                                color={option.accentColor}
                            />
                        </View>
                        <View style={styles.titleTextContainer}>
                            <Text style={styles.cardTitle}>{option.title}</Text>
                            <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
                        </View>
                    </View>

                    {/* Selection Radio */}
                    <View
                        style={[
                            styles.radioOuter,
                            isSelected && { borderColor: option.accentColor, borderWidth: 2 },
                        ]}
                    >
                        {isSelected && (
                            <View style={[styles.radioInner, { backgroundColor: option.accentColor }]} />
                        )}
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Features List */}
                <View style={styles.featuresContainer}>
                    {option.features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={option.accentColor}
                                style={styles.featureIcon}
                            />
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                    style={[
                        styles.ctaButton,
                        isSelected
                            ? { backgroundColor: option.accentColor }
                            : { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: option.accentColor },
                    ]}
                    onPress={() => handleSelectType(option.type)}
                    activeOpacity={0.8}
                >
                    <Text
                        style={[
                            styles.ctaButtonText,
                            isSelected ? { color: '#FFFFFF' } : { color: option.accentColor },
                        ]}
                    >
                        {option.ctaText}
                    </Text>
                    <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={isSelected ? '#FFFFFF' : option.accentColor}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Choose Listing Type</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Select Your Business Listing Plan</Text>
                    <Text style={styles.pageSubtitle}>
                        Choose the plan that best suits your business needs. You can always upgrade later.
                    </Text>
                </View>

                {/* Listing Cards */}
                <View style={styles.cardsContainer}>
                    {LISTING_OPTIONS.map((option) => renderListingCard(option))}
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoCard}>
                        <Ionicons name="shield-checkmark" size={24} color="#059669" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>Secure & Trusted</Text>
                            <Text style={styles.infoDescription}>
                                Your business information is protected and verified
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <Ionicons name="people" size={24} color="#2563EB" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>Reach More Customers</Text>
                            <Text style={styles.infoDescription}>
                                Connect with thousands of potential customers actively searching
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Fixed Bottom CTA */}
            {selectedType && (
                <View style={styles.fixedBottomContainer}>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            {
                                backgroundColor:
                                    LISTING_OPTIONS.find((opt) => opt.type === selectedType)?.accentColor ||
                                    '#2563EB',
                            },
                        ]}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueButtonText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: 0.3,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    pageHeader: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 22,
        fontWeight: '400',
    },
    cardsContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 16,
    },
    listingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        padding: 20,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    listingCardSelected: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    recommendedBadge: {
        position: 'absolute',
        top: -1,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        gap: 4,
    },
    recommendedText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cardTitleContainer: {
        flexDirection: 'row',
        flex: 1,
        gap: 12,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleTextContainer: {
        flex: 1,
        paddingTop: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 16,
    },
    featuresContainer: {
        gap: 12,
        marginBottom: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    featureIcon: {
        marginTop: 1,
    },
    featureText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        flex: 1,
        fontWeight: '500',
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        gap: 8,
    },
    ctaButtonText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    infoSection: {
        paddingHorizontal: 20,
        paddingTop: 32,
        gap: 16,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    infoDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    bottomSpacer: {
        height: 20,
    },
    fixedBottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
});