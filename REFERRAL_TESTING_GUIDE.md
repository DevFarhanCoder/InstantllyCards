# Referral System Testing Guide

## Testing Methods

### Method 1: Quick Development Test (Immediate)

**Steps for your friend:**

1. **Open the test page in development build:**
   - Navigate to: `/referral/test-referral`
   - Or add a button in profile/settings temporarily

2. **Set your referral code:**
   - Enter your code: `78ML4ZD6` (or get it from your profile)
   - Click "Set Referral Code"

3. **Sign up with a new account:**
   - Go to signup page
   - Complete phone verification
   - Enter name and password
   - The referral code will be automatically sent to backend

4. **Verify credits:**
   - Check your friend's credits (should have 200 + signup bonus)
   - Check your credits (should have increased by 300)

---

### Method 2: Deep Link Test (Better for Production-like Testing)

**Steps for your friend:**

1. **Send them the deep link directly:**
   ```
   instantllycards://signup?ref=78ML4ZD6
   ```

2. **Friend opens the link:**
   - Opens the app automatically
   - Referral code is captured
   - Goes to signup screen

3. **Complete signup:**
   - Fill in details
   - Submit
   - Credits automatically assigned!

**How to send deep link:**
- WhatsApp: Just paste the link `instantllycards://signup?ref=YOUR_CODE`
- SMS: Same as above
- Or use `adb` command for testing:
  ```bash
  adb shell am start -W -a android.intent.action.VIEW -d "instantllycards://signup?ref=78ML4ZD6"
  ```

---

### Method 3: Play Store Test (Production Only)

**Prerequisites:**
- App must be published on Play Store
- Friend must NOT have the app installed yet

**Steps:**

1. **Share Play Store link:**
   ```
   https://play.google.com/store/apps/details?id=com.instantllycards.www.twa&referrer=utm_source%3Dreferral%26utm_campaign%3D78ML4ZD6
   ```

2. **Friend clicks link:**
   - Opens Play Store
   - Installs app

3. **Friend launches app:**
   - Referral code automatically captured on first launch
   - Check console logs for: `🎁 Play Store referral code captured`

4. **Friend signs up:**
   - Complete signup
   - Credits assigned automatically!

---

## Verification Steps

### Check if referral code is stored:

**Option A: Using Test Component**
- Open test page
- Click "Check Stored Code"
- Should show your code

**Option B: Console Logs**
Look for these logs:
```
🎁 Referral code found: 78ML4ZD6
🎁 Play Store referral code captured: 78ML4ZD6
📝 [SIGNUP-CREATE] Payload: { name, phone, password, referralCode }
```

### Check Backend Logs:

Look for:
```
✅ Valid referral code from: [Your Name]
💰 Referral bonus of 300 credits given to [Your Name]
```

### Check Credits:

**Your Account (Referrer):**
- Go to Profile
- Check credits increased by 300

**Friend's Account (New User):**
- After signup, check profile
- Should have 200 credits

---

## Common Issues & Solutions

### Issue: "No referral code stored"
**Solution:** 
- Use test component to manually set code
- Or ensure deep link was opened correctly

### Issue: "Invalid referral code"
**Solution:**
- Verify your referral code in your profile
- Code must be exactly 8 characters
- Must be uppercase (78ML4ZD6 format)

### Issue: "Friend already has account"
**Solution:**
- Referral only works for NEW signups
- Each user can only use a referral code once
- Test with a different phone number

### Issue: "Credits not showing"
**Solution:**
- Refresh the profile page
- Check backend logs for errors
- Verify both users' credit transactions

---

## Quick Test Script

**For immediate testing without installing:**

1. Your friend opens development build
2. Add this button temporarily to login/welcome screen:

```typescript
// Temporary test button
<TouchableOpacity 
  onPress={async () => {
    await AsyncStorage.setItem('pending_referral_code', '78ML4ZD6');
    alert('Referral code set! Now signup.');
  }}
  style={{padding: 20, backgroundColor: '#red'}}
>
  <Text>🧪 TEST: Set Referral Code</Text>
</TouchableOpacity>
```

3. Friend clicks button
4. Friend signs up
5. Check credits!

---

## Expected Results

✅ **New User (Friend):**
- Receives 200 credits on signup
- Can see "Referred by: [Your Name]" in backend

✅ **Referrer (You):**
- Receives 300 credits
- Can see friend in "Track Referral Status" page

✅ **Backend Transactions:**
- 2 transactions created:
  1. Signup bonus for new user (200 credits)
  2. Referral bonus for referrer (300 credits)

---

## Testing Checklist

- [ ] Referral code displayed correctly in app
- [ ] Share link contains correct format
- [ ] Deep link opens app and captures code
- [ ] Referral code stored in AsyncStorage
- [ ] Signup includes referralCode in API call
- [ ] Backend validates code successfully
- [ ] New user gets 200 credits
- [ ] Referrer gets 300 credits
- [ ] Both transactions recorded
- [ ] Track Status page shows new referral

**REMOVE `test-referral.tsx` BEFORE PRODUCTION RELEASE!**
