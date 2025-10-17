// app/(auth)/sign-in.tsx
import { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import api from "@/lib/api";
import { Link, useRouter } from "expo-router";

// Import notification registration
const isExpoGo = Constants.appOwnership === 'expo';
const notificationModule = isExpoGo 
  ? null
  : require("@/lib/notifications-production-v2");

const registerPendingPushToken = notificationModule?.registerPendingPushToken || (async () => {});

export default function SignIn() {
  const r = useRouter();
  const [phone,setPhone]=useState(""); 
  const [password,setPassword]=useState(""); 
  const [loading,setLoading]=useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      const data = await api.post("/auth/login", { phone, password });
      await AsyncStorage.setItem("token", data.token);
      if (data.user?.name) {
        await AsyncStorage.setItem("user_name", data.user.name);
      }
      if (data.user?.phone) {
        await AsyncStorage.setItem("user_phone", data.user.phone);
      }
      
      // Register push token after successful login (non-blocking)
      console.log('🔔 Attempting to register pending push token after sign-in...');
      registerPendingPushToken().catch((error: any) => {
        console.error('⚠️ Push token registration failed, but sign-in succeeded:', error);
        // Don't block sign-in if push token registration fails
      });
      
      r.replace("/"); // to (main)/index
    } catch (e:any) { Alert.alert("Login failed", e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text>Phone Number</Text>
      <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+1234567890" style={{ borderWidth:1, padding:10, borderRadius:8 }} />
      <Text>Password</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth:1, padding:10, borderRadius:8 }} />
      <Button title={loading?"Signing in...":"Sign In"} onPress={onSubmit} />
      <Link href="/">Continue as guest</Link>
    </View>
  );
}
