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
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import groupSharingService, { GroupSharingSession, GroupParticipant } from '@/lib/groupSharingService';

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
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  
  // Animations
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const rippleAnimation = useRef(new Animated.Value(0)).current;
  const participantAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Update participants when session changes
  useEffect(() => {
    if (session?.participants) {
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
  }, [session]);

  // Countdown timer
  useEffect(() => {
    if (!visible || !session) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(session.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        Alert.alert('Session Expired', 'The group sharing session has expired.');
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
        // Navigate to My Cards for card selection
        onConnect();
        router.push('/(tabs)/mycards?mode=groupSharing');
      } else {
        Alert.alert('Connection Failed', 'Unable to connect all participants. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect participants.');
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
    const radius = width * 0.3;
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
            <Text style={styles.avatarText}>
              {participant.name.charAt(0).toUpperCase()}
            </Text>
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
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Group Sharing</Text>
            <Text style={styles.headerSubtitle}>Code: {session.code}</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={16} color="#EF4444" />
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          </View>
        </View>

        {/* Connection Area */}
        <View style={styles.connectionArea}>
          {/* Center Connect Button */}
          <View style={styles.centerContainer}>
            <Animated.View
              style={[
                styles.rippleContainer,
                {
                  transform: [{ scale: rippleAnimation }],
                  opacity: rippleAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0],
                  }),
                },
              ]}
            />
            
            <TouchableOpacity
              style={[
                styles.connectButton,
                !isAdmin && styles.connectButtonDisabled,
              ]}
              onPress={handleConnect}
              disabled={!isAdmin || isConnecting}
            >
              <Animated.View
                style={[
                  styles.connectButtonInner,
                  { transform: [{ scale: pulseAnimation }] },
                ]}
              >
                {isConnecting ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="link" size={32} color="#FFFFFF" />
                    <Text style={styles.connectButtonText}>
                      {isAdmin ? 'Tap to Connect' : 'Waiting for Admin'}
                    </Text>
                  </>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Participants arranged in circle */}
          <View style={styles.participantsContainer}>
            {participants.map((participant, index) => 
              renderParticipant(participant, index)
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.participantCount}>
            <Ionicons name="people" size={20} color="#6366F1" />
            <Text style={styles.participantCountText}>
              {participants.length} {participants.length === 1 ? 'Participant' : 'Participants'}
            </Text>
          </View>
          
          {isAdmin && (
            <View style={styles.adminInfo}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.adminInfoText}>You are the admin</Text>
            </View>
          )}
          
          <Text style={styles.instructionText}>
            {isAdmin 
              ? "Tap the connect button to start card sharing with all participants"
              : "Wait for the admin to connect everyone to start sharing cards"
            }
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
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
    flex: 2,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 4,
  },
  connectionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#6366F1',
  },
  connectButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  connectButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  connectButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  onlineAvatar: {
    borderColor: '#10B981',
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
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
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 80,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});