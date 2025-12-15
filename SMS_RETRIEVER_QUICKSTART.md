# SMS Retriever Integration - Quick Start

## ✅ What's Been Implemented

### 1. Custom Hook (`hooks/useSmsRetriever.ts`)
- Automatically starts SMS listener on component mount
- Extracts OTP from incoming SMS
- Provides app hash for backend
- Handles cleanup and error states

### 2. Updated Screens
- **Signup Screen** - Auto-fills OTP during registration
- **Reset Password Screen** - Auto-fills OTP for password reset

### 3. Backend Integration
- Backend already configured to send SMS in correct format
- Accepts `appHash` parameter from frontend
- Formats SMS as: `<#> OTP_CODE message\nAPP_HASH`

## 🚀 Quick Test

1. **Build and Run:**
   ```bash
   cd InstantllyCards
   npm run android
   ```

2. **Get Your App Hash:**
   - Check console logs on app start
   - Look for: `[SMS Retriever] App Hash: YOUR_HASH`
   - Or use the utility script

3. **Test OTP Flow:**
   - Go to Signup screen
   - Enter phone number
   - Click "Send OTP"
   - Wait for SMS (should auto-fill within 5 seconds)

## 📱 SMS Format (Backend)

Your backend is already sending the correct format:

```
<#> 123456 is your OTP for Instantlly Cards
FA+9qCX9VSu
```

## 🔧 How It Works

```typescript
// 1. Hook automatically starts on mount
const { otp: autoOtp, appHash } = useSmsRetriever({ 
  autoStart: true,
  otpLength: 6 
});

// 2. Auto-fill when OTP detected
useEffect(() => {
  if (autoOtp) {
    setOtp(autoOtp);
    showToast("OTP auto-filled!", "success");
  }
}, [autoOtp]);

// 3. Send app hash to backend
await api.post('/auth/check-phone', { 
  phone, 
  appHash // Backend includes this in SMS
});
```

## 📋 Files Modified

### Frontend (InstantllyCards)
- ✅ `hooks/useSmsRetriever.ts` - New SMS Retriever hook
- ✅ `app/(auth)/signup.tsx` - Updated with auto-fill
- ✅ `app/(auth)/reset-password.tsx` - Updated with auto-fill
- ✅ `scripts/getAppHash.ts` - Utility for getting app hash

### Backend (Instantlly-Cards-Backend)
- ✅ `src/routes/auth.ts` - Already configured with correct SMS format

### Documentation
- ✅ `SMS_RETRIEVER_INTEGRATION.md` - Complete integration guide
- ✅ `SMS_RETRIEVER_QUICKSTART.md` - This quick start guide

## 🎯 Key Features

✅ **No Permissions Required** - Uses Google Play Services  
✅ **Android Only** - iOS users still use manual entry  
✅ **Privacy-First** - Only reads SMS with your app hash  
✅ **Auto-Stop** - Listener stops after first SMS detected  
✅ **Backward Compatible** - Manual entry still works  
✅ **Production Ready** - Dynamic hash from client to backend

## ⚠️ Important Notes

1. **Different Hashes:**
   - Development build hash ≠ Production build hash
   - Always get hash from current build
   - Don't hard-code hash in backend

2. **SMS Format:**
   - Must start with `<#>` (critical!)
   - OTP should appear right after `<#>`
   - App hash on new line or at end
   - Max 140 characters total

3. **Testing:**
   - Requires real Android device or emulator with Google Play
   - Won't work on iOS (falls back to manual entry)
   - SMS listener expires after 5 minutes

## 🐛 Troubleshooting

**OTP not auto-filling?**
```typescript
// Check if listener is active
const { isListening, error } = useSmsRetriever();
console.log('Listening:', isListening);
console.log('Error:', error);
```

**Wrong app hash?**
```bash
# Get app hash from device
npm run android
# Check console for: [SMS Retriever] App Hash: XXX
```

**SMS format wrong?**
```
✅ Correct: "<#> 123456 is your OTP\nFA+9qCX9VSu"
❌ Wrong: "Your OTP is 123456 <#> FA+9qCX9VSu"
```

## 📚 Next Steps

1. Test with real phone number in development
2. Verify SMS arrives in correct format
3. Check console logs for auto-fill confirmation
4. Test production build before release
5. Monitor success rate in analytics

## 💡 Pro Tips

- Keep SMS message under 140 characters
- Include app name in message for user clarity
- Test on multiple Android devices
- Monitor backend logs for hash values
- Add analytics to track auto-fill vs manual entry

---

**Need Help?** Check `SMS_RETRIEVER_INTEGRATION.md` for detailed documentation.
