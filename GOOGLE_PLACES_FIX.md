# IMPORTANT: Google Places API Fix Required

## ⚠️ Current Issue

The Google Places API **cannot be called directly** from React Native (mobile apps) because:
1. API key would be exposed in the app code
2. CORS policy blocks direct calls from mobile apps
3. Security risk - anyone can steal your API key

## ✅ Solution: Use Your Backend

You need to create an API endpoint in your backend (`Instantlly-Cards-Backend`) to proxy the Google Places requests.

### Step 1: Create Backend Endpoint

Add this to your backend (`Instantlly-Cards-Backend/src/routes/`):

**File: `places.js`**
```javascript
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Google Places API Key (Keep this secret on backend!)
const GOOGLE_PLACES_API_KEY = 'AIzaSyBMT5rgKx_rNwxQr4YpoS3OG-jJGtpKWtQ';

// Autocomplete endpoint
router.get('/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;
    
    if (!input || input.length < 3) {
      return res.json({ status: 'INVALID_REQUEST', predictions: [] });
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(regions)&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await axios.get(url);
    res.json(response.data);
    
  } catch (error) {
    console.error('Places API Error:', error);
    res.status(500).json({ status: 'ERROR', predictions: [] });
  }
});

module.exports = router;
```

**Register the route in your main app file:**
```javascript
const placesRoutes = require('./routes/places');
app.use('/api/places', placesRoutes);
```

### Step 2: Update Frontend to Use Backend

Replace the API call in `adswithoutchannel.tsx`:

```typescript
// BEFORE (❌ Direct call - doesn't work)
const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?...`;

// AFTER (✅ Use your backend)
const url = `https://your-backend-url.com/api/places/autocomplete?input=${encodeURIComponent(query)}`;
```

## 🚀 Quick Fix: Use Alternative Free API

**Option: OpenStreetMap Nominatim (FREE, No API Key)**

This works directly from mobile apps!

```typescript
const searchPostalCodes = async (query: string) => {
  if (query.length < 3) {
    setPinCodeSuggestions([]);
    setShowPinSuggestions(false);
    return;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'InstantllyCards/1.0'
      }
    });
    const data = await response.json();
    
    if (data && data.length > 0) {
      const suggestions = data.map((item: any) => ({
        postalCode: item.address?.postcode || item.display_name.split(',')[0],
        displayName: item.display_name,
      }));
      setPinCodeSuggestions(suggestions);
      setShowPinSuggestions(true);
    } else {
      // Fallback to local database
      const results = searchLocalPostalCodes(query);
      const suggestions = results.map((item: any) => ({
        postalCode: item.code,
        displayName: `${item.code}, ${item.area ? item.area + ', ' : ''}${item.city}, ${item.state}, ${item.country}`,
      }));
      setPinCodeSuggestions(suggestions);
      setShowPinSuggestions(true);
    }
  } catch (error) {
    console.error('Nominatim API Error:', error);
    // Fallback to local database
    const results = searchLocalPostalCodes(query);
    const suggestions = results.map((item: any) => ({
      postalCode: item.code,
      displayName: `${item.code}, ${item.area ? item.area + ', ' : ''}${item.city}, ${item.state}, ${item.country}`,
    }));
    setPinCodeSuggestions(suggestions);
    setShowPinSuggestions(suggestions.length > 0);
  }
};
```

## 📊 Comparison

| Solution | Pros | Cons |
|----------|------|------|
| **Google Places via Backend** | ✅ Best accuracy<br>✅ Worldwide coverage<br>✅ Secure | ❌ Requires backend setup<br>❌ Costs money after free tier |
| **Nominatim (OpenStreetMap)** | ✅ FREE forever<br>✅ No API key<br>✅ Works directly from app<br>✅ Good coverage | ❌ Less accurate<br>❌ Slower<br>❌ Rate limited (1 req/sec) |
| **Local Database** | ✅ Offline<br>✅ Fast<br>✅ FREE | ❌ Limited coverage<br>❌ Must manually update |

## 💡 My Recommendation

**Use Nominatim (OpenStreetMap)** because:
1. Works directly from your app (no backend needed)
2. Completely FREE
3. No API key required
4. Good enough for postal code search
5. Worldwide coverage

Would you like me to implement the Nominatim solution? It will work immediately!
