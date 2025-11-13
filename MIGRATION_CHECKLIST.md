# ✅ Firebase OTP Migration Checklist

Use this checklist to ensure everything is set up correctly.

---

## 📋 Pre-Installation Checklist

- [ ] Read `FIREBASE_OTP_SETUP.md`
- [ ] Read `MIGRATION_SUMMARY.md`
- [ ] Have Firebase Console access
- [ ] Have Google account with Firebase project

---

## 🔧 Installation Steps

### Backend Setup

- [ ] Navigate to `Instantlly-Cards-Backend` folder
- [ ] Run `npm install`
- [ ] Verify `firebase-admin` is installed
- [ ] Start backend with `npm run dev`
- [ ] Check console for errors

### Frontend Setup

- [ ] Navigate to `InstantllyCards` folder
- [ ] Run `npm install`
- [ ] Verify `@react-native-firebase/auth` is installed
- [ ] Verify `firebase` is installed
- [ ] Check `package.json` for new dependencies

---

## 🔥 Firebase Console Configuration

- [ ] Open [Firebase Console](https://console.firebase.google.com/)
- [ ] Select your project: **InstantllyCards**
- [ ] Go to **Authentication** → **Sign-in method**
- [ ] Enable **Phone** authentication provider
- [ ] Click **Save**

### Test Phone Numbers (Development)

- [ ] In Authentication → Sign-in method
- [ ] Scroll to **Phone numbers for testing**
- [ ] Add test phone: `+911234567890`
- [ ] Add test code: `123456`
- [ ] Click **Save**

### SHA-256 Fingerprint (Android)

- [ ] Get debug keystore fingerprint:
  ```powershell
  cd C:\Users\user3\Documents\App\InstantllyCards\android
  keytool -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```
- [ ] Copy the **SHA-256** value
- [ ] Go to Firebase Console → Project Settings
- [ ] Under **Your apps**, select Android app
- [ ] Click **Add fingerprint**
- [ ] Paste SHA-256
- [ ] Click **Save**

### google-services.json

- [ ] Verify file exists at: `InstantllyCards/android/app/google-services.json`
- [ ] Open file and check `package_name` is `com.instantllycards.www.twa`
- [ ] Ensure file is NOT in `.gitignore` (it should be ignored)

---

## 🏗️ Build & Deploy

### Rebuild App

- [ ] Navigate to `InstantllyCards` folder
- [ ] Run `npx expo prebuild --clean`
- [ ] Run `npx expo run:android`
- [ ] Wait for build to complete
- [ ] App should launch on device/emulator

### Start Backend

- [ ] Navigate to `Instantlly-Cards-Backend` folder
- [ ] Run `npm run dev`
- [ ] Check console shows "Server running on port XXXX"
- [ ] No errors in console

---

## 🧪 Testing

### Test Backend API

- [ ] Backend is running
- [ ] Test endpoint: `GET http://localhost:YOUR_PORT/api/auth/debug-config`
- [ ] Should return: `{ "service": "Firebase Phone Authentication" }`

### Test Signup Flow

- [ ] Open app on device/emulator
- [ ] Navigate to Signup screen
- [ ] Enter phone number: `+911234567890` (test number)
- [ ] Click "Send OTP"
- [ ] Should see "OTP sent to your phone number" toast
- [ ] Enter OTP: `123456` (test code)
- [ ] Click "Verify OTP"
- [ ] Should see "Phone number verified!" toast
- [ ] Enter name and password
- [ ] Click "Create Account"
- [ ] Should navigate to home screen

### Test with Real Phone Number

- [ ] Enter your real phone number
- [ ] Click "Send OTP"
- [ ] Check your phone for SMS
- [ ] Enter received OTP
- [ ] Should verify successfully

---

## 🐛 Troubleshooting

### If "Cannot find module '@react-native-firebase/auth'"

- [ ] Run `npm install` in InstantllyCards folder
- [ ] Check `package.json` has `@react-native-firebase/auth`
- [ ] Delete `node_modules` and run `npm install` again

### If "SMS not received" (Real Number)

- [ ] Check Firebase Console → Authentication → Usage
- [ ] Verify phone number format: `+[country][number]`
- [ ] Check Firebase quota (10K/month free tier)
- [ ] Try test phone number instead

### If Build Fails

- [ ] Run `npx expo prebuild --clean`
- [ ] Delete `android/` and `ios/` folders
- [ ] Run `npx expo run:android` again
- [ ] Check `google-services.json` is in correct location

### If Backend Errors

- [ ] Check backend console for error messages
- [ ] Verify `firebase-admin` is installed
- [ ] Restart backend: `npm run dev`

---

## 📊 Monitoring

### After Deployment

- [ ] Monitor Firebase Console → Authentication → Usage
- [ ] Check daily SMS quota usage
- [ ] Monitor success/failure rates
- [ ] Set up alerts for quota limits

### Production Readiness

- [ ] Remove test phone numbers from Firebase Console
- [ ] Enable App Check for security
- [ ] Set up billing alerts
- [ ] Consider Blaze plan if needed (>10K verifications/month)

---

## 🔒 Security Checks

- [ ] `google-services.json` is in `.gitignore`
- [ ] No Firebase credentials in code
- [ ] SHA-256 fingerprint added to Firebase
- [ ] Phone authentication is enabled in Firebase
- [ ] App Check is enabled (recommended for production)

---

## 📚 Documentation

- [ ] Read `FIREBASE_OTP_SETUP.md` for detailed setup
- [ ] Read `MIGRATION_SUMMARY.md` for migration details
- [ ] Read `CHANGES_OVERVIEW.md` for code changes
- [ ] Read `QUICK_START_FIREBASE.md` for quick reference

---

## ✅ Final Verification

- [ ] Backend runs without errors
- [ ] Frontend builds successfully
- [ ] Can send OTP via Firebase
- [ ] Can verify OTP code
- [ ] Can complete full signup flow
- [ ] Phone number saved in database
- [ ] No console errors
- [ ] All tests passing

---

## 🎉 Completion

Once all items are checked:

1. ✅ Migration is complete
2. 🚀 Ready for testing
3. 📱 Ready for production (after thorough testing)

---

## 📞 Support

If you encounter any issues not covered here:

1. Check Firebase Console logs
2. Check app console logs
3. Review error messages carefully
4. Refer to documentation files
5. Test with different phone numbers

---

**Last Updated**: November 12, 2025  
**Status**: Migration Complete - Ready for Installation & Testing
