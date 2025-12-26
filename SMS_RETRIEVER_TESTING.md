# SMS Retriever Testing Guide

## Pre-requisites
- Android device or emulator with Google Play Services
- Backend running with FAST2SMS_API_KEY configured
- Test phone number with active SIM

## Test 1: Get App Hash ✅

### Steps:
1. Build and run the app:
   ```bash
   cd InstantllyCards
   npm run android
   ```

2. Check console logs immediately after app loads:
   ```
   Look for:
   📱 ===== SMS RETRIEVER APP HASH =====
   Getting app signature hash...
   
   ✅ App Hash Retrieved:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      FA+9qCX9VSu
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

3. Note down the app hash - you'll verify this in backend logs

### Expected Result:
- ✅ Console shows app hash
- ✅ Hash is a 11-character string (e.g., "FA+9qCX9VSu")
- ✅ No errors in console

### Troubleshooting:
- ❌ "SMS Retriever is only available on Android" → Use Android device
- ❌ Error getting app hash → Check Google Play Services installed

---

## Test 2: Signup Flow with Auto-Fill ✅

### Steps:
1. Open app and go to **Sign Up** screen

2. Enter a test phone number (e.g., your real number)

3. Click **"Send OTP"** button

4. Check console logs:
   ```
   Expected logs:
   [SIGNUP-SEND-OTP] Checking if phone exists: +919876543210
   📱 [SMS Retriever] App Hash: FA+9qCX9VSu
   📱 [SMS Retriever] Listening: true
   [SIGNUP-SEND-OTP] SUCCESS - Fast2SMS accepted request
   ```

5. Wait for SMS to arrive (5-30 seconds)

6. Check console logs for auto-fill:
   ```
   Expected logs:
   [SMS Retriever] SMS Received: <#> 123456 is your OTP for Instantlly Cards
   FA+9qCX9VSu
   [SMS Retriever] OTP Extracted: 123456
   [SMS Retriever] OTP Auto-filled: 123456
   ✅ [Auto-Fill] OTP detected: 123456
   ```

7. Verify OTP input field is auto-filled

8. Verify toast message: **"OTP auto-filled!"**

### Expected Result:
- ✅ OTP input automatically filled with 6 digits
- ✅ Green toast notification appears
- ✅ Console shows "OTP Auto-filled"
- ✅ Can click "Verify OTP" immediately

### Troubleshooting:
- ❌ OTP not auto-filling → Check SMS format in actual SMS
- ❌ "Listening: false" → Restart app, check Google Play Services
- ❌ No SMS received → Check backend logs, verify FAST2SMS_API_KEY

---

## Test 3: Verify SMS Format ✅

### Steps:
1. After receiving SMS, open your Messages app

2. Read the actual SMS message received

3. Verify format matches exactly:
   ```
   <#> 123456 is your OTP for Instantlly Cards
   FA+9qCX9VSu
   ```

### Expected Result:
- ✅ Message starts with `<#>` (including space after)
- ✅ 6-digit OTP appears immediately after `<#>`
- ✅ App hash appears on last line
- ✅ App hash matches the one from Step 1

### Troubleshooting:
- ❌ Missing `<#>` → Backend not formatting correctly
- ❌ Different hash → Check backend receiving correct hash
- ❌ Hash on same line → Add newline before hash in backend

---

## Test 4: Reset Password Auto-Fill ✅

### Steps:
1. Go to **Login** screen

2. Click **"Forgot Password?"**

3. Enter registered phone number

4. Click **"Send OTP"**

5. Wait for SMS and check auto-fill

### Expected Result:
- ✅ OTP auto-fills in reset password screen
- ✅ Console shows auto-fill logs
- ✅ Can proceed to reset password immediately

---

## Test 5: Manual Entry Fallback ✅

### Steps:
1. Go to Signup screen

2. Send OTP

3. Before SMS arrives, manually type OTP (get from backend logs if needed)

4. Verify manual entry still works

### Expected Result:
- ✅ Manual typing works normally
- ✅ Can verify OTP manually typed
- ✅ Auto-fill doesn't override manual entry

---

## Test 6: Backend Hash Verification ✅

### Steps:
1. Send OTP from app

2. Check backend logs:
   ```bash
   # Backend console should show:
   [CHECK-PHONE] 📩 Received appHash: FA+9qCX9VSu
   [CHECK-PHONE] 🔑 Generated OTP: 123456 for 9876543210
   [CHECK-PHONE] 📤 Calling Fast2SMS API...
   ```

3. Verify hash in backend matches app hash from Test 1

### Expected Result:
- ✅ Backend receives app hash
- ✅ Hash matches app hash from console
- ✅ SMS sent with correct format

### Troubleshooting:
- ❌ Backend receives empty hash → Check API request body
- ❌ Different hash → App hash changed, rebuild app
- ❌ Hash undefined → Frontend not sending hash

---

## Test 7: Production Build Hash ✅

### Steps:
1. Create production build:
   ```bash
   cd InstantllyCards
   eas build --platform android --profile production
   ```

2. Install APK on device

3. Run app and check console for production hash

4. **IMPORTANT:** Production hash will be different from development!

### Expected Result:
- ✅ Production hash is different from dev hash
- ✅ Production hash sent correctly to backend
- ✅ SMS received with production hash
- ✅ Auto-fill works in production

---

## Test 8: Error Handling ✅

### Test Case: Invalid SMS Format
1. Manually send test SMS without `<#>`:
   ```
   123456 is your OTP for Instantlly Cards
   FA+9qCX9VSu
   ```
2. Verify OTP **doesn't** auto-fill
3. Manual entry should still work

### Test Case: Different App Hash
1. Send SMS with wrong hash:
   ```
   <#> 123456 is your OTP for Instantlly Cards
   WRONGHASH123
   ```
2. Verify SMS is ignored (not detected by app)

### Test Case: Listener Already Stopped
1. Send OTP
2. Wait for first SMS to auto-fill
3. Resend OTP
4. Verify second SMS also auto-fills (new listener started)

---

## Performance Testing

### Test: Multiple Rapid OTP Requests
1. Send OTP
2. Immediately click "Resend OTP" (after 60s cooldown)
3. Check listener restarts correctly
4. Verify latest OTP auto-fills

### Test: SMS Arrival Time
1. Send OTP
2. Note time SMS sent (backend log)
3. Note time OTP auto-filled (app log)
4. Calculate delay

**Expected:** Auto-fill within 5 seconds of SMS arrival

---

## Console Log Examples

### ✅ Successful Auto-Fill
```
[SMS Retriever] Starting SMS listener...
[SMS Retriever] Listener started successfully
[SMS Retriever] SMS Received: <#> 123456 is your OTP for Instantlly Cards
FA+9qCX9VSu
[SMS Retriever] OTP Extracted: 123456
[SMS Retriever] OTP Auto-filled: 123456
✅ [Auto-Fill] OTP detected: 123456
[SMS Retriever] Stopping SMS listener...
```

### ❌ Failed Auto-Fill (Wrong Format)
```
[SMS Retriever] Starting SMS listener...
[SMS Retriever] Listener started successfully
[SMS Retriever] SMS Received: Your OTP is 123456 FA+9qCX9VSu
[SMS Retriever] Could not extract OTP from message
```

### ❌ Listener Failed to Start
```
[SMS Retriever] Starting SMS listener...
[SMS Retriever] Error starting listener: Google Play Services not available
```

---

## Checklist

Before marking as complete, verify:

- [ ] App hash retrieved successfully
- [ ] Signup OTP auto-fills correctly
- [ ] Reset password OTP auto-fills correctly
- [ ] SMS format matches specification
- [ ] Backend receives and uses app hash
- [ ] Manual entry still works
- [ ] Console logs show expected output
- [ ] Production build tested (different hash)
- [ ] Error cases handled gracefully
- [ ] No crashes or ANRs
- [ ] Works on multiple Android devices

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| OTP not auto-filling | SMS format wrong | Check SMS starts with `<#>` |
| Listener not starting | No Google Play Services | Use device with Google Play |
| Wrong hash in production | Using dev hash | Get hash from production build |
| SMS ignored | Wrong app hash in SMS | Verify backend uses client's hash |
| Listener stopped | Auto-stops after 1 SMS | Restart for next OTP |
| Multiple SMS detected | Multiple OTP requests | Normal, latest OTP used |

---

## Debug Commands

```bash
# Check app is running
adb shell am stack list

# Monitor logs in real-time
adb logcat | grep "SMS Retriever"

# Get app signature manually
adb shell pm list packages -f | grep instantlly

# Clear app data
adb shell pm clear com.instantllycards
```

---

## Success Criteria

✅ **Basic Functionality**
- OTP auto-fills on signup
- OTP auto-fills on password reset
- Manual entry works as fallback

✅ **SMS Format**
- Message starts with `<#>`
- OTP appears after `<#>`
- App hash included correctly

✅ **Production Ready**
- Works on physical devices
- Different hash in production handled
- No crashes or errors
- Graceful fallback on iOS

---

**Testing Complete!** If all tests pass, your SMS Retriever integration is working perfectly! 🎉
