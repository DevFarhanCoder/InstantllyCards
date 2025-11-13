# 🔐 Firebase Phone Authentication (OTP) Setup Guide

This guide explains how to set up Firebase Phone Authentication for OTP verification in the InstantllyCards app.

## 📋 Overview

We've migrated from **Fast2SMS** to **Firebase Phone Authentication** for a more reliable, secure, and scalable OTP system.

### Benefits of Firebase Phone Auth:
- ✅ **More reliable** - Better SMS delivery rates globally
- ✅ **More secure** - Built-in fraud protection and reCAPTCHA
- ✅ **Better UX** - Auto-OTP detection on Android
- ✅ **Cost-effective** - Free tier includes 10K verifications/month
- ✅ **Scalable** - No need to manage SMS infrastructure

---

## 🚀 Setup Instructions

### Step 1: Firebase Console Setup (10 minutes)

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project: **InstantllyCards**

2. **Enable Phone Authentication**
   - Go to **Authentication** → **Sign-in method**
   - Enable **Phone** provider
   - Click **Save**

3. **Configure Phone Numbers for Testing (Optional)**
   - Under Phone authentication, click **Phone numbers for testing**
   - Add test phone numbers with test codes for development
   - Example: `+911234567890` → Code: `123456`

4. **Get Your Firebase Config**
   - Go to **Project Settings** (gear icon)
   - Scroll to **Your apps** section
   - Copy your Firebase configuration

---

### Step 2: Install Dependencies

The required packages are already added to `package.json`:

**Frontend (InstantllyCards):**
```json
{
  "@react-native-firebase/app": "^23.4.0",
  "@react-native-firebase/auth": "^21.3.0",
  "firebase": "^11.0.2"
}
```

**Backend (Instantlly-Cards-Backend):**
```json
{
  "firebase-admin": "^12.0.0"
}
```

Run installation:
```bash
# In InstantllyCards folder
cd InstantllyCards
npm install

# In backend folder
cd ../Instantlly-Cards-Backend
npm install
```

---

### Step 3: Configure google-services.json (Android)

1. **Download google-services.json**
   - In Firebase Console → Project Settings
   - Under **Your apps**, select your Android app
   - Download `google-services.json`

2. **Place the file**
   - Copy `google-services.json` to `InstantllyCards/android/app/`

3. **Verify package name matches**
   - Open `google-services.json`
   - Ensure `package_name` is `com.instantllycards.www.twa`

---

### Step 4: Update app.json (Expo Config)

Your `app.json` already includes Firebase plugin:

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app"
    ]
  }
}
```

---

### Step 5: Build Properties Configuration

Your `app.json` already includes necessary build properties:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "usesCleartextTraffic": true
          }
        }
      ]
    ]
  }
}
```

---

### Step 6: Enable SHA-256 Fingerprint (Android)

Firebase Phone Auth requires SHA-256 certificate fingerprints for Android.

1. **Get SHA-256 fingerprint**
   ```powershell
   # For Windows PowerShell
   cd InstantllyCards\android
   
   # For debug keystore
   keytool -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For release keystore (if you have one)
   keytool -list -v -keystore android.keystore -alias instantllycards -storepass YOUR_KEYSTORE_PASSWORD
   ```

2. **Add to Firebase Console**
   - Go to Firebase Console → Project Settings
   - Scroll to **Your apps** → Select your Android app
   - Add SHA certificate fingerprints
   - Click **Save**

---

### Step 7: Test the Integration

1. **Run the app in development**
   ```bash
   cd InstantllyCards
   npx expo run:android
   ```

2. **Test signup flow**
   - Open the app
   - Go to Signup
   - Enter a phone number
   - Firebase will send OTP automatically
   - Enter the OTP to verify

3. **Check logs**
   ```bash
   # Frontend logs
   npx react-native log-android
   
   # Backend logs
   cd ../Instantlly-Cards-Backend
   npm run dev
   ```

---

## 🔧 Configuration Files Modified

### Frontend Changes:

1. **lib/firebase.ts** - New file for Firebase Phone Auth
   - Exports `sendOTPViaFirebase()` - Sends OTP via Firebase
   - Exports `verifyOTPViaFirebase()` - Verifies OTP code

2. **app/(auth)/signup.tsx** - Updated signup flow
   - Uses Firebase for OTP sending
   - Stores Firebase confirmation object
   - Verifies OTP through Firebase

3. **package.json** - Added Firebase dependencies
   - `@react-native-firebase/auth` for phone authentication
   - `firebase` for web compatibility

### Backend Changes:

1. **src/routes/otp.ts** - Simplified OTP routes
   - Removed Fast2SMS integration
   - OTP generation for backend verification
   - Keeps verify-otp endpoint for fallback

2. **package.json** - Added Firebase Admin
   - `firebase-admin` for server-side verification (optional)

---

## 📱 How It Works

### OTP Flow:

```
User enters phone → Firebase sends SMS → User enters OTP → Firebase verifies → App proceeds
```

1. **User enters phone number**
   - App checks if phone exists in database
   - If new, proceeds to send OTP

2. **Firebase sends SMS**
   - `sendOTPViaFirebase()` calls Firebase
   - Firebase automatically sends SMS
   - Returns confirmation object

3. **User enters OTP**
   - App calls `verifyOTPViaFirebase()`
   - Firebase verifies the code
   - Returns success or error

4. **App proceeds to signup**
   - Phone verified by Firebase
   - User completes name and password
   - Account created in database

---

## 🐛 Troubleshooting

### Issue: "SMS not received"

**Solutions:**
- Check Firebase quota (10K/month on free tier)
- Verify phone number format (include country code)
- Check Firebase Console for delivery status
- Add test phone numbers for development

### Issue: "Invalid phone number"

**Solutions:**
- Ensure format is: `+[country code][number]`
- Example: `+911234567890` (India)
- Remove spaces, dashes, or special characters

### Issue: "Too many requests"

**Solutions:**
- Firebase rate limits: 10 SMS per day per number
- Wait 24 hours before retrying
- Use test phone numbers during development

### Issue: "Build fails with Firebase"

**Solutions:**
- Run `npx expo prebuild --clean`
- Delete `android/` and `ios/` folders
- Run `npx expo run:android` again
- Ensure `google-services.json` is in correct location

---

## 🔒 Security Best Practices

1. **Never expose Firebase config in public repos**
   - Add `google-services.json` to `.gitignore`
   - Use environment variables for sensitive data

2. **Enable App Check (recommended)**
   - Protects against abuse
   - Go to Firebase Console → App Check
   - Enable for your app

3. **Set up rate limiting**
   - Firebase has built-in rate limits
   - Implement additional rate limiting in backend

4. **Use reCAPTCHA**
   - Automatically enabled by Firebase
   - Protects against bots

---

## 📊 Firebase Quota & Pricing

### Free Tier (Spark Plan):
- 10,000 phone verifications/month
- Perfect for development and small apps

### Paid Tier (Blaze Plan):
- Pay as you go
- $0.01 - $0.06 per verification (varies by country)
- India: ~$0.015 per SMS

**Current usage**: Check Firebase Console → Usage tab

---

## 🔄 Migration from Fast2SMS

### What Changed:

| Feature | Fast2SMS | Firebase |
|---------|----------|----------|
| SMS Delivery | Manual API call | Automatic |
| OTP Generation | Backend | Firebase |
| Verification | Backend only | Firebase + Backend |
| Rate Limiting | Manual | Automatic |
| Security | Basic | Advanced (reCAPTCHA) |
| Cost | ~₹0.20/SMS | ~₹1.20/SMS |

### Migration Steps:

1. ✅ Backend updated to remove Fast2SMS
2. ✅ Frontend updated to use Firebase
3. ✅ Dependencies installed
4. ⏳ Need to configure Firebase Console
5. ⏳ Need to test with real phone numbers

---

## 📞 Support

If you encounter issues:

1. **Check Firebase Console logs**
   - Go to Firebase Console → Authentication → Usage
   - Check for error details

2. **Check app logs**
   - Frontend: `npx react-native log-android`
   - Backend: Check console output

3. **Common fixes**
   - Clear app data and cache
   - Rebuild the app
   - Verify `google-services.json` is correct
   - Check SHA-256 fingerprint is added

---

## ✅ Next Steps

After setup:

1. **Test with real phone numbers**
2. **Monitor Firebase quota usage**
3. **Set up App Check for security**
4. **Consider upgrading to Blaze plan if needed**
5. **Add analytics to track OTP success rate**

---

## 📝 Notes

- Firebase automatically handles SMS delivery globally
- No need to manage SMS gateway credentials
- Built-in fraud protection and rate limiting
- Auto-OTP detection works on Android 6.0+
- iOS requires user to manually enter OTP

---

**Last Updated**: November 12, 2025
**Version**: 1.0.0
