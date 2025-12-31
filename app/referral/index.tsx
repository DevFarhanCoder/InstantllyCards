import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Platform,
  Clipboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import RNShare from 'react-native-share';
import { downloadAsync, cacheDirectory } from 'expo-file-system/legacy';
import api from '@/lib/api';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalCreditsEarned: number;
  recentReferrals: Array<{
    name: string;
    phone: string;
    createdAt: string;
  }>;
}

interface CreditConfig {
  signupBonus: number;
  referralReward: number;
}

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [config, setConfig] = useState<CreditConfig | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'hindi' | 'english' | null>(null);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      
      // Fetch referral stats, credit config, and user balance
      const [statsResponse, configResponse, creditsResponse] = await Promise.all([
        api.get('/credits/referral-stats'),
        api.get('/credits/config'),
        api.get('/credits/balance')
      ]);
      
      console.log('📊 Referral Stats Response:', JSON.stringify(statsResponse, null, 2));
      console.log('🔑 Referral Code:', statsResponse?.referralCode);
      console.log('🔍 Full stats object:', statsResponse);
      
      setStats(statsResponse);
      setConfig(configResponse.config);
      setUserCredits(creditsResponse.credits || 0);
      
      // Force a re-render check
      console.log('✅ State updated - referralCode should be:', statsResponse?.referralCode);
    } catch (error) {
      console.error('Error loading referral data:', error);
      Alert.alert('Error', 'Failed to load referral information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReferralData(true);
  };

  const handleShare = async () => {
    if (!stats?.referralCode || !config) return;
    
    // Reset language selection and show modal
    setSelectedLanguage(null);
    setLanguageModalVisible(true);
  };

  const handleLanguageSelect = (language: 'hindi' | 'english') => {
    setSelectedLanguage(language);
  };

  const handleShareWithLanguage = async () => {
    if (!selectedLanguage || !stats?.referralCode) return;

    setLanguageModalVisible(false);

    try {
      // Include referral code in Play Store URL for tracking
      const playStoreUrl = `https://play.google.com/store/apps/details?id=com.instantllycards.www.twa&referrer=utm_source%3Dreferral%26utm_campaign%3D${stats.referralCode}`;

      const hindiMessage = `*बिना किसी निवेश के रोज़ाना ₹1200 से ₹6000+ कमाने का अवसर*

▪️ *मुझे ₹200 का क्रेडिट मिला* मैंने यह ऐप डाउनलोड किया और मुझे तुरंत ₹200 का क्रेडिट मिला। विजिटिंग कार्ड मैनेजमेंट के लिए यह ऐप बहुत बेहतरीन है। इसके फायदों को नीचे दिए गए वीडियो लिंक में देखा जा सकता है
▪️ *आपको भी ₹200 मिलेंगे* जब आप इस ऐप को डाउनलोड करेंगे, तो आपको भी ₹200 का क्रेडिट मिलेगा।
▪️ *₹300 रेफरल बोनस* आपके डाउनलोड करने पर मुझे ₹300 का क्रेडिट मिलेगा। इसी तरह, जब कोई आपके लिंक से डाउनलोड करेगा, तो आपको भी ₹300 मिलेंगे।
▪️ *रोज़ाना ₹6000 कैसे कमाएं* यदि आप अपना रेफरल मैसेज 6 ग्रुप्स में भेजते हैं और हर ग्रुप में 500 सदस्य हैं, तो आपका मैसेज 3000 लोगों तक पहुँचेगा। सामान्य तौर पर, कम से कम 20 से 50 लोग ऐप डाउनलोड करते हैं। अगर 20 लोग भी डाउनलोड करते हैं, तो ₹300 के हिसाब से आपकी रोज़ाना की कमाई ₹6000 हो जाएगी।
▪️ *रेफरल आय के लिए क्या करें?* अपना रेफरल मैसेज और लिंक डाउनलोड करें और इसे अपने व्हाट्सएप ग्रुप्स में शेयर करें।

*महत्वपूर्ण लिंक:*
▪️ *ऐप डाउनलोड करने के लिए यहाँ क्लिक करें* ${playStoreUrl}
▪️ *ऐप के फायदे और उपयोग जानने के लिए वीडियो* https://drive.google.com/drive/folders/1ZkLP2dFwOkaBk-najKBIxLXfXUqw8C8l?usp=sharing
▪️ *सहायता के लिए व्हाट्सएप ग्रुप: यदि आपको कोई समस्या आती है, तो इस ग्रुप से जुड़ें और अपनी समस्या लिखें* https://chat.whatsapp.com/G2bHGLYnlKRETTt7sxtqDl
▪️ *चैनल पार्टनर बनने की पूरी जानकारी के लिए वीडियो* https://drive.google.com/drive/folders/1W8AqKhg67PyxQtRIH50hmknzD1Spz6mo?usp=sharing`;

      const englishMessage = `*Without Investment Earning Opportunity of ₹1200 to ₹6000+ per day*

▪️ *I Got ₹200 Credit* I have downloaded this app & Got ₹200 Credit & App is very good for Visiting Card Management Advantage is shown in the video link given below
▪️ *You will get ₹200 Credit* When you down load you will also get ₹200 Credit.
▪️ *Referal Bonus ₹300 Credit* When you down load i will also get ₹300 Credit.
▪️ *How to earn ₹6000 per day* If you send Referal Message to 6 Groups & in each group 500 persons are member then your message will go to 3000 persons & normally 20 to 50 person down load the Mobile App so on 20 Person you get ₹300 each so Total is ₹6000 per day
▪️ *What to do for Getting Referal Income* Download the Referal Message & Referal Link & Send this Message & Link to your WhatsApp Groups

*Important Links*
▪️ *Touch this link to Download the App* ${playStoreUrl}
▪️ *Video to Know Advantage of the Application & How to use it* https://drive.google.com/drive/folders/1ZkLP2dFwOkaBk-najKBIxLXfXUqw8C8l?usp=sharing
▪️ *If you have any problem then join this whatsApp Group and write the Problem you are getting* https://chat.whatsapp.com/G2bHGLYnlKRETTt7sxtqDl
▪️ *Video for Channel Partner Explanation* https://drive.google.com/drive/folders/1W8AqKhg67PyxQtRIH50hmknzD1Spz6mo?usp=sharing`;

      const message = selectedLanguage === 'hindi' ? hindiMessage : englishMessage;
      
      // Get image resource based on language
      const imageSource = selectedLanguage === 'hindi'
        ? require('@/assets/images/Channel Partner Website Creatives_Download App_Hindi.jpg')
        : require('@/assets/images/Channel Partner Website Creatives_Download App_Eng.jpg');
      
      const resolvedImage = Image.resolveAssetSource(imageSource);
      
      // Copy the asset to a shareable location using expo-file-system
      const filename = selectedLanguage === 'hindi' ? 'referral_hindi.jpg' : 'referral_english.jpg';
      const destPath = `${cacheDirectory}${filename}`;
      
      // Download the asset to file system
      await downloadAsync(resolvedImage.uri, destPath);
      
      // Share image with text message
      const shareOptions = {
        message: message,
        url: destPath,
        type: 'image/jpeg',
        subject: selectedLanguage === 'hindi' ? 'InstantllyCards में शामिल हों' : 'Join InstantllyCards',
      };
      
      await RNShare.open(shareOptions);

    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Error sharing:', error);
        Alert.alert(
          'Error',
          'Failed to share message. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleCopyLink = () => {
    if (!stats?.referralCode) return;
    const referralLink = `instantllycards.com/signup?ref=${stats.referralCode}`;
    Clipboard.setString(referralLink);
    Alert.alert('Copied!', 'Referral link copied to clipboard');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referral Program</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral Program</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
      >

        <TouchableOpacity 
          style={styles.creditsBannerContainer}
          onPress={() => router.push('/referral/credits-history' as any)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#ECFDF5', '#D1FAE5']}
            style={styles.creditsBanner}
          >
            <View style={styles.creditsContent}>
              <View style={styles.creditsLabelRow}>
                <Ionicons name="sparkles" size={16} color="#059669" />
                <Text style={styles.creditsLabel}>Available Balance Credit</Text>
              </View>
              <Text style={styles.creditsAmount}>{String(userCredits || 0)}</Text>
              <Text style={styles.creditsUnit}>Ready to use</Text>
            </View>
            <View style={styles.creditsIconCircle}>
              <Ionicons name="wallet" size={36} color="#10B981" />
            </View>
          </LinearGradient>
          <View style={styles.creditsHintContainer}>
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text style={styles.creditsHintText}> View transaction history</Text>
            <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* Track Referral Status Button */}
        <TouchableOpacity 
          style={styles.trackStatusButton}
          onPress={() => router.push('/referral/track-status' as any)}
        >
          <Ionicons name="trending-up" size={20} color="#FFFFFF" />
          <Text style={styles.trackStatusText}>Track Referral Status</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="people" size={26} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{stats?.totalReferrals || 0}</Text>
            <Text style={styles.statLabel}>Successful</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="gift" size={26} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats?.totalCreditsEarned || 0}</Text>
            <Text style={styles.statLabel}>Credits</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </View>

        {/* Referral Link Card */}
        <View style={styles.referralLinkCard}>
          <Text style={styles.referralLinkTitle}>Your Unique Code</Text>
          <Text style={styles.referralLinkSubtitle}>Share with friends to earn rewards</Text>
          
          <View style={styles.codeBox}>
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>REFERRAL CODE</Text>
              <Text style={styles.codeText}>
                {stats?.referralCode ? stats.referralCode : 'Loading...'}
              </Text>
              <View style={styles.linkPreview}>
                <Ionicons name="link-outline" size={12} color="#8B5CF6" />
                <Text style={styles.linkText} numberOfLines={1}>
                  instantllycards.com/signup?ref={stats?.referralCode || '...'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleCopyLink} style={styles.copyIconButton}>
              <View style={styles.copyCircle}>
                <Ionicons name="copy-outline" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareButtonMain} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonMainText}>Share Referral Link</Text>
            <Ionicons name="arrow-forward-circle" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.shareHint}>
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            <Ionicons name="chatbubbles" size={16} color="#007AFF" />
            <Ionicons name="mail" size={16} color="#EA4335" />
            <Text style={styles.shareHintText}>WhatsApp, SMS, Email & more</Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksCard}>
          <View style={styles.howItWorksHeader}>
            <View style={styles.howItWorksBadge}>
              <Text style={styles.howItWorksIcon}>💡</Text>
            </View>
            <View>
              <Text style={styles.howItWorksTitle}>How It Works</Text>
              <Text style={styles.howItWorksSubtitle}>3 simple steps to earn</Text>
            </View>
          </View>
          
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Share Your Link</Text>
                <Text style={styles.stepText}>
                  Send your unique code to friends via WhatsApp, SMS or any messaging app
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Friend Signs Up</Text>
                <Text style={styles.stepText}>
                  They download the app, register and receive <Text style={styles.highlight}>{config?.signupBonus || 200} bonus credits</Text>
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>You Both Win!</Text>
                <Text style={styles.stepText}>
                  You get <Text style={styles.highlight}>{config?.referralReward || 300} credits</Text> instantly when they complete signup
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.benefitsBanner}>
            <Ionicons name="trophy" size={20} color="#F59E0B" />
            <Text style={styles.benefitsText}>Unlimited referrals = Unlimited earnings!</Text>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Choose your preferred language for sharing</Text>

            <View style={styles.languageOptions}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'hindi' && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSelect('hindi')}
              >
                <Image 
                  source={require('@/assets/images/Channel Partner Website Creatives_Download App_Hindi.jpg')}
                  style={styles.languageImage}
                  resizeMode="cover"
                />
                <View style={styles.radioButton}>
                  {selectedLanguage === 'hindi' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageLabel}>हिंदी</Text>
                  <Text style={styles.languageSubLabel}>Hindi</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'english' && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSelect('english')}
              >
                <Image 
                  source={require('@/assets/images/Channel Partner Website Creatives_Download App_Eng.jpg')}
                  style={styles.languageImage}
                  resizeMode="cover"
                />
                <View style={styles.radioButton}>
                  {selectedLanguage === 'english' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageLabel}>English</Text>
                  <Text style={styles.languageSubLabel}>English</Text>
                </View>
              </TouchableOpacity>
            </View>

            {selectedLanguage && (
              <TouchableOpacity
                style={styles.shareNowButton}
                onPress={handleShareWithLanguage}
              >
                <Ionicons name="share-social" size={20} color="#FFFFFF" />
                <Text style={styles.shareNowButtonText}>Share Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  creditsBannerContainer: {
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  creditsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 22,
  },
  creditsHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 4,
  },
  creditsHintText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  creditsContent: {
    flex: 1,
  },
  creditsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  creditsLabel: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  creditsAmount: {
    fontSize: 40,
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 4,
  },
  creditsUnit: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  creditsIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  trackStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  trackStatusText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  statIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  referralLinkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  referralLinkTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  referralLinkSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 20,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    backgroundColor: '#FAF5FF',
  },
  codeSection: {
    flex: 1,
    paddingRight: 8,
  },
  codeLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 6,
    letterSpacing: 1.2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  codeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#8B5CF6',
    marginBottom: 8,
    letterSpacing: 2,
  },
  linkPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '500',
    flex: 1,
  },
  copyIconButton: {
    alignItems: 'center',
    gap: 6,
  },
  copyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyText: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '700',
  },
  shareButtonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    padding: 18,
    gap: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  shareButtonMainText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 8,
  },
  shareHintText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 4,
  },
  howItWorksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 12,
  },
  howItWorksBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  howItWorksIcon: {
    fontSize: 26,
  },
  howItWorksTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  howItWorksSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  stepsList: {
    gap: 0,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingVertical: 12,
  },
  stepNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    fontWeight: '400',
  },
  stepConnector: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
    marginLeft: 54,
  },
  highlight: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  benefitsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
    marginTop: 18,
    gap: 8,
  },
  benefitsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  // Language Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  languageOptions: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  languageImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  languageOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3E8FF',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B5CF6',
  },
  languageInfo: {
    flex: 1,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  languageSubLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  shareNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  shareNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
