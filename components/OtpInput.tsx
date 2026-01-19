import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';

interface OtpInputProps {
  length: number;
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
}

export default function OtpInput({ length, value, onChangeText, autoFocus = false }: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (text: string, index: number) => {
    // Only allow digits
    const sanitized = text.replace(/[^0-9]/g, '');
    
    if (sanitized.length === 0) {
      // Handle deletion
      const newValue = value.split('');
      newValue[index] = '';
      onChangeText(newValue.join(''));
      
      // Move to previous input
      if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (sanitized.length === 1) {
      // Single digit entered
      const newValue = value.split('');
      newValue[index] = sanitized;
      onChangeText(newValue.join(''));
      
      // Move to next input if not at the end
      if (index < length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (sanitized.length > 1) {
      // Multiple digits pasted
      const digits = sanitized.slice(0, length).split('');
      const newValue = value.split('');
      
      digits.forEach((digit, i) => {
        if (index + i < length) {
          newValue[index + i] = digit;
        }
      });
      
      onChangeText(newValue.join(''));
      
      // Focus on the last filled input or the next empty one
      const nextIndex = Math.min(index + digits.length, length - 1);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      // If current box is empty and backspace pressed, move to previous
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // Select all text on focus for easier editing
    const input = inputRefs.current[index];
    if (input) {
      setTimeout(() => input.setNativeProps({ selection: { start: 0, end: 1 } }), 10);
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }, (_, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[
            styles.input,
            value[index] && styles.inputFilled,
          ]}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          autoComplete="sms-otp"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  inputFilled: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
});
