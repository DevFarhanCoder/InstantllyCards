# Google SMS Retriever API Integration Guide

## Overview
This app now supports automatic OTP detection using Google's SMS Retriever API. When an OTP SMS arrives, it will be automatically detected and filled in the OTP input field without requiring SMS permissions.

## Features
- ✅ **Auto OTP Detection**: Automatically reads OTP from incoming SMS
- ✅ **No SMS Permissions Required**: Uses Google Play Services, no dangerous permissions needed
- ✅ **Android Only**: Works on Android devices with Google Play Services
- ✅ **Seamless UX**: Users don't need to manually copy-paste OTP
- ✅ **Privacy-First**: Only reads SMS containing your app hash

## How It Works

### 1. App Hash
Each Android app has a unique hash code that identifies it. This hash must be included in the SMS message sent from the backend.

**Getting the App Hash:**
```typescript
import { useSmsRetriever } from '@/hooks/useSmsRetriever';

const { appHash } = useSmsRetriever();
console.log('App Hash:', appHash); // Example: "FA+9qCX9VSu"
```

### 2. SMS Format
The SMS must follow this exact format for automatic detection:

```
<#> YOUR_OTP_CODE Your custom message
YOUR_APP_HASH
```

**Example:**
```
<#> 123456 is your OTP for Instantlly Cards
FA+9qCX9VSu
```

**Important Rules:**
- Must start with `<#>` (angle bracket, hash, angle bracket)
- OTP code should appear right after `<#>`
- App hash should be on a new line or at the end
- Total message length should be under 140 characters
- Message expires after 5 minutes

### 3. Backend Implementation
The backend (`Instantlly-Cards-Backend`) is already configured to send SMS in the correct format:

```typescript
// In check-phone and send-reset-otp endpoints
const finalAppHash = (appHash || "").trim();
const message = `<#> ${otp} is your OTP for Instantlly Cards
${finalAppHash}`;
```

## Frontend Implementation

### Using the Hook
The `useSmsRetriever` hook is available in all OTP screens:

```tsx
import { useSmsRetriever } from '@/hooks/useSmsRetriever';

function OTPScreen() {
  const [otp, setOtp] = useState('');
  
  // Start SMS listener automatically
  const { otp: autoOtp, appHash, isListening } = useSmsRetriever({ 
    autoStart: true,
    otpLength: 6 
  });
  
  // Auto-fill OTP when detected
  useEffect(() => {
    if (autoOtp) {
      console.log('Auto-filled OTP:', autoOtp);
      setOtp(autoOtp);
    }
  }, [autoOtp]);
  
  // Send appHash to backend when requesting OTP
  const sendOTP = async () => {
    await api.post('/auth/check-phone', { 
      phone, 
      appHash // Include app hash
    });
  };
  
  return (
    <TextInput 
      value={otp} 
      onChangeText={setOtp}
      placeholder="Enter OTP"
    />
  );
}
```

### Updated Screens
The following screens now support automatic OTP detection:

1. **Signup Screen** (`app/(auth)/signup.tsx`)
   - Auto-detects OTP during phone verification
   - Shows toast notification when OTP is auto-filled

2. **Reset Password Screen** (`app/(auth)/reset-password.tsx`)
   - Auto-detects OTP for password reset flow
   - Works seamlessly with forgot password flow

## Testing

### Development Testing
1. **Get Your App Hash:**
   ```bash
   # Run the app in development
   npm run android
   
   # Check console logs for:
   [SMS Retriever] App Hash: FA+9qCX9VSu
   ```

2. **Test with Fast2SMS:**
   - Ensure `FAST2SMS_API_KEY` is set in backend `.env`
   - Trigger OTP from signup or reset password screen
   - Check SMS content matches the format
   - OTP should auto-fill within 5 seconds of SMS arrival

3. **Manual Testing:**
   ```bash
   # Send test SMS using ADB
   adb shell am broadcast -a com.android.internal.telephony.SMS_RECEIVED \
     --es pdus "0791...YOUR_PDU_HERE"
   ```

### Production Testing
1. **Production App Hash:**
   - Different from development hash
   - Get hash from production build:
   ```typescript
   const prodHash = await SmsRetriever.getHash();
   console.log('Production Hash:', prodHash);
   ```

2. **Update Backend:**
   - Backend receives app hash from client
   - No hard-coding needed
   - Format SMS dynamically with received hash

## Troubleshooting

### OTP Not Auto-Filling
1. **Check SMS Format:**
   ```typescript
   // Correct format
   "<#> 123456 is your OTP for Instantlly Cards\nFA+9qCX9VSu"
   
   // Wrong formats
   "Your OTP is 123456 <#> FA+9qCX9VSu" // ❌ <#> must be at start
   "123456 is your OTP FA+9qCX9VSu" // ❌ Missing <#>
   ```

2. **Check Listener Status:**
   ```typescript
   const { isListening, error } = useSmsRetriever();
   console.log('Listening:', isListening);
   console.log('Error:', error);
   ```

3. **Check App Hash:**
   - App hash changes between builds
   - Development ≠ Production hash
   - Always send current hash from client to backend

4. **Check Google Play Services:**
   - SMS Retriever requires Google Play Services
   - Doesn't work on emulators without Google Play
   - Works on physical devices and emulators with Google Play

### Common Issues
- **Issue:** OTP arrives but doesn't auto-fill
  - **Solution:** Check SMS format, ensure `<#>` is at the start
  
- **Issue:** Different hash in production
  - **Solution:** Get hash from production app, don't hard-code
  
- **Issue:** Listener not starting
  - **Solution:** Check Google Play Services availability
  
- **Issue:** Multiple SMS detected
  - **Solution:** Listener auto-stops after first detection

## API Reference

### `useSmsRetriever` Hook
```typescript
const {
  otp,           // Auto-detected OTP (string | null)
  appHash,       // App's unique hash code (string | null)
  isListening,   // Whether listener is active (boolean)
  error,         // Error message if any (string | null)
  startListening,// Function to manually start listener
  stopListening, // Function to stop listener
  getAppHash,    // Function to get app hash
  resetOtp       // Function to reset OTP state
} = useSmsRetriever({ 
  autoStart: true,  // Auto-start on mount
  otpLength: 6      // Expected OTP length
});
```

### Backend Endpoints
All endpoints that send OTP now accept `appHash` parameter:

```typescript
// POST /api/auth/check-phone
{
  phone: "+919876543210",
  appHash: "FA+9qCX9VSu"
}

// POST /api/auth/send-reset-otp
{
  phone: "+919876543210",
  appHash: "FA+9qCX9VSu"
}
```

## Security Considerations

1. **No Permissions Required:** SMS Retriever doesn't require READ_SMS permission
2. **App-Specific:** Only reads SMS containing your app's hash
3. **Time-Limited:** SMS detection window is 5 minutes
4. **One-Time:** Listener auto-stops after first SMS detection
5. **Privacy-First:** Google Play Services validates the hash

## Package Dependencies

```json
{
  "expo-sms-retriever": "^0.1.1",
  "react-native-sms-retriever": "^1.1.1"
}
```

Both packages are already installed in `package.json`.

## Documentation Links
- [Official Android SMS Retriever API](https://developer.android.com/identity/sms-retriever)
- [Expo SMS Retriever](https://docs.expo.dev/versions/latest/sdk/sms-retriever/)
- [React Native SMS Retriever](https://github.com/react-native-community/react-native-sms-retriever)

## Backward Compatibility
- Manual OTP entry still works
- iOS users unaffected (manual entry only)
- Falls back gracefully if Google Play Services unavailable
- Works alongside existing Fast2SMS integration

## Next Steps
1. ✅ Test in development with real phone number
2. ✅ Verify SMS format in received messages
3. ✅ Test in production build
4. ✅ Monitor auto-fill success rate
5. ✅ Add analytics for tracking auto-fill vs manual entry
