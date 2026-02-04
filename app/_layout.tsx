import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { queryClient } from "../lib/query";
import { QueryClientProvider } from "@tanstack/react-query";
import { captureInitialReferralIfPresent } from "../utils/referral";

export default function RootLayout() {
  console.log("🚀 App starting - minimal layout");

  // Run non-blocking referral capture after first render
  useEffect(() => {
    // Do not await to avoid blocking UI / splash screen
    captureInitialReferralIfPresent().catch((e) => console.log('[referral] error', e));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
