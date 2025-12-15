import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface BusinessAvatarProps {
  companyPhoto?: string;
  companyName?: string;
  size?: number;
  style?: any;
  textColor?: string;
  backgroundColor?: string;
}

// Helper to convert image paths to full URLs
const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return '';
  // If it's already a full URL or Base64, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  // If it's a relative path, construct full URL
  const apiBase = process.env.EXPO_PUBLIC_API_BASE || 'http://192.168.0.104:8080';
  const cleanBase = apiBase.replace(/\/$/, '');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${cleanBase}${cleanPath}`;
};

export default function BusinessAvatar({ 
  companyPhoto, 
  companyName, 
  size = 80, 
  style,
  textColor = '#FFFFFF',
  backgroundColor = '#3B82F6'
}: BusinessAvatarProps) {
  
  // Get first letter of company name for fallback
  const getInitial = () => {
    if (!companyName || companyName.trim() === '') return '?';
    return companyName.trim()[0].toUpperCase();
  };

  const avatarStyle = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: !companyPhoto ? backgroundColor : 'transparent',
    },
    style,
  ];

  if (companyPhoto) {
    const imageUrl = getImageUrl(companyPhoto);
    return (
      <Image
        source={{ uri: imageUrl }}
        style={avatarStyle}
        resizeMode="cover"
        onError={(e) => console.log('❌ BusinessAvatar image load error:', e.nativeEvent.error, 'URL:', imageUrl)}
      />
    );
  }

  return (
    <View style={avatarStyle}>
      <Text style={[
        styles.initialText,
        {
          fontSize: size * 0.4,
          color: textColor,
        }
      ]}>
        {getInitial()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initialText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});