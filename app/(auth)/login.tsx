// app/(auth)/login.tsx
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Constants from 'expo-constants';

import api from "@/lib/api";
import serverWarmup from "@/lib/serverWarmup";
import Field from "@/components/Field";
import PasswordField from "@/components/PasswordField";
import CountryCodePicker from "@/components/CountryCodePicker";
import { PrimaryButton } from "@/components/PrimaryButton";

// Import notification registration
const isExpoGo = Constants.appOwnership === 'expo';
const notificationModule = isExpoGo 
  ? null // Expo Go doesn't need post-login registration
  : require("@/lib/notifications-production-v2");

const registerPendingPushToken = notificationModule?.registerPendingPushToken || (async () => {});
import { COLORS } from "@/lib/theme";

export default function Login() {
  const [countryCode, setCountryCode] = useState("+91"); // Default to India
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Signing in...");
  const [progress, setProgress] = useState(0);

  const doLogin = async () => {
    try {
      const phoneT = phoneNumber.trim();
      const passwordT = password.trim();
      if (!phoneT || !passwordT) {
        Alert.alert("Login failed", "Phone number and password are required");
        return;
      }

      // Remove any non-digit characters from the phone number and combine with country code
      const cleanPhone = phoneT.replace(/\D/g, "");
      const fullPhone = `${countryCode}${cleanPhone}`;

      if (cleanPhone.length < 7) {
        Alert.alert("Login failed", "Please enter a valid phone number");
        return;
      }

      setLoading(true);
      setProgress(10);
      setLoadingMessage("Preparing...");

      // Pre-warm server if not already warm
      if (!serverWarmup.isServerWarm()) {
        setLoadingMessage("Waking up server...");
        setProgress(30);
        await serverWarmup.warmupServer();
      }

      setProgress(50);
      setLoadingMessage("Signing in...");
      console.log('🚀 Attempting login with phone:', fullPhone);

      // Call backend -> POST /api/auth/login
      const res = await api.post<{ token?: string; message?: string; user?: any }>(
        "/auth/login",
        { phone: fullPhone, password: passwordT }
      );

      setProgress(80);

      const token = res?.token;
      if (!token) {
        throw new Error(res?.message || "No token returned from server.");
      }

      setProgress(95);
      setLoadingMessage("Finalizing...");

      await AsyncStorage.setItem("token", token);
      if (res?.user?.name) {
        await AsyncStorage.setItem("user_name", res.user.name);
      }
      if (res?.user?.phone) {
        await AsyncStorage.setItem("user_phone", res.user.phone);
      }
      
      // Register push token after successful login
      console.log('🔔 Attempting to register pending push token after login...');
      await registerPendingPushToken();
      
      setProgress(100);
      console.log('Login successful, redirecting to home');
      router.replace("/(tabs)/home");
    } catch (e: any) {
      console.error('Login error:', e);
      
      let msg = "Login failed. Please try again.";
      
      if (e?.message?.includes('timeout')) {
        msg = "Server is taking longer than usual. Please wait a moment and try again.";
      } else if (e?.message?.includes('Server may be sleeping')) {
        msg = "Server is starting up. Please wait 30 seconds and try again.";
      } else if (e?.message?.includes('Network')) {
        msg = "Network error. Please check your internet connection.";
      } else if (e?.status === 404) {
        msg = "Server connection issue. Please check if you're connected to the internet.";
      } else if (e?.data?.message) {
        msg = e.data.message;
      } else if (e?.message) {
        msg = e.message;
      }
      
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
      setLoadingMessage("Signing in...");
      setProgress(0);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.topLogo}>
        <Image
          source={require("../../assets/logo.png")}
          style={{ width: 240, height: 80 }}
          resizeMode="contain"
        />
      </View>

      <View style={s.card}>
        <Text style={s.title}>Login</Text>
        <Text style={s.subtitle}>Sign in to continue.</Text>

        <View style={{ gap: 16, marginTop: 20 }}>
          <View>
            <Text style={s.fieldLabel}>Phone Number</Text>
            <View style={s.phoneContainer}>
              <CountryCodePicker
                selectedCode={countryCode}
                onSelect={setCountryCode}
              />
              <Field
                label=""
                placeholder="123456789"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={s.phoneInput}
              />
            </View>
          </View>
          <PasswordField
            label="Password"
            value={password}
            onChangeText={setPassword}
          />

          <PrimaryButton
            title={loading ? `${loadingMessage}${progress > 0 ? ` (${progress}%)` : ''}` : "Log in"}
            onPress={doLogin}
            disabled={loading}
          />

          <View style={{ alignItems: "center", marginTop: 10 }}>
            <Pressable onPress={() => router.push("/(auth)/signup")}>
              <Text style={{ color: COLORS.muted, fontSize: 14 }}>
                Don’t have an account?{" "}
                <Text style={{ fontWeight: "700", color: COLORS.text }}>
                  Sign up
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bgDark },
  topLogo: { paddingTop: 70, alignItems: "center" },
  card: { padding: 20 },
  title: { color: COLORS.text, fontSize: 40, fontWeight: "800", marginTop: 40 },
  subtitle: { color: COLORS.muted, marginTop: 6, fontSize: 14 },
  fieldLabel: { 
    color: COLORS.text, 
    fontSize: 14, 
    fontWeight: "600", 
    marginBottom: 8 
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
    height: 56, // Fixed height for consistency
  },
  phoneInput: {
    flex: 1,
    minWidth: 200, // Fixed minimum width to prevent changes while typing
    width: 200, // Fixed width
  },
});
