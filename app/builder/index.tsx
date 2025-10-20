import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Pressable,
    TouchableOpacity,
    Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

import api from "@/lib/api"; // must attach Bearer token internally
import { PrimaryButton } from "@/components/PrimaryButton";
import FormInput from "@/components/FormInput";
import BusinessAvatar from "@/components/BusinessAvatar";
import PhoneInput from "@/components/PhoneInput";

// ---------- simple validators ----------
const isNonEmpty = (v: string) => v.trim().length > 0;
const isEmail = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isURL = (v: string) =>
    !v || /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=.]*)?$/.test(v);
const isDigits = (v: string) => /^\d+$/.test(v);
const minDigits = (v: string, n: number) => isDigits(v) && v.length >= n;

export default function Builder() {
    const queryClient = useQueryClient();
    const { edit } = useLocalSearchParams<{ edit?: string }>();
    const isEditMode = !!edit;
    
    // Fetch existing card data if in edit mode
    const cardsQuery = useQuery({
        queryKey: ["cards"],
        queryFn: async () => {
            const response = await api.get<{ data: any[] }>("/cards");
            return response.data || [];
        },
        enabled: isEditMode,
    });
    
    const existingCard = isEditMode && cardsQuery.data 
        ? cardsQuery.data.find((card: any) => card._id === edit)
        : null;
    
    // Create card mutation
    const createCardMutation = useMutation({
        mutationFn: async (payload: any) => {
            const response = await api.post<{ data: any }>("/cards", payload);
            return response.data; // Return the data from the response
        },
        onSuccess: () => {
            // Invalidate both queries to refresh both My Cards and Home feed
            queryClient.invalidateQueries({ queryKey: ["cards"] });
            queryClient.invalidateQueries({ queryKey: ["public-feed"] });
            
            Alert.alert("Success", "Card saved!", [
                {
                    text: "OK", 
                    onPress: () => router.back() // Navigate back to previous screen
                }
            ]);
        },
        onError: (error: any) => {
            Alert.alert("Save failed", error?.message ?? "Unknown error");
        }
    });

    // Update card mutation
    const updateCardMutation = useMutation({
        mutationFn: async (payload: any) => {
            const response = await api.put<{ data: any }>(`/cards/${edit}`, payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cards"] });
            queryClient.invalidateQueries({ queryKey: ["public-feed"] });
            
            Alert.alert("Success", "Card updated!", [
                {
                    text: "OK", 
                    onPress: () => router.back()
                }
            ]);
        },
        onError: (error: any) => {
            Alert.alert("Update failed", error?.message ?? "Unknown error");
        }
    });

    // Delete card mutation
    const deleteCardMutation = useMutation({
        mutationFn: async () => {
            await api.del(`/cards/${edit}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cards"] });
            queryClient.invalidateQueries({ queryKey: ["public-feed"] });
            
            Alert.alert("Success", "Card deleted!", [
                {
                    text: "OK", 
                    onPress: () => router.back()
                }
            ]);
        },
        onError: (error: any) => {
            Alert.alert("Delete failed", error?.message ?? "Unknown error");
        }
    });

    // Personal
    const [name, setName] = useState("");
    const [designation, setDesignation] = useState("");
    const [personalCountryCode, setPersonalCountryCode] = useState("91");
    const [personalPhone, setPersonalPhone] = useState("");
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");
    const [location, setLocation] = useState("");
    const [mapsLink, setMapsLink] = useState("");

    // Business
    const [companyName, setCompanyName] = useState("");
    const [companyCountryCode, setCompanyCountryCode] = useState("91");
    const [companyPhone, setCompanyPhone] = useState("");
    const [companyEmail, setCompanyEmail] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [companyAddress, setCompanyAddress] = useState("");
    const [companyMapsLink, setCompanyMapsLink] = useState("");
    const [message, setMessage] = useState("");
    const [companyPhoto, setCompanyPhoto] = useState("");
    // Keywords state with proper debouncing to fix saving issues
    const [keywords, setKeywords] = useState("");
    const keywordsTimeout = useRef<any>(null);
    
    // Debounced keywords handler to prevent saving issues - Memoized to prevent recreation
    const handleKeywordsChange = useCallback((text: string) => {
        setKeywords(text);
        
        // Clear existing timeout
        if (keywordsTimeout.current) {
            clearTimeout(keywordsTimeout.current);
        }
        
        // Set new timeout to ensure proper saving
        keywordsTimeout.current = setTimeout(() => {
            console.log('Keywords updated:', text);
        }, 500);
    }, []);
    
    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (keywordsTimeout.current) {
                clearTimeout(keywordsTimeout.current);
            }
        };
    }, []);

    // Social
    const [linkedin, setLinkedin] = useState("");
    const [twitter, setTwitter] = useState("");
    const [instagram, setInstagram] = useState("");
    const [facebook, setFacebook] = useState("");
    const [youtube, setYoutube] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [telegram, setTelegram] = useState("");

    // --- validation messages
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Section collapse state for better UX
    const [sectionExpanded, setSectionExpanded] = useState({
        personal: true,
        business: true,
        social: false,
        additional: false
    });

    // Animation values for section expansion
    const sectionAnimations = {
        personal: useRef(new Animated.Value(1)).current,
        business: useRef(new Animated.Value(1)).current,
        social: useRef(new Animated.Value(0)).current,
        additional: useRef(new Animated.Value(0)).current,
    };

    const toggleSection = (section: keyof typeof sectionExpanded) => {
        const isExpanded = sectionExpanded[section];
        setSectionExpanded(prev => ({
            ...prev,
            [section]: !isExpanded
        }));

        Animated.timing(sectionAnimations[section], {
            toValue: isExpanded ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    // Populate form with existing data when in edit mode
    useEffect(() => {
        console.log("Builder useEffect triggered");
        console.log("isEditMode:", isEditMode);
        console.log("edit param:", edit);
        console.log("existingCard:", existingCard);
        
        if (existingCard) {
            console.log("Populating form with existing card data");
            setName(existingCard.name || "");
            setDesignation(existingCard.designation || "");
            setPersonalCountryCode(existingCard.personalCountryCode || "91");
            setPersonalPhone(existingCard.personalPhone || "");
            setEmail(existingCard.email || "");
            setWebsite(existingCard.website || "");
            setLocation(existingCard.location || "");
            setMapsLink(existingCard.mapsLink || "");
            setCompanyName(existingCard.companyName || "");
            setCompanyCountryCode(existingCard.companyCountryCode || "91");
            setCompanyPhone(existingCard.companyPhone || "");
            setCompanyEmail(existingCard.companyEmail || "");
            setCompanyWebsite(existingCard.companyWebsite || "");
            setCompanyAddress(existingCard.companyAddress || "");
            setCompanyMapsLink(existingCard.companyMapsLink || "");
            setMessage(existingCard.message || "");
            setCompanyPhoto(existingCard.companyPhoto || "");
            handleKeywordsChange(existingCard.keywords || ""); // Use debounced handler
            setLinkedin(existingCard.linkedin || "");
            setTwitter(existingCard.twitter || "");
            setInstagram(existingCard.instagram || "");
            setFacebook(existingCard.facebook || "");
            setYoutube(existingCard.youtube || "");
            setWhatsapp(existingCard.whatsapp || "");
            setTelegram(existingCard.telegram || "");
        }
    }, [existingCard, isEditMode, edit]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!isNonEmpty(name)) e.name = "Name is required";
        if (email && !isEmail(email)) e.email = "Invalid email";
        if (website && !isURL(website)) e.website = "Invalid URL";
        if (!isDigits(personalCountryCode)) e.personalCountryCode = "Only digits";
        if (!minDigits(personalPhone, 6)) e.personalPhone = "Min 6 digits";
        if (companyEmail && !isEmail(companyEmail)) e.companyEmail = "Invalid email";
        if (companyWebsite && !isURL(companyWebsite)) e.companyWebsite = "Invalid URL";
        if (!isDigits(companyCountryCode)) e.companyCountryCode = "Only digits";
        if (companyPhone && !minDigits(companyPhone, 6)) e.companyPhone = "Min 6 digits";
        if (mapsLink && !isURL(mapsLink)) e.mapsLink = "Invalid link";
        if (companyMapsLink && !isURL(companyMapsLink)) e.companyMapsLink = "Invalid link";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const pickBusinessPhoto = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== "granted") {
            Alert.alert("Permission required", "Please allow photo library access.");
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, // fixed property name
            base64: true,
            quality: 0.8,
        });
        if (!res.canceled) {
            const a = res.assets[0];
            const mime = a.mimeType || "image/jpeg";
            const dataUri = `data:${mime};base64,${a.base64}`;
            setCompanyPhoto(dataUri);
        }
    };

    const payload = useMemo(
        () => ({
            // Personal
            name,
            designation,
            personalCountryCode,
            personalPhone,
            email,
            website,
            location,
            mapsLink,
            // Business
            companyName,
            companyCountryCode,
            companyPhone,
            companyEmail,
            companyWebsite,
            companyAddress,
            companyMapsLink,
            message,
            companyPhoto,
            keywords, // Add keywords to payload
            // Social
            linkedin,
            twitter,
            instagram,
            facebook,
            youtube,
            whatsapp,
            telegram,
        }),
        [
            name,
            designation,
            personalCountryCode,
            personalPhone,
            email,
            website,
            location,
            mapsLink,
            companyName,
            companyCountryCode,
            companyPhone,
            companyEmail,
            companyWebsite,
            companyAddress,
            companyMapsLink,
            message,
            companyPhoto,
            keywords, // Add keywords to dependency array
            linkedin,
            twitter,
            instagram,
            facebook,
            youtube,
            whatsapp,
            telegram,
        ]
    );

    const onSave = async () => {
        if (!validate()) {
            const first = Object.values(errors)[0];
            if (first) Alert.alert("Fix errors", first);
            return;
        }
        
        if (isEditMode) {
            updateCardMutation.mutate(payload);
        } else {
            createCardMutation.mutate(payload);
        }
    };

    const onDelete = () => {
        Alert.alert(
            "Delete Card",
            "Are you sure you want to delete this business card?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: () => deleteCardMutation.mutate()
                }
            ]
        );
    };

    const L = ({ children }: any) => <Text style={s.label}>{children}</Text>;
    const Err = ({ k }: { k: string }) =>
        errors[k] ? <Text style={s.err}>{errors[k]}</Text> : null;

    // Enhanced Section Header Component
    const SectionHeader = ({ 
        title, 
        subtitle, 
        icon, 
        section, 
        required = false 
    }: { 
        title: string; 
        subtitle?: string; 
        icon: any; 
        section: keyof typeof sectionExpanded;
        required?: boolean;
    }) => (
        <TouchableOpacity 
            style={s.sectionHeader} 
            onPress={() => toggleSection(section)}
            activeOpacity={0.7}
        >
            <View style={s.sectionHeaderLeft}>
                <View style={[s.sectionIcon, sectionExpanded[section] && s.sectionIconActive]}>
                    <Ionicons 
                        name={icon} 
                        size={20} 
                        color={sectionExpanded[section] ? "#FFFFFF" : "#3B82F6"} 
                    />
                </View>
                <View style={s.sectionTitleContainer}>
                    <View style={s.sectionTitleRow}>
                        <Text style={s.sectionTitle}>{title}</Text>
                        {required && <Text style={s.requiredIndicator}>*</Text>}
                    </View>
                    {subtitle && <Text style={s.sectionSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <Ionicons 
                name={sectionExpanded[section] ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6B7280" 
            />
        </TouchableOpacity>
    );

    // Enhanced Form Field Component - Memoized to prevent recreating on each render
    const FormField = useMemo(() => ({ 
        label, 
        value, 
        onChangeText, 
        errorKey, 
        required = false,
        inputKey,
        ...props 
    }: any) => (
        <View style={s.formField}>
            <Text style={s.enhancedLabel}>
                {label}
                {required && <Text style={s.requiredIndicator}> *</Text>}
            </Text>
            <FormInput 
                key={inputKey} // Add unique key to prevent TextInput remounting
                value={value} 
                onChangeText={onChangeText}
                style={[errors[errorKey] && s.inputError]}
                {...props}
            />
            <Err k={errorKey} />
        </View>
    ), [errors]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <ScrollView 
                    keyboardShouldPersistTaps="handled" 
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={{ alignItems: "center", marginBottom: 12 }}>
                        <Text style={s.h1}>{isEditMode ? "Edit Card" : "Create New Card"}</Text>
                        <Text style={s.subtitle}>
                            {isEditMode 
                                ? "Update your professional details" 
                                : "Build your digital business card in minutes"
                            }
                        </Text>
                    </View>

                    {/* Personal Information Section */}
                    <SectionHeader
                        title="Personal Information"
                        subtitle="Your basic contact details"
                        icon="person"
                        section="personal"
                        required
                    />
                    <Animated.View style={{
                        maxHeight: sectionAnimations.personal.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1000]
                        }),
                        opacity: sectionAnimations.personal,
                        overflow: 'hidden'
                    }}>
                        {sectionExpanded.personal && (
                            <View style={s.sectionContent}>
                                <FormField
                                    label="Full Name"
                                    value={name}
                                    onChangeText={setName}
                                    errorKey="name"
                                    inputKey="name-input"
                                    required
                                    placeholder="Enter your full name"
                                />

                                <FormField
                                    label="Job Title / Designation"
                                    value={designation}
                                    onChangeText={setDesignation}
                                    inputKey="designation-input"
                                    placeholder="e.g. Marketing Manager"
                                />

                                <View style={s.formField}>
                                    <PhoneInput
                                        label="Mobile Number *"
                                        value={personalPhone}
                                        onChangeText={setPersonalPhone}
                                        countryCode={`+${personalCountryCode}`}
                                        onCountryCodeChange={(code) => setPersonalCountryCode(code.replace('+', ''))}
                                        placeholder="Enter mobile number"
                                    />
                                    <Err k="personalCountryCode" />
                                    <Err k="personalPhone" />
                                </View>

                                <FormField
                                    label="Email Address"
                                    value={email}
                                    onChangeText={setEmail}
                                    errorKey="email"
                                    inputKey="email-input"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholder="your.email@example.com"
                                />

                                <FormField
                                    label="Personal Website"
                                    value={website}
                                    inputKey="website-input"
                                    onChangeText={setWebsite}
                                    errorKey="website"
                                    autoCapitalize="none"
                                    placeholder="https://yourwebsite.com"
                                />

                                <FormField
                                    label="Location / Address"
                                    value={location}
                                    onChangeText={setLocation}
                                    multiline
                                    placeholder="City, State, Country"
                                />

                                <FormField
                                    label="Google Maps Link"
                                    value={mapsLink}
                                    onChangeText={setMapsLink}
                                    errorKey="mapsLink"
                                    autoCapitalize="none"
                                    placeholder="https://maps.google.com/..."
                                />
                            </View>
                        )}
                    </Animated.View>

                    {/* Business Information Section */}
                    <SectionHeader
                        title="Business Information"
                        subtitle="Company and professional details"
                        icon="business"
                        section="business"
                    />
                    <Animated.View style={{
                        maxHeight: sectionAnimations.business.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1200]
                        }),
                        opacity: sectionAnimations.business,
                        overflow: 'hidden'
                    }}>
                        {sectionExpanded.business && (
                            <View style={s.sectionContent}>
                                <FormField
                                    label="Company Name"
                                    value={companyName}
                                    onChangeText={setCompanyName}
                                    inputKey="company-name-input"
                                    placeholder="Your company or organization"
                                />

                                <View style={s.formField}>
                                    <PhoneInput
                                        label="Company Phone"
                                        value={companyPhone}
                                        onChangeText={setCompanyPhone}
                                        countryCode={`+${companyCountryCode}`}
                                        onCountryCodeChange={(code) => setCompanyCountryCode(code.replace('+', ''))}
                                        placeholder="Company number"
                                    />
                                    <Err k="companyCountryCode" />
                                    <Err k="companyPhone" />
                                </View>

                                <FormField
                                    label="Company Email"
                                    value={companyEmail}
                                    onChangeText={setCompanyEmail}
                                    errorKey="companyEmail"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholder="contact@company.com"
                                />

                                <FormField
                                    label="Company Website"
                                    value={companyWebsite}
                                    onChangeText={setCompanyWebsite}
                                    errorKey="companyWebsite"
                                    autoCapitalize="none"
                                    placeholder="https://company.com"
                                />

                                <FormField
                                    label="Company Address"
                                    value={companyAddress}
                                    onChangeText={setCompanyAddress}
                                    multiline
                                    placeholder="Office address"
                                />

                                <FormField
                                    label="Company Maps Link"
                                    value={companyMapsLink}
                                    onChangeText={setCompanyMapsLink}
                                    errorKey="companyMapsLink"
                                    autoCapitalize="none"
                                    placeholder="https://maps.google.com/..."
                                />

                                <View style={s.photoContainer}>
                                    <Text style={s.enhancedLabel}>Business Photo / Logo</Text>
                                    <TouchableOpacity onPress={pickBusinessPhoto} style={s.pickBtn}>
                                        <Ionicons 
                                            name={companyPhoto ? "image" : "camera"} 
                                            size={20} 
                                            color="#3B82F6" 
                                        />
                                        <Text style={s.pickTxt}>
                                            {companyPhoto ? "Change Photo" : "Add Photo"}
                                        </Text>
                                    </TouchableOpacity>
                                    <View style={s.photoPreviewContainer}>
                                        {companyPhoto ? (
                                            <Image 
                                                source={{ uri: companyPhoto }} 
                                                style={s.photoPreview} 
                                                resizeMode="contain"
                                            />
                                        ) : (
                                            <BusinessAvatar 
                                                companyPhoto=""
                                                companyName={companyName || "Company"}
                                                size={120}
                                                style={s.photoPreview}
                                                backgroundColor="#E5E7EB"
                                                textColor="#6B7280"
                                            />
                                        )}
                                    </View>
                                </View>

                                <FormField
                                    label="Business Message"
                                    value={message}
                                    onChangeText={setMessage}
                                    multiline
                                    placeholder="Brief description of your business or services"
                                />
                            </View>
                        )}
                    </Animated.View>

                    {/* Social Media Section */}
                    <SectionHeader
                        title="Social Media"
                        subtitle="Connect on social platforms"
                        icon="logo-instagram"
                        section="social"
                    />
                    <Animated.View style={{
                        maxHeight: sectionAnimations.social.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 800]
                        }),
                        opacity: sectionAnimations.social,
                        overflow: 'hidden'
                    }}>
                        {sectionExpanded.social && (
                            <View style={s.sectionContent}>
                                <FormField
                                    label="LinkedIn Profile"
                                    value={linkedin}
                                    onChangeText={setLinkedin}
                                    inputKey="linkedin-input"
                                    autoCapitalize="none"
                                    placeholder="https://linkedin.com/in/yourprofile"
                                />

                                <FormField
                                    label="X / Twitter"
                                    value={twitter}
                                    onChangeText={setTwitter}
                                    autoCapitalize="none"
                                    placeholder="https://x.com/yourhandle"
                                />

                                <FormField
                                    label="Instagram"
                                    value={instagram}
                                    onChangeText={setInstagram}
                                    autoCapitalize="none"
                                    placeholder="https://instagram.com/yourhandle"
                                />

                                <FormField
                                    label="Facebook"
                                    value={facebook}
                                    onChangeText={setFacebook}
                                    autoCapitalize="none"
                                    placeholder="https://facebook.com/yourprofile"
                                />

                                <FormField
                                    label="YouTube Channel"
                                    value={youtube}
                                    onChangeText={setYoutube}
                                    autoCapitalize="none"
                                    placeholder="https://youtube.com/@yourchannel"
                                />

                                <FormField
                                    label="WhatsApp Business"
                                    value={whatsapp}
                                    onChangeText={setWhatsapp}
                                    autoCapitalize="none"
                                    placeholder="https://wa.me/919876543210"
                                />

                                <FormField
                                    label="Telegram"
                                    value={telegram}
                                    onChangeText={setTelegram}
                                    autoCapitalize="none"
                                    placeholder="https://t.me/yourusername"
                                />
                            </View>
                        )}
                    </Animated.View>

                    {/* Additional Information Section */}
                    <SectionHeader
                        title="Additional Information"
                        subtitle="Keywords and search optimization"
                        icon="search"
                        section="additional"
                    />
                    <Animated.View style={{
                        maxHeight: sectionAnimations.additional.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200]
                        }),
                        opacity: sectionAnimations.additional,
                        overflow: 'hidden'
                    }}>
                        {sectionExpanded.additional && (
                            <View style={s.sectionContent}>
                                <View style={s.formField}>
                                    <Text style={s.enhancedLabel}>Keywords for Search</Text>
                                    <FormInput 
                                        key="keywords-input"
                                        value={keywords} 
                                        onChangeText={handleKeywordsChange}
                                        placeholder="e.g. gym, fitness, training, personal trainer, crossfit"
                                        multiline
                                    />
                                    <Text style={s.helperText}>
                                        Add keywords to help people find your card when searching. 
                                        Separate multiple keywords with commas.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </Animated.View>

                    {/* Action Buttons */}
                    <View style={s.actionContainer}>
                        <PrimaryButton 
                            title={
                                (isEditMode ? updateCardMutation.isPending : createCardMutation.isPending) 
                                    ? "Saving..." 
                                    : isEditMode ? "Update Card" : "Create Card"
                            } 
                            onPress={onSave} 
                            disabled={isEditMode ? updateCardMutation.isPending : createCardMutation.isPending}
                        />
                        
                        {isEditMode && (
                            <TouchableOpacity 
                                style={s.deleteBtn}
                                onPress={onDelete}
                                disabled={deleteCardMutation.isPending}
                            >
                                <Ionicons name="trash" size={18} color="#DC2626" />
                                <Text style={s.deleteBtnText}>
                                    {deleteCardMutation.isPending ? "Deleting..." : "Delete Card"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    h1: { 
        fontSize: 28, 
        fontWeight: "800", 
        marginBottom: 8,
        color: "#111827",
        textAlign: "center"
    },
    subtitle: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 20,
    },
    sec: { 
        fontSize: 16, 
        fontWeight: "800", 
        marginTop: 14, 
        marginBottom: 8, 
        color: "#111827" 
    },
    label: { 
        fontSize: 12, 
        color: "#6B7280", 
        marginTop: 8 
    },
    enhancedLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    formField: {
        marginBottom: 16,
    },
    inputError: {
        borderColor: "#DC2626",
        borderWidth: 1.5,
    },
    requiredIndicator: {
        color: "#DC2626",
        fontWeight: "700",
    },
    err: { 
        color: "#DC2626", 
        fontSize: 12, 
        marginTop: 4,
        fontWeight: "500"
    },
    row: { 
        flexDirection: "row", 
        gap: 12,
        marginBottom: 16,
    },
    cc: { 
        width: 90,
    },
    flex1: { 
        flex: 1 
    },
    bred: { 
        borderColor: "#DC2626", 
        borderWidth: 1.2 
    },
    
    // Enhanced Section Styles
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F8FAFC",
        padding: 16,
        borderRadius: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    sectionHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    sectionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#EEF2FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        borderWidth: 1,
        borderColor: "#C7D2FE",
    },
    sectionIconActive: {
        backgroundColor: "#3B82F6",
        borderColor: "#3B82F6",
    },
    sectionTitleContainer: {
        flex: 1,
    },
    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    sectionSubtitle: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 2,
        lineHeight: 16,
    },
    sectionContent: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    
    // Photo Selection Styles
    photoContainer: {
        marginBottom: 16,
    },
    pickBtn: { 
        backgroundColor: "#EEF2FF", 
        paddingVertical: 12, 
        paddingHorizontal: 16,
        borderRadius: 10, 
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#C7D2FE",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    pickTxt: { 
        color: "#3B82F6", 
        fontWeight: "600",
        fontSize: 15,
    },
    photoPreviewContainer: {
        width: "100%",
        height: 200,
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    photoPreview: {
        width: "100%", 
        height: "100%", 
        maxWidth: "100%",
        maxHeight: "100%",
    },
    
    // Action Buttons
    actionContainer: {
        gap: 12,
        marginTop: 24,
        paddingBottom: 20,
    },
    deleteBtn: {
        backgroundColor: "#FEE2E2",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#FECACA",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    deleteBtnText: {
        color: "#DC2626",
        fontWeight: "700",
        fontSize: 16,
    },
    
    // Helper text
    helperText: {
        fontSize: 12,
        color: "#6B7280",
        fontStyle: "italic",
        marginTop: 4,
        lineHeight: 16,
    },
});
