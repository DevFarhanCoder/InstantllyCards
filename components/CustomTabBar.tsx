import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  
  // Calculate exact tab bar height to match real tabs
  const TAB_BAR_HEIGHT = 56 + Math.max(8, insets.bottom);

  const tabs = [
    { name: 'Home', route: '/(tabs)/home', icon: 'home', focusedColor: '#D84315' },
    { name: 'My Cards', route: '/(tabs)/mycards', icon: 'albums', focusedColor: '#4F6AF3' },
    { name: 'Messaging', route: '/(tabs)/chats', icon: 'chatbubbles', focusedColor: '#047857' },
    { name: 'Vouchers', route: '/(tabs)/vouchers', icon: 'gift', focusedColor: '#cc7a00' },
    { 
      name: 'Ads', 
      route: '/(tabs)/ads', 
      icon: 'megaphone', 
      focusedColor: '#4F6AF3',
      isImage: true,
      focusedImage: require('../assets/images/google-ads-icon.png'),
      unfocusedImage: require('../assets/images/Google Ads.png')
    },
  ];

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  const isTabActive = (route: string) => {
    return pathname.startsWith(route);
  };

  return (
    <View style={[styles.container, { 
      height: TAB_BAR_HEIGHT,
      paddingBottom: Math.max(8, insets.bottom)
    }]}>
      {tabs.map((tab) => {
        const isActive = isTabActive(tab.route);
        const color = isActive ? tab.focusedColor : '#9CA3AF';
        
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            onPress={() => handleTabPress(tab.route)}
            activeOpacity={0.7}
          >
            {tab.isImage ? (
              <Image 
                source={isActive ? tab.focusedImage : tab.unfocusedImage}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name={tab.icon as any} size={24} color={color} />
            )}
            <Text style={[styles.label, { color }]}>{tab.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    paddingTop: 6,
    zIndex: 200, // Higher than FooterCarousel (z-index: 10)
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});
