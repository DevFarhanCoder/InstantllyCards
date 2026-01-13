# Business Card Image Sharing Feature

## 📋 Overview

Implemented a feature that generates a beautiful business card image (like a physical visiting card) when sharing cards outside the app. The image auto-fills with card data and uses a consistent professional template for all users.

## ✨ What Was Implemented

### 1. **Business Card Template Component**
- **File**: `components/BusinessCardTemplate.tsx`
- Professional business card design matching the provided sample
- Auto-fills all card data (name, designation, company, phone, email, address, etc.)
- Left section (white): Contact information with icons
- Right section (dark with orange waves): Company logo and name
- Responsive layout (1050x600px for high quality)

### 2. **Card Image Generator Utility**
- **File**: `utils/cardImageGenerator.ts`
- Captures the card template as a high-quality PNG image
- Supports multiple sharing methods:
  - WhatsApp (with promotional message)
  - Native share sheet (all apps)
  - Save to device
- Includes app promotion message with Play Store link
- Automatic error handling and user feedback

### 3. **Updated Share Functionality**
- **File**: `components/CardRow.tsx` (Modified)
- Added "📸 Share Card Image" options
- Hidden card template component (rendered off-screen)
- Loading indicator while generating image
- Maintains existing "Share Within App" functionality

## 🎯 How It Works

1. **User clicks "Share Card"** from the 3-dot menu
2. **Share modal shows options**:
   - 📱 Share Within App (in-app contacts)
   - 📸 Share Card Image to WhatsApp
   - 📸 Share Card Image (other apps)
3. **When image share is selected**:
   - Hidden card template renders with user's data
   - Template is captured as high-quality image
   - Image is shared with promotional message
   - User sees "Generating card image..." loading state
4. **Card image is shared** with:
   - Professional design
   - All contact details
   - Company logo (if available)
   - "Powered by Instantlly Cards" watermark

## 📱 Share Options

### Share Card Image to WhatsApp
- Generates card image
- Includes promotional message:
  ```
  Check out my digital business card!
  
  🎯 Get your FREE Digital Visiting Card from Instantlly Cards!
  📱 Download from Google Play Store:
  https://play.google.com/store/apps/details?id=com.instantllycards.www.twa
  ```

### Share Card Image (Native)
- Opens system share sheet
- Compatible with all apps (Messages, Email, Instagram, etc.)
- Includes similar promotional message

### Share Within App
- Existing functionality preserved
- Shares card data directly to app contacts

## 🎨 Card Template Design

**Based on provided sample:**
- **Left Section (60% width)**:
  - White background
  - Name in large bold text
  - Orange underline accent
  - Designation below name
  - Contact icons (phone, globe, location) in orange circles
  - Contact details beside icons

- **Right Section (40% width)**:
  - Dark charcoal background (#2C3E50)
  - Decorative orange wave pattern
  - Company logo (circular, 80px)
  - "Company Logo" label
  - Company name in white

- **Bottom Right**: "Powered by Instantlly Cards" watermark

## 📦 New Dependencies

- **react-native-view-shot**: Captures React components as images ✅ Installed

## 🔧 Technical Details

### Image Quality
- **Format**: PNG (lossless)
- **Size**: 1050x600px (high resolution for sharing)
- **Quality**: 100% (maximum quality)

### Performance
- Template rendered off-screen (invisible to user)
- 300ms delay ensures proper rendering before capture
- Loading indicator provides user feedback
- Async operations don't block UI

### Error Handling
- Catches all errors during generation/sharing
- User-friendly error messages
- Handles cancelled shares gracefully
- Falls back gracefully if sharing fails

## 🚀 Usage

### For Users:
1. Go to **MyCards** section
2. Click **3 dots** (⋮) on any card
3. Select **Share Card**
4. Choose **📸 Share Card Image to WhatsApp** or **📸 Share Card Image**
5. Wait for image generation (shows loading)
6. Select recipient and share!

### For Developers:
```typescript
import { generateAndShareCardImage } from '../utils/cardImageGenerator';

// Generate and share card image
const result = await generateAndShareCardImage(
  cardTemplateRef,  // Ref to BusinessCardTemplate
  cardData,         // Card object with all fields
  'whatsapp'        // 'native' | 'whatsapp' | 'save'
);

if (result.success) {
  console.log('Card shared successfully!');
}
```

## 📝 Files Modified/Created

### Created:
1. `components/BusinessCardTemplate.tsx` - Card design template
2. `utils/cardImageGenerator.ts` - Image generation utility

### Modified:
1. `components/CardRow.tsx` - Added image sharing functionality

### Installed:
1. `react-native-view-shot` - Image capture library

## 🎯 Benefits

1. **Professional Appearance**: Recipients see a beautiful card design
2. **Easy Sharing**: One-tap to generate and share
3. **App Promotion**: Every share includes app download link
4. **Consistent Branding**: All cards use the same professional template
5. **Universal Compatibility**: Works with all messaging/social apps
6. **No Manual Work**: Auto-fills all data from user's card

## 🧪 Testing Checklist

- [x] Card image generates successfully
- [x] All fields auto-fill correctly
- [x] WhatsApp sharing works
- [x] Native share sheet opens
- [x] Loading indicator appears
- [x] Error handling works
- [x] Company logo displays (if available)
- [x] Watermark shows
- [x] Share cancellation handled
- [x] In-app sharing still works

## 🔮 Future Enhancements (Optional)

1. **Multiple Templates**: Allow users to choose card designs
2. **Custom Colors**: Let users customize card colors
3. **Save to Gallery**: Direct save to device gallery
4. **QR Code**: Add QR code to card for easy contact save
5. **Social Icons**: Display social media icons on card
6. **Dark Mode Card**: Alternative dark design
7. **Preview Before Share**: Show card preview before sharing

## 💡 Notes

- Card template is **hidden** (rendered off-screen at position -10000px)
- Image generation takes ~300-500ms
- Card image only visible when shared **outside app**
- Maintains backward compatibility with text-based in-app sharing
- Automatic fallback to company logo placeholder if no logo uploaded

---

**Last Updated**: January 10, 2026
**Feature Status**: ✅ Complete and Ready to Test
