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

    // Build card details message
    const buildCardDetails = () => {
      let details = "This is My Digital Visiting Card -\n\n";

      // Personal Information
      if (cardData.name) details += `👤 Name: ${cardData.name}\n`;
      if (cardData.birthDate)
        details += `🎂 Birth Date: ${cardData.birthDate}\n`;
      if (cardData.gender) details += `⚧️ Gender: ${cardData.gender}\n`;
      if (cardData.designation)
        details += `💼 Designation: ${cardData.designation}\n`;

      // Personal Contact
      const personalPhone = cardData.contact || cardData.personalPhone;
      if (personalPhone) {
        const cleanPhone = personalPhone.replace(/^\+\d+/, "").trim();
        details += `📱 Personal Phone: ${cleanPhone}\n`;
      }

      const personalEmail = cardData.email;
      if (personalEmail) details += `📧 Personal Email: ${personalEmail}\n`;

      const personalWebsite = cardData.website;
      if (personalWebsite)
        details += `🌐 Personal Website: ${personalWebsite}\n`;

      const personalLocation = cardData.location;
      if (personalLocation)
        details += `📍 Personal Location: ${personalLocation}\n`;

      const personalMapsLink = cardData.mapsLink;
      if (personalMapsLink)
        details += `🗺️ Personal Maps: ${personalMapsLink}\n`;

      // Business Information
      if (cardData.companyName)
        details += `🏢 Company: ${cardData.companyName}\n`;

      const companyPhone = cardData.companyContact || cardData.companyPhone;
      if (companyPhone) {
        const cleanPhone = companyPhone.replace(/^\+\d+/, "").trim();
        details += `☎️ Company Phone: ${cleanPhone}\n`;
      }

      const companyEmail = cardData.companyEmail;
      if (companyEmail) details += `📨 Company Email: ${companyEmail}\n`;

      const companyWebsite = cardData.companyWebsite;
      if (companyWebsite) details += `🌍 Company Website: ${companyWebsite}\n`;

      const companyAddress = cardData.companyAddress;
      if (companyAddress) details += `🏭 Company Address: ${companyAddress}\n`;

      const companyMapsLink = cardData.companyMapsLink;
      if (companyMapsLink) details += `🗺️ Company Maps: ${companyMapsLink}\n`;

      // Business Details
      if (cardData.aboutBusiness)
        details += `📝 About Business: ${cardData.aboutBusiness}\n`;
      if (cardData.businessHours) {
        const formattedHours = formatBusinessHours(cardData.businessHours);
        if (formattedHours) {
          details += `🕐 Business Hours:\n${formattedHours}\n`;
        }
      }
      if (cardData.establishedYear)
        details += `📅 Established: ${cardData.establishedYear}\n`;

      const message = cardData.message;
      if (message) details += `💬 Message: ${message}\n`;

      if (cardData.additionalInformation)
        details += `ℹ️ Additional Info: ${cardData.additionalInformation}\n`;

      // Social Media Links
      let socialAdded = false;
      if (
        cardData.linkedin ||
        cardData.twitter ||
        cardData.instagram ||
        cardData.facebook ||
        cardData.youtube ||
        cardData.whatsapp ||
        cardData.whatsappBusiness ||
        cardData.telegram
      ) {
        details += `\n🔗 Social Media:\n`;
        socialAdded = true;
      }

      if (cardData.linkedin) details += `   LinkedIn: ${cardData.linkedin}\n`;
      if (cardData.twitter) details += `   Twitter: ${cardData.twitter}\n`;
      if (cardData.instagram)
        details += `   Instagram: ${cardData.instagram}\n`;
      if (cardData.facebook) details += `   Facebook: ${cardData.facebook}\n`;
      if (cardData.youtube) details += `   YouTube: ${cardData.youtube}\n`;
      if (cardData.whatsapp) details += `   WhatsApp: ${cardData.whatsapp}\n`;
      if (cardData.whatsappBusiness)
        details += `   WhatsApp Business: ${cardData.whatsappBusiness}\n`;
      if (cardData.telegram) details += `   Telegram: ${cardData.telegram}\n`;

      return details;
    };

    // Get user referral code (assuming it's in cardData or user data)
    const referralCode = cardData.referralCode || "QP8B385Q"; // Default fallback
    const referralLink = `https://play.google.com/store/apps/details?id=com.instantllycards.www.twa&referrer=utm_source%3Dreferral%26utm_campaign%3D${referralCode}`;

    switch (shareMethod) {
      case "whatsapp":
        // Share via WhatsApp with complete card details
        const whatsappMessage =
          buildCardDetails() +
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
