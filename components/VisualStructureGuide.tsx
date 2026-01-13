import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

/**
 * VISUAL STRUCTURE GUIDE
 * 
 * This file demonstrates the visual hierarchy of the subcategory system
 */

export default function VisualGuide() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.mainTitle}>📱 SubCategory System - Visual Structure</Text>

      {/* Screen 1 */}
      <View style={styles.screenBox}>
        <Text style={styles.screenTitle}>1️⃣ Home Screen (Existing)</Text>
        <View style={styles.componentBox}>
          <Text style={styles.componentName}>CategoryGrid Component</Text>
          <View style={styles.gridDemo}>
            {['Auto', 'Business', 'Construction', 'Education', 'Health', 'More'].map((cat, i) => (
              <View key={i} style={styles.categoryIcon}>
                <Ionicons name="apps" size={20} color="#6B7280" />
                <Text style={styles.iconLabel}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Screen 2 */}
      <View style={styles.screenBox}>
        <Text style={styles.screenTitle}>2️⃣ SubCategory Modal (NEW ✨)</Text>
        <View style={styles.modalDemo}>
          <View style={styles.modalHeader}>
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
            <Text style={styles.modalTitle}>Automotive Categories</Text>
            <View style={{ width: 20 }} />
          </View>
          
          <View style={styles.searchBarDemo}>
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <Text style={styles.searchText}>Search subcategories...</Text>
          </View>

          <View style={styles.subcategoryGrid}>
            {['Automobile Dealers', 'Car Insurance', 'Car Repairs', 'Taxi Services'].map((sub, i) => (
              <View key={i} style={styles.subcategoryCard}>
                <MaterialIcons name="business" size={24} color="#3B82F6" />
                <Text style={styles.subcategoryName}>{sub}</Text>
                <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.note}>✨ Full screen, grid layout, searchable</Text>
      </View>

      {/* Screen 3 */}
      <View style={styles.screenBox}>
        <Text style={styles.screenTitle}>3️⃣ Business Cards Page (NEW ✨)</Text>
        <View style={styles.modalDemo}>
          <View style={styles.modalHeader}>
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.modalTitle}>Car Repairs</Text>
              <Text style={styles.modalSubtitle}>Automotive Categories</Text>
            </View>
            <Ionicons name="options" size={20} color="#1F2937" />
          </View>
          
          <View style={styles.searchBarDemo}>
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <Text style={styles.searchText}>Search businesses...</Text>
          </View>

          <View style={styles.resultsBar}>
            <Text style={styles.resultsText}>24 businesses found</Text>
            <View style={styles.viewToggle}>
              <Ionicons name="list" size={16} color="#3B82F6" />
              <Ionicons name="grid" size={16} color="#9CA3AF" />
            </View>
          </View>

          <View style={styles.businessCard}>
            <View style={styles.businessHeader}>
              <View style={styles.avatar}>
                <MaterialIcons name="business" size={24} color="#3B82F6" />
              </View>
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>ABC Auto Repairs</Text>
                <Text style={styles.businessCategory}>Car Repairs</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#FBBF24" />
                  <Text style={styles.ratingText}>4.5</Text>
                </View>
              </View>
            </View>
            <Text style={styles.businessDesc}>Professional services...</Text>
            <View style={styles.businessFooter}>
              <Text style={styles.contactInfo}>📞 +91 9876543210</Text>
              <View style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View</Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.note}>✨ List of businesses, searchable, clickable</Text>
      </View>

      {/* Screen 4 */}
      <View style={styles.screenBox}>
        <Text style={styles.screenTitle}>4️⃣ Business Detail Page (NEW ✨)</Text>
        <View style={styles.modalDemo}>
          <View style={styles.modalHeader}>
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
            <Text style={styles.modalTitle}>Business Details</Text>
            <Ionicons name="share-social" size={20} color="#1F2937" />
          </View>
          
          <View style={styles.detailContent}>
            <View style={styles.largeAvatar}>
              <MaterialIcons name="business" size={40} color="#3B82F6" />
            </View>
            <Text style={styles.detailBusinessName}>ABC Auto Repairs</Text>
            <Text style={styles.detailCategory}>Car Repairs • Automotive</Text>
            
            <View style={styles.actionButtons}>
              {['Call', 'Email', 'Direction', 'Website'].map((action, i) => (
                <View key={i} style={styles.actionBtn}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="call" size={20} color="#16A34A" />
                  </View>
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.infoRow}>
                <Ionicons name="call" size={16} color="#3B82F6" />
                <Text style={styles.infoText}>+91 9876543210</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={16} color="#3B82F6" />
                <Text style={styles.infoText}>business@example.com</Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.note}>✨ Full business details, actions, contact info</Text>
      </View>

      {/* Key Features */}
      <View style={styles.featuresBox}>
        <Text style={styles.featuresTitle}>🎯 Key Features Implemented</Text>
        
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>Full-screen subcategory modal</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>Functional search bars on all screens</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>Grid layout for subcategories</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>Business cards listing page</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>Detailed business view with actions</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>Call, Email, Navigate, Share actions</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>Modern UI with cards and shadows</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>Empty states and loading indicators</Text>
        </View>
      </View>

      {/* Navigation Flow */}
      <View style={styles.flowBox}>
        <Text style={styles.flowTitle}>🔄 Navigation Flow</Text>
        <View style={styles.flowItem}>
          <Text style={styles.flowText}>Home (CategoryGrid)</Text>
          <Ionicons name="arrow-down" size={20} color="#3B82F6" />
        </View>
        <View style={styles.flowItem}>
          <Text style={styles.flowText}>SubCategory Modal (Full Screen)</Text>
          <Ionicons name="arrow-down" size={20} color="#3B82F6" />
        </View>
        <View style={styles.flowItem}>
          <Text style={styles.flowText}>Business Cards Page</Text>
          <Ionicons name="arrow-down" size={20} color="#3B82F6" />
        </View>
        <View style={styles.flowItem}>
          <Text style={styles.flowText}>Business Detail Page</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  screenBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  componentBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  componentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  gridDemo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryIcon: {
    alignItems: 'center',
    width: 60,
  },
  iconLabel: {
    fontSize: 11,
    color: '#374151',
    marginTop: 4,
  },
  modalDemo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  searchBarDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  subcategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subcategoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subcategoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginVertical: 8,
    textAlign: 'center',
  },
  note: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 8,
    fontStyle: 'italic',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  businessHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessInfo: {
    flex: 1,
    marginLeft: 12,
  },
  businessName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  businessCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  businessDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  businessFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    fontSize: 11,
    color: '#6B7280',
  },
  viewBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  detailContent: {
    alignItems: 'center',
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  detailBusinessName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 11,
    color: '#1F2937',
  },
  infoSection: {
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  featuresBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 8,
  },
  flowBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  flowTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  flowItem: {
    alignItems: 'center',
    marginVertical: 8,
  },
  flowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
});
