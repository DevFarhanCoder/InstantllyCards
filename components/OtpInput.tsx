import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';

interface OtpInputProps {
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
}

export default function OtpInput({ 
  length = 6, 
  value, 
  onChangeText,
  autoFocus = true 
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Sync external value changes to internal state
  useEffect(() => {
    if (value) {
      const newOtp = value.split('').slice(0, length);
      while (newOtp.length < length) {
        newOtp.push('');
      }
      setOtp(newOtp);
    } else {
      setOtp(Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (text: string, index: number) => {
    // Only allow single digit
    const digit = text.slice(-1);
    
    if (digit && !/^\d$/.test(digit)) {
      return; // Only allow numbers
    }

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Notify parent
    const otpString = newOtp.join('');
    onChangeText(otpString);

    // Auto focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty, go to previous box
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleBoxPress = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  return (
    <View style={styles.container}>
      {otp.map((digit, index) => (
        <Pressable 
          key={index} 
          onPress={() => handleBoxPress(index)}
          style={styles.boxWrapper}
        >
          <TextInput
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.box,
              digit ? styles.boxFilled : styles.boxEmpty
            ]}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={index === 0 && autoFocus}
            selectTextOnFocus
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  boxWrapper: {
    flex: 1,
    maxWidth: 50,
  },
  box: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  boxEmpty: {
    borderColor: '#E0E0E0',
    color: '#333',
  },
  boxFilled: {
    borderColor: '#FF6B6B',
    color: '#FF6B6B',
  },
});
