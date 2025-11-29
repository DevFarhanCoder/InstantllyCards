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
      _id: string;
      name: string;
      phone: string;
      email?: string;
      profilePicture?: string;
      about?: string;
    }>('/auth/profile');
    
    if (response && response._id) {
      const userData: User = {
        id: response._id,
        _id: response._id,
        name: response.name,
        phone: response.phone,
        email: response.email,
        profilePicture: response.profilePicture,
        about: response.about || 'Available'
      };
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('✅ User profile fetched and stored:', userData.name);
      
      return userData;
    } else {
      console.log('❌ Invalid response from profile endpoint');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log('🔍 Getting current user from AsyncStorage...');
    const userDataStr = await AsyncStorage.getItem('user');
    
    if (!userDataStr) {
      console.log('❌ No user data found in AsyncStorage');
      
      // Check if there's a token
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      if (token) {
        console.log('🔄 Token exists but no user data. Fetching from backend...');
        return await fetchAndStoreUserProfile();
      }
      
      return null;
    }

    const userData = JSON.parse(userDataStr);
    console.log('✅ User data retrieved:', JSON.stringify(userData, null, 2));
    
    // Ensure we have a consistent id field
    if (!userData.id && userData._id) {
      userData.id = userData._id;
      console.log('🔄 Fixed user ID field');
    }
    
    if (!userData.id && !userData._id) {
      console.log('❌ User data has no ID field');
      return null;
    }
    
    return userData;
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user ? (user.id || user._id || null) : null;
}

export async function refreshUserProfile(): Promise<User | null> {
  console.log('🔄 Manually refreshing user profile...');
  
  // Clear existing user data
  await AsyncStorage.removeItem('user');
  
  // Fetch fresh data
  return await fetchAndStoreUserProfile();
}