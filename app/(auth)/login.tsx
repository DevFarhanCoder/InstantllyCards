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
// ALWAYS import the module - let the module itself handle Expo Go detection
const notificationModule = require("@/lib/notifications-production-v2");

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
      setProgress(5);
      setLoadingMessage("Preparing...");

      // Pre-warm server if not already warm
      if (!serverWarmup.isServerWarm()) {
        try {
          setProgress(10);
          setLoadingMessage("Waking up server...");
          console.log('🔥 Server not warm, starting warmup...');
          
          await serverWarmup.warmupServer();
          
          setProgress(60);
          setLoadingMessage("Server ready, signing in...");
          console.log('✅ Server warmup complete');
        } catch (warmupError: any) {
          console.error('❌ Server warmup failed:', warmupError);
          
          // Show specific error about Render cold start
          Alert.alert(
            "Server Starting Up",
            "The server is waking up from sleep (Render free tier).\n\n" +
            "This can take 60-90 seconds on first access.\n\n" +
            "Please wait a moment and try again.",
            [
              { text: "Try Again", onPress: () => {
                // Reset warmup state so user can retry
                serverWarmup.resetWarmupState();
              }}
            ]
          );
          return;
        }
      } else {
        setProgress(50);
        setLoadingMessage("Server ready, signing in...");
        console.log('✅ Server already warm');
      }

      setProgress(70);
      setLoadingMessage("Authenticating...");
      console.log('🚀 Attempting login with phone:', fullPhone);

      // Call backend -> POST /api/auth/login
      const res = await api.post<{ token?: string; message?: string; user?: any }>(
        "/auth/login",
        { phone: fullPhone, password: passwordT }
      );

      setProgress(85);

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
      
      setProgress(100);
      console.log('✅ Login successful, redirecting to home');
      router.replace("/(tabs)/home");
      
      // FORCE re-register push token after successful login (non-blocking)
      // This runs AFTER navigation to avoid blocking the UI
      console.log('🔔 Force registering push notification token after login...');
      
      // Send a ping to backend to confirm we're trying to register
      setTimeout(async () => {
        try {
          // Log to backend that we're attempting registration
          await api.post('/notifications/ping-registration-attempt', {
            phone: fullPhone,
            timestamp: new Date().toISOString(),
            hasModule: !!notificationModule,
            hasFunction: !!notificationModule?.registerForPushNotifications
          }).catch(e => console.log('Ping failed but continuing:', e));
          
          if (notificationModule?.registerForPushNotifications) {
            await notificationModule.registerForPushNotifications();
            console.log('✅ Push token force-registered successfully after login');
          } else {
            console.log('⚠️ No notification module or function available');
          }
        } catch (error: any) {
          console.error('⚠️ Push token registration failed after login:', error);
          // Send error to backend for debugging
          await api.post('/notifications/registration-error', {
            phone: fullPhone,
            error: error?.message || 'Unknown error',
            stack: error?.stack || 'No stack'
          }).catch(e => console.log('Error reporting failed:', e));
        }
      }, 2000); // Wait 2 seconds after login to ensure everything is ready
    } catch (e: any) {
      console.error('❌ Login error:', e);
      
      let title = "Login Failed";
      let msg = "Unable to sign in. Please try again.";
      
      // Handle different types of errors with specific messages
      if (e?.message?.includes('Server is starting up')) {
        title = "Server Waking Up";
        msg = "The server is starting (Render free tier sleeps after inactivity).\n\n" +
              "⏱️ This takes 60-90 seconds.\n\n" +
              "Please wait a moment and try signing in again.";
      } else if (e?.message?.includes('timeout') || e?.message?.includes('Connection timeout')) {
        title = "Connection Timeout";
        msg = "The connection timed out.\n\n" +
              "The server might be sleeping (Render free tier).\n\n" +
              "Please wait 30 seconds and try again.";
      } else if (e?.message?.includes('Network') || e?.message?.includes('network')) {
        title = "Network Error";
        msg = "Cannot connect to the internet.\n\n" +
              "Please check your connection and try again.";
      } else if (e?.status === 401 || e?.data?.message?.includes('Invalid')) {
        title = "Invalid Credentials";
        msg = e?.data?.message || "Phone number or password is incorrect.\n\nPlease check and try again.";
      } else if (e?.status === 404) {
        title = "Account Not Found";
        msg = "No account found with this phone number.\n\nPlease sign up first.";
      } else if (e?.status >= 500) {
        title = "Server Error";
        msg = "The server encountered an error.\n\nPlease try again in a moment.";
      } else if (e?.data?.message) {
        msg = e.data.message;
      } else if (e?.message) {
        msg = e.message;
      }
      
      Alert.alert(title, msg);
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
