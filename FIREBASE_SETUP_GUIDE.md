# 🔔 Firebase Push Notifications Setup Guide

## ⚠️ CRITICAL: Why Notifications Don't Work in APK

Your notification code is **100% correct**, but **production APK builds** require Firebase Cloud Messaging (FCM) configuration. Without it, Expo cannot send push notifications to your app.

---

## 📋 What You Need to Do

### Step 1: Create Firebase Project (5 minutes)

1. Go to **[Firebase Console](https://console.firebase.google.com/)**
2. Click **"Add project"** or select existing project
3. Enter project name: `InstantllyCards` (or any name)
4. **Disable Google Analytics** (not needed for notifications)
5. Click **"Create project"**

---

### Step 2: Add Android App to Firebase

1. In Firebase Console, click **"Add app"** → Select **Android icon**
2. Enter the following details:
   - **Android package name**: `com.instantllycards.www.twa`
     *(This MUST match the package in app.json)*
   - **App nickname**: `InstantllyCards Android` (optional)
   - **SHA-1 certificate**: Leave blank for now
3. Click **"Register app"**

---

### Step 3: Download google-services.json

1. Firebase will generate your `google-services.json` file
2. Click **"Download google-services.json"**
3. **IMPORTANT**: Place this file in the **root of InstantllyCards folder**:
   ```
   InstantllyCards/
   ├── google-services.json  ← PUT IT HERE
   ├── app.json
   ├── package.json
   └── ...
   ```

---

### Step 4: Enable Firebase Cloud Messaging (FCM)

1. In Firebase Console sidebar, go to **"Build"** → **"Cloud Messaging"**
2. If prompted, click **"Get started"**
3. You should see **"Cloud Messaging API (Legacy)"** and **"Firebase Cloud Messaging API (V1)"**
4. **Enable Firebase Cloud Messaging API (V1)**:
   - Click the **3-dot menu** next to "Cloud Messaging API"
   - Select **"Manage API in Google Cloud Console"**
   - Click **"Enable"** if it's disabled

---

### Step 5: Get FCM Server Key (for Expo backend)

1. In Firebase Console, click **⚙️ Settings** → **"Project settings"**
2. Go to **"Cloud Messaging"** tab
3. Under **"Cloud Messaging API (Legacy)"**, you'll see:
   - **Server key**: `AAAA...` (long key)
4. **Copy this Server Key**

**IMPORTANT**: While Expo uses V1 API, having the legacy key doesn't hurt and some services still use it.

---

### Step 6: Configure Expo Project (Already Done ✅)

The following is **already configured** in your `app.json`:

```json
"android": {
  "googleServicesFile": "./google-services.json"
}
```

✅ No action needed - this tells Expo where to find your Firebase config.

---

### Step 7: Verify Backend Configuration

Your backend (`pushNotifications.ts`) uses:
- ✅ `expo-server-sdk` - Correct
- ✅ FCM V1 API - Correct
- ✅ `EXPO_ACCESS_TOKEN` for higher rate limits

**Backend is correctly configured!** No changes needed.

---

### Step 8: Rebuild Your APK

After placing `google-services.json` in the project root:

```bash
# Build new APK with Firebase config
eas build --platform android --profile preview
```

**Why rebuild?**
- The `google-services.json` file is **compiled into your APK** during build
- Changes to this file require a **new build**
- After rebuild, notifications will work in production!

---

## 🧪 Testing Notifications

### Test in Development (Expo Go won't work for SDK 53+)

Use **development build**:
```bash
eas build --platform android --profile development
```

### Test in Production

1. Install the APK on a real Android device
2. Open the app and log in
3. Check logs in terminal:
   ```
   npx expo start
   ```
4. Look for these logs:
   - `📱 [REGISTER] Push token obtained successfully`
   - `✅ [BACKEND] Token registered successfully`

### Trigger Test Notification

Send a message to yourself:
1. Open the app
2. Send yourself a message (or share a card)
3. Close the app completely (swipe away from recent apps)
4. **You should receive a push notification!**

---

## 🔍 Troubleshooting

### "No google-services.json found"
**Solution**: Make sure file is in root folder:
```
InstantllyCards/google-services.json
```

### "Notification permissions not granted"
**Solution**: On first launch, make sure to **ALLOW** notifications when prompted.

### "Token registration failed"
**Solution**: 
1. Check if user is logged in (token registers after auth)
2. Check backend logs for errors
3. Verify `EXPO_ACCESS_TOKEN` is set in backend environment variables

### Still not working?
1. **Rebuild the APK** after adding google-services.json
2. **Uninstall old APK** before installing new one
3. **Check Firebase console** → Cloud Messaging → verify API is enabled
4. **Check device notifications** → System Settings → Apps → InstantllyCards → Enable notifications

---

## 📱 How It Works (Technical Overview)

### 1. App Startup
```
User opens app
  ↓
notifications-production-v2.ts calls registerForPushNotifications()
  ↓
Expo generates push token using Firebase credentials
  ↓
Token sent to backend /notifications/register-token
  ↓
Backend saves token to User.pushToken
```

### 2. Sending Notification
```
User sends message
  ↓
Backend /messages route creates message
  ↓
Calls sendIndividualMessageNotification()
  ↓
pushNotifications.ts gets recipient's pushToken from database
  ↓
Sends notification via expo-server-sdk
  ↓
Expo servers forward to FCM
  ↓
FCM delivers to user's device
```

### 3. Receiving Notification
```
FCM delivers notification
  ↓
App receives in background (even if killed)
  ↓
User taps notification
  ↓
App opens to relevant screen (chat, card, etc.)
```

---

## ✅ Checklist

Before building APK, verify:

- [ ] Firebase project created
- [ ] Android app added to Firebase with package name `com.instantllycards.www.twa`
- [ ] `google-services.json` downloaded
- [ ] `google-services.json` placed in **InstantllyCards/** root folder
- [ ] Firebase Cloud Messaging API (V1) enabled
- [ ] Backend has `EXPO_ACCESS_TOKEN` environment variable (optional but recommended)
- [ ] APK rebuilt after adding google-services.json
- [ ] Old APK uninstalled before installing new one

---

## 🎯 Expected Notifications

After setup, you should receive notifications for:

1. **📨 New Message** (Individual Chat)
   - Title: "{Sender Name}"
   - Body: "{Message text}"
   - Tap → Opens chat with sender

2. **👥 Group Message**
   - Title: "{Group Name}"
   - Body: "{Sender}: {Message text}"
   - Tap → Opens group chat

3. **👤 Contact Joined App**
   - Title: "New contact on InstantllyCards"
   - Body: "{Contact Name} from your contacts joined"
   - Tap → Opens app

4. **💳 Card Shared**
   - Title: "Card Received"
   - Body: "{Sender} sent you a card: {Card Title}"
   - Tap → Opens card details

---

## 🚀 Next Steps

1. **Follow Steps 1-5 above** to get `google-services.json`
2. **Place file in project root**
3. **Rebuild APK**: `eas build --platform android --profile preview`
4. **Install on device and test**
5. **Done!** Notifications will work perfectly 🎉

---

## 📞 Need Help?

If notifications still don't work after following this guide:

1. Share your Firebase console screenshot (Cloud Messaging section)
2. Share logs from the app (look for `[REGISTER]` and `[BACKEND]` logs)
3. Verify the package name in Firebase matches `app.json`

---

**Note**: This entire notification system is **production-ready**. The only missing piece is the Firebase configuration file. Once you add `google-services.json`, everything will work automatically! 🚀
