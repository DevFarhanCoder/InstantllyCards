import { View, Text, StyleSheet, Image, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Card } from "@/hooks/cards";

const cleanPhone = (s?: string) => (s ?? "").replace(/[^\d+]/g, "");

export default function BusinessCard({ item }: { item: Card }) {
    const title =
        item.personal?.name ||
        item.business?.companyName ||
        "Instantlly Card";

    const phone =
        cleanPhone(item.personal?.contact) ||
        cleanPhone(item.business?.companyContact);

    const whatsapp =
        item.social?.whatsapp ||
        (phone ? `https://wa.me/${phone}` : undefined);

    const call = () => phone && Linking.openURL(`tel:${phone}`);
    const chat = () => {
        if (!whatsapp) return;
        const msg = encodeURIComponent("I saw your profile on Instantlly Cards, and I am very interested in Connecting with you.");
        const url = whatsapp.includes("wa.me") ? `${whatsapp}${whatsapp.includes("?") ? "&" : "?"}text=${msg}` : `${whatsapp}`;
        Linking.openURL(url);
    };

    return (
        <View style={s.wrap}>
            <Image source={{ uri: item.imageUrl || "https://picsum.photos/seed/card/300/200" }} style={s.thumb} />
            <View style={s.body}>
                <Text style={s.title} numberOfLines={1}>{title}</Text>
                {/* you can add chips/ratings if your API returns them */}
                <View style={s.btnRow}>
                    <Pressable style={[s.btn, { backgroundColor: "#19A538" }]} onPress={call}>
                        <Ionicons name="call" size={16} color="#fff" /><Text style={s.btnText}>  Call</Text>
                    </Pressable>
                    <Pressable style={[s.btn, { backgroundColor: "#25D366" }]} onPress={chat}>
                        <Ionicons name="chatbubbles-outline" size={18} color="#fff" /><Text style={s.btnText}>  Chat</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { backgroundColor: "#fff", borderRadius: 14, overflow: "hidden", marginBottom: 12, flexDirection: "row", elevation: 2 },
    thumb: { width: 120, height: "100%" as any, backgroundColor: "#EEE" },
    body: { flex: 1, padding: 12 },
    title: { fontSize: 18, fontWeight: "800", color: "#111" },
    btnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    btn: { flex: 1, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", flexDirection: "row" },
    btnText: { color: "#fff", fontWeight: "700" },
});
