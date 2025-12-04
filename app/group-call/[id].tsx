import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '../../lib/useUser';
import { socketService } from '../../lib/socket';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CallParticipant {
  id: string;
  name: string;
  profilePicture?: string;
  isAudioMuted: boolean;
  isVideoEnabled: boolean;
  isHost: boolean;
  joinedAt: string;
}

export default function GroupCallScreen() {
  const { id: groupId, type: callType, groupName } = useLocalSearchParams<{ 
    id: string; 
    type: 'audio' | 'video'; 
    groupName: string; 
  }>();
  
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const callStartTime = useRef<Date>(new Date());

  useEffect(() => {
    initializeCall();
    
    // Update call duration every second
    const durationInterval = setInterval(() => {
      const now = new Date();
      const duration = Math.floor((now.getTime() - callStartTime.current.getTime()) / 1000);
      setCallDuration(duration);
    }, 1000);

    return () => {
      clearInterval(durationInterval);
      // Clean up call resources
      endCall();
    };
  }, []);

  const initializeCall = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to join the call');
        router.back();
        return;
      }

      setCurrentUser(user);
      
      // Add current user as first participant (host)
      const hostParticipant: CallParticipant = {
        id: user.id,
        name: user.name,
        profilePicture: user.profilePicture,
        isAudioMuted: false,
        isVideoEnabled: callType === 'video',
        isHost: true,
        joinedAt: new Date().toISOString(),
      };
      
      setParticipants([hostParticipant]);

      // Set up Socket.IO listeners for call events
      // In a real implementation, you'd set up WebRTC connections here
      console.log(`🎥 ${callType} call initialized for group:`, groupId);
      
    } catch (error) {
      console.error('Error initializing call:', error);
      Alert.alert('Error', 'Failed to initialize call');
      router.back();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = () => {
    setIsAudioMuted(!isAudioMuted);
    // In real implementation, this would control the microphone
    console.log(`🎤 Audio ${isAudioMuted ? 'unmuted' : 'muted'}`);
  };

  const toggleVideo = () => {
    if (callType === 'video') {
      setIsVideoEnabled(!isVideoEnabled);
      // In real implementation, this would control the camera
      console.log(`📹 Video ${isVideoEnabled ? 'disabled' : 'enabled'}`);
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    
    // Notify other participants via Socket.IO
    if (socketService.isConnected()) {
      // Send call end notification
      console.log('📞 Call ended by user');
    }
    
    router.back();
  };

  const inviteMoreParticipants = () => {
    Alert.alert(
      'Invite Participants',
      'All group members have been invited to join this call.',
      [{ text: 'OK' }]
    );
  };

  const renderParticipant = ({ item }: { item: CallParticipant }) => {
    const isCurrentUser = item.id === currentUser?.id;
    
    return (
      <View style={styles.participantContainer}>
        <View style={styles.participantVideo}>
          {item.isVideoEnabled && callType === 'video' ? (
            // In real implementation, this would show video stream
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>📹 Video Stream</Text>
            </View>
          ) : (
            <View style={styles.audioOnlyContainer}>
              {item.profilePicture ? (
                <Image 
                  source={{ uri: item.profilePicture }} 
                  style={styles.participantAvatar}
                />
              ) : (
                <View style={styles.participantAvatarPlaceholder}>
                  <Text style={styles.participantInitial}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Participant controls overlay */}
          <View style={styles.participantOverlay}>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName} numberOfLines={1}>
                {isCurrentUser ? 'You' : item.name}
                {item.isHost && ' (Host)'}
              </Text>
              
              <View style={styles.participantStatus}>
                {item.isAudioMuted && (
                  <Ionicons name="mic-off" size={12} color="#EF4444" />
                )}
                {!item.isVideoEnabled && callType === 'video' && (
                  <Ionicons name="videocam-off" size={12} color="#EF4444" />
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (!isCallActive) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.callInfo}>
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.callDuration}>
            {callType === 'video' ? '📹' : '📞'} {formatDuration(callDuration)}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowParticipants(true)}
        >
          <Ionicons name="people" size={20} color="#FFFFFF" />
          <Text style={styles.participantCount}>{participants.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Participants Grid */}
      <View style={styles.participantsContainer}>
        {participants.length === 1 ? (
          // Single participant (full screen)
          <View style={styles.singleParticipantContainer}>
            {renderParticipant({ item: participants[0] })}
          </View>
        ) : (
          // Multiple participants (grid)
          <FlatList
            data={participants}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.participantsGrid}
          />
        )}
      </View>

      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controls}>
          {/* Audio toggle */}
          <TouchableOpacity 
            style={[styles.controlButton, isAudioMuted && styles.controlButtonMuted]}
            onPress={toggleAudio}
          >
            <Ionicons 
              name={isAudioMuted ? "mic-off" : "mic"} 
              size={24} 
              color={isAudioMuted ? "#EF4444" : "#FFFFFF"} 
            />
          </TouchableOpacity>

          {/* Video toggle (only for video calls) */}
          {callType === 'video' && (
            <TouchableOpacity 
              style={[styles.controlButton, !isVideoEnabled && styles.controlButtonMuted]}
              onPress={toggleVideo}
            >
              <Ionicons 
                name={isVideoEnabled ? "videocam" : "videocam-off"} 
                size={24} 
                color={!isVideoEnabled ? "#EF4444" : "#FFFFFF"} 
              />
            </TouchableOpacity>
          )}

          {/* Invite button */}
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={inviteMoreParticipants}
          >
            <Ionicons name="person-add" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* End call */}
          <TouchableOpacity 
            style={[styles.controlButton, styles.endCallButton]}
            onPress={endCall}
          >
            <Ionicons name="call" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Participants Modal */}
      <Modal
        visible={showParticipants}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.participantsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Participants ({participants.length})
              </Text>
              <TouchableOpacity onPress={() => setShowParticipants(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.participantsList}>
              {participants.map((participant) => (
                <View key={participant.id} style={styles.participantListItem}>
                  <View style={styles.participantListAvatar}>
                    {participant.profilePicture ? (
                      <Image 
                        source={{ uri: participant.profilePicture }} 
                        style={styles.participantListAvatarImage}
                      />
                    ) : (
                      <View style={styles.participantListAvatarPlaceholder}>
                        <Text style={styles.participantListInitial}>
                          {participant.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.participantListInfo}>
                    <Text style={styles.participantListName}>
                      {participant.id === currentUser?.id ? 'You' : participant.name}
                      {participant.isHost && ' (Host)'}
                    </Text>
                    <View style={styles.participantListStatus}>
                      {participant.isAudioMuted && (
                        <View style={styles.statusBadge}>
                          <Ionicons name="mic-off" size={12} color="#EF4444" />
                          <Text style={styles.statusText}>Muted</Text>
                        </View>
                      )}
                      {!participant.isVideoEnabled && callType === 'video' && (
                        <View style={styles.statusBadge}>
                          <Ionicons name="videocam-off" size={12} color="#EF4444" />
                          <Text style={styles.statusText}>Video Off</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#374151',
  },
  callInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  callDuration: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B5563',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  participantCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  participantsContainer: {
    flex: 1,
    padding: 16,
  },
  singleParticipantContainer: {
    flex: 1,
  },
  participantsGrid: {
    flexGrow: 1,
  },
  participantContainer: {
    flex: 1,
    margin: 8,
    aspectRatio: 1,
    minHeight: 150,
  },
  participantVideo: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#374151',
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  videoPlaceholderText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  audioOnlyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  participantAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInitial: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  participantOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  participantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#374151',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonMuted: {
    backgroundColor: '#EF4444',
  },
  endCallButton: {
    backgroundColor: '#EF4444',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  participantsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  participantsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  participantListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  participantListAvatar: {
    marginRight: 12,
  },
  participantListAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  participantListAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantListInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  participantListInfo: {
    flex: 1,
  },
  participantListName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  participantListStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
});