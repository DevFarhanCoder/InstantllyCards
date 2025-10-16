import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Image } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Splash() {
  const scale = useRef(new Animated.Value(0.75)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, bounciness: 14, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    const go = async () => {
      const token = await AsyncStorage.getItem("token");
      setTimeout(() => {
        if (token) router.replace("/home");
        else router.replace("/signup");
      }, 900);
    };
    go();
  }, []);

  return (
    <View style={s.splash}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <Image
          style={s.logo}
          source={require("../assets/logo.png")}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  logo:   { width: 300, height: 110 },
});
