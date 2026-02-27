# Backend API Design: Review & Enquiry System with Location-Based Listings

## Overview
Build a comprehensive review and enquiry management system for Instantlly's business listing platform. This system allows customers to leave reviews with dynamic JustDial-style suggestions, send enquiries to businesses, and discover location-based business listings. Models are designed to support real-time notifications (Socket.io) in the future.

---

## 1. DATABASE MODELS

### A. Review Model (ReviewSchema)
```typescript
// Path: models/Review.ts
import { Schema, model, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessPromotion',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userName: { type: String },
    userPhone: { type: String }, // For anonymous display
    
    // Core Review Data
    rating: { 
      type: Number, 
      required: true,
      min: 1,
      max: 5,
      index: true
    },
    title: { 
      type: String, 
      maxlength: 50 
    },
    message: { 
      type: String, 
      maxlength: 500 
    },
    
    // Dynamic Suggestion-based Review
    selectedSuggestions: [String], // e.g., ["Poor service", "Rude staff"]
    experience: { 
      type: String, 
      maxlength: 500 
    },
    
    // Media
    photos: [
      {
        url: String,
        cloudinary_id: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    
    // Response from Business Owner
    ownerReply: {
      message: String,
      repliedAt: Date,
      repliedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    
    // Moderation
    isApproved: { 
      type: Boolean, 
      default: true,
      index: true
    },
    isSpam: { 
      type: Boolean, 
      default: false 
    },
    spamReports: [
      {
        reportedBy: Schema.Types.ObjectId,
        reason: String,
        reportedAt: Date
      }
    ],
    
    // Engagement
    helpful: { type: Number, default: 0 },
    unhelpful: { type: Number, default: 0 },
    
    createdAt: { 
      type: Date, 
      default: Date.now,
      index: true
    },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Prevent duplicate reviews from same user
ReviewSchema.index({ userId: 1, businessId: 1 }, { unique: true });
ReviewSchema.index({ businessId: 1, rating: 1 });
ReviewSchema.index({ businessId: 1, createdAt: -1 });
ReviewSchema.index({ createdAt: -1 });

export default models.Review || model("Review", ReviewSchema);
```

---

### B. Enquiry Model (EnquirySchema)
```typescript
// Path: models/Enquiry.ts
import { Schema, model, models } from "mongoose";

const EnquirySchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessPromotion',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userPhone: { 
      type: String,
      required: true,
      index: true
    },
    userName: String,
    userEmail: String,
    
    // Enquiry Details
    subject: { type: String, required: true },
    message: { type: String, required: true },
    
    // Status Tracking
    status: {
      type: String,
      enum: ['new', 'responded', 'closed'],
      default: 'new',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    
    // Response Tracking
    responses: [
      {
        message: String,
        respondedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        respondedAt: { type: Date, default: Date.now },
        type: {
          type: String,
          enum: ['owner', 'admin']
        }
      }
    ],
    lastResponseAt: Date,
    lastRespondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Assignment (for team management later)
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Lead Tracking
    convertedToLead: {
      type: Boolean,
      default: false
    },
    leadValue: Number,
    
    // For future notifications
    notificationSent: { type: Boolean, default: false },
    notificationSentAt: Date,
    
    createdAt: { 
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

EnquirySchema.index({ businessId: 1, status: 1 });
EnquirySchema.index({ businessId: 1, createdAt: -1 });
EnquirySchema.index({ userId: 1, businessId: 1 });
EnquirySchema.index({ userPhone: 1, businessId: 1 });

export default models.Enquiry || model("Enquiry", EnquirySchema);
```

---

### C. Review Suggestions Model (ReviewSuggestionsSchema)
```typescript
// Path: models/ReviewSuggestions.ts
import { Schema, model, models } from "mongoose";

const ReviewSuggestionsSchema = new Schema(
  {
    rating: { 
      type: Number, 
      required: true,
      min: 1,
      max: 5,
      unique: true,
      index: true
    },
    category: String, // optional - for category-specific suggestions
    
    suggestions: [
      {
        text: String,
        emoji: String,
        weight: Number // 0-1 for ML ranking
      }
    ],
    
    prompt: String, // "What went wrong?", "What did you like?", etc.
    emoji: String, // 😠, 😞, 😐, 😊, 🤩
    label: String, // Terrible, Bad, Average, Good, Excellent
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default models.ReviewSuggestions || model("ReviewSuggestions", ReviewSuggestionsSchema);
```

---

### D. User Location Model (UserLocationSchema) - NEW
```typescript
// Path: models/UserLocation.ts
import { Schema, model, models } from "mongoose";

const UserLocationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    
    // Current Location
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    
    // Address Components
    address: {
      plotNo: String,
      streetName: String,
      area: String,
      landmark: String,
      city: {
        type: String,
        required: true,
        index: true
      },
      state: String,
      pincode: String,
      formattedAddress: String
    },
    
    // Location Metadata
    accuracy: Number, // GPS accuracy in meters
    lastUpdated: { 
      type: Date,
      default: Date.now,
      index: true
    },
    
    // Preferences
    radius: { 
      type: Number, 
      default: 5000 // meters, default 5km
    }, // Used for searching nearby businesses
    
    // Location History (optional - for analytics)
    previousLocations: [
      {
        coordinates: [Number],
        city: String,
        updatedAt: Date
      }
    ],
    
    // Privacy
    isLocationEnabled: {
      type: Boolean,
      default: true
    },
    shareLocationWith: {
      type: String,
      enum: ['public', 'private'],
      default: 'private'
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Geospatial index for efficient location queries
UserLocationSchema.index({ 'currentLocation.coordinates': '2dsphere' });
UserLocationSchema.index({ city: 1 });

export default models.UserLocation || model("UserLocation", UserLocationSchema);
```

---

## 2. API ENDPOINTS

### A. REVIEW ENDPOINTS

#### 1. POST `/api/business-listings/:businessId/reviews` (Create Review)
**Auth:** Required (authenticated user)
**Purpose:** Submit a new review with photos and suggestions

**Request Body:**
```json
{
  "rating": 4,
  "title": "Great service",
  "message": "Optional detailed message",
  "selectedSuggestions": ["Good service", "Quality products"],
  "experience": "My detailed experience here...",
  "photos": [] // IDs from photo upload endpoint
}
```

**Response (201):**
```json
{
  "success": true,
  "review": {
    "_id": "...",
    "businessId": "...",
    "rating": 4,
    "createdAt": "2024-02-23T10:00:00Z",
    "userName": "User"
  }
}
```

**Validations:**
- Check if user already reviewed this business (prevent duplicates)
- Rating: 1-5 (required)
- Title: max 50 chars
- Message: max 500 chars
- Experience: max 500 chars
- Max 5 photos per review
- User must be verified/authenticated

**Actions:**
- Save review to DB
- Recalculate BusinessPromotion aggregated rating (cache Redis)
- Update review count on business listing
- Trigger notification (future Socket.io event)
- Log activity for business owner dashboard

**Error Codes:**
```json
{
  "DUPLICATE_REVIEW": "You have already reviewed this business",
  "INVALID_RATING": "Rating must be between 1 and 5",
  "BUSINESS_NOT_FOUND": "Business listing not found",
  "USER_NOT_VERIFIED": "Complete profile to post reviews"
}
```

---

#### 2. GET `/api/business-listings/:businessId/reviews` (Fetch Business Reviews)
**Purpose:** Get all reviews for a business with filtering

**Query Parameters:**
```
?rating=4             // Filter by rating (1-5)
&sort=latest          // latest, oldest, helpful, rating_high, rating_low
&page=1
&limit=10
&hasPhotos=true       // Show only reviews with photos
&hasOwnerReply=true   // Show only reviews with owner reply
```

**Response (200):**
```json
{
  "success": true,
  "reviews": [
    {
      "_id": "...",
      "rating": 4,
      "title": "Great service",
      "message": "...",
      "userName": "User Name",
      "photos": [
        { "url": "https://...", "uploadedAt": "..." }
      ],
      "createdAt": "2024-02-23T...",
      "helpful": 12,
      "unhelpful": 2,
      "ownerReply": {
        "message": "Thanks for the review!",
        "repliedAt": "2024-02-24T..."
      }
    }
  ],
  "stats": {
    "totalReviews": 150,
    "averageRating": 4.2,
    "ratingBreakdown": {
      "5": 80,
      "4": 50,
      "3": 15,
      "2": 3,
      "1": 2
    },
    "reviewsWithPhotos": 45,
    "reviewsWithOwnerReply": 120,
    "recentTrend": 4.3 // Last 30 days average
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

---

#### 3. POST `/api/reviews/:reviewId/reply` (Owner Reply to Review)
**Auth:** Business owner only
**Purpose:** Business owner responds to a review

**Request Body:**
```json
{
  "message": "Thank you for your feedback. We appreciate your review..."
}
```

**Response (200):**
```json
{
  "success": true,
  "ownerReply": {
    "message": "...",
    "repliedAt": "2024-02-24T...",
    "repliedBy": "businessOwnerId"
  }
}
```

**Actions:**
- Add reply to review
- Update lastReplyAt on business listing
- Mark review as "replied" for dashboard
- Trigger notification to review author (future event)
- Update business reputation score

---

#### 4. POST `/api/reviews/:reviewId/helpful` (Mark Review Helpful)
**Purpose:** User votes if review is helpful

**Request Body:**
```json
{
  "helpful": true  // true = helpful, false = unhelpful
}
```

**Response (200):**
```json
{
  "success": true,
  "helpful": 12,
  "unhelpful": 2
}
```

---

#### 5. POST `/api/reviews/:reviewId/report` (Report Spam)
**Purpose:** Report fake or inappropriate review

**Request Body:**
```json
{
  "reason": "fake_review"  // or "offensive", "irrelevant", "inappropriate"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review reported successfully. Our team will review it shortly."
}
```

---

### B. ENQUIRY ENDPOINTS

#### 1. POST `/api/business-listings/:businessId/enquiry` (Send Enquiry)
**Auth:** Required
**Purpose:** Customer sends enquiry to business

**Request Body:**
```json
{
  "subject": "Product pricing inquiry",
  "message": "What are your current rates for...",
  "phone": "+919876543210",
  "email": "user@example.com"  // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "enquiry": {
    "_id": "...",
    "businessId": "...",
    "status": "new",
    "subject": "Product pricing inquiry",
    "createdAt": "2024-02-23T...",
    "message": "Enquiry sent successfully to business"
  }
}
```

**Validations:**
- Subject: required, max 100 chars
- Message: required, max 1000 chars
- Phone: required, valid format
- Email: optional but validated if provided
- Rate limit: 10 enquiries per user per day

**Actions:**
- Save enquiry to DB
- Increment enquiry count on business
- Update lead count (visibility.leads++)
- Queue notification task (model supports Socket.io)
- Send confirmation SMS/Email to user
- Create dashboard notification for business owner

**Error Codes:**
```json
{
  "INVALID_PHONE": "Invalid phone number format",
  "RATE_LIMIT": "You have sent too many enquiries today",
  "BUSINESS_NOT_FOUND": "Business listing not found",
  "INVALID_EMAIL": "Invalid email format" (if provided)
}
```

---

#### 2. GET `/api/business-listings/:businessId/enquiries` (Fetch Enquiries)
**Auth:** Business owner only
**Purpose:** Owner views all enquiries for their business

**Query Parameters:**
```
?status=new           // new, responded, closed
&sort=latest
&page=1
&priority=high        // Filter by priority
```

**Response (200):**
```json
{
  "success": true,
  "enquiries": [
    {
      "_id": "...",
      "businessId": "...",
      "userName": "John Doe",
      "userPhone": "+919876543210",
      "userEmail": "john@example.com",
      "subject": "Product inquiry",
      "message": "I wanted to know about...",
      "status": "new",
      "priority": "high",
      "createdAt": "2024-02-23T...",
      "lastResponseAt": null,
      "responses": [],
      "notificationSent": true
    }
  ],
  "stats": {
    "new": 5,
    "responded": 12,
    "closed": 45,
    "total": 62,
    "avgResponseTime": "2.5 hours"
  }
}
```

---

#### 3. POST `/api/enquiries/:enquiryId/respond` (Respond to Enquiry)
**Auth:** Business owner only
**Purpose:** Owner replies to customer enquiry

**Request Body:**
```json
{
  "message": "Thank you for your enquiry. We can help you with..."
}
```

**Response (200):**
```json
{
  "success": true,
  "enquiry": {
    "_id": "...",
    "status": "responded",
    "lastResponseAt": "2024-02-24T...",
    "responses": [
      {
        "message": "...",
        "respondedBy": "businessOwnerId",
        "respondedAt": "2024-02-24T...",
        "type": "owner"
      }
    ]
  }
}
```

**Actions:**
- Add response to enquiry
- Update status to "responded"
- Record response time
- Send email to customer with owner's response
- Mark enquiry in dashboard as "responded"
- Track engagement metrics

---

#### 4. PATCH `/api/enquiries/:enquiryId/status` (Update Status)
**Auth:** Business owner only
**Purpose:** Update enquiry status (close/reopen)

**Request Body:**
```json
{
  "status": "closed",  // new, responded, closed
  "notes": "Customer purchased"  // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "status": "closed",
  "message": "Enquiry closed"
}
```

---

### C. REVIEW SUGGESTIONS ENDPOINTS

#### 1. GET `/api/reviews/suggestions/:rating` (Get Suggestions by Rating)
**Purpose:** Fetch dynamic suggestions for specific star rating (frontend uses this)

**Query Parameters:**
```
?category=restaurant  // optional - category-specific suggestions
```

**Response (200):**
```json
{
  "success": true,
  "rating": 4,
  "label": "Good",
  "emoji": "😊",
  "prompt": "What did you like and dislike?",
  "suggestions": [
    {
      "text": "Good service",
      "emoji": "👍",
      "weight": 0.9
    },
    {
      "text": "Quality products",
      "emoji": "⭐",
      "weight": 0.85
    },
    {
      "text": "Friendly staff",
      "emoji": "😊",
      "weight": 0.8
    },
    {
      "text": "Value for money",
      "emoji": "💰",
      "weight": 0.75
    },
    {
      "text": "Clean premises",
      "emoji": "✨",
      "weight": 0.7
    }
  ]
}
```

**Note:** Cache this endpoint (1-hour TTL) - low change frequency

---

#### 2. GET `/api/admin/reviews/suggestions` (Get All Suggestions - Admin)
**Auth:** Admin only
**Purpose:** Admin views all suggestion configurations

**Response (200):**
```json
{
  "success": true,
  "suggestions": {
    "1": {
      "rating": 1,
      "label": "Terrible",
      "emoji": "😠",
      "prompt": "What went wrong?",
      "suggestions": [...]
    },
    "2": { ... },
    "3": { ... },
    "4": { ... },
    "5": { ... }
  }
}
```

---

#### 3. PUT `/api/admin/reviews/suggestions/:rating` (Update Suggestions - Admin)
**Auth:** Admin only
**Purpose:** Admin updates suggestion words for specific rating

**Request Body:**
```json
{
  "suggestions": [
    {
      "text": "Poor service",
      "emoji": "👎",
      "weight": 0.95
    },
    {
      "text": "Rude staff",
      "emoji": "😠",
      "weight": 0.90
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Suggestions updated",
  "updatedAt": "2024-02-24T..."
}
```

**Action:** Invalidate suggestion cache after update

---

### D. USER LOCATION ENDPOINTS - NEW

#### 1. POST `/api/user/location` (Save/Update User Location)
**Auth:** Required
**Purpose:** Save user's current location and preferences

**Request Body:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "accuracy": 15,  // GPS accuracy in meters
  "address": {
    "plotNo": "123",
    "streetName": "Main Street",
    "area": "Safdarjung",
    "landmark": "Near Metro",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110016",
    "formattedAddress": "123 Main Street, Safdarjung, Delhi - 110016"
  },
  "radius": 5000  // optional: default 5km
}
```

**Response (200/201):**
```json
{
  "success": true,
  "location": {
    "_id": "...",
    "userId": "...",
    "currentLocation": {
      "coordinates": [77.2090, 28.6139]
    },
    "address": {
      "city": "Delhi",
      "area": "Safdarjung"
    },
    "radius": 5000,
    "lastUpdated": "2024-02-23T...",
    "isLocationEnabled": true
  }
}
```

**Validations:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Accuracy: positive number
- City: required
- Radius: 1000-50000 meters

**Actions:**
- Create or update user location
- Invalidate user's cached business listings
- Save to geospatial index (2dsphere)

---

#### 2. GET `/api/user/location` (Get User's Current Location)
**Auth:** Required
**Purpose:** Fetch user's saved location

**Response (200):**
```json
{
  "success": true,
  "location": {
    "_id": "...",
    "userId": "...",
    "currentLocation": {
      "coordinates": [77.2090, 28.6139],
      "type": "Point"
    },
    "address": {
      "city": "Delhi",
      "area": "Safdarjung",
      "formattedAddress": "123 Main Street, Safdarjung, Delhi - 110016"
    },
    "radius": 5000,
    "isLocationEnabled": true,
    "lastUpdated": "2024-02-23T..."
  }
}
```

---

#### 3. GET `/api/business-listings/nearby` (Location-Based Business Listings)
**Purpose:** Get businesses near user (using geospatial query)

**Query Parameters:**
```
?category=hospital           // Filter by category
&sort=distance              // distance, rating, relevance
&limit=20
&includeExpired=false       // Include expired promotions?
```

**If user authenticated:**
- Use user's saved location
- Use user's preferred radius

**If user not authenticated:**
- Require lat/lng in query
```
?latitude=28.6139&longitude=77.2090&radius=5000
```

**Response (200):**
```json
{
  "success": true,
  "userLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "city": "Delhi"
  },
  "listings": [
    {
      "_id": "...",
      "businessName": "Apollo Hospital",
      "category": ["hospital", "emergency"],
      "email": "info@apollo.com",
      "phone": "+919876543210",
      "whatsapp": "+919876543210",
      "address": {
        "city": "Delhi",
        "area": "Safdarjung",
        "formattedAddress": "Select Citywalk, Safdarjung, Delhi"
      },
      "media": [{ "url": "..." }],
      "distance": 1.2,  // in km
      "rating": 4.2,
      "totalReviews": 150,
      "listingType": "promoted",
      "status": "active",
      "businessHours": {
        "open": true,
        "openTime": "24 hours"
      },
      "visibility": {
        "clicks": 150,
        "leads": 25,
        "impressions": 1200
      }
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "page": 1,
    "pages": 8
  },
  "filters": {
    "availableCategories": ["hospital", "clinic", "pharmacy"],
    "distanceRange": { "min": 0.5, "max": 15 }
  }
}
```

**Backend Logic:**
```
1. Get user's location (from auth or query params)
2. Create geospatial $near query with coordinates + maxDistance
3. Match against BusinessPromotion where:
   - isActive = true
   - status = 'active'
   - category matches (if filter applied)
   - expiryDate > now (if not expired)
4. Calculate distance for each result
5. Add rating stats (from Review aggregation)
6. Sort by: promoted first, then by distance
7. Paginate results
8. Return with available category filters
```

---

#### 4. GET `/api/business-listings/category/:category/nearby` (Category-Specific Location Search)
**Purpose:** Get businesses in specific category near user

**Query Parameters:**
```
?sort=rating         // distance, rating, relevance, promoted
&limit=20
&radius=10000        // optional override
```

**Response:** Same as `/api/business-listings/nearby`

---

#### 5. PATCH `/api/user/location/preferences` (Update Location Settings)
**Auth:** Required
**Purpose:** Update location-related preferences

**Request Body:**
```json
{
  "radius": 8000,  // Change search radius
  "isLocationEnabled": false,  // Disable location
  "shareLocationWith": "public"  // public or private
}
```

**Response (200):**
```json
{
  "success": true,
  "preferences": {
    "radius": 8000,
    "isLocationEnabled": false,
    "shareLocationWith": "public"
  }
}
```

---

### E. DASHBOARD ANALYTICS ENDPOINTS

#### 1. GET `/api/business-listings/:businessId/review-stats` (Review Analytics)
**Auth:** Business owner only
**Purpose:** Dashboard card - review metrics

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalReviews": 150,
    "averageRating": 4.2,
    "thisMonth": 15,
    "thisMonthRating": 4.4,
    "ratingTrend": "+0.2",
    "reviewsTrend": "+3",
    "unrepliedReviews": 8,
    "replyRate": 85.3,
    "positiveReviewPercent": 80,
    "reviewsWithPhotos": 45,
    "topSuggestions": [
      "Good service",
      "Quality products",
      "Friendly staff"
    ]
  }
}
```

---

#### 2. GET `/api/business-listings/:businessId/enquiry-stats` (Enquiry Analytics)
**Auth:** Business owner only
**Purpose:** Dashboard card - enquiry metrics

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalEnquiries": 62,
    "newEnquiries": 5,
    "respondedEnquiries": 12,
    "closedEnquiries": 45,
    "averageResponseTime": "2.5 hours",
    "responseRate": 92.3,
    "conversionRate": 35.5,
    "thisMonth": 18,
    "thisMonthResponseTime": "2.1 hours",
    "convertedLeads": 5
  }
}
```

---

#### 3. GET `/api/business-listings/:businessId/combined-feedback` (All Customer Interactions)
**Auth:** Business owner only
**Purpose:** Combined view of reviews + enquiries

**Query Parameters:**
```
?sort=latest
&type=all  // all, reviews, enquiries
&page=1
```

**Response (200):**
```json
{
  "success": true,
  "feedback": [
    {
      "type": "review",
      "id": "...",
      "userName": "John Doe",
      "rating": 4,
      "message": "Great service!",
      "createdAt": "2024-02-23T...",
      "status": "replied",
      "hasOwnerReply": true
    },
    {
      "type": "enquiry",
      "id": "...",
      "userName": "Jane Smith",
      "subject": "Pricing inquiry",
      "message": "What are your rates?",
      "createdAt": "2024-02-22T...",
      "status": "responded",
      "lastResponseAt": "2024-02-22T..."
    }
  ],
  "summary": {
    "totalReviews": 150,
    "totalEnquiries": 62,
    "unrepliedReviews": 8,
    "newEnquiries": 5
  }
}
```

---

### F. ADMIN ENDPOINTS

#### 1. GET `/api/admin/reviews?limit=50` (Moderate Reviews)
**Auth:** Admin only
**Purpose:** View reviews for moderation

**Query Parameters:**
```
?isApproved=false    // Show unapproved reviews
&isSpam=true         // Show to-be-reviewed reports
&spamCount=1         // Minimum spam reports
```

**Response (200):**
```json
{
  "success": true,
  "reviews": [
    {
      "_id": "...",
      "businessName": "Apollo Hospital",
      "userName": "John Doe",
      "rating": 1,
      "message": "Worst experience ever",
      "spamReports": [
        {
          "reportedBy": "...",
          "reason": "contains_profanity",
          "reportedAt": "..."
        }
      ],
      "isApproved": true,
      "isSpam": false,
      "createdAt": "..."
    }
  ],
  "pagination": { "total": 50, "page": 1 }
}
```

---

#### 2. PATCH `/api/admin/reviews/:reviewId/moderate` (Approve/Reject Review)
**Auth:** Admin only
**Purpose:** Admin moderation action

**Request Body:**
```json
{
  "action": "spam",  // approve, spam, delete
  "reason": "Contains profanity and inappropriate language"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review moderated",
  "status": "spam"
}
```

---

#### 3. GET `/api/admin/reviews/analytics` (Platform Analytics)
**Auth:** Admin only
**Purpose:** Network-wide review metrics

**Response (200):**
```json
{
  "success": true,
  "analytics": {
    "totalReviews": 50000,
    "totalBusinesses": 5000,
    "averageRating": 3.8,
    "reviewsThisMonth": 1200,
    "spamRate": 1.2,
    "approvalRate": 98.8,
    "topRatedBusinesses": [
      {
        "businessId": "...",
        "businessName": "...",
        "rating": 4.8,
        "reviews": 250
      }
    ]
  }
}
```

---

## 3. MODELS DESIGN FOR FUTURE SOCKET.IO

All models include fields to support real-time notifications:

**Review Model:**
- `ownerReply.repliedAt` - Track when reply sent
- Review auto-populates user info for notifications

**Enquiry Model:**
- `notificationSent` + `notificationSentAt` - Track notification delivery
- `responses[].respondedAt` - Track response timing
- Fields support Socket.io event payloads

**When implementing Socket.io:**
```javascript
// Example future implementation
socket.emit('business:new_review', {
  businessId, reviewId, rating, userName, message, timestamp
})

socket.emit('business:new_enquiry', {
  businessId, enquiryId, userName, phone, message, timestamp
})
```

---

## 4. AGGREGATION PIPELINE (Cache Results)

### Review Statistics Aggregation
```javascript
db.reviews.aggregate([
  { $match: { businessId: ObjectId, isApproved: true, isSpam: false } },
  {
    $group: {
      _id: "$businessId",
      totalReviews: { $sum: 1 },
      avgRating: { $avg: "$rating" },
      ratingCounts: {
        rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } }
      },
      withOwnerReply: { $sum: { $cond: [{ $ne: ["$ownerReply", null] }, 1, 0] } },
      withPhotos: { $sum: { $cond: [{ $gt: [{ $size: "$photos" }, 0] }, 1, 0] } },
      recentAvg: {
        $avg: {
          $cond: [
            { $gte: ["$createdAt", new Date(Date.now() - 30*24*60*60*1000)] },
            "$rating",
            null
          ]
        }
      }
    }
  }
])
```

**Cache Strategy:**
- Store aggregated stats in Redis with 1-hour TTL
- Key format: `review:stats:{businessId}`
- Invalidate on:
  - New review created
  - Owner reply added
  - Review marked as spam
  - Review deleted

---

## 5. DATABASE INDEXES

### Review Indexes
```javascript
ReviewSchema.index({ userId: 1, businessId: 1 }, { unique: true });
ReviewSchema.index({ businessId: 1, rating: 1 });
ReviewSchema.index({ businessId: 1, createdAt: -1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ isApproved: 1, isSpam: 1 });
ReviewSchema.index({ businessId: 1, isApproved: 1, isSpam: 1 });
```

### Enquiry Indexes
```javascript
EnquirySchema.index({ businessId: 1, status: 1 });
EnquirySchema.index({ businessId: 1, createdAt: -1 });
EnquirySchema.index({ userId: 1, businessId: 1 });
EnquirySchema.index({ userPhone: 1, businessId: 1 });
EnquirySchema.index({ status: 1 });
```

### UserLocation Indexes
```javascript
UserLocationSchema.index({ 'currentLocation': '2dsphere' });
UserLocationSchema.index({ userId: 1 });
UserLocationSchema.index({ city: 1 });
UserLocationSchema.index({ lastUpdated: -1 });
UserLocationSchema.index({ 'address.city': 1 });
```

---

## 6. SECURITY & VALIDATION

### Input Validation:
- Reviews: Sanitize text (prevent XSS)
- Enquiries: Validate phone format
- Location: Validate lat/lng ranges
- Rate limiting:
  - 1 review per user per business per 7 days
  - 10 enquiries per user per day
  - 50 enquiries per business per day

### Authorization:
- Reviews/Enquiries: Authenticated users only
- Replies: Business owner only
- Moderation: Admin only
- Location: User's own location only
- Dashboard: Business owner access to their listings

### Data Privacy:
- Phone numbers: Masked in public reviews (show first + last char)
- Email: Encrypted at rest
- Location: Private by default (no sharing across users)

---

## 7. ERROR HANDLING

```json
{
  "success": false,
  "errors": [
    {
      "code": "INVALID_RATING",
      "message": "Rating must be between 1 and 5",
      "field": "rating"
    },
    {
      "code": "DUPLICATE_REVIEW",
      "message": "You have already reviewed this business. You can edit your existing review.",
      "statusCode": 409
    }
  ]
}
```

---

## 8. MIGRATION & SETUP GUIDE

### Step 1: Create Models
- `/models/Review.ts`
- `/models/Enquiry.ts`
- `/models/ReviewSuggestions.ts`
- `/models/UserLocation.ts`

### Step 2: Create Routes
- `/routes/reviews.ts`
- `/routes/enquiries.ts`
- `/routes/suggestions.ts`
- `/routes/locations.ts` (NEW)

### Step 3: Seed ReviewSuggestions Data
```javascript
[
  {
    rating: 1,
    label: 'Terrible',
    emoji: '😠',
    prompt: 'What went wrong?',
    suggestions: [
      { text: 'Poor service', emoji: '👎', weight: 0.95 },
      { text: 'Rude staff', emoji: '😠', weight: 0.90 }
    ]
  },
  // ... for ratings 2-5
]
```

### Step 4: Frontend Integration
- Review form uses `/api/reviews/suggestions/:rating`
- Location endpoint for business listings
- Dashboard uses analytics endpoints

### Step 5: Cache Setup
- Configure Redis for stats caching
- Implement cache invalidation on write

---

## 9. TESTING CHECKLIST

- [ ] Create review (full flow)
- [ ] Prevent duplicate reviews
- [ ] Photo upload (multiple, size limit)
- [ ] Owner reply functionality
- [ ] Review stats calculation
- [ ] Enquiry creation & response flow
- [ ] Location save & retrieval
- [ ] Nearby businesses query
- [ ] Location-based category search
- [ ] Admin moderation workflow
- [ ] Rate limiting
- [ ] Cache invalidation
- [ ] Permission checks
- [ ] Input validation

---

## 10. FUTURE ENHANCEMENTS

- Socket.io real-time events
- SMS notifications for high-priority enquiries
- Email digests for business owners
- Sentiment analysis (ML)
- Review response templates
- Bulk enquiry management
- CRM integration
- Conversion tracking
- Franchise business support

