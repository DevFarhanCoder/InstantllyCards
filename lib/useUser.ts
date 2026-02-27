// lib/useUser.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

export interface User {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  profilePicture?: string;
  about?: string;
}

export async function fetchAndStoreUserProfile(): Promise<User | null> {
  try {
    console.log('🔄 Fetching user profile from backend...');
    
    // Fetch user profile from backend
    const response = await api.get<{
      user: {
        _id: string;
        name: string;
        phone: string;
        email?: string;
        profilePicture?: string;
        about?: string;
      }
    }>('/auth/profile');
    
    // Backend returns { user: { ... } }
    const userProfile = response?.user;
    
    if (userProfile && userProfile._id) {
      const userData: User = {
        id: userProfile._id,
        _id: userProfile._id,
        name: userProfile.name,
        phone: userProfile.phone,
        email: userProfile.email,
        profilePicture: userProfile.profilePicture,
        about: userProfile.about || 'Available'
      };
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('✅ User profile fetched and stored:', userData.name);
      
      return userData;
    } else {
      console.log('❌ Invalid response from profile endpoint:', response);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('[USER AUTH DEBUG] getCurrentUser token exists:', !!token);

    if (!token) {
      console.log('❌ No auth token found - user is not logged in');
      return null;
    }

    // Always refresh from backend when token exists to avoid stale identity.
    const freshUser = await fetchAndStoreUserProfile();
    if (freshUser?.id || freshUser?._id) {
      return freshUser;
    }

    // Fallback only if profile fetch fails unexpectedly.
    console.warn('[USER AUTH DEBUG] Falling back to cached user after profile fetch failure');
    const userDataStr = await AsyncStorage.getItem('user');
    if (!userDataStr) return null;

    const userData = JSON.parse(userDataStr);
    if (!userData.id && userData._id) {
      userData.id = userData._id;
    }
    return userData.id || userData._id ? userData : null;
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user ? (user.id || user._id || null) : null;
}

export async function getCurrentUserPhone(): Promise<string | null> {
  const user = await getCurrentUser();
  return user ? user.phone : null;
}

export async function getCurrentUserName(): Promise<string | null> {
  const user = await getCurrentUser();
  return user ? user.name : null;
}

export async function refreshUserProfile(): Promise<User | null> {
  console.log('🔄 Manually refreshing user profile...');
  
  // Clear existing user data
  await AsyncStorage.removeItem('user');
  
  // Fetch fresh data
  return await fetchAndStoreUserProfile();
}
