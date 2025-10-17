import { Pressable, Text, StyleSheet, Animated } from "react-native";
import { useRef } from "react";
import { COLORS } from "@/lib/theme";

export function PrimaryButton({
  title, onPress, disabled, variant = "white", // default white per request
}: {
  title: string; onPress?: () => void; disabled?: boolean; variant?: "brand" | "white";
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const inA = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const outA = () => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const style = [s.btn, variant === "white" ? s.white : s.brand];
  const text = [s.text, variant === "white" ? s.whiteText : s.brandText];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={inA} onPressOut={outA} disabled={!!disabled} style={style}>
        <Text style={text}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  btn: { 
    height: 56, 
    borderRadius: 14, 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 0,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  white: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E9E9E9", shadowOpacity: 0.1, shadowColor: '#000' },
  brand: { backgroundColor: '#F97316', borderColor: '#F97316' },
  text: { fontWeight: "700", fontSize: 16, letterSpacing: 0.5 },
  whiteText: { color: "#1A1A1A" },
  brandText: { color: '#FFFFFF' },
});
