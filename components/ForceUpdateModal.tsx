import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Image,
} from 'react-native';

interface ForceUpdateModalProps {
  visible: boolean;
  updateUrl: string;
  currentVersion: string;
  latestVersion: string;
}

export default function ForceUpdateModal({
  visible,
  updateUrl,
  currentVersion,
  latestVersion,
}: ForceUpdateModalProps) {
  const handleUpdate = async () => {
    try {
      const canOpen = await Linking.canOpenURL(updateUrl);
      if (canOpen) {
        await Linking.openURL(updateUrl);
      } else {
        console.error('Cannot open URL:', updateUrl);
      }
    } catch (error) {
      console.error('Error opening update URL:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* App Logo/Icon */}
          <View style={styles.iconContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>App Update Required!</Text>

          {/* Description */}
          <Text style={styles.description}>
            We have added new features and fix some bugs{'\n'}
            to make your experience seamless.
          </Text>

          {/* Version Info */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>
              Current Version: <Text style={styles.versionBold}>{currentVersion}</Text>
            </Text>
            <Text style={styles.versionText}>
              Latest Version: <Text style={styles.versionBold}>{latestVersion}</Text>
            </Text>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdate}
            activeOpacity={0.8}
          >
            <Text style={styles.updateButtonText}>Update App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(139, 148, 219, 0.85)', // Purple-blue gradient effect
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  versionContainer: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  versionBold: {
    fontWeight: '600',
    color: '#1F2937',
  },
  updateButton: {
    backgroundColor: '#6366F1', // Purple-blue color matching the image
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
