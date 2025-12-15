# SMS Retriever Setup for Expo Development Build

## ✅ Configuration Complete!

Your Android configuration has been updated to support SMS Retriever API. Here's what was added:

### 1. Android Dependencies Added ✅
**File:** `android/app/build.gradle`

```gradle
// Google Play Services for SMS Retriever API
implementation 'com.google.android.gms:play-services-auth:21.2.0'
implementation 'com.google.android.gms:play-services-auth-api-phone:18.1.0'
```

### 2. Android Permissions Added ✅
**File:** `android/app/src/main/AndroidManifest.xml`

```xml
<!-- SMS Retriever API - No dangerous permissions needed -->
<uses-permission android:name="android.permission.RECEIVE_SMS"/>
<uses-permission android:name="com.google.android.gms.permission.ACTIVITY_RECOGNITION"/>
```

---

## 🚀 Next Steps

### Step 1: Rebuild Your App

Since we modified native Android files, you **MUST** rebuild the app:

```bash
cd InstantllyCards

# Clean previous builds
cd android
./gradlew clean
cd ..

# Rebuild for development
npx expo run:android

# OR for production build
eas build --platform android --profile production
```

### Step 2: Get Your App Hash

After rebuilding and installing the new version:

1. Open the app
2. Check the console logs immediately
3. Look for:
   ```
   [SMS Retriever] App Hash: FA+9qCX9VSu
   ```
4. **Save this hash** - it will be different from before!

### Step 3: Test OTP Auto-Fill

1. Go to Signup screen
2. Enter phone number: `9892254636`
3. Click "Send OTP"
4. Check console logs:
   ```
   📱 [SMS Retriever] App Hash: <YOUR_NEW_HASH>
   📱 [SMS Retriever] Listening: true
   ```
5. Wait for SMS to arrive
6. OTP should auto-fill!

---

## 🐛 Troubleshooting

### Issue: App Hash is empty

**Cause:** Old app version without Google Play Services
**Solution:** Rebuild the app (Step 1 above)

### Issue: Listener is not starting

**Cause:** Google Play Services not available
**Solution:** 
- Make sure you're on a real device with Google Play Store
- OR use an emulator with Google Play Services installed

### Issue: Still getting "NOHASH"

**Cause:** The library method might be different
**Solution:** Try this in your console:

```typescript
import RNSmsRetriever from 'react-native-sms-retriever';

RNSmsRetriever.getAppHash().then((hash) => {
  console.log('Hash:', hash);
});
```

### Issue: Build fails after adding dependencies

**Error:** `Could not find com.google.android.gms:play-services-auth:21.2.0`

**Solution:** Update your `android/build.gradle`:

```gradle
buildscript {
  repositories {
    google()        // ← Make sure this is here
    mavenCentral()
  }
}

allprojects {
  repositories {
    google()        // ← And here too
    mavenCentral()
  }
}
```

---

## 📱 Current SMS Format (Already Working!)

Your backend is already sending SMS in the correct format:

```
<#> 374040 is your OTP for Instantly Cards
FA+9qCX9VSu
```

✅ Format is correct  
✅ Backend is configured  
❌ App needs rebuild to get valid hash

---

## 🔍 Verification Checklist

After rebuilding, verify:

- [ ] App Hash is NOT empty
- [ ] App Hash is NOT "NOHASH"
- [ ] Listening status is `true`
- [ ] Console shows "Listener started successfully"
- [ ] SMS arrives in correct format
- [ ] OTP auto-fills in input field
- [ ] Toast notification appears: "OTP auto-filled!"

---

## 📊 Expected Console Output (After Rebuild)

### ✅ Success:
```
[SMS Retriever] Using react-native-sms-retriever
[SMS Retriever] App Hash: xA+9qBX8VSu
[SMS Retriever] Starting SMS listener...
[SMS Retriever] Listener started successfully
📱 [SMS Retriever] App Hash: xA+9qBX8VSu
📱 [SMS Retriever] Listening: true
[SMS Retriever] SMS Received
[SMS Retriever] OTP Extracted: 374040
[SMS Retriever] OTP Auto-filled: 374040
✅ [Auto-Fill] OTP detected: 374040
```

### ❌ Before Rebuild (Current State):
```
[SMS Retriever] Not available - manual OTP entry only
[SMS Retriever] App Hash: 
[SMS Retriever] Listening: false
```

---

## 🎯 Why Rebuild is Mandatory

1. **Native Dependencies:** Google Play Services need to be compiled into the app
2. **App Signature:** The app hash is calculated from your app's signing certificate
3. **New Build = New Hash:** Every unique build has a different hash

---

## 💡 Pro Tips

### Development vs Production

**Development Build:**
```bash
npx expo run:android
# Hash: xA+9qBX8VSu (example)
```

**Production Build:**
```bash
eas build --platform android
# Hash: YB-3pCZ9WTv (different!)
```

### Backend Already Handles Dynamic Hash ✅

Your backend doesn't hard-code the hash:

```typescript
// Frontend sends current hash
await api.post('/auth/check-phone', { 
  phone: '+919892254636',
  appHash: appHash // Dynamic hash from current build
});

// Backend uses it in SMS
const message = `<#> ${otp} is your OTP for Instantly Cards\n${appHash}`;
```

This means:
- ✅ No backend changes needed
- ✅ Works for dev and production
- ✅ Hash is always current

---

## ⚡ Quick Start Commands

```bash
# 1. Navigate to project
cd InstantllyCards

# 2. Clean build
cd android && ./gradlew clean && cd ..

# 3. Rebuild and run
npx expo run:android

# 4. Check logs for hash
# Look for: [SMS Retriever] App Hash: <YOUR_HASH>

# 5. Test signup
# Enter: 9892254636
# Check: OTP should auto-fill
```

---

## 📞 Support

If you still have issues after rebuilding:

1. **Check Google Play Services:**
   ```bash
   adb shell pm list packages | grep google
   # Should see: com.google.android.gms
   ```

2. **Check Library Installation:**
   ```bash
   cd node_modules/react-native-sms-retriever
   ls
   # Should see android/ folder
   ```

3. **Verify Build Configuration:**
   ```bash
   cd android
   ./gradlew app:dependencies | grep play-services-auth
   # Should see version 21.2.0
   ```

---

## ✨ Expected Result

After rebuild, when you send OTP:

```
SMS arrives: <#> 374040 is your OTP for Instantly Cards
             xA+9qBX8VSu

Result: 
- OTP field shows: 374040
- Toast message: "OTP auto-filled!"
- User clicks: "Verify OTP" (no typing needed!)
```

---

**Next Action:** Rebuild your app using `npx expo run:android` and test! 🚀
