/**
 * Business Listing Constants and Utilities
 * Shared utilities across all business management screens
 */

import { ListingStatus, ListingType } from './types';

// ============================================
// Status & Type Constants
// ============================================
export const LISTING_TYPES: Record<ListingType, { label: string; color: string }> = {
  free: {
    label: 'Free',
    color: '#15803D',
  },
  promoted: {
    label: 'Promoted',
    color: '#0284C7',
  },
};

export const LISTING_STATUSES: Record<ListingStatus, { label: string; color: string }> = {
  active: {
    label: 'Active',
    color: '#15803D',
  },
  inactive: {
    label: 'Inactive',
    color: '#6B7280',
  },
  expired: {
    label: 'Expired',
    color: '#DC2626',
  },
  draft: {
    label: 'Draft',
    color: '#6B7280',
  },
  submitted: {
    label: 'Submitted',
    color: '#F59E0B',
  },
};

// ============================================
// Validation Functions
// ============================================
export const validateBusinessName = (name: string): boolean => {
  return name.trim().length >= 3;
};

export const validatePhoneNumber = (phone: string): boolean => {
  return /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateGST = (gst: string): boolean => {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
};

// ============================================
// Formatting Functions
// ============================================
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
};

// ============================================
// Analysis Functions
// ============================================
export const getVisibilityScore = (impressions: number, clicks: number): number => {
  if (impressions === 0) return 0;
  const ctr = (clicks / impressions) * 100;
  if (ctr > 10) return 90;
  if (ctr > 5) return 75;
  if (ctr > 2) return 60;
  if (ctr > 1) return 45;
  return 30;
};

export const getVisibilityLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
};

export const calculateCTR = (clicks: number, impressions: number): number => {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
};

// ============================================
// Status Check Functions
// ============================================
export const isExpired = (expiryDate?: string): boolean => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};

export const isActive = (status: ListingStatus): boolean => {
  return status === 'active';
};

export const canUpgrade = (type: ListingType): boolean => {
  return type === 'free';
};

export const canEdit = (status: ListingStatus, expiryDate?: string): boolean => {
  return status !== 'expired' && !isExpired(expiryDate);
};

// ============================================
// Dummy Data Generators (for development)
// ============================================
export const generateMockListing = (id: string) => {
  return {
    _id: id,
    userId: 'user-123',
    businessName: 'Tech Solutions Inc.',
    description: 'Leading provider of IT consulting and software development services.',
    category: 'Information Technology',
    locationArea: 'Downtown Business District',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip: '400001',
    contactPhone: '+919876543210',
    contactEmail: 'info@techsolutions.com',
    gst: '27AABCT1234H1Z5',
    type: 'promoted' as ListingType,
    status: 'active' as ListingStatus,
    media: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

export const generateMockAnalytics = () => {
  return {
    impressions: 1254,
    clicks: 314,
    leads: 28,
    ctr: 25.02,
    visibilityScore: 78,
    lastUpdated: new Date().toISOString(),
  };
};
