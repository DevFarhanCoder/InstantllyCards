import { Text, TextInput, View, StyleSheet, TextInputProps, ViewStyle } from "react-native";
import { COLORS } from "@/lib/theme";


export default function Field({ label, style, containerStyle, ...props }: { label: string; containerStyle?: ViewStyle } & TextInputProps) {
  return (
    <View style={[{ gap: 8 }, containerStyle]}>
      {label ? <Text style={c.label}>{label.toUpperCase()}</Text> : null}
      <TextInput
        placeholderTextColor="#9CA3AF"
        style={[c.input, style]}
        {...props}
      />
    </View>
  );
}
const c = StyleSheet.create({
  label: { color: '#374151', letterSpacing: 1.2, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: '#F1F5F9',  // Light modern input background
    color: '#111827',  // Dark text
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E6E9EE',  // Subtle border
    textAlignVertical: 'center',
  }
});