import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Helper to convert image paths to full URLs
const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return '';
  // If it's already a full URL or Base64, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  // If it's a relative path, construct full URL
  const apiBase = process.env.EXPO_PUBLIC_API_BASE || 'https://api.instantllycards.com';
  const cleanBase = apiBase.replace(/\/$/, '');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${cleanBase}${cleanPath}`;
};

interface BusinessCardTemplateProps {
  name: string;
  designation: string;
  companyName: string;
  personalPhone?: string;
  companyPhone?: string;
  email?: string;
  companyEmail?: string;
  website?: string;
  companyWebsite?: string;
  address?: string;
  companyAddress?: string;
  companyPhoto?: string;
  onImageLoad?: () => void;
}

export default function BusinessCardTemplate({ 
  name,
  designation,
  companyName,
  personalPhone,
  companyPhone,
  email,
  companyEmail,
  website,
  companyWebsite,
  address,
  companyAddress,
  companyPhoto,
  onImageLoad
}: BusinessCardTemplateProps) {
  // Use the best available data for each field
  const displayName = name || 'Your Name';
  
  // Company Name | Designation format
  const companyParts = [];
  if (companyName) companyParts.push(companyName);
  if (designation) companyParts.push(designation);
  const displayCompany = companyParts.length > 0 ? companyParts.join(' | ') : 'Company';
  
  const displayPhone = companyPhone || personalPhone || '';
  
  // Email logic: Show company email if present, else personal email
  const displayEmail = companyEmail || email || '';
  
  // Website: Only show if exists, remove https://
  const websiteValue = companyWebsite || website || '';
  const displayWebsite = websiteValue ? websiteValue.replace(/^https?:\/\//, '') : '';
  
  const displayAddress = companyAddress || address || '';

  // Get full image URL
  const imageUrl = getImageUrl(companyPhoto);
  
  // Debug logging
  console.log('📸 Card Template - companyPhoto:', companyPhoto);
  console.log('📸 Card Template - imageUrl:', imageUrl);

  return (
    <View style={styles.container}>
      {/* Left Section - Blue Background with Profile Photo */}
      <View style={styles.leftSection}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.profilePhoto}
            resizeMode="cover"
            onError={(e) => console.log('❌ Card Template image load error:', e.nativeEvent.error, 'URL:', imageUrl)}
            onLoad={() => {
              console.log('✅ Card Template image loaded successfully:', imageUrl);
              onImageLoad?.();
            }}
          />
        ) : (
          <View style={styles.profilePhotoPlaceholder}>
            <Ionicons name="person" size={80} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Right Section - Light Background with Contact Info */}
      <View style={styles.rightSection}>
        {/* Name and Company */}
        <View style={styles.headerSection}>
          <Text 
            style={styles.name} 
            numberOfLines={1} 
            adjustsFontSizeToFit
          >
            {displayName.toUpperCase()}
          </Text>
          <Text style={styles.company}>{displayCompany.toUpperCase()}</Text>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          {/* Phone */}
          {displayPhone ? (
            <View style={styles.contactRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.contactText}>{displayPhone}</Text>
            </View>
          ) : null}

          {/* Email */}
          {displayEmail ? (
            <View style={styles.contactRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.contactText}>{displayEmail}</Text>
            </View>
          ) : null}

          {/* Website - Only show if exists */}
          {displayWebsite ? (
            <View style={styles.contactRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.contactText}>{displayWebsite}</Text>
            </View>
          ) : null}

          {/* Address */}
          {displayAddress ? (
            <View style={styles.contactRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.contactText}>{displayAddress}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Watermark with Logo */}
      <View style={styles.watermark}>
        <Image 
          source={require('../assets/images/Instantlly_Logo-removebg.png')}
          style={styles.watermarkLogo}
          resizeMode="contain"
        />
        <Text style={styles.watermarkText}>
          <Text style={styles.watermarkOrange}>Instant</Text>
          <Text style={styles.watermarkBlue}>lly</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 1050,
    height: 600,
    flexDirection: 'row',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  leftSection: {
    width: '40%',
    backgroundColor: '#4A6B82',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  profilePhoto: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  profilePhotoPlaceholder: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    backgroundColor: '#5A7B92',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rightSection: {
    width: '60%',
    backgroundColor: '#E8EAED',
    padding: 50,
    paddingLeft: 60,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 40,
  },
  name: {
    fontSize: 56,
    fontWeight: '800',
    color: '#4A6B82',
    marginBottom: 8,
    letterSpacing: 1,
  },
  company: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7A8A99',
    letterSpacing: 2,
  },
  contactSection: {
    gap: 22,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A6B82',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 20,
    color: '#4A6B82',
    fontWeight: '500',
    flex: 1,
  },
  watermark: {
    position: 'absolute',
    bottom: 12,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  watermarkLogo: {
    width: 24,
    height: 24,
  },
  watermarkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  watermarkOrange: {
    color: '#FF8C00',
  },
  watermarkBlue: {
    color: '#4A6B82',
  },
});
