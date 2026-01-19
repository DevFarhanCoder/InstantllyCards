import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Linking,
  Modal
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCurrentUserId, getCurrentUserPhone, getCurrentUserName } from '../../../lib/useUser';
import { formatIndianNumber } from '../../../utils/formatNumber';

const { width } = Dimensions.get("window");
const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE}${process.env.EXPO_PUBLIC_API_PREFIX}`;

interface Ad {
  id: string;
  title: string;
  phoneNumber: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  hasBottomImage: boolean;
  hasFullscreenImage: boolean;
}

export default function AdsWithoutChannel() {
  const [activeTab, setActiveTab] = useState<"create" | "status">("create");
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Create Ad State
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bottomImage, setBottomImage] = useState<any>(null);
  const [fullscreenImage, setFullscreenImage] = useState<any>(null);
  const [bottomVideo, setBottomVideo] = useState<any>(null);
  const [fullscreenVideo, setFullscreenVideo] = useState<any>(null);
  const [adType, setAdType] = useState<'image' | 'video'>('image');
  const [needsVideoResize, setNeedsVideoResize] = useState<'bottom' | 'fullscreen' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(true);
  
  // Status State
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userCredits, setUserCredits] = useState(0);

  // Date Picker State
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDateObj, setStartDateObj] = useState<Date>(new Date());
  const [endDateObj, setEndDateObj] = useState<Date>(new Date());

  useEffect(() => {
    loadUserData();
    if (activeTab === 'status') {
      loadMyAds();
    }
  }, [activeTab]);

  const loadUserData = async () => {
    setCreditsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Load user credits
        const response = await fetch(`${API_BASE_URL}/credits/balance`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setUserCredits(data.credits || 0);
          console.log('✅ Credits loaded:', data.credits);
        }
      } else {
        console.log('⚠️ No auth token found');
        setUserCredits(0);
      }
    } catch (error) {
      console.error('❌ Load user data error:', error);
      setUserCredits(0);
    } finally {
      setCreditsLoading(false);
    }
  };

  const changeTab = (tab: "create" | "status") => {
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({ x: tab === "create" ? 0 : width, animated: true });
  };

  // Date picker handlers
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      setStartDateObj(selectedDate);
      setStartDate(formatDate(selectedDate));
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      setEndDateObj(selectedDate);
      setEndDate(formatDate(selectedDate));
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (offsetX >= width / 2) {
      setActiveTab("status");
    } else {
      setActiveTab("create");
    }
  };

  const pickImage = async (type: 'bottom' | 'fullscreen') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permission is required to select images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'bottom' ? [624, 174] : [624, 1000],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'bottom') {
        setBottomImage(result.assets[0]);
      } else {
        setFullscreenImage(result.assets[0]);
      }
    }
  };

  const pickVideo = async (type: 'bottom' | 'fullscreen') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permission is required to select videos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const video = result.assets[0];
      const videoWidth = video.width || 0;
      const videoHeight = video.height || 0;
      
      // Required dimensions
      const requiredWidth = 624;
      const requiredHeight = type === 'bottom' ? 174 : 1000;
      const requiredSize = type === 'bottom' ? '624×174' : '624×1000';
      
      // Check if video matches required size (with small tolerance)
      const widthMatch = Math.abs(videoWidth - requiredWidth) <= 10;
      const heightMatch = Math.abs(videoHeight - requiredHeight) <= 10;
      
      if (widthMatch && heightMatch) {
        // Correct size - accept the video
        if (type === 'bottom') {
          setBottomVideo(video);
        } else {
          setFullscreenVideo(video);
        }
        Alert.alert('✅ Video Accepted!', `Your video is the correct size (${requiredSize} pixels).`);
      } else {
        // Wrong size - show alert with WhatsApp option
        Alert.alert(
          '⚠️ Incorrect Video Size',
          `Your video size: ${videoWidth}×${videoHeight} pixels\n\nRequired size: ${requiredSize} pixels\n\nPlease upload a video with the correct dimensions, or contact us for FREE resizing help!`,
          [
            {
              text: 'Try Again',
              style: 'cancel'
            },
            {
              text: '📱 WhatsApp Help',
              onPress: () => {
                const msg = `Hi! I need help resizing my ${type === 'bottom' ? 'Bottom Banner' : 'Fullscreen'} video for ads.%0A%0AMy video size: ${videoWidth}×${videoHeight}%0ARequired size: ${requiredSize} pixels%0A%0APlease help me resize it!`;
                Linking.openURL(`https://wa.me/919820329571?text=${msg}`);
              }
            }
          ]
        );
      }
    }
  };

  const submitAd = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter ad title');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please enter start and end dates');
      return;
    }
    
    // Check for image or video based on adType
    if (adType === 'image') {
      if (!bottomImage) {
        Alert.alert('Error', 'Bottom banner image is required');
        return;
      }
    } else {
      if (!bottomVideo) {
        Alert.alert('Error', 'Bottom banner video is required');
        return;
      }
    }

    // Check credits
    if (userCredits < 1200) {
      Alert.alert('Insufficient Credits', `You need 1200 credits to create an ad. Current balance: ${userCredits}`);
      return;
    }

    // Confirm ad submission with cost breakdown
    Alert.alert(
      '📢 Ad Submission Cost',
      `💳 Credits: 1200 (will be deducted now)\n💵 Cash Payment: ₹180 (after admin approval)\n📊 Total Cost: 1200 credits + ₹180\n\n⚠️ Admin will review your ad. After approval, you will be contacted to pay ₹180.\n\nDo you want to proceed?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Submit Ad',
          onPress: () => submitAdConfirmed()
        }
      ]
    );
  };

  const submitAdConfirmed = async () => {
    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      
      // Get userId and phone using proper methods from useUser
      const userId = await getCurrentUserId();
      const userPhone = await getCurrentUserPhone();
      const userName = await getCurrentUserName();
      
      console.log('📤 Ad upload - userPhone:', userPhone, 'userId:', userId, 'userName:', userName);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('phoneNumber', phoneNumber);
      formData.append('uploaderPhone', userPhone || phoneNumber);
      formData.append('uploaderName', userName || 'Mobile User'); // Send uploader name
      formData.append('userId', userId || '');
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);

      let endpoint = `${API_BASE_URL}/channel-partner/ads`;
      
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      if (adType === 'image') {
        // Add bottom image
        formData.append('images', {
          uri: bottomImage.uri,
          type: 'image/jpeg',
          name: 'bottom.jpg'
        } as any);

        // Add fullscreen image if selected
        if (fullscreenImage) {
          formData.append('images', {
            uri: fullscreenImage.uri,
            type: 'image/jpeg',
            name: 'fullscreen.jpg'
          } as any);
        }
      } else {
        // Video ad
        endpoint = `${API_BASE_URL}/channel-partner/ads/video`;
        
        // Add bottom video
        formData.append('videos', {
          uri: bottomVideo.uri,
          type: 'video/mp4',
          name: 'bottom.mp4'
        } as any);

        // Add fullscreen video if selected
        if (fullscreenVideo) {
          formData.append('videos', {
            uri: fullscreenVideo.uri,
            type: 'video/mp4',
            name: 'fullscreen.mp4'
          } as any);
        }
      }

      console.log('🚀 Sending request to:', endpoint);
      console.log('📦 FormData fields: title, phoneNumber, uploaderPhone, userId, startDate, endDate');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', JSON.stringify(data));

      if (response.ok) {
        Alert.alert(
          '✅ Ad Submitted Successfully!',
          `💳 1200 credits deducted\n📊 Remaining credits: ${data.remainingCredits ? formatIndianNumber(data.remainingCredits) : 'N/A'}\n\n⏳ Your ${adType} ad is now pending admin approval.\n💵 After approval, admin will contact you for ₹180 payment.`,
          [{ text: 'OK', onPress: () => {
            // Reset form
            setTitle('');
            setPhoneNumber('');
            setStartDate('');
            setEndDate('');
            setBottomImage(null);
            setFullscreenImage(null);
            setBottomVideo(null);
            setFullscreenVideo(null);
            // Switch to status tab to see the submitted ad
            setActiveTab('status');
            // Reload ads
            loadMyAds();
          }}]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to submit ad');
      }
    } catch (error) {
      console.error('Submit ad error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadMyAds = async () => {
    setIsLoadingAds(true);
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      if (!userPhone) return;

      const response = await fetch(`${API_BASE_URL}/channel-partner/ads?phone=${userPhone}`);
      const data = await response.json();
      
      if (data.ads) {
        setMyAds(data.ads);
      }
    } catch (error) {
      console.error('Load ads error:', error);
    } finally {
      setIsLoadingAds(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMyAds();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
     

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "create" && styles.activeTab]}
          onPress={() => changeTab("create")}
        >
          <Text style={[styles.tabText, activeTab === "create" && styles.activeTabText]}>
            Create Ads
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "status" && styles.activeTab]}
          onPress={() => changeTab("status")}
        >
          <Text style={[styles.tabText, activeTab === "status" && styles.activeTabText]}>
            Status
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Pages */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {/* Create Ads Page */}
        <ScrollView style={[styles.page, { width }]} contentContainerStyle={styles.pageContent}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#4F6AF3" />
            <Text style={styles.infoText}>
              Create an ad for 1200 credits. Your ad will be reviewed by admin before appearing in the app.
            </Text>
          </View>

          <View style={styles.creditsCard}>
            <Text style={styles.creditsLabel}>Available Credits</Text>
            {creditsLoading ? (
              <ActivityIndicator size="small" color="#15803d" />
            ) : (
              <Text style={styles.creditsValue}>{formatIndianNumber(userCredits)}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ad Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Summer Sale 2024"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+919876543210"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <Text style={styles.hint}>For Call/Message buttons in app</Text>
          </View>

          {/* Media Type Selection Toggle */}
          <View style={styles.formGroup}>
            <View style={styles.mediaTypeLabelRow}>
              <Ionicons name="images-outline" size={18} color="#4F6AF3" />
              <Text style={styles.label}> Media Type *</Text>
            </View>
            <View style={styles.mediaTypeToggle}>
              <TouchableOpacity
                style={[
                  styles.mediaTypeBtn,
                  adType === 'image' && styles.mediaTypeBtnActive
                ]}
                onPress={() => setAdType('image')}
              >
                <Ionicons 
                  name="image-outline" 
                  size={20} 
                  color={adType === 'image' ? '#fff' : '#4F6AF3'} 
                />
                <Text style={[
                  styles.mediaTypeBtnText,
                  adType === 'image' && styles.mediaTypeBtnTextActive
                ]}>Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mediaTypeBtn,
                  adType === 'video' && styles.mediaTypeBtnActive
                ]}
                onPress={() => setAdType('video')}
              >
                <Ionicons 
                  name="videocam-outline" 
                  size={20} 
                  color={adType === 'video' ? '#fff' : '#4F6AF3'} 
                />
                <Text style={[
                  styles.mediaTypeBtnText,
                  adType === 'video' && styles.mediaTypeBtnTextActive
                ]}>Video</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Select whether your advertisement is an image or video</Text>
          </View>

          {/* Image Section - Show only when adType is 'image' */}
          {adType === 'image' && (
            <>
              <View style={styles.formGroup}>
                <View style={styles.mediaTypeLabelRow}>
                  <Ionicons name="phone-portrait-outline" size={16} color="#666" />
                  <Text style={styles.label}> Bottom Banner Image * (624×174px)</Text>
                </View>
                <Text style={styles.hint}>This image appears in the bottom carousel. Recommended size: 624 × 174 pixels</Text>
            <TouchableOpacity 
              style={styles.imagePickerBtn} 
              onPress={() => pickImage('bottom')}
            >
              {bottomImage ? (
                <Image source={{ uri: bottomImage.uri }} style={styles.imagePreview} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={40} color="#4F6AF3" />
                  <Text style={styles.imagePickerText}>Tap to Select Bottom Banner</Text>
                  <Text style={styles.imagePickerHint}>or click to browse</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.mediaTypeLabelRow}>
              <Ionicons name="expand-outline" size={16} color="#666" />
              <Text style={styles.label}> Fullscreen Image (Optional 624×1000px)</Text>
            </View>
            <Text style={styles.hint}>This image appears when user taps the bottom banner. Recommended size: 624 × 1000 pixels</Text>
            <TouchableOpacity 
              style={styles.imagePickerBtn} 
              onPress={() => pickImage('fullscreen')}
            >
              {fullscreenImage ? (
                <Image source={{ uri: fullscreenImage.uri }} style={styles.imagePreview} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={40} color="#999" />
                  <Text style={styles.imagePickerText}>Tap to Select Fullscreen Image</Text>
                  <Text style={styles.imagePickerHint}>or click to browse</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.hint}>This image appears when user taps the bottom banner</Text>
          </View>
            </>
          )}

          {/* Video Section - Show only when adType is 'video' */}
          {adType === 'video' && (
            <>
              <View style={styles.formGroup}>
                <View style={styles.mediaTypeLabelRow}>
                  <Ionicons name="phone-portrait-outline" size={16} color="#666" />
                  <Text style={styles.label}> Bottom Banner Video * (624×174px)</Text>
                </View>
                <Text style={styles.hint}>This video appears in the bottom carousel. Recommended: MP4 format, max 50MB</Text>
            <TouchableOpacity 
              style={[styles.videoUploadCard, bottomVideo && styles.videoUploadCardSelected]} 
              onPress={() => pickVideo('bottom')}
            >
              {bottomVideo ? (
                <View style={styles.videoSelectedCard}>
                  <View style={styles.videoSelectedIconArea}>
                    <View style={styles.videoSelectedIconCircle}>
                      <Ionicons name="videocam" size={32} color="#fff" />
                    </View>
                    <View style={styles.videoCheckBadge}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.videoSelectedDetails}>
                    <Text style={styles.videoCardTitle}>✓ Video Selected</Text>
                    <Text style={styles.videoSelectedSize}>{bottomVideo.width}×{bottomVideo.height} pixels</Text>
                    <Text style={styles.videoCardFileName} numberOfLines={1}>
                      {bottomVideo.fileName || 'bottom_video.mp4'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.videoRemoveCornerBtn}
                    onPress={() => setBottomVideo(null)}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.videoUploadContent}>
                  <View style={styles.videoUploadIconCircle}>
                    <Ionicons name="cloud-upload-outline" size={28} color="#0891b2" />
                  </View>
                  <Text style={styles.videoUploadTitle}>Upload Bottom Video</Text>
                  <Text style={styles.videoUploadHint}>Must be exactly 624×174 pixels</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Fullscreen Video Upload */}
          <View style={styles.formGroup}>
            <View style={styles.mediaTypeLabelRow}>
              <Ionicons name="expand-outline" size={16} color="#666" />
              <Text style={styles.label}> Fullscreen Video (Optional 624×1000px)</Text>
            </View>
            <TouchableOpacity 
              style={[styles.videoUploadCard, styles.videoUploadCardTall, fullscreenVideo && styles.videoUploadCardSelected]} 
              onPress={() => pickVideo('fullscreen')}
            >
              {fullscreenVideo ? (
                <View style={styles.videoSelectedCard}>
                  <View style={styles.videoSelectedIconArea}>
                    <View style={styles.videoSelectedIconCircle}>
                      <Ionicons name="videocam" size={32} color="#fff" />
                    </View>
                    <View style={styles.videoCheckBadge}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.videoSelectedDetails}>
                    <Text style={styles.videoCardTitle}>✓ Video Selected</Text>
                    <Text style={styles.videoSelectedSize}>{fullscreenVideo.width}×{fullscreenVideo.height} pixels</Text>
                    <Text style={styles.videoCardFileName} numberOfLines={1}>
                      {fullscreenVideo.fileName || 'fullscreen_video.mp4'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.videoRemoveCornerBtn}
                    onPress={() => setFullscreenVideo(null)}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.videoUploadContent}>
                  <View style={[styles.videoUploadIconCircle, { backgroundColor: '#f3f4f6' }]}>
                    <Ionicons name="cloud-upload-outline" size={28} color="#9ca3af" />
                  </View>
                  <Text style={[styles.videoUploadTitle, { color: '#6b7280' }]}>Upload Fullscreen Video</Text>
                  <Text style={styles.videoUploadHint}>Must be exactly 624×1000 pixels</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.hint}>This video appears when user taps the bottom banner. Recommended: MP4 format, max 50MB</Text>
          </View>
            </>
          )}

          {/* Help Section - Show only for video */}
          {adType === 'video' && (
          <View style={styles.videoHelpCard}>
            <View style={styles.videoHelpHeader}>
              <Ionicons name="videocam" size={24} color="#0891b2" />
              <Text style={styles.videoHelpTitle}>Wrong Video Size?</Text>
            </View>
            <Text style={styles.videoHelpDesc}>
              Don't worry! Send us your video and we'll resize it to exact dimensions.
            </Text>
            <View style={styles.videoHelpActions}>
              <TouchableOpacity 
                style={styles.videoHelpWhatsApp}
                onPress={() => Linking.openURL('https://wa.me/919820329571?text=Hi%21%20I%20need%20help%20resizing%20my%20video%20for%20ads.%20Please%20assist%20me.')}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.videoHelpBtnText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.videoHelpCall}
                onPress={() => Linking.openURL('tel:+919820329571')}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.videoHelpBtnText}>Call Now</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.videoHelpPhoneRow}
              onPress={() => Linking.openURL('tel:+919820329571')}
            >
            </TouchableOpacity>
          </View>
          )}

          <View style={styles.dateRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Start Date *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#7c3aed" />
                <Text style={[styles.datePickerText, !startDate && styles.datePickerPlaceholder]}>
                  {startDate ? formatDisplayDate(startDateObj) : 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>End Date *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#7c3aed" />
                <Text style={[styles.datePickerText, !endDate && styles.datePickerPlaceholder]}>
                  {endDate ? formatDisplayDate(endDateObj) : 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Start Date Picker */}
          {showStartDatePicker && (
            Platform.OS === 'ios' ? (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showStartDatePicker}
                onRequestClose={() => setShowStartDatePicker(false)}
              >
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <Text style={styles.datePickerTitle}>Select Start Date</Text>
                      <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                        <Text style={styles.datePickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={startDateObj}
                      mode="date"
                      display="spinner"
                      onChange={onStartDateChange}
                      minimumDate={new Date()}
                      style={styles.datePicker}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={startDateObj}
                mode="date"
                display="default"
                onChange={onStartDateChange}
                minimumDate={new Date()}
              />
            )
          )}

          {/* End Date Picker */}
          {showEndDatePicker && (
            Platform.OS === 'ios' ? (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showEndDatePicker}
                onRequestClose={() => setShowEndDatePicker(false)}
              >
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <Text style={styles.datePickerTitle}>Select End Date</Text>
                      <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                        <Text style={styles.datePickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={endDateObj}
                      mode="date"
                      display="spinner"
                      onChange={onEndDateChange}
                      minimumDate={startDateObj || new Date()}
                      style={styles.datePicker}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={endDateObj}
                mode="date"
                display="default"
                onChange={onEndDateChange}
                minimumDate={startDateObj || new Date()}
              />
            )
          )}

          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.warningText}>
              1200 credits will be deducted upon submission
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
            onPress={submitAd}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Ad (1200 Credits)</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Status Page */}
        <ScrollView 
          style={[styles.page, { width }]} 
          contentContainerStyle={styles.pageContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {isLoadingAds ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F6AF3" />
              <Text style={styles.loadingText}>Loading your ads...</Text>
            </View>
          ) : myAds.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No ads yet</Text>
              <Text style={styles.emptySubtext}>Create your first ad in the Create tab</Text>
            </View>
          ) : (
            myAds.map((ad, index) => (
              <View key={ad.id} style={styles.adCard}>
                <View style={styles.adHeader}>
                  <Text style={styles.adTitle}>{ad.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ad.status) }]}>
                    <Ionicons name={getStatusIcon(ad.status) as any} size={14} color="#fff" />
                    <Text style={styles.statusText}>
                      {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.adDetails}>
                  <View style={styles.adDetailRow}>
                    <Ionicons name="call" size={16} color="#666" />
                    <Text style={styles.adDetailText}>{ad.phoneNumber}</Text>
                  </View>
                  <View style={styles.adDetailRow}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.adDetailText}>
                      {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.adDetailRow}>
                    <Ionicons name="images" size={16} color="#666" />
                    <Text style={styles.adDetailText}>
                      {ad.hasFullscreenImage ? 'Bottom + Fullscreen' : 'Bottom only'}
                    </Text>
                  </View>
                </View>

                {ad.status === 'pending' && (
                  <View style={styles.pendingNotice}>
                    <Ionicons name="time" size={16} color="#f59e0b" />
                    <Text style={styles.pendingNoticeText}>Awaiting admin approval</Text>
                  </View>
                )}

                {ad.status === 'approved' && (
                  <View style={[styles.pendingNotice, { backgroundColor: '#d1fae5' }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={[styles.pendingNoticeText, { color: '#065f46' }]}>Live in app</Text>
                  </View>
                )}

                {ad.status === 'rejected' && (
                  <View style={[styles.pendingNotice, { backgroundColor: '#fee2e2' }]}>
                    <Ionicons name="close-circle" size={16} color="#ef4444" />
                    <Text style={[styles.pendingNoticeText, { color: '#991b1b' }]}>Rejected - Contact admin</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 16, color: "#777", fontWeight: "500" },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#4F6AF3" },
  activeTabText: { color: "#4F6AF3", fontWeight: "600" },
  page: { flex: 1 },
  pageContent: { padding: 16, paddingBottom: 40 },
  
  // Info cards
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  infoText: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1e40af' },
  
  creditsCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  creditsLabel: { fontSize: 14, color: '#166534', marginBottom: 4 },
  creditsValue: { fontSize: 32, fontWeight: '700', color: '#15803d' },
  
  // Form
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  hint: { fontSize: 12, color: '#666', marginTop: 4 },
  
  // Media Type Toggle
  mediaTypeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaTypeToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4F6AF3',
  },
  mediaTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    gap: 8,
  },
  mediaTypeBtnActive: {
    backgroundColor: '#4F6AF3',
  },
  mediaTypeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4F6AF3',
  },
  mediaTypeBtnTextActive: {
    color: '#fff',
  },
  
  // Optional info card
  optionalInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  optionalInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#92400e',
  },
  
  dateRow: { flexDirection: 'row' },
  
  // Date Picker
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    gap: 10,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  datePickerPlaceholder: {
    color: '#999',
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
  },
  datePicker: {
    height: 200,
  },
  
  // Image picker
  imagePickerBtn: {
    borderWidth: 2,
    borderColor: '#4F6AF3',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9ff',
    minHeight: 130,
  },
  imagePickerText: { marginTop: 8, fontSize: 15, fontWeight: '600', color: '#333' },
  imagePickerHint: { marginTop: 4, fontSize: 13, color: '#666' },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  warningText: { flex: 1, marginLeft: 10, fontSize: 14, color: '#92400e' },
  
  submitBtn: {
    backgroundColor: '#4F6AF3',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: '#cbd5e1' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
  // Status tab
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#333', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#666', marginTop: 8 },
  
  adCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adTitle: { fontSize: 18, fontWeight: '700', color: '#333', flex: 1, marginRight: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600', color: '#fff', marginLeft: 4 },
  
  adDetails: { marginBottom: 12 },
  adDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  adDetailText: { fontSize: 14, color: '#666', marginLeft: 8 },
  
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  pendingNoticeText: { fontSize: 13, color: '#92400e', marginLeft: 6, fontWeight: '500' },
  
  // Video section styles
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#7c3aed',
  },
  
  // Video Header Banner
  videoHeaderBanner: {
    flexDirection: 'row',
    backgroundColor: '#0891b2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  videoHeaderLeft: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoHeaderContent: {
    flex: 1,
    marginLeft: 14,
  },
  videoHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  videoHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  
  // Video Size Cards
  videoSizeCardsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  videoSizeCard: {
    flex: 1,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  videoSizeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  videoSizeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  videoSizeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5b21b6',
  },
  
  // Label Row
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sizeBadge: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  optionalBadge: {
    backgroundColor: '#9ca3af',
  },
  sizeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Video Upload Card
  videoUploadCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  videoUploadCardSelected: {
    borderColor: '#0891b2',
    borderStyle: 'solid',
    backgroundColor: '#ecfeff',
  },
  videoUploadContent: {
    alignItems: 'center',
  },
  videoUploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#cffafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  videoUploadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0891b2',
    marginBottom: 4,
  },
  videoUploadHint: {
    fontSize: 12,
    color: '#9ca3af',
  },
  
  // Video Selected State
  videoSelectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  videoIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoSelectedInfo: {
    flex: 1,
    marginLeft: 14,
  },
  videoSelectedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5b21b6',
  },
  videoSelectedName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  videoRemoveText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
    textDecorationLine: 'underline',
  },
  
  // Video Not Available Card
  videoNotAvailableCard: {
    backgroundColor: '#f5f3ff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd6fe',
    borderStyle: 'dashed',
  },
  videoNotAvailableIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  videoNotAvailableTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#5b21b6',
    textAlign: 'center',
    marginBottom: 8,
  },
  videoNotAvailableDesc: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  videoSizeRequirements: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  videoSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  videoSizeText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 10,
  },
  videoSizeBold: {
    fontWeight: '700',
    color: '#7c3aed',
  },
  videoNotAvailableNote: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Professional Help Card
  proHelpCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  proHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proHelpIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proHelpTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 12,
  },
  proHelpSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 12,
  },
  proHelpDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 14,
  },
  proHelpDesc: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  proHelpButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  proHelpCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
    paddingVertical: 12,
    borderRadius: 10,
  },
  proHelpCallText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  proHelpWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 10,
  },
  proHelpWhatsAppText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  proHelpPhone: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  whatsAppHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 4,
  },
  whatsAppHelpText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  
  // Video Help Card styles
  videoHelpCard: {
    backgroundColor: '#ecfeff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  videoHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  videoHelpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0891b2',
    marginLeft: 10,
  },
  videoHelpDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 14,
  },
  videoHelpActions: {
    flexDirection: 'row',
    gap: 10,
  },
  videoHelpWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 10,
  },
  videoHelpCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
    paddingVertical: 12,
    borderRadius: 10,
  },
  videoHelpBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  videoHelpPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  videoHelpPhoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0891b2',
    marginLeft: 6,
  },
  
  // Video Thumbnail Preview Styles
  videoPreviewWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  videoThumbnailTall: {
    height: 180,
  },
  videoThumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
  },
  
  // Video Selected Card Styles
  videoSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  videoSelectedIconArea: {
    position: 'relative',
    marginRight: 14,
  },
  videoSelectedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  videoSelectedDetails: {
    flex: 1,
  },
  videoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  videoSelectedSize: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0891b2',
    marginBottom: 2,
  },
  videoCardFileName: {
    fontSize: 12,
    color: '#6b7280',
  },
  videoRemoveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoRemoveCornerBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  videoThumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  videoInfoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  videoThumbnailSizeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  videoInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoReadyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22c55e',
    marginLeft: 5,
  },
  videoRemoveFloatingBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoRemoveButton: {
    padding: 2,
  },
  videoUploadCardTall: {
    minHeight: 200,
  },
  
  // Keep old styles for backward compatibility
  videoInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f3ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  videoInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5b21b6',
    marginBottom: 4,
  },
  videoInfoText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  videoPickerBtn: {
    borderColor: '#c4b5fd',
    backgroundColor: '#faf5ff',
  },
  videoSelectedContainer: {
    alignItems: 'center',
  },
  videoSelectedText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  videoFileName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: '#ecfeff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0e7490',
    marginBottom: 6,
  },
  helpText: {
    fontSize: 13,
    color: '#0891b2',
    marginBottom: 10,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f0fdfa',
    borderRadius: 6,
  },
  contactText: {
    fontSize: 13,
    color: '#0e7490',
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  clickableText: {
    textDecorationLine: 'underline',
  },
});
