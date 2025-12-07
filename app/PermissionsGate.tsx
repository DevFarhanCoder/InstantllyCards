import { useEffect, useState } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity } from "react-native";
import * as Contacts from "expo-contacts";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PermissionsGate() {
    const [contactsAllowed, setContactsAllowed] = useState(false);
    const [notificationsAllowed, setNotificationsAllowed] = useState(false);

    async function checkContacts() {
        const { status } = await Contacts.getPermissionsAsync();
        setContactsAllowed(status === "granted");
    }

    async function requestContacts() {
        const { status } = await Contacts.requestPermissionsAsync();
        setContactsAllowed(status === "granted");
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

    useEffect(() => {
        checkContacts();
        checkNotifications();
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

            <TouchableOpacity
                disabled={!bothAllowed}
                style={[s.enterBtn, { opacity: bothAllowed ? 1 : 0.4 }]}
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
    }
});
