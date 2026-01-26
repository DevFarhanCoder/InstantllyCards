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
  ActivityIndicator,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Contacts from "expo-contacts";

// Fast2SMS imports for Phone Authentication

// import * as SmsRetriever from "expo-sms-retriever";
import serverWarmup from "../../lib/serverWarmup";
// Fast2SMS imports for Phone Authentication - COMMENTED OUT (OTP disabled)
// import serverWarmup from "../../lib/serverWarmup";
import api from "../../lib/api";
// import { sendOTPViaFast2SMS, verifyOTPViaBackend } from "../../lib/fast2sms";
import PhoneInput from "../../components/PhoneInput";
import Field from "../../components/Field";
import PasswordField from "../../components/PasswordField";

const { height: screenHeight } = Dimensions.get("window");

// OTP Flow States - COMMENTED OUT (OTP disabled)
// type SignupStep = 'phone' | 'otp' | 'details';

export default function Signup() {
  // Step management - OTP disabled, start directly with details
  // const [step, setStep] = useState<SignupStep>('phone');

  // Form fields
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // Default to India
  const [phoneNumber, setPhoneNumber] = useState("");
  // const [otp, setOtp] = useState(""); // OTP disabled
  const [password, setPassword] = useState("");
  const [manualReferralCode, setManualReferralCode] = useState(""); // Manual referral code input

  // SMS Retriever Hook for automatic OTP detection - COMMENTED OUT (OTP disabled)
  // const { otp: autoOtp, appHash, isListening } = useSmsRetriever({
  //   autoStart: true,
  //   otpLength: 6
  // });

  // Store the verified phone number with country code - COMMENTED OUT (OTP disabled)
  // const [verifiedPhone, setVerifiedPhone] = useState("");

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Creating...");
  const [progress, setProgress] = useState(0);
  // const [sendingOtp, setSendingOtp] = useState(false); // OTP disabled
  // const [verifyingOtp, setVerifyingOtp] = useState(false); // OTP disabled

  // OTP timer - COMMENTED OUT (OTP disabled)
  // const [otpTimer, setOtpTimer] = useState(0);
  // const [canResend, setCanResend] = useState(false);

  // Toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const toastOpacity = useState(new Animated.Value(0))[0];

  // Show toast notification
  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2700),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  // Timer countdown - COMMENTED OUT (OTP disabled)
  // useEffect(() => {
  //   if (otpTimer > 0) {
  //     const interval = setInterval(() => {
  //       setOtpTimer(prev => {
  //         if (prev <= 1) {
  //           setCanResend(true);
  //           return 0;
  //         }
  //         return prev - 1;
  //       });
  //     }, 1000);
  //     return () => clearInterval(interval);
  //   }
  // }, [otpTimer]);

  // Auto-fill OTP when detected by SMS Retriever - COMMENTED OUT (OTP disabled)
  // useEffect(() => {
  //   if (autoOtp && step === 'otp') {
  //     console.log('✅ [Auto-Fill] OTP detected:', autoOtp);
  //     setOtp(autoOtp);
  //     showToast("OTP auto-filled!", "success");
  //   }
  // }, [autoOtp, step]);

  // OTP Functions - COMMENTED OUT (OTP disabled)
  /* 
  const sendOtp = async () => {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    try {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📤 [SIGNUP-SEND-OTP] REQUEST START - ID: ${requestId}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
      
      const phoneT = phoneNumber.trim();
      if (!phoneT) {
        console.log(`❌ [SIGNUP-SEND-OTP] ERROR: Empty phone number - ID: ${requestId}`);
        showToast("Please enter your phone number", "error");
        return;
      }

      const cleanPhone = phoneT.replace(/\D/g, "");
      const fullPhone = `${countryCode}${cleanPhone}`;

      console.log(`📱 Phone entered: ${phoneT}`);
      console.log(`📱 Full phone: ${fullPhone}`);

      // Require exactly 10 digits for local phone number (India)
      if (cleanPhone.length !== 10) {
        console.log(`❌ [SIGNUP-SEND-OTP] ERROR: Invalid phone length (${cleanPhone.length}) - ID: ${requestId}`);
        showToast("Please enter a valid 10-digit phone number", "error");
        return;
      }

      setSendingOtp(true);
      console.log(`⏳ [SIGNUP-SEND-OTP] Pre-warming server...`);

      // Pre-warm server if not already warm
      if (!serverWarmup.isServerWarm()) {
        await serverWarmup.warmupServer();
      }

      // First, check if phone number already exists
      console.log(`🔍 [SIGNUP-SEND-OTP] Checking if phone exists: ${fullPhone}`);
      // const appHash = await SmsRetriever.getHash()
      // console.log("App Hash:", appHash);
      const checkRes = await api.post("/auth/check-phone", {
        phone: fullPhone,
        // appHash: appHash
      });
      
      console.log(`✅ [SIGNUP-SEND-OTP] Check phone response - EXISTS: ${checkRes.exists}`);

      if (checkRes.exists) {
        console.log(`❌ [SIGNUP-SEND-OTP] ERROR: Phone already registered - ID: ${requestId}`);
        showToast("This number is already registered. Please login.", "error");
        setSendingOtp(false);
        // Navigate to login after 2 seconds
        setTimeout(() => {
          router.push("/(auth)/login");
        }, 2000);
        return;
      }

      console.log(`✓ [SIGNUP-SEND-OTP] Phone is available for signup`);
      console.log(`⏳ [SIGNUP-SEND-OTP] Storing verified phone...`);
      
      // Store the verified phone for later use
      setVerifiedPhone(fullPhone);
      
      console.log(`⏳ [SIGNUP-SEND-OTP] Calling sendOTPViaFast2SMS()...`);
      console.log(`   This will trigger Fast2SMS SMS sending`);
      
      // Send OTP using Fast2SMS
      const result = await sendOTPViaFast2SMS(fullPhone);
      
      const duration = Date.now() - startTime;
      if (result.success) {
        console.log(`✅ [SIGNUP-SEND-OTP] SUCCESS - Fast2SMS accepted request - ID: ${requestId}`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Session ID: ${result.sessionId}`);
        console.log(`   Next: Wait for SMS on ${fullPhone}`);
        console.log(`${'='.repeat(70)}\n`);
        
        showToast("OTP sent to your phone number", "success");
        setStep('otp');
        setOtpTimer(60); // 60 second cooldown
        setCanResend(false);
      } else {
        throw new Error("Failed to send OTP");
      }
    } catch (e: any) {
      const duration = Date.now() - startTime;
      console.error(`\n❌ [SIGNUP-SEND-OTP] EXCEPTION ERROR - ID: ${requestId}`);
      console.error(`📋 Error Code: ${e?.code}`);
      console.error(`📝 Error Message: ${e?.message}`);
      console.error(`⏱️  Duration: ${duration}ms`);
      console.error(`${'='.repeat(70)}\n`);
      
      let errorMessage = "Failed to send OTP. Please try again.";
      
      if (e?.message?.includes('10 digits')) {
        errorMessage = "Please enter a valid 10-digit Indian phone number.";
        console.error('   ⚠️  Phone format issue. Should be 10 digits for India');
      } else if (e?.message?.includes('rate limit')) {
        errorMessage = "Too many requests. Please try again later.";
        console.error('   ⚠️  Rate limited by Fast2SMS');
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      showToast(errorMessage, "error");
    } finally {
      setSendingOtp(false);
    }
  };
  */

  // const resendOtp = async () => {
  //   if (!canResend) return;
  //   await sendOtp();
  // };

  /* 
  const verifyOtp = async () => {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    try {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🔐 [SIGNUP-VERIFY-OTP] REQUEST START - ID: ${requestId}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
      
      const otpT = otp.trim();
      if (!otpT || otpT.length !== 6) {
        console.log(`❌ [SIGNUP-VERIFY-OTP] ERROR: Invalid OTP length (${otpT.length}) - ID: ${requestId}`);
        Alert.alert("Error", "Please enter the 6-digit OTP");
        return;
      }

      console.log(`🔑 OTP Entered: ***${otpT.slice(-2)}`);

      if (!verifiedPhone) {
        console.log(`❌ [SIGNUP-VERIFY-OTP] ERROR: No verified phone - ID: ${requestId}`);
        Alert.alert("Error", "No phone number found. Please resend OTP.");
        return;
      }

      console.log(`📋 Phone to verify: ${verifiedPhone}`);

      setVerifyingOtp(true);
      console.log(`⏳ [SIGNUP-VERIFY-OTP] Calling verifyOTPViaBackend()...`);
      
      // Verify OTP using backend API
      const result = await verifyOTPViaBackend(verifiedPhone, otpT);

      const duration = Date.now() - startTime;
      if (result.success) {
        console.log(`✅ [SIGNUP-VERIFY-OTP] SUCCESS - Phone verified - ID: ${requestId}`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   User Phone: ${result.phone}`);
        console.log(`   Next Step: Account details (name & password)`);
        console.log(`${'='.repeat(70)}\n`);
        
        showToast("Phone number verified!", "success");
        setStep('details');
      } else {
        throw new Error("Failed to verify OTP");
      }
    } catch (e: any) {
      const duration = Date.now() - startTime;
      console.error(`\n❌ [SIGNUP-VERIFY-OTP] EXCEPTION ERROR - ID: ${requestId}`);
      console.error(`📋 Error Code: ${e?.code}`);
      console.error(`📝 Error Message: ${e?.message}`);
      console.error(`⏱️  Duration: ${duration}ms`);
      console.error(`${'='.repeat(70)}\n`);
      
      let errorMessage = "Invalid or expired OTP. Please try again.";
      
      if (e?.message?.includes('Invalid') || e?.message?.includes('incorrect')) {
        errorMessage = "Invalid OTP. Please check the code and try again.";
        console.error('   ⚠️  Wrong OTP code entered');
      } else if (e?.message?.includes('expired')) {
        errorMessage = "OTP has expired. Please request a new code.";
        console.error('   ⚠️  OTP expired - took too long to enter');
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      showToast(errorMessage, "error");
    } finally {
      setVerifyingOtp(false);
    }
  };
  */

  const doSignup = async () => {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    try {
      console.log(`\n${"=".repeat(70)}`);
      console.log(`📝 [SIGNUP-CREATE] REQUEST START - ID: ${requestId}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

      const nameT = name.trim();
      const passwordT = password.trim();

      if (!nameT || !passwordT) {
        console.log(
          `❌ [SIGNUP-CREATE] ERROR: Missing name or password - ID: ${requestId}`,
        );
        Alert.alert("Signup failed", "Name and password are required");
        return;
      }

      console.log(`👤 Name: ${nameT}`);
      console.log(`🔐 Password: ***${passwordT.slice(-2)}`);

      // Use the phone number directly (OTP verification disabled)
      const phoneT = phoneNumber.trim();
      if (!phoneT) {
        console.log(
          `❌ [SIGNUP-CREATE] ERROR: No phone number - ID: ${requestId}`,
        );
        Alert.alert("Error", "Please enter your phone number.");
        return;
      }

      // Format phone number with country code
      const cleanPhone = phoneT.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        console.log(
          `❌ [SIGNUP-CREATE] ERROR: Invalid phone length - ID: ${requestId}`,
        );
        Alert.alert("Error", "Please enter a valid 10-digit phone number.");
        return;
      }
      const fullPhone = `${countryCode}${cleanPhone}`;

      console.log(`📱 Phone: ${fullPhone}`);

      // Check for pending referral code or use manually entered one
      let referralCode =
        manualReferralCode.trim().toUpperCase() ||
        (await AsyncStorage.getItem("pending_referral_code"));
      if (referralCode) {
        console.log(`🎁 Referral code found: ${referralCode}`);
      }

      setLoading(true);
      setProgress(10);
      setLoadingMessage("Preparing...");

      // Server warmup removed (OTP disabled)
      setProgress(30);

      setProgress(50);
      setLoadingMessage("Creating account...");
      console.log(
        `⏳ [SIGNUP-CREATE] Calling backend /auth/signup endpoint...`,
      );
      console.log(
        `   Payload: { name, phone, password${referralCode ? ", referralCode" : ""} }`,
      );

      const res = await api.post("/auth/signup", {
        name: nameT,
        phone: fullPhone,
        password: passwordT,
        ...(referralCode && { referralCode }),
      });

      // Clear referral code after successful signup
      if (referralCode) {
        await AsyncStorage.removeItem("pending_referral_code");
        console.log(`🗑️ Cleared referral code from storage`);
      }

      setProgress(80);

      const duration = Date.now() - startTime;
      console.log(
        `✅ [SIGNUP-CREATE] Backend response received - ID: ${requestId}`,
      );
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Response: ${JSON.stringify(res, null, 2)}`);

      let token = res?.token;

      if (!token) {
        console.log(
          `⚠️  [SIGNUP-CREATE] No token in signup response, attempting login...`,
        );
        try {
          console.log(
            `⏳ [SIGNUP-CREATE] Calling backend /auth/login endpoint...`,
          );
          setProgress(85);
          setLoadingMessage("Signing in...");
          const loginRes = await api.post("/auth/login", {
            phone: fullPhone,
            password: passwordT,
          });
          token = loginRes?.token;
          console.log(`✅ [SIGNUP-CREATE] Login response received`);
        } catch (loginError: any) {
          console.error(
            `❌ [SIGNUP-CREATE] Login attempt failed:`,
            loginError?.message,
          );
        }
      }

      if (!token) {
        console.log(
          `❌ [SIGNUP-CREATE] ERROR: No token received - ID: ${requestId}`,
        );
        throw new Error(res?.message || "Signup failed. Please try again.");
      }

      console.log(`✅ [SIGNUP-CREATE] Token acquired successfully`);

      setProgress(95);
      setLoadingMessage("Finalizing...");

      console.log(`💾 [SIGNUP-CREATE] Saving token to storage...`);
      await AsyncStorage.setItem("token", token);
      if (res?.user?.name) {
        await AsyncStorage.setItem("user_name", res.user.name);
      }
      if (res?.user?.phone) {
        await AsyncStorage.setItem("user_phone", res.user.phone);
      }
      // Store user ID for filtering own cards from home feed
      if (res?.user?.id || res?.user?._id) {
        await AsyncStorage.setItem(
          "currentUserId",
          (res.user.id || res.user._id).toString(),
        );
      }

      console.log(`✅ [SIGNUP-CREATE] Token and user data saved`);

      setProgress(100);
      console.log(`✅ [SIGNUP-CREATE] Signup successful!`);
      console.log(`   Total Duration: ${Date.now() - startTime}ms`);
      console.log(`   User Phone: ${fullPhone}`);
      console.log(`${"=".repeat(70)}\n`);

      // SYNC CONTACTS AUTOMATICALLY AFTER SIGNUP
      try {
        console.log(`\n📱 [CONTACT-SYNC] AUTO-SYNC START`);
        console.log(`${"=".repeat(70)}`);

        // Request contacts permission
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === "granted") {
          console.log(`✅ [CONTACT-SYNC] Contacts permission granted`);

          // Get device contacts
          console.log(`📱 [CONTACT-SYNC] Reading device contacts...`);
          const { data: deviceContacts } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
          });

          // Extract phone numbers
          const phoneNumbers = deviceContacts
            .filter(
              (contact: any) =>
                contact.phoneNumbers && contact.phoneNumbers.length > 0,
            )
            .map((contact: any) => ({
              name: contact.name || "Unknown Contact",
              phoneNumber:
                contact.phoneNumbers[0]?.number?.replace(/\D/g, "") || "",
            }))
            .filter(
              (contact: any) =>
                contact.phoneNumber && contact.phoneNumber.length >= 10,
            );

          console.log(
            `📊 [CONTACT-SYNC] Found ${phoneNumbers.length} valid contacts`,
          );

          if (phoneNumbers.length > 0) {
            // Send contacts in batches
            const BATCH_SIZE = 200;
            const totalBatches = Math.ceil(phoneNumbers.length / BATCH_SIZE);

            console.log(
              `📤 [CONTACT-SYNC] Syncing in ${totalBatches} batch(es)...`,
            );

            for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
              const batch = phoneNumbers.slice(i, i + BATCH_SIZE);
              const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

              console.log(
                `📤 [CONTACT-SYNC] Batch ${batchNumber}/${totalBatches} (${batch.length} contacts)`,
              );

              try {
                await api.post("/contacts/sync-all", { contacts: batch });
                console.log(
                  `✅ [CONTACT-SYNC] Batch ${batchNumber}/${totalBatches} synced`,
                );
              } catch (batchError) {
                console.error(
                  `❌ [CONTACT-SYNC] Batch ${batchNumber} failed:`,
                  batchError,
                );
              }

              // Small delay between batches
              if (i + BATCH_SIZE < phoneNumbers.length) {
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            }

            // Save sync timestamp
            await AsyncStorage.setItem(
              "contactsSyncTimestamp",
              Date.now().toString(),
            );
            await AsyncStorage.setItem("contactsSynced", "true");

            console.log(
              `✅ [CONTACT-SYNC] AUTO-SYNC COMPLETE - ${phoneNumbers.length} contacts synced`,
            );
          } else {
            console.log(`⚠️ [CONTACT-SYNC] No valid contacts found to sync`);
          }
        } else {
          console.log(
            `⚠️ [CONTACT-SYNC] Contacts permission denied - user can sync later from Chats tab`,
          );
        }

        console.log(`${"=".repeat(70)}\n`);
      } catch (syncError: any) {
        console.error(
          `❌ [CONTACT-SYNC] AUTO-SYNC FAILED:`,
          syncError?.message,
        );
        console.log(
          `⚠️ [CONTACT-SYNC] User can manually sync contacts from Chats tab`,
        );
        // Don't block signup if contact sync fails
      }

      console.log(
        `🔀 [SIGNUP] Navigation: Redirecting to service selection...`,
      );
      console.log(`${"=".repeat(70)}\n`);
      router.replace("/(auth)/service-selection");
    } catch (e: any) {
      const duration = Date.now() - startTime;
      console.error(`\n❌ [SIGNUP-CREATE] EXCEPTION ERROR - ID: ${requestId}`);
      console.error(`📋 Error Code: ${e?.code}`);
      console.error(`📝 Error Message: ${e?.message}`);
      console.error(`⏱️  Duration: ${duration}ms`);
      console.error(`${"=".repeat(70)}\n`);

      let msg = "Signup failed. Please try again.";

      if (e?.message?.includes("timeout")) {
        msg =
          "Server is taking longer than usual. Please wait a moment and try again.";
        console.error("   ⚠️  Request timeout");
      } else if (e?.message?.includes("Server may be sleeping")) {
        msg = "Server is starting up. Please wait 30 seconds and try again.";
        console.error("   ⚠️  Backend server is waking up");
      } else if (e?.message?.includes("Network")) {
        msg = "Network error. Please check your internet connection.";
      } else if (
        e?.message?.includes("Phone number already exists") ||
        e?.message?.includes("already exists")
      ) {
        msg =
          "An account with this phone number already exists. Please try logging in instead.";
      } else if (e?.message?.includes("Server configuration error")) {
        msg = "Server configuration issue. Please contact support.";
      } else if (e?.message?.includes("Database connection")) {
        msg = "Database connection issue. Please try again in a moment.";
      } else if (e?.status === 503) {
        msg =
          "Service temporarily unavailable. Please try again in a few moments.";
      } else if (e?.status === 404) {
        msg =
          "Server connection issue. Please check if you're connected to the internet.";
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
              <Text style={styles.welcomeTitle}>Create Account</Text>
              <Text style={styles.welcomeSubtitle}>Sign up to get started</Text>
            </View>

            {/*
            Step Indicator - COMMENTED OUT (OTP disabled)
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, step === 'phone' && styles.stepDotActive]} />
              <View style={[styles.stepLine, (step === 'otp' || step === 'details') && styles.stepLineActive]} />
              <View style={[styles.stepDot, (step === 'otp' || step === 'details') && styles.stepDotActive]} />
              <View style={[styles.stepLine, step === 'details' && styles.stepLineActive]} />
              <View style={[styles.stepDot, step === 'details' && styles.stepDotActive]} />
            </View>
            */}
          </View>

          {/* Form Section - OTP Steps Commented Out */}
          <View style={styles.formContainer}>
            {/* OTP Steps - COMMENTED OUT (OTP disabled) */}
            {/* Step 1: Phone Number */}
            {/* {step === 'phone' && (
              <>
                <View style={styles.inputGroup}>
                  <PhoneInput
                    label="Phone Number"
                    value={phoneNumber}
                    onChangeText={(text: string) => {
                      const raw = text.replace(/\D/g, '');
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
                </View>

                <View style={styles.buttonContainer}>
                  <Pressable
                    style={[styles.primaryButton, sendingOtp && styles.buttonDisabled]}
                    onPress={sendOtp}
                    disabled={sendingOtp}
                  >
                    {sendingOtp ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Send OTP</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )} */}

            {/* Step 2: OTP Verification */}
            {/* {step === 'otp' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Enter OTP</Text>
                  <OtpInput
                    length={6}
                    value={otp}
                    onChangeText={setOtp}
                    autoFocus={true}
                  />
                  <View style={styles.otpFooter}>
                    {otpTimer > 0 ? (
                      <Text style={styles.timerText}>Resend OTP in {otpTimer}s</Text>
                    ) : (
                      <Pressable onPress={resendOtp} disabled={!canResend}>
                        <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                          Resend OTP
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <Pressable
                    style={[styles.primaryButton, verifyingOtp && styles.buttonDisabled]}
                    onPress={verifyOtp}
                    disabled={verifyingOtp}
                  >
                    {verifyingOtp ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Verify OTP</Text>
                    )}
                  </Pressable>
                </View>

                <Pressable onPress={() => setStep('phone')} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Change Phone Number</Text>
                </Pressable>
              </>
            )} */}

            {/* Single Form - Name, Phone & Password (OTP disabled) */}
            <>
              <View style={styles.inputGroup}>
                <Field
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <PhoneInput
                  label="Phone Number"
                  value={phoneNumber}
                  onChangeText={(text: string) => {
                    const raw = text.replace(/\D/g, "");
                    if (raw.length > 10) {
                      showToast("Only 10 digits allowed", "error");
                      setPhoneNumber(raw.slice(0, 10));
                    } else {
                      setPhoneNumber(raw);
                    }
                  }}
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                  placeholder="8001234567"
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
                <Pressable
                  style={[
                    styles.primaryButton,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={doSignup}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#fff" />
                      <Text
                        style={[styles.primaryButtonText, { marginLeft: 8 }]}
                      >
                        {loadingMessage}
                        {progress > 0 ? ` (${progress}%)` : ""}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Create Account</Text>
                  )}
                </Pressable>
              </View>
            </>

            {/* Footer */}
            <View style={styles.footer}>
              <Pressable onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.footerText}>
                  Already have an account?{" "}
                  <Text style={styles.footerLink}>Sign In</Text>
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
            toastType === "success" ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Text style={styles.toastText}>
            {toastType === "success" ? "✓ " : "✗ "}
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
    backgroundColor: "#F8FAFC", // Modern light background
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
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 24,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 200, // Increased from 160
    height: 80, // Increased from 54
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E6E9EE",
  },
  stepDotActive: {
    backgroundColor: "#F97316",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#E6E9EE",
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: "#F97316",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20, // Reduced padding for mobile
    marginBottom: 24,
    marginHorizontal: 4, // Add small margin for better mobile display
    shadowColor: "#000",
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
    width: "100%", // Ensure full width
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#F97316",
    borderRadius: 14,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F97316",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  otpFooter: {
    marginTop: 12,
    alignItems: "center",
  },
  timerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  resendText: {
    fontSize: 14,
    color: "#F97316",
    fontWeight: "600",
  },
  resendTextDisabled: {
    color: "#9CA3AF",
  },
  backButton: {
    marginTop: 16,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    paddingTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  footerLink: {
    color: "#F97316",
    fontWeight: "600",
  },
  toast: {
    position: "absolute",
    top: 60,
    left: 24,
    right: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
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
    backgroundColor: "#10B981",
  },
  toastError: {
    backgroundColor: "#EF4444",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
