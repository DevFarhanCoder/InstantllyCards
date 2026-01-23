import React, { useEffect, useState } from 'react';
import { Alert, Modal, View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import VersionCheck from 'react-native-version-check';

interface UpdateCheckerProps {
  onUpdateRequired?: () => void;
}

export default function UpdateChecker({ onUpdateRequired }: UpdateCheckerProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      // Only check on Android (Play Store)
      if (Platform.OS !== 'android') {
        return;
      }

      // Check if update is needed
      const updateNeeded = await VersionCheck.needUpdate();
      
      if (updateNeeded?.isNeeded) {
        setUpdateAvailable(true);
        setStoreUrl(updateNeeded.storeUrl);
      }
    } catch (error) {
      console.warn('Error checking for updates:', error);
    }
  };

  const handleUpdate = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl);
      setUpdateAvailable(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    // Note: We don't store dismissal, so it will show again on next app open
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <Modal
      visible={updateAvailable}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.message}>
            A new version of the app is available on Play Store. Please update to continue using the app with the latest features and improvements.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={handleUpdate}
            >
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.dismissButton]}
              onPress={handleDismiss}
            >
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: '#007AFF',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#F0F0F0',
  },
  dismissButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
