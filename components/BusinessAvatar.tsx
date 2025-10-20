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
    return (
      <Image
        source={{ uri: companyPhoto }}
        style={avatarStyle}
        resizeMode="cover"
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