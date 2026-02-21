import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ensureAuth } from "../../lib/auth";
import api from "../../lib/api";
import { getCurrentUser } from "../../lib/useUser";
import { COLORS } from "../../lib/theme";
import FooterCarousel from "../../components/FooterCarousel";

interface UserProfile {
  _id: string;
  name: string;
  phone: string;
  profilePicture?: string;
  email?: string;
  about?: string;
  quizProgress?: {
    completed: boolean;
    currentQuestionIndex: number;
    answeredQuestions: string[];
    creditsEarned: number;
    completedAt?: Date;
  };
}

export default function Profile() {
  const queryClient = useQueryClient();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Check if user has completed the quiz
  const hasCompletedSurvey = userProfile?.quizProgress?.completed === true;

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await ensureAuth();
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      console.log('Fetching user profile...');
      const response = await api.get("/auth/profile");
      console.log('Profile response:', response);

      // Handle both response formats: direct object or wrapped in 'user'
      const profileData = response.user || response;

      if (profileData && profileData.name) {
        setUserProfile(profileData);
      } else {
        throw new Error('Invalid profile data received');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const options = userProfile?.profilePicture
      ? ['Take Photo', 'Choose from Gallery', 'Delete Photo', 'Cancel']
      : ['Take Photo', 'Choose from Gallery', 'Cancel'];

    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = userProfile?.profilePicture ? 2 : undefined;

    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickFromGallery(),
        },
        ...(userProfile?.profilePicture ? [{
          text: 'Delete Photo',
          style: 'destructive' as const,
          onPress: () => deleteProfilePicture(),
        }] : []),
        {
          text: 'Cancel',
          style: 'cancel' as const,
        },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please grant permission to access your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const deleteProfilePicture = async () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              await api.put("/auth/update-profile", { profilePicture: "" });

              setUserProfile(prev => prev ? { ...prev, profilePicture: undefined } : null);

              const userData = await getCurrentUser();
              if (userData) {
                delete userData.profilePicture;
                await AsyncStorage.setItem('user', JSON.stringify(userData));
              }

              Alert.alert('Success', 'Profile picture deleted successfully');
            } catch (error) {
              console.error('Error deleting profile picture:', error);
              Alert.alert('Error', 'Failed to delete profile picture. Please try again.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const uploadProfilePicture = async (asset: any) => {
    setUpdating(true);
    try {
      const base64Image = asset.base64;
      const mimeType = asset.mimeType || 'image/jpeg';
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      console.log('📤 Uploading profile picture as Base64...');

      const response = await api.put("/auth/update-profile", {
        profilePicture: dataUri
      });

      console.log('✅ Profile picture uploaded successfully');

      setUserProfile(prev => prev ? { ...prev, profilePicture: response.profilePicture } : null);

      const userData = await getCurrentUser();
      if (userData) {
        userData.profilePicture = response.profilePicture;
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }

      console.log('✅ Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const logout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // CRITICAL: Clear all cached data to prevent data leakage between accounts
            console.log('🧹 Clearing all React Query cache...');
            queryClient.clear(); // Remove all queries from cache

            // Clear all AsyncStorage auth data
            await AsyncStorage.multiRemove([
              "token",
              "user_name",
              "user_phone",
              "currentUserId",
              "contactsSynced",
              "login_prefill_phone",
              "reset_phone"
            ]);

            console.log('✅ All cache and storage cleared - redirecting to login');
            router.replace("/(auth)/login");
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Gradient Header Background */}
        <LinearGradient
          colors={['#4F6AF3', '#6B7FFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>My Profile</Text>
        </LinearGradient>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <View style={styles.profilePictureContainer}>
              {userProfile.profilePicture ? (
                <Image source={{ uri: userProfile.profilePicture }} style={styles.profilePicture} />
              ) : (
                <LinearGradient
                  colors={['#4F6AF3', '#6B7FFF']}
                  style={styles.profilePicturePlaceholder}
                >
                  <Text style={styles.profilePicturePlaceholderText}>
                    {userProfile.name.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
              {updating && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={COLORS.white} />
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={pickImage}
                disabled={updating}
              >
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{userProfile.name}</Text>
            <Text style={styles.userPhone}>{userProfile.phone}</Text>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          {/* Earn More Credits Button - Only show if survey not completed */}
          {!hasCompletedSurvey && (
            <TouchableOpacity
              style={styles.earnCreditsButton}
              onPress={() => router.push('/profile/earn-credits' as any)}
            >
              <View style={styles.earnCreditsIconContainer}>
                <Ionicons name="gift" size={22} color="#10B981" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.earnCreditsTitle}>Earn More Credits</Text>
                <Text style={styles.menuSubtitle}>Answer questions & get rewarded</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}

          {/* My Cards Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/(tabs)/mycards' as any)}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="albums" size={22} color="#4F6AF3" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>My Cards</Text>
              <Text style={styles.menuSubtitle}>View and manage your business cards</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Manage Account Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/account' as any)}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="settings-outline" size={22} color="#4F6AF3" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Manage Account</Text>
              <Text style={styles.menuSubtitle}>Update your personal information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          {/* Manage Listing Button */}
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => router.push('/business/manage-listing' as any)}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="briefcase-outline" size={22} color="#4F6AF3" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Manage Listing</Text>
              <Text style={styles.menuSubtitle}>Manage your business listings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          {/* Manage Listings Button */}
          {/* <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/business-dashboard' as any)}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="briefcase-outline" size={22} color="#2563EB" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Manage Listings</Text>
              <Text style={styles.menuSubtitle}>Free & Promoted Business Listings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity> */}


          {/* More Info Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/more-info' as any)}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="information-circle-outline" size={22} color="#4F6AF3" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>More Info</Text>
              <Text style={styles.menuSubtitle}>Feedback & account settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Referral Program Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/referral' as any)}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="gift-outline" size={22} color="#10B981" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Referral Program</Text>
              <Text style={styles.menuSubtitle}>Invite friends and earn credits</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutMenuButton}
            onPress={logout}
          >
            <View style={styles.logoutIconContainer}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.logoutMenuTitle}>Logout</Text>
              <Text style={styles.menuSubtitle}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Bottom spacing for footer carousel */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Footer Carousel */}
      <FooterCarousel />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  errorText: {
    color: '#333',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#4F6AF3',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4F6AF3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 35,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileCard: {
    marginTop: -25,
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  profilePicturePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  profilePicturePlaceholderText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F6AF3',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#4F6AF3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  userPhone: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  menuSection: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  menuButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  menuSubtitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  logoutMenuButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoutMenuTitle: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  earnCreditsButton: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#86EFAC',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  earnCreditsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  earnCreditsTitle: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
});