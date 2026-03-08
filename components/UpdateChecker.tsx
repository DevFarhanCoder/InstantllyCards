import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import ForceUpdateModal from "./ForceUpdateModal";
import { checkAppVersion, VersionCheckResponse } from "../lib/versionCheck";

interface UpdateCheckerProps {
  enabled?: boolean;
  onUpdateRequired?: () => void;
}

export default function UpdateChecker({
  enabled = true,
  onUpdateRequired,
}: UpdateCheckerProps) {
  const [versionInfo, setVersionInfo] = useState<VersionCheckResponse | null>(
    null,
  );
  const checkingRef = useRef(false);

  const checkForUpdate = async () => {
    if (!enabled || checkingRef.current || Platform.OS === "web") {
      return;
    }

    try {
      checkingRef.current = true;
      const response = await checkAppVersion();

      if (response?.updateRequired) {
        setVersionInfo(response);
        onUpdateRequired?.();
      } else {
        setVersionInfo(null);
      }
    } catch (error) {
      console.warn("Error checking for updates:", error);
    } finally {
      checkingRef.current = false;
    }
  };

  useEffect(() => {
    // Check once at app start.
    checkForUpdate();

    // Re-check when app comes back to foreground.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkForUpdate();
      }
    });

    return () => subscription.remove();
  }, [enabled]);

  if (!versionInfo?.updateRequired) {
    return null;
  }

  return (
    <ForceUpdateModal
      visible={versionInfo.updateRequired}
      updateUrl={versionInfo.updateUrl}
      currentVersion={versionInfo.currentVersion}
      latestVersion={versionInfo.latestVersion}
    />
  );
}
