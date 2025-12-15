import { useEffect, useState } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import * as Contacts from "expo-contacts";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../lib/api";

export default function PermissionsGate() {
    const [contactsAllowed, setContactsAllowed] = useState(false);
    const [notificationsAllowed, setNotificationsAllowed] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    async function checkContacts() {
        const { status } = await Contacts.getPermissionsAsync();
        setContactsAllowed(status === "granted");
    }

    async function requestContacts() {
        const { status } = await Contacts.requestPermissionsAsync();
        setContactsAllowed(status === "granted");
        
        // Auto-sync contacts after permission granted
        if (status === "granted") {
            await syncContacts();
        }
    }
    
    async function syncContacts() {
        try {
            setIsSyncing(true);
            console.log('📱 [PERMISSIONS-GATE] Starting contact sync...');
            
            // Wait a bit to ensure auth token is saved to AsyncStorage
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get device contacts
            const { data: deviceContacts } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
            });
            
            // Extract phone numbers
            const phoneNumbers = deviceContacts
                .filter((contact: any) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
                .map((contact: any) => ({
                    name: contact.name || 'Unknown Contact',
                    phoneNumber: contact.phoneNumbers[0]?.number?.replace(/\D/g, '') || ''
                }))
                .filter((contact: any) => contact.phoneNumber && contact.phoneNumber.length >= 10);
            
            console.log(`📊 [PERMISSIONS-GATE] Found ${phoneNumbers.length} valid contacts`);
            
            if (phoneNumbers.length === 0) {
                console.log('⚠️ [PERMISSIONS-GATE] No valid contacts to sync');
                return;
            }
            
            // Send contacts in batches
            const BATCH_SIZE = 200;
            const totalBatches = Math.ceil(phoneNumbers.length / BATCH_SIZE);
            
            console.log(`📤 [PERMISSIONS-GATE] Syncing in ${totalBatches} batch(es)...`);
            
            for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
                const batch = phoneNumbers.slice(i, i + BATCH_SIZE);
                const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
                
                console.log(`📤 [PERMISSIONS-GATE] Batch ${batchNumber}/${totalBatches} (${batch.length} contacts)`);
                
                try {
                    await api.post("/contacts/sync-all", { contacts: batch });
                    console.log(`✅ [PERMISSIONS-GATE] Batch ${batchNumber}/${totalBatches} synced`);
                } catch (batchError) {
                    console.error(`❌ [PERMISSIONS-GATE] Batch ${batchNumber} failed:`, batchError);
                }
                
                // Small delay between batches
                if (i + BATCH_SIZE < phoneNumbers.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            // Save sync timestamp
            await AsyncStorage.setItem('contactsSyncTimestamp', Date.now().toString());
            await AsyncStorage.setItem('contactsSynced', 'true');
            
            console.log(`✅ [PERMISSIONS-GATE] COMPLETE - ${phoneNumbers.length} contacts synced`);
            
        } catch (syncError: any) {
            console.error(`❌ [PERMISSIONS-GATE] FAILED:`, syncError?.message);
        } finally {
            setIsSyncing(false);
        }
    }

    async function checkNotifications() {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationsAllowed(status === "granted");
    }

    async function requestNotifications() {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationsAllowed(status === "granted");
    }

    async function enterApp() {
        const token = await AsyncStorage.getItem("token");
        if (token) router.replace("/(tabs)/home");
        else router.replace("/(auth)/signup");
    }

    // useEffect(() => {
    //     checkContacts();
    //     checkNotifications();
    // }, []);
    useEffect(() => {
        (async () => {

            await checkContacts();
            await checkNotifications();

            const c = await Contacts.getPermissionsAsync();
            const n = await Notifications.getPermissionsAsync();

            if (c.status === "granted" && n.status === "granted") {
                enterApp();
            }

        })();
    }, []);


    const bothAllowed = contactsAllowed && notificationsAllowed;

    return (
        <View style={s.container}>

            <Text style={s.title}>Allow Permissions</Text>

            {/* ================= CONTACTS ================= */}
            <View style={s.row}>
                <Text style={s.label}>Contacts</Text>
                <Switch
                    value={contactsAllowed}
                    onValueChange={requestContacts}
                    trackColor={{ false: "#ddd", true: "#007aff" }}
                    thumbColor={contactsAllowed ? "#ffffff" : "#f2f2f2"}
                />
            </View>

            {/* ================= NOTIFICATIONS ================= */}
            <View style={s.row}>
                <Text style={s.label}>Notifications</Text>
                <Switch
                    value={notificationsAllowed}
                    onValueChange={requestNotifications}
                    trackColor={{ false: "#ddd", true: "#007aff" }}
                    thumbColor={notificationsAllowed ? "#ffffff" : "#f2f2f2"}
                />
            </View>

            {isSyncing && (
                <View style={s.syncingContainer}>
                    <ActivityIndicator size="small" color="#007aff" />
                    <Text style={s.syncingText}>Syncing contacts...</Text>
                </View>
            )}

            <TouchableOpacity
                disabled={!bothAllowed || isSyncing}
                style={[s.enterBtn, { opacity: (bothAllowed && !isSyncing) ? 1 : 0.4 }]}
                onPress={enterApp}
            >
                <Text style={s.enterText}>Enter App</Text>
            </TouchableOpacity>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
        justifyContent: "center"
    },
    title: {
        fontSize: 26,
        fontWeight: "600",
        marginBottom: 30
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 25,
        alignItems: "center"
    },
    label: {
        fontSize: 18
    },
    enterBtn: {
        backgroundColor: "#007aff",
        paddingVertical: 15,
        alignItems: "center",
        borderRadius: 10,
        marginTop: 40
    },
    enterText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600"
    },
    syncingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        gap: 10
    },
    syncingText: {
        fontSize: 16,
        color: "#007aff",
        marginLeft: 10
    }
});
