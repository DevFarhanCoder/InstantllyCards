import { NativeModules } from 'react-native';

interface InstallReferrerModule {
  getInstallReferrer(): Promise<string>;
}

const { InstallReferrer } = NativeModules as { InstallReferrer: InstallReferrerModule };

export default InstallReferrer;
