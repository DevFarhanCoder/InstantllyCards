import React, { useEffect } from "react";
import { Alert } from "react-native";
import { Stack } from "expo-router";
import * as Updates from "expo-updates";
import { queryClient } from "../lib/query";
import { QueryClientProvider } from "@tanstack/react-query";
import { CreditsProvider } from "../contexts/CreditsContext";
import { captureInitialReferralIfPresent } from "../utils/referral";

async function checkForOTAUpdate() {
  // Only runs in production builds (expo-updates is a no-op in dev/Expo Go)
  if (__DEV__) return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      await Updates.fetchUpdateAsync();
      Alert.alert(
        "Update ready",
        "A new version has been downloaded. Restart now to apply it.",
        [
          { text: "Later", style: "cancel" },
          { text: "Restart", onPress: () => Updates.reloadAsync() },
        ],
      );
    }
  } catch (e) {
    // Non-fatal: silently ignore update errors (e.g. no network)
    console.log("[OTA] update check failed:", e);
  }
}

export default function RootLayout() {
  console.log("🚀 App starting - minimal layout");

  useEffect(() => {
    captureInitialReferralIfPresent().catch((e) =>
      console.log("[referral] error", e),
    );
    checkForOTAUpdate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CreditsProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CreditsProvider>
    </QueryClientProvider>
  );
}
