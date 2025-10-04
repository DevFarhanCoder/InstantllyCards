# 🚀 QUICK START: Fix Notifications in 5 Minutes

## The Problem
❌ Notifications don't work in APK builds

## The Solution
✅ Add Firebase configuration file

---

## Step-by-Step (5 Minutes)

### 1️⃣ Go to Firebase Console
🔗 https://console.firebase.google.com/

### 2️⃣ Create/Select Project
- Project name: `InstantllyCards` (or any name)
- Disable Analytics: ✅ (not needed)

### 3️⃣ Add Android App
- Package name: `com.instantllycards.www.twa` ⚠️ MUST MATCH
- App nickname: `InstantllyCards` (optional)
- SHA-1: Leave blank

### 4️⃣ Download Config File
- Download `google-services.json`
- Place in: `InstantllyCards/google-services.json` (project root)

### 5️⃣ Enable Cloud Messaging
- Firebase Console → Build → Cloud Messaging
- Enable "Firebase Cloud Messaging API (V1)"

### 6️⃣ Rebuild APK
```bash
eas build --platform android --profile preview
```

### 7️⃣ Test
- Install new APK
- Send yourself a message
- Close app completely
- ✅ You should receive notification!

---

## File Structure
```
InstantllyCards/
├── google-services.json  ← ADD THIS FILE HERE
├── app.json              ← Already configured ✅
├── package.json
└── ...
```

---

## Verification Checklist
Before building APK:
- [ ] `google-services.json` exists in project root
- [ ] Package name in Firebase matches: `com.instantllycards.www.twa`
- [ ] Cloud Messaging API enabled in Firebase
- [ ] Old APK uninstalled from device

After installing APK:
- [ ] App opens successfully
- [ ] User can log in
- [ ] Check for log: `📱 [REGISTER] Push token obtained successfully`
- [ ] Check for log: `✅ [BACKEND] Token registered successfully`

---

## 6 Notification Types (All Working)

1. **📨 New Message**
   - Individual chat messages
   - Opens chat when tapped

2. **👥 Group Message**
   - Group chat messages
   - Opens group when tapped

3. **👤 Contact Joined**
   - When phone contact joins app
   - Opens app when tapped

4. **🆕 Card Created** (NEW!)
   - When contact creates new card
   - Opens home feed when tapped

5. **💳 Card Shared**
   - When someone sends you card
   - Opens card details when tapped

6. **📨 Group Invite**
   - When invited to group
   - Opens group details when tapped

---

## That's It! 🎉

**After adding `google-services.json` and rebuilding:**
- All notifications work automatically
- Background notifications work
- Production ready!

---

## Need More Details?
See: `FIREBASE_SETUP_GUIDE.md` (complete guide)
See: `NOTIFICATION_STATUS.md` (full technical details)

---

**⏱️ Total Time: 5 minutes**
**🔧 Difficulty: Easy**
**📱 Result: Fully working notifications!**
