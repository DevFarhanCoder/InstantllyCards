import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId, getCurrentUserPhone, getCurrentUserName } from '../../../lib/useUser';
import FooterCarousel from '../../../components/FooterCarousel';

const { width } = Dimensions.get("window");
const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE}${process.env.EXPO_PUBLIC_API_PREFIX}`;

type AdTypeOption = "video" | "image" | null;
type HasDesignOption = "yes" | "no" | null;
type MediaType = "image" | "video" | null;

export default function AdQuestionnaire() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: "withChannel" | "withoutChannel" }>();
  
  const [adType, setAdType] = useState<AdTypeOption>(null);
  const [hasDesign, setHasDesign] = useState<HasDesignOption>(null);
  
  // No Design Form State
  const [showNoDesignForm, setShowNoDesignForm] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [webLinks, setWebLinks] = useState<string[]>(['']);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [adText, setAdText] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<any[]>([]);
  const [isSubmittingNoDesign, setIsSubmittingNoDesign] = useState(false);

  // Web Links Management
  const addWebLink = () => {
    setWebLinks([...webLinks, '']);
  };

  const removeWebLink = (index: number) => {
    if (webLinks.length > 1) {
      setWebLinks(webLinks.filter((_, i) => i !== index));
    } else {
      setWebLinks(['']);
    }
  };

  const updateWebLink = (index: number, value: string) => {
    const updated = [...webLinks];
    updated[index] = value;
    setWebLinks(updated);
  };

  const handleSubmit = () => {
    if (!hasDesign) {
      return;
    }

    if (hasDesign === "yes") {
      // Navigate to create ads form (user has design ready)
      router.push({
        pathname: "/(tabs)/ads/adswithoutchannel",
        params: { adMediaType: "both" } // Changed to "both" since user can upload both image and video
      });
    } else {
      // If no design, show the design request form
      setShowNoDesignForm(true);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permission is required to select images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1, // Full quality for up to 16MB images
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImages([...selectedImages, ...result.assets]);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permission is required to select videos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedVideos([...selectedVideos, ...result.assets]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setSelectedVideos(selectedVideos.filter((_, i) => i !== index));
  };

  const handleNoDesignSubmit = async () => {
    // Validation - check if at least something is provided
    const validWebLinks = webLinks.filter(link => link.trim().length > 0);
    const hasContent = validWebLinks.length > 0 || phoneNumber.trim() || adText.trim() || businessAddress.trim() || selectedImages.length > 0 || selectedVideos.length > 0;
    
    if (!hasContent) {
      Alert.alert('Error', 'Please provide at least one of: Web Link, Phone Number, Text, Business Address, or Images/Videos');
      return;
    }

    // Validate phone number if provided
    if (phoneNumber.trim()) {
      const phonePattern = /^(\+\d{1,3})?\s?\d{10}$/;
      if (!phonePattern.test(phoneNumber.trim())) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid phone number (e.g., +91 9876543210 or 9876543210)');
        return;
      }
    }

    // Validate web links if provided
    const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    const invalidLinks = validWebLinks.filter(link => !urlPattern.test(link.trim()));
    
    if (invalidLinks.length > 0) {
      Alert.alert('Invalid Website Link', 'Please enter valid website URLs (e.g., https://example.com or www.example.com)');
      return;
    }

    // Validate email if provided
    if (email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.trim())) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return;
      }
    }

    setIsSubmittingNoDesign(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await getCurrentUserId();
      const userPhone = await getCurrentUserPhone();
      const userName = await getCurrentUserName();

      const formData = new FormData();
      formData.append('businessName', businessName.trim());
      formData.append('email', email.trim());
      formData.append('webLinks', JSON.stringify(validWebLinks));
      formData.append('phoneNumber', phoneNumber.trim());
      formData.append('adText', adText.trim());
      formData.append('businessAddress', businessAddress.trim());
      formData.append('uploaderPhone', userPhone || '');
      formData.append('uploaderName', userName || 'Mobile User');
      formData.append('userId', userId || '');
      formData.append('adType', adType || 'image');
      formData.append('needsDesign', 'true');
      formData.append('channelType', type || 'withoutChannel');

      // Append multiple images
      selectedImages.forEach((image, index) => {
        formData.append('referenceImages', {
          uri: image.uri,
          type: 'image/jpeg',
          name: `reference_image_${index}.jpg`
        } as any);
      });

      // Append multiple videos
      selectedVideos.forEach((video, index) => {
        formData.append('referenceVideos', {
          uri: video.uri,
          type: 'video/mp4',
          name: `reference_video_${index}.mp4`
        } as any);
      });

      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/channel-partner/ads/design-request`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          '✅ Design Request Submitted!',
          'Our team will create the ad design for you. You will be contacted soon.',
          [{ 
            text: 'OK', 
            onPress: () => {
              // Reset form and go back
              setBusinessName('');
              setEmail('');
              setWebLinks(['']);
              setPhoneNumber('');
              setAdText('');
              setBusinessAddress('');
              setSelectedImages([]);
              setSelectedVideos([]);
              setShowNoDesignForm(false);
              setAdType(null);
              setHasDesign(null);
              router.back();
            }
          }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to submit design request');
      }
    } catch (error) {
      console.error('Submit design request error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSubmittingNoDesign(false);
    }
  };

  const handleBackToQuestionnaire = () => {
    setShowNoDesignForm(false);
    setBusinessName('');
    setEmail('');
    setWebLinks(['']);
    setPhoneNumber('');
    setAdText('');
    setBusinessAddress('');
    setSelectedImages([]);
    setSelectedVideos([]);
  };

  const isSubmitDisabled = !hasDesign;

  // No Design Form UI
  if (showNoDesignForm) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBackToQuestionnaire}>
            <Ionicons name="arrow-back" size={20} color="#4F6AF3" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          {/* Header with Icon */}
          <View style={styles.formHeader}>
            <View style={styles.formIconContainer}>
              <Ionicons name="create-outline" size={28} color="#4F6AF3" />
            </View>
            <View style={styles.formHeaderContent}>
              <Text style={styles.formTitle}>Design Request</Text>
              <Text style={styles.formSubtitle}>
                Share your business details and our creative team will design a stunning ad for you.
              </Text>
            </View>
          </View>

          {/* Business Name */}
          <View style={styles.formGroup}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="business-outline" size={16} color="#4F6AF3" />
              <Text style={styles.label}>Business Name</Text>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="storefront-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="ABC Restaurant, XYZ Shop"
                placeholderTextColor="#9CA3AF"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="mail-outline" size={16} color="#4F6AF3" />
              <Text style={styles.label}>Email Address</Text>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="at-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="email@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.formGroup}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="call-outline" size={16} color="#4F6AF3" />
              <Text style={styles.label}>Contact Number</Text>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="phone-portrait-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="+91 9876543210"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9+\s]/g, '');
                  if (cleaned.length <= 15) {
                    setPhoneNumber(cleaned);
                  }
                }}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
            {phoneNumber.length > 0 && phoneNumber.length < 10 && (
              <Text style={styles.errorHint}>Enter at least 10 digits</Text>
            )}
          </View>

          {/* Multiple Web Links */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <View style={styles.labelWithIcon}>
                <Ionicons name="link-outline" size={16} color="#4F6AF3" />
                <Text style={styles.label}>Website Links</Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={addWebLink}>
                <Ionicons name="add-circle" size={24} color="#4F6AF3" />
              </TouchableOpacity>
            </View>
            {webLinks.map((link, index) => (
              <View key={index} style={styles.webLinkRow}>
                <View style={[styles.inputContainer, styles.webLinkInputContainer]}>
                  <Ionicons name="globe-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="https://yourwebsite.com"
                    placeholderTextColor="#9CA3AF"
                    value={link}
                    onChangeText={(value) => updateWebLink(index, value)}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                  {webLinks.length > 1 && (
                    <TouchableOpacity 
                      style={styles.trashButton} 
                      onPress={() => removeWebLink(index)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.sectionDivider} />

          {/* Ad Text */}
          <View style={styles.formGroup}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="text-outline" size={16} color="#4F6AF3" />
              <Text style={styles.label}>Ad Message / Tagline</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="50% OFF on all products! Limited time offer."
              placeholderTextColor="#9CA3AF"
              value={adText}
              onChangeText={setAdText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{adText.length}/500</Text>
          </View>

          {/* Business Address */}
          <View style={styles.formGroup}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="location-outline" size={16} color="#4F6AF3" />
              <Text style={styles.label}>Business Address</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, styles.addressArea]}
              placeholder="Shop No. 123, ABC Market, Main Road, City"
              placeholderTextColor="#9CA3AF"
              value={businessAddress}
              onChangeText={setBusinessAddress}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.sectionDivider} />

          {/* Images and Videos Upload */}
          <View style={styles.formGroup}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="images-outline" size={16} color="#4F6AF3" />
              <Text style={styles.label}>Reference Media (Optional)</Text>
            </View>
            
            {/* Show selected images */}
            {selectedImages.length > 0 && (
              <>
                <View style={styles.mediaHeader}>
                  <Text style={styles.mediaTypeLabel}>📷 Images ({selectedImages.length})</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollView}>
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.mediaItemContainer}>
                      <Image source={{ uri: image.uri }} style={styles.mediaThumb} />
                      <TouchableOpacity 
                        style={styles.removeMediaThumbButton} 
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Show selected videos */}
            {selectedVideos.length > 0 && (
              <>
                <View style={styles.mediaHeader}>
                  <Text style={styles.mediaTypeLabel}>🎬 Videos ({selectedVideos.length})</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollView}>
                  {selectedVideos.map((video, index) => (
                    <View key={index} style={styles.mediaItemContainer}>
                      <View style={styles.videoThumb}>
                        <Ionicons name="videocam" size={24} color="#4F6AF3" />
                        <Text style={styles.videoThumbText}>Video {index + 1}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeMediaThumbButton} 
                        onPress={() => removeVideo(index)}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
            
            {/* Upload Buttons */}
            <View style={styles.mediaButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.mediaButton, 
                  selectedImages.length > 0 && styles.mediaButtonActive
                ]} 
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={22} color={selectedImages.length > 0 ? "#FFFFFF" : "#4F6AF3"} />
                <Text style={[styles.mediaButtonText, selectedImages.length > 0 && styles.mediaButtonTextActive]}>
                  {selectedImages.length > 0 ? `Images (${selectedImages.length})` : 'Add Images'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.mediaButton, 
                  selectedVideos.length > 0 && styles.mediaButtonActive
                ]} 
                onPress={pickVideo}
              >
                <Ionicons name="videocam-outline" size={22} color={selectedVideos.length > 0 ? "#FFFFFF" : "#4F6AF3"} />
                <Text style={[styles.mediaButtonText, selectedVideos.length > 0 && styles.mediaButtonTextActive]}>
                  {selectedVideos.length > 0 ? `Videos (${selectedVideos.length})` : 'Add Videos'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={22} color="#4F6AF3" />
            <Text style={styles.infoCardText}>
              Our design team will create a professional ad based on your inputs. You'll be contacted within 24-48 hours.
            </Text>
          </View>

          {/* Pricing Card */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <View style={styles.pricingIconContainer}>
                <Ionicons name="wallet-outline" size={24} color="#10B981" />
              </View>
              <View style={styles.pricingContent}>
                <Text style={styles.pricingLabel}>Design Service Fee</Text>
                <Text style={styles.pricingAmount}>₹400</Text>
              </View>
            </View>
            <View style={styles.pricingDivider} />
            <View style={styles.pricingDetails}>
              <View style={styles.pricingDetailRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.pricingDetailText}>Professional ad design</Text>
              </View>
              <View style={styles.pricingDetailRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.pricingDetailText}>Multiple revisions included</Text>
              </View>
              <View style={styles.pricingDetailRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.pricingDetailText}>24-48 hour delivery</Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButtonLarge, isSubmittingNoDesign && styles.submitButtonDisabled]}
            onPress={handleNoDesignSubmit}
            disabled={isSubmittingNoDesign}
            activeOpacity={0.8}
          >
            {isSubmittingNoDesign ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.submitButtonContent}>
                <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Proceed to Payment (₹400)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        {/* Question 1 */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionNumber}>1</Text>
          <View style={styles.questionTextContainer}>
            <Text style={styles.questionText}>Do you have ad design available with you?</Text>
            <Text style={styles.questionSubtext}>
              (Bottom image - 624×174px, Full screen image/video - 624×1000px)
            </Text>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.radioOption,
              hasDesign === "yes" && styles.radioOptionSelected,
            ]}
            onPress={() => setHasDesign("yes")}
            activeOpacity={0.7}
          >
            <View style={[styles.radioCircle, hasDesign === "yes" && styles.radioCircleSelected]}>
              {hasDesign === "yes" && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.radioText, hasDesign === "yes" && styles.radioTextSelected]}>
              Yes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              hasDesign === "no" && styles.radioOptionSelected,
            ]}
            onPress={() => setHasDesign("no")}
            activeOpacity={0.7}
          >
            <View style={[styles.radioCircle, hasDesign === "no" && styles.radioCircleSelected]}>
              {hasDesign === "no" && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.radioText, hasDesign === "no" && styles.radioTextSelected]}>
              No
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitButtonText, isSubmitDisabled && styles.submitButtonTextDisabled]}>
            Submit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing for footer carousel */}
      <View style={{ height: 120 }} />
    </ScrollView>

    {/* Footer Carousel */}
    <FooterCarousel />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4F6AF3",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
    marginRight: 12,
  },
  questionTextContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    lineHeight: 24,
  },
  questionSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 18,
  },
  questionMarginTop: {
    marginTop: 32,
  },
  optionsContainer: {
    marginLeft: 40,
    gap: 12,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
  },
  radioOptionSelected: {
    borderColor: "#4F6AF3",
    backgroundColor: "#EEF2FF",
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#4F6AF3",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4F6AF3",
  },
  radioText: {
    fontSize: 15,
    color: "#4B5563",
    fontWeight: "500",
  },
  radioTextSelected: {
    color: "#4F6AF3",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#4F6AF3",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 36,
    shadowColor: "#4F6AF3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  submitButtonTextDisabled: {
    color: "#9CA3AF",
  },
  // No Design Form Styles
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#4F6AF3',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  mediaButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  mediaButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F6AF3',
  },
  mediaPreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  mediaPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  videoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4F6AF3',
    borderStyle: 'dashed',
  },
  videoPreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F6AF3',
    marginTop: 8,
  },
  videoFileName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    maxWidth: '80%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  // New styles for enhanced form
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    padding: 4,
  },
  webLinkRow: {
    marginBottom: 8,
  },
  webLinkInputContainer: {
    flex: 1,
  },
  trashButton: {
    padding: 10,
    marginLeft: 6,
  },
  removeWebLinkButton: {
    marginLeft: 8,
    padding: 4,
  },
  mediaHeader: {
    marginBottom: 8,
    marginTop: 8,
  },
  mediaCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  mediaScrollView: {
    marginBottom: 10,
  },
  mediaItemContainer: {
    position: 'relative',
    marginRight: 12,
  },
  mediaThumb: {
    width: 90,
    height: 90,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  videoThumb: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#4F6AF3',
  },
  videoThumbText: {
    fontSize: 10,
    color: '#4F6AF3',
    fontWeight: '600',
    marginTop: 4,
  },
  removeMediaThumbButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F6AF3',
  },
  // Media type label and button active styles
  mediaTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F6AF3',
  },
  mediaButtonActive: {
    backgroundColor: '#4F6AF3',
    borderColor: '#4F6AF3',
    borderStyle: 'solid',
  },
  mediaButtonTextActive: {
    color: '#FFFFFF',
  },
  // Enhanced form styles
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  formIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  formHeaderContent: {
    flex: 1,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
  },
  inputContainerFocused: {
    borderColor: '#4F6AF3',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 14,
  },
  textAreaContainer: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    padding: 14,
  },
  textAreaWithCount: {
    minHeight: 100,
    fontSize: 15,
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  fieldHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    marginLeft: 4,
  },
  errorHint: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  addressArea: {
    minHeight: 70,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  infoCardText: {
    flex: 1,
    fontSize: 12,
    color: '#4F6AF3',
    lineHeight: 17,
  },
  pricingCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pricingIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingContent: {
    flex: 1,
  },
  pricingLabel: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
    marginBottom: 4,
  },
  pricingAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#BBF7D0',
    marginVertical: 14,
  },
  pricingDetails: {
    gap: 10,
  },
  pricingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pricingDetailText: {
    fontSize: 13,
    color: '#065F46',
    flex: 1,
  },
  submitButtonLarge: {
    backgroundColor: '#4F6AF3',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#4F6AF3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
