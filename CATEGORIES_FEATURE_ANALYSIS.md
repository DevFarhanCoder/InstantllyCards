# Categories & Subcategories Feature Analysis

## Overview
The Categories feature allows users to:
1. **List Categories** - View all available business categories (Travel, Technology, Health, etc.)
2. **List Subcategories** - View subcategories for a selected category (Hotels, Resorts, Hostels, etc.)
3. **Select Subcategories** - Multi-select subcategories and add them to the business card
4. **View Selected List** - See selected services displayed as tags

---

## User Journey Flow

### **Step 1: User Views Categories on Home Screen**
**File:** [`app/(tabs)/home.tsx`](app/(tabs)/home.tsx#L330-L346)

When user opens the home screen, they see the Categories section in the feed:
```tsx
{FEATURE_FLAGS.SHOW_CATEGORIES && (
  <View style={s.categoriesHeaderRow}>
    <View style={s.categoriesWithArrow}>
      <Text style={s.categoriesHeaderText}>Categories</Text>
      <Ionicons name="arrow-forward" size={20} color="#EF4444" />
    </View>
  </View>
)}
{FEATURE_FLAGS.SHOW_CATEGORIES && <CategoryGrid />}
```

**Controls:**
- Feature Flag: `SHOW_CATEGORIES` in [`lib/featureFlags.ts`](lib/featureFlags.ts#L9)
- Display Component: [`components/CategoryGrid.tsx`](components/CategoryGrid.tsx)

---

### **Step 2: User Navigates to Card Builder**
**File:** [`app/builder/index.tsx`](app/builder/index.tsx#L1138-1145)

When user creates/edits a business card, they access the "Services Offered" section:
```tsx
const [servicesOffered, setServicesOffered] = useState("");
const [selectedServices, setSelectedServices] = useState<string[]>([]);
const [servicesModalVisible, setServicesModalVisible] = useState(false);
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
```

**UI Component Location:** [`app/builder/index.tsx`](app/builder/index.tsx#L2601-2640)
```tsx
{/* Services Offered Multi-Select */}
<View style={s.formField}>
  <Text style={s.enhancedLabel}>Services Offered</Text>
  <TouchableOpacity
    style={s.servicesButton}
    onPress={() => setServicesModalVisible(true)}
  >
    <Text>{selectedServices.length > 0
      ? `${selectedServices.length} service${selectedServices.length > 1 ? "s" : ""} selected`
      : "Select services from list"}
    </Text>
  </TouchableOpacity>
</View>
```

---

### **Step 3: Modal Opens - User Sees Categories List**
**File:** [`app/builder/index.tsx`](app/builder/index.tsx#L2817-2930)

When user clicks "Select services from list", a modal opens displaying:

**1. Categories Grid** (if no category selected):
```tsx
<FlatList
  data={Object.keys(SERVICE_CATEGORIES)}
  renderItem={({ item: category }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedCategory(category);
        setServicesSearchQuery("");
      }}
    >
      <View style={s.categoryItemContent}>
        <Text style={s.categoryIcon}>{CATEGORY_ICONS[category]}</Text>
        <Text style={s.categoryItemText}>{category}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
    </TouchableOpacity>
  )}
/>
```

**10 Categories Available:**
1. 🚗 Automotive
2. 💼 Business
3. 🔨 Construction
4. 📚 Education
5. 🏥 Health
6. 🎭 Lifestyle
7. 🔑 Rentals
8. 🛒 Shopping
9. 💻 Technology
10. ✈️ Travel

---

### **Step 4: User Selects Category → Subcategories Appear**
**File:** [`app/builder/index.tsx`](app/builder/index.tsx#L2932-3050)

When user clicks a category (e.g., "Travel"), `setSelectedCategory("Travel")` is called.

Modal now displays **Subcategories List**:
```tsx
{selectedCategory && (
  <FlatList
    data={SERVICE_CATEGORIES[selectedCategory].filter((service) =>
      service.toLowerCase().includes(servicesSearchQuery.toLowerCase()),
    )}
    renderItem={({ item }) => {
      const isSelected = selectedServices.includes(item);
      return (
        <TouchableOpacity
          style={[
            s.serviceItem,
            isSelected && s.serviceItemSelected,
          ]}
          onPress={() => {
            if (isSelected) {
              setSelectedServices((prev) =>
                prev.filter((s) => s !== item),
              );
            } else {
              setSelectedServices((prev) => [...prev, item]);
            }
          }}
        >
          <Text style={[s.serviceItemText]}>{item}</Text>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
          )}
        </TouchableOpacity>
      );
    }}
  />
)}
```

**Example: Travel Category - 10 Subcategories:**
- Hotels
- Resorts
- Hostels
- PG Accommodations
- Travel Agents
- Domestic Tours
- International Tours
- Visa Assistance
- International Air Ticketing
- Train Ticketing

---

### **Step 5: User Selects Subcategories (Multi-Select)**
**File:** [`app/builder/index.tsx`](app/builder/index.tsx#L3000-3030)

User can select multiple subcategories:
```tsx
onPress={() => {
  if (isSelected) {
    setSelectedServices((prev) => prev.filter((s) => s !== item));
  } else {
    setSelectedServices((prev) => [...prev, item]);
  }
}}
```

**Selected services state updates:**
```tsx
selectedServices = ["Hotels", "Resorts", "Travel Agents"]
```

---

### **Step 6: Selected Services Displayed as Tags**
**File:** [`app/builder/index.tsx`](app/builder/index.tsx#L2620-2634)

Selected services appear below the button as removable tags:
```tsx
{selectedServices.length > 0 && (
  <View style={s.selectedServicesContainer}>
    {selectedServices.map((service, index) => (
      <View key={index} style={s.serviceTag}>
        <Text style={s.serviceTagText}>{service}</Text>
        <TouchableOpacity
          onPress={() =>
            setSelectedServices((prev) =>
              prev.filter((s) => s !== service),
            )
          }
        >
          <Ionicons name="close-circle" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    ))}
  </View>
)}
```

---

### **Step 7: Selected Services Synced to Display Field**
**File:** [`app/builder/index.tsx`](app/builder/index.tsx#L1192-1197)

```tsx
// Sync selectedServices array with servicesOffered string
useEffect(() => {
  if (selectedServices.length > 0) {
    setServicesOffered(selectedServices.join(", "));
  } else {
    setServicesOffered("");
  }
}, [selectedServices]);
```

**Result:**
- `servicesOffered = "Hotels, Resorts, Travel Agents"`
- This gets saved to the card when user submits

---

## Category-Subcategories Mapping

### **Data Structure**
**File:** [`app/builder/index.tsx`](app/builder/index.tsx#L82-175)

```tsx
const SERVICE_CATEGORIES = {
  'Travel': [10 items],
  'Technology': [9 items],
  'Shopping': [17 items],
  'Rentals': [5 items],
  'Lifestyle': [14 items],
  'Health': [21 items],
  'Education': [10 items],
  'Construction': [14 items],
  'Automotive': [8 items],
  'Business': [16 items],
};
```

**Total: 114 subcategories across 10 categories**

---

## Where Data is Stored

### **State Management in Builder**
**File:** [`app/builder/index.tsx`](app/builder/index.tsx#L1138-1145)

```tsx
// Current selections
const [selectedServices, setSelectedServices] = useState<string[]>([]);
const [servicesOffered, setServicesOffered] = useState("");
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
```

### **Draft Saving**
**File:** [`app/builder/index.tsx`](app/builder/index.tsx#L1250-1280)

Services are saved to AsyncStorage as part of draft:
```tsx
const draftData = {
  ...otherFields,
  servicesOffered: servicesOffered,
};
await AsyncStorage.setItem("card_draft_new", JSON.stringify(draftData));
```

### **Card Creation Payload**
**File:** [`app/builder/index.tsx`](app/builder/index.tsx#L1250-1260)

When user submits, services are sent to backend:
```tsx
const payload = {
  ...otherFields,
  servicesOffered: servicesOffered,
};
const response = await api.post("/cards", payload);
```

---

## Alternative Implementation: Home Screen Categories

### **Home Screen Category Grid**
**File:** [`components/CategoryGrid.tsx`](components/CategoryGrid.tsx)

Displays categories in a grid with subcategory modals:

```tsx
const categories = [
  { name: 'Automotive', icon: <FontAwesome5 name="car" />, hasSubcategories: true },
  { name: 'Business', icon: <MaterialIcons name="business-center" />, hasSubcategories: true },
  // ... 8 more
];
```

When user clicks a category, a modal shows subcategories:
```tsx
<SubCategoryModal
  visible={modal.visible}
  onClose={() => setModal({ ...modal, visible: false })}
  title={modal.title}
  subcategories={modal.subcategories}
/>
```

---

## Feature Flags

**File:** [`lib/featureFlags.ts`](lib/featureFlags.ts)

```tsx
export const FEATURE_FLAGS = {
  SHOW_CATEGORIES: true,        // Show categories on home
  SHOW_PROMOTE_BUSINESS: true,  // Show promote button
};
```

---

## Summary of File Locations

| Feature | File | Lines |
|---------|------|-------|
| **Home Screen Categories Display** | [`app/(tabs)/home.tsx`](app/(tabs)/home.tsx) | 330-346 |
| **Category Grid Component** | [`components/CategoryGrid.tsx`](components/CategoryGrid.tsx) | 1-427 |
| **Subcategory Modal** | [`components/SubCategoryModal.tsx`](components/SubCategoryModal.tsx) | 1-415 |
| **Card Builder Services Offered** | [`app/builder/index.tsx`](app/builder/index.tsx) | 1138-3050 |
| **Service Categories Data** | [`app/builder/index.tsx`](app/builder/index.tsx) | 82-175 |
| **Modal UI Rendering** | [`app/builder/index.tsx`](app/builder/index.tsx) | 2817-3050 |
| **Selected Services Tags** | [`app/builder/index.tsx`](app/builder/index.tsx) | 2620-2634 |
| **Sync Services Logic** | [`app/builder/index.tsx`](app/builder/index.tsx) | 1192-1197 |
| **Feature Flags** | [`lib/featureFlags.ts`](lib/featureFlags.ts) | 1-17 |
| **Category Selection Screen** | [`app/business-category-selection.tsx`](app/business-category-selection.tsx) | 1-389 |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    HOME SCREEN                               │
│         1. User sees Categories Grid                         │
│              (CategoryGrid.tsx)                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                 CARD BUILDER SCREEN                          │
│         2. User clicks "Services Offered"                    │
│              (app/builder/index.tsx:2601)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              SERVICES MODAL OPENS                            │
│         3. Shows 10 Categories (SERVICE_CATEGORIES)          │
│              (app/builder/index.tsx:2817)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ User selects Travel
                      │
┌─────────────────────────────────────────────────────────────┐
│         4. Shows Travel Subcategories (10 items)             │
│         Hotels, Resorts, Hostels, etc.                      │
│              (app/builder/index.tsx:2932)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ User selects Hotels, Resorts
                      │
┌─────────────────────────────────────────────────────────────┐
│         5. Selected Services Updated                         │
│         selectedServices = ["Hotels", "Resorts"]            │
│         Sync to servicesOffered = "Hotels, Resorts"         │
│              (app/builder/index.tsx:1192)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ User clicks Done
                      │
┌─────────────────────────────────────────────────────────────┐
│         6. Services Displayed as Tags                        │
│         [Hotels] [Resorts]                                  │
│         Each tag has X button to remove                      │
│              (app/builder/index.tsx:2620)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ User saves card
                      │
┌─────────────────────────────────────────────────────────────┐
│         7. Services Sent to Backend                          │
│         POST /cards {                                        │
│           servicesOffered: "Hotels, Resorts"               │
│         }                                                    │
│              (app/builder/index.tsx:1258)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### ✅ Multi-Select
- Users can select multiple subcategories
- Each selected item shows as a tag
- Easy removal with X button

### ✅ Search Filter
- Real-time search in subcategories
- Filter as user types: `service.toLowerCase().includes(query)`

### ✅ Custom Services
- Users can add custom categories
- Format: `${selectedCategory} - ${customInput}`

### ✅ Draft Saving
- Services saved to AsyncStorage
- Auto-restore on page reload

### ✅ Data Persistence
- Services sent to backend in `servicesOffered` field
- Comma-separated format: `"Hotels, Resorts, Travel Agents"`

---

## Total Categories & Subcategories Count

| Category | Count | Examples |
|----------|-------|----------|
| Automotive | 8 | Car Repair, Bike Dealers, Towing Services |
| Business | 16 | Chartered Accountants, Lawyers, Event Organizers |
| Construction | 14 | Architects, Electricians, Plumbers |
| Education | 10 | Schools, Coaching Centres, Playschools |
| Health | 21 | Dentists, Cardiologists, Dermatologists |
| Lifestyle | 14 | Beauty Salons, Gyms, Photographers |
| Rentals | 5 | Car Rentals, Generators, Tempos |
| Shopping | 17 | Restaurants, Groceries, Pet Shops |
| Technology | 9 | Computer Repairs, Website Development |
| Travel | 10 | Hotels, Resorts, Travel Agents |
| **TOTAL** | **114** | - |

---
