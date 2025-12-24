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
  Share,
  Platform,
  Clipboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
    if (!selectedLanguage || !stats?.referralCode || !config) return;

    setLanguageModalVisible(false);

    try {
      // Generate Play Store link with referral code
      const playStoreUrl = `https://play.google.com/store/apps/details?id=com.instantllycards.www.twa&referrer=utm_source%3Dreferral%26utm_campaign%3D${stats.referralCode}`;
      
      const hindiMessage = `🎉 मुझे ₹200 क्रेडिट मिला!

मैंने यह ऐप डाउनलोड किया और मुझे ₹200 क्रेडिट मिला! यह ऐप विजिटिंग कार्ड मैनेजमेंट के लिए बहुत अच्छा है। इसके फायदे नीचे दिए गए वीडियो लिंक में दिखाए गए हैं:

▪️ आपको ₹200 क्रेडिट मिलेगा - जब आप डाउनलोड करेंगे तो आपको भी ₹300 क्रेडिट मिलेगा।

▪️ रेफरल से प्रतिदिन कितना कमा सकते हैं - अगर आप 6 ग्रुप में रेफरल मैसेज भेजते हैं और प्रत्येक ग्रुप में 500 सदस्य हैं, तो आपका मैसेज 3000 लोगों तक पहुंचेगा। सामान्यतः 20 से 50 लोग मोबाइल ऐप डाउनलोड करते हैं। 20 लोगों पर आपको प्रत्येक से ₹300 मिलेंगे, कुल ₹6000 प्रतिदिन!

▪️ रेफरल इनकम प्राप्त करने के लिए क्या करें - रेफरल मैसेज और रेफरल लिंक डाउनलोड करें और इस मैसेज व लिंक को अपने व्हाट्सऐप ग्रुप में भेजें।

📱 अभी डाउनलोड करें (Play Store):
${playStoreUrl}

▪️ एप्लिकेशन के फायदे और इसका उपयोग कैसे करें, देखने के लिए वीडियो:
https://drive.google.com/drive/folders/1ZkLP2dFwOkaBk-najKBIxLXfXUqw8C8l?usp=sharing

▪️ अगर आपको कोई समस्या है तो इस व्हाट्सऐप ग्रुप में जुड़ें और अपनी समस्या लिखें। यदि आपको इस एप्लिकेशन का उपयोग करने में कोई प्रश्न या समस्या है तो आप यहां पूछ सकते हैं:
https://chat.whatsapp.com/G2bHGLYnlKRETTt7sxtqDl

▪️ चैनल पार्टनर बनने के लिए वीडियो लिंक:
https://drive.google.com/drive/folders/1W8AqKhg67PyxQtRIH50hmknzD1Spz6mo?usp=sharing

▪️ धन्यवाद`;

      const englishMessage = `🎉 I Got Rs 200 Credit!

I have downloaded this app & Got Rs 200 Credit! The app is very good for Visiting Card Management. Advantages are shown in the video link given below:

▪️ You will get Rs 200 Credit - When you download, you will also get Rs. 300 Credit.

▪️ How much you can earn per day by Referral - If you send Referral Message to 6 Groups & in each group 500 persons are members, then your message will go to 3000 persons. Normally 20 to 50 persons download the Mobile App, so on 20 Persons you get ₹300 each, total is Rs. 6000 per day!

▪️ What to do for Getting Referral Income - Download the Referral Message & Referral Link & Send this Message & Link to your WhatsApp Groups.

📱 Download now (Play Store):
${playStoreUrl}

▪️ Video to See the Advantage of the Application & How to use it:
https://drive.google.com/drive/folders/1ZkLP2dFwOkaBk-najKBIxLXfXUqw8C8l?usp=sharing

▪️ If you have any problem then join this WhatsApp Group and write the Problem you are getting. If you have any questions or problems in using this application then you can ask here:
https://chat.whatsapp.com/G2bHGLYnlKRETTt7sxtqDl

▪️ Video Link for becoming Channel Partner Explanation:
https://drive.google.com/drive/folders/1W8AqKhg67PyxQtRIH50hmknzD1Spz6mo?usp=sharing

▪️ Thank You`;

      const message = selectedLanguage === 'hindi' ? hindiMessage : englishMessage;

      // Open share dialog with the message
      await Share.share({
        message: message,
        title: selectedLanguage === 'hindi' ? 'InstantllyCards में शामिल हों' : 'Join InstantllyCards'
      });

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
        {/* Credits Balance Banner */}
        <View style={styles.creditsBannerContainer}>
          <TouchableOpacity 
            style={styles.creditsBanner}
            onPress={() => router.push('/referral/credits-history')}
            activeOpacity={0.7}
          >
            <View style={styles.creditsContent}>
              <Text style={styles.creditsLabel}>Your Balance</Text>
              <Text style={styles.creditsAmount}>{userCredits.toLocaleString()}</Text>
              <Text style={styles.creditsUnit}>Credits</Text>
            </View>
            <View style={styles.creditsIconCircle}>
              <Ionicons name="wallet" size={32} color="#10B981" />
            </View>
          </TouchableOpacity>
          <View style={styles.creditsHintContainer}>
            <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
            <Text style={styles.creditsHintText}> Tap to view transaction history</Text>
          </View>
        </View>

        {/* Track Referral Status Button */}
        <TouchableOpacity 
          style={styles.trackStatusButton}
          onPress={() => router.push('/referral/track-status')}
        >
          <Ionicons name="trending-up" size={20} color="#FFFFFF" />
          <Text style={styles.trackStatusText}>Track Referral Status</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="people" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{stats?.totalReferrals || 0}</Text>
            <Text style={styles.statLabel}>Friends Invited</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="gift" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats?.totalCreditsEarned || 0}</Text>
            <Text style={styles.statLabel}>Credits Earned</Text>
          </View>
        </View>

        {/* Referral Link Card */}
        <View style={styles.referralLinkCard}>
          <Text style={styles.referralLinkTitle}>Your Referral Link</Text>
          <Text style={styles.referralLinkSubtitle}>Share this link with friends</Text>
          
          <View style={styles.codeBox}>
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>CODE:</Text>
              <Text style={styles.codeText}>
                {stats?.referralCode ? stats.referralCode : 'Loading...'}
              </Text>
              <Text style={styles.linkText}>
                instantllycards.com/signup?ref={stats?.referralCode || 'Loading'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCopyLink} style={styles.copyIconButton}>
              <Ionicons name="link" size={20} color="#8B5CF6" />
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareButtonMain} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonMainText}>Share via WhatsApp, SMS & More</Text>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksCard}>
          <View style={styles.howItWorksHeader}>
            <Text style={styles.howItWorksIcon}>💡</Text>
            <Text style={styles.howItWorksTitle}>How It Works</Text>
          </View>
          
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Share your referral link via WhatsApp, SMS, or any app
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Your friend signs up using your link and gets {config?.signupBonus || 200} credits
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                You earn {config?.referralReward || 300} credits for each successful referral
              </Text>
            </View>
          </View>
        </View>
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
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  creditsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  creditsHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  creditsHintText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  creditsContent: {
    flex: 1,
  },
  creditsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  creditsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 2,
  },
  creditsUnit: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  creditsIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  trackStatusText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  referralLinkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  referralLinkTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  referralLinkSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codeSection: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 8,
    letterSpacing: 1,
  },
  linkText: {
    fontSize: 12,
    color: '#8B5CF6',
  },
  copyIconButton: {
    alignItems: 'center',
    paddingLeft: 12,
    gap: 4,
  },
  copyText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  shareButtonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  shareButtonMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  howItWorksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  howItWorksIcon: {
    fontSize: 24,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    paddingTop: 6,
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
