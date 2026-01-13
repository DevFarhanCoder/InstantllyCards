import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Icon mapping for subcategories
const getIconForSubcategory = (subcategory: string) => {
  const name = subcategory.toLowerCase();
  
  // Automotive
  if (name.includes('car') || name.includes('automobile')) return { type: 'FontAwesome5', name: 'car', size: 22 };
  if (name.includes('taxi') || name.includes('cab')) return { type: 'Ionicons', name: 'car-sport', size: 24 };
  if (name.includes('towing')) return { type: 'FontAwesome5', name: 'truck-pickup', size: 20 };
  if (name.includes('transport')) return { type: 'FontAwesome5', name: 'truck', size: 22 };
  if (name.includes('tempo')) return { type: 'Ionicons', name: 'bus', size: 24 };
  
  // Business
  if (name.includes('chartered') || name.includes('accountant')) return { type: 'MaterialIcons', name: 'account-balance', size: 24 };
  if (name.includes('lawyer') || name.includes('legal')) return { type: 'Ionicons', name: 'briefcase', size: 24 };
  if (name.includes('event') || name.includes('wedding') || name.includes('party')) return { type: 'MaterialIcons', name: 'celebration', size: 24 };
  if (name.includes('interior')) return { type: 'MaterialIcons', name: 'chair', size: 24 };
  if (name.includes('packer') || name.includes('mover')) return { type: 'FontAwesome5', name: 'box', size: 22 };
  if (name.includes('website') || name.includes('digital') || name.includes('sms')) return { type: 'Ionicons', name: 'globe', size: 24 };
  if (name.includes('consultant') || name.includes('gst') || name.includes('tax')) return { type: 'MaterialIcons', name: 'business-center', size: 24 };
  
  // Construction
  if (name.includes('borewell')) return { type: 'MaterialIcons', name: 'water-drop', size: 24 };
  if (name.includes('builder') || name.includes('contractor')) return { type: 'FontAwesome5', name: 'hard-hat', size: 22 };
  if (name.includes('carpenter')) return { type: 'FontAwesome5', name: 'hammer', size: 22 };
  if (name.includes('electric')) return { type: 'Ionicons', name: 'flash', size: 24 };
  if (name.includes('paint')) return { type: 'FontAwesome5', name: 'paint-roller', size: 22 };
  if (name.includes('plumber')) return { type: 'FontAwesome5', name: 'wrench', size: 22 };
  if (name.includes('kitchen')) return { type: 'MaterialIcons', name: 'kitchen', size: 24 };
  if (name.includes('housekeeping') || name.includes('home service')) return { type: 'MaterialIcons', name: 'home-repair-service', size: 24 };
  if (name.includes('waterproof')) return { type: 'Ionicons', name: 'water', size: 24 };
  if (name.includes('concrete')) return { type: 'FontAwesome5', name: 'cube', size: 22 };
  
  // Education
  if (name.includes('school')) return { type: 'Ionicons', name: 'school', size: 24 };
  if (name.includes('play') || name.includes('kinder')) return { type: 'MaterialIcons', name: 'child-care', size: 24 };
  if (name.includes('tutor') || name.includes('tutorial') || name.includes('coaching')) return { type: 'FontAwesome5', name: 'chalkboard-teacher', size: 20 };
  if (name.includes('training')) return { type: 'MaterialIcons', name: 'model-training', size: 24 };
  if (name.includes('language')) return { type: 'Ionicons', name: 'language', size: 24 };
  if (name.includes('motor') || name.includes('driving')) return { type: 'FontAwesome5', name: 'car-side', size: 22 };
  if (name.includes('overseas') || name.includes('abroad')) return { type: 'FontAwesome5', name: 'plane', size: 22 };
  if (name.includes('yoga') || name.includes('wellness')) return { type: 'MaterialIcons', name: 'self-improvement', size: 24 };
  
  // Health
  if (name.includes('physician') || name.includes('doctor') || name.includes('surgeon')) return { type: 'FontAwesome5', name: 'user-md', size: 22 };
  if (name.includes('cardio')) return { type: 'FontAwesome5', name: 'heartbeat', size: 22 };
  if (name.includes('child') || name.includes('paed')) return { type: 'MaterialIcons', name: 'child-friendly', size: 24 };
  if (name.includes('dentist')) return { type: 'MaterialIcons', name: 'local-hospital', size: 24 };
  if (name.includes('dermat') || name.includes('skin') || name.includes('hair')) return { type: 'Ionicons', name: 'person', size: 24 };
  if (name.includes('ent') || name.includes('ear')) return { type: 'MaterialIcons', name: 'hearing', size: 24 };
  if (name.includes('eye') || name.includes('ophthal')) return { type: 'Ionicons', name: 'eye', size: 24 };
  if (name.includes('gastro')) return { type: 'MaterialIcons', name: 'medical-services', size: 24 };
  if (name.includes('gynae') || name.includes('obstet')) return { type: 'MaterialIcons', name: 'pregnant-woman', size: 24 };
  if (name.includes('neuro')) return { type: 'MaterialIcons', name: 'psychology', size: 24 };
  if (name.includes('ortho') || name.includes('bone')) return { type: 'FontAwesome5', name: 'bone', size: 22 };
  if (name.includes('ayurvedic')) return { type: 'FontAwesome5', name: 'leaf', size: 22 };
  if (name.includes('homeo')) return { type: 'FontAwesome5', name: 'capsules', size: 22 };
  if (name.includes('pathology') || name.includes('lab')) return { type: 'FontAwesome5', name: 'flask', size: 22 };
  if (name.includes('physio')) return { type: 'MaterialIcons', name: 'accessible', size: 24 };
  if (name.includes('vaccin')) return { type: 'FontAwesome5', name: 'syringe', size: 22 };
  if (name.includes('hearing aid')) return { type: 'MaterialIcons', name: 'hearing', size: 24 };
  
  // Lifestyle
  if (name.includes('astro')) return { type: 'Ionicons', name: 'star', size: 24 };
  if (name.includes('beauty') || name.includes('salon')) return { type: 'MaterialIcons', name: 'face', size: 24 };
  if (name.includes('makeup') || name.includes('bridal')) return { type: 'MaterialIcons', name: 'face-retouching-natural', size: 24 };
  if (name.includes('dance')) return { type: 'Ionicons', name: 'musical-notes', size: 24 };
  if (name.includes('music')) return { type: 'Ionicons', name: 'musical-note', size: 24 };
  if (name.includes('fitness') || name.includes('gym')) return { type: 'FontAwesome5', name: 'dumbbell', size: 22 };
  if (name.includes('photo') || name.includes('video')) return { type: 'Ionicons', name: 'camera', size: 24 };
  if (name.includes('tattoo')) return { type: 'MaterialIcons', name: 'colorize', size: 24 };
  if (name.includes('weight loss')) return { type: 'MaterialIcons', name: 'monitor-weight', size: 24 };
  if (name.includes('movie')) return { type: 'Ionicons', name: 'film', size: 24 };
  if (name.includes('night') || name.includes('parties')) return { type: 'MaterialIcons', name: 'nightlife', size: 24 };
  
  // Rentals
  if (name.includes('bus')) return { type: 'Ionicons', name: 'bus', size: 24 };
  if (name.includes('car') || name.includes('cab')) return { type: 'FontAwesome5', name: 'car', size: 22 };
  if (name.includes('generator')) return { type: 'MaterialIcons', name: 'power', size: 24 };
  if (name.includes('equipment')) return { type: 'FontAwesome5', name: 'toolbox', size: 22 };
  if (name.includes('tempo')) return { type: 'FontAwesome5', name: 'truck', size: 22 };
  
  // Shopping
  if (name.includes('cake') || name.includes('baker')) return { type: 'Ionicons', name: 'pizza', size: 24 };
  if (name.includes('daily') || name.includes('grocer')) return { type: 'FontAwesome5', name: 'shopping-basket', size: 22 };
  if (name.includes('florist') || name.includes('flower')) return { type: 'Ionicons', name: 'flower', size: 24 };
  if (name.includes('restaurant') || name.includes('food')) return { type: 'Ionicons', name: 'restaurant', size: 24 };
  if (name.includes('exchange') || name.includes('forex')) return { type: 'FontAwesome5', name: 'exchange-alt', size: 22 };
  if (name.includes('furniture')) return { type: 'MaterialIcons', name: 'chair', size: 24 };
  if (name.includes('wallpaper') || name.includes('decor')) return { type: 'MaterialIcons', name: 'wallpaper', size: 24 };
  if (name.includes('water')) return { type: 'Ionicons', name: 'water', size: 24 };
  if (name.includes('medical store') || name.includes('pharmac')) return { type: 'FontAwesome5', name: 'pills', size: 22 };
  if (name.includes('optical') || name.includes('glasses')) return { type: 'FontAwesome5', name: 'glasses', size: 22 };
  if (name.includes('pet')) return { type: 'FontAwesome5', name: 'paw', size: 22 };
  if (name.includes('online shopping')) return { type: 'Ionicons', name: 'cart', size: 24 };
  if (name.includes('t-shirt') || name.includes('printing')) return { type: 'Ionicons', name: 'shirt', size: 24 };
  
  // Technology
  if (name.includes('cctv') || name.includes('security')) return { type: 'MaterialIcons', name: 'security', size: 24 };
  if (name.includes('computer')) return { type: 'FontAwesome5', name: 'desktop', size: 22 };
  if (name.includes('laptop')) return { type: 'FontAwesome5', name: 'laptop', size: 22 };
  if (name.includes('mobile') || name.includes('internet')) return { type: 'Ionicons', name: 'phone-portrait', size: 24 };
  if (name.includes('refrigerator') || name.includes('appliance')) return { type: 'MaterialIcons', name: 'kitchen', size: 24 };
  if (name.includes('training') || name.includes('institute')) return { type: 'FontAwesome5', name: 'laptop-code', size: 20 };
  if (name.includes('website') || name.includes('app')) return { type: 'Ionicons', name: 'code-slash', size: 24 };
  
  // Travel
  if (name.includes('hotel')) return { type: 'FontAwesome5', name: 'hotel', size: 22 };
  if (name.includes('resort')) return { type: 'FontAwesome5', name: 'umbrella-beach', size: 22 };
  if (name.includes('hostel') || name.includes('pg')) return { type: 'FontAwesome5', name: 'bed', size: 22 };
  if (name.includes('travel agent') || name.includes('tour')) return { type: 'FontAwesome5', name: 'suitcase', size: 22 };
  if (name.includes('visa')) return { type: 'FontAwesome5', name: 'passport', size: 22 };
  if (name.includes('air') || name.includes('flight')) return { type: 'FontAwesome5', name: 'plane', size: 22 };
  if (name.includes('train')) return { type: 'FontAwesome5', name: 'train', size: 22 };
  
  // Default icon
  return { type: 'MaterialIcons', name: 'business', size: 24 };
};

const renderIcon = (subcategory: string) => {
  const icon = getIconForSubcategory(subcategory);
  const iconColor = '#3B82F6'; // Blue color for icons
  
  if (icon.type === 'FontAwesome5') {
    return <FontAwesome5 name={icon.name as any} size={icon.size} color={iconColor} />;
  } else if (icon.type === 'Ionicons') {
    return <Ionicons name={icon.name as any} size={icon.size} color={iconColor} />;
  } else {
    return <MaterialIcons name={icon.name as any} size={icon.size} color={iconColor} />;
  }
};

export default function SubCategoryModal({ visible, onClose, title, subcategories }) {
  const [search, setSearch] = useState('');
  
  const filtered = subcategories.filter(sub =>
    sub.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubcategoryPress = (subcategory: string) => {
    // Navigate to business cards page for this subcategory
    router.push({
      pathname: '/business-cards',
      params: { subcategory, category: title }
    });
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={false}
      statusBarTranslucent={false}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2}>{title}</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search subcategories..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearch('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results Count */}
        {search.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'} found
            </Text>
          </View>
        )}

        {/* Subcategories List */}
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No subcategories found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.subcategoryItem}
              onPress={() => handleSubcategoryPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <View style={styles.iconContainer}>
                  {renderIcon(item)}
                </View>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.subcategoryText} numberOfLines={2}>
                  {item}
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={22} color="#6B7280" />
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'android' ? 50 : 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1F2937',
    lineHeight: 26,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
    paddingVertical: 2,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconWrapper: {
    marginRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  subcategoryText: { 
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
  },
  arrowContainer: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
