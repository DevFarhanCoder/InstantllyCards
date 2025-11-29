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
import { useQueryClient } from '@tanstack/react-query';
import { ensureAuth } from "@/lib/auth";
import { getCurrentUser } from "@/lib/useUser";
import FooterCarousel from "@/components/FooterCarousel";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown } from 'lucide-react-native';

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
          const status = anyErr?.response?.status;
          const serverMsg = anyErr?.response?.data?.message || anyErr?.message || '';
          const msgStr = String(serverMsg);

          // If server indicates incorrect current password, show inline error
          if (/incorrect|old password|current password/i.test(msgStr)) {
            setCurrentPasswordError(msgStr);

          // If server indicates password reuse (or incorrectly returns an auth message for this case),
          // show a friendly inline message telling the user the password is already used.
          } else if (/already (in use|used)|previously used|cannot reuse password|password.*used/i.test(msgStr)
            || /authentication required/i.test(msgStr)) {
            setCurrentPasswordError('This password is already in use. Please choose a different password.');

          } else if (msgStr) {
            Alert.alert('Error', msgStr);
          } else {
            Alert.alert('Error', 'Failed to change password. Please try again.');
          }
        } finally {
          setChangingPassword(false);
        }
    };
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [birthdate, setBirthdate] = useState<string | null>(null);
  const [anniversary, setAnniversary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingGender, setEditingGender] = useState(false);
  const [editingBirth, setEditingBirth] = useState(false);
  const [editingAnniv, setEditingAnniv] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempAbout, setTempAbout] = useState("");
  const [tempGender, setTempGender] = useState<string | null>(null);
  const [tempBirthText, setTempBirthText] = useState<string>("");
  const [tempAnnivText, setTempAnnivText] = useState<string>("");

  const queryClient = useQueryClient();

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
        // fetch user's business card to load gender/birth/anniversary
        fetchUserCardDetails(profileData._id);
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

  const fetchUserCardDetails = async (userId: string) => {
    try {
      // Prefer the locally-stored default card if available (set during signup/create)
      const defaultCardRaw = await AsyncStorage.getItem('default_card');
      if (defaultCardRaw) {
        try {
          const defaultCard = JSON.parse(defaultCardRaw);
          const cardObj = defaultCard && (defaultCard.data || defaultCard.card) ? (defaultCard.data || defaultCard.card) : defaultCard;
          // If stored default_card already has the fields we need, use it
          if (cardObj && (cardObj.gender || cardObj.birthdate || cardObj.anniversary)) {
            setGender(cardObj.gender || null);
            setBirthdate(cardObj.birthdate || cardObj.dob || null);
            setAnniversary(cardObj.anniversary || cardObj.dob || null);
            return;
          }
          // If default_card only has an id, try to fetch the card by id
          const cardId = cardObj && (cardObj._id || cardObj.id);
          if (cardId) {
            try {
              const cardResp = await api.get(`/cards/${cardId}`);
              const cardData = cardResp?.data || cardResp;
              if (cardData) {
                setGender(cardData.gender || null);
                setBirthdate(cardData.birthdate || cardData.dob || null);
                setAnniversary(cardData.anniversary || cardData.dob || null);
                return;
              }
            } catch (e) {
              // fallthrough to listing cards
            }
          }
        } catch (e) {
          // If parsing failed, fall through to fetching cards
          console.warn('default_card exists but failed to parse, falling back to /cards', e);
        }
      }
      // Fallback: try to use react-query cache for ['cards'] first (fast), otherwise fetch from API
      let cards: any[] = [];
      try {
        const cached = queryClient.getQueryData(['cards']);
        if (Array.isArray(cached) && cached.length > 0) {
          cards = cached;
          console.log('Profile: using cached cards from react-query (count=' + cards.length + ')');
        }
      } catch (e) {
        // ignore
      }
      if (!cards || cards.length === 0) {
        const resp = await api.get('/cards');
        if (Array.isArray(resp)) cards = resp as any[];
        else if (Array.isArray(resp?.data)) cards = resp.data;
        else if (Array.isArray(resp?.data?.data)) cards = resp.data.data;
        else cards = [];
        console.log('Profile: fetched cards from API (count=' + cards.length + ')');
      }

      if (Array.isArray(cards) && cards.length > 0) {
        // Match by common ownership fields - backend may use userId, owner or createdBy
        const myCard = cards.find((c: any) =>
          String(c.userId) === String(userId) ||
          String(c.owner) === String(userId) ||
          String(c.createdBy) === String(userId) ||
          String(c._id) === String(userId)
        ) || cards[0];
        if (myCard) {
          console.log('Profile: selected card for user', { cardId: myCard._id || myCard.id, gender: myCard.gender, birthdate: myCard.birthdate, anniversary: myCard.anniversary });
          setGender(myCard.gender || null);
          setBirthdate(myCard.birthdate || myCard.dob || null);
          setAnniversary(myCard.anniversary || myCard.dob || null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user card details:', err);
    }
  };

  // helpers: formatting and parsing date strings
  const formatIsoToDisplay = (iso: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      return `${dd}-${mm}-${yyyy}`;
    } catch (e) {
      return "";
    }
  };

  const formatDigitsToDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0,8);
    if (digits.length <=2) return digits;
    if (digits.length <=4) return digits.slice(0,2) + '-' + digits.slice(2);
    return digits.slice(0,2) + '-' + digits.slice(2,4) + '-' + digits.slice(4);
  };

  const parseDisplayToIso = (s: string) => {
    if (!s) return null;
    const digits = s.replace(/\D/g, '');
    if (digits.length !== 8) return null;
    const dd = digits.slice(0,2);
    const mm = digits.slice(2,4);
    const yyyy = digits.slice(4);
    const iso = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return iso;
  };

  // Find user's card id (prefer default_card in AsyncStorage)
  const resolveUserCardId = async (userId?: string) => {
    try {
      const defaultCardRaw = await AsyncStorage.getItem('default_card');
      if (defaultCardRaw) {
        try {
          const defaultCard = JSON.parse(defaultCardRaw);
          if (defaultCard && defaultCard._id) return defaultCard._id;
        } catch (e) {
          // ignore
        }
      }
      // fallback: fetch cards
      const resp = await api.get('/cards');
      const cards = resp?.data || (Array.isArray(resp) ? resp : []);
      if (Array.isArray(cards) && cards.length > 0) {
        const myCard = cards[0];
        return myCard._id;
      }
    } catch (err) {
      console.error('resolveUserCardId error', err);
    }
    return null;
  };

  // Update card fields helper (optionally sync changes back to profile)
  const updateCardFields = async (fields: any, options: { syncProfile?: boolean } = { syncProfile: true }) => {
    setUpdating(true);
    try {
      const userId = userProfile?._id;
      const cardId = await resolveUserCardId(userId);
      if (!cardId) throw new Error('No card found to update');
      const resp = await api.put(`/cards/${cardId}`, fields);
      // update local default_card if present
      const defaultCardRaw = await AsyncStorage.getItem('default_card');
      if (defaultCardRaw) {
        try {
          const defaultCard = JSON.parse(defaultCardRaw);
          const updated = { ...defaultCard, ...fields };
          await AsyncStorage.setItem('default_card', JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
      }

      // Optionally sync certain card fields back to the user's profile
      if (options?.syncProfile) {
        const profileable: any = {};
        ['name', 'phone', 'gender', 'birthdate', 'anniversary'].forEach(k => {
          if (fields[k] !== undefined) profileable[k] = fields[k];
        });
        if (Object.keys(profileable).length > 0) {
          try {
            await api.put('/auth/update-profile', profileable);
            setUserProfile((prev: any) => prev ? { ...prev, ...profileable } : prev);
            try {
              const userRaw = await AsyncStorage.getItem('user');
              if (userRaw) {
                const userObj = JSON.parse(userRaw);
                const merged = { ...userObj, ...profileable };
                await AsyncStorage.setItem('user', JSON.stringify(merged));
              }
            } catch (e) {
              // ignore
            }
          } catch (e) {
            console.warn('Failed to sync card changes to profile:', e);
          }
        }
      }

      // return updated card data
      return resp?.data;
    } catch (err) {
      console.error('Failed to update card fields:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  // Update all cards belonging to current user with given fields
  const updateAllUserCards = async (fields: any, options: { syncProfile?: boolean } = { syncProfile: false }) => {
    setUpdating(true);
    try {
      const userId = userProfile?._id;
      if (!userId) throw new Error('No user logged in');
      const resp = await api.get('/cards');
      let cards: any[] = [];
      if (Array.isArray(resp)) cards = resp as any[];
      else if (Array.isArray(resp?.data)) cards = resp.data;
      else if (Array.isArray(resp?.data?.data)) cards = resp.data.data;
      else cards = [];

      const myCards = cards.filter(c => String(c.userId) === String(userId) || String(c.owner) === String(userId));
      // Map profile field names to card field names when necessary
      const cardFields: any = { ...fields };
      if (fields.phone !== undefined) {
        cardFields.personalPhone = fields.phone;
        delete cardFields.phone;
      }

      await Promise.all(myCards.map(async (c: any) => {
        try {
          await api.put(`/cards/${c._id}`, cardFields);
        } catch (e) {
          console.warn('Failed updating card', c._id, e);
        }
      }));

      // update local default_card if present
      const defaultCardRaw = await AsyncStorage.getItem('default_card');
      if (defaultCardRaw) {
        try {
          const defaultCard = JSON.parse(defaultCardRaw);
          const updated = { ...defaultCard, ...fields };
          await AsyncStorage.setItem('default_card', JSON.stringify(updated));
        } catch (e) { /* ignore */ }
      }

      // Optionally sync to profile as well
      if (options?.syncProfile) {
        const profileable: any = {};
        ['name', 'phone', 'gender', 'birthdate', 'anniversary'].forEach(k => {
          if (fields[k] !== undefined) profileable[k] = fields[k];
        });
        if (Object.keys(profileable).length > 0) {
          try {
            await api.put('/auth/update-profile', profileable);
            setUserProfile((prev: any) => prev ? { ...prev, ...profileable } : prev);
            try {
              const userRaw = await AsyncStorage.getItem('user');
              if (userRaw) {
                const userObj = JSON.parse(userRaw);
                const merged = { ...userObj, ...profileable };
                await AsyncStorage.setItem('user', JSON.stringify(merged));
              }
            } catch (e) { /* ignore */ }
          } catch (e) {
            console.warn('Failed to sync profile after bulk card update', e);
          }
        }
      }

      // invalidate card/profile/home queries so UI updates immediately
      try { queryClient.invalidateQueries({ queryKey: ['cards'] }); queryClient.invalidateQueries({ queryKey: ['public-feed'] }); queryClient.invalidateQueries({ queryKey: ['contacts-feed'] }); queryClient.invalidateQueries({ queryKey: ['profile'] }); } catch (e) {}
      return true;
    } catch (err) {
      console.error('updateAllUserCards error', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  const pickImage = async () => {
    // Present options to user: Take Photo or Choose from  gallery
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
      { text: 'Choose from  gallery', onPress: pickFromLibrary }
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
      // merge into default_card so card creation uses updated name
      try {
        const defaultCardRaw = await AsyncStorage.getItem('default_card');
        if (defaultCardRaw) {
          const defaultCard = JSON.parse(defaultCardRaw);
          const updated = { ...defaultCard, name: tempName.trim() };
          await AsyncStorage.setItem('default_card', JSON.stringify(updated));
        }
      } catch (e) {
        // ignore
      }
      try {
        await updateAllUserCards({ name: tempName.trim() }, { syncProfile: false } as any);
      } catch (e) {
        // ignore card update failure
      }
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
      // merge into default_card so card creation uses updated phone
      try {
        const defaultCardRaw = await AsyncStorage.getItem('default_card');
        if (defaultCardRaw) {
          const defaultCard = JSON.parse(defaultCardRaw);
          const updated = { ...defaultCard, phone: tempPhone.trim() };
          await AsyncStorage.setItem('default_card', JSON.stringify(updated));
        }
      } catch (e) {
        // ignore
      }
      try {
        await updateAllUserCards({ phone: tempPhone.trim() }, { syncProfile: false } as any);
      } catch (e) {
        // ignore card update failure
      }
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
            {/* Your Account header (expandable) */}
            <TouchableOpacity style={styles.sectionHeader} onPress={() => router.push('/account' as any)} activeOpacity={0.8}>
              <Text style={styles.sectionTitle}>Your Account</Text>
            </TouchableOpacity>

            {/* Box for Manage name/phone/basic info (like Feedback/Change Password) */}
            <View style={styles.listCard}>
              <TouchableOpacity style={styles.itemRow} onPress={() => router.push('/account' as any)}>
                <View style={styles.itemLeft}><Ionicons name="person" size={18} color="#4F6AF3" /></View>
                <View style={styles.itemBody}><Text style={styles.itemLabel}>Manage Personal Details</Text></View>
                <View style={styles.itemRight}><Ionicons name="chevron-forward" size={18} color="#999" /></View>
              </TouchableOpacity>
            </View>

            {/* More Information */}
            <View style={[styles.sectionHeader, { marginTop: 12 }]}> 
              <Text style={styles.sectionTitle}>More Information</Text>
            </View>
            <View style={styles.listCard}>
              <TouchableOpacity style={styles.itemRow} onPress={() => router.push('/feedback' as any)}>
                <View style={styles.itemLeft}><Ionicons name="chatbox-ellipses" size={18} color="#4F6AF3" /></View>
                <View style={styles.itemBody}><Text style={styles.itemLabel}>Feedback</Text></View>
                <View style={styles.itemRight}><Ionicons name="chevron-forward" size={18} color="#999" /></View>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.itemRow} onPress={() => setShowPasswordModal(true)}>
                <View style={styles.itemLeft}><Ionicons name="lock-closed" size={18} color="#4F6AF3" /></View>
                <View style={styles.itemBody}><Text style={styles.itemLabel}>Change Password</Text></View>
                <View style={styles.itemRight}><Ionicons name="chevron-forward" size={18} color="#999" /></View>
              </TouchableOpacity>
              {/* Help removed per request */}
            </View>
            {showPasswordModal && (
              <View style={styles.modalOverlay}>
                <View style={styles.changePasswordCard}>
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
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton, { marginRight: 10 }]}
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



        {/* Logout Button (outside Your Account, after More Information) */}
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
    backgroundColor: '#FBFCFD',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBFCFD',
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
    backgroundColor: '#FBFCFD',
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
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  logoutRow: {
    paddingVertical: 12,
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
  sectionHeader: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSub: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  itemLeft: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    marginLeft: 8,
  },
  itemLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  itemValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  itemRight: {
    width: 34,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 6,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  changePasswordCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
});