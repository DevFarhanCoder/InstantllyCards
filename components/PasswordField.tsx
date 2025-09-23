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
                    placeholderTextColor="#C7CACA"
                />
                <Pressable onPress={() => setShow(s => !s)} style={p.eye}>
                    <Ionicons name={show ? "eye-off" : "eye"} size={20} color="#2B2B2B" />
                </Pressable>
            </View>
        </View>
    );
}
const p = StyleSheet.create({
    label: { color: COLORS.muted, letterSpacing: 1.5, fontSize: 14, fontWeight: "600" },
    row: { position: "relative" },
    input: {
        backgroundColor: COLORS.inputBg,
        color: COLORS.inputText,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 50,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#5B6161",
        paddingRight: 44
    },
    eye: { position: "absolute", right: 12, top: 14 }
});