import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * TESTING COMPONENT - Remove from production
 * This allows manual testing of referral codes
 */
export default function ReferralTester() {
  const [code, setCode] = useState('');

  const setReferralCode = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a referral code');
      return;
    }

    try {
      await AsyncStorage.setItem('pending_referral_code', code.trim().toUpperCase());
      Alert.alert('Success', `Referral code ${code} set! Now complete signup to test.`);
      console.log('🎁 Test referral code set:', code);
    } catch (error) {
      Alert.alert('Error', 'Failed to set referral code');
      console.error(error);
    }
  };

  const checkReferralCode = async () => {
    try {
      const stored = await AsyncStorage.getItem('pending_referral_code');
      Alert.alert('Stored Code', stored || 'No referral code stored');
      console.log('🎁 Stored referral code:', stored);
    } catch (error) {
      Alert.alert('Error', 'Failed to check referral code');
    }
  };

  const clearReferralCode = async () => {
    try {
      await AsyncStorage.removeItem('pending_referral_code');
      await AsyncStorage.removeItem('referrer_processed');
      Alert.alert('Success', 'Referral code cleared');
      console.log('🗑️ Referral code cleared');
      setCode('');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear referral code');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Referral Code Tester</Text>
      <Text style={styles.subtitle}>For Development Testing Only</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter referral code (e.g., 78ML4ZD6)"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        maxLength={8}
      />
      
      <TouchableOpacity style={styles.button} onPress={setReferralCode}>
        <Text style={styles.buttonText}>Set Referral Code</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={checkReferralCode}>
        <Text style={styles.buttonText}>Check Stored Code</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearReferralCode}>
        <Text style={styles.buttonText}>Clear Code</Text>
      </TouchableOpacity>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>📋 Testing Steps:</Text>
        <Text style={styles.instructionText}>1. Enter referral code above</Text>
        <Text style={styles.instructionText}>2. Click "Set Referral Code"</Text>
        <Text style={styles.instructionText}>3. Go to signup page</Text>
        <Text style={styles.instructionText}>4. Complete signup</Text>
        <Text style={styles.instructionText}>5. Check credits on both accounts!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 20,
    fontWeight: '600',
  },
  input: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#6366F1',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  instructions: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
});
