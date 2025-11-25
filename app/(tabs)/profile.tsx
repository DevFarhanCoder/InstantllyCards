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
import * as FileSystem from 'expo-file-system';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { COLORS } from "@/lib/theme";
import api from "@/lib/api";
import { ensureAuth } from "@/lib/auth";
import { getCurrentUser } from "@/lib/useUser";
import FooterCarousel from "@/components/FooterCarousel";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface UserProfile {
  _id: string;
  name: string;
  phone: string;
  profilePicture?: string;
  email?: string;
  about?: string;
}

export default function Profile() {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currentPasswordError, setCurrentPasswordError] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);
    const deleteProfilePicture = async () => {
      Alert.alert(
        'Delete Photo',
        'Are you sure you want to delete your profile photo?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setUpdating(true);
              try {
                const response = await api.put("/auth/update-profile", { profilePicture: "" });
                setUserProfile(prev => prev ? { ...prev, profilePicture: "" } : null);
                // Update AsyncStorage
                const userData = await getCurrentUser();
                if (userData) {
                  userData.profilePicture = "";
                  await AsyncStorage.setItem('user', JSON.stringify(userData));
                }
                Alert.alert('Success', 'Profile photo deleted.');
              } catch (error) {
                console.error('Error deleting profile picture:', error);
                Alert.alert('Error', 'Failed to delete profile photo.');
              } finally {
                setUpdating(false);
              }
            }
          }
        ]
      );
    };

    const handleChangePassword = async () => {
        // Clear previous inline errors
        setCurrentPasswordError("");

        // Basic validations
        if (!oldPassword || !newPassword || !confirmPassword) {
          Alert.alert('Error', 'Please fill all password fields.');
          return;
        }
        if (newPassword !== confirmPassword) {
          Alert.alert('Error', 'New passwords do not match.');
          return;
        }
        if (newPassword.length < 6) {
          Alert.alert('Error', 'New password must be at least 6 characters long.');
          return;
        }

        setChangingPassword(true);
        try {
          await api.post('/auth/change-password', {
            oldPassword,
            newPassword
          });
          setShowPasswordModal(false);
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
          Alert.alert('Success', 'Password changed successfully!');
        } catch (err) {
          console.error('Change password error:', err);
          // Try to extract server message if available
          const anyErr = err as any;
          const serverMsg = anyErr?.response?.data?.message || anyErr?.message;
          if (serverMsg) {
            const msgStr = String(serverMsg);
            // If server indicates incorrect current password, show inline error
            if (/incorrect|old password|current password/i.test(msgStr)) {
              setCurrentPasswordError(msgStr);
            } else {
              Alert.alert('Error', msgStr);
            }
          } else {
            Alert.alert('Error', 'Failed to change password. Please try again.');
          }
        } finally {
          setChangingPassword(false);
        }
    };
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
    // Present options to user: Take Photo or Choose from Library
    const pickFromLibrary = async () => {
      try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: (ImagePicker as any).MediaTypeOptions?.Images ?? (ImagePicker as any).MediaType?.Images ?? ['Images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
        });

        if (!result.canceled && result.assets[0]) {
          await handlePickedAsset(result.assets[0]);
        }
      } catch (error) {
        console.error('Error picking image from library:', error);
        Alert.alert('Error', 'Failed to select image. Please try again.');
      }
    };

    const takePhoto = async () => {
      try {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert('Permission Required', 'Please grant camera permission to take a photo.');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
        });

        if (!result.canceled && result.assets[0]) {
          await handlePickedAsset(result.assets[0]);
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    };

    // Build options dynamically so we can include 'Remove Photo' when a photo exists
    const alertOptions: any[] = [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickFromLibrary }
    ];

    if (userProfile?.profilePicture) {
      alertOptions.push({ text: 'Remove Photo', style: 'destructive', onPress: () => deleteProfilePicture() });
    }

    alertOptions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Upload Photo', 'Choose an option', alertOptions);
  };

  const handlePickedAsset = async (asset: any) => {
    // Some platforms may not return base64; convert URI to base64 when needed
    if (asset.base64) {
      await uploadProfilePicture(asset);
      return;
    }

    if (asset.uri) {
      try {
        const enc = (FileSystem as any).EncodingType?.Base64 || (FileSystem as any).EncodingType?.base64 || 'base64';
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: enc });
        const augmented = { ...asset, base64 };
        await uploadProfilePicture(augmented);
      } catch (err) {
        console.error('Error converting image URI to base64:', err);
        Alert.alert('Error', 'Failed to process selected image.');
      }
      return;
    }

    Alert.alert('Error', 'Unsupported image result.');
  };

  const uploadProfilePicture = async (asset: any) => {
    setUpdating(true);
    try {
      // Convert to Base64 with data URI
      let base64Image = asset.base64;
      if (!base64Image && asset.uri) {
        try {
          const enc = (FileSystem as any).EncodingType?.Base64 || (FileSystem as any).EncodingType?.base64 || 'base64';
          base64Image = await FileSystem.readAsStringAsync(asset.uri, { encoding: enc });
        } catch (err) {
          console.error('Failed to read file as base64:', err);
        }
      }

      const mimeType = asset.mimeType || asset.type === 'image' ? 'image/jpeg' : 'application/octet-stream';
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
              {/* Delete Photo Button */}
              {userProfile.profilePicture ? (
                null
              ) : null}
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
            {/* Change Password Link (replaced boxed input with inline link) */}
            <View style={{ marginTop: 0 }}>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(true)}
                style={styles.changePasswordLink}
                accessibilityRole="button"
              >
                <Ionicons name="lock-closed" size={16} color="#4F6AF3" style={styles.changePasswordIcon} />
                <Text style={styles.changePasswordText}>Change Password</Text>
              </TouchableOpacity>
            </View>

            {/* Change Password Modal (moved) */}
            {showPasswordModal && (
              <View style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'transparent',
                justifyContent: 'center', alignItems: 'center',
                zIndex: 1000
              }}>
                <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: '85%', maxWidth: 350 }}>
                  <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 16 }}>Change Password</Text>
                  <View style={{ marginBottom: 6 }}>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={[styles.textInput, styles.textInputInside, { marginBottom: 0, flex: 1 }]}
                        placeholder="Current Password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showOldPassword}
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.visibilityButton}
                        onPress={() => setShowOldPassword(s => !s)}
                      >
                        <Ionicons name={showOldPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                    {currentPasswordError ? (
                      <Text style={styles.passwordError}>{currentPasswordError}</Text>
                    ) : null}
                  </View>

                  <View style={{ marginBottom: 6 }}>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={[styles.textInput, styles.textInputInside, { marginBottom: 0, flex: 1 }]}
                        placeholder="New Password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      <TouchableOpacity
                        style={styles.visibilityButton}
                        onPress={() => setShowNewPassword(s => !s)}
                      >
                        <Ionicons name={showNewPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                    {newPassword.length > 0 && newPassword.length < 6 && (
                      <Text style={styles.passwordError}>
                        Password must be at least 6 characters
                      </Text>
                    )}
                  </View>

                  <View style={{ marginBottom: 18 }}>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={[styles.textInput, styles.textInputInside, { marginBottom: 0, flex: 1 }]}
                        placeholder="Confirm New Password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                      <TouchableOpacity
                        style={styles.visibilityButton}
                        onPress={() => setShowConfirmPassword(s => !s)}
                      >
                        <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => {
                        setShowPasswordModal(false);
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      disabled={changingPassword}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.saveButton]}
                      onPress={handleChangePassword}
                      disabled={changingPassword || newPassword.length < 6}
                    >
                      {changingPassword ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={styles.saveButtonText}>Change</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
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
        <View style={{ height: 40 }} />
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
    paddingTop: 16,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileCard: {
    marginTop: -20,
    marginHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingBottom: 6,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  profilePicturePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    borderRadius: 36,
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
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  userPhone: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  profileInfo: {
    paddingHorizontal: 10,
    marginTop: 6,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
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
    paddingVertical: 6,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#4F6AF3',
  },
  textInputInside: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 8,
    borderWidth: 0,
    color: '#1A1A1A',
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
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4F6AF3',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
  },
  visibilityButton: {
    padding: 8,
    marginLeft: 8,
  },
  passwordError: {
    color: '#EF4444',
    marginTop: 6,
    marginBottom: 6,
    fontSize: 12,
  },
  feedbackButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
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
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 10,
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
  changePasswordLink: {
    // place the link at the right edge and keep it compact
    alignSelf: 'flex-end',
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePasswordText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  changePasswordIcon: {
    marginRight: 6,
  },
});