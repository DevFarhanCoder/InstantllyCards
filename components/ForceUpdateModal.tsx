import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
  Dimensions,
  BackHandler,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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
  const insets = useSafeAreaInsets();
  
  // Disable Android back button to prevent dismissal
  React.useEffect(() => {
    if (visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Return true to prevent default back behavior
        return true;
      });

      return () => backHandler.remove();
    }
  }, [visible]);

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
      animationType="slide"
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      {/* Semi-transparent overlay */}
      <View style={styles.overlay}>
        {/* Bottom Sheet Container */}
        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header with close icon (disabled) */}
          <View style={styles.header}>
            <View style={styles.handleBar} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Google Play Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="logo-google-playstore" size={32} color="#01875F" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Update available</Text>

            {/* Description */}
            <Text style={styles.description}>
              To use this app, download the latest version.
            </Text>

            {/* App Info Row */}
            <View style={styles.appInfo}>
              <View style={styles.appIconContainer}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.appIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.appDetails}>
                <Text style={styles.appName}>Instantlly</Text>
                <Text style={styles.appSize}>Everyone · {currentVersion}</Text>
              </View>
            </View>

            {/* What's New Section */}
            <View style={styles.whatsNewSection}>
              <Text style={styles.whatsNewTitle}>What's new</Text>
              <Text style={styles.whatsNewDate}>Updated on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.moreInfoButton}
                activeOpacity={0.7}
              >
                <Text style={styles.moreInfoText}>More info</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdate}
                activeOpacity={0.85}
              >
                <Text style={styles.updateButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  appIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIcon: {
    width: 40,
    height: 40,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  appSize: {
    fontSize: 13,
    color: '#6B7280',
  },
  whatsNewSection: {
    marginBottom: 24,
  },
  whatsNewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  whatsNewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  moreInfoButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  updateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#01875F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
