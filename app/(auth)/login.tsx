// app/(auth)/login.tsx
import React, { useState, useEffect } from "react";
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
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Constants from 'expo-constants';
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";



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
  const queryClient = useQueryClient();
  const [countryCode, setCountryCode] = useState("+91"); // Default to India
  const [phoneNumber, setPhoneNumber] = useState("");
  const [forgotPhoneError, setForgotPhoneError] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Signing in...");
  const [progress, setProgress] = useState(0);
  const [passwordError, setPasswordError] = useState("");

  // Toast notification state (same UX as signup)
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useState(new Animated.Value(0))[0];

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  // On mount, check if there's a prefill phone (e.g., after password reset)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Check if password was just reset
        const justReset = await AsyncStorage.getItem('password_just_reset');
        if (justReset === 'true') {
          console.log('🔄 [LOGIN] Password just reset - clearing all cached state');
          // Clear the flag
          await AsyncStorage.removeItem('password_just_reset');
          // Reset all login state
          setPassword('');
          setPasswordError('');
          setForgotPhoneError('');
          // Clear query cache to prevent stale API responses
          queryClient.clear();
        }
        
        const stored = await AsyncStorage.getItem('login_prefill_phone');
        if (!mounted || !stored) return;
        
        console.log('[LOGIN-PREFILL] Stored phone:', stored);
        
        // Parse stored phone into country code and local 10-digit number
        const raw = stored.toString().trim();
        const digits = raw.replace(/\D/g, '');
        
        console.log('[LOGIN-PREFILL] All digits:', digits);
        console.log('[LOGIN-PREFILL] Digits length:', digits.length);
        
        if (raw.startsWith('+')) {
          // Extract last 10 digits as local number, rest is country code
          const local = digits.slice(-10);
          const countryDigits = digits.slice(0, -10);
          const cc = countryDigits ? `+${countryDigits}` : '+91';
          
          console.log('[LOGIN-PREFILL] Extracted country code:', cc);
          console.log('[LOGIN-PREFILL] Extracted local number:', local);
          console.log('[LOGIN-PREFILL] Local length:', local.length);
          
          setCountryCode(cc);
          setPhoneNumber(local);
        } else {
          // No + prefix, assume India local number
          const digits = raw.replace(/\D/g, '');
          const local = digits.slice(-10);
          console.log('[LOGIN-PREFILL] No + prefix, using local:', local);
          setCountryCode('+91');
          setPhoneNumber(local);
        }
        // remove the prefill after using it
        try { await AsyncStorage.removeItem('login_prefill_phone'); } catch {}
      } catch (e) {
        console.warn('Failed to read login_prefill_phone', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

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

      console.log('[LOGIN-SUBMIT] Country code:', countryCode);
      console.log('[LOGIN-SUBMIT] Phone number field:', phoneT);
      console.log('[LOGIN-SUBMIT] Clean phone:', cleanPhone);
      console.log('[LOGIN-SUBMIT] Full phone:', fullPhone);
      console.log('[LOGIN-SUBMIT] Full phone length:', fullPhone.length);

      // Require exactly 10 digits (local format) like signup
      if (cleanPhone.length !== 10) {
        showToast("Please enter a valid 10-digit phone number", "error");
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

      // CRITICAL: Clear all React Query cache to prevent data leakage from previous account
      console.log('🧹 Clearing React Query cache before login...');
      queryClient.clear();

      await AsyncStorage.setItem("token", token);
      if (res?.user?.name) {
        await AsyncStorage.setItem("user_name", res.user.name);
      }
      if (res?.user?.phone) {
        await AsyncStorage.setItem("user_phone", res.user.phone);
      }
      // Store user ID for filtering own cards from home feed
      if (res?.user?.id || res?.user?._id) {
        await AsyncStorage.setItem("currentUserId", (res.user.id || res.user._id).toString());
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
      } else if (e?.status === 500) {
        title = "Server Error";
        msg = "The server encountered an error.\\n\\nPlease try again in a moment.";
      } else if (e?.data?.message) {
        msg = e.data.message;
      } else if (e?.message) {
        msg = e.message;
      }

      // Show inline error for authentication failures (401 or common invalid-credentials message)
      const authMsg = (msg || '').toLowerCase();
      const errMsg = (e?.message || '').toLowerCase();
      const looksLikeAuthFailure =
        e?.status === 401 ||
        authMsg.includes('invalid phone') ||
        authMsg.includes('invalid credentials') ||
        authMsg.includes('authentication') ||
        errMsg.includes('authentication') ||
        errMsg.includes('invalid credentials');
      if (looksLikeAuthFailure) {
        setPasswordError('Incorrect password');
        return;
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
                onChangeText={(text: string) => {
                  const raw = text.replace(/\D/g, '');
                  // clear any forgot-password inline error when user types
                  if (forgotPhoneError) setForgotPhoneError('');
                  if (raw.length > 10) {
                    showToast('Only 10 digits allowed', 'error');
                    setPhoneNumber(raw.slice(0, 10));
                  } else {
                    setPhoneNumber(raw);
                  }
                }}
                countryCode={countryCode}
                onCountryCodeChange={setCountryCode}
                placeholder="8001234567"
              />
              {forgotPhoneError ? <Text style={styles.inlineError}>{forgotPhoneError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <PasswordField
                label="Password"
                value={password}
                onChangeText={(t: string) => {
                  if (passwordError) setPasswordError('');
                  setPassword(t);
                }}
              />
              {passwordError ? <Text style={styles.inlineError}>{passwordError}</Text> : null}
            </View>

            <View style={styles.buttonContainer}>
              <PrimaryButton
                title={loading ? `${loadingMessage}${progress > 0 ? ` (${progress}%)` : ''}` : "Sign In"}
                onPress={doLogin}
                disabled={loading}
                variant="brand"
              />
            </View>

            {/* Forget Password link (navigates to signup for phone->OTP->new password flow) */}
            <View style={styles.forgotContainer}>
              <Pressable onPress={async () => {
                const raw = (phoneNumber || '').replace(/\D/g, '');
                if (!raw) {
                  // show inline error below phone field
                  setForgotPhoneError('Please enter your registered phone no.');
                  return;
                }
                const fullPhone = `${countryCode}${raw}`;
                try {
                  if (raw && raw.length === 10) {
                    await AsyncStorage.setItem('reset_phone', fullPhone);
                  } else {
                    await AsyncStorage.removeItem('reset_phone');
                  }
                } catch (e) {
                  console.warn('Failed to persist reset phone', e);
                }
                router.push('/(auth)/reset-password');
              }}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
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
      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            { opacity: toastOpacity },
            toastType === 'success' ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Text style={styles.toastText}>
            {toastType === 'success' ? '✓ ' : '✗ '}
            {toastMessage}
          </Text>
        </Animated.View>
      )}
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
    paddingHorizontal: 20, // Reduced padding for better mobile fit
    paddingBottom: 32,
    minHeight: screenHeight * 0.9, // Ensure proper height on all devices
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
    padding: 20, // Reduced padding for mobile
    marginBottom: 24,
    marginHorizontal: 4, // Add small margin for better mobile display
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
    width: '100%', // Ensure full width
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  forgotContainer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 0,
  },
  forgotText: {
    color: '#F97316',
    fontWeight: '600',
    fontSize: 14,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    color: '#F97316',
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  inlineError: {
    color: '#EF4444',
    marginTop: 8,
    fontSize: 13,
    textAlign: 'left',
  },
});