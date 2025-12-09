import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (design is based on iPhone 11/XR dimensions)
const BASE_WIDTH = 414;
const BASE_HEIGHT = 896;

/**
 * Converts a value from the base width to the current screen width
 */
export const wp = (widthPercent: number): number => {
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};

/**
 * Converts a value from the base height to the current screen height
 */
export const hp = (heightPercent: number): number => {
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};

/**
 * Scale font size based on screen width
 */
export const scaleFontSize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale size (for margins, paddings, etc) based on screen width
 */
export const scaleSize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
};

/**
 * Moderately scale size (less aggressive than scaleSize)
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size + (scale - 1) * size * factor);
};

export const dimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

/**
 * Check if device is small (width < 375)
 */
export const isSmallDevice = (): boolean => SCREEN_WIDTH < 375;

/**
 * Check if device is large (width > 414)
 */
export const isLargeDevice = (): boolean => SCREEN_WIDTH > 414;
