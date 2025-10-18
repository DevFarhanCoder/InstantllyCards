import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/theme";


export default function PasswordField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (t: string) => void; }) {
    const [show, setShow] = useState(false);
    return (
        <View style={{ gap: 8 }}>
            <Text style={p.label}>{label.toUpperCase()}</Text>
            <View style={p.row}>
                <TextInput
                    style={p.input}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!show}
                    placeholderTextColor="#9CA3AF"
                />
                <Pressable onPress={() => setShow(s => !s)} style={p.eye}>
                    <Ionicons name={show ? "eye-off" : "eye"} size={22} color="#6B7280" />
                </Pressable>
            </View>
        </View>
    );
}
const p = StyleSheet.create({
    label: { color: '#374151', letterSpacing: 1.2, fontSize: 13, fontWeight: "600" },
    row: { position: "relative" },
    input: {
        backgroundColor: '#F1F5F9',  // Modern light input
        color: '#111827',  // Dark text
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 56,  // Match Field height
        fontSize: 16,
        borderWidth: 1.5,
        borderColor: '#E6E9EE',  // Subtle border
        paddingRight: 44
    },
    eye: { position: "absolute", right: 12, top: 18 }
});