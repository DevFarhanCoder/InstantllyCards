# 🔍 Firebase OTP Setup - Configuration Check

**Date**: November 12, 2025  
**Status**: ⚠️ Configuration Issues Found

---

## ✅ What's Working

1. ✅ **google-services.json** - File exists and renamed correctly
   - Location: `InstantllyCards/android/app/google-services.json`
   - Project ID: `instantlly-cards-5e4de`
   - API Key: `AIzaSyClTL2sCE5w0Qt6LuccXXAR8gAomSnKs08`

2. ✅ **SHA-256 Fingerprint** - Successfully extracted
   ```
   84:80:7D:34:B1:30:42:6A:FE:85:77:B9:E6:98:EF:6E:3B:8C:FE:9A:5A:8B:B7:90:A4:9F:3C:94:8E:0E:98:24
   ```

3. ✅ **Firebase Plugin** - Configured in app.json
   ```json
   "@react-native-firebase/app"
   ```

---

## ⚠️ Issues Found

### 🔴 CRITICAL: Package Name Mismatch

**Problem**: The package names in your configuration don't match!

- **google-services.json**: `com.instantlly.cards`
- **app.json (Android)**: `com.instantllycards.www.twa`

**Impact**: Firebase won't work because the package names must match exactly.

**Solution**: Choose ONE of these options:

#### Option 1: Update google-services.json (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **instantlly-cards-5e4de**
3. Go to **Project Settings** → **Your apps**
4. Find your Android app
5. Click the 3 dots → **App settings**
6. Add a new Android app with package name: `com.instantllycards.www.twa`
7. Download the new `google-services.json`
8. Replace the current file in `InstantllyCards/android/app/`

#### Option 2: Update app.json Package Name

Change package name in `app.json` to match Firebase:

```json
"android": {
  "package": "com.instantlly.cards",
  ...
}
```

**Note**: This will create a new app - you'll need to reinstall on devices.

---

## 📋 Next Steps Checklist

### 1. Fix Package Name Issue
- [ ] Choose Option 1 or Option 2 above
- [ ] Update the configuration
- [ ] Verify package names match

### 2. Add SHA-256 to Firebase Console

**Your SHA-256 Fingerprint:**
```
84:80:7D:34:B1:30:42:6A:FE:85:77:B9:E6:98:EF:6E:3B:8C:FE:9A:5A:8B:B7:90:A4:9F:3C:94:8E:0E:98:24
```

**Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **instantlly-cards-5e4de**
3. Go to **Project Settings**
4. Under **Your apps**, select your Android app
5. Scroll to **SHA certificate fingerprints**
6. Click **Add fingerprint**
7. Paste the SHA-256 above
8. Click **Save**

### 3. Enable Phone Authentication

- [ ] Go to Firebase Console → **Authentication**
- [ ] Click **Sign-in method** tab
- [ ] Find **Phone** in the list
- [ ] Click the toggle to **Enable**
- [ ] Click **Save**

### 4. Add Test Phone Numbers (Optional)

For development/testing without using SMS quota:

- [ ] In Authentication → Sign-in method
- [ ] Scroll to **Phone numbers for testing**
- [ ] Click **Add phone number**
- [ ] Add: `+911234567890` with code `123456`
- [ ] Click **Save**

### 5. Install Dependencies

```powershell
# Backend
cd C:\Users\user3\Documents\App\Instantlly-Cards-Backend
npm install

# Frontend
cd C:\Users\user3\Documents\App\InstantllyCards
npm install
```

### 6. Rebuild App

```powershell
cd C:\Users\user3\Documents\App\InstantllyCards
npx expo prebuild --clean
npx expo run:android
```

---

## 🔧 Correct PowerShell Commands

### Get SHA-256 Fingerprint:
```powershell
cd C:\Users\user3\Documents\App\InstantllyCards\android
keytool -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Check google-services.json Package Name:
```powershell
cd C:\Users\user3\Documents\App\InstantllyCards\android\app
Get-Content google-services.json | Select-String "package_name"
```

### Check app.json Package Name:
```powershell
cd C:\Users\user3\Documents\App\InstantllyCards
Get-Content app.json | Select-String "package"
```

---

## 📊 Current Configuration Summary

| Item | Value | Status |
|------|-------|--------|
| **Firebase Project** | instantlly-cards-5e4de | ✅ OK |
| **google-services.json** | Present | ✅ OK |
| **Package Name (Firebase)** | com.instantlly.cards | ⚠️ Mismatch |
| **Package Name (app.json)** | com.instantllycards.www.twa | ⚠️ Mismatch |
| **SHA-256 Fingerprint** | Extracted | ⏳ Need to add to Firebase |
| **Phone Auth Enabled** | Unknown | ⏳ Need to verify |
| **Firebase Plugin** | Configured | ✅ OK |

---

## 🎯 Priority Actions

**Do these in order:**

1. **FIRST**: Fix the package name mismatch (Option 1 recommended)
2. **SECOND**: Add SHA-256 fingerprint to Firebase Console
3. **THIRD**: Enable Phone Authentication in Firebase
4. **FOURTH**: Install dependencies
5. **FIFTH**: Rebuild and test

---

## 🚀 After Configuration

Once all items above are complete, test with:

```powershell
# Start backend
cd C:\Users\user3\Documents\App\Instantlly-Cards-Backend
npm run dev

# In new terminal, run app
cd C:\Users\user3\Documents\App\InstantllyCards
npx expo run:android
```

Then test signup with phone number: `+911234567890` and OTP: `123456`

---

## 📞 Need Help?

If you get stuck:

1. **Package Name Issues**: See "Option 1" or "Option 2" above
2. **SHA-256 Issues**: Re-run the keytool command above
3. **Firebase Console**: Make sure you're in the correct project
4. **Build Errors**: Try `npx expo prebuild --clean` first

---

**Last Updated**: November 12, 2025  
**Next Review**: After fixing package name mismatch
