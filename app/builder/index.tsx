'use client'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
// Use Expo vector icons instead of lucide-react-native (not installed in project)
// RNPickerSelect removed to avoid requiring extra native dependency in this repo.
// We'll use simple text displays and LocalCalendar navigation instead.
import api from "@/lib/api";
import FormInput from "@/components/FormInput";
import BusinessAvatar from "@/components/BusinessAvatar";
import { PrimaryButton } from "@/components/PrimaryButton";
import AsyncStorage from '@react-native-async-storage/async-storage';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
];
// Reduce year range for debugging
const yearItems = Array.from({ length: 81 }, (_, i) => {
    const year = 1950 + i;
    // RNPickerSelect behaves more reliably when values are strings across platforms
    return { label: year.toString(), value: year.toString() };
});
const yearPickerStyle = {
    inputIOS: { fontSize: 16, color: '#111827', minWidth: 60, textAlign: 'center' as const, paddingVertical: 2 },
    inputAndroid: { fontSize: 16, color: '#111827', minWidth: 60, textAlign: 'center' as const, paddingVertical: 2 },
    iconContainer: { top: 6, right: 0 }
};
const monthItems = MONTHS.map((m, idx) => ({ label: m, value: String(idx) }));
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
    TextInput,
} from "react-native";
import PhoneInput from "@/components/PhoneInput";

// ---------- simple validators ----------
const isNonEmpty = (v: string) => v.trim().length > 0;
const isEmail = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isURL = (v: string) =>
    !v || /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=.]*)?$/.test(v);
const isDigits = (v: string) => /^\d+$/.test(v);
const minDigits = (v: string, n: number) => isDigits(v) && v.length >= n;

// Date helpers: format ISO <-> display (dd-mm-yyyy) and parse
const pad = (n: number) => String(n).padStart(2, '0');
const formatIsoToDisplay = (iso: string | null) => {
    if (!iso) return '';
    try {
        // iso is expected like YYYY-MM-DDT00:00:00.000Z
        const [date] = iso.split('T');
        const [y, m, d] = date.split('-');
        return `${pad(Number(d))}-${pad(Number(m))}-${y}`;
    } catch (e) {
        return '';
    }
};

const parseDisplayToIso = (s: string) => {
    if (!s) return null;
    const cleaned = s.trim().replace(/\//g, '-');
    const m = cleaned.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m) return null;
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    if (month < 1 || month > 12) return null;
    if (year < 1900 || year > 2100) return null;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return null;
    const iso = `${year}-${pad(month)}-${pad(day)}T00:00:00.000Z`;
    return { iso, year, month: month - 1, day };
};

// Format digits-as-you-type: '01022004' -> '01-02-2004'
const formatDigitsToDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8); // max 8 digits
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0,2)}-${digits.slice(2)}`;
    return `${digits.slice(0,2)}-${digits.slice(2,4)}-${digits.slice(4)}`;
};

export default function Builder() {
    const queryClient = useQueryClient();
    const router = useRouter();
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
        onSuccess: (_data, payload) => {
            // Log raw server response for debugging date persistence
            try { console.log('Builder: raw create response:', _data); } catch (e) {}
            // Invalidate queries to refresh My Cards, Home feed and profile
            queryClient.invalidateQueries({ queryKey: ["cards"] });
            queryClient.invalidateQueries({ queryKey: ["public-feed"] });
            try { queryClient.invalidateQueries({ queryKey: ['contacts-feed'] }); queryClient.invalidateQueries({ queryKey: ['profile'] }); } catch (e) {}
            // Try to sync certain fields back to the user's profile so Account reflects latest card
            (async () => {
                try {
                    const profileable: any = {};
                    // Load existing user from AsyncStorage so we avoid sending an unchanged or conflicting phone
                    const existingUserRaw = await AsyncStorage.getItem('user');
                    let existingUser: any = null;
                    try { existingUser = existingUserRaw ? JSON.parse(existingUserRaw) : null; } catch (e) { existingUser = null; }

                    ['name','personalPhone','gender','birthdate','anniversary'].forEach(k => {
                        // map card's personalPhone -> phone for profile but only if it's different from stored user phone
                        if (k === 'personalPhone' && (payload && (payload as any).personalPhone !== undefined)) {
                            const newPhone = (payload as any).personalPhone;
                            const storedPhone = existingUser?.phone || existingUser?.phoneNumber || null;
                            if (!storedPhone || String(newPhone) !== String(storedPhone)) {
                                profileable.phone = newPhone;
                            }
                        } else if (payload && (payload as any)[k] !== undefined) profileable[k] = (payload as any)[k];
                    });
                    // Normalize gender to canonical values
                    if (profileable.gender && typeof profileable.gender === 'string') {
                        const g = String(profileable.gender).toLowerCase();
                        if (g.startsWith('m')) profileable.gender = 'male';
                        else if (g.startsWith('f')) profileable.gender = 'female';
                    }

                    if (Object.keys(profileable).length > 0) {
                        try {
                            try {
                                const resp = await api.put('/auth/update-profile', profileable);
                                console.log('Builder: profile sync response', resp);
                                // update AsyncStorage 'user' if present
                                try {
                                    const u = await AsyncStorage.getItem('user');
                                    if (u) {
                                        const uu = JSON.parse(u);
                                        const merged = { ...uu, ...profileable };
                                        await AsyncStorage.setItem('user', JSON.stringify(merged));
                                    }
                                } catch (e) { console.warn('Builder: failed to merge user into AsyncStorage', e); }
                            } catch (err: any) {
                                // If phone conflict occurs, retry without phone so other fields update
                                const msg = String(err?.message || err?.data?.message || '');
                                if (err?.status === 409 || /phone number already exists/i.test(msg)) {
                                    console.warn('Builder: profile sync phone conflict, retrying without phone');
                                    const reduced = { ...profileable };
                                    delete reduced.phone;
                                    try {
                                        const resp2 = await api.put('/auth/update-profile', reduced);
                                        console.log('Builder: profile sync response (without phone)', resp2);
                                        try {
                                            const u = await AsyncStorage.getItem('user');
                                            if (u) {
                                                const uu = JSON.parse(u);
                                                const merged = { ...uu, ...reduced };
                                                await AsyncStorage.setItem('user', JSON.stringify(merged));
                                            }
                                        } catch (e) { console.warn('Builder: failed to merge user into AsyncStorage after retry', e); }
                                    } catch (e2) {
                                        console.warn('Builder: retry without phone also failed', e2);
                                    }
                                } else {
                                    throw err;
                                }
                            }

                            // Invalidate profile & card queries so UI refreshes
                            try { queryClient.invalidateQueries({ queryKey: ['profile'] }); queryClient.invalidateQueries({ queryKey: ['cards'] }); } catch (e) {}
                            // Persist created card locally so Profile & MyCards can read it immediately
                            try {
                                const createdCard = _data && (_data as any).data ? ( _data as any).data : _data;
                                    if (createdCard) {
                                    await AsyncStorage.setItem('default_card', JSON.stringify(createdCard));
                                    console.log('Builder: saved created card to default_card (preview):', createdCard._id || createdCard.id || JSON.stringify(createdCard).slice(0,200));
                                    try {
                                        // Update local ['cards'] cache immediately
                                        queryClient.setQueryData(['cards'], (old: any) => {
                                            if (!old) return [createdCard];
                                            if (Array.isArray(old)) return [createdCard, ...old];
                                            return old;
                                        });
                                    } catch (e) {
                                        console.warn('Builder: failed to setQueryData for created card (cards):', e);
                                    }

                                    try {
                                        // Also proactively add to contacts-feed so Home shows the new card even if Home wasn't mounted
                                        const before = queryClient.getQueryData(['contacts-feed']);
                                        console.log('Builder: contacts-feed cache before insert length:', Array.isArray(before) ? before.length : typeof before);
                                        queryClient.setQueryData(['contacts-feed'], (old: any) => {
                                            if (!old) return [createdCard];
                                            if (Array.isArray(old)) return [createdCard, ...old];
                                            return old;
                                        });
                                        const after = queryClient.getQueryData(['contacts-feed']);
                                        console.log('Builder: contacts-feed cache after insert length:', Array.isArray(after) ? after.length : typeof after);
                                    } catch (e) {
                                        console.warn('Builder: failed to setQueryData for contacts-feed', e);
                                    }

                                    // Invalidate and request refetch for all queries so any mounted screens refresh
                                    try {
                                        queryClient.invalidateQueries({ queryKey: ['contacts-feed'], refetchType: 'all' });
                                        queryClient.invalidateQueries({ queryKey: ['cards'], refetchType: 'all' });
                                    } catch (e) {
                                        console.warn('Builder: failed to invalidate queries after create', e);
                                    }
                                }
                            } catch (e) { console.warn('Builder: failed to save default_card', e); }
                        } catch (e) {
                            console.warn('Builder: failed to sync profile', e);
                        }
                    }
                } catch (e) { console.warn('Builder: unexpected error while syncing profile', e); }
            })();

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
        onSuccess: (_data, payload) => {
            // Log raw server response for debugging date persistence
            try { console.log('Builder: raw update response:', _data); } catch (e) {}
            queryClient.invalidateQueries({ queryKey: ["cards"] });
            queryClient.invalidateQueries({ queryKey: ["public-feed"] });
            try { queryClient.invalidateQueries({ queryKey: ['contacts-feed'] }); queryClient.invalidateQueries({ queryKey: ['profile'] }); } catch (e) {}
            // Sync certain card fields back to profile
            (async () => {
                try {
                    const profileable: any = {};
                    // Load existing user so we only attempt phone changes when necessary
                    const existingUserRawU = await AsyncStorage.getItem('user');
                    let existingUserU: any = null;
                    try { existingUserU = existingUserRawU ? JSON.parse(existingUserRawU) : null; } catch (e) { existingUserU = null; }
                    ['name','personalPhone','gender','birthdate','anniversary'].forEach(k => {
                        if (k === 'personalPhone' && (payload && (payload as any).personalPhone !== undefined)) {
                            const newPhone = (payload as any).personalPhone;
                            const storedPhone = existingUserU?.phone || existingUserU?.phoneNumber || null;
                            if (!storedPhone || String(newPhone) !== String(storedPhone)) {
                                profileable.phone = newPhone;
                            }
                        } else if (payload && (payload as any)[k] !== undefined) profileable[k] = (payload as any)[k];
                    });
                    // Normalize gender string to profile-friendly values
                    if (profileable.gender && typeof profileable.gender === 'string') {
                        const g = String(profileable.gender).toLowerCase();
                        if (g.startsWith('m')) profileable.gender = 'male';
                        else if (g.startsWith('f')) profileable.gender = 'female';
                    }
                    if (Object.keys(profileable).length > 0) {
                        try {
                            try {
                                const resp = await api.put('/auth/update-profile', profileable);
                                console.log('Builder update:onSuccess profile sync response', resp);
                                try {
                                    const u = await AsyncStorage.getItem('user');
                                    if (u) {
                                        const uu = JSON.parse(u);
                                        const merged = { ...uu, ...profileable };
                                        await AsyncStorage.setItem('user', JSON.stringify(merged));
                                    }
                                } catch (e) { console.warn('Builder: failed to merge user into AsyncStorage', e); }
                            } catch (err: any) {
                                const msg = String(err?.message || err?.data?.message || '');
                                if (err?.status === 409 || /phone number already exists/i.test(msg)) {
                                    console.warn('Builder update:onSuccess: phone conflict, retrying without phone');
                                    const reduced = { ...profileable };
                                    delete reduced.phone;
                                    try {
                                        const resp2 = await api.put('/auth/update-profile', reduced);
                                        console.log('Builder update:onSuccess profile sync response (without phone)', resp2);
                                        try {
                                            const u = await AsyncStorage.getItem('user');
                                            if (u) {
                                                const uu = JSON.parse(u);
                                                const merged = { ...uu, ...reduced };
                                                await AsyncStorage.setItem('user', JSON.stringify(merged));
                                            }
                                        } catch (e) { console.warn('Builder: failed to merge user into AsyncStorage after retry', e); }
                                    } catch (e2) {
                                        console.warn('Builder update:onSuccess retry without phone failed', e2);
                                    }
                                } else {
                                    throw err;
                                }
                            }
                            try { queryClient.invalidateQueries({ queryKey: ['profile'] }); queryClient.invalidateQueries({ queryKey: ['cards'] }); } catch (e) {}
                        } catch (e) {
                            console.warn('Builder update:onSuccess failed to sync profile', e);
                        }
                    }
                } catch (e) { console.warn('Builder update:onSuccess unexpected', e); }
            })();

            // Persist updated card locally so Profile & MyCards reflect changes immediately
            (async () => {
                try {
                    const updatedCard = _data && (_data as any).data ? (_data as any).data : _data;
                    if (updatedCard) {
                        await AsyncStorage.setItem('default_card', JSON.stringify(updatedCard));
                        console.log('Builder: saved updated card to default_card (preview):', updatedCard._id || updatedCard.id || JSON.stringify(updatedCard).slice(0,200));
                        // Update react-query cache for ['cards'] to replace the stale card immediately
                        try {
                            queryClient.setQueryData(['cards'], (old: any) => {
                                if (!old) return [updatedCard];
                                if (Array.isArray(old)) return old.map((c: any) => (c && (c._id || c.id) === (updatedCard._id || updatedCard.id) ? updatedCard : c));
                                return old;
                            });
                        } catch (e) {
                            console.warn('Builder: failed to setQueryData for updated card', e);
                        }
                        // Force refetch of contacts-feed (Home) so update is visible immediately
                        try {
                            queryClient.invalidateQueries({ queryKey: ['contacts-feed'] });
                            queryClient.refetchQueries({ queryKey: ['contacts-feed'] });
                        } catch (e) {
                            console.warn('Builder: failed to refresh contacts-feed after update', e);
                        }
                    }
                } catch (e) { console.warn('Builder: failed to save default_card after update', e); }
            })();

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
            try { queryClient.invalidateQueries({ queryKey: ['contacts-feed'] }); queryClient.invalidateQueries({ queryKey: ['profile'] }); } catch (e) {}
            
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
    const [birthdate, setBirthdate] = useState<string | null>(null);
    const [anniversary, setAnniversary] = useState<string | null>(null);
    const [birthText, setBirthText] = useState<string>("");
    const [annivText, setAnnivText] = useState<string>("");
    const [showBirthdatePicker, setShowBirthdatePicker] = useState(false);
    const [showAnniversaryPicker, setShowAnniversaryPicker] = useState(false);
        const [birthYear, setBirthYear] = useState(new Date().getFullYear());
        const [birthMonth, setBirthMonth] = useState(new Date().getMonth());
        const [annivYear, setAnnivYear] = useState(new Date().getFullYear());
        const [annivMonth, setAnnivMonth] = useState(new Date().getMonth());

        // Helper for month navigation
        const changeMonthYear = (month: number, year: number, delta: number) => {
            let newMonth = month + delta;
            let newYear = year;
            if (newMonth < 0) {
                newMonth = 11;
                newYear -= 1;
            } else if (newMonth > 11) {
                newMonth = 0;
                newYear += 1;
            }
            return { newMonth, newYear };
        };

        // Local lightweight calendar component using lucide icons
        const LocalCalendar = ({ year, month, selectedIso, onDayPress, onPrev, onNext }: any) => {
            const pad = (n: number) => String(n).padStart(2, '0');
            const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
            const days = new Date(year, month + 1, 0).getDate();

            const cells: Array<(number | null)> = [];
            for (let i = 0; i < firstWeekday; i++) cells.push(null);
            for (let d = 1; d <= days; d++) cells.push(d);
            while (cells.length % 7 !== 0) cells.push(null);

            const selectedDay = selectedIso ? selectedIso.split('T')[0] : null;

            return (
                <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <TouchableOpacity onPress={onPrev} style={{ padding: 6 }}>
                            <Ionicons name="chevron-back" size={20} color="#374151" />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                                {MONTHS[month]}
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{` ${year}`}</Text>
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onNext} style={{ padding: 6 }}>
                            <Ionicons name="chevron-forward" size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <View style={s.weekRow}>
                        {['S','M','T','W','T','F','S'].map((w, i) => (
                            <Text key={`${w}-${i}`} style={s.weekday}>{w}</Text>
                        ))}
                    </View>

                    <View>
                        {Array.from({ length: cells.length / 7 }).map((_, r) => (
                            <View key={`row-${r}`} style={s.weekRow}>
                                {cells.slice(r * 7, r * 7 + 7).map((day, ci) => {
                                    const isSelected = day && selectedDay === `${year}-${pad(month + 1)}-${pad(day)}`;
                                    return (
                                        <TouchableOpacity
                                            key={`cell-${r}-${ci}-${day ?? 'n'}`}
                                            disabled={!day}
                                            onPress={() => {
                                                if (!day) return;
                                                const iso = `${year}-${pad(month + 1)}-${pad(day)}T00:00:00.000Z`;
                                                onDayPress(iso);
                                            }}
                                            style={[s.dayCell, isSelected ? s.selectedDay : undefined]}
                                        >
                                                <Text style={[s.dayText, isSelected ? s.selectedDayText : undefined]}>{day ?? ''}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </View>
            );
        };
    const [gender, setGender] = useState(""); // New gender field
    const [personalCountryCode, setPersonalCountryCode] = useState("91");
    const [personalPhone, setPersonalPhone] = useState("");
    const [email, setEmail] = useState("");
    const [location, setLocation] = useState("");
    const [mapsLink, setMapsLink] = useState("");

    // Business
    const [companyName, setCompanyName] = useState("");
    const [designation, setDesignation] = useState(""); // Moved from Personal to Business
    const [companyCountryCode, setCompanyCountryCode] = useState("91");
    const [companyPhone, setCompanyPhone] = useState("");
    // Support multiple company phone numbers
    const [companyPhones, setCompanyPhones] = useState<Array<{ countryCode: string; phone: string }>>([
        { countryCode: '91', phone: '' }
    ]);
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
            setBirthdate(existingCard.birthdate || null);
            setAnniversary(existingCard.anniversary || null);
            setGender(existingCard.gender || ""); // Load gender
            setPersonalCountryCode(existingCard.personalCountryCode || "91");
            setPersonalPhone(existingCard.personalPhone || "");
            setEmail(existingCard.email || "");
            setLocation(existingCard.location || "");
            setMapsLink(existingCard.mapsLink || "");
            setCompanyName(existingCard.companyName || "");
            setDesignation(existingCard.designation || ""); // Load designation in Business section
            setCompanyCountryCode(existingCard.companyCountryCode || "91");
            setCompanyPhone(existingCard.companyPhone || "");
            // populate multiple phones if available, else fallback to single
            if (existingCard.companyPhones && Array.isArray(existingCard.companyPhones) && existingCard.companyPhones.length > 0) {
                setCompanyPhones(existingCard.companyPhones.map((p: any) => ({ countryCode: p.countryCode || '91', phone: p.phone || '' })));
            } else {
                setCompanyPhones([{ countryCode: existingCard.companyCountryCode || '91', phone: existingCard.companyPhone || '' }]);
            }
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
            // keep text inputs in sync with ISO dates
            setBirthText(formatIsoToDisplay(existingCard.birthdate || null));
            setAnnivText(formatIsoToDisplay(existingCard.anniversary || null));
        }
    }, [existingCard, isEditMode, edit]);

    // keep text fields in sync when canonical ISO date changes
    useEffect(() => {
        setBirthText(formatIsoToDisplay(birthdate));
    }, [birthdate]);
    useEffect(() => {
        setAnnivText(formatIsoToDisplay(anniversary));
    }, [anniversary]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!isNonEmpty(name)) e.name = "Name is required";
        if (email && !isEmail(email)) e.email = "Invalid email";
        if (!isDigits(personalCountryCode)) e.personalCountryCode = "Only digits";
        if (personalPhone && !/^\d{10}$/.test(personalPhone)) e.personalPhone = "Enter 10 digits";
        if (companyEmail && !isEmail(companyEmail)) e.companyEmail = "Invalid email";
        if (companyWebsite && !isURL(companyWebsite)) e.companyWebsite = "Invalid URL";
        if (!isDigits(companyCountryCode)) e.companyCountryCode = "Only digits";
        if (companyPhone && !/^\d{10}$/.test(companyPhone)) e.companyPhone = "Enter 10 digits";
        // Validate multiple company phones
        companyPhones.forEach((p, idx) => {
            if (p.phone && !/^\d{10}$/.test(p.phone)) {
                e[`companyPhone_${idx}`] = 'Enter 10 digits';
            }
        });
        if (mapsLink && !isURL(mapsLink)) e.mapsLink = "Invalid link";
        if (companyMapsLink && !isURL(companyMapsLink)) e.companyMapsLink = "Invalid link";
            // Birthdate is required
            if (!birthdate) e.birthdate = "Birthdate is required";
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
            mediaTypes: (ImagePicker as any).MediaTypeOptions?.Images ?? (ImagePicker as any).MediaType?.Images ?? ['Images'], // fixed property name
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
            birthdate,
            anniversary,
            gender, // Add gender to payload
            personalCountryCode,
            personalPhone,
            email,
            location,
            mapsLink,
            // Business
            companyName,
            designation, // Designation is now in Business section
            companyCountryCode,
            // Use first company phone as backward-compatible single field
            companyPhone: (companyPhones && companyPhones[0]?.phone) || companyPhone,
            companyPhones,
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
            gender,
            personalCountryCode,
            personalPhone,
            email,
            location,
            mapsLink,
            companyName,
            designation, // Add designation to dependencies
            companyCountryCode,
            companyPhone,
            companyPhones,
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
        // Ensure any typed-but-unblurred date fields are parsed into ISO
        const finalPayload: any = { ...payload };
        try {
            if (!finalPayload.birthdate && birthText) {
                const parsed = parseDisplayToIso(birthText);
                if (parsed) finalPayload.birthdate = parsed.iso;
            }
        } catch (e) { /* ignore parsing failure */ }
        try {
            if (!finalPayload.anniversary && annivText) {
                const parsed = parseDisplayToIso(annivText);
                if (parsed) finalPayload.anniversary = parsed.iso;
            }
        } catch (e) { /* ignore parsing failure */ }

        if (isEditMode) {
            console.log('Builder: update payload preview', { payload: finalPayload });
            updateCardMutation.mutate(finalPayload);
        } else {
            console.log('Builder: create payload preview', { payload: finalPayload });
            createCardMutation.mutate(finalPayload);
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
                    {/* Header with Cancel Button */}
                    <View style={{ marginBottom: 12 }}>
                        {/* Cancel Button */}
                        <TouchableOpacity 
                            onPress={() => router.back()}
                            style={s.cancelButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={28} color="#6B7280" />
                        </TouchableOpacity>
                        
                        {/* Title */}
                        <View style={{ alignItems: "center" }}>
                            <Text style={s.h1}>{isEditMode ? "Edit Card" : "Create New Card"}</Text>
                            <Text style={s.subtitle}>
                                {isEditMode 
                                    ? "Update your professional details" 
                                    : "Build your digital business card in minutes"
                                }
                            </Text>
                        </View>
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

                                {/* Birthdate Field */}
                                <View style={s.formField}>
                                    <Text style={s.enhancedLabel}>Birthdate<Text style={s.requiredIndicator}> *</Text></Text>
                                    <View style={[s.dateInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                                        <FormInput
                                            key="birthdate-input"
                                            value={birthText}
                                            onChangeText={(t: string) => {
                                                // live-format digits into dd-mm-yyyy
                                                const formatted = formatDigitsToDisplay(t);
                                                setBirthText(formatted);
                                                if (errors.birthdate) setErrors(prev => { const c = { ...prev }; delete c.birthdate; return c; });

                                                // if user has entered full 8 digits, auto-apply
                                                const digits = t.replace(/\D/g, '');
                                                if (digits.length >= 8) {
                                                    const parsed = parseDisplayToIso(formatDigitsToDisplay(digits));
                                                    if (parsed) {
                                                        setBirthdate(parsed.iso);
                                                        setBirthYear(parsed.year);
                                                        setBirthMonth(parsed.month);
                                                    }
                                                }
                                            }}
                                            onBlur={() => {
                                                const parsed = parseDisplayToIso(birthText);
                                                if (parsed) {
                                                    setBirthdate(parsed.iso);
                                                    setBirthYear(parsed.year);
                                                    setBirthMonth(parsed.month);
                                                } else if (birthText.trim() !== '') {
                                                    setErrors(prev => ({ ...prev, birthdate: 'Invalid date (dd-mm-yyyy)' }));
                                                } else {
                                                    setBirthdate(null);
                                                }
                                            }}
                                            placeholder={'dd-mm-yyyy'}
                                            style={{ color: birthText ? '#111827' : '#9CA3AF', fontSize: 16, height: 44, paddingVertical: 0, flex: 1 }}
                                            keyboardType='default'
                                            returnKeyType='done'
                                        />
                                        <TouchableOpacity onPress={() => setShowBirthdatePicker(true)} style={{ marginLeft: 8 }}>
                                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>
                                    <Err k="birthdate" />
                                    {showBirthdatePicker && (
                                        <View style={{ marginVertical: 10 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <View style={{ minWidth: 160 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                                <TouchableOpacity onPress={() => {
                                                                    const { newMonth, newYear } = changeMonthYear(birthMonth, birthYear, -1);
                                                                    setBirthMonth(newMonth);
                                                                    setBirthYear(newYear);
                                                                }} style={{ padding: 6 }}>
                                                                    <Ionicons name="chevron-back" size={18} color="#374151" />
                                                                </TouchableOpacity>
                                                                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', minWidth: 120, textAlign: 'center' }}>{MONTHS[birthMonth]}</Text>
                                                                <TouchableOpacity onPress={() => {
                                                                    const { newMonth, newYear } = changeMonthYear(birthMonth, birthYear, 1);
                                                                    setBirthMonth(newMonth);
                                                                    setBirthYear(newYear);
                                                                }} style={{ padding: 6 }}>
                                                                    <Ionicons name="chevron-forward" size={18} color="#374151" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    {/* place year picker at the top-right of the picker header */}
                                                    <View style={{ minWidth: 90, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                        <TouchableOpacity onPress={() => setBirthYear(prev => prev - 1)} style={{ padding: 6 }}>
                                                            <Ionicons name="remove" size={16} color="#374151" />
                                                        </TouchableOpacity>
                                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', minWidth: 60, textAlign: 'center' }}>{String(birthYear)}</Text>
                                                        <TouchableOpacity onPress={() => setBirthYear(prev => prev + 1)} style={{ padding: 6 }}>
                                                            <Ionicons name="add" size={16} color="#374151" />
                                                        </TouchableOpacity>
                                                    </View>
                                            </View>
                                            <LocalCalendar
                                                year={birthYear}
                                                month={birthMonth}
                                                selectedIso={birthdate}
                                                onDayPress={(iso: string) => {
                                                    setBirthdate(iso);
                                                    try {
                                                        const [y, m] = iso.split('T')[0].split('-');
                                                        const yN = Number(y);
                                                        const mN = Number(m) - 1;
                                                        if (!isNaN(yN)) setBirthYear(yN);
                                                        if (!isNaN(mN)) setBirthMonth(mN);
                                                            // reflect in typed input
                                                            setBirthText(formatIsoToDisplay(iso));
                                                    } catch (e) {}
                                                    setShowBirthdatePicker(false);
                                                }}
                                                onPrev={() => {
                                                    const { newMonth, newYear } = changeMonthYear(birthMonth, birthYear, -1);
                                                    setBirthMonth(newMonth);
                                                    setBirthYear(newYear);
                                                }}
                                                onNext={() => {
                                                    const { newMonth, newYear } = changeMonthYear(birthMonth, birthYear, 1);
                                                    setBirthMonth(newMonth);
                                                    setBirthYear(newYear);
                                                }}
                                            />
                                            <TouchableOpacity onPress={() => setShowBirthdatePicker(false)} style={{ alignItems: 'center', margin: 8 }}>
                                                <Text style={{ color: '#3B82F6', fontWeight: 'bold' }}>Cancel</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>

                                {/* Anniversary Field */}
                                <View style={s.formField}>
                                    <Text style={s.enhancedLabel}>Anniversary</Text>
                                    <View style={[s.dateInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                                        <FormInput
                                            key="anniversary-input"
                                            value={annivText}
                                            onChangeText={(t: string) => {
                                                const formatted = formatDigitsToDisplay(t);
                                                setAnnivText(formatted);

                                                const digits = t.replace(/\D/g, '');
                                                if (digits.length >= 8) {
                                                    const parsed = parseDisplayToIso(formatDigitsToDisplay(digits));
                                                    if (parsed) {
                                                        setAnniversary(parsed.iso);
                                                        setAnnivYear(parsed.year);
                                                        setAnnivMonth(parsed.month);
                                                    }
                                                }
                                            }}
                                            onBlur={() => {
                                                const parsed = parseDisplayToIso(annivText);
                                                if (parsed) {
                                                    setAnniversary(parsed.iso);
                                                    setAnnivYear(parsed.year);
                                                    setAnnivMonth(parsed.month);
                                                } else if (annivText.trim() !== '') {
                                                    setErrors(prev => ({ ...prev, anniversary: 'Invalid date (dd-mm-yyyy)' }));
                                                } else {
                                                    setAnniversary(null);
                                                }
                                            }}
                                            placeholder={'dd-mm-yyyy'}
                                            style={{ color: annivText ? '#111827' : '#9CA3AF', fontSize: 16, height: 44, paddingVertical: 0, flex: 1 }}
                                            keyboardType='default'
                                            returnKeyType='done'
                                        />
                                        <TouchableOpacity onPress={() => setShowAnniversaryPicker(true)} style={{ marginLeft: 8 }}>
                                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>
                                    {showAnniversaryPicker && (
                                        <View style={{ marginVertical: 10 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <View style={{ minWidth: 160 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                                <TouchableOpacity onPress={() => {
                                                                    const { newMonth, newYear } = changeMonthYear(annivMonth, annivYear, -1);
                                                                    setAnnivMonth(newMonth);
                                                                    setAnnivYear(newYear);
                                                                }} style={{ padding: 6 }}>
                                                                    <Ionicons name="chevron-back" size={18} color="#374151" />
                                                                </TouchableOpacity>
                                                                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', minWidth: 120, textAlign: 'center' }}>{MONTHS[annivMonth]}</Text>
                                                                <TouchableOpacity onPress={() => {
                                                                    const { newMonth, newYear } = changeMonthYear(annivMonth, annivYear, 1);
                                                                    setAnnivMonth(newMonth);
                                                                    setAnnivYear(newYear);
                                                                }} style={{ padding: 6 }}>
                                                                    <Ionicons name="chevron-forward" size={18} color="#374151" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                </View>
                                                {/* place year picker at the top-right of the picker header */}
                                                <View style={{ minWidth: 90, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                    <TouchableOpacity onPress={() => setAnnivYear(prev => prev - 1)} style={{ padding: 6 }}>
                                                        <Ionicons name="remove" size={16} color="#374151" />
                                                    </TouchableOpacity>
                                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', minWidth: 60, textAlign: 'center' }}>{String(annivYear)}</Text>
                                                    <TouchableOpacity onPress={() => setAnnivYear(prev => prev + 1)} style={{ padding: 6 }}>
                                                        <Ionicons name="add" size={16} color="#374151" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            <LocalCalendar
                                                year={annivYear}
                                                month={annivMonth}
                                                selectedIso={anniversary}
                                                onDayPress={(iso: string) => {
                                                    setAnniversary(iso);
                                                    try {
                                                        const [y, m] = iso.split('T')[0].split('-');
                                                        const yN = Number(y);
                                                        const mN = Number(m) - 1;
                                                        if (!isNaN(yN)) setAnnivYear(yN);
                                                        if (!isNaN(mN)) setAnnivMonth(mN);
                                                            setAnnivText(formatIsoToDisplay(iso));
                                                    } catch (e) {}
                                                    setShowAnniversaryPicker(false);
                                                }}
                                                onPrev={() => {
                                                    const { newMonth, newYear } = changeMonthYear(annivMonth, annivYear, -1);
                                                    setAnnivMonth(newMonth);
                                                    setAnnivYear(newYear);
                                                }}
                                                onNext={() => {
                                                    const { newMonth, newYear } = changeMonthYear(annivMonth, annivYear, 1);
                                                    setAnnivMonth(newMonth);
                                                    setAnnivYear(newYear);
                                                }}
                                            />
                                            <TouchableOpacity onPress={() => setShowAnniversaryPicker(false)} style={{ alignItems: 'center', margin: 8 }}>
                                                <Text style={{ color: '#3B82F6', fontWeight: 'bold' }}>Cancel</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>

                                {/* Gender Dropdown */}
                                <View style={s.formField}>
                                    <Text style={s.enhancedLabel}>Gender</Text>
                                    <View style={s.genderContainer}>
                                        <TouchableOpacity
                                            style={[
                                                s.genderButton,
                                                gender === 'Male' && s.genderButtonSelected
                                            ]}
                                            onPress={() => setGender('Male')}
                                        >
                                            <Ionicons 
                                                name="male" 
                                                size={20} 
                                                color={gender === 'Male' ? '#FFFFFF' : '#6B7280'} 
                                            />
                                            <Text style={[
                                                s.genderButtonText,
                                                gender === 'Male' && s.genderButtonTextSelected
                                            ]}>Male</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity
                                            style={[
                                                s.genderButton,
                                                gender === 'Female' && s.genderButtonSelected
                                            ]}
                                            onPress={() => setGender('Female')}
                                        >
                                            <Ionicons 
                                                name="female" 
                                                size={20} 
                                                color={gender === 'Female' ? '#FFFFFF' : '#6B7280'} 
                                            />
                                            <Text style={[
                                                s.genderButtonText,
                                                gender === 'Female' && s.genderButtonTextSelected
                                            ]}>Female</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

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

                                <FormField
                                    label="Job Title / Designation"
                                    value={designation}
                                    onChangeText={setDesignation}
                                    inputKey="designation-input"
                                    placeholder="e.g. Marketing Manager, CEO, Developer"
                                />

                                <View style={s.formField}>
                                
                                    {companyPhones.map((p, idx) => (
                                        <View key={`company-phone-${idx}`} style={{ marginBottom: 12 }}>
                                            <View style={s.phoneRow}>
                                                <View style={s.phoneWrapper}>
                                                    <PhoneInput
                                                        label={idx === 0 ? "Company Phone" : `Company Phone ${idx + 1}`}
                                                        value={p.phone}
                                                        onChangeText={(text: string) => {
                                                            const copy = [...companyPhones];
                                                            copy[idx] = { ...copy[idx], phone: text };
                                                            setCompanyPhones(copy);
                                                        }}
                                                        countryCode={`+${p.countryCode || '91'}`}
                                                        onCountryCodeChange={(code) => {
                                                            const copy = [...companyPhones];
                                                            copy[idx] = { ...copy[idx], countryCode: code.replace('+', '') };
                                                            setCompanyPhones(copy);
                                                        }}
                                                        placeholder="Company number"
                                                    />
                                                    <Err k={`companyPhone_${idx}`} />

                                                    {idx !== 0 && (
                                                        <TouchableOpacity
                                                            style={s.deletePhoneBtn}
                                                            onPress={() => {
                                                                if (companyPhones.length <= 1) {
                                                                    setCompanyPhones([{ countryCode: '91', phone: '' }]);
                                                                    return;
                                                                }
                                                                setCompanyPhones(prev => prev.filter((_, i) => i !== idx));
                                                            }}
                                                            accessibilityLabel="Remove phone"
                                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                        >
                                                            <Ionicons name="trash-outline" size={20} color="#DC2626" style={s.deletePhoneIcon} />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    ))}

                                    <TouchableOpacity style={s.addPhoneBtn} onPress={() => setCompanyPhones(prev => [...prev, { countryCode: '91', phone: '' }])}>
                                        <Ionicons name="add" size={18} color="#3B82F6" />
                                        <Text style={s.addPhoneTxt}>Add phone</Text>
                                    </TouchableOpacity>

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
    cancelButton: {
        position: "absolute",
        top: 0,
        right: 0,
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
    },
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

    addPhoneBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    addPhoneTxt: {
        color: '#3B82F6',
        fontWeight: '600',
        marginLeft: 6,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // keep top alignment so label sits above input
    },
    phoneWrapper: {
        flex: 1,
        position: 'relative',
    },
    deletePhoneBtn: {
        // absolutely position the button so it doesn't reduce the input width
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: [{ translateY: -6 }],
        width: 40,
        height: 40,
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deletePhoneIcon: {
        // center the icon within the touch area
        alignSelf: 'center',
    },
    
    // Gender Selection Styles
    genderContainer: {
        flexDirection: "row",
        marginTop: 8,
    },
    genderButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    genderButtonSelected: {
        backgroundColor: "#3B82F6",
        borderColor: "#3B82F6",
    },
    genderButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#6B7280",
    },
    genderButtonTextSelected: {
        color: "#FFFFFF",
    },
    
    // Action Buttons
    actionContainer: {
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
    // Outer wrapper for the date row — make transparent so the calendar's inner box is the visible container
    dateInput: {
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: 0,
        borderWidth: 0,
        marginBottom: 0,
        justifyContent: 'center',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    weekday: {
        flex: 1,
        textAlign: 'center',
        color: '#6B7280',
        fontWeight: '600',
    },
    dayCell: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: {
        color: '#374151',
    },
    selectedDay: {
        backgroundColor: '#3B82F6',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    selectedDayText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
