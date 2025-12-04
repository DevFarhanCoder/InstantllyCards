import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Alert, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  ActivityIndicator,
  Dimensions 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

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
}

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempAbout, setTempAbout] = useState("");

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
        setTempName(profileData.name || "");
        setTempPhone(profileData.phone || "");
        setTempAbout(profileData.about || "Available");
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
        quality: 0.5, // Reduced quality to keep Base64 size manageable
        base64: true, // Get Base64 encoding
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const uploadProfilePicture = async (asset: any) => {
    setUpdating(true);
    try {
      // Convert to Base64 with data URI
      const base64Image = asset.base64;
      const mimeType = asset.mimeType || 'image/jpeg';
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      console.log('📤 Uploading profile picture as Base64...');
      
      const response = await api.put("/auth/update-profile", { 
        profilePicture: dataUri 
      });
      
      console.log('✅ Profile picture uploaded successfully');
      
      // Update local state
      setUserProfile(prev => prev ? {...prev, profilePicture: response.profilePicture} : null);
      
      // Update AsyncStorage
      const userData = await getCurrentUser();
      if (userData) {
        userData.profilePicture = response.profilePicture;
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
      
      // Silent update - no alert needed
      console.log('✅ Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const updateName = async () => {
    if (!tempName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put("/auth/update-profile", { name: tempName.trim() });
      
      setUserProfile(prev => prev ? {...prev, name: tempName.trim()} : null);
      setEditingName(false);
      Alert.alert('Success', 'Name updated successfully!');
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const updatePhone = async () => {
    if (!tempPhone.trim()) {
      Alert.alert('Error', 'Phone number cannot be empty.');
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put("/auth/update-profile", { phone: tempPhone.trim() });
      
      setUserProfile(prev => prev ? {...prev, phone: tempPhone.trim()} : null);
      setEditingPhone(false);
      Alert.alert('Success', 'Phone number updated successfully!');
    } catch (error) {
      console.error('Error updating phone:', error);
      Alert.alert('Error', 'Failed to update phone number. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const updateAbout = async () => {
    if (!tempAbout.trim()) {
      Alert.alert('Error', 'About cannot be empty.');
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put("/auth/update-profile", { about: tempAbout.trim() });
      
      setUserProfile(prev => prev ? {...prev, about: tempAbout.trim()} : null);
      setEditingAbout(false);
      Alert.alert('Success', 'About updated successfully!');
    } catch (error) {
      console.error('Error updating about:', error);
      Alert.alert('Error', 'Failed to update about. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const cancelEdit = (field: 'name' | 'phone' | 'about') => {
    if (field === 'name') {
      setTempName(userProfile?.name || "");
      setEditingName(false);
    } else if (field === 'phone') {
      setTempPhone(userProfile?.phone || "");
      setEditingPhone(false);
    } else {
      setTempAbout(userProfile?.about || "Available");
      setEditingAbout(false);
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
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("contactsSynced"); // Clear sync status on logout
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

          {/* Profile Information Cards */}
          <View style={styles.profileInfo}>
            {/* Name Section */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="person" size={18} color="#4F6AF3" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>Full Name</Text>
                {editingName ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.textInput}
                      value={tempName}
                      onChangeText={setTempName}
                      placeholder="Enter your name"
                      placeholderTextColor="#999"
                      autoFocus
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.cancelButton]} 
                        onPress={() => cancelEdit('name')}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.saveButton]} 
                        onPress={updateName}
                        disabled={updating}
                      >
                        {updating ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <Text style={styles.saveButtonText}>Save</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoValue}>{userProfile.name}</Text>
                    <TouchableOpacity 
                      style={styles.editIconButton} 
                      onPress={() => setEditingName(true)}
                    >
                      <Ionicons name="pencil" size={16} color="#4F6AF3" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Phone Section */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="call" size={18} color="#4F6AF3" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>Phone Number</Text>
                {editingPhone ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.textInput}
                      value={tempPhone}
                      onChangeText={setTempPhone}
                      placeholder="Enter your phone number"
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                      autoFocus
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.cancelButton]} 
                        onPress={() => cancelEdit('phone')}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.saveButton]} 
                        onPress={updatePhone}
                        disabled={updating}
                      >
                        {updating ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <Text style={styles.saveButtonText}>Save</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoValue}>{userProfile.phone}</Text>
                    <TouchableOpacity 
                      style={styles.editIconButton} 
                      onPress={() => setEditingPhone(true)}
                    >
                      <Ionicons name="pencil" size={16} color="#4F6AF3" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* About Section */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={18} color="#4F6AF3" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>About</Text>
                {editingAbout ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={[styles.textInput, styles.textInputMultiline]}
                      value={tempAbout}
                      onChangeText={setTempAbout}
                      placeholder="Tell us about yourself..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={2}
                      autoFocus
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.cancelButton]} 
                        onPress={() => cancelEdit('about')}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.saveButton]} 
                        onPress={updateAbout}
                        disabled={updating}
                      >
                        {updating ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <Text style={styles.saveButtonText}>Save</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoValue, styles.aboutText]} numberOfLines={2}>
                      {userProfile.about || "Available"}
                    </Text>
                    <TouchableOpacity 
                      style={styles.editIconButton} 
                      onPress={() => setEditingAbout(true)}
                    >
                      <Ionicons name="pencil" size={16} color="#4F6AF3" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Feedback Button */}
        <TouchableOpacity style={styles.feedbackButton} onPress={() => router.push('/feedback' as any)}>
          <View style={styles.feedbackIconContainer}>
            <Ionicons name="chatbox-ellipses" size={20} color="#4F6AF3" />
          </View>
          <View style={styles.feedbackContent}>
            <Text style={styles.feedbackTitle}>Send Feedback</Text>
            <Text style={styles.feedbackSubtitle}>Help us improve your experience</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        
        {/* Bottom spacing for footer carousel */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Carousel */}
      <FooterCarousel />
    </SafeAreaView>
  );
}const styles = StyleSheet.create({
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
    paddingTop: 16,
    paddingBottom: 45,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileCard: {
    marginTop: -30,
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profilePicture: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  profilePicturePlaceholder: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 3,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  profilePicturePlaceholderText: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '800',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 42.5,
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
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 2,
  },
  userPhone: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  profileInfo: {
    paddingHorizontal: 14,
    marginTop: 6,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  infoIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  label: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValue: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  aboutText: {
    lineHeight: 18,
  },
  editIconButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  editContainer: {
    marginTop: 2,
  },
  textInput: {
    backgroundColor: COLORS.white,
    color: '#1A1A1A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#4F6AF3',
  },
  textInputMultiline: {
    height: 50,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#E8ECEF',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#4F6AF3',
    shadowColor: '#4F6AF3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  feedbackButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 10,
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
  feedbackIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackTitle: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  feedbackSubtitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 14,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    gap: 6,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});