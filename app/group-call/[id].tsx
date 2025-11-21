
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Alert, Dimensions, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '@/lib/useUser';
import { socketService } from '@/lib/socket';
import api from '@/lib/api';
import { mediaDevices, RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStream, MediaStreamTrack } from 'react-native-webrtc';

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const SIGNALING_EVENTS = {
    OFFER: 'webrtc-offer',
    ANSWER: 'webrtc-answer',
    ICE: 'webrtc-ice',
    JOIN: 'webrtc-join',
    LEAVE: 'webrtc-leave',
  };

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  };

  export default function GroupCallScreen() {
    const { id: groupId, type: callType, groupName } = useLocalSearchParams();
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<{ [userId: string]: MediaStream }>({});
    const [peerConnections, setPeerConnections] = useState<{ [userId: string]: RTCPeerConnection }>({});
    const [participants, setParticipants] = useState<Array<{ id: string; name: string; profilePicture?: string; isAudioMuted: boolean; isVideoEnabled: boolean; isHost: boolean; joinedAt: string }>>([]);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    // Only audio for now
    const [isVideoEnabled] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isCallActive, setIsCallActive] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string; profilePicture?: string } | null>(null);
    const [showParticipants, setShowParticipants] = useState(false);
    const callStartTime = useRef(new Date());

    // Helper: Add/Remove participant
    const addParticipant = (user: { id: string; name: string; profilePicture?: string; isAudioMuted: boolean; isVideoEnabled: boolean; isHost: boolean; joinedAt: string }) => {
      setParticipants((prev) => {
        if (prev.find((p) => p.id === user.id)) return prev;
        return [...prev, user];
      });
    };
    const removeParticipant = (userId: string) => {
      setParticipants((prev) => prev.filter((p) => p.id !== userId));
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      setPeerConnections((prev) => {
        const copy = { ...prev };
        if (copy[userId]) copy[userId].close();
        delete copy[userId];
        return copy;
      });
    };

    // 1. Get local media
    useEffect(() => {
      (async () => {
        const user = await getCurrentUser();
        if (!user) {
          Alert.alert('Error', 'Please log in to join the call');
          router.back();
          return;
        }
        setCurrentUser(user);
        // Get local media
        let stream = null;
        try {
          stream = await mediaDevices.getUserMedia({
            audio: true,
            video: false, // Only audio
          });
          setLocalStream(stream);
        } catch (err) {
          Alert.alert('Error', 'Could not access microphone');
          router.back();
          return;
        }
        // Join signaling room
        socketService.emitSignal(SIGNALING_EVENTS.JOIN, { groupId, userId: user.id, name: user.name });
        addParticipant({ id: user.id, name: user.name, profilePicture: user.profilePicture, isAudioMuted: false, isVideoEnabled: false, isHost: true, joinedAt: new Date().toISOString() });
      })();
      return () => {
        // Leave signaling room
        if (currentUser) socketService.emitSignal(SIGNALING_EVENTS.LEAVE, { groupId, userId: currentUser.id });
        // Close all peer connections
        Object.values(peerConnections).forEach((pc) => pc.close());
        setPeerConnections({});
        setRemoteStreams({});
        setParticipants([]);
        if (localStream) localStream.release?.();
      };
      // eslint-disable-next-line
    }, []);

    // 2. Handle signaling events
    useEffect(() => {
      // When a new user joins, create a peer connection and send offer
      const onUserJoin = async ({ userId, name, profilePicture }: { userId: string, name: string, profilePicture?: string }) => {
        if (!currentUser || userId === currentUser.id) return;
        addParticipant({ id: userId, name, profilePicture, isAudioMuted: false, isVideoEnabled: false, isHost: false, joinedAt: new Date().toISOString() });
        // Create peer connection
        const pc = createPeerConnection(userId);
        peerConnections[userId] = pc;
        setPeerConnections({ ...peerConnections });
        // Add local tracks
        if (localStream) {
          localStream.getAudioTracks().forEach((track: MediaStreamTrack) => pc.addTrack(track, localStream));
        }
        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.emitSignal(SIGNALING_EVENTS.OFFER, { groupId, to: userId, from: currentUser.id, offer });
      };
      // When receiving an offer
      const onOffer = async ({ from, offer }: { from: string, offer: any }) => {
        if (!currentUser || from === currentUser.id) return;
        // Create peer connection
        const pc = createPeerConnection(from);
        peerConnections[from] = pc;
        setPeerConnections({ ...peerConnections });
        // Add local tracks
        if (localStream) {
          localStream.getAudioTracks().forEach((track: MediaStreamTrack) => pc.addTrack(track, localStream));
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketService.emitSignal(SIGNALING_EVENTS.ANSWER, { groupId, to: from, from: currentUser.id, answer });
      };
      // When receiving an answer
      const onAnswer = async ({ from, answer }: { from: string, answer: any }) => {
        if (!currentUser || from === currentUser.id) return;
        const pc = peerConnections[from];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      };
      // When receiving ICE candidate
      const onIce = async ({ from, candidate }: { from: string, candidate: any }) => {
        if (!currentUser || from === currentUser.id) return;
        const pc = peerConnections[from];
        if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      };
      // When a user leaves
      const onLeave = ({ userId }: { userId: string }) => {
        removeParticipant(userId);
      };
      socketService.onSignal(SIGNALING_EVENTS.JOIN, onUserJoin);
      socketService.onSignal(SIGNALING_EVENTS.OFFER, onOffer);
      socketService.onSignal(SIGNALING_EVENTS.ANSWER, onAnswer);
      socketService.onSignal(SIGNALING_EVENTS.ICE, onIce);
      socketService.onSignal(SIGNALING_EVENTS.LEAVE, onLeave);
      return () => {
        socketService.offSignal(SIGNALING_EVENTS.JOIN, onUserJoin);
        socketService.offSignal(SIGNALING_EVENTS.OFFER, onOffer);
        socketService.offSignal(SIGNALING_EVENTS.ANSWER, onAnswer);
        socketService.offSignal(SIGNALING_EVENTS.ICE, onIce);
        socketService.offSignal(SIGNALING_EVENTS.LEAVE, onLeave);
      };
      // eslint-disable-next-line
    }, [localStream, peerConnections, currentUser]);

    // 3. Peer connection factory
    function createPeerConnection(userId: string) {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      // @ts-ignore: React Native WebRTC supports these event handlers
      (pc as any).onicecandidate = (event: any) => {
        if (event.candidate && currentUser) {
          socketService.emitSignal(SIGNALING_EVENTS.ICE, { groupId, to: userId, from: currentUser!.id, candidate: event.candidate });
        }
      };
      // @ts-ignore: React Native WebRTC supports these event handlers
      (pc as any).ontrack = (event: any) => {
        setRemoteStreams((prev) => ({ ...prev, [userId]: event.streams[0] }));
      };
      // @ts-ignore: React Native WebRTC supports these event handlers
      (pc as any).onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          removeParticipant(userId);
        }
      };
      return pc;
    }

    // 4. Call duration timer
    useEffect(() => {
      const durationInterval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTime.current.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
      return () => clearInterval(durationInterval);
    }, []);

    // 5. Mute/unmute local audio
    const toggleAudio = () => {
      if (localStream) {
        localStream.getAudioTracks().forEach((track: MediaStreamTrack) => (track.enabled = !isAudioMuted));
      }
      setIsAudioMuted((prev) => !prev);
    };
    // 6. Enable/disable local video
    // Video toggle is disabled for audio-only
    const toggleVideo = () => {};
    // 7. End call
    const endCall = () => {
      setIsCallActive(false);
      if (currentUser) socketService.emitSignal(SIGNALING_EVENTS.LEAVE, { groupId, userId: currentUser.id });
      Object.values(peerConnections).forEach((pc) => pc.close());
      setPeerConnections({});
      setRemoteStreams({});
      setParticipants([]);
      if (localStream) localStream.release?.();
      router.back();
    };
    // 8. Invite (dummy)
    const inviteMoreParticipants = () => {
      Alert.alert('Invite Participants', 'All group members have been invited to join this call.', [{ text: 'OK' }]);
    };
    // 9. Render participant (local/remote)
    const renderParticipant = ({ item }: { item: { id: string; name: string; profilePicture?: string; isAudioMuted: boolean; isVideoEnabled: boolean; isHost: boolean; joinedAt: string } }) => {
      const isCurrentUser = item.id === currentUser?.id;
      const stream = isCurrentUser ? localStream : remoteStreams[item.id];
      return (
        <View style={styles.participantContainer}>
          <View style={styles.participantVideo}>
            <View style={styles.audioOnlyContainer}>
              {item.profilePicture ? (
                <Image source={{ uri: item.profilePicture }} style={styles.participantAvatar} />
              ) : (
                <View style={styles.participantAvatarPlaceholder}>
                  <Text style={styles.participantInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View style={styles.participantOverlay}>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName} numberOfLines={1}>{isCurrentUser ? 'You' : item.name}{item.isHost && ' (Host)'}</Text>
                <View style={styles.participantStatus}>
                  {item.isAudioMuted && (<Ionicons name="mic-off" size={12} color="#EF4444" />)}
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    };
    if (!isCallActive) return null;
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.callInfo}>
            <Text style={styles.groupName}>{groupName}</Text>
            <Text style={styles.callDuration}>{callType === 'video' ? '📹' : '📞'} {`${Math.floor(callDuration/60).toString().padStart(2,'0')}:${(callDuration%60).toString().padStart(2,'0')}`}</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowParticipants(true)}>
            <Ionicons name="people" size={20} color="#FFFFFF" />
            <Text style={styles.participantCount}>{participants.length}</Text>
          </TouchableOpacity>
        </View>
        {/* Participants Grid */}
        <View style={styles.participantsContainer}>
          {participants.length === 1 ? (
            <View style={styles.singleParticipantContainer}>{renderParticipant({ item: participants[0] })}</View>
          ) : (
            <FlatList data={participants} renderItem={renderParticipant} keyExtractor={(item) => item.id} numColumns={2} contentContainerStyle={styles.participantsGrid} />
          )}
        </View>
        {/* Call Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.controls}>
            <TouchableOpacity style={[styles.controlButton, isAudioMuted && styles.controlButtonMuted]} onPress={toggleAudio}>
              <Ionicons name={isAudioMuted ? "mic-off" : "mic"} size={24} color={isAudioMuted ? "#EF4444" : "#FFFFFF"} />
            </TouchableOpacity>
            {/* Video toggle removed for audio-only */}
            <TouchableOpacity style={styles.controlButton} onPress={inviteMoreParticipants}>
              <Ionicons name="person-add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={endCall}>
              <Ionicons name="call" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Participants Modal */}
        <Modal visible={showParticipants} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.participantsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Participants ({participants.length})</Text>
                <TouchableOpacity onPress={() => setShowParticipants(false)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.participantsList}>
                {participants.map((participant) => (
                  <View key={participant.id} style={styles.participantListItem}>
                    <View style={styles.participantListAvatar}>
                      {participant.profilePicture ? (
                        <Image source={{ uri: participant.profilePicture }} style={styles.participantListAvatarImage} />
                      ) : (
                        <View style={styles.participantListAvatarPlaceholder}>
                          <Text style={styles.participantListInitial}>{participant.name.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.participantListInfo}>
                      <Text style={styles.participantListName}>{participant.id === currentUser?.id ? 'You' : participant.name}{participant.isHost && ' (Host)'}</Text>
                      <View style={styles.participantListStatus}>
                        {participant.isAudioMuted && (<View style={styles.statusBadge}><Ionicons name="mic-off" size={12} color="#EF4444" /><Text style={styles.statusText}>Muted</Text></View>)}
                        {!participant.isVideoEnabled && callType === 'video' && (<View style={styles.statusBadge}><Ionicons name="videocam-off" size={12} color="#EF4444" /><Text style={styles.statusText}>Video Off</Text></View>)}
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