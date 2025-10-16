import React, { useState, useRef, useEffect } from 'react';
import { View, Image, Dimensions, StyleSheet, ScrollView, Animated } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const FooterCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % 3;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * screenWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / screenWidth);
    setActiveIndex(currentIndex);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {/* Ad 1 - Footer Ads-02.jpg */}
        <View style={styles.slide}>
          <Image
            source={require('../assets/images/Footer Ads-02.jpg')}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Ad 2 - Footer Ads-01.jpg */}
        <View style={styles.slide}>
          <Image
            source={require('../assets/images/Footer Ads-01.jpg')}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Ad 3 - Footer Ads-03.jpg */}
        <View style={styles.slide}>
          <Image
            source={require('../assets/images/Footer Ads-03.jpg')}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default FooterCarousel;
