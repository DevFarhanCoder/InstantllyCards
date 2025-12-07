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
  RefreshControl
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get("window");
const API_BASE_URL = "https://api.instantllycards.com/api";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Status State
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    loadUserData();
    if (activeTab === 'status') {
      loadMyAds();
    }
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        // Load user credits
        const response = await fetch(`${API_BASE_URL}/credits/balance`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setUserCredits(data.credits);
        }
      }
    } catch (error) {
      console.error('Load user data error:', error);
    }
  };

  const changeTab = (tab: "create" | "status") => {
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({ x: tab === "create" ? 0 : width, animated: true });
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
    if (!bottomImage) {
      Alert.alert('Error', 'Bottom banner image is required');
      return;
    }

    // Check credits
    if (userCredits < 1020) {
      Alert.alert('Insufficient Credits', `You need 1020 credits to create an ad. Current balance: ${userCredits}`);
      return;
    }

    // Confirm ad submission with cost breakdown
    Alert.alert(
      '📢 Ad Submission Cost',
      `💳 Credits: 1020 (will be deducted now)\n💵 Cash Payment: ₹180 (after admin approval)\n📊 Total Cost: 1020 credits + ₹180\n\n⚠️ Admin will review your ad. After approval, you will be contacted to pay ₹180.\n\nDo you want to proceed?`,
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
      const userPhone = await AsyncStorage.getItem('user_phone');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('phoneNumber', phoneNumber);
      formData.append('uploaderPhone', userPhone || phoneNumber);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);

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

      const response = await fetch(`${API_BASE_URL}/channel-partner/ads`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          '✅ Ad Submitted Successfully!',
          `💳 1020 credits deducted\n📊 Remaining credits: ${data.remainingCredits?.toLocaleString() || 'N/A'}\n\n⏳ Your ad is now pending admin approval.\n💵 After approval, admin will contact you for ₹180 payment.`,
          [{ text: 'OK', onPress: () => {
            // Reset form
            setTitle('');
            setPhoneNumber('');
            setStartDate('');
            setEndDate('');
            setBottomImage(null);
            setFullscreenImage(null);
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
              Create an ad for 1020 credits. Your ad will be reviewed by admin before appearing in the app.
            </Text>
          </View>

          <View style={styles.creditsCard}>
            <Text style={styles.creditsLabel}>Available Credits</Text>
            <Text style={styles.creditsValue}>{userCredits.toLocaleString()}</Text>
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bottom Banner Image * (624×174px)</Text>
            <TouchableOpacity 
              style={styles.imagePickerBtn} 
              onPress={() => pickImage('bottom')}
            >
              {bottomImage ? (
                <Image source={{ uri: bottomImage.uri }} style={styles.imagePreview} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={40} color="#4F6AF3" />
                  <Text style={styles.imagePickerText}>Select Bottom Banner</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Fullscreen Image (Optional 624×1000px)</Text>
            <TouchableOpacity 
              style={styles.imagePickerBtn} 
              onPress={() => pickImage('fullscreen')}
            >
              {fullscreenImage ? (
                <Image source={{ uri: fullscreenImage.uri }} style={styles.imagePreview} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={40} color="#999" />
                  <Text style={styles.imagePickerText}>Select Fullscreen Image</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.hint}>Shown when user taps banner</Text>
          </View>

          <View style={styles.dateRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Start Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>End Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.warningText}>
              1020 credits will be deducted upon submission
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
                <Text style={styles.submitBtnText}>Submit Ad (1020 Credits)</Text>
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
  
  dateRow: { flexDirection: 'row' },
  
  // Image picker
  imagePickerBtn: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    minHeight: 120,
  },
  imagePickerText: { marginTop: 8, fontSize: 14, color: '#666' },
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
});
