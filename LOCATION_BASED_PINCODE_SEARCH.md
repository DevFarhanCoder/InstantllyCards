# Location-Based Postal Code Search

## Overview
Implemented geolocation support to improve postal code suggestions by prioritizing results based on the user's current location.

## What Changed

### 1. **Added expo-location Package**
```bash
npx expo install expo-location
```

### 2. **Location Permission Request**
- Automatically requests location permission when the component mounts
- Uses `Location.requestForegroundPermissionsAsync()` for user consent
- Gracefully handles permission denial (search still works worldwide)

### 3. **Geolocation Integration**
- `getCurrentLocation()` function retrieves user's latitude/longitude
- Uses `Location.Accuracy.Balanced` for optimal battery/accuracy trade-off
- Stores coordinates in `userLocation` state

### 4. **Smart Search Prioritization**
The Nominatim API search now uses a **viewbox** parameter when location is available:
- Creates a ~200km radius bounding box around user's location
- Results within this area appear first in suggestions
- Still shows worldwide results (using `bounded=0`)
- Fallback: If location unavailable, shows all worldwide results

## How It Works

### Location Detection Flow:
1. **Component Mounts** → Request location permission
2. **Permission Granted** → Get current coordinates (lat/lon)
3. **User Types Postal Code** → Debounced search (500ms)
4. **API Call** → Includes viewbox if location available
5. **Results** → Prioritizes nearby postal codes, then worldwide

### Example API URL (with location):
```
https://nominatim.openstreetmap.org/search?
  postalcode=400
  &format=json
  &limit=15
  &addressdetails=1
  &dedupe=0
  &viewbox=71.8,20.1,73.8,18.1  // Bounding box around Mumbai
  &bounded=0                      // Still show worldwide results
```

### Example API URL (without location):
```
https://nominatim.openstreetmap.org/search?
  postalcode=400
  &format=json
  &limit=15
  &addressdetails=1
  &dedupe=0
  // No viewbox - shows all worldwide results equally
```

## Benefits

### 1. **Better User Experience**
- Users searching "400" near Mumbai see Indian postal codes first
- Same search in Australia shows Australian codes first
- Reduces scrolling through irrelevant results

### 2. **Smarter Suggestions**
- Context-aware: "10001" shows NY codes first for US users
- International-friendly: Still shows all worldwide matches
- No additional API calls or costs (FREE)

### 3. **Privacy-Conscious**
- Location only used for search prioritization
- Not stored on server
- Permission required (respects user privacy)

## Technical Details

### State Management:
```typescript
const [userLocation, setUserLocation] = useState<{
  latitude: number,
  longitude: number
} | null>(null);
```

### Location Retrieval:
```typescript
const getCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;
  
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  
  setUserLocation({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });
};
```

### Bounding Box Calculation:
```typescript
// ~200km radius around user's location
const latDelta = 2;
const lonDelta = 2;
const viewbox = [
  userLocation.longitude - lonDelta,  // West
  userLocation.latitude + latDelta,   // North
  userLocation.longitude + lonDelta,  // East
  userLocation.latitude - latDelta    // South
].join(',');
```

## Fallback Strategy

1. **Location Available** → Prioritized local results + worldwide
2. **Location Denied** → Worldwide results (no prioritization)
3. **Nominatim Fails** → Local database (450+ postal codes)
4. **No Results** → "No results found" message

## Console Logs

You'll see these logs indicating location-based search:
- `📍 Requesting location permission...`
- `📍 Getting current location...`
- `✅ User location obtained: <lat>, <lon>`
- `📍 Using user location for prioritized search`

## Testing

### Test Scenarios:
1. **Mumbai User searches "400"**
   - Should show: `400072, Mumbai, Maharashtra, India` first
   
2. **Brisbane User searches "4000"**
   - Should show: `4000, Queensland, Australia` first

3. **New York User searches "10001"**
   - Should show: `10001, Manhattan, New York, USA` first

4. **Without Location Permission**
   - Should still work, showing all worldwide results

## Cost
- **FREE** - No additional API costs
- Same Nominatim rate limits apply (1 request/second)
- Location service built into Expo (no extra package costs)

## Future Enhancements
- Cache user location (reduce permission prompts)
- Option to manually set location
- Show "📍 Nearby" badge on local results
- Distance indicator (e.g., "5 km away")
