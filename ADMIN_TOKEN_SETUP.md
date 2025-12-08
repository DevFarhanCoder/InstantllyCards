# Admin Token Setup for Advertisement Creation

## Problem
The mobile app shows "Missing token" error when creating advertisements because it needs admin authentication.

## Solution

You need to set the admin authentication token in the mobile app. Follow these steps:

### Step 1: Get Your Admin Token from Web Dashboard

1. Open the web dashboard: https://instantlly-ads.vercel.app/login
2. Log in with your admin credentials
3. Open browser console (F12 or Right-click → Inspect → Console)
4. Run this command:
   ```javascript
   localStorage.getItem('authToken')
   ```
5. Copy the token (it will be a long string like `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 2: Set the Token in Mobile App

#### Option A: Using Expo Dev Tools (Recommended)

1. Open your mobile app in Expo Go
2. Press `Shift + M` to open the menu
3. Open the console/debug panel
4. Run this code in the console:
   ```javascript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   await AsyncStorage.setItem('adminAuthToken', 'YOUR_TOKEN_HERE');
   ```

#### Option B: Using Code (One-Time Setup)

1. Open `InstantllyCards/App.tsx` or `InstantllyCards/app/_layout.tsx`
2. Add this code at the top (ONE TIME ONLY):
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import { useEffect } from 'react';
   
   // In your component:
   useEffect(() => {
     AsyncStorage.setItem('adminAuthToken', 'YOUR_TOKEN_HERE');
   }, []);
   ```
3. Reload the app
4. **IMPORTANT:** Remove this code after the app runs once!

#### Option C: Using the Utility Function

1. Open `InstantllyCards/utils/adminTokenSetup.ts`
2. Uncomment the `setTestAdminToken` function
3. Replace `YOUR_ADMIN_TOKEN_HERE` with your actual token
4. Import and call it once from your app entry point
5. Remove the code after setup

### Step 3: Verify

1. Reload the mobile app
2. Go to the "Ads" tab
3. Try creating a new advertisement
4. It should work now! ✅

## Security Notes

⚠️ **Important:**
- The admin token gives full access to create/edit/delete advertisements
- Keep this token secure
- Never commit the token to git
- Tokens expire after a period of time - you'll need to refresh if it expires

## Token Expiration

If you get "Authentication Failed" or "Session Expired" errors:

1. Log out and log back into the web dashboard
2. Get a fresh token using Step 1 above
3. Update the mobile app token using Step 2

## Alternative: Admin Login Screen (Future Enhancement)

For a better solution, we could add an admin login screen in the mobile app. This would:
- Allow entering admin credentials directly in the app
- Automatically handle token refresh
- Provide logout functionality

Would you like me to implement this? Let me know!
