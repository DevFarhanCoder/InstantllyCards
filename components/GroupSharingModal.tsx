import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  Vibration,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import groupSharingService, { GroupSharingSession } from '../lib/groupSharingService';
import CustomToast, { ToastType } from './CustomToast';

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
  const [allowParticipantSharing, setAllowParticipantSharing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  
  const showToast = (message: string, type: ToastType = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };
  
  // Refs
  const hiddenInputRef = useRef<TextInput>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const codeAnimations = useRef(Array.from({ length: 4 }, () => new Animated.Value(0))).current;
  const digitScales = useRef(Array.from({ length: 4 }, () => new Animated.Value(1))).current;
  const digitOpacities = useRef(Array.from({ length: 4 }, () => new Animated.Value(1))).current;

  useEffect(() => {
    if (visible) {
      console.log('📱 GroupSharingModal opened - Mode:', mode);
      setJoinCode('');
      setGeneratedCode(null);
      setIsLoading(false);
      setShowSettingsModal(false);
      
      groupSharingService.clearSession();
      
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
      
      if (mode === 'join') {
        setTimeout(() => {
          hiddenInputRef.current?.focus();
        }, 500);
      }
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, mode]);

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

  const handleNext = () => {
    console.log('📋 Opening settings modal');
    setShowSettingsModal(true);
  };

  const handleCreateGroup = async () => {
    console.log('🚀 handleCreateGroup called');
    console.log('🔐 allowParticipantSharing:', allowParticipantSharing);
    setShowSettingsModal(false);
    setIsLoading(true);
    
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      showToast('Operation took too long. Please try again.', 'error');
    }, 10000);
    
    try {
      const result = await Promise.race([
        groupSharingService.createGroupSession(allowParticipantSharing),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 8000)
        )
      ]);
      
      clearTimeout(timeoutId);
      console.log('✅ Session created successfully:', result.code);
      
      setGeneratedCode(result.code);
      animateCode(result.code);
      
      try {
        Vibration.vibrate([0, 100, 50, 100]);
      } catch (vibError) {
        console.log('⚠️ Vibration not available');
      }
      
      setTimeout(() => {
        setIsLoading(false);
        onSuccess(result.session, result.code);
      }, 2000);
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ Error in handleCreateGroup:', error);
      setIsLoading(false);
      showToast(error.message || 'Failed to create group. Please try again.', 'error');
    }
  };

  const handleJoinGroup = async () => {
    if (isLoading) return;
    
    if (joinCode.length !== 4) {
      showToast('Please enter a complete 4-digit code', 'warning');
      return;
    }
    
    if (!/^\d{4}$/.test(joinCode)) {
      showToast('Code must contain only numbers', 'warning');
      return;
    }

    console.log('🔗 Attempting to join group with code:', joinCode);
    setIsLoading(true);
    
    try {
      const session = await groupSharingService.joinGroupSession(joinCode);
      console.log('✅ Successfully joined group:', session.id);
      
      try {
        Vibration.vibrate(100);
      } catch (e) {
        console.log('Vibration not available');
      }
      
      showToast(`Joined group hosted by ${session.adminName}`, 'success');
      setTimeout(() => {
        onSuccess(session);
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Failed to join group:', error);
      
      let errorMessage = 'Unable to join group. Please check the code and try again.';
      
      if (error.message.includes('Invalid code')) {
        errorMessage = 'The code you entered is not valid. Please check and try again.';
      } else if (error.message.includes('expired')) {
        errorMessage = 'This group code has expired. Please ask for a new code.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'No active group found with this code.';
      }
      
      showToast(errorMessage, 'error');
      
      try {
        Vibration.vibrate([0, 100, 100, 100]);
      } catch (e) {
        console.log('Vibration not available');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowSettingsModal(false);
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
    const numericText = text.replace(/[^0-9]/g, '').substring(0, 4);
    
    if (numericText.length > joinCode.length) {
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
      
      try {
        Vibration.vibrate(50);
      } catch (e) {
        console.log('Vibration not available');
      }
    } else if (numericText.length < joinCode.length) {
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
    return (
      <View style={styles.codeInputContainer}>
        <Text style={styles.inputLabel}>Enter Group Code</Text>
        <Pressable 
          onPress={() => hiddenInputRef.current?.focus()}
        >
          <View style={styles.codeInputRow}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Animated.View 
                key={index} 
                style={[
                  styles.codeInputDigit,
                  joinCode[index] && styles.codeInputDigitFilled,
                  joinCode.length === index && styles.codeInputDigitActive,
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
            />
          </View>
        </Pressable>
        
        <Text style={styles.inputInstruction}>
          Tap the boxes above to enter code
        </Text>
      </View>
    );
  };

  return (
    <>
      {/* Main Modal */}
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
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
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.title}>
                {mode === 'create' ? 'Create Group Sharing' : 'Join Group Sharing'}
              </Text>
              <View style={{ width: 40 }} />
            </View>

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
                generatedCode ? (
                  renderCodeDisplay()
                ) : (
                  <>
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
                  </>
                )
              ) : (
                renderCodeInput()
              )}
            </View>

            {!generatedCode && (
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    (mode === 'join' && joinCode.length !== 4) && styles.actionButtonDisabled,
                  ]}
                  onPress={mode === 'create' ? handleNext : handleJoinGroup}
                  disabled={isLoading || (mode === 'join' && joinCode.length !== 4)}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {mode === 'create' ? 'Next' : 'Join Group'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.settingsContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)} style={styles.closeButton}>
                <Ionicons name="arrow-back" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.title}>Group Settings</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.settingsBody}>
              <View style={styles.sharingControl}>
                <View style={styles.sharingControlHeader}>
                  <Ionicons
                    name={allowParticipantSharing ? 'people' : 'shield-checkmark'}
                    size={24}
                    color="#6366F1"
                  />
                  <Text style={styles.sharingControlTitle}>Sharing Permissions</Text>
                </View>
                
                {/* Radio Option 1: Only admin shares cards */}
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => setAllowParticipantSharing(false)}
                  activeOpacity={0.7}
                >
                  <View style={styles.radioButton}>
                    {!allowParticipantSharing && <View style={styles.radioButtonInner} />}
                  </View>
                  <View style={styles.radioTextContainer}>
                    <Text style={styles.radioLabel}>Only admin shares cards</Text>
                    <Text style={styles.radioHint}>Participants only exchange with admin</Text>
                  </View>
                </TouchableOpacity>

                {/* Radio Option 2: Participants can share with each other */}
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => setAllowParticipantSharing(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.radioButton}>
                    {allowParticipantSharing && <View style={styles.radioButtonInner} />}
                  </View>
                  <View style={styles.radioTextContainer}>
                    <Text style={styles.radioLabel}>Participants can share with each other</Text>
                    <Text style={styles.radioHint}>Everyone exchanges cards with everyone</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCreateGroup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Create Group</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </>
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
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingsContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    padding: 24,
  },
  settingsBody: {
    padding: 24,
    minHeight: 200,
  },
  iconContainer: {
    alignItems: 'center',
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
  features: {
    gap: 12,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  sharingControl: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E4FF',
  },
  sharingControlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sharingControlTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  sharingControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sharingControlInfo: {
    flex: 1,
    marginRight: 12,
  },
  sharingControlLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  sharingControlHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366F1',
  },
  radioTextContainer: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  radioHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  codeDisplayContainer: {
    alignItems: 'center',
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
  codeInputContainer: {
    alignItems: 'center',
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
    borderColor: '#E5E7EB',
  },
  codeInputDigitText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  codeInputDigitActive: {
    borderColor: '#6366F1',
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
