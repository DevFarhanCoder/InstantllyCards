import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../lib/api';

const { width, height } = Dimensions.get('window');

type ServiceType = 'home-based' | 'business-visiting';

export default function ServiceSelectionScreen() {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleServiceSelect = async (serviceType: ServiceType) => {
    setSelectedService(serviceType);
    
    // Animate selection
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setLoading(true);

    try {
      console.log('📝 [SERVICE-SELECTION] Sending service type to backend:', serviceType);
      
      // Send selection to backend
      const response = await api.post('/auth/update-service-type', { serviceType });
      
      console.log('✅ [SERVICE-SELECTION] Service type saved successfully:', response);
      
      // Navigate to home screen
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('❌ [SERVICE-SELECTION] Error saving service type:', error);
      
      // Show error to user
      Alert.alert(
        'Error',
        error?.message || 'Failed to save service type. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              setLoading(false);
              setSelectedService(null);
            }
          }
        ]
      );
      
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <LinearGradient
        colors={['#F9FAFB', '#FFFFFF']}
        style={styles.gradientBackground}
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="briefcase-outline" size={28} color="#fff" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Welcome to Instantlly</Text>
            <Text style={styles.description}>
              Choose how you'd like to offer your services
            </Text>
          </View>

          {/* Service Options */}
          <View style={styles.optionsContainer}>
            {/* Home Based Services Card */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
              style={[
                styles.serviceCard,
                selectedService === 'home-based' && styles.serviceCardSelected
              ]}
              onPress={() => handleServiceSelect('home-based')}
              disabled={loading}
              activeOpacity={1}
            >
              <View style={styles.cardContent}>
                {/* Selected Badge */}
                {selectedService === 'home-based' && (
                  <View style={styles.selectedBadgeContainer}>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.selectedBadgeGradient}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.selectedBadge}>Selected</Text>
                    </LinearGradient>
                  </View>
                )}
                
                <View style={styles.cardIconContainer}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.iconGradient}
                  >
                    <Ionicons name="home" size={28} color="#fff" />
                  </LinearGradient>
                </View>
                
                <Text style={styles.cardTitle}>Home Based Services</Text>
                <Text style={styles.cardDescription}>
                  For professionals offering remote consultations and online services
                </Text>

                {loading && selectedService === 'home-based' && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Setting up...</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Business Visiting Card */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.serviceCard,
                selectedService === 'business-visiting' && styles.serviceCardSelected
              ]}
              onPress={() => handleServiceSelect('business-visiting')}
              disabled={loading}
              activeOpacity={1}
            >
              <View style={styles.cardContent}>
                {/* Selected Badge */}
                {selectedService === 'business-visiting' && (
                  <View style={styles.selectedBadgeContainer}>
                    <LinearGradient
                      colors={['#667EEA', '#764BA2']}
                      style={styles.selectedBadgeGradient}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.selectedBadge}>Selected</Text>
                    </LinearGradient>
                  </View>
                )}
                
                <View style={styles.cardIconContainer}>
                  <LinearGradient
                    colors={['#667EEA', '#764BA2']}
                    style={styles.iconGradient}
                  >
                    <Ionicons name="business" size={28} color="#fff" />
                  </LinearGradient>
                </View>
                
                <Text style={styles.cardTitle}>Business Visiting</Text>
                <Text style={styles.cardDescription}>
                  For businesses with physical locations and in-person client meetings
                </Text>

                {loading && selectedService === 'business-visiting' && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#667EEA" />
                    <Text style={styles.loadingText}>Setting up...</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Footer Note */}
          <View style={styles.footer}>
            <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
            <Text style={styles.footerText}>
              You can change this later in your account settings
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 12,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  optionsContainer: {
    flex: 1,
    gap: 12,
  },
  serviceCardSelected: {
    borderColor: '#667EEA',
    borderWidth: 3,
    shadowColor: '#667EEA',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  selectedBadge: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedBadgeContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  selectedBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardIconContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIconBackground: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 0,
    fontWeight: '500',
  },
  cardFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  featureText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginTop: 8,
  },
  selectButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
});
