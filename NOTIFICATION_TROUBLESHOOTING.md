# 🔔 Notification Troubleshooting Guide

## 🎯 Two Critical Questions

Before we troubleshoot, I need to know:

### Question 1: Where are you testing?
- [ ] **Expo Go app** (won't work - push notifications disabled in SDK 53+)
- [ ] **Development build** (should work)
- [ ] **Production APK** (should work after proper setup)
- [ ] **Simulator/Emulator** (won't work - needs real device)

### Question 2: What exactly isn't working?
- [ ] **Not receiving push token** (registration fails)
- [ ] **Token registered but no notifications received** (backend issue)
- [ ] **Notifications received but app doesn't open** (navigation issue)
- [ ] **Error messages during registration** (what error?)

---

## 🔍 Diagnostic Steps

### Step 1: Check Your Test Environment

**❌ WILL NOT WORK:**
- Expo Go (SDK 53+ disabled push notifications)
- Android Emulator (no Google Play Services)
- iOS Simulator (no push notification support)

**✅ WILL WORK:**
- Real Android device with production APK
- Real Android device with development build
- Real iOS device with development build

---

### Step 2: Verify APK Was Built with Firebase Config

**Critical**: Your APK must be built AFTER adding `google-services.json`

Check your build:
1. When did you download `google-services.json`? _______________
2. When did you last build the APK? _______________
3. Did you rebuild AFTER adding google-services.json? [ ] Yes [ ] No

**If NO**: You MUST rebuild the APK!

```bash
eas build --platform android --profile production
```

---

### Step 3: Check Notification Permissions

On your Android device:
1. Go to: **Settings** → **Apps** → **InstantllyCards**
2. Tap **Notifications**
3. Make sure: **All InstantllyCards notifications** is **ON**
4. Check: **Messages**, **Groups**, **default** channels are all **ON**

---

### Step 4: Check Push Token Registration

#### In the App Logs

When you open the app and log in, you should see these logs:

```
📱 [REGISTER] Starting push notification registration...
📱 [REGISTER] Checking notification permissions...
✅ [REGISTER] Notification permissions granted
📱 [REGISTER] Getting Expo push token...
📱 [REGISTER] Project ID: 4dd09b65-9c0b-4025-ac16-dd98834e90de
🎉 [REGISTER] Push token obtained successfully: ExponentPushToken[...]
💾 [REGISTER] Token saved to AsyncStorage
🔄 [BACKEND] Registering token with backend...
✅ [BACKEND] Token registered successfully
```

**What logs do you see?**
- [ ] All green checkmarks (✅)
- [ ] Stops at "Getting Expo push token" (Firebase issue)
- [ ] "Token registration failed" (Backend issue)
- [ ] No logs at all (Code not running)

---

### Step 5: Verify Backend Received Token

Check your backend database:
1. Find your user in MongoDB
2. Check if `pushToken` field exists
3. Check if `pushToken` starts with `ExponentPushToken[`

**Example query:**
```javascript
db.users.findOne({ email: "your@email.com" })
```

Look for:
```json
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "platform": "android",
  "pushTokenUpdatedAt": "2025-10-04T..."
}
```

**Do you have a pushToken?**
- [ ] Yes, token is saved
- [ ] No, field is empty/missing
- [ ] Don't know how to check

---

### Step 6: Test Notification Manually

Let's test if the backend can send notifications:

#### Create a test script:

Create `test-notification.js` in your backend:

```javascript
const { Expo } = require('expo-server-sdk');

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN
});

async function testNotification(pushToken) {
  const message = {
    to: pushToken,
    sound: 'default',
    title: '🧪 Test Notification',
    body: 'If you see this, notifications work!',
    data: { test: true },
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    console.log('✅ Notification sent!', tickets);
  } catch (error) {
    console.error('❌ Failed to send:', error);
  }
}

// Replace with YOUR actual push token
testNotification('ExponentPushToken[YOUR_TOKEN_HERE]');
```

Run it:
```bash
cd Instantlly-Cards-Backend
node test-notification.js
```

**Did you receive the notification?**
- [ ] Yes! (Backend works, issue is with triggers)
- [ ] No (Firebase/Expo issue)
- [ ] Error (what error?)

---

## 🐛 Common Issues & Solutions

### Issue 1: "No push token obtained"

**Symptoms:**
- Log stops at "Getting Expo push token"
- No `ExponentPushToken[...]` generated

**Solutions:**

#### A. Firebase Not Configured
```bash
# Check if google-services.json exists
ls google-services.json

# If missing, download from Firebase Console
```

#### B. Project ID Mismatch
Check `app.json`:
```json
"extra": {
  "eas": {
    "projectId": "4dd09b65-9c0b-4025-ac16-dd98834e90de"
  }
}
```

#### C. APK Built Before Firebase Config
```bash
# Rebuild APK
eas build --platform android --profile production
```

---

### Issue 2: "Token registered but no notifications"

**Symptoms:**
- Token successfully registered
- No notifications received when messages sent

**Solutions:**

#### A. Check Backend Logs
When you send a message, backend should log:
```
📱 Sending notification to: ExponentPushToken[...]
✅ Notification sent successfully
```

If not logged, notification function not being called.

#### B. Verify Notification Triggers

Check if these routes call notification functions:

**Messages Route** (`src/routes/messages.ts`):
```typescript
// Should have this after creating message
await sendIndividualMessageNotification(
  recipientUser.pushToken,
  sender.name,
  messageContent,
  // ...
);
```

**Cards Route** (`src/routes/cards.ts`):
```typescript
// Should have this after creating card
await sendCardCreationNotification(
  contactUser.pushToken,
  creator.name,
  cardTitle,
  // ...
);
```

#### C. Check Recipient Has Token
```javascript
// In backend, before sending notification
console.log('Recipient push token:', recipientUser.pushToken);
```

If `null` or `undefined`, recipient needs to log in to register token.

---

### Issue 3: "Notifications work in dev, not in production APK"

**Symptoms:**
- Development build: ✅ Works
- Production APK: ❌ Doesn't work

**Solution:**

Production APK MUST be built with:
1. ✅ `google-services.json` in project root
2. ✅ `app.json` has `googleServicesFile` config
3. ✅ Firebase Cloud Messaging API enabled

**Rebuild production:**
```bash
# Make sure google-services.json exists
ls google-services.json

# Rebuild
eas build --platform android --profile production

# Wait 10-15 minutes
# Download and install new APK
```

---

### Issue 4: "App doesn't open when tapping notification"

**Symptoms:**
- Notifications received ✅
- Tapping does nothing ❌

**Solution:**

Check notification data includes `type`:

```typescript
// Backend
await sendPushNotification(
  pushToken,
  'Title',
  'Body',
  {
    type: 'new_message',  // ← REQUIRED
    senderId: '...',
    // other data
  }
);
```

Frontend handles types:
- `new_message`
- `group_message`
- `contact_joined`
- `card_created`
- `card_shared`
- `group_invite`

---

## ✅ Complete Checklist

### Setup Checklist
- [ ] `google-services.json` exists in project root
- [ ] `app.json` has `googleServicesFile` config
- [ ] Firebase Cloud Messaging API (V1) enabled
- [ ] APK rebuilt AFTER adding Firebase config
- [ ] Old APK uninstalled before installing new one
- [ ] Testing on **real Android device** (not emulator)

### Registration Checklist
- [ ] App permissions: Notifications **ALLOWED**
- [ ] User logged in (token registers after auth)
- [ ] Logs show "Push token obtained successfully"
- [ ] Logs show "Token registered successfully"
- [ ] Database has user's `pushToken` field populated

### Backend Checklist
- [ ] Backend is running and accessible
- [ ] Backend has `expo-server-sdk` installed
- [ ] `EXPO_ACCESS_TOKEN` env variable set (optional but recommended)
- [ ] Notification functions imported in routes
- [ ] Notification functions called after actions
- [ ] Recipient user has valid `pushToken`

### Testing Checklist
- [ ] Send message with app **completely closed**
- [ ] Check device notification tray
- [ ] Tap notification
- [ ] App opens to correct screen

---

## 🔬 Advanced Debugging

### Enable Verbose Logging

Add to `lib/notifications-production-v2.ts`:

```typescript
// At the top
const DEBUG = true;

// In registerForPushNotifications
if (DEBUG) {
  console.log('📱 [DEBUG] Device info:', {
    brand: Device.brand,
    model: Device.modelName,
    os: Device.osName,
    osVersion: Device.osVersion,
  });
  console.log('📱 [DEBUG] Expo config:', Constants.expoConfig?.extra);
}
```

### Test Local Notifications

If push notifications don't work, test local notifications:

```typescript
import { sendLocalNotification } from '@/lib/notifications-production-v2';

// In your component
sendLocalNotification(
  'Test',
  'Local notifications work!',
  { test: true }
);
```

If local works but push doesn't → Firebase/backend issue  
If local doesn't work → Permission/config issue

---

## 📞 Still Not Working?

Please provide:

1. **Environment:**
   - [ ] Expo Go / [ ] Dev Build / [ ] Production APK
   - Device model: _______________
   - Android version: _______________

2. **Logs from app startup:**
   ```
   (Paste logs here)
   ```

3. **Backend logs when sending message:**
   ```
   (Paste logs here)
   ```

4. **Database check:**
   - User has pushToken? [ ] Yes [ ] No
   - Token value: `_______________`

5. **What you've tried:**
   - [ ] Rebuilt APK after adding google-services.json
   - [ ] Checked device notification permissions
   - [ ] Tested on real device (not emulator)
   - [ ] Verified Firebase Cloud Messaging enabled
   - [ ] Checked backend is calling notification functions

With this information, I can pinpoint the exact issue! 🎯
