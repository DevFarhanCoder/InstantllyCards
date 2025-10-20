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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import groupSharingService, { GroupSharingSession } from '@/lib/groupSharingService';

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
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const codeAnimations = useRef(Array.from({ length: 4 }, () => new Animated.Value(0))).current;

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
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

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
    if (joinCode.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter a 4-digit code');
      return;
    }

    setIsLoading(true);
    
    try {
      const session = await groupSharingService.joinGroupSession(joinCode);
      Vibration.vibrate(100); // Success vibration
      onSuccess(session);
    } catch (error: any) {
      Alert.alert('Join Failed', error.message || 'Invalid or expired code');
      Vibration.vibrate([0, 100, 100, 100]); // Error vibration pattern
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
    // Only allow numeric input and max 4 digits
    const numericText = text.replace(/[^0-9]/g, '').substring(0, 4);
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

  const renderCodeInput = () => (
    <View style={styles.codeInputContainer}>
      <Text style={styles.inputLabel}>Enter Group Code</Text>
      <View style={styles.codeInputRow}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.codeInputDigit}>
            <Text style={styles.codeInputDigitText}>
              {joinCode[index] || ''}
            </Text>
          </View>
        ))}
      </View>
      <TextInput
        style={styles.hiddenInput}
        value={joinCode}
        onChangeText={handleCodeInputChange}
        keyboardType="number-pad"
        maxLength={4}
        autoFocus
        placeholder=""
      />
      <Text style={styles.inputInstruction}>
        Enter the 4-digit code shared by the group admin
      </Text>
    </View>
  );

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
  codeInputDigitText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  inputInstruction: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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