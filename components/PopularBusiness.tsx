import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  TouchableOpacity,
  Animated,
  ViewToken,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTAINER_H_MARGIN = 12;
const CAROUSEL_H_PADDING = 12;
const CARD_GAP = 12;
const CARD_WIDTH = SCREEN_WIDTH - (CONTAINER_H_MARGIN * 2) - (CAROUSEL_H_PADDING * 2);
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const AUTO_SCROLL_INTERVAL = 3000; // 3 seconds

interface BusinessItem {
  id: string;
  name: string;
  description: string;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  color: string;
  icon: string;
}

const POPULAR_BUSINESSES: BusinessItem[] = [
  {
    id: "1",
    name: "Cleaning Services",
    description: "Professional cleaning for homes and offices with eco-friendly products",
    rating: 4.8,
    reviews: 124,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop",
    category: "Home Services",
    color: "#1E40AF",
    icon: "sparkles",
  },
  {
    id: "2",
    name: "Auto Repair Shop",
    description: "Expert car maintenance and repair services at affordable prices",
    rating: 4.6,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
    category: "Automotive",
    color: "#DC2626",
    icon: "car-sport",
  },
  {
    id: "3",
    name: "Beauty & Salon",
    description: "Premium beauty treatments and styling by experienced professionals",
    rating: 4.9,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop",
    category: "Lifestyle",
    color: "#DB2777",
    icon: "cut",
  },
  {
    id: "4",
    name: "Fitness Center",
    description: "State-of-the-art gym with personal trainers and group classes",
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
    category: "Health",
    color: "#059669",
    icon: "fitness",
  },
  {
    id: "5",
    name: "Restaurant & Cafe",
    description: "Delicious multi-cuisine food with cozy ambiance and quick service",
    rating: 4.5,
    reviews: 312,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
    category: "Food",
    color: "#EA580C",
    icon: "restaurant",
  },
];

const PopularBusiness = () => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % POPULAR_BUSINESSES.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoScroll]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleScrollBeginDrag = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleScrollEndDrag = () => {
    startAutoScroll();
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {POPULAR_BUSINESSES.map((_, index) => {
        const inputRange = [
          (index - 1) * SNAP_INTERVAL,
          index * SNAP_INTERVAL,
          (index + 1) * SNAP_INTERVAL,
        ];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: "clamp",
        });
        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: "clamp",
        });
        const dotColor = scrollX.interpolate({
          inputRange,
          outputRange: ["#D1D5DB", "#3B82F6", "#D1D5DB"],
          extrapolate: "clamp",
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity: dotOpacity,
                backgroundColor: dotColor,
              },
            ]}
          />
        );
      })}
    </View>
  );

  const renderItem = ({ item }: { item: BusinessItem }) => (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      {/* Banner Image */}
      <View style={[styles.bannerContainer, { backgroundColor: item.color }]}>
        <Image
          source={{ uri: item.image }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        {/* Overlay gradient */}
        <View style={styles.bannerOverlay} />
        {/* Category badge */}
        <View style={styles.categoryBadge}>
          <Ionicons name={item.icon as any} size={14} color="#fff" />
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
        {/* Heart icon */}
        <TouchableOpacity style={styles.heartButton}>
          <Ionicons name="heart-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Business Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoLeft}>
          <View style={[styles.businessAvatar, { backgroundColor: item.color + "20" }]}>
            <Ionicons name={item.icon as any} size={24} color={item.color} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.businessName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.businessDesc} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{item.rating}</Text>
              <Text style={styles.reviewsText}>| {item.reviews} Reviews</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Popular Business</Text>
          <Text style={styles.headerSubtitle}>
            See our most popular providers and services
          </Text>
        </View>
        <View style={styles.headerIconContainer}>
          <MaterialIcons name="auto-awesome" size={28} color="#F59E0B" />
        </View>
      </View>

      {/* Carousel */}
      <Animated.FlatList
        ref={flatListRef}
        data={POPULAR_BUSINESSES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * index,
          index,
        })}
      />

      {/* Dots */}
      {renderDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    marginHorizontal: CONTAINER_H_MARGIN,
    paddingVertical: 16,
    overflow: "hidden",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: CAROUSEL_H_PADDING,
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  headerIconContainer: {
    marginLeft: 12,
    marginTop: 2,
  },
  carouselContent: {
    paddingHorizontal: CAROUSEL_H_PADDING,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginRight: CARD_GAP,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  bannerContainer: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  heartButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoLeft: {
    flexDirection: "row",
    flex: 1,
    alignItems: "flex-start",
  },
  businessAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 3,
  },
  businessDesc: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  reviewsText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

export default PopularBusiness;
