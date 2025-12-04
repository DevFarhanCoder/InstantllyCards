import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import groupSharingService, { GroupSharingSession, GroupParticipant } from '../lib/groupSharingService';
import CustomToast, { ToastType } from './CustomToast';

const { width, height } = Dimensions.get('window');

interface GroupConnectionUIProps {
  visible: boolean;
  session: GroupSharingSession | null;
  isAdmin: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export default function GroupConnectionUI({
  visible,
  session,
  isAdmin,
  onClose,
  onConnect
}: GroupConnectionUIProps) {
  // Ref to store polling interval
  const pollingIntervalRef = useRef<number | null>(null);
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  
  // Helper to show toast
  const showToast = (message: string, type: ToastType = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };
  
  // Animations
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const rippleAnimation = useRef(new Animated.Value(0)).current;
  const participantAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Update participants when session changes
  useEffect(() => {
    if (session?.participants) {
      console.log('👥 GroupConnection: Updating participants, count:', session.participants.length);
      setParticipants(session.participants);
      
      // Animate new participants
      session.participants.forEach((participant: GroupParticipant) => {
        if (!participantAnimations[participant.id]) {
          participantAnimations[participant.id] = new Animated.Value(0);
          Animated.spring(participantAnimations[participant.id], {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      });
    }
  }, [session, session?.participants?.length]);

  // Real-time monitoring for session status changes
  useEffect(() => {
    if (!visible || !session) return;

    const checkSessionStatus = async () => {
      try {
        console.log('📊 Fetching session status from backend...');
        const currentSession = await groupSharingService.getCurrentSession();
        
        if (!currentSession) {
          console.log('⏰ Session expired or not found');
          stopPolling();
          showToast('Session ended or expired', 'info');
          handleClose();
          return;
        }

        // Update participants from latest session data
        if (currentSession.participants) {
          console.log('👥 GroupConnection: Real-time update - participants:', currentSession.participants.length);
          setParticipants(currentSession.participants);
        }

        // Auto-open session screen when admin starts sharing
        if (currentSession.status === 'connected' || currentSession.status === 'sharing') {
          console.log('✅ Session is now connected/sharing, opening session screen');
          stopPolling();
          onConnect();
        }

        // Close for non-admin if session ends
        if (!isAdmin && (currentSession.status === 'completed' || currentSession.status === 'expired')) {
          console.log('⏰ Session completed/expired for participant');
          stopPolling();
          showToast('Session ended by admin', 'info');
          handleClose();
        }
      } catch (error) {
        // Even safer error handling for error.response and error.message
        let errorMsg: string = '';
        let errorStatus: number | undefined = undefined;
        if (error && typeof error === 'object') {
          if ('response' in error && error.response && typeof error.response === 'object') {
            if ('data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
              if (typeof error.response.data.error === 'string') {
                errorMsg = error.response.data.error;
              } else {
                errorMsg = '';
              }
            }
            if ('status' in error.response && typeof error.response.status === 'number') {
              errorStatus = error.response.status;
            }
          }
          if ('message' in error && typeof error.message === 'string' && !errorMsg) {
            errorMsg = error.message;
          }
        }
        if (errorStatus === 404 || (typeof errorMsg === 'string' && (errorMsg.includes('Session not found') || errorMsg.includes('expired')))) {
          stopPolling();
          showToast('Session ended or expired', 'info');
          handleClose();
          return;
        }
        console.error('❌ Failed to get session status:', error);
      }
    };

    // Start polling
    pollingIntervalRef.current = window.setInterval(checkSessionStatus, 2000);
    // Run once immediately
    checkSessionStatus();

    return () => {
      stopPolling();
    };
  }, [visible, session, isAdmin]);

  // Helper to stop polling immediately
  const stopPolling = () => {
    if (pollingIntervalRef.current !== null) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('🛑 (Immediate) Stopped group sharing polling');
    }
  };

  // Custom close handler to stop polling and end session if admin
  const handleClose = async () => {
    stopPolling();
    if (isAdmin) {
      try {
        await groupSharingService.endSession();
        console.log('✅ Session ended by admin via close button');
      } catch (e) {
        console.error('❌ Error ending session on close:', e);
      }
    }
    onClose();
  };

  // Countdown timer
  useEffect(() => {
    if (!visible || !session) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(session.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        showToast('The group sharing session has expired.', 'error');
        onClose();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, session]);

  // Pulse animation
  useEffect(() => {
    if (!visible) return;

    const createPulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => createPulse());
    };

    createPulse();
  }, [visible]);

  // Ripple animation for tap to connect
  const createRipple = () => {
    rippleAnimation.setValue(0);
    Animated.timing(rippleAnimation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  };

  const handleConnect = async () => {
    if (!isAdmin) return;
    
    setIsConnecting(true);
    createRipple();
    
    try {
      const success = await groupSharingService.connectAllParticipants();
      if (success) {
        // Call onConnect to show the session UI
        onConnect();
      } else {
        showToast('Unable to connect all participants. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Failed to connect participants.', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderParticipant = (participant: GroupParticipant, index: number) => {
    const angle = (index / Math.max(participants.length, 1)) * 2 * Math.PI;
    const radius = width * 0.32;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    const animatedValue = participantAnimations[participant.id] || new Animated.Value(1);

    return (
      <Animated.View
        key={participant.id}
        style={[
          styles.participantContainer,
          {
            transform: [
              { translateX: x },
              { translateY: y },
              { scale: animatedValue }
            ],
          },
        ]}
      >
        <View style={[styles.participantAvatar, participant.isOnline && styles.onlineAvatar]}>
          {participant.photo ? (
            <Image source={{ uri: participant.photo }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {participant.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {participant.isOnline && (
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
            </View>
          )}
        </View>
        <Text style={styles.participantName} numberOfLines={1}>
          {participant.name}
        </Text>
      </Animated.View>
    );
  };

  if (!visible || !session) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {/* Gradient Background */}
        <View style={styles.gradientBackground}>
          {/* Animated circles in background */}
          <Animated.View style={[styles.bgCircle, styles.bgCircle1, { opacity: 0.1 }]} />
          <Animated.View style={[styles.bgCircle, styles.bgCircle2, { opacity: 0.08 }]} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          {/* Modern Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <View style={styles.closeButtonBg}>
                <Ionicons name="close" size={22} color="#1F2937" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.timerBadge}>
              <Ionicons name="time-outline" size={14} color="#EF4444" />
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Group Sharing</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Code:</Text>
              <Text style={styles.codeValue}>{session.code}</Text>
            </View>
          </View>

          {/* Connection Area */}
          <View style={styles.connectionArea}>
            {/* Animated Background Rings */}
            <Animated.View
              style={[
                styles.pulseRing,
                styles.pulseRing1,
                {
                  transform: [{ scale: pulseAnimation }],
                  opacity: pulseAnimation.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.3, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRing,
                styles.pulseRing2,
                {
                  transform: [{ 
                    scale: pulseAnimation.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1, 1.15],
                    })
                  }],
                  opacity: pulseAnimation.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.2, 0],
                  }),
                },
              ]}
            />

            {/* Center Logo */}
            <View style={styles.centerLogoContainer}>
              <View style={styles.centerLogoCircle}>
                <Image
                  source={require('../assets/images/Instantlly_Logo-removebg.png')}
                  style={styles.centerLogo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Participants arranged in circle */}
            <View style={styles.participantsContainer}>
              {participants.map((participant, index) => 
                renderParticipant(participant, index)
              )}
            </View>
          </View>

          {/* Start Sharing Button - Now at Bottom */}
          <View style={styles.bottomButtonContainer}>
            {isAdmin ? (
              <TouchableOpacity
                style={styles.startSharingButton}
                onPress={handleConnect}
                disabled={isConnecting}
                activeOpacity={0.8}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.startSharingButtonText}>Start Sharing</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.waitingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={styles.waitingText}>Waiting for Admin to Start...</Text>
              </View>
            )}
          </View>

          {/* Modern Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people" size={18} color="#6366F1" />
                </View>
                <Text style={styles.statValue}>{participants.length}</Text>
                <Text style={styles.statLabel}>
                  {participants.length === 1 ? 'Participant' : 'Participants'}
                </Text>
              </View>
              
              {isAdmin && (
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, styles.adminIconContainer]}>
                    <Ionicons name="shield-checkmark" size={18} color="#F59E0B" />
                  </View>
                  <Text style={[styles.statValue, styles.adminStatValue]}>Admin</Text>
                  <Text style={styles.statLabel}>You're the host</Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
        
        {/* Toast Notification */}
        <CustomToast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8F9FF',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#6366F1',
  },
  bgCircle1: {
    width: 400,
    height: 400,
    top: -100,
    right: -100,
  },
  bgCircle2: {
    width: 300,
    height: 300,
    bottom: -50,
    left: -50,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeButton: {
    zIndex: 10,
  },
  closeButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 4,
  },
  titleSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 2,
  },
  connectionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#6366F1',
  },
  pulseRing1: {
    width: 200,
    height: 200,
  },
  pulseRing2: {
    width: 240,
    height: 240,
  },
  centerLogoContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLogoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  centerLogo: {
    width: 90,
    height: 90,
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  startSharingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  startSharingButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  waitingText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  participantsContainer: {
    width: width,
    height: height * 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineAvatar: {
    borderColor: '#10B981',
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  participantName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 90,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'transparent',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  adminIconContainer: {
    backgroundColor: '#FEF3C7',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 2,
  },
  adminStatValue: {
    color: '#F59E0B',
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  participantCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  participantCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
    marginLeft: 8,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  adminInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
    marginLeft: 4,
  },
});