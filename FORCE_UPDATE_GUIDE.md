# Force Update Feature - Implementation Guide

## 📱 Overview

The Force Update feature ensures users always have the latest version of the app by displaying a mandatory update dialog when their version is below the minimum required version.

---

## 🎯 How It Works

### User Experience Flow:
1. **App Opens** → Version check runs automatically
2. **If Update Required** → Modal appears (cannot be dismissed)
3. **User Clicks "Update App"** → Redirects to Play Store/App Store
4. **User Installs Update** → Opens app → No modal (version is current)

### Technical Flow:
1. App retrieves current version from `app.json` (`1.0.16`)
2. Makes API call to `/api/auth/version-check?version=1.0.16&platform=android`
3. Backend compares against minimum supported version
4. If current < minimum → Returns `updateRequired: true`
5. Frontend displays `ForceUpdateModal` (blocking entire app)

---

## 🔧 Components

### 1. **Backend Endpoint** (`src/routes/auth.ts`)
- **URL**: `GET /api/auth/version-check`
- **Parameters**: 
  - `version` (string): Current app version (e.g., "1.0.16")
  - `platform` (string): "android" or "ios"
- **Response**:
  ```json
  {
    "success": true,
    "updateRequired": false,
    "currentVersion": "1.0.16",
    "minimumVersion": "1.0.16",
    "latestVersion": "1.0.16",
    "updateUrl": "https://play.google.com/store/apps/details?id=com.instantllycards.www.twa",
    "message": "You are using the latest version"
  }
  ```

### 2. **Force Update Modal** (`components/ForceUpdateModal.tsx`)
- Beautiful UI matching the design reference
- Rocket icon with rotation animation
- Non-dismissible (no close button, no back button)
- Shows current vs latest version
- "Update App" button opens Play Store/App Store

### 3. **Version Check Service** (`lib/versionCheck.ts`)
- `checkAppVersion()`: Checks if update is required
- `getCurrentAppVersion()`: Gets current app version
- `getAppStoreUrl()`: Returns platform-specific store URL

### 4. **Root Layout Integration** (`app/_layout.tsx`)
- Runs version check on app startup
- Shows modal if update required
- Modal blocks all app functionality

---

## 🚀 How to Force Users to Update

When you release a new version and want to **force all users to update**:

### Step 1: Release New Version to Play Store
1. Update `app.json`:
   ```json
   "version": "1.0.17",  // Increment version
   "android": {
     "versionCode": 17,  // Increment version code
   }
   ```
2. Build and upload to Play Store
3. Wait for Play Store approval

### Step 2: Update Backend Minimum Version
1. Go to `Instantlly-Cards-Backend/src/routes/auth.ts`
2. Find the `MIN_SUPPORTED_VERSIONS` object (around line 606):
   ```typescript
   const MIN_SUPPORTED_VERSIONS = {
     android: "1.0.17",  // Change this to your new minimum version
     ios: "1.0.17"
   };
   ```
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "chore: Bump minimum required version to 1.0.17"
   git push origin main
   ```
4. Render will auto-deploy (takes 2-3 minutes)

### Step 3: What Happens to Users

**Users on version 1.0.16 or below:**
1. Open app
2. Version check: `1.0.16 < 1.0.17` → `updateRequired: true`
3. See Force Update Modal (cannot use app)
4. Must click "Update App" → Redirected to Play Store
5. Install version 1.0.17
6. Open app → Version check: `1.0.17 = 1.0.17` → No modal ✅

**Users on version 1.0.17:**
- No modal
- App works normally

---

## 📝 Version Management Strategy

### Recommended Versioning:

| Scenario | Action | Example |
|----------|--------|---------|
| **Bug fixes** | Increment patch (x.x.X) | 1.0.16 → 1.0.17 |
| **New features** | Increment minor (x.X.x) | 1.0.17 → 1.1.0 |
| **Breaking changes** | Increment major (X.x.x) | 1.1.0 → 2.0.0 |

### When to Force Update:

✅ **Force Update For:**
- Critical security fixes
- Backend API breaking changes
- Database schema changes that affect old versions
- Major bugs that crash the app
- Removal of deprecated features

❌ **Don't Force Update For:**
- Minor UI improvements
- New optional features
- Performance optimizations
- Non-critical bug fixes

---

## 🔍 Testing the Feature

### Test Force Update Locally:

1. **Method 1: Change Backend Minimum Version**
   - Set `MIN_SUPPORTED_VERSIONS.android = "2.0.0"`
   - Your app (1.0.16) will be forced to update
   - Change back when done testing

2. **Method 2: Mock Version in Frontend**
   - In `lib/versionCheck.ts`, change:
     ```typescript
     const appVersion = '1.0.1'; // Fake old version
     ```
   - Run app → Should show force update modal

### Test Update Flow:
1. See modal appear
2. Click "Update App"
3. Should open Play Store at your app's page
4. (Don't actually update - cancel and return to app)

---

## 🛠️ Customization

### Update Modal Design:
Edit `components/ForceUpdateModal.tsx`:
- Change colors: Modify `styles.updateButton.backgroundColor`
- Change text: Modify `title` and `description`
- Change icon: Replace `🚀` with any emoji or custom image

### Update Store URLs:
Edit `Instantlly-Cards-Backend/src/routes/auth.ts`:
```typescript
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=YOUR_PACKAGE_ID";
const APP_STORE_URL = "https://apps.apple.com/app/YOUR_APP_ID";
```

### Adjust Comparison Logic:
The `compareVersions()` function uses semantic versioning:
- `1.0.16 < 1.0.17` → Update required
- `1.0.17 = 1.0.17` → No update
- `1.1.0 > 1.0.17` → No update

---

## 🔒 Security & Error Handling

### Fail-Safe Design:
- If backend is down → Version check returns `null` → **No modal** (users can use app)
- If network error → **No modal** (don't block users)
- If response malformed → **No modal**

### Why This is Safe:
- Users are never permanently blocked from the app
- Only blocks when we explicitly set a higher minimum version
- Backend must be operational for force update to work

---

## 📊 Monitoring

### Check Version Distribution:
You can add analytics to track version usage:

In `lib/versionCheck.ts`:
```typescript
console.log('📊 Version Check:', {
  currentVersion,
  minimumVersion,
  updateRequired,
  platform
});
```

Check Render logs to see version distribution of your users.

---

## 🐛 Troubleshooting

### Modal Not Showing:
1. Check backend logs → Is endpoint returning `updateRequired: true`?
2. Check frontend logs → Is version check running?
3. Verify `app.json` version matches deployed version

### Modal Showing for Wrong Users:
1. Check `MIN_SUPPORTED_VERSIONS` in backend
2. Verify version comparison logic
3. Test with exact versions in both places

### Update Button Not Working:
1. Check Play Store URL is correct
2. Verify app package ID matches
3. Test URL in browser first

---

## 📚 Files Modified

### Backend:
- `src/routes/auth.ts` - Added `/version-check` endpoint

### Frontend:
- `components/ForceUpdateModal.tsx` - Force update UI
- `lib/versionCheck.ts` - Version checking logic
- `app/_layout.tsx` - Integrated version check on app start

---

## 🎉 Example Scenarios

### Scenario 1: Emergency Security Fix
1. Find critical security vulnerability
2. Fix in code
3. Release version 1.0.18 to Play Store
4. Update backend: `MIN_SUPPORTED_VERSIONS.android = "1.0.18"`
5. **All users forced to update within hours**

### Scenario 2: New Optional Feature
1. Add new chat feature
2. Release version 1.0.18
3. **Don't update backend minimum version**
4. Users update naturally over time
5. Old versions still work

### Scenario 3: Breaking API Change
1. Change message API from v1 to v2
2. Old app versions won't work
3. Release version 1.1.0 with new API
4. Update backend: `MIN_SUPPORTED_VERSIONS.android = "1.1.0"`
5. **All users must update to continue using app**

---

## ✅ Quick Reference

### Force All Users to Update:
```typescript
// Backend: src/routes/auth.ts
const MIN_SUPPORTED_VERSIONS = {
  android: "1.0.17",  // ← Change this
  ios: "1.0.17"
};
```

### Current App Version:
```json
// Frontend: app.json
"version": "1.0.16"
```

### Check Current Status:
```bash
# Test endpoint
curl "https://instantlly-cards-backend.onrender.com/api/auth/version-check?version=1.0.16&platform=android"
```

---

## 🎯 Next Steps

1. ✅ Feature is deployed and ready
2. ⏳ Test locally by changing backend minimum version
3. ⏳ When you release 1.0.17, update backend to force users
4. ⏳ Monitor Render logs for version distribution

**The force update system is now LIVE and ready to use!** 🚀
