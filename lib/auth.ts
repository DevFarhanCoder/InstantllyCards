// lib/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

export async function ensureAuth(): Promise<string | null> {
  const existing = await AsyncStorage.getItem("token");
  if (existing) return existing;

  const preset = process.env.EXPO_PUBLIC_DEV_TOKEN;
  if (preset) {
    await AsyncStorage.setItem("token", preset);
    return preset;
  }

  const phone = process.env.EXPO_PUBLIC_DEV_PHONE;
  const password = process.env.EXPO_PUBLIC_DEV_PASSWORD;

  if (phone && password) {
    const data = await api.post("/auth/login", { phone, password });
    if (data?.token) {
      await AsyncStorage.setItem("token", String(data.token));
      return String(data.token);
    }
  }
  return null;
}
