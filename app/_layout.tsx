import React from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { queryClient } from "../lib/query";
import { QueryClientProvider } from "@tanstack/react-query";

export default function RootLayout() {
  console.log("🚀 App starting - minimal layout");

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
