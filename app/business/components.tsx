/**
 * Shared Business Listing Components
 * Reusable UI components across all business management screens
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusinessPromotion, ListingStatus, ListingType } from './types';

const { width } = Dimensions.get('window');

// ============================================
// Badge Component
// ============================================
interface BadgeProps {
  type: 'type' | 'status';
  value: ListingType | ListingStatus;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  const getStyles = () => {
    if (type === 'type') {
      if (value === 'promoted') {
        return {
          backgroundColor: '#DBEAFE',
          textColor: '#0284C7',
        };
      }
      return {
        backgroundColor: '#DCFCE7',
        textColor: '#15803D',
      };
    }

    // status badges
    if (value === 'active') {
      return {
        backgroundColor: '#DCFCE7',
        textColor: '#15803D',
      };
    }
    if (value === 'expired') {
      return {
        backgroundColor: '#FEE2E2',
        textColor: '#DC2626',
      };
    }
    return {
      backgroundColor: '#F3F4F6',
      textColor: '#6B7280',
    };
  };

  const styles = getStyles();

  return (
    <View style={[componentStyles.badge, { backgroundColor: styles.backgroundColor }]}>
      <Text style={[componentStyles.badgeText, { color: styles.textColor }]}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Text>
    </View>
  );
};

// ============================================
// StatCard Component
// ============================================
interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  color = '#4F6AF3',
}) => (
  <View style={componentStyles.statCard}>
    <View style={[componentStyles.statIconContainer, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={componentStyles.statLabel}>{label}</Text>
    <Text style={componentStyles.statValue}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </Text>
  </View>
);

// ============================================
// InfoRow Component
// ============================================
interface InfoRowProps {
  label: string;
  value: string;
  icon?: string;
  showDivider?: boolean;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  icon,
  showDivider = true,
}) => (
  <>
    <View style={componentStyles.infoRow}>
      {icon && <Ionicons name={icon as any} size={18} color="#4F6AF3" />}
      <View style={componentStyles.infoContent}>
        <Text style={componentStyles.infoLabel}>{label}</Text>
        <Text style={componentStyles.infoValue}>{value}</Text>
      </View>
    </View>
    {showDivider && <View style={componentStyles.divider} />}
  </>
);

// ============================================
// ListingCard Component
// ============================================
interface ListingCardProps {
  listing: BusinessPromotion;
  onPress: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onPress }) => {
  const stats = listing.visibility || {
    impressions: 0,
    clicks: 0,
    leads: 0,
    priorityScore: 0,
  };

  return (
    <TouchableOpacity
      style={componentStyles.listingCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header Section */}
      <View style={componentStyles.listingCardHeader}>
        <View style={componentStyles.listingHeaderLeft}>
          <Text style={componentStyles.listingBusinessName}>{listing.businessName}</Text>
          <View style={componentStyles.listingBadgeRow}>
            <Badge type="type" value={listing.listingType} />
            <Badge type="status" value={listing.status} />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>

      {/* Location & Details */}
      <View style={componentStyles.listingDetails}>
        <View style={componentStyles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={componentStyles.detailText}>{listing.city}</Text>
        </View>
        {listing.expiryDate && listing.listingType === 'promoted' && (
          <View style={componentStyles.detailRow}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={componentStyles.detailText}>
              Expires: {new Date(listing.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Stats Footer */}
      <View style={componentStyles.listingStatsRow}>
        <View style={componentStyles.listingStat}>
          <Ionicons name="eye" size={14} color="#4F6AF3" />
          <Text style={componentStyles.listingStatText}>{stats.impressions}</Text>
        </View>
        <View style={componentStyles.listingStat}>
          <Ionicons name="hand-left" size={14} color="#4F6AF3" />
          <Text style={componentStyles.listingStatText}>{stats.clicks}</Text>
        </View>
        <View style={componentStyles.listingStat}>
          <Ionicons name="chatbubble" size={14} color="#4F6AF3" />
          <Text style={componentStyles.listingStatText}>{stats.leads}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// SectionCard Component
// ============================================
interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => (
  <View style={componentStyles.sectionCard}>
    <Text style={componentStyles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// ============================================
// Styles
// ============================================
const componentStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  listingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  listingHeaderLeft: {
    flex: 1,
  },
  listingBusinessName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  listingBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  listingDetails: {
    gap: 6,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  listingStatsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  listingStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listingStatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F6AF3',
  },
  sectionCard: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
});
