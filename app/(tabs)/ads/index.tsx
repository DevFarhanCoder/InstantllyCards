import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import FooterCarousel from "../../../components/FooterCarousel";

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
    router.push("/ads/adswithoutchannel");
  };

  return (
    <View style={styles.container}>
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

      {/* Footer Carousel */}
      <FooterCarousel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  button: {
    backgroundColor: "#4F6AF3",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkContainer: {
    marginTop: 16,
    alignSelf: "center",
  },
  linkText: {
    fontSize: 15,
    color: "#4F6AF3",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
