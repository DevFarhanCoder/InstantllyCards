# Version 1.0.17 Release Notes

**Release Date:** October 25, 2025  
**Version Code:** 17  
**Version Name:** 1.0.17  
**Package:** com.instantllycards.www.twa

---

## Overview

Version 1.0.17 represents a critical infrastructure update for Instantlly Cards, focused on backend migration and improved reliability. This release successfully migrates the application from the legacy backend server (`https://instantlly-cards-backend.onrender.com`) to a new, optimized infrastructure (`https://instantlly-cards-backend-6ki0.onrender.com`), ensuring better performance, scalability, and reliability for all users. The migration has been executed seamlessly with full backward compatibility, meaning all existing user data, saved cards, and preferences remain intact and accessible without any user intervention required.

## Backend Infrastructure Improvements

The primary focus of this release is the backend API migration, which was necessitated by infrastructure optimization needs. The new backend server provides enhanced reliability and performance characteristics while maintaining complete feature parity with the previous system. All environment configurations have been updated across both the mobile application and the admin dashboard to ensure synchronized operation. The migration process included comprehensive testing to verify data integrity, API compatibility, and seamless user experience during the transition. Users will experience the same familiar interface and functionality, with the added benefit of improved backend response times and system stability.

## Feature Set and Capabilities

Instantlly Cards continues to provide a comprehensive digital business card management solution. Users can create and manage unlimited digital visiting cards with detailed personal and company information sections. The app supports extensive customization including social media integration for LinkedIn, Facebook, Instagram, Twitter, YouTube, and Telegram profiles. Google Maps integration allows users to add precise location information with direct map links for both personal and company addresses. Custom keywords and services tags enable better categorization and searchability of business cards.

The sharing capabilities remain robust and versatile, with WhatsApp sharing featuring professionally formatted business card details that include all personal information, company details, social media links, and a promotional message encouraging recipients to download the app. Users can also share cards via email, SMS, and other messaging applications. The QR code generation feature provides instant card sharing capabilities, while the group sharing feature enables bulk distribution to multiple contacts simultaneously. All shared cards maintain consistent formatting and include the Google Play Store link for easy app discovery.

## Security and User Experience

Security remains a top priority with OTP-based phone verification powered by Fast2SMS integration, ensuring reliable and secure user authentication. Firebase integration provides robust backend authentication services while maintaining strict user data privacy and protection standards. The modern orange-themed UI design offers an attractive and intuitive user interface with smooth animations and transitions powered by React Native Reanimated. Toast notifications provide clear feedback for user actions, while optimized performance ensures a responsive experience across all supported Android devices running Android 7.0 (API 24) and above.

## Technical Implementation

This release was built using React Native with Expo SDK 54, leveraging TypeScript for enhanced code quality and type safety. The build process utilized 922 npm packages with zero known vulnerabilities, and all latest security patches have been applied. The application targets Android 14 (API 35) while maintaining compatibility down to Android 7.0 (API 24), ensuring broad device support. The final AAB package size is approximately 72.7 MB and was successfully built in 33 minutes and 40 seconds using Gradle 8.14.3 with optimized build configurations.

## Deployment and Distribution

The admin dashboard has been updated and deployed to Vercel at `https://instantlly-admin.vercel.app` with matching backend URL configurations, providing real-time card management capabilities for administrators. The release package has been signed with the verified production keystore (SHA1: 1F:DF:AC:2C:44:A9:55:D9:A7:65:AC:C0:A4:74:67:F5:E2:AE:9B:58), ensuring compatibility with existing Google Play Store configuration and automatic update delivery to all existing users.

## User Impact and Upgrade Process

Existing users will receive this update automatically through the Google Play Store with no action required on their part. All saved cards, contact information, and user preferences will be preserved during the update process. The backend migration is completely transparent to end users, who will continue to enjoy the same familiar interface and functionality. The app will automatically connect to the new backend server upon first launch after the update, with no configuration or login required. Users can expect the same or improved performance with enhanced backend reliability.

## Bug Fixes and Improvements

This release addresses several technical issues including backend connectivity problems that occasionally affected card synchronization, environment variable configuration issues that could impact certain deployment scenarios, and build stability improvements for development environments. The Gradle cache corruption issues encountered during development have been resolved through optimized build processes and better cache management strategies.

## Looking Forward

The development team remains committed to continuous improvement and will monitor backend performance closely following this migration. User feedback will be actively collected and analyzed to inform future feature enhancements and optimizations. Regular security updates will continue to be applied to ensure the highest standards of data protection and privacy. Future releases will focus on new features requested by the user community while maintaining the stability and reliability users have come to expect from Instantlly Cards.

---

**Built with ❤️ by the Instantlly Cards Team**
