import { Text, TextInput, View, StyleSheet, TextInputProps } from "react-native";
import { COLORS } from "@/lib/theme";


export default function Field({ label, style, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={c.label}>{label.toUpperCase()}</Text> : null}
      <TextInput
        placeholderTextColor="#C7CACA"
        style={[c.input, style]}
        {...props}
      />
    </View>
  );
}
const c = StyleSheet.create({
  label: { color: COLORS.muted, letterSpacing: 1.5, fontSize: 14, fontWeight: "600" },
  input: {
    backgroundColor: COLORS.inputBg,
    color: COLORS.inputText,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56, // Match CountryCodePicker height
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#5B6161",
    textAlignVertical: 'center', // Ensures text is centered vertically
  }
});