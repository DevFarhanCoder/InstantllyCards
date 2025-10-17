# 🔍 Debugging Push Notification Registration

## Current Status: Tokens NOT Registered ❌

You've installed the new APK and logged in, but tokens are still NOT SET. Let's find out why.

## 🔧 Debugging Steps

### Step 1: Check Device Logs

Connect your Android phone to computer via USB and run:

```powershell
cd "c:\Users\user3\Documents\App\InstantllyCards"
npx react-native log-android
```

**What to look for:**

✅ **SUCCESS - Token registered:**
```
🚀 Initializing app systems...
📱 [REGISTER] Starting push notification registration...
📱 [REGISTER] Checking notification permissions...
📱 [REGISTER] Current permission status: granted
✅ [REGISTER] Notification permissions granted
📱 [REGISTER] Getting Expo push token...
📱 [REGISTER] Project ID: 4dd09b65-9c0b-4025-ac16-dd98834e90de
🎉 [REGISTER] Push token obtained successfully: ExponentPushToken[xxx...]
💾 [REGISTER] Token saved to AsyncStorage
🔄 [BACKEND] User not authenticated - storing token as pending
💾 [BACKEND] Token saved as pending, will register after login
```

Then after login:
```
🔍 [PENDING] Checking for pending push token...
📲 [PENDING] Found pending token, registering now...
🔄 [BACKEND] User authenticated, sending token to server...
✅ [BACKEND] Token registered successfully
🗑️ [BACKEND] Cleared pending token
```

❌ **FAILURE - Common errors:**

**Error 1: Permission Denied**
```
❌ [REGISTER] Notification permissions not granted
```
**Fix**: Go to Settings → Apps → InstantllyCards → Permissions → Notifications → Allow

**Error 2: No Project ID**
```
❌ [REGISTER] No project ID found in config
```
**Fix**: This means the APK wasn't built correctly (shouldn't happen with your build)

**Error 3: Network Error**
```
❌ [BACKEND] Failed to register token: Network error
```
**Fix**: Check internet connection

**Error 4: Backend Error**
```
❌ [BACKEND] Failed to register token: 401 Unauthorized
```
**Fix**: Login expired, try logging in again

**Error 5: Expo Go Token (Invalid)**
```
⚠️  [TOKEN-REGISTER] Received expo-go-local-mode token - rejecting!
```
**Fix**: You're using Expo Go instead of the production APK

### Step 2: Check Notification Permissions Manually

On your Android phone:
1. Go to **Settings**
2. **Apps** → **InstantllyCards**
3. **Permissions** → **Notifications**
4. Make sure it's **Allowed** ✅

### Step 3: Check if You're Using the Correct APK

Make sure you:
- ✅ Downloaded from: `https://expo.dev/artifacts/eas/gMhyiCtiNaBqKtxLKpb9sC.apk`
- ✅ Uninstalled the old version first
- ✅ Installed the NEW APK (version 1.0.13)
- ✅ Using physical device (NOT emulator)

To check app version:
- The app should show version 1.0.13 somewhere (or check in App Info)

### Step 4: Try Fresh Install

If logs show errors:

1. **Uninstall completely**:
   - Settings → Apps → InstantllyCards → Uninstall
   - Clear all data

2. **Reinstall**:
   - Install the NEW APK again
   - Grant ALL permissions when asked
   - Open app
   - Watch logs while app opens
   - Login
   - Watch logs during login

3. **Check logs for success messages**

### Step 5: Manual Token Test

If the app isn't calling the registration, let's verify the backend endpoint works:

```powershell
# First, login to get a token (use Postman or curl)
# Then manually register a test token:

curl -X POST https://instantlly-cards-backend.onrender.com/api/notifications/register-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "pushToken": "ExponentPushToken[TEST123]",
    "platform": "android",
    "deviceInfo": {
      "brand": "Test",
      "modelName": "TestDevice"
    }
  }'
```

If this works, the backend is fine - problem is in the app.

## 🎯 Most Likely Issues

### Issue #1: Permissions Not Granted (80% likely)

**Check**: 
```powershell
npx react-native log-android
```

Look for:
```
❌ [REGISTER] Notification permissions not granted
```

**Fix**: Go to phone Settings → Apps → InstantllyCards → Permissions → Enable Notifications

### Issue #2: Using Expo Go Instead of APK (10% likely)

**Check**: Are you running the app through "Expo Go" app?

**Fix**: Must use the standalone APK, NOT Expo Go!

### Issue #3: App Never Called registerForPushNotifications() (5% likely)

**Check logs for**:
```
🚀 Initializing app systems...
```

If you DON'T see this, the app didn't start properly.

**Fix**: Force close app and reopen, watch logs

### Issue #4: Network Error During Registration (5% likely)

**Check logs for**:
```
❌ [BACKEND] Failed to register token: Network error
```

**Fix**: 
- Check internet connection
- Try on WiFi instead of mobile data
- Check if backend is accessible

## 📋 Quick Checklist

Run through this checklist:

- [ ] Downloaded NEW APK from: https://expo.dev/artifacts/eas/gMhyiCtiNaBqKtxLKpb9sC.apk
- [ ] Uninstalled old version completely
- [ ] Installed NEW APK
- [ ] Using physical Android device (not emulator)
- [ ] Granted notification permissions
- [ ] Phone has internet connection
- [ ] Opened app and watched logs
- [ ] Logged in successfully
- [ ] Checked logs for "✅ [BACKEND] Token registered successfully"

## 🔄 What To Do Right Now

1. **Connect phone to computer via USB**

2. **Enable USB debugging** (if not already):
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable USB Debugging

3. **Run this command**:
   ```powershell
   cd "c:\Users\user3\Documents\App\InstantllyCards"
   npx react-native log-android
   ```

4. **Force close the app** on your phone

5. **Open the app again** while watching the logs

6. **Copy and send me** the complete log output

This will show us exactly what's happening (or not happening) during token registration!

## 📞 Expected Next Steps

Based on logs, we'll know:
- ✅ If permissions were granted
- ✅ If token was obtained
- ✅ If backend call succeeded
- ❌ What error occurred (if any)

Then we can fix the specific issue! 🎯
