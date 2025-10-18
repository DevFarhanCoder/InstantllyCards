# Version 1.0.16 Deployment Guide

## Current Setup (1.0.15)
✅ **Status**: No force update required
- Current app version: `1.0.15`
- Minimum supported version: `1.0.15`
- Latest available version: `1.0.15`
- **Result**: Users can use the app normally

## When You Want to Release 1.0.16

### Step 1: Update App Version
1. **Update `app.json`**:
   ```json
   {
     "expo": {
       "version": "1.0.16",
       "android": {
         "versionCode": 16
       }
     }
   }
   ```

### Step 2: Build and Deploy to App Stores
1. **Build the new version**:
   ```bash
   cd InstantllyCards
   npx eas build --platform android --profile production
   ```

2. **Upload to Google Play Store** and wait for approval

### Step 3: Update Backend Configuration
**Only after 1.0.16 is live in app stores**, update the backend:

```typescript
// In Instantlly-Cards-Backend/src/routes/auth.ts

// Latest versions available in app stores
const LATEST_VERSIONS = {
  android: "1.0.16",  // ✅ Update this after 1.0.16 is live
  ios: "1.0.16"       // ✅ Update this after 1.0.16 is live
};
```

### Step 4: Force Update Previous Versions (Optional)
If you want to force users on 1.0.15 to update:

```typescript
// In Instantlly-Cards-Backend/src/routes/auth.ts

const MIN_SUPPORTED_VERSIONS = {
  android: "1.0.16",  // ✅ This will force 1.0.15 users to update
  ios: "1.0.16"       
};
```

## What Happens to Users

### Current Users (1.0.15):
- **Now**: No force update (can use app normally)
- **After you update LATEST_VERSIONS**: No force update (still can use app)
- **After you update MIN_SUPPORTED_VERSIONS**: Force update required

### New Users:
- Will download 1.0.16 from app store
- No force update needed

## Testing the Force Update

Before making changes live, you can test with a lower version:

```typescript
// Test configuration
const MIN_SUPPORTED_VERSIONS = {
  android: "1.0.14",  // This will trigger force update for 1.0.15 users
  ios: "1.0.14"       
};
```

## Deployment Checklist

- [ ] Update app.json version to 1.0.16
- [ ] Build and test the app locally
- [ ] Submit to Google Play Store
- [ ] Wait for approval and live release
- [ ] Update LATEST_VERSIONS in backend
- [ ] Test that new users get 1.0.16
- [ ] (Optional) Update MIN_SUPPORTED_VERSIONS to force update
- [ ] Monitor logs for any issues

## Emergency Rollback

If something goes wrong, you can quickly disable force updates:

```typescript
const MIN_SUPPORTED_VERSIONS = {
  android: "1.0.15",  // Back to current version
  ios: "1.0.15"       
};
```

This will immediately stop forcing updates and let users continue using 1.0.15.