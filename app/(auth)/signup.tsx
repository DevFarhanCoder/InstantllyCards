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

import api from "@/lib/api";
import Field from "@/components/Field";
import PasswordField from "@/components/PasswordField";
import CountryCodePicker from "@/components/CountryCodePicker";
import { PrimaryButton } from "@/components/PrimaryButton";
import { COLORS } from "@/lib/theme";

export default function Signup() {
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // Default to India
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Creating...");

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
      setLoadingMessage("Connecting to server...");

      console.log('🚀 Attempting signup with:', { name: nameT, phone: fullPhone });

      const res = await api.post("/auth/signup", {
        name: nameT,
        phone: fullPhone,
        password: passwordT
      });

      console.log('✅ Signup response received:', res);

      let token = res?.token;
      
      if (!token) {
        try {
          console.log('No token in signup response, attempting login...');
          setLoadingMessage("Signing in...");
          const loginRes = await api.post("/auth/login", { phone: fullPhone, password: passwordT });
          token = loginRes?.token;
        } catch {}
      }

      if (!token) {
        throw new Error(res?.message || "Signup failed. Please try again.");
      }

      await AsyncStorage.setItem("token", token);
      if (res?.user?.name) {
        await AsyncStorage.setItem("user_name", res.user.name);
      }
      if (res?.user?.phone) {
        await AsyncStorage.setItem("user_phone", res.user.phone);
      }
      
      console.log('Signup successful, redirecting to home');
      router.replace("/(tabs)/home");
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
            title={loading ? loadingMessage : "Sign up"}
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
