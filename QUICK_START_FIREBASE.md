# ⚡ Quick Start: Firebase OTP Integration

## 🎯 Installation (5 minutes)

### Step 1: Install Dependencies

```powershell
# Install backend dependencies
cd Instantlly-Cards-Backend
npm install

# Install frontend dependencies
cd ..\InstantllyCards
npm install
```

### Step 2: Firebase Console Setup

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **InstantllyCards**
3. Go to **Authentication** → **Sign-in method**
4. Enable **Phone** provider
5. Save

### Step 3: Add Test Phone Number (Development)

1. In Firebase Console → Authentication → Sign-in method
2. Scroll to **Phone numbers for testing**
3. Add: 
   - Phone: `+911234567890`
   - Code: `123456`
4. Save

### Step 4: Add SHA-256 Fingerprint

```powershell
# Get debug keystore fingerprint
cd C:\Users\user3\Documents\App\InstantllyCards\android
keytool -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the **SHA-256** fingerprint and add it to Firebase:
- Firebase Console → Project Settings → Your apps → Android app
- Click "Add fingerprint"
- Paste SHA-256
- Save

### Step 5: Verify google-services.json

Ensure file exists at:
```
InstantllyCards/android/app/google-services.json
```

### Step 6: Rebuild App

```powershell
cd InstantllyCards
npx expo prebuild --clean
npx expo run:android
```

---

## 🧪 Testing

1. **Start Backend**
   ```powershell
   cd Instantlly-Cards-Backend
   npm run dev
   ```

2. **Run App**
   ```powershell
   cd InstantllyCards
   npx expo run:android
   ```

3. **Test Signup Flow**
   - Open app
   - Click "Sign Up"
   - Enter test phone: `+911234567890`
   - Click "Send OTP"
   - Enter test code: `123456`
   - Complete signup

---

## ✅ What's Changed

- ❌ **Removed**: Fast2SMS integration
- ✅ **Added**: Firebase Phone Authentication
- 📱 **SMS**: Now sent automatically by Firebase
- 🔐 **Security**: Built-in reCAPTCHA and rate limiting

---

## 📚 Full Documentation

- **Setup Guide**: `FIREBASE_OTP_SETUP.md`
- **Migration Summary**: `MIGRATION_SUMMARY.md`

---

## 🆘 Need Help?

### Error: "Cannot find module '@react-native-firebase/auth'"
**Solution**: Run `npm install` in InstantllyCards folder

### Error: "SMS not received"
**Solution**: Use test phone number from Firebase Console during development

### Error: "Invalid phone number"
**Solution**: Format must be `+[country code][number]`, e.g., `+911234567890`

---

**Last Updated**: November 12, 2025
