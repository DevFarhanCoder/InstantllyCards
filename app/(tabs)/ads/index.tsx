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
  
  const handlePublishAds = () => {
    router.push({
      pathname: "/(tabs)/ads/adquestionnaire",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.subtitle}>
          Here you can manage and view your active ads 📢
        </Text>

        <TouchableOpacity style={styles.button} onPress={handlePublishAds}>
          <Text style={styles.buttonText}>Publish Ads</Text>
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

  footerCarouselContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
