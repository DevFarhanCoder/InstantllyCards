import React, { useMemo, useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";

import api from "@/lib/api"; // must attach Bearer token internally
import { PrimaryButton } from "@/components/PrimaryButton";
import FormInput from "@/components/FormInput";

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
    const [keywords, setKeywords] = useState(""); // Add keywords field

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
            setKeywords(existingCard.keywords || "");
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

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}>
                    <Text style={s.h1}>{isEditMode ? "Edit Card" : "Create Card"}</Text>

                    {/* Personal */}
                    <Text style={s.sec}>Personal</Text>
                    <L>Name</L>
                    <FormInput value={name} onChangeText={setName} />
                    <Err k="name" />

                    <L>Designation</L>
                    <FormInput value={designation} onChangeText={setDesignation} />

                    <L>Phone</L>
                    <View style={s.row}>
                        <FormInput
                            style={[s.cc, errors.personalCountryCode && s.bred]}
                            keyboardType="number-pad"
                            value={personalCountryCode}
                            onChangeText={setPersonalCountryCode}
                            placeholder="Country"
                        />
                        <FormInput
                            style={[s.flex1, errors.personalPhone && s.bred]}
                            keyboardType="number-pad"
                            value={personalPhone}
                            onChangeText={setPersonalPhone}
                            placeholder="Phone"
                        />
                    </View>
                    <Err k="personalCountryCode" />
                    <Err k="personalPhone" />

                    <L>Email</L>
                    <FormInput keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                    <Err k="email" />

                    <L>Website</L>
                    <FormInput autoCapitalize="none" value={website} onChangeText={setWebsite} />
                    <Err k="website" />

                    <L>Location</L>
                    <FormInput multiline value={location} onChangeText={setLocation} />

                    <L>Google Maps Link</L>
                    <FormInput autoCapitalize="none" value={mapsLink} onChangeText={setMapsLink} />
                    <Err k="mapsLink" />

                    {/* Business */}
                    <Text style={s.sec}>Business</Text>
                    <L>Company Name</L>
                    <FormInput value={companyName} onChangeText={setCompanyName} />

                    <L>Company Phone</L>
                    <View style={s.row}>
                        <FormInput
                            style={[s.cc, errors.companyCountryCode && s.bred]}
                            keyboardType="number-pad"
                            value={companyCountryCode}
                            onChangeText={setCompanyCountryCode}
                            placeholder="Country"
                        />
                        <FormInput
                            style={[s.flex1, errors.companyPhone && s.bred]}
                            keyboardType="number-pad"
                            value={companyPhone}
                            onChangeText={setCompanyPhone}
                            placeholder="Phone"
                        />
                    </View>
                    <Err k="companyCountryCode" />
                    <Err k="companyPhone" />

                    <L>Company Email</L>
                    <FormInput keyboardType="email-address" autoCapitalize="none" value={companyEmail} onChangeText={setCompanyEmail} />
                    <Err k="companyEmail" />

                    <L>Company Website</L>
                    <FormInput autoCapitalize="none" value={companyWebsite} onChangeText={setCompanyWebsite} />
                    <Err k="companyWebsite" />

                    <L>Company Address</L>
                    <FormInput multiline value={companyAddress} onChangeText={setCompanyAddress} />

                    <L>Company Maps Link</L>
                    <FormInput autoCapitalize="none" value={companyMapsLink} onChangeText={setCompanyMapsLink} />
                    <Err k="companyMapsLink" />

                    <L>Business Photo</L>
                    <View style={{ gap: 8 }}>
                        <Pressable onPress={pickBusinessPhoto} style={s.pickBtn}>
                            <Text style={s.pickTxt}>{companyPhoto ? "Change Photo" : "Pick Photo"}</Text>
                        </Pressable>
                        {companyPhoto ? (
                            <Image source={{ uri: companyPhoto }} style={{ width: "100%", height: 160, borderRadius: 10 }} />
                        ) : null}
                    </View>

                    <L>Message</L>
                    <FormInput multiline value={message} onChangeText={setMessage} />

                    <L>Keywords (for search)</L>
                    <FormInput 
                        value={keywords} 
                        onChangeText={setKeywords}
                        placeholder="e.g. gym, fitness, training, personal trainer, crossfit"
                        multiline
                    />

                    {/* Social */}
                    <Text style={s.sec}>Social</Text>
                    <L>LinkedIn</L><FormInput value={linkedin} onChangeText={setLinkedin} />
                    <L>X / Twitter</L><FormInput value={twitter} onChangeText={setTwitter} />
                    <L>Instagram</L><FormInput value={instagram} onChangeText={setInstagram} />
                    <L>Facebook</L><FormInput value={facebook} onChangeText={setFacebook} />
                    <L>YouTube</L><FormInput value={youtube} onChangeText={setYoutube} />
                    <L>WhatsApp (wa.me/...)</L><FormInput value={whatsapp} onChangeText={setWhatsapp} />
                    <L>Telegram</L><FormInput value={telegram} onChangeText={setTelegram} />

                    <PrimaryButton 
                        title={
                            (isEditMode ? updateCardMutation.isPending : createCardMutation.isPending) 
                                ? "Saving..." 
                                : isEditMode ? "Update Card" : "Save Card"
                        } 
                        onPress={onSave} 
                        disabled={isEditMode ? updateCardMutation.isPending : createCardMutation.isPending}
                    />
                    
                    {isEditMode && (
                        <Pressable 
                            style={s.deleteBtn}
                            onPress={onDelete}
                            disabled={deleteCardMutation.isPending}
                        >
                            <Text style={s.deleteBtnText}>
                                {deleteCardMutation.isPending ? "Deleting..." : "Delete Card"}
                            </Text>
                        </Pressable>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    h1: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
    sec: { fontSize: 16, fontWeight: "800", marginTop: 14, marginBottom: 8, color: "#111827" },
    label: { fontSize: 12, color: "#6B7280", marginTop: 8 },
    err: { color: "#DC2626", fontSize: 12, marginTop: 2 },
    row: { flexDirection: "row", gap: 10 },
    cc: { width: 80 },
    flex1: { flex: 1 },
    bred: { borderColor: "#DC2626", borderWidth: 1.2 },
    pickBtn: { backgroundColor: "#EEF2FF", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
    pickTxt: { color: "#4F46E5", fontWeight: "700" },
    deleteBtn: {
        backgroundColor: "#FEE2E2",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    deleteBtnText: {
        color: "#DC2626",
        fontWeight: "700",
        fontSize: 16,
    },
});
