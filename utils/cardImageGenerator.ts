import { Platform, Alert } from "react-native";

// Lazy imports to prevent crash if native modules not available
let captureRef: any = null;
let FileSystem: any = null;
let Sharing: any = null;
let Share: any = null;

// Track which modules failed to load
const missingModules: string[] = [];

try {
  const viewShot = require("react-native-view-shot");
  captureRef = viewShot.captureRef;
  console.log("✅ react-native-view-shot loaded successfully");
} catch (error) {
  console.warn("⚠️ react-native-view-shot not available:", error);
  missingModules.push("react-native-view-shot");
}

try {
  FileSystem = require("expo-file-system/legacy");
  console.log("✅ expo-file-system loaded successfully");
} catch (error) {
  console.warn("⚠️ expo-file-system not available:", error);
  missingModules.push("expo-file-system");
}

try {
  Sharing = require("expo-sharing");
  console.log("✅ expo-sharing loaded successfully");
} catch (error) {
  console.warn("⚠️ expo-sharing not available:", error);
  missingModules.push("expo-sharing");
}

try {
  Share = require("react-native-share").default;
  console.log("✅ react-native-share loaded successfully");
} catch (error) {
  console.warn("⚠️ react-native-share not available:", error);
  missingModules.push("react-native-share");
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
  shareMethod: "native" | "whatsapp" | "save" = "native",
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if native modules are available
    if (!captureRef || !FileSystem || !Sharing || !Share) {
      const missingList = [
        !captureRef && "react-native-view-shot",
        !FileSystem && "expo-file-system",
        !Sharing && "expo-sharing",
        !Share && "react-native-share",
      ]
        .filter(Boolean)
        .join(", ");

      console.error("❌ Missing native modules:", missingList);
      console.error("Missing modules array:", missingModules);

      Alert.alert(
        "Feature Not Available",
        `Card image sharing requires app rebuild.\n\nMissing: ${missingList}\n\nPlease rebuild the app with:\n\nnpx expo run:android\n\nFor now, use "Share Within App" option.`,
        [{ text: "OK" }],
      );
      return {
        success: false,
        error: "native_module_not_available",
      };
    }

    console.log("📸 Capturing card image...");

    // Capture the view as an image
    const uri = await captureRef(viewRef, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });

    console.log("✅ Card image captured:", uri);

    // Get the file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && "size" in fileInfo) {
      console.log("📊 Image size:", fileInfo.size, "bytes");
    }

    const companyName = cardData.companyName || cardData.name || "Business";
    const fileName = `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_Card.png`;

    // Helper function to format business hours from object
    const formatBusinessHours = (hoursObj: any): string => {
      if (!hoursObj) return "";
      
      // If it's a string (JSON), try to parse it
      let hours: any = hoursObj;
      if (typeof hoursObj === "string") {
        try {
          hours = JSON.parse(hoursObj);
        } catch (e) {
          return hoursObj; // Return as is if parsing fails
        }
      }

      if (typeof hours !== "object") return String(hoursObj);

      // Helper function to convert 24-hour to 12-hour format
      const convertTo12Hour = (time24: string): string => {
        const [hours, minutes] = time24.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;
        return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
      };

      // Format the hours nicely
      const dayOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const dayShort: { [key: string]: string } = {
        Monday: "Mon",
        Tuesday: "Tue",
        Wednesday: "Wed",
        Thursday: "Thu",
        Friday: "Fri",
        Saturday: "Sat",
        Sunday: "Sun",
      };

      let formatted = "";
      let previousRange = "";
      let startDay = "";

      dayOrder.forEach((day, index) => {
        const dayData = hours[day];
        if (!dayData) return;

        const isOpen = dayData.open !== false;
        const currentRange = isOpen
          ? `${convertTo12Hour(dayData.openTime)} - ${convertTo12Hour(dayData.closeTime)}`
          : "Closed";

        if (currentRange === previousRange && previousRange !== "") {
          // Same hours as previous day, skip adding to formatted string yet
        } else {
          // Different hours, so output the previous range if it exists
          if (previousRange !== "") {
            if (startDay === dayShort[dayOrder[index - 1]]) {
              formatted += `${startDay}, `;
            } else {
              formatted += `${startDay} - ${dayShort[dayOrder[index - 1]]}, `;
            }
            formatted += `${previousRange}\n`;
          }
          startDay = dayShort[day];
          previousRange = currentRange;
        }

        // Handle last day
        if (index === dayOrder.length - 1 && previousRange !== "") {
          if (startDay === dayShort[day]) {
            formatted += `${startDay}: ${previousRange}`;
          } else {
            formatted += `${startDay} - ${dayShort[day]}: ${previousRange}`;
          }
        }
      });

      return formatted.trim();
    };

    // Build card details message matching the Instantlly Digital Visiting Card template
    const buildCardDetails = () => {
      let details = "*This is My Instantlly Digital Visiting Card*\n\n";

      // === Personal Information ===
      if (cardData.name) details += `▪️ *👤 Name:* ${cardData.name}\n`;

      const personalPhone = cardData.contact || cardData.personalPhone;
      if (personalPhone) {
        const fullPersonalPhone = cardData.personalCountryCode
          ? `+${cardData.personalCountryCode}${personalPhone}`
          : personalPhone;
        details += `▪️ *📱 Personal Phone:* ${fullPersonalPhone}\n`;
      }

      // Personal WhatsApp (use personalPhone as WhatsApp if no dedicated field)
      const personalWhatsApp = cardData.personalWhatsapp || (personalPhone ? (cardData.personalCountryCode ? `+${cardData.personalCountryCode}${personalPhone}` : personalPhone) : "");
      if (personalWhatsApp) details += `▪️ *💬 Personal WhatsApp:* ${personalWhatsApp}\n`;

      const personalEmail = cardData.email;
      if (personalEmail) details += `▪️ *📧 Personal Email:* ${personalEmail}\n`;

      const personalLocation = cardData.location;
      if (personalLocation) details += `▪️ *🏭 Address:* ${personalLocation}\n`;

      const personalMapsLink = cardData.mapsLink;
      if (personalMapsLink) details += `▪️ *📍 Google Maps Link:* ${personalMapsLink}\n`;

      // === Company / Business Information ===
      details += `\n`;
      if (cardData.companyName) details += `▪️ *🏢 Company Name:* ${cardData.companyName}\n`;

      const companyPhone = cardData.companyContact || cardData.companyPhone;
      if (companyPhone) {
        const fullCompanyPhone = cardData.companyCountryCode
          ? `+${cardData.companyCountryCode}${companyPhone}`
          : companyPhone;
        details += `▪️ *📱 Company Mob:* ${fullCompanyPhone}\n`;
      }

      // Show additional company phones from companyPhones array
      if (cardData.companyPhones && Array.isArray(cardData.companyPhones)) {
        const shownPhones = new Set([companyPhone]);
        let phoneCounter = 2;
        cardData.companyPhones.forEach((phoneObj: any) => {
          if (phoneObj.phone && !shownPhones.has(phoneObj.phone)) {
            details += `▪️ *📱 Company Mob ${phoneCounter}:* ${phoneObj.phone}\n`;
            shownPhones.add(phoneObj.phone);
            phoneCounter++;
          }
        });
      }

      // Company WhatsApp
      const companyWhatsApp = cardData.whatsapp || (companyPhone ? (cardData.companyCountryCode ? `+${cardData.companyCountryCode}${companyPhone}` : companyPhone) : "");
      if (companyWhatsApp) details += `▪️ *💬 Company WhatsApp:* ${companyWhatsApp}\n`;

      if (cardData.designation) details += `▪️ *💼 Designation:* ${cardData.designation}\n`;

      if (cardData.aboutBusiness) details += `▪️ *🏭 Company Business:* ${cardData.aboutBusiness}\n`;

      if (cardData.servicesOffered) details += `▪️ *🛠️ Business Category:* ${cardData.servicesOffered}\n`;

      if (cardData.keywords) details += `▪️ *🔎 Search Key Word:* ${cardData.keywords}\n`;

      const companyWebsite = cardData.companyWebsite;
      if (companyWebsite) details += `▪️ *🌍 Company Website:* ${companyWebsite}\n`;

      const companyEmail = cardData.companyEmail;
      if (companyEmail) details += `▪️ *📧 Company Email:* ${companyEmail}\n`;

      const companyAddress = cardData.companyAddress;
      if (companyAddress) details += `▪️ *🏭 Company Address:* ${companyAddress}\n`;

      const companyMapsLink = cardData.companyMapsLink;
      if (companyMapsLink) details += `▪️ *📍 Company Maps:* ${companyMapsLink}\n`;

      if (cardData.businessHours) {
        const formattedHours = formatBusinessHours(cardData.businessHours);
        if (formattedHours && formattedHours.trim() !== '' && !formattedHours.match(/^Mon\s*[-–]\s*Sun:\s*Closed$/i)) {
          details += `▪️ *🕐 Business Hours:*\n${formattedHours}\n`;
        }
      }

      // === Social Media Links ===
      if (
        cardData.linkedin ||
        cardData.twitter ||
        cardData.instagram ||
        cardData.facebook ||
        cardData.youtube ||
        cardData.telegram
      ) {
        details += `\n▪️ *🔗 Social Media:*\n`;
      }

      if (cardData.facebook) details += `▪️ *👥 Facebook:* ${cardData.facebook}\n`;
      if (cardData.instagram) details += `▪️ *📸 Instagram:* ${cardData.instagram}\n`;
      if (cardData.youtube) details += `▪️ *▶️ YouTube:* ${cardData.youtube}\n`;
      if (cardData.linkedin) details += `▪️ *🟦 LinkedIn:* ${cardData.linkedin}\n`;
      if (cardData.twitter) details += `▪️ *𝕏 Twitter/X:* ${cardData.twitter}\n`;
      if (cardData.telegram) details += `▪️ *✈️ Telegram:* ${cardData.telegram}\n`;

      return details;
    };

    // Get user referral code (assuming it's in cardData or user data)
    const referralCode = cardData.referralCode || "QP8B385Q"; // Default fallback
    const referralLink = `https://play.google.com/store/apps/details?id=com.instantllycards.www.twa&referrer=utm_source%3Dreferral%26utm_campaign%3D${referralCode}`;

    switch (shareMethod) {
      case "whatsapp":
        // Share via WhatsApp with complete card details matching Instantlly template
        const whatsappMessage =
          buildCardDetails() +
          `▪️ *To make your FREE Instantly Digital Visiting Card Touch this link to Download the Mobile App*\n${referralLink}\n\n` +
          `▪️ *Make Free Digital Card from Instantly Cards Mobile App* You can Make Send Receive Unlimited Digital Cards & do Group Sharing with 100+ persons in 5 Minutes & if you change any information in your Card then it Changes automatically in all the Cards you have already sent.\n\n` +
          `▪️ *Save ₹10000 Printing Cost* Use this Free App & Save per year visiting Card Printing Cost\n\n` +
          `▪️ *Video to Know Advantage of the Application & How to use it* https://drive.google.com/drive/folders/1ZkLP2dFwOkaBk-najKBIxLXfXUqw8C8l?usp=sharing\n\n` +
          `▪️ *If you have any problem then join this WhatsApp Group and write the Problem you are getting* https://chat.whatsapp.com/G2bHGLYnlKRETTt7sxtqDl\n\n` +
          `▪️ *Earn upto ₹6000+ per day* Without Investment by sharing to WhatsApp Groups\n` +
          `▪️ *I Got ₹300 Credit* On Self Download\n` +
          `▪️ *Referal Bonus ₹300* On your Download I will get ₹300 Bonus\n\n` +
          `▪️ *Website* www.Instantlly.Com`;

        try {
          await Share.open({
            title: `${companyName}'s Business Card`,
            message: whatsappMessage,
            url: `file://${uri}`,
            type: "image/png",
            filename: fileName,
          });
        } catch (whatsappError: any) {
          // If specific share fails, try generic share
          if (whatsappError.message !== "User did not share") {
            console.log("Retrying WhatsApp share with generic method...");
            await Share.open({
              title: `${companyName}'s Business Card`,
              message: whatsappMessage,
              url: `file://${uri}`,
              type: "image/png",
            });
          } else {
            throw whatsappError;
          }
        }
        break;

      case "save":
        // Save to device
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Save Business Card",
            UTI: "public.png",
          });
        } else {
          throw new Error("Sharing is not available on this device");
        }
        break;

      case "native":
      default:
        // Use native share sheet
        const shareMessage =
          `${companyName}'s Digital Business Card\n\n` +
          `🎯 Create your FREE Digital Visiting Card with Instantlly Cards!\n` +
          `📱 https://play.google.com/store/apps/details?id=com.instantllycards.www.twa`;

        if (Platform.OS === "android") {
          await Share.open({
            title: `${companyName}'s Business Card`,
            message: shareMessage,
            url: `file://${uri}`,
            type: "image/png",
            filename: fileName,
          });
        } else {
          // iOS
          await Share.open({
            title: `${companyName}'s Business Card`,
            message: shareMessage,
            url: uri,
            type: "image/png",
            filename: fileName,
          });
        }
        break;
    }

    console.log("✅ Card shared successfully");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error generating/sharing card image:", error);

    // Handle specific errors
    if (error.message?.includes("User did not share")) {
      console.log("ℹ️ User cancelled sharing");
      return { success: false, error: "cancelled" };
    }

    return {
      success: false,
      error: error.message || "Failed to generate card image",
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
  cardData: any,
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    // Check if native modules are available
    if (!captureRef || !FileSystem) {
      return {
        success: false,
        error: "native_module_not_available",
      };
    }

    console.log("📸 Generating card image file...");

    const uri = await captureRef(viewRef, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });

    console.log("✅ Card image file generated:", uri);
    return { success: true, uri };
  } catch (error: any) {
    console.error("❌ Error generating card image file:", error);
    return {
      success: false,
      error: error.message || "Failed to generate card image",
    };
  }
}
