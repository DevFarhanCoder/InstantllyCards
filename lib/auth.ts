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

  const email = process.env.EXPO_PUBLIC_DEV_EMAIL;
  const password = process.env.EXPO_PUBLIC_DEV_PASSWORD;

  if (email && password) {
    const data = await api.post("/auth/login", { email, password });
    if (data?.token) {
      await AsyncStorage.setItem("token", String(data.token));
      return String(data.token);
    }
  }
  return null;
}
