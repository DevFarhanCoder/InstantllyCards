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
  ActivityIndicator 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { COLORS } from "@/lib/theme";
import api from "@/lib/api";
import { ensureAuth } from "@/lib/auth";

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
      
      if (response && response.name) {
        setUserProfile(response);
        setTempName(response.name || "");
        setTempPhone(response.phone || "");
        setTempAbout(response.about || "Available");
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await api.post("/auth/upload-profile-picture", formData);
      
      setUserProfile(prev => prev ? {...prev, profilePicture: response.profilePicture} : null);
      Alert.alert('Success', 'Profile picture updated successfully!');
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePictureContainer}>
            {userProfile.profilePicture ? (
              <Image source={{ uri: userProfile.profilePicture }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Text style={styles.profilePicturePlaceholderText}>
                  {userProfile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {updating && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color={COLORS.white} />
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={pickImage}
            disabled={updating}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Information */}
        <View style={styles.profileInfo}>
          {/* Name Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Text style={styles.label}>Name</Text>
            </View>
            {editingName ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.textInput}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="Enter your name"
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
                  style={styles.inlineEditButton} 
                  onPress={() => setEditingName(true)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Phone Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Text style={styles.label}>Phone</Text>
            </View>
            {editingPhone ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.textInput}
                  value={tempPhone}
                  onChangeText={setTempPhone}
                  placeholder="Enter your phone number"
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
                  style={styles.inlineEditButton} 
                  onPress={() => setEditingPhone(true)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* About Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Text style={styles.label}>About</Text>
            </View>
            {editingAbout ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.textInput}
                  value={tempAbout}
                  onChangeText={setTempAbout}
                  placeholder="Enter your about"
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
                <Text style={styles.infoValue}>{userProfile.about || "Available"}</Text>
                <TouchableOpacity 
                  style={styles.inlineEditButton} 
                  onPress={() => setEditingAbout(true)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#333333',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#333333',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.brown,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicturePlaceholderText: {
    color: '#666666',
    fontSize: 36,
    fontWeight: 'bold',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  profileInfo: {
    paddingHorizontal: 24,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoHeader: {
    marginBottom: 8,
  },
  label: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValue: {
    color: '#555555',
    fontSize: 14,
    flex: 1,
  },
  inlineEditButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editContainer: {
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F8F8F8',
    color: '#1A1A1A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#22C55E',
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 24,
    marginVertical: 24,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});