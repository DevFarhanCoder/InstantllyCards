// Legacy shim for InstallReferrer.
// NOTE: The native `react-native-google-play-install-referrer` package
// has been removed because it is unmaintained and blocks startup in
// production APKs. This shim keeps imports safe and non-blocking.

interface InstallReferrerModule {
  getInstallReferrer(): Promise<string>;
}

const InstallReferrer: InstallReferrerModule = {
  getInstallReferrer: async () => {
    console.log('[InstallReferrer shim] native install referrer removed - returning empty string');
    return '';
  },
};

export default InstallReferrer;
