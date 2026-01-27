// app/(auth)/sign-in.tsx
import { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import api from "../../lib/api";

export default function SignIn() {
  const r = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      const data = await api.post("/auth/login", { phone, password });
      await AsyncStorage.setItem("token", data.token);
      if (data.user?.name) {
        await AsyncStorage.setItem("user_name", data.user.name);
      }
      if (data.user?.phone) {
        await AsyncStorage.setItem("user_phone", data.user.phone);
      }
      // Store user ID for filtering own cards from home feed
      if (data.user?.id || data.user?._id) {
        await AsyncStorage.setItem(
          "currentUserId",
          (data.user.id || data.user._id).toString(),
        );
      }

      r.replace("/"); // to (main)/index
    } catch (e: any) {
      Alert.alert("Login failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text>Phone Number</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+1234567890"
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <Text>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <Button
        title={loading ? "Signing in..." : "Sign In"}
        onPress={onSubmit}
      />
      <Link href="/">Continue as guest</Link>
    </View>
  );
}
