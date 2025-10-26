import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  Vibration,
  Keyboard,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import groupSharingService, { GroupSharingSession } from '@/lib/groupSharingService';

// Updated: OTP-style input with 4 boxes only
interface GroupSharingModalProps {
  visible: boolean;
  mode: 'create' | 'join';
  onClose: () => void;
  onSuccess: (session: GroupSharingSession, code?: string) => void;
}

export default function GroupSharingModal({
  visible,
  mode,
  onClose,
  onSuccess
}: GroupSharingModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  
  // Refs
  const hiddenInputRef = useRef<TextInput>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const codeAnimations = useRef(Array.from({ length: 4 }, () => new Animated.Value(0))).current;
  
  // Individual digit animations for typing effect
  const digitScales = useRef(Array.from({ length: 4 }, () => new Animated.Value(1))).current;
  const digitOpacities = useRef(Array.from({ length: 4 }, () => new Animated.Value(1))).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setJoinCode('');
      setGeneratedCode(null);
      setIsLoading(false);
      
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
      
      // Auto-focus the hidden input in join mode after animation
      if (mode === 'join') {
        console.log('⌨️ Join mode detected, will focus input');
        setTimeout(() => {
          console.log('⌨️ Focusing hidden input now');
          hiddenInputRef.current?.focus();
        }, 500);
      }
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, mode]);

  // Animate code display
  const animateCode = (code: string) => {
    codeAnimations.forEach((anim, index) => {
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        delay: index * 100,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();
    });
  };

  const handleCreateGroup = async () => {
    console.log('🚀 handleCreateGroup called');
    setIsLoading(true);
    
    // Safety timeout - reset loading state after 10 seconds if something goes wrong
    const timeoutId = setTimeout(() => {
      console.log('⚠️ Operation timed out after 10 seconds');
      setIsLoading(false);
      Alert.alert('Timeout', 'Operation took too long. Please try again.');
    }, 10000);
    
    try {
      console.log('📞 Calling groupSharingService.createGroupSession...');
      const result = await Promise.race([
        groupSharingService.createGroupSession(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 8000)
        )
      ]);
      
      clearTimeout(timeoutId);
      console.log('✅ Session created successfully:', result.code);
      
      setGeneratedCode(result.code);
      animateCode(result.code);
      
      try {
        Vibration.vibrate([0, 100, 50, 100]); // Success vibration pattern
      } catch (vibError) {
        console.log('⚠️ Vibration not available:', vibError);
      }
      
      // Auto-proceed to connection UI after 2 seconds
      console.log('⏱️ Setting timeout to call onSuccess...');
      setTimeout(() => {
        console.log('✅ Calling onSuccess with session');
        setIsLoading(false);
        onSuccess(result.session, result.code);
      }, 2000);
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ Error in handleCreateGroup:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);
      setIsLoading(false);
      Alert.alert('Error', error.message || 'Failed to create group. Please try again.');
    }
  };

  const handleJoinGroup = async () => {
    // Validation
    if (joinCode.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter a complete 4-digit code');
      return;
    }
    
    // Additional validation - must be all numeric
    if (!/^\d{4}$/.test(joinCode)) {
      Alert.alert('Invalid Code', 'Code must contain only numbers');
      return;
    }

    console.log('🔗 Attempting to join group with code:', joinCode);
    setIsLoading(true);
    
    try {
      const session = await groupSharingService.joinGroupSession(joinCode);
      console.log('✅ Successfully joined group:', session.id);
      
      try {
        Vibration.vibrate(100); // Success vibration
      } catch (e) {
        console.log('Vibration not available');
      }
      
      // Show success feedback
      Alert.alert(
        'Success!', 
        `Joined group hosted by ${session.adminName}`,
        [
          {
            text: 'OK',
            onPress: () => onSuccess(session)
          }
        ]
      );
      
    } catch (error: any) {
      console.error('❌ Failed to join group:', error);
      
      // Determine error type and show appropriate message
      let errorTitle = 'Join Failed';
      let errorMessage = 'Unable to join group. Please check the code and try again.';
      
      if (error.message.includes('Invalid code')) {
        errorTitle = 'Invalid Code';
        errorMessage = 'The code you entered is not valid. Please check and try again.';
      } else if (error.message.includes('expired')) {
        errorTitle = 'Code Expired';
        errorMessage = 'This group code has expired. Please ask for a new code.';
      } else if (error.message.includes('not found')) {
        errorTitle = 'Code Not Found';
        errorMessage = 'No active group found with this code.';
      }
      
      Alert.alert(errorTitle, errorMessage);
      
      try {
        Vibration.vibrate([0, 100, 100, 100]); // Error vibration pattern
      } catch (e) {
        console.log('Vibration not available');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleCodeInputChange = (text: string) => {
    console.log('✏️ Code input changed:', text);
    // Only allow numeric input and max 4 digits
    const numericText = text.replace(/[^0-9]/g, '').substring(0, 4);
    console.log('✏️ Setting joinCode to:', numericText);
    
    // Animate the newly typed digit
    if (numericText.length > joinCode.length) {
      // New digit added
      const index = numericText.length - 1;
      digitScales[index].setValue(0);
      digitOpacities[index].setValue(0);
      
      Animated.parallel([
        Animated.spring(digitScales[index], {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.timing(digitOpacities[index], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Vibrate on each digit entry
      try {
        Vibration.vibrate(50);
      } catch (e) {
        console.log('Vibration not available');
      }
      
      // Auto-submit when 4 digits are entered
      if (numericText.length === 4) {
        console.log('✅ 4 digits entered, preparing to submit');
        // Small delay to let the last digit animation complete
        setTimeout(() => {
          console.log('🚀 Auto-submitting join request');
          handleJoinGroup();
        }, 300);
      }
      
    } else if (numericText.length < joinCode.length) {
      // Digit deleted - animate out
      const index = joinCode.length - 1;
      Animated.parallel([
        Animated.spring(digitScales[index], {
          toValue: 0.8,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.timing(digitOpacities[index], {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        digitScales[index].setValue(1);
        digitOpacities[index].setValue(1);
      });
    }
    
    setJoinCode(numericText);
  };

  const renderCodeDisplay = () => {
    if (!generatedCode) return null;
    
    return (
      <View style={styles.codeDisplayContainer}>
        <Text style={styles.codeLabel}>Your Group Code</Text>
        <View style={styles.codeDisplay}>
          {generatedCode.split('').map((digit, index) => (
            <Animated.View
              key={index}
              style={[
                styles.codeDigit,
                {
                  transform: [
                    { scale: codeAnimations[index] },
                    {
                      rotate: codeAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['180deg', '0deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.codeDigitText}>{digit}</Text>
            </Animated.View>
          ))}
        </View>
        <Text style={styles.codeInstruction}>
          Share this code with others to let them join your group
        </Text>
        <View style={styles.codeTimer}>
          <Ionicons name="time-outline" size={16} color="#EF4444" />
          <Text style={styles.codeTimerText}>Expires in 10 minutes</Text>
        </View>
      </View>
    );
  };

  const renderCodeInput = () => {
    console.log('🔍 Rendering code input, joinCode:', joinCode);
    return (
      <View style={styles.codeInputContainer}>
        <Text style={styles.inputLabel}>Enter Group Code</Text>
        <Pressable 
          onPress={() => {
            console.log('📱 Code boxes tapped, focusing input');
            hiddenInputRef.current?.focus();
          }}
        >
          <View style={styles.codeInputRow}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Animated.View 
                key={index} 
                style={[
                  styles.codeInputDigit,
                  joinCode[index] && styles.codeInputDigitFilled,
                  joinCode.length === index && styles.codeInputDigitActive,  // Only current empty box is active
                  {
                    transform: [{ scale: digitScales[index] }],
                  }
                ]}
              >
                <Animated.Text 
                  style={[
                    styles.codeInputDigitText,
                    { opacity: digitOpacities[index] }
                  ]}
                >
                  {joinCode[index] || ''}
                </Animated.Text>
              </Animated.View>
            ))}
            
            {/* Hidden TextInput positioned over the boxes */}
            <TextInput
              ref={hiddenInputRef}
              style={styles.hiddenInput}
              value={joinCode}
              onChangeText={handleCodeInputChange}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus={mode === 'join'}
              caretHidden
              editable={true}
              contextMenuHidden
              onBlur={() => console.log('⌨️ Input lost focus')}
              onFocus={() => console.log('⌨️ Input gained focus')}
            />
          </View>
        </Pressable>
        
        <Text style={styles.inputInstruction}>
          Tap the boxes above to enter code
        </Text>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>
                  {mode === 'create' ? 'Create Group Sharing' : 'Join Group Sharing'}
                </Text>
              </View>
              <View style={styles.headerRight} />
            </View>

            {/* Content */}
            <View style={styles.body}>
              <View style={styles.iconContainer}>
                <View style={styles.iconBackground}>
                  <Ionicons 
                    name={mode === 'create' ? 'add-circle' : 'enter'} 
                    size={48} 
                    color="#6366F1" 
                  />
                </View>
              </View>

              {mode === 'create' ? (
                <>
                  {generatedCode ? (
                    renderCodeDisplay()
                  ) : (
                    <View style={styles.createContent}>
                      <Text style={styles.description}>
                        Create a group to share business cards with multiple people at once. 
                        You'll become the admin and can control when to start sharing.
                      </Text>
                      
                      <View style={styles.features}>
                        <View style={styles.featureItem}>
                          <Ionicons name="people" size={20} color="#10B981" />
                          <Text style={styles.featureText}>Connect with multiple people</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <Ionicons name="card" size={20} color="#10B981" />
                          <Text style={styles.featureText}>Share multiple cards at once</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <Ionicons name="time" size={20} color="#10B981" />
                          <Text style={styles.featureText}>10-minute sharing session</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                renderCodeInput()
              )}
            </View>

            {/* Footer */}
            {!generatedCode && (
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    (mode === 'join' && joinCode.length !== 4) && styles.actionButtonDisabled,
                  ]}
                  onPress={mode === 'create' ? handleCreateGroup : handleJoinGroup}
                  disabled={isLoading || (mode === 'join' && joinCode.length !== 4)}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {mode === 'create' ? 'Create Group' : 'Join Group'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 3,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flex: 1,
  },
  body: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createContent: {
    alignItems: 'center',
    width: '100%',
  },
  features: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  // Code display styles
  codeDisplayContainer: {
    alignItems: 'center',
    width: '100%',
  },
  codeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  codeDisplay: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  codeDigit: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  codeDigitText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  codeInstruction: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  codeTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  codeTimerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 4,
  },
  // Code input styles
  codeInputContainer: {
    alignItems: 'center',
    width: '100%',
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  codeInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  codeInputDigit: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  codeInputDigitFilled: {
    backgroundColor: '#F0F4FF',
    borderColor: '#E5E7EB',  // Filled boxes keep normal border
  },
  codeInputDigitText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  codeInputDigitActive: {
    borderColor: '#6366F1',  // Only the current typing box gets blue border
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
    fontSize: 1,
  },
  inputInstruction: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});