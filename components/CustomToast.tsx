import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface CustomToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const COLORS = {
  success: {
    background: '#10B981',
    text: '#FFFFFF',
    icon: 'checkmark-circle',
  },
  error: {
    background: '#EF4444',
    text: '#FFFFFF',
    icon: 'close-circle',
  },
  info: {
    background: '#6366F1',
    text: '#FFFFFF',
    icon: 'information-circle',
  },
  warning: {
    background: '#F59E0B',
    text: '#FFFFFF',
    icon: 'warning',
  },
};

export default function CustomToast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: CustomToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  if (!visible) return null;

  const colors = COLORS[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <Ionicons name={colors.icon as any} size={24} color={colors.text} />
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
});
