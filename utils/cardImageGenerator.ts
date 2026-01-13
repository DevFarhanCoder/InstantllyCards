import { Platform, Alert } from 'react-native';

// Lazy imports to prevent crash if native modules not available
let captureRef: any = null;
let FileSystem: any = null;
let Sharing: any = null;
let Share: any = null;

try {
  const viewShot = require('react-native-view-shot');
  captureRef = viewShot.captureRef;
} catch (error) {
  console.warn('⚠️ react-native-view-shot not available. Image sharing requires app rebuild.');
}

try {
  FileSystem = require('expo-file-system/legacy');
} catch (error) {
  console.warn('⚠️ expo-file-system not available. Image sharing requires app rebuild.');
}

try {
  Sharing = require('expo-sharing');
} catch (error) {
  console.warn('⚠️ expo-sharing not available. Image sharing requires app rebuild.');
}

try {
  Share = require('react-native-share').default;
} catch (error) {
  console.warn('⚠️ react-native-share not available. Image sharing requires app rebuild.');
}

/**
 * Generate and share a business card image
 * @param viewRef Reference to the BusinessCardTemplate component
 * @param cardData Card data for generating the image
 * @param shareMethod 'native' | 'whatsapp' | 'save' - How to share the image
 * @returns Promise with success status
 */
export async function generateAndShareCardImage(
  viewRef: any,
  cardData: any,
  shareMethod: 'native' | 'whatsapp' | 'save' = 'native'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if native modules are available
    if (!captureRef || !FileSystem || !Sharing || !Share) {
      Alert.alert(
        'Feature Not Available',
        'Card image sharing requires app rebuild. Please rebuild the app with:\n\nnpx expo run:android\n\nFor now, use "Share Within App" option.',
        [{ text: 'OK' }]
      );
      return { 
        success: false, 
        error: 'native_module_not_available' 
      };
    }

    console.log('📸 Capturing card image...');
    
    // Capture the view as an image
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    console.log('✅ Card image captured:', uri);

    // Get the file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && 'size' in fileInfo) {
      console.log('📊 Image size:', fileInfo.size, 'bytes');
    }

    const companyName = cardData.companyName || cardData.name || 'Business';
    const fileName = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Card.png`;

    // Build card details message
    const buildCardDetails = () => {
      let details = 'This is My Digital Visiting Card -\n\n';
      
      if (cardData.name) details += `👤 Name: ${cardData.name}\n`;
      if (cardData.designation) details += `💼 Designation: ${cardData.designation}\n`;
      if (cardData.companyName) details += `🏢 Company: ${cardData.companyName}\n`;
      
      const phone = cardData.companyPhone || cardData.personalPhone;
      if (phone) {
        // Remove + and country code prefix for cleaner display
        const cleanPhone = phone.replace(/^\+\d+/, '').trim();
        details += `📞 Phone: ${cleanPhone}\n`;
      }
      
      const email = cardData.companyEmail || cardData.email;
      if (email) details += `📧 Email: ${email}\n`;
      
      const website = cardData.companyWebsite || cardData.website;
      if (website) details += `🌐 Website: ${website}\n`;
      
      const address = cardData.companyAddress || cardData.location;
      if (address) details += `📍 Address: ${address}\n`;
      
      return details;
    };

    // Get user referral code (assuming it's in cardData or user data)
    const referralCode = cardData.referralCode || 'QP8B385Q'; // Default fallback
    const referralLink = `https://play.google.com/store/apps/details?id=com.instantllycards.www.twa&referrer=utm_source%3Dreferral%26utm_campaign%3D${referralCode}`;

    switch (shareMethod) {
      case 'whatsapp':
        // Share via WhatsApp with complete card details
        const whatsappMessage = buildCardDetails() +
          `\n━━━━━━━━━━━━━━━━━━━━\n` +
          `*Earn ₹1200 to ₹6000+ per day Without Investment*\n\n` +
          `▪️ *I Got ₹300 Credit* I have downloaded this app & Got ₹300 Credit & App is very good for Visiting Card Management Advantage is shown in the video link given below\n\n` +
          `▪️ *You will get ₹300 Credit* When you download you will also get ₹300 Credit.\n\n` +
          `▪️ *Referral Bonus ₹300 Credit* When you download i will also get ₹300 Credit.\n\n` +
          `▪️ *How to earn ₹6000 per day* If you send Referral Message to 6 Groups & in each group 500 persons are member then your message will go to 3000 persons & normally 20 to 50 person download the Mobile App so on 20 Person you get ₹300 each so Total is ₹6000 per day\n\n` +
          `▪️ *What to do for Getting Referral Income* Download the Referral Message & Referral Link & Send this Message & Link to your WhatsApp Groups\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📲 *Important Links*\n\n` +
          `▪️ *Touch this link to Download the App with Referral Code*\n${referralLink}\n\n` +
          `▪️ *Video to Know Advantage of the Application & How to use it*\nhttps://drive.google.com/drive/folders/1ZkLP2dFwOkaBk-najKBIxLXfXUqw8C8l?usp=sharing\n\n` +
          `▪️ *If you have any problem then join this WhatsApp Group and write the Problem you are getting*\nhttps://chat.whatsapp.com/G2bHGLYnlKRETTt7sxtqDl\n\n` +
          `▪️ *Video for Channel Partner Explanation*\nhttps://drive.google.com/drive/folders/1W8AqKhg67PyxQtRIH50hmknzD1Spz6mo?usp=sharing`;

        await Share.open({
          title: `${companyName}'s Business Card`,
          message: whatsappMessage,
          url: `file://${uri}`,
          type: 'image/png',
          filename: fileName,
          social: Share.Social.WHATSAPP, // Force WhatsApp as target
        });
        break;

      case 'save':
        // Save to device
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Save Business Card',
            UTI: 'public.png',
          });
        } else {
          throw new Error('Sharing is not available on this device');
        }
        break;

      case 'native':
      default:
        // Use native share sheet
        const shareMessage = `${companyName}'s Digital Business Card\n\n` +
          `🎯 Create your FREE Digital Visiting Card with Instantlly Cards!\n` +
          `📱 https://play.google.com/store/apps/details?id=com.instantllycards.www.twa`;

        if (Platform.OS === 'android') {
          await Share.open({
            title: `${companyName}'s Business Card`,
            message: shareMessage,
            url: `file://${uri}`,
            type: 'image/png',
            filename: fileName,
          });
        } else {
          // iOS
          await Share.open({
            title: `${companyName}'s Business Card`,
            message: shareMessage,
            url: uri,
            type: 'image/png',
            filename: fileName,
          });
        }
        break;
    }

    console.log('✅ Card shared successfully');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Error generating/sharing card image:', error);
    
    // Handle specific errors
    if (error.message?.includes('User did not share')) {
      console.log('ℹ️ User cancelled sharing');
      return { success: false, error: 'cancelled' };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to generate card image' 
    };
  }
}

/**
 * Generate card image and save to file system
 * @param viewRef Reference to the BusinessCardTemplate component
 * @param cardData Card data
 * @returns Promise with file URI
 */
export async function generateCardImageFile(
  viewRef: any,
  cardData: any
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    // Check if native modules are available
    if (!captureRef || !FileSystem) {
      return { 
        success: false, 
        error: 'native_module_not_available' 
      };
    }

    console.log('📸 Generating card image file...');
    
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    console.log('✅ Card image file generated:', uri);
    return { success: true, uri };

  } catch (error: any) {
    console.error('❌ Error generating card image file:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to generate card image' 
    };
  }
}
