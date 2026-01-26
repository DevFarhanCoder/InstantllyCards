import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { queryClient } from "../lib/query";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import serverWarmup from "../lib/serverWarmup";
import ForceUpdateModal from "../components/ForceUpdateModal";
import {
  checkAppVersion,
  getCurrentAppVersion,
  getAppStoreUrl,
} from "../lib/versionCheck";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { socketService } from "@/lib/socket";
import { getPlayStoreReferrer } from "@/lib/playStoreReferrer";
import { checkAndRefreshCreditsOnUpdate } from "@/lib/creditsRefresh";

export default function RootLayout() {
  const [updateRequired, setUpdateRequired] = useState(false);
  const [updateUrl, setUpdateUrl] = useState(getAppStoreUrl());
  const [latestVersion, setLatestVersion] = useState("1.0.0");

  useEffect(() => {
    // Ultra-lightweight initialization - NOTHING synchronous
    const initApp = async () => {
      console.log("🚀 [INIT] App starting...");

      // All operations run in background after 2 seconds to allow navigation
      setTimeout(async () => {
        console.log("🔄 [BACKGROUND] Starting tasks...");

        // Check credits refresh
        checkAndRefreshCreditsOnUpdate().catch(() => {});

        // Version check (5s timeout)
        setTimeout(async () => {
          try {
            const timeoutPromise = new Promise<null>((_, reject) => {
              setTimeout(
                () => reject(new Error("Version check timeout")),
                5000,
              );
            });
            const versionInfo = await Promise.race([
              checkAppVersion(),
              timeoutPromise,
            ]);

            if (versionInfo && versionInfo.updateRequired) {
              setUpdateRequired(true);
              setUpdateUrl(versionInfo.updateUrl);
              setLatestVersion(versionInfo.latestVersion);
            }
          } catch (error) {
            console.log("⚠️ [VERSION] Check failed:", error);
          }
        }, 2000);

        // Play Store referrer
        getPlayStoreReferrer()
          .then((code) => {
            if (code) console.log("🎁 [REFERRER]:", code);
          })
          .catch(() => {});

        // Server warmup
        serverWarmup.preWarmOnAppStart().catch(() => {});

        // Socket.IO (10s timeout)
        setTimeout(() => {
          const socketTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Socket timeout")), 10000);
          });
          Promise.race([socketService.connect(), socketTimeout])
            .then(() => console.log("✅ [SOCKET] Connected"))
            .catch(() => console.log("⚠️ [SOCKET] Skipped"));
        }, 4000);

        // Setup admin transfer listener
        const unsubscribeAdminTransfer = socketService.onAdminTransfer(
          async (data) => {
            try {
              const existingNotifications = await AsyncStorage.getItem(
                "admin_transfer_notifications",
              );
              const notifications = existingNotifications
                ? JSON.parse(existingNotifications)
                : [];
              notifications.push({
                groupId: data.groupId,
                groupName: data.groupName,
                fromUser: data.fromUser || "Unknown",
                message: data.message,
                timestamp: data.timestamp || new Date(),
                seen: false,
              });
              await AsyncStorage.setItem(
                "admin_transfer_notifications",
                JSON.stringify(notifications),
              );
            } catch (error) {
              console.error("Error saving notification:", error);
            }
          },
        );

        console.log("✅ [INIT] App ready");

        return () => {
          unsubscribeAdminTransfer();
        };
      }, 2000); // Start all tasks after 2 seconds
    };

    initApp();
  }, []);

  // Deep Link Handler for Referral System
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log("🔗 Deep link received:", url);

      const { path, queryParams } = Linking.parse(url);

      if (path === "signup" && queryParams?.ref) {
        const referralCode = queryParams.ref as string;
        console.log("🎁 Referral code detected:", referralCode);
        await AsyncStorage.setItem("pending_referral_code", referralCode);
        console.log("💾 Referral code stored in AsyncStorage");
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("🔗 Initial URL:", url);
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ForceUpdateModal
        visible={updateRequired}
        updateUrl={updateUrl}
        currentVersion={getCurrentAppVersion()}
        latestVersion={latestVersion}
      />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
