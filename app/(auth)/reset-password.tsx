import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/lib/api';
import Field from '@/components/Field';
import { COLORS } from '@/lib/theme';
import PasswordField from '@/components/PasswordField';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPassword() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'otp' | 'verify' | 'newpwd'>('verify');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState('');

  const sendOtp = async () => {
    try {
      const clean = phone.trim();
      if (!clean) {
        Alert.alert('Error', 'Please enter your registered phone number');
        return;
      }
      setSending(true);
      const res = await api.post('/auth/send-reset-otp', { phone: clean });
      if (res?.otpSent || res?.data?.otpSent) {
        setStep('verify');
        setResendTimer(60);
      } else {
        Alert.alert('Error', res?.message || 'Failed to send OTP');
      }
    } catch (e: any) {
      console.error('send-reset-otp error', e);
      Alert.alert('Error', e?.message || 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  // Mask phone for display: show country code and last 3 digits
  const maskPhone = (full: string) => {
    if (!full) return '';
    const digits = full.replace(/\D/g, '');
    let country = '+91';
    if (full.startsWith('+')) {
      const m = full.match(/^\+(\d{1,3})/);
      if (m) country = `+${m[1]}`;
    }
    const last3 = digits.slice(-3);
    return `${country} XXX ${last3}`;
  };

  // Read persisted phone (if any) set by Login's "Forgot Password" action.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('reset_phone');
        if (!mounted || !stored) return;
        setPhone(stored);
        setResendError('');
        // Attempt to send OTP via backend which verifies the phone exists.
        try {
          const res = await api.post('/auth/send-reset-otp', { phone: stored });
          if (res?.otpSent || res?.data?.otpSent) {
            setStep('verify');
            setResendTimer(60);
          } else {
            // show inline error
            setResendError(res?.message || 'Failed to send OTP');
          }
        } catch (e: any) {
          // If backend returns 404, redirect to signup with message
          if (e?.status === 404) {
            try { await AsyncStorage.setItem('signup_message', 'You have not created the account. Create account'); } catch {}
            router.replace('/signup');
            return;
          }
          console.error('auto send-reset-otp failed', e);
          setResendError(e?.message || 'Unable to send OTP. Please try again.');
        }
      } catch (e) {
        console.error('Failed to read reset_phone from storage', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const verifyOtp = async () => {
    try {
      if (!otp.trim()) {
        Alert.alert('Error', 'Please enter the OTP');
        return;
      }
      setVerifying(true);
      const res = await api.post('/auth/verify-otp', { phone: phone.trim(), otp: otp.trim() });
      const token = res?.resetToken || res?.data?.resetToken;
      if (res?.success || token) {
        setResetToken(token);
        setStep('newpwd');
      } else {
        Alert.alert('Error', res?.message || 'Invalid or expired OTP');
      }
    } catch (e: any) {
      console.error('verify-reset-otp error', e);
      Alert.alert('Error', e?.message || 'Failed to verify OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    if (!phone.trim()) {
      // If phone is missing (e.g. user landed here from Forgot Password and
      // backend already sent the OTP), don't show any error — silently return.
      // This prevents blocking the user with a message asking for the phone.
      return;
    }
    try {
      setResendError('');
      setResending(true);
      const res = await api.post('/auth/send-reset-otp', { phone: phone.trim() });
      if (res?.otpSent || res?.data?.otpSent) {
        setResendTimer(60);
      } else {
        setResendError(res?.message || 'Failed to resend OTP');
      }
    } catch (e: any) {
      console.error('resend error', e);
      setResendError(e?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => {
      setResendTimer(t => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const submitNewPassword = async () => {
    try {
      const p = password.trim();
      if (!p || p.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }
      if (p !== confirmPassword.trim()) {
        setPasswordError('Passwords do not match');
        return;
      }
      if (!resetToken) {
        Alert.alert('Error', 'Reset token missing. Please verify OTP again.');
        return;
      }
      setSending(true);
      const res = await api.post('/auth/reset-password', { resetToken, newPassword: p });
      // On success, navigate to home and show success message
      // Persist phone to prefill login screen, then navigate to login
      try {
        // phone may be in formats like '+911234567890' or '91234567890' or '1234567890'
        // store as-is so login can parse it
        await AsyncStorage.setItem('login_prefill_phone', phone);
      } catch (e) {
        console.warn('Failed to set login prefill phone', e);
      }

      Alert.alert('Success', 'Reset password successfully !!', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);

      try { await AsyncStorage.removeItem('reset_phone'); } catch (e) { /* non-fatal */ }
    } catch (e: any) {
      console.error('reset-password error', e);
      const msg = e?.message || (e?.response?.data?.message) || 'Failed to reset password';
      Alert.alert('Error', msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Reset Password</Text>
        {step === 'otp' && (
          <>
            <Text style={styles.subtitle}>Enter your registered phone number to receive an OTP</Text>
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
              placeholder="8001234567"
              keyboardType="phone-pad"
              style={styles.input}
              maxLength={10}
            />
            <Pressable style={[styles.button, sending && styles.buttonDisabled]} onPress={sendOtp} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
            </Pressable>
            <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.linkRow}>
              <Text style={styles.linkText}>Back to Sign In</Text>
            </Pressable>
          </>
        )}

        {step === 'verify' && (
          <>
            <Text style={styles.subtitle}>{phone ? `We have sent an OTP to ${maskPhone(phone)}` : 'OTP has been sent to your registered phone number'}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Enter OTP</Text>
              <Field
                label=""
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <View style={styles.otpFooter}>
                {resendTimer > 0 ? (
                  <Text style={styles.timerText}>Resend OTP in {resendTimer}s</Text>
                ) : (
                  <Pressable onPress={handleResend} disabled={resending}>
                    <Text style={[styles.resendText, resending && styles.resendTextDisabled]}>
                      {resending ? 'Resending...' : 'Resend OTP'}
                    </Text>
                  </Pressable>
                )}
                {resendError ? <Text style={styles.inlineError}>{resendError}</Text> : null}
              </View>
            </View>

            <Pressable style={[styles.button, verifying && styles.buttonDisabled]} onPress={verifyOtp} disabled={verifying}>
              {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
            </Pressable>
          </>
        )}

        {step === 'newpwd' && (
          <>
            <Text style={styles.subtitle}>Enter your new password</Text>

            <View style={{ marginBottom: 12 }}>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, paddingVertical: 10 }]}
                  placeholder="New Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showNewPassword}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }}
                />
                <Pressable style={styles.visibilityButton} onPress={() => setShowNewPassword(s => !s)} accessibilityLabel={showNewPassword ? 'Hide password' : 'Show password'}>
                  <Ionicons name={showNewPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
                </Pressable>
              </View>
              {password.length > 0 && password.length < 6 && (
                <Text style={styles.inlineError}>Password must be at least 6 characters</Text>
              )}
            </View>

            <View style={{ marginBottom: 18 }}>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, paddingVertical: 10 }]}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); if (passwordError) setPasswordError(''); }}
                />
                <Pressable style={styles.visibilityButton} onPress={() => setShowConfirmPassword(s => !s)} accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                  <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
                </Pressable>
              </View>
              {passwordError ? <Text style={styles.inlineError}>{passwordError}</Text> : null}
            </View>

            <Pressable style={[styles.button, (sending || password.length < 6 || password !== confirmPassword) && styles.buttonDisabled]} onPress={submitNewPassword} disabled={sending || password.length < 6 || password !== confirmPassword}>
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Set New Password</Text>}
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  box: { margin: 20, backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { color: '#6B7280', marginBottom: 12 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  button: { backgroundColor: '#F97316', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  linkRow: { alignItems: 'center', marginTop: 6 },
  linkText: { color: '#4F6AF3', fontWeight: '600' },
  otpInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E9EE',
    paddingVertical: 12,
    paddingHorizontal: 18,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: 12,
    width: 220,
    alignSelf: 'center'
  },
  resendRow: { alignItems: 'center', marginBottom: 8 },
  resendText: { color: '#4F6AF3', fontWeight: '600' },
  resendDisabled: { color: '#9CA3AF' },
  /* styles added to match signup OTP layout */
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  otpFooter: {
    marginTop: 12,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendTextDisabled: {
    color: '#9CA3AF',
  },
  inlineError: {
    color: '#EF4444',
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8ECEF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
  },
  visibilityButton: {
    padding: 8,
    marginLeft: 8,
  },
});
