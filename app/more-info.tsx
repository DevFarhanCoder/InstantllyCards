import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/lib/theme';

export default function MoreInfo() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#4F6AF3', '#6B7FFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>More Info</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Help & Support</Text>

          {/* Feedback Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('/feedback' as any)}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#4F6AF3', '#6B7FFF']}
                style={styles.iconCircle}
              >
                <Ionicons name="chatbox-ellipses" size={24} color={COLORS.white} />
              </LinearGradient>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Send Feedback</Text>
              <Text style={styles.optionDescription}>
                Share your thoughts and help us improve your experience
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#999" />
          </TouchableOpacity>

          {/* Change Password Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('/change-password' as any)}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.iconCircle}
              >
                <Ionicons name="lock-closed" size={24} color={COLORS.white} />
              </LinearGradient>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Change Password</Text>
              <Text style={styles.optionDescription}>
                Update your account password for better security
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  contentContainer: {
    marginTop: -10,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  iconContainer: {
    marginRight: 16,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
