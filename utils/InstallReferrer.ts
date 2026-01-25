import PlayInstallReferrer from "react-native-google-play-install-referrer";

interface InstallReferrerModule {
  getInstallReferrer(): Promise<string>;
}

// Wrap the package to match our expected interface
const InstallReferrer: InstallReferrerModule = {
  getInstallReferrer: async () => {
    try {
      const referrerInfo = await PlayInstallReferrer.getInstallReferrerInfo();
      // The package returns an object with installReferrer property
      return referrerInfo?.installReferrer || "";
    } catch (error) {
      console.log("Error getting install referrer:", error);
      throw error;
    }
  },
};

export default InstallReferrer;
