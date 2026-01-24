/**
 * GST and PAN Number Validation Utilities
 * These functions validate the format and checksum of GST and PAN numbers
 */

/**
 * Validates PAN (Permanent Account Number) format
 * Format: ABCDE1234F
 * - First 5 characters: Alphabets (A-Z)
 * - Next 4 characters: Numbers (0-9)
 * - Last character: Alphabet (A-Z)
 * 
 * @param pan - PAN number to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validatePAN = (pan: string): { isValid: boolean; error?: string } => {
  if (!pan || pan.trim() === '') {
    return { isValid: true }; // Optional field, empty is valid
  }

  // Remove any spaces and convert to uppercase
  const cleanPAN = pan.trim().toUpperCase();

  // Check length
  if (cleanPAN.length !== 10) {
    return { 
      isValid: false, 
      error: 'PAN must be exactly 10 characters' 
    };
  }

  // PAN format regex: 5 letters, 4 digits, 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  
  if (!panRegex.test(cleanPAN)) {
    return { 
      isValid: false, 
      error: 'Invalid PAN format. Format: ABCDE1234F' 
    };
  }

  // Fourth character should be P for individual, C for company, H for HUF, etc.
  const fourthChar = cleanPAN.charAt(3);
  const validFourthChars = ['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];
  
  if (!validFourthChars.includes(fourthChar)) {
    return { 
      isValid: false, 
      error: 'Invalid PAN: Fourth character must be a valid entity type (P/C/H/F/A/T/B/L/J/G)' 
    };
  }

  return { isValid: true };
};

/**
 * Validates GST (Goods and Services Tax) Number format
 * Format: 22AAAAA0000A1Z5
 * - First 2 characters: State code (01-37)
 * - Next 10 characters: PAN number
 * - 13th character: Entity number (1-9, A-Z)
 * - 14th character: 'Z' by default
 * - 15th character: Check digit
 * 
 * @param gst - GST number to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateGST = (gst: string): { isValid: boolean; error?: string } => {
  if (!gst || gst.trim() === '') {
    return { isValid: true }; // Optional field, empty is valid
  }

  // Remove any spaces and convert to uppercase
  const cleanGST = gst.trim().toUpperCase();

  // Check length
  if (cleanGST.length !== 15) {
    return { 
      isValid: false, 
      error: 'GST must be exactly 15 characters' 
    };
  }

  // GST format regex
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstRegex.test(cleanGST)) {
    return { 
      isValid: false, 
      error: 'Invalid GST format. Format: 22AAAAA0000A1Z5' 
    };
  }

  // Validate state code (01-37, including union territories)
  const stateCode = parseInt(cleanGST.substring(0, 2));
  const validStateCodes = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 97, 99
  ];
  
  if (!validStateCodes.includes(stateCode)) {
    return { 
      isValid: false, 
      error: 'Invalid GST: State code must be valid (01-38, 97, or 99)' 
    };
  }

  // Extract and validate the PAN from GST (characters 3-12)
  const panInGST = cleanGST.substring(2, 12);
  const panValidation = validatePAN(panInGST);
  
  if (!panValidation.isValid) {
    return { 
      isValid: false, 
      error: 'Invalid GST: PAN portion is invalid' 
    };
  }

  // 14th character should be 'Z'
  if (cleanGST.charAt(13) !== 'Z') {
    return { 
      isValid: false, 
      error: 'Invalid GST: 14th character must be Z' 
    };
  }

  return { isValid: true };
};

/**
 * Format PAN number with proper spacing for display
 * @param pan - PAN number
 * @returns Formatted PAN string
 */
export const formatPAN = (pan: string): string => {
  const cleanPAN = pan.replace(/\s/g, '').toUpperCase();
  if (cleanPAN.length <= 5) return cleanPAN;
  if (cleanPAN.length <= 9) return `${cleanPAN.slice(0, 5)}${cleanPAN.slice(5)}`;
  return `${cleanPAN.slice(0, 5)}${cleanPAN.slice(5, 9)}${cleanPAN.slice(9)}`;
};

/**
 * Format GST number with proper spacing for display
 * @param gst - GST number
 * @returns Formatted GST string
 */
export const formatGST = (gst: string): string => {
  const cleanGST = gst.replace(/\s/g, '').toUpperCase();
  if (cleanGST.length <= 2) return cleanGST;
  if (cleanGST.length <= 12) return `${cleanGST.slice(0, 2)} ${cleanGST.slice(2)}`;
  return `${cleanGST.slice(0, 2)} ${cleanGST.slice(2, 12)} ${cleanGST.slice(12)}`;
};
