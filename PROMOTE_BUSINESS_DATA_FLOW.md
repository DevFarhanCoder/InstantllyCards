# Promote Business Data Flow (Backend + App)

## 1) Purpose
Use this document before importing Excel data into MongoDB, so promoted/free business listings show correctly in InstantllyCards app.

This covers:
- Promote Business lifecycle APIs
- Public listing fetch logic used by app
- Category and nested-category matching rules
- Excel/CSV import rules and required fields
- Common reasons imported rows do not appear

---

## 2) Main Flow Overview

There are 2 different flows:

1. Owner flow (`/api/business-promotion`, auth required)
- User creates/edits listing in multi-step form
- Listing moves through `draft -> submitted -> active`
- Free listing: activated with `/activate-free`
- Premium listing: payment + activation with promotion pricing APIs

2. Public discovery flow (`/api/business-listings`, no auth)
- App category screens open `business-cards`
- `business-cards` fetches `/api/business-listings?subcategory=...`
- Only listings that pass active/expiry filters are returned

If Excel data is inserted directly, it must satisfy public discovery filters (section 6).

---

## 3) Backend APIs (Related)

### 3.1 Promote Business lifecycle
File: `Instantlly-Cards-Backend/src/routes/businessPromotion.ts`

- `POST /api/business-promotion`
  - Create/update draft/submitted listing
- `GET /api/business-promotion/in-progress`
  - Resume in-progress listing
- `POST /api/business-promotion/:id/upgrade-to-pro`
  - Free -> premium intent (pending payment)
- `POST /api/business-promotion/:id/activate-free`
  - Activate submitted free listing
- `POST /api/business-promotion/:id/activate-promoted`
  - Activate promoted listing (order or legacy path)
- `PATCH /api/business-promotion/:id/premium-edit`
  - Edit paid premium listing without new payment
- `GET /api/business-promotion`
  - Owner’s listings
- `GET /api/business-promotion/:id`
  - Owner listing detail
- `PATCH /api/business-promotion/:id/toggle-status`
  - Activate/deactivate with validation

### 3.2 Public listing feed (used by app cards screens)
File: `Instantlly-Cards-Backend/src/routes/business-listing.ts`

- `GET /api/business-listings`
  - Query params: `subcategory`, `listingType`, `page`, `limit`
  - Sort: promoted first, then score
- `GET /api/business-listings/:id`
  - Detail endpoint
- `POST /api/business-listings/:id/impression`
- `POST /api/business-listings/:id/click`
- `POST /api/business-listings/:id/lead`

### 3.3 Category APIs used by Promote Business form and category screens
Files:
- `Instantlly-Cards-Backend/src/routes/categories.ts`
- `InstantllyCards/lib/categoryService.ts`

- `GET /api/categories/tree`
- `GET /api/categories/:id/children`

Supports `?fresh=1` to bypass category cache when needed.

### 3.4 Admin CSV upload APIs creating `BusinessPromotion`
File: `Instantlly-Cards-Backend/src/routes/categories.ts`

- `POST /api/categories/admin/upload-companies` (legacy)
- `POST /api/categories/admin/node/:id/upload-csv` (node-aware; preferred)

Both create rows directly in `BusinessPromotion` collection.

---

## 4) App Fetch Logic

### 4.1 Promote Business form (dynamic categories)
File: `InstantllyCards/app/business-promotion.tsx`

- Loads categories from:
  - `GET /api/categories/tree`
  - `GET /api/categories/:id/children` (lazy nested load)
- Submits form to:
  - `POST /api/business-promotion`
- Free activation:
  - `POST /api/business-promotion/:id/activate-free`
- Premium payment flow:
  - `GET /api/promotion-pricing/catalog`
  - `GET /api/promotion-pricing/quote`
  - `POST /api/promotion-pricing/orders`
  - `POST /api/promotion-pricing/orders/:orderId/verify-payment`

### 4.2 Category -> listing cards
Files:
- `InstantllyCards/app/categories.tsx`
- `InstantllyCards/app/category-focus.tsx`
- `InstantllyCards/components/SubCategoryModal.tsx`
- `InstantllyCards/app/business-cards.tsx`

Flow:
- User picks a leaf category/subcategory
- App navigates to `business-cards` with `subcategory=<leaf-name>`
- `business-cards` calls:
  - `GET /api/business-listings?subcategory=<leaf-name>&page=...&limit=...`

### 4.3 Business detail
File: `InstantllyCards/app/(main)/businessCard/[id]/index.tsx`

- Calls `GET /api/business-listings/:id`
- Tracking:
  - `POST /api/business-listings/:id/click`
  - `POST /api/business-listings/:id/lead`
  - impression is tracked in cards list

---

## 5) How Category Matching Works (Important for Nested Data)

Public listing query logic (`business-listing.ts`) uses:
- `category` array field
- regex match on `subcategory` (case-insensitive)

So listing is returned when **any string in `category[]` matches the selected subcategory text**.

Recommended import format for nested nodes:
- Store full path as array elements:
  - `["Health", "Alternative & Wellness", "Ayurveda & Panchakarma Clinic"]`

This is safest for nested categories and future filtering.

Note:
- Promote form currently may save joined path labels like:
  - `"Health - Alternative & Wellness - Ayurveda & Panchakarma Clinic"`
- This still works due regex partial matching, but path-array style is cleaner for imported data.

---

## 6) Required Data Contract for Imported Rows to Appear in App

Collection: `BusinessPromotion`

Minimum required fields for visibility in `GET /api/business-listings`:

- `userId`: valid ObjectId (placeholder allowed for admin import)
- `businessName`: non-empty
- `ownerName`: non-empty
- `category`: non-empty `string[]` and includes leaf subcategory text
- `phone`: non-empty
- `listingType`: `"free"` or `"promoted"`
- `listingIntent`: `"free"` or `"promoted"` (keep consistent with `listingType`)
- `status`: `"active"`
- `isActive`: `true`
- `paymentStatus`:
  - free: `"not_required"`
  - promoted: `"paid"` (or listing may fail premium lifecycle checks)
- `currentStep`: `"location"`
- `progress`: `100`
- `stepIndex`: `4`
- `expiryDate`:
  - free: `null`
  - promoted: `null` or future date (query allows null or future)

If any of these are wrong, rows may not show.

---

## 7) Excel/CSV Import Guidance

## Preferred method
Use admin node upload API:
- `POST /api/categories/admin/node/:id/upload-csv`

Expected row keys:
- `businessName` (required)
- `phone` (required)
- `ownerName`, `description`, `whatsapp`, `email`, `website`, `area`, `city`, `state`, `pincode`, `landmark`, `listingType` (optional)

Important:
- CSV headers must map exactly to these keys (`businessName`, not `Business Name`).
- Backend skips rows missing `businessName` or `phone`.
- That API currently sends `categoryId` in create payload, but `BusinessPromotion` schema does not define `categoryId`; do not rely on it for filtering.

## Legacy method
- `POST /api/categories/admin/upload-companies`

Use only if you are still working on legacy flat category/subcategory upload.

## Direct DB insert (only if needed)
If importing directly with script/mongosh:
- Ensure all fields from section 6 are set.
- Ensure `category[]` contains selected leaf subcategory text.
- Keep `status='active'` and `isActive=true`.

---

## 8) Why Imported Data Sometimes Does Not Show

Most common reasons:

1. `status` is `draft/submitted/inactive/expired` instead of `active`
2. `isActive` is `false`
3. `category[]` does not contain selected subcategory text
4. CSV headers do not match expected keys, so data was skipped
5. `listingType/listingIntent/paymentStatus` inconsistent
6. You imported into wrong DB or environment (local vs production)
7. App is hitting different API base URL than expected

---

## 9) Quick Verification Checklist (After Import)

1. Verify inserted rows:
```js
db.BusinessPromotion.find(
  { businessName: /your-company/i },
  { businessName: 1, category: 1, status: 1, isActive: 1, listingType: 1, paymentStatus: 1, expiryDate: 1 }
)
```

2. Verify public API directly:
```http
GET /api/business-listings?subcategory=<leaf-subcategory>&page=1&limit=20
```

3. Confirm app request uses same subcategory name and same backend base URL.

---

## 10) Source Files Referenced

- `Instantlly-Cards-Backend/src/models/BusinessPromotion.ts`
- `Instantlly-Cards-Backend/src/routes/businessPromotion.ts`
- `Instantlly-Cards-Backend/src/routes/business-listing.ts`
- `Instantlly-Cards-Backend/src/routes/categories.ts`
- `InstantllyCards/lib/categoryService.ts`
- `InstantllyCards/app/business-promotion.tsx`
- `InstantllyCards/app/business-promotiontype.tsx`
- `InstantllyCards/app/business-cards.tsx`
- `InstantllyCards/app/categories.tsx`
- `InstantllyCards/app/category-focus.tsx`
- `InstantllyCards/components/SubCategoryModal.tsx`
- `InstantllyCards/app/(main)/businessCard/[id]/index.tsx`
