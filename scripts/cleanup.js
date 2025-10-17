// Simple script to clear all groups from local storage and backend
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

export async function clearAllGroups() {
  try {
    console.log('🧹 Starting cleanup process...');
    
    // Clear all group-related data from AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const groupKeys = keys.filter(key => 
      key.startsWith('group_') || 
      key.startsWith('groups') || 
      key.startsWith('user_groups_') ||
      key.startsWith('group_messages_')
    );
    
    if (groupKeys.length > 0) {
      await AsyncStorage.multiRemove(groupKeys);
      console.log(`🗑️ Cleared ${groupKeys.length} local storage keys`);
    }
    
    // Clear all groups from backend
    try {
      const response = await api.delete('/groups');
      if (response && response.success) {
        console.log('✅ All groups cleared from backend');
      }
    } catch (apiError) {
      console.error('❌ Failed to clear backend groups:', apiError);
    }
    
    console.log('✅ Cleanup completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return false;
  }
}