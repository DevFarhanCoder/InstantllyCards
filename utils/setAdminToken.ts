import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Store admin authentication token for creating advertisements
 * Call this function once with the admin token from the web dashboard
 */
export async function setAdminToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem('adminAuthToken', token);
    console.log('✅ Admin token stored successfully');
  } catch (error) {
    console.error('❌ Failed to store admin token:', error);
    throw error;
  }
}

/**
 * Get the stored admin token
 */
export async function getAdminToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('adminAuthToken');
  } catch (error) {
    console.error('❌ Failed to get admin token:', error);
    return null;
  }
}

/**
 * Remove admin token (logout)
 */
export async function clearAdminToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem('adminAuthToken');
    console.log('✅ Admin token cleared');
  } catch (error) {
    console.error('❌ Failed to clear admin token:', error);
  }
}

/**
 * TEMPORARY: For testing, you can uncomment this and run it once to set a token
 * Get your token from the web dashboard (localStorage.getItem('authToken'))
 */
/*
export async function setTestAdminToken() {
  const token = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual token from web dashboard
  await setAdminToken(token);
}
*/
