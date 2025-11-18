# Release Notes - Version 1.0.33

**Release Date:** November 18, 2025  
**Version Code:** 32  
**Build:** app-release-v1.0.33-FINAL-20251118-1500.aab

---

## 🔧 Critical Bug Fixes

### Login System Fix
- **Fixed critical login failure** that prevented users from accessing the app after the v1.0.31 update
- **Root Cause:** Authentication system was incorrectly sending `email` field instead of `phone` field to the backend
- **Impact:** All users unable to login after v1.0.31 Play Store update
- **Resolution:** Updated authentication logic to correctly use phone-based authentication

### Technical Details
- Fixed `lib/auth.ts` to use phone number authentication instead of email
- Updated environment variables from `EXPO_PUBLIC_DEV_EMAIL` to `EXPO_PUBLIC_DEV_PHONE`
- Enhanced backend logging for better debugging of authentication issues

---

## ✨ Improvements

### Firebase Integration
- Improved Firebase module loading for development builds
- Added graceful error handling when Firebase is unavailable in development mode
- Better OTP verification flow for production builds

### Code Quality
- Removed duplicate exports in signup flow
- Fixed TypeScript type consistency
- Cleaned up development documentation files

---

## 🏗️ Build System

### Native Module Updates
- Regenerated Android native code with `expo prebuild` for better module compatibility
- Fixed Gradle build configuration for React Native 0.81.4
- Updated version code sequence to resolve Play Store upload conflicts

### Version Information
- App Version: **1.0.33**
- Version Code: **32**
- Min SDK: 24
- Target SDK: 35
- Compile SDK: 35

---

## 📦 Dependencies

No dependency updates in this release. Focus was on fixing critical authentication bug.

**Key Dependencies:**
- React Native: 0.81.4
- Expo SDK: 54.0.13
- Firebase Auth: 21.14.0
- React: 19.1.0

---

## 🔄 Migration from v1.0.31

Users upgrading from v1.0.31 will:
- ✅ Be able to login successfully with their phone number and password
- ✅ Receive OTP verification codes properly
- ✅ Experience normal app functionality restored

**No action required from users** - the fix is automatic upon updating to v1.0.33.

---

## 🐛 Known Issues

None reported at this time.

---

## 📝 Changelog Summary

**Changed:**
- Authentication system now correctly uses phone-based authentication
- Updated development environment configuration

**Fixed:**
- Login failure preventing app access after v1.0.31 update
- Firebase module initialization in development builds
- Duplicate export statement in signup component

**Removed:**
- Legacy email-based authentication references
- Obsolete documentation files (46 markdown files)
- Old AAB build files (v1.0.16 - v1.0.31)

---

## 🚀 Deployment Notes

**Google Play Console:**
- Upload `app-release-v1.0.33-FINAL-20251118-1500.aab`
- Version Code 32 resolves previous upload conflicts
- Recommended for immediate rollout to fix critical login issue

**Backend Compatibility:**
- Compatible with current production backend
- No backend updates required for this release
- Backend API endpoint: `https://instantlly-cards-backend-6ki0.onrender.com`

---

## 👥 Testing

**Tested Scenarios:**
- ✅ Phone number + password login
- ✅ OTP verification (production build)
- ✅ Version check API
- ✅ App startup and navigation
- ✅ Development build compatibility

---

## 📞 Support

For issues with this release, please contact the development team or submit a bug report.

---

**Git Commit:** `86ca1de - fix: Regenerate Android native code with expo prebuild`  
**Previous Version:** 1.0.31 (Build 31)  
**Build Logs:** https://expo.dev/accounts/rajeshmodi/projects/instantllycards/builds/fd3dca67-f96d-4d1f-bf67-9c32fa4f3e72
