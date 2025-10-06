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
import { COLORS } from "@/lib/theme";

// Import notification registration
const isExpoGo = Constants.appOwnership === 'expo';
const notificationModule = isExpoGo 
  ? null
  : require("@/lib/notifications-production-v2");

const registerPendingPushToken = notificationModule?.registerPendingPushToken || (async () => {});

export default function Signup() {
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // Default to India
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Creating...");
  const [progress, setProgress] = useState(0);

  const doSignup = async () => {
    try {
      const nameT = name.trim();
      const phoneT = phoneNumber.trim();
      const passwordT = password.trim();
      
      if (!nameT || !phoneT || !passwordT) {
        Alert.alert("Signup failed", "Name, phone number and password are required");
        return;
      }

      // Remove any non-digit characters from the phone number and combine with country code
      const cleanPhone = phoneT.replace(/\D/g, "");
      const fullPhone = `${countryCode}${cleanPhone}`;

      if (cleanPhone.length < 7) {
        Alert.alert("Signup failed", "Please enter a valid phone number");
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
      setLoadingMessage("Creating account...");
      console.log('🚀 Attempting signup with:', { name: nameT, phone: fullPhone });

      const res = await api.post("/auth/signup", {
        name: nameT,
        phone: fullPhone,
        password: passwordT
      });

      setProgress(80);

      console.log('✅ Signup response received:', res);

      let token = res?.token;
      
      if (!token) {
        try {
          console.log('No token in signup response, attempting login...');
          setProgress(85);
          setLoadingMessage("Signing in...");
          const loginRes = await api.post("/auth/login", { phone: fullPhone, password: passwordT });
          token = loginRes?.token;
        } catch {}
      }

      if (!token) {
        throw new Error(res?.message || "Signup failed. Please try again.");
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
      console.log('Signup successful, redirecting to home');
      router.replace("/(tabs)/home");
      
      // FORCE re-register push token after successful signup (non-blocking)
      // This runs AFTER navigation to avoid blocking the UI
      console.log('🔔 Force registering push notification token after signup...');
      setTimeout(() => {
        if (notificationModule?.registerForPushNotifications) {
          notificationModule.registerForPushNotifications()
            .then(() => {
              console.log('✅ Push token force-registered successfully after signup');
            })
            .catch((error: any) => {
              console.error('⚠️ Push token registration failed after signup:', error);
              // Don't block user experience - just log the error
            });
        }
      }, 2000); // Wait 2 seconds after signup to ensure everything is ready
    } catch (e: any) {
      console.error('❌ Signup error:', e);
      
      let msg = "Signup failed. Please try again.";
      
      if (e?.message?.includes('timeout')) {
        msg = "Server is taking longer than usual. Please wait a moment and try again.";
      } else if (e?.message?.includes('Server may be sleeping')) {
        msg = "Server is starting up. Please wait 30 seconds and try again.";
      } else if (e?.message?.includes('Network')) {
        msg = "Network error. Please check your internet connection.";
      } else if (e?.message?.includes('Phone number already exists') || e?.message?.includes('already exists')) {
        msg = "An account with this phone number already exists. Please try logging in instead.";
      } else if (e?.message?.includes('Server configuration error')) {
        msg = "Server configuration issue. Please contact support.";
      } else if (e?.message?.includes('Database connection')) {
        msg = "Database connection issue. Please try again in a moment.";
      } else if (e?.status === 503) {
        msg = "Service temporarily unavailable. Please try again in a few moments.";
      } else if (e?.status === 404) {
        msg = "Server connection issue. Please check if you're connected to the internet.";
      } else if (e?.data?.message) {
        msg = e.data.message;
      } else if (e?.message) {
        msg = e.message;
      }
      
      Alert.alert("Signup Failed", msg);
    } finally {
      setLoading(false);
      setLoadingMessage("Creating...");
      setProgress(0);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.topLogo}>
        <Image
          source={require("../../assets/logo.png")}
          style={{ width: 240, height: 80 }}
          resizeMode="contain"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Instantly Cards in seconds.</Text>

        <View style={{ gap: 16, marginTop: 20 }}>
          <Field label="Full name" value={name} onChangeText={setName} />
          
          <View>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.phoneContainer}>
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
                style={styles.phoneInput}
              />
            </View>
          </View>
          
          <PasswordField
            label="Password"
            value={password}
            onChangeText={setPassword}
          />

          <PrimaryButton
            title={loading ? `${loadingMessage}${progress > 0 ? ` (${progress}%)` : ''}` : "Sign up"}
            onPress={doSignup}
            disabled={loading}
          />

          <View style={{ alignItems: "center", marginTop: 10 }}>
            <Pressable onPress={() => router.push("/(auth)/login")}>
              <Text style={{ color: COLORS.muted, fontSize: 14 }}>
                Already have an account?{" "}
                <Text style={{ fontWeight: "700", color: COLORS.text }}>
                  Log in
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
