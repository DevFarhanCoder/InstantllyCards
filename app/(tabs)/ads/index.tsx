import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router"; // 👈 import router for navigation

export default function Ads() {
  const router = useRouter();

  // With Channel → external website
  const handleWithChannel = async () => {
    const url = "https://instantllychannelpatner.vercel.app/";
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this URL: " + url);
      }
    } catch (error) {
      console.error("Error opening link:", error);
      Alert.alert("Error", "Something went wrong while opening the link.");
    }
  };

  // Without Channel → navigate inside app
  const handleWithoutChannel = () => {
    router.push("/ads/adswithoutchannel"); // 👈 go to new page
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advertisements</Text>
      <Text style={styles.subtitle}>
        Here you can manage and view your active ads 📢
      </Text>

      {/* With Channel */}
      <TouchableOpacity style={styles.button} onPress={handleWithChannel}>
        <Text style={styles.buttonText}>With Channel</Text>
      </TouchableOpacity>

      {/* Without Channel */}
      <TouchableOpacity
        style={styles.linkContainer}
        onPress={handleWithoutChannel}
      >
        <Text style={styles.linkText}>Without Channel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4F6AF3",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#4F6AF3",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkContainer: {
    marginTop: 16,
  },
  linkText: {
    fontSize: 15,
    color: "#4F6AF3",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
