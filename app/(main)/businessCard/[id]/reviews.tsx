// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   ScrollView,
//   TouchableOpacity,
//   Platform,
//   StatusBar,
//   ActivityIndicator,
//   TextInput,
//   Image,
// } from 'react-native';
// import { router, useLocalSearchParams } from 'expo-router';
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import { useQuery } from '@tanstack/react-query';
// import api from '@/lib/api';
// import * as ImagePicker from 'expo-image-picker';

// const STATUSBAR_HEIGHT =
//   Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

// // Rating configuration with suggestions and emojis
// const RATING_CONFIG = {
//   1: {
//     label: 'Terrible',
//     emoji: '😠',
//     suggestions: ['Poor service', 'Rude staff', 'Overpriced', 'Long wait time', 'Poor quality'],
//     prompt: 'What went wrong?',
//   },
//   2: {
//     label: 'Bad',
//     emoji: '😞',
//     suggestions: ['Disappointing', 'Below expectations', 'Poor service', 'Not worth it', 'Slow service'],
//     prompt: 'What went wrong?',
//   },
//   3: {
//     label: 'Average',
//     emoji: '😐',
//     suggestions: ['What did you like?', 'What could be improved?', 'Room for improvement', 'Mixed experience'],
//     prompt: 'What did you like and dislike?',
//   },
//   4: {
//     label: 'Good',
//     emoji: '😊',
//     suggestions: ['Good service', 'Quality products', 'Friendly staff', 'Value for money', 'Clean premises'],
//     prompt: 'What did you like and dislike?',
//   },
//   5: {
//     label: 'Excellent',
//     emoji: '🤩',
//     suggestions: ['Outstanding service', 'Loved it!', 'Best experience', 'Highly recommend', 'Perfect!'],
//     prompt: 'What did you love?',
//   },
// };

// export default function ReviewsScreen() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const [rating, setRating] = useState(0);
//   const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
//   const [experience, setExperience] = useState('');
//   const [photos, setPhotos] = useState<string[]>([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   /* ==============================
//      FETCH BUSINESS
//   =============================== */
//   const { data: business, isLoading: businessLoading } = useQuery({
//     queryKey: ['business-detail', id],
//     enabled: !!id,
//     queryFn: async () => {
//       const res = await api.get(`/business-listings/${id}`);
//       return res.data;
//     },
//   });

//   /* ==============================
//      FETCH REVIEWS
//   =============================== */
//   const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
//     queryKey: ['business-reviews', id],
//     enabled: !!id,
//     queryFn: async () => {
//       // TODO: Replace with actual API endpoint when available
//       // const res = await api.get(`/business-listings/${id}/reviews`);
//       // return res.data || [];
//       return [];
//     },
//   });

//   /* ==============================
//      SUBMIT REVIEW
//   =============================== */
//   const handleSubmitReview = async () => {
//     if (rating === 0) {
//       alert('Please select a rating');
//       return;
//     }
//     if (selectedSuggestions.length === 0) {
//       alert('Please select at least one suggestion');
//       return;
//     }
//     if (!experience.trim()) {
//       alert('Please describe your experience');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       // TODO: Replace with actual API endpoint when available
//       // await api.post(`/business-listings/${id}/review`, {
//       //   rating,
//       //   suggestions: selectedSuggestions,
//       //   experience,
//       //   photos,
//       // });

//       // Reset form
//       setRating(0);
//       setSelectedSuggestions([]);
//       setExperience('');
//       setPhotos([]);

//       alert('Review submitted successfully!');
//     } catch (error) {
//       console.error('Failed to submit review:', error);
//       alert('Failed to submit review. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   /* ==============================
//      PICK PHOTOS
//   =============================== */
//   const handlePickPhotos = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsMultipleSelection: true,
//       aspect: [4, 3],
//       quality: 0.8,
//     });

//     if (!result.canceled) {
//       const newPhotos = result.assets.map((asset) => asset.uri);
//       setPhotos([...photos, ...newPhotos]);
//     }
//   };

//   const handleRemovePhoto = (index: number) => {
//     setPhotos(photos.filter((_, i) => i !== index));
//   };

//   /* ==============================
//      TOGGLE SUGGESTION
//   =============================== */
//   const toggleSuggestion = (suggestion: string) => {
//     setSelectedSuggestions((prev) =>
//       prev.includes(suggestion)
//         ? prev.filter((s) => s !== suggestion)
//         : [...prev, suggestion]
//     );
//   };

//   if (businessLoading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.centeredContent}>
//           <ActivityIndicator size="large" color="#3B82F6" />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const isLoading = reviewsLoading;
//   const hasReviews = reviews && reviews.length > 0;

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       {/* Header */}
//       <View style={styles.headerContainer}>
//         <View style={styles.header}>
//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() => router.back()}
//             hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//           >
//             <Ionicons name="arrow-back" size={24} color="#1F2937" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle} numberOfLines={1}>
//             {business?.businessName || 'Reviews'}
//           </Text>
//           <View style={styles.headerRightPlaceholder} />
//         </View>
//       </View>

//       <ScrollView
//         style={styles.content}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Review Stats Section */}
//         {hasReviews && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Overall Rating</Text>
//             <View style={styles.statsContainer}>
//               <View style={styles.ratingCircle}>
//                 <Text style={styles.ratingValue}>4.5</Text>
//                 <Text style={styles.ratingStars}>★★★★☆</Text>
//               </View>
//               <View style={styles.statsContent}>
//                 <Text style={styles.statsLabel}>{reviews.length} Reviews</Text>
//                 <View style={styles.ratingBreakdown}>
//                   {[5, 4, 3, 2, 1].map((star) => (
//                     <View key={star} style={styles.ratingBar}>
//                       <Text style={styles.starLabel}>{star}★</Text>
//                       <View style={styles.barBackground}>
//                         <View style={[styles.barFill, { width: `${Math.random() * 100}%` }]} />
//                       </View>
//                     </View>
//                   ))}
//                 </View>
//               </View>
//             </View>
//           </View>
//         )}

//         {/* Write Review Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Write a Review</Text>

//           {/* Rating Stars with Labels */}
//           <View style={styles.ratingInput}>
//             <Text style={styles.label}>Your Rating</Text>
//             <View style={styles.starsContainerWithLabels}>
//               {[1, 2, 3, 4, 5].map((star) => (
//                 <View key={star} style={styles.starWithLabel}>
//                   <TouchableOpacity
//                     onPress={() => setRating(star)}
//                     hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                   >
//                     <Ionicons
//                       name={star <= rating ? 'star' : 'star-outline'}
//                       size={44}
//                       color={star <= rating ? '#FBBF24' : '#D1D5DB'}
//                     />
//                   </TouchableOpacity>
//                   <Text style={styles.starLabel}>
//                     {RATING_CONFIG[star as keyof typeof RATING_CONFIG]?.emoji}
//                   </Text>
//                   <Text style={styles.starLabelText}>
//                     {RATING_CONFIG[star as keyof typeof RATING_CONFIG]?.label}
//                   </Text>
//                 </View>
//               ))}
//             </View>
//           </View>

//           {/* Suggested Words Section */}
//           {rating > 0 && (
//             <>
//               <View style={styles.suggestionsSection}>
//                 <Text style={styles.suggestionsTitle}>
//                   {RATING_CONFIG[rating as keyof typeof RATING_CONFIG]?.prompt}
//                 </Text>
//                 <View style={styles.suggestionsContainer}>
//                   {RATING_CONFIG[rating as keyof typeof RATING_CONFIG]?.suggestions.map(
//                     (suggestion, index) => (
//                       <TouchableOpacity
//                         key={index}
//                         style={[
//                           styles.suggestionTag,
//                           selectedSuggestions.includes(suggestion) && styles.suggestionTagSelected,
//                         ]}
//                         onPress={() => toggleSuggestion(suggestion)}
//                       >
//                         <Text
//                           style={[
//                             styles.suggestionTagText,
//                             selectedSuggestions.includes(suggestion) && styles.suggestionTagTextSelected,
//                           ]}
//                         >
//                           {suggestion}
//                         </Text>
//                       </TouchableOpacity>
//                     )
//                   )}
//                 </View>
//               </View>

//               {/* Tell us about your experience */}
//               <View style={styles.formField}>
//                 <Text style={styles.label}>Tell us about your experience</Text>
//                 <TextInput
//                   style={[styles.textInput, styles.textArea]}
//                   placeholder="Share more details about your experience..."
//                   placeholderTextColor="#9CA3AF"
//                   value={experience}
//                   onChangeText={setExperience}
//                   maxLength={500}
//                   multiline
//                   numberOfLines={5}
//                 />
//                 <Text style={styles.charCount}>{experience.length}/500</Text>
//               </View>

//               {/* Upload Photos Section */}
//               <View style={styles.formField}>
//                 <Text style={styles.label}>Add Photos (Optional)</Text>
//                 <TouchableOpacity
//                   style={styles.uploadPhotosButton}
//                   onPress={handlePickPhotos}
//                 >
//                   <Ionicons name="cloud-upload-outline" size={24} color="#3B82F6" />
//                   <Text style={styles.uploadPhotosText}>Upload Photos</Text>
//                 </TouchableOpacity>

//                 {/* Display selected photos */}
//                 {photos.length > 0 && (
//                   <View style={styles.photosGridReview}>
//                     {photos.map((photoUri, index) => (
//                       <View key={index} style={styles.photoItemReview}>
//                         <Image
//                           source={{ uri: photoUri }}
//                           style={styles.photoItemImage}
//                           resizeMode="cover"
//                         />
//                         <TouchableOpacity
//                           style={styles.removePhotoButton}
//                           onPress={() => handleRemovePhoto(index)}
//                         >
//                           <Ionicons name="close-circle" size={24} color="#EF4444" />
//                         </TouchableOpacity>
//                       </View>
//                     ))}
//                   </View>
//                 )}
//               </View>

//               {/* Submit Button */}
//               <TouchableOpacity
//                 style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
//                 onPress={handleSubmitReview}
//                 disabled={isSubmitting}
//               >
//                 {isSubmitting ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <Text style={styles.submitButtonText}>Submit Review</Text>
//                 )}
//               </TouchableOpacity>
//             </>
//           )}
//         </View>

//         {/* Reviews List Section */}
//         {hasReviews ? (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>All Reviews ({reviews.length})</Text>
//             {reviews.map((review: any, index: number) => (
//               <View key={index} style={styles.reviewCard}>
//                 <View style={styles.reviewHeader}>
//                   <View style={styles.reviewInfo}>
//                     <Text style={styles.reviewerName}>{review.userName || 'Anonymous'}</Text>
//                     <Text style={styles.reviewDate}>
//                       {new Date(review.createdAt).toLocaleDateString()}
//                     </Text>
//                   </View>
//                   <View style={styles.reviewRating}>
//                     <Text style={styles.reviewStars}>
//                       {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
//                     </Text>
//                   </View>
//                 </View>
//                 <Text style={styles.reviewTitle}>{review.title}</Text>
//                 <Text style={styles.reviewMessage}>{review.message}</Text>
//               </View>
//             ))}
//           </View>
//         ) : isLoading ? (
//           <View style={styles.centeredContent}>
//             <ActivityIndicator size="large" color="#3B82F6" />
//           </View>
//         ) : (
//           <View style={styles.emptyStateContainer}>
//             <Ionicons name="star-outline" size={64} color="#D1D5DB" />
//             <Text style={styles.emptyStateTitle}>No reviews yet</Text>
//             <Text style={styles.emptyStateText}>
//               Be the first to share your experience with {business?.businessName}
//             </Text>
//           </View>
//         )}

//         <View style={{ height: 20 }} />
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   centeredContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   headerContainer: {
//     backgroundColor: '#fff',
//     paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 3,
//       },
//       android: {
//         elevation: 4,
//       },
//     }),
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     minHeight: 56,
//   },
//   backButton: {
//     padding: 4,
//     minWidth: 32,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     flex: 1,
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginLeft: 12,
//   },
//   headerRightPlaceholder: {
//     minWidth: 32,
//   },
//   content: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 20,
//   },
//   section: {
//     backgroundColor: '#fff',
//     paddingHorizontal: 16,
//     paddingVertical: 20,
//     marginTop: 8,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: 16,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     gap: 16,
//   },
//   ratingCircle: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: '#EFF6FF',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   ratingValue: {
//     fontSize: 36,
//     fontWeight: '700',
//     color: '#3B82F6',
//   },
//   ratingStars: {
//     fontSize: 18,
//     color: '#FBBF24',
//     marginTop: 4,
//   },
//   statsContent: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   statsLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: 10,
//   },
//   ratingBreakdown: {
//     gap: 6,
//   },
//   ratingBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
// //   starLabel: {
// //     fontSize: 12,
// //     fontWeight: '500',
// //     color: '#6B7280',
// //     minWidth: 20,
// //   },
//   barBackground: {
//     flex: 1,
//     height: 6,
//     backgroundColor: '#E5E7EB',
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   barFill: {
//     height: '100%',
//     backgroundColor: '#FBBF24',
//     borderRadius: 3,
//   },
//   ratingInput: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: 10,
//   },
//   starsContainerWithLabels: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   starWithLabel: {
//     alignItems: 'center',
//     gap: 4,
//   },
//   starsContainer: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   ratingText: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#6B7280',
//     fontStyle: 'italic',
//   },
//   starLabel: {
//     fontSize: 20,
//   },
//   starLabelText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#6B7280',
//     textAlign: 'center',
//   },
//   suggestionsSection: {
//     marginBottom: 20,
//     paddingVertical: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//   },
//   suggestionsTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: 12,
//   },
//   suggestionsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   suggestionTag: {
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 20,
//     borderWidth: 1.5,
//     borderColor: '#E5E7EB',
//     backgroundColor: '#F9FAFB',
//   },
//   suggestionTagSelected: {
//     borderColor: '#3B82F6',
//     backgroundColor: '#EFF6FF',
//   },
//   suggestionTagText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#6B7280',
//   },
//   suggestionTagTextSelected: {
//     color: '#3B82F6',
//     fontWeight: '600',
//   },
//   formField: {
//     marginBottom: 20,
//   },
//   textInput: {
//     backgroundColor: '#F9FAFB',
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 15,
//     color: '#1F2937',
//     marginBottom: 4,
//   },
//   textArea: {
//     minHeight: 120,
//     paddingTop: 12,
//     textAlignVertical: 'top',
//   },
//   charCount: {
//     fontSize: 12,
//     color: '#9CA3AF',
//     textAlign: 'right',
//   },
//   uploadPhotosButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 12,
//     borderWidth: 2,
//     borderStyle: 'dashed',
//     borderColor: '#3B82F6',
//     borderRadius: 8,
//     backgroundColor: '#F0F9FF',
//     gap: 8,
//   },
//   uploadPhotosText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#3B82F6',
//   },
//   photosGridReview: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 10,
//     marginTop: 12,
//   },
//   photoItemReview: {
//     position: 'relative',
//     width: 100,
//     height: 100,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   photoItemImage: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//   },
//   removePhotoButton: {
//     position: 'absolute',
//     top: -8,
//     right: -8,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//   },
//   submitButton: {
//     backgroundColor: '#3B82F6',
//     paddingVertical: 14,
//     paddingHorizontal: 24,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     minHeight: 48,
//   },
//   submitButtonDisabled: {
//     opacity: 0.6,
//   },
//   submitButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   reviewCard: {
//     backgroundColor: '#F9FAFB',
//     borderRadius: 8,
//     padding: 14,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   reviewHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 10,
//   },
//   reviewInfo: {
//     flex: 1,
//   },
//   reviewerName: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#1F2937',
//   },
//   reviewDate: {
//     fontSize: 12,
//     color: '#9CA3AF',
//     marginTop: 2,
//   },
//   reviewRating: {
//     marginLeft: 10,
//   },
//   reviewStars: {
//     fontSize: 14,
//     color: '#FBBF24',
//   },
//   reviewTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: 6,
//   },
//   reviewMessage: {
//     fontSize: 14,
//     color: '#6B7280',
//     lineHeight: 20,
//   },
//   emptyStateContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 60,
//   },
//   emptyStateTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyStateText: {
//     fontSize: 14,
//     color: '#6B7280',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
// });

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentUser } from '@/lib/useUser';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

const RATING_CONFIG = {
  1: { label: 'Terrible', emoji: '😠', prompt: 'What went wrong?' },
  2: { label: 'Bad', emoji: '😞', prompt: 'What went wrong?' },
  3: { label: 'Average', emoji: '😐', prompt: 'What did you like and dislike?' },
  4: { label: 'Good', emoji: '😊', prompt: 'What did you like?' },
  5: { label: 'Excellent', emoji: '🤩', prompt: 'What did you love?' },
};

export default function ReviewsScreen() {
  // ✅ [id] dynamic segment — auto-provided by Expo Router from the folder name
  const { id } = useLocalSearchParams<{ id: string }>();

  const queryClient = useQueryClient();

  // Form state
  const [rating, setRating] = useState(0);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<any[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [user, setUser] = useState<any>(null);

  /* ==============================
     FETCH BUSINESS
     Same queryKey as index.tsx → reads from cache instantly
  =============================== */
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['business-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/business-listings/${id}`);
      return res.data;
    },
    initialData: () => {
      return queryClient.getQueryData<any>(['business-detail', id]);
    },
    staleTime: 5 * 60 * 1000,
  });

  /* ==============================
     FETCH REVIEWS
     GET /api/reviews/:businessId/reviews
  =============================== */
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
  } = useQuery({
    queryKey: ['reviews', id],
    enabled: !!id,
    queryFn: async () => {
      console.log('📥 [REVIEWS API] Fetching reviews for business:', id);
      try {
        const res = await api.get(`/reviews/${id}/reviews?sort=latest&limit=20`);
        console.log('✅ [REVIEWS API SUCCESS] Reviews fetched:', {
          count: res.data?.reviews?.length || 0,
          stats: res.data?.stats,
        });
        return res.data || { reviews: [], stats: { averageRating: 0, totalReviews: 0, ratingBreakdown: {} } };
      } catch (error: any) {
        console.error('❌ [REVIEWS API ERROR]', {
          businessId: id,
          error: error?.message,
          status: error?.status,
          data: error?.data,
        });
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
  });

  /* ==============================
     FETCH SUGGESTIONS
     GET /api/suggestions/:rating
  =============================== */
  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions', rating],
    enabled: rating > 0,
    queryFn: async () => {
      console.log('🔍 [SUGGESTIONS API] Fetching suggestions for rating:', rating);
      try {
        const res = await api.get(`/suggestions/${rating}`);
        console.log('✅ [SUGGESTIONS API SUCCESS]', {
          rating: res.data?.rating,
          label: res.data?.label,
          suggestionsCount: res.data?.suggestions?.length || 0,
        });
        return res.data || { rating, suggestions: [] };
      } catch (error: any) {
        console.error('❌ [SUGGESTIONS API ERROR]', {
          rating,
          error: error?.message,
        });
        throw error;
      }
    },
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((u) => {
        if (mounted) setUser(u);
      })
      .catch(() => {
        if (mounted) setUser(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  /* ==============================
     CREATE REVIEW
     POST /api/reviews/:businessId/reviews
  =============================== */
  const { mutate: createReview, isPending: isCreatingReview } = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !reviewMessage.trim() || !rating) {
        throw new Error('Please fill all required fields and select a rating');
      }
      const businessId = id;
      console.log('📤 [CREATE REVIEW API] Submitting review:', {
        businessId,
        rating,
        titleLength: title.length,
        messageLength: reviewMessage.trim().length,
        suggestionsCount: selectedSuggestions.length,
        photosCount: uploadedPhotoUrls.length,
      });
      try {
        const res = await api.post(`/reviews/${businessId}/reviews`, {
          rating,
          title: title.trim(),
          message: reviewMessage.trim(),
          experience: experience.trim() || undefined,
          selectedSuggestions,
          photos: uploadedPhotoUrls,
        });
        console.log('✅ [CREATE REVIEW API SUCCESS]', {
          reviewId: res.data?.review?._id,
          rating: res.data?.review?.rating,
          createdAt: res.data?.review?.createdAt,
        });
        return res.data;
      } catch (error: any) {
        console.error('❌ [CREATE REVIEW API ERROR]', {
          businessId,
          error: error?.message,
          errorCode: error?.data?.error,
          status: error?.status,
        });
        throw error;
      }
    },
    onSuccess: () => {
      Alert.alert('Success', 'Your review has been posted!');
      setRating(0);
      setSelectedSuggestions([]);
      setTitle('');
      setReviewMessage('');
      setExperience('');
      setPhotos([]);
      setUploadedPhotoUrls([]);
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['business-detail', id] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to post review';
      // Handle duplicate review error specifically
      if (error?.response?.data?.error === 'DUPLICATE_REVIEW') {
        Alert.alert('Already Reviewed', 'You have already reviewed this business.');
      } else {
        Alert.alert('Error', msg);
      }
    },
  });

  const { mutate: editReview, isPending: isEditingReview } = useMutation({
    mutationFn: async (reviewId: string) => {
      const formData = new FormData();
      formData.append('rating', String(rating));
      formData.append('title', title.trim());
      formData.append('message', reviewMessage.trim());
      formData.append('experience', experience.trim());
      formData.append('selectedSuggestions', JSON.stringify(selectedSuggestions));
      formData.append('photos', JSON.stringify(uploadedPhotoUrls));

      const res = await api.put(`/reviews/${reviewId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Your review has been updated.');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['business-detail', id] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update review';
      Alert.alert('Error', msg);
    },
  });

  const { mutate: deleteReview, isPending: isDeletingReview } = useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await api.del(`/reviews/${reviewId}`);
      return res.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Review deleted successfully.');
      setRating(0);
      setSelectedSuggestions([]);
      setTitle('');
      setReviewMessage('');
      setExperience('');
      setPhotos([]);
      setUploadedPhotoUrls([]);
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['business-detail', id] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete review';
      Alert.alert('Error', msg);
    },
  });

  /* ==============================
     HELPFUL VOTE
     POST /api/reviews/:reviewId/helpful
  =============================== */
  const { mutate: voteHelpful } = useMutation({
    mutationFn: async ({ reviewId, helpful }: { reviewId: string; helpful: boolean }) => {
      console.log('👍 [HELPFUL VOTE API] Voting on review:', {
        reviewId,
        helpful,
      });
      try {
        const res = await api.post(`/reviews/${reviewId}/helpful`, { helpful });
        console.log('✅ [HELPFUL VOTE API SUCCESS]', {
          reviewId,
          helpful: res.data?.helpful,
          unhelpful: res.data?.unhelpful,
        });
        return res.data;
      } catch (error: any) {
        console.error('❌ [HELPFUL VOTE API ERROR]', {
          reviewId,
          error: error?.message,
          status: error?.status,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['business-detail', id] });
    },
  });

  /* ==============================
     REPORT REVIEW
     POST /api/reviews/:reviewId/report
  =============================== */
  const { mutate: reportReview } = useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      console.log('🚩 [REPORT REVIEW API] Reporting review:', {
        reviewId,
        reason,
      });
      try {
        const res = await api.post(`/reviews/${reviewId}/report`, { reason });
        console.log('✅ [REPORT REVIEW API SUCCESS]', {
          reviewId,
          message: res.data?.message,
        });
        return res.data;
      } catch (error: any) {
        console.error('❌ [REPORT REVIEW API ERROR]', {
          reviewId,
          reason,
          error: error?.message,
          status: error?.status,
        });
        throw error;
      }
    },
    onSuccess: () => {
      Alert.alert('Reported', 'Thank you. This review has been reported for moderation.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to report review. Please try again.');
    },
  });

  const handleReportReview = (reviewId: string) => {
    Alert.alert(
      'Report Review',
      'Why are you reporting this review?',
      [
        { text: 'Spam', onPress: () => reportReview({ reviewId, reason: 'spam' }) },
        { text: 'Inappropriate', onPress: () => reportReview({ reviewId, reason: 'inappropriate' }) },
        { text: 'Fake Review', onPress: () => reportReview({ reviewId, reason: 'fake' }) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRatingSelect = (star: number) => {
    setRating(star);
    setSelectedSuggestions([]);
  };

  const toggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions((prev) =>
      prev.includes(suggestion)
        ? prev.filter((s) => s !== suggestion)
        : [...prev, suggestion]
    );
  };

  /* ==============================
     UPLOAD PHOTOS
     POST /api/reviews/:businessId/upload-photos
  =============================== */
  const handlePickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...newUris].slice(0, 5));

      setIsUploadingPhotos(true);
      try {
        const formData = new FormData();
        result.assets.forEach((asset, index) => {
          formData.append('photos', {
            uri: asset.uri,
            name: `photo_${index}.jpg`,
            type: 'image/jpeg',
          } as any);
        });

        console.log('📸 [UPLOAD PHOTOS API] Uploading photos:', {
          businessId: id,
          photoCount: result.assets.length,
        });

        // ✅ POST /api/reviews/:businessId/upload-photos
        const res = await api.post(`/reviews/${id}/upload-photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.photos) {
          console.log('✅ [UPLOAD PHOTOS API SUCCESS]', {
            businessId: id,
            uploadedCount: res.data.photos.length,
            message: res.data.message,
          });
          setUploadedPhotoUrls((prev) => [...prev, ...res.data.photos]);
        }
      } catch (error: any) {
        console.error('❌ [UPLOAD PHOTOS API ERROR]', {
          businessId: id,
          photoCount: result.assets.length,
          error: error?.message,
          status: error?.status,
          data: error?.data,
        });
        Alert.alert('Warning', 'Photos selected but upload failed. Review will be submitted without photos.');
      } finally {
        setIsUploadingPhotos(false);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setUploadedPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const reviews = reviewsData?.reviews || [];
  const stats = reviewsData?.stats;
  const suggestions = suggestionsData?.suggestions || [];
  const currentUserId = user?._id || user?.id;
  const userReview = React.useMemo(() => {
    if (!currentUserId || !reviews?.length) return null;

    return reviews.find((r: any) => {
      const reviewUserId =
        typeof r.userId === 'object'
          ? r.userId?._id
          : r.userId;

      return reviewUserId?.toString() === currentUserId?.toString();
    }) || null;
  }, [reviews, currentUserId]);
  const isFormDisabled = isCreatingReview || isEditingReview || isDeletingReview || isUploadingPhotos;
  const canSubmit = rating > 0 && title.trim().length > 0 && reviewMessage.trim().length > 0 && !isUploadingPhotos;
  const businessName = business?.businessName || 'This Business';

  useEffect(() => {
    if (!userReview) return;
    setRating(userReview.rating || 0);
    setTitle(userReview.title || '');
    setReviewMessage(userReview.message || '');
    setSelectedSuggestions(Array.isArray(userReview.selectedSuggestions) ? userReview.selectedSuggestions : []);
    setExperience(userReview.experience || '');
    const reviewPhotos = Array.isArray(userReview.photos)
      ? userReview.photos.map((p: any) => (typeof p === 'string' ? p : p?.url)).filter(Boolean)
      : [];
    setPhotos(reviewPhotos);
    setUploadedPhotoUrls(Array.isArray(userReview.photos) ? userReview.photos : []);
  }, [userReview?._id]);

  const handleSubmitReview = () => {
    if (rating === 0) { Alert.alert('Rating Required', 'Please select a star rating.'); return; }
    if (!title.trim()) { Alert.alert('Title Required', 'Please add a title for your review.'); return; }
    if (!reviewMessage.trim()) { Alert.alert('Review Required', 'Please write your review message.'); return; }
    if (userReview?._id) {
      editReview(userReview._id);
      return;
    }
    createReview();
  };

  const handleDeleteReview = () => {
    if (!userReview?._id) return;
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete your review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteReview(userReview._id) },
      ]
    );
  };

  if (businessLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {businessName}
          </Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── RATING STATS ── */}
        {stats && stats.totalReviews > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Rating</Text>
            <View style={styles.statsContainer}>
              <View style={styles.ratingBox}>
                <Text style={styles.ratingNumber}>
                  {Number(stats?.averageRating ?? 0).toFixed(1)}
                </Text>
                <View style={styles.starsRow}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < Math.round(stats.averageRating || 0) ? 'star' : 'star-outline'}
                      size={14}
                      color={i < Math.round(stats.averageRating || 0) ? '#FBBF24' : '#D1D5DB'}
                    />
                  ))}
                </View>
              </View>
              <View style={styles.statsContent}>
                <Text style={styles.statsLabel}>{stats.totalReviews} Reviews</Text>
                {stats.ratingBreakdown && (
                  <View style={styles.ratingBreakdown}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = stats.ratingBreakdown?.[star] || 0;
                      const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                      return (
                        <View key={star} style={styles.ratingBarRow}>
                          <Text style={styles.starSmall}>{star}★</Text>
                          <View style={styles.barBackground}>
                            <View style={[styles.barFill, { width: `${pct}%` }]} />
                          </View>
                          <Text style={styles.barCount}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ── WRITE REVIEW ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{userReview ? 'Edit Your Review' : 'Write a Review'}</Text>

          <View style={styles.ratingInput}>
            <Text style={styles.label}>Your Rating *</Text>
            <View style={styles.starsContainerWithLabels}>
              {[1, 2, 3, 4, 5].map((star) => (
                <View key={star} style={styles.starWithLabel}>
                  <TouchableOpacity
                    onPress={() => handleRatingSelect(star)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={44}
                      color={star <= rating ? '#FBBF24' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                  <Text style={styles.emojiLabel}>
                    {RATING_CONFIG[star as keyof typeof RATING_CONFIG]?.emoji}
                  </Text>
                  <Text style={styles.starLabelText}>
                    {RATING_CONFIG[star as keyof typeof RATING_CONFIG]?.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {rating > 0 && (
            <>
              {suggestions.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <Text style={styles.suggestionsTitle}>
                    {RATING_CONFIG[rating as keyof typeof RATING_CONFIG]?.prompt}
                  </Text>
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((s: any, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.suggestionTag,
                          selectedSuggestions.includes(s.text) && styles.suggestionTagSelected,
                        ]}
                        onPress={() => toggleSuggestion(s.text)}
                      >
                        {s.emoji && <Text style={styles.suggestionEmoji}>{s.emoji}</Text>}
                        <Text style={[
                          styles.suggestionTagText,
                          selectedSuggestions.includes(s.text) && styles.suggestionTagTextSelected,
                        ]}>
                          {s.text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.formField}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Brief title for your review"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={(t) => setTitle(t.slice(0, 50))}
                  maxLength={50}
                  editable={!isFormDisabled}
                />
                <Text style={styles.charCount}>{title.length}/50</Text>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Review Message *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Share your experience with this business..."
                  placeholderTextColor="#9CA3AF"
                  value={reviewMessage}
                  onChangeText={(t) => setReviewMessage(t.slice(0, 500))}
                  maxLength={500}
                  multiline
                  numberOfLines={5}
                  editable={!isFormDisabled}
                />
                <Text style={styles.charCount}>{reviewMessage.length}/500</Text>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>More Details (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Any additional details about your experience..."
                  placeholderTextColor="#9CA3AF"
                  value={experience}
                  onChangeText={(t) => setExperience(t.slice(0, 500))}
                  maxLength={500}
                  multiline
                  numberOfLines={4}
                  editable={!isFormDisabled}
                />
                <Text style={styles.charCount}>{experience.length}/500</Text>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Add Photos (Optional)</Text>
                {photos.length < 5 && (
                  <TouchableOpacity
                    style={[styles.uploadPhotosButton, isUploadingPhotos && styles.uploadDisabled]}
                    onPress={handlePickPhotos}
                    disabled={isUploadingPhotos}
                  >
                    {isUploadingPhotos ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : (
                      <Ionicons name="cloud-upload-outline" size={24} color="#3B82F6" />
                    )}
                    <Text style={styles.uploadPhotosText}>
                      {isUploadingPhotos ? 'Uploading...' : `Upload Photos (${photos.length}/5)`}
                    </Text>
                  </TouchableOpacity>
                )}
                {photos.length > 0 && (
                  <View style={styles.photosGrid}>
                    {photos.map((uri, index) => (
                      <View key={index} style={styles.photoItem}>
                        <Image source={{ uri }} style={styles.photoItemImage} resizeMode="cover" />
                        <TouchableOpacity
                          style={styles.removePhotoButton}
                          onPress={() => handleRemovePhoto(index)}
                        >
                          <Ionicons name="close-circle" size={22} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, (!canSubmit || isFormDisabled) && styles.submitButtonDisabled]}
                onPress={handleSubmitReview}
                disabled={!canSubmit || isFormDisabled}
              >
                {isCreatingReview || isEditingReview ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>{userReview ? 'Update Review' : 'Post Review'}</Text>
                  </>
                )}
              </TouchableOpacity>
              {userReview && (
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: '#EF4444', marginTop: 10 }, isFormDisabled && styles.submitButtonDisabled]}
                  onPress={handleDeleteReview}
                  disabled={isFormDisabled}
                >
                  {isDeletingReview ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Delete Review</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* ── REVIEWS LIST ── */}
        {reviewsLoading ? (
          <View style={styles.centeredContent}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : reviews.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Reviews ({reviews.length})</Text>
            {reviews.map((review: any) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewerName}>{review.userName || 'Anonymous'}</Text>
                    <View style={styles.reviewStarsRow}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < review.rating ? 'star' : 'star-outline'}
                          size={13}
                          color={i < review.rating ? '#FBBF24' : '#D1D5DB'}
                        />
                      ))}
                      <Text style={styles.ratingText}>({review.rating}.0)</Text>
                    </View>
                  </View>
                  <View style={styles.reviewHeaderRight}>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                    {/* ✅ REPORT BUTTON — POST /api/reviews/:reviewId/report */}
                    <TouchableOpacity
                      style={styles.reportButton}
                      onPress={() => handleReportReview(review._id)}
                    >
                      <Ionicons name="flag-outline" size={14} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
                <Text style={styles.reviewMessage}>{review.message}</Text>

                {review.selectedSuggestions && review.selectedSuggestions.length > 0 && (
                  <View style={styles.reviewSuggestions}>
                    {review.selectedSuggestions.map((s: string, i: number) => (
                      <View key={i} style={styles.reviewSuggestionChip}>
                        <Text style={styles.reviewSuggestionText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {review.photos && review.photos.length > 0 && (
                  <View style={styles.reviewPhotosRow}>
                    {review.photos.slice(0, 3).map((photo: any, idx: number) => (
                      <Image
                        key={idx}
                        source={{ uri: photo.url }}
                        style={styles.reviewPhotoThumb}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}

                {review.ownerReply && (
                  <View style={styles.ownerReplyBox}>
                    <Text style={styles.ownerReplyLabel}>Business Response</Text>
                    <Text style={styles.ownerReplyText}>{review.ownerReply.message}</Text>
                  </View>
                )}

                {/* ✅ HELPFUL VOTING — POST /api/reviews/:reviewId/helpful */}
                <View style={styles.helpfulRow}>
                  <TouchableOpacity
                    style={styles.helpfulButton}
                    onPress={() => voteHelpful({ reviewId: review._id, helpful: true })}
                  >
                    <Ionicons name="thumbs-up-outline" size={14} color="#6B7280" />
                    <Text style={styles.helpfulText}>Helpful ({review.helpful || 0})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.helpfulButton}
                    onPress={() => voteHelpful({ reviewId: review._id, helpful: false })}
                  >
                    <Ionicons name="thumbs-down-outline" size={14} color="#6B7280" />
                    <Text style={styles.helpfulText}>Not helpful ({review.unhelpful || 0})</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="star-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No reviews yet</Text>
            <Text style={styles.emptyStateText}>
              Be the first to share your experience with {businessName}
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centeredContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 4 },
    }),
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, minHeight: 56 },
  backButton: { padding: 4, minWidth: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#1F2937', marginLeft: 12 },
  headerRightPlaceholder: { minWidth: 32 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  section: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 20, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  statsContainer: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  ratingBox: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', gap: 6 },
  ratingNumber: { fontSize: 32, fontWeight: '700', color: '#fff' },
  starsRow: { flexDirection: 'row', gap: 2 },
  statsContent: { flex: 1, justifyContent: 'center' },
  statsLabel: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 10 },
  ratingBreakdown: { gap: 5 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starSmall: { fontSize: 12, color: '#6B7280', minWidth: 18, fontWeight: '500' },
  barBackground: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#FBBF24', borderRadius: 3 },
  barCount: { fontSize: 11, color: '#9CA3AF', minWidth: 16, textAlign: 'right' },
  ratingInput: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 10 },
  starsContainerWithLabels: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  starWithLabel: { alignItems: 'center', gap: 4 },
  emojiLabel: { fontSize: 18 },
  starLabelText: { fontSize: 11, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  suggestionsSection: { marginBottom: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  suggestionsTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  suggestionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  suggestionTagSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  suggestionEmoji: { fontSize: 14 },
  suggestionTagText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  suggestionTagTextSelected: { color: '#3B82F6', fontWeight: '600' },
  formField: { marginBottom: 20 },
  textInput: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1F2937', marginBottom: 4,
  },
  textArea: { minHeight: 110, paddingTop: 12, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
  uploadPhotosButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16,
    paddingHorizontal: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#3B82F6',
    borderRadius: 8, backgroundColor: '#F0F9FF', gap: 8, marginBottom: 12,
  },
  uploadDisabled: { opacity: 0.6 },
  uploadPhotosText: { fontSize: 15, fontWeight: '600', color: '#3B82F6' },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoItem: { position: 'relative', width: 90, height: 90, borderRadius: 8, overflow: 'visible' },
  photoItemImage: { width: 90, height: 90, borderRadius: 8 },
  removePhotoButton: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12, zIndex: 1 },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#10B981', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, minHeight: 48,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  reviewCard: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  reviewInfo: { flex: 1 },
  reviewHeaderRight: { alignItems: 'flex-end', gap: 4 },
  reportButton: { padding: 4 },
  reviewerName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  reviewStarsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
  reviewDate: { fontSize: 12, color: '#9CA3AF' },
  reviewTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 6 },
  reviewMessage: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 10 },
  reviewSuggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  reviewSuggestionChip: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  reviewSuggestionText: { fontSize: 12, color: '#3B82F6', fontWeight: '500' },
  reviewPhotosRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  reviewPhotoThumb: { width: (width - 80) / 3, height: (width - 80) / 3, borderRadius: 6 },
  ownerReplyBox: { backgroundColor: '#F0F9FF', borderLeftWidth: 3, borderLeftColor: '#3B82F6', padding: 12, borderRadius: 4, marginBottom: 10 },
  ownerReplyLabel: { fontSize: 12, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  ownerReplyText: { fontSize: 13, color: '#374151', lineHeight: 18 },
  helpfulRow: { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  helpfulButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  helpfulText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
});
