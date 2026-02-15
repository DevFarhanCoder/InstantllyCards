/**
 * Business Listing Types & Interfaces
 * Shared across all business management screens
 */

export type ListingType = 'free' | 'promoted';
export type ListingStatus = 'active' | 'inactive' | 'expired' | 'draft' | 'submitted';

export interface BusinessPromotion {
  _id: string;
  userId: string;
  businessName: string;
  ownerName?: string;
  description?: string;
  category?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  businessHours?: string;
  area?: string;
  pincode?: string;
  plotNo?: string;
  buildingName?: string;
  streetName?: string;
  landmark?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  panNumber?: string;
  currentStep?: string;
  listingType: 'free' | 'promoted';
  status: 'draft' | 'submitted' | 'active' | 'inactive' | 'expired';
  isActive: boolean;
  paymentStatus?: 'not_required' | 'pending' | 'paid';
  plan?: {
    name: string;
    price: number;
    durationDays: number;
    activatedAt: string;
  };
  paymentId?: string;
  media: Array<{
    _id?: string;
    url: string;
  }>;
  visibility?: {
    impressions: number;
    clicks: number;
    leads: number;
    priorityScore: number;
  };
  expiryDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListingAnalytics {
  impressions: number;
  clicks: number;
  leads: number;
  ctr: number;
  priorityScore: number;
  expiryDate: string | null;
  listingType: string;
  status: string;
}

export interface ListingResponse {
  success: boolean;
  promotion: BusinessPromotion;
  message?: string;
}

export interface ListingsListResponse {
  success: boolean;
  promotions: BusinessPromotion[];
}

export interface AnalyticsResponse {
  success: boolean;
  analytics: {
    impressions: number;
    clicks: number;
    leads: number;
    ctr: number;
    priorityScore: number;
    expiryDate: string | null;
    listingType: string;
    status: string;
  };
}

export interface ToggleStatusResponse {
  success: boolean;
  data: {
    _id: string;
    status: ListingStatus;
  };
}

export interface MediaUploadResponse {
  success: boolean;
  data: {
    _id: string;
    media: string[];
  };
}
