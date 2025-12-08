# LocationIQ API Setup Guide

## Overview
LocationIQ provides global postal code autocomplete functionality for the pincode field in the ad creation form.

## Getting Your API Key

1. **Sign up for LocationIQ**
   - Visit: https://locationiq.com/
   - Click "Get Started Free" or "Sign Up"
   - Create an account (free tier available)

2. **Get Your API Key**
   - Log in to your LocationIQ dashboard
   - Navigate to "API Access Tokens" section
   - Copy your API key

3. **Add API Key to the App**
   - Open: `InstantllyCards/app/(tabs)/ads/adswithoutchannel.tsx`
   - Find line with: `const LOCATIONIQ_API_KEY = 'pk.a8a4d1e50df1af5aca327789118f5cc5';`
   - Replace `pk.a8a4d1e50df1af5aca327789118f5cc5` with your actual API key
   - Example: `const LOCATIONIQ_API_KEY = 'pk.abc123xyz456...';`

## Free Tier Limits
- **5,000 requests per day**
- No credit card required
- Perfect for development and small-scale production

## API Features Used
- **Autocomplete Endpoint**: Global postal code search
- **Deduplication**: Removes duplicate results
- **Tag Filtering**: Only returns postal code results
- **Limit**: Maximum 10 suggestions per search

## How It Works

1. **User Input**: User types 2+ characters in the pincode field
2. **Debouncing**: 300ms delay prevents excessive API calls
3. **API Request**: Searches LocationIQ for matching postal codes
4. **Display Results**: Shows dropdown with postal codes and locations
5. **Selection**: User taps a suggestion to autofill the pincode

## API Request Format
```
GET https://api.locationiq.com/v1/autocomplete
?key=YOUR_API_KEY
&q=SEARCH_QUERY
&tag=place:postcode
&limit=10
&dedupe=1
```

## Response Structure
```json
[
  {
    "display_name": "400001, Mumbai, Maharashtra, India",
    "display_address": "Mumbai, Maharashtra, India",
    "address": {
      "postcode": "400001",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    }
  }
]
```

## Troubleshooting

### API Key Error
- **Error**: 401 Unauthorized
- **Solution**: Check if API key is correctly set in the code

### No Results
- **Error**: Empty suggestions array
- **Solution**: 
  - Try broader search terms (e.g., "New York" instead of specific postal code)
  - Check internet connection
  - Verify API key is active

### Rate Limit Exceeded
- **Error**: 429 Too Many Requests
- **Solution**: 
  - You've exceeded 5,000 requests/day
  - Wait until next day or upgrade to paid plan
  - Increase debounce delay to reduce API calls

## Alternative Configuration (Environment Variables)

For better security, you can use environment variables:

1. **Install react-native-dotenv** (if not already installed):
   ```bash
   npm install react-native-dotenv
   ```

2. **Create `.env` file** in project root:
   ```
   LOCATIONIQ_API_KEY=your_actual_api_key_here
   ```

3. **Update the code**:
   ```typescript
   import { LOCATIONIQ_API_KEY } from '@env';
   // Use LOCATIONIQ_API_KEY directly
   ```

4. **Add to `.gitignore`**:
   ```
   .env
   ```

## Testing

1. **Test with Indian postal codes**:
   - Type: "400001" → Should show Mumbai results
   - Type: "110001" → Should show Delhi results

2. **Test with international postal codes**:
   - Type: "10001" → Should show New York results
   - Type: "SW1A 1AA" → Should show London results

3. **Test with city names**:
   - Type: "Mumbai" → Should show various Mumbai postal codes
   - Type: "London" → Should show various London postal codes

## Support
- Documentation: https://locationiq.com/docs
- API Status: https://status.locationiq.com/
- Contact: support@locationiq.com
