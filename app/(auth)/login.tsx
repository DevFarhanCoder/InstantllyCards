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
  ScrollView,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Constants from 'expo-constants';
import { SafeAreaView } from "react-native-safe-area-context";



// Import notification registration
// ALWAYS import the module - let the module itself handle Expo Go detection
const notificationModule = require("../../lib/notifications-production-v2");

const registerPendingPushToken = notificationModule?.registerPendingPushToken || (async () => {});
import api from "../../lib/api";
import serverWarmup from "../../lib/serverWarmup";
import PhoneInput from "../../components/PhoneInput";
import PasswordField from "../../components/PasswordField";
import { PrimaryButton } from "../../components/PrimaryButton";

const { height: screenHeight } = Dimensions.get('window');

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
      setLoadingMessage("Connecting...");

      // Pre-warm server if not already warm
      if (!serverWarmup.isServerWarm()) {
        setLoadingMessage("Waking up server...");
        setProgress(30);
        await serverWarmup.warmupServer();
      }

      setProgress(50);
      setLoadingMessage("Authenticating...");
      console.log('🚀 Attempting login with:', { phone: fullPhone });

      const res = await api.post("/auth/login", {
        phone: fullPhone,
        password: passwordT
      });

      setProgress(80);
      setLoadingMessage("Setting up session...");

      console.log('✅ Login response received:', res);

      let token = res?.token;
      if (!token) {
        throw new Error("Invalid login credentials. Please try again.");
      }

      await AsyncStorage.setItem("token", token);
      if (res?.user?.name) {
        await AsyncStorage.setItem("user_name", res.user.name);
      }
      if (res?.user?.phone) {
        await AsyncStorage.setItem("user_phone", res.user.phone);
      }
      
      setProgress(100);
      console.log('✅ Login successful, now registering push token BEFORE navigation');
      
      // CRITICAL: Register push token BEFORE navigation
      // This ensures it runs even if user navigates away
      try {
        console.log('🔔 [LOGIN] Starting push token registration...');
        
        // Send diagnostic ping
        await api.post('/notifications/ping-registration-attempt', {
          phone: fullPhone,
          timestamp: new Date().toISOString(),
          hasModule: !!notificationModule,
          hasFunction: !!notificationModule?.registerForPushNotifications
        }).catch(e => console.log('[LOGIN] Ping failed but continuing:', e));
        
        if (notificationModule?.registerForPushNotifications) {
          console.log('[LOGIN] Calling registerForPushNotifications...');
          await notificationModule.registerForPushNotifications();
          console.log('✅ [LOGIN] Push token registered successfully!');
        } else {
          console.error('❌ [LOGIN] No notification module or function available');
          console.error('[LOGIN] notificationModule:', notificationModule);
          console.error('[LOGIN] registerForPushNotifications:', notificationModule?.registerForPushNotifications);
        }
      } catch (error: any) {
        console.error('❌ [LOGIN] Push token registration failed:', error);
        console.error('[LOGIN] Error message:', error?.message);
        console.error('[LOGIN] Error stack:', error?.stack);
        
        // Send error to backend for debugging
        await api.post('/notifications/registration-error', {
          phone: fullPhone,
          error: error?.message || 'Unknown error',
          stack: error?.stack || 'No stack',
          timestamp: new Date().toISOString()
        }).catch(e => console.error('[LOGIN] Error reporting failed:', e));
      }

      console.log('🔀 [LOGIN] Redirecting to home...');
      router.replace("/(tabs)/home");
    } catch (e: any) {
      console.error('❌ Login error:', e);
      
      let title = "Login Failed";
      let msg = "Please check your credentials and try again.";
      
      if (e?.message?.includes('timeout')) {
        msg = "Server is taking longer than usual. Please wait a moment and try again.";
      } else if (e?.message?.includes('Server may be sleeping')) {
        msg = "Server is starting up. Please wait 30 seconds and try again.";
      } else if (e?.message?.includes('Network')) {
        msg = "Network error. Please check your internet connection.";
      } else if (e?.message?.includes('Invalid credentials') || e?.message?.includes('not found')) {
        msg = "Invalid phone number or password. Please check your credentials.";
      } else if (e?.status === 401) {
        msg = "Invalid phone number or password. Please check your credentials.";
      } else if (e?.status === 500) {
        title = "Server Error";
        msg = "The server encountered an error.\\n\\nPlease try again in a moment.";
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/images/Instantlly_Logo-removebg.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>Sign in to your account</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <PhoneInput
                label="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                countryCode={countryCode}
                onCountryCodeChange={setCountryCode}
                placeholder="80012 34567"
              />
            </View>

            <View style={styles.inputGroup}>
              <PasswordField
                label="Password"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.buttonContainer}>
              <PrimaryButton
                title={loading ? `${loadingMessage}${progress > 0 ? ` (${progress}%)` : ''}` : "Sign In"}
                onPress={doLogin}
                disabled={loading}
                variant="brand"
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Pressable onPress={() => router.push("/signup")}>
                <Text style={styles.footerText}>
                  Don't have an account?{" "}
                  <Text style={styles.footerLink}>Create Account</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Modern light background
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 200,  // Increased from 160
    height: 80,  // Increased from 54
  },
  welcomeSection: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    color: '#F97316',
    fontWeight: '600',
  },
});