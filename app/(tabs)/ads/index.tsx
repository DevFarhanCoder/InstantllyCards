import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import FooterCarousel from "../../../components/FooterCarousel";

export default function Ads() {
  const router = useRouter();
  
  // With Channel → questionnaire page
  const handleWithChannel = () => {
    router.push({
      pathname: "/(tabs)/ads/adquestionnaire",
      params: { type: "withChannel" }
    });
  };

  // Without Channel → questionnaire page
  const handleWithoutChannel = () => {
    router.push({
      pathname: "/(tabs)/ads/adquestionnaire",
      params: { type: "withoutChannel" }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
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

      {/* Footer Carousel */}
      <View style={styles.footerCarouselContainer}>
        <FooterCarousel />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
    marginTop: 10,
    flex: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  footerCarouselContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
