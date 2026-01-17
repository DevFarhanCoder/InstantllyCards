// import { useEffect, useRef } from "react";
// import { View, StyleSheet, Animated } from "react-native";
// import { router } from "expo-router";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// export default function Splash() {
//   const scale = useRef(new Animated.Value(0.75)).current;
//   const fade  = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.spring(scale, { toValue: 1, bounciness: 14, useNativeDriver: true }),
//       Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
//     ]).start();

//     const go = async () => {
//       const token = await AsyncStorage.getItem("token");
//       setTimeout(() => {
//         if (token) router.replace("/(tabs)/home");  // ✅ go to tabs/home screen
//         else router.replace("/(auth)/signup");      // (auth)/signup.tsx -> URL /signup
//       }, 900);
//     };
//     go();
//   }, []);

//   return (
//     <View style={s.splash}>
//       <Animated.Image
//         source={require("../assets/logo.png")}
//         resizeMode="contain"
//         style={[s.logo, { opacity: fade, transform: [{ scale }] }]}
//       />
//     </View>
//   );
// }
// const s = StyleSheet.create({
//   splash: { flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
//   logo:   { width: 300, height: 110 },
// });

import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkAndHandleVersionChange } from "../lib/versionCheck";

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 [INDEX] Checking authentication...');
        
        // FIRST: Check if app version changed and handle logout if needed
        const wasLoggedOut = await checkAndHandleVersionChange();
        
        if (wasLoggedOut) {
          console.log('🚪 [INDEX] User was logged out due to app update - redirecting to signup');
          setTimeout(() => {
            router.replace("/(auth)/signup");
          }, 500);
          return;
        }
        
        // THEN: Check for existing token
        const token = await AsyncStorage.getItem("token");
        
        // Small delay for smooth transition
        setTimeout(() => {
          if (token) {
            console.log('✅ [INDEX] Token found - navigating to home');
            router.replace("/(tabs)/home");
          } else {
            console.log('⚠️ [INDEX] No token - navigating to signup');
            router.replace("/(auth)/signup");
          }
        }, 500);
      } catch (error) {
        console.error('❌ [INDEX] Error checking auth:', error);
        // On error, go to signup
        router.replace("/(auth)/signup");
      }
    };
    
    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007aff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  }
});
// import { useEffect, useRef, useState } from "react";
// import { View, StyleSheet, Animated } from "react-native";
// import { router, useFocusEffect } from "expo-router";
// import * as Contacts from "expo-contacts";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import PermissionScreen from "../components/ContactsPermissionScreen";
// import React from "react";

// export default function Splash() {
//   const scale = useRef(new Animated.Value(0.75)).current;
//   const fade = useRef(new Animated.Value(0)).current;

//   const [showPermissionUI, setShowPermissionUI] = useState(false);
//   const [blockedPermanently, setBlockedPermanently] = useState(false);

//   async function requestContactPermission() {
//     const { status, canAskAgain } = await Contacts.requestPermissionsAsync();

//     console.log("PERMISSION RESULT:", status, "canAskAgain:", canAskAgain);

//     // 🚫 still denied
//     if (status !== "granted") {
//       setShowPermissionUI(true);

//       if (!canAskAgain) {
//         setBlockedPermanently(true);   // 👉 force settings only
//       }

//       return;
//     }

//     handleContinue();
//   }

//   useEffect(() => {
//     requestContactPermission();
//   }, []);

//   useFocusEffect(
//     React.useCallback(() => {
//       requestContactPermission();
//     }, [])
//   );

//   // async function handleContinue() {
//   //   const token = await AsyncStorage.getItem("token");

//   //   if (token) router.replace("/(tabs)/home");
//   //   else router.replace("/(auth)/signup");
//   // }
//   async function handleContinue() {
//     const token = await AsyncStorage.getItem("token");

//     console.log("TOKEN:", token);

//     // 👇 IMPORTANT CHANGE
//     if (!token) {
//       router.replace("/(auth)/signup");
//       return;
//     }

//     router.replace("/(tabs)/home");
//   }

//   // Splash animation
//   useEffect(() => {
//     Animated.parallel([
//       Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
//       Animated.timing(fade, { toValue: 1, useNativeDriver: true }),
//     ]).start();
//   }, []);

//   if (showPermissionUI) {
//     return (
//       <PermissionScreen
//         retry={requestContactPermission}
//         permanentlyDenied={blockedPermanently}
//       />
//     );
//   }

//   return (
//     <View style={styles.splash}>
//       <Animated.Image
//         source={require("../assets/logo.png")}
//         resizeMode="contain"
//         style={[styles.logo, { opacity: fade, transform: [{ scale }] }]}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   splash: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   logo: { width: 300, height: 110 },
// });
