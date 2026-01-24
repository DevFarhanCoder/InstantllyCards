import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface BusinessPromoteFormProps {
  visible: boolean;
  onClose: () => void;
}

type FormStep = 'business' | 'contact' | 'location';

export default function BusinessPromoteForm({ visible, onClose }: BusinessPromoteFormProps) {
  console.log('📋 BusinessPromoteForm: Rendering with visible =', visible);
  
  const [currentStep, setCurrentStep] = useState<FormStep>('business');
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    category: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: '',
    gstNumber: '',
    panNumber: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 'business') {
      setCurrentStep('contact');
    } else if (currentStep === 'contact') {
      setCurrentStep('location');
    }
  };

  const handleBack = () => {
    if (currentStep === 'location') {
      setCurrentStep('contact');
    } else if (currentStep === 'contact') {
      setCurrentStep('business');
    }
  };

  const handleSubmit = () => {
    // TODO: Implement submission logic
    console.log('Business Form Submitted:', formData);
    onClose();
    setCurrentStep('business'); // Reset to first step
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'business':
        return 'Business Information';
      case 'contact':
        return 'Contact Details';
      case 'location':
        return 'Location & Credentials';
      default:
        return 'Business Information';
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'business':
        return 1;
      case 'contact':
        return 2;
      case 'location':
        return 3;
      default:
        return 1;
    }
  };

  const renderBusinessInfo = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your business name"
          placeholderTextColor="#999"
          value={formData.businessName}
          onChangeText={(text) => updateField('businessName', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Owner Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          placeholderTextColor="#999"
          value={formData.ownerName}
          onChangeText={(text) => updateField('ownerName', text)}
        />
      </View>



      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Brief description of your business"
          placeholderTextColor="#999"
          value={formData.description}
          onChangeText={(text) => updateField('description', text)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>GST Number (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="22AAAAA0000A1Z5"
          placeholderTextColor="#999"
          value={formData.gstNumber}
          onChangeText={(text) => updateField('gstNumber', text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={15}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PAN Number (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="ABCDE1234F"
          placeholderTextColor="#999"
          value={formData.panNumber}
          onChangeText={(text) => updateField('panNumber', text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={10}
        />
      </View>
    </View>
  );

  const renderContactDetails = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="business@example.com"
          placeholderTextColor="#999"
          value={formData.email}
          onChangeText={(text) => updateField('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="+91 98765 43210"
          placeholderTextColor="#999"
          value={formData.phone}
          onChangeText={(text) => updateField('phone', text)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>WhatsApp Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+91 98765 43210"
          placeholderTextColor="#999"
          value={formData.whatsapp}
          onChangeText={(text) => updateField('whatsapp', text)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Website (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="www.yourbusiness.com"
          placeholderTextColor="#999"
          value={formData.website}
          onChangeText={(text) => updateField('website', text)}
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderLocation = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Address *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Street address, building, landmark"
          placeholderTextColor="#999"
          value={formData.address}
          onChangeText={(text) => updateField('address', text)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor="#999"
            value={formData.city}
            onChangeText={(text) => updateField('city', text)}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            placeholder="State"
            placeholderTextColor="#999"
            value={formData.state}
            onChangeText={(text) => updateField('state', text)}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PIN Code *</Text>
        <TextInput
          style={styles.input}
          placeholder="123456"
          placeholderTextColor="#999"
          value={formData.pincode}
          onChangeText={(text) => updateField('pincode', text)}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={styles.formWrapper}
          >
            <View style={styles.formContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTop}>
                  <Text style={styles.headerTitle}>Business Promotion</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                {/* Step Indicator */}
                <View style={styles.stepIndicator}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, currentStep === 'business' && styles.stepCircleActive]}>
                      <Text style={[styles.stepNumber, currentStep === 'business' && styles.stepNumberActive]}>1</Text>
                    </View>
                    <Text style={[styles.stepLabel, currentStep === 'business' && styles.stepLabelActive]}>Business</Text>
                  </View>
                  <View style={styles.stepLine} />
                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, currentStep === 'contact' && styles.stepCircleActive]}>
                      <Text style={[styles.stepNumber, currentStep === 'contact' && styles.stepNumberActive]}>2</Text>
                    </View>
                    <Text style={[styles.stepLabel, currentStep === 'contact' && styles.stepLabelActive]}>Contact</Text>
                  </View>
                  <View style={styles.stepLine} />
                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, currentStep === 'location' && styles.stepCircleActive]}>
                      <Text style={[styles.stepNumber, currentStep === 'location' && styles.stepNumberActive]}>3</Text>
                    </View>
                    <Text style={[styles.stepLabel, currentStep === 'location' && styles.stepLabelActive]}>Location</Text>
                  </View>
                </View>
              </View>

              {/* Step Title */}
              <View style={styles.stepTitleContainer}>
                <Text style={styles.stepTitle}>{getStepTitle()}</Text>
                <Text style={styles.stepSubtitle}>Step {getStepNumber()} of 3</Text>
              </View>

              {/* Form Content */}
              <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {currentStep === 'business' && renderBusinessInfo()}
                {currentStep === 'contact' && renderContactDetails()}
                {currentStep === 'location' && renderLocation()}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {currentStep !== 'business' && (
                  <TouchableOpacity 
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={handleBack}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.buttonSecondaryText}>Back</Text>
                  </TouchableOpacity>
                )}
                
                {currentStep !== 'location' ? (
                  <TouchableOpacity 
                    style={[styles.button, styles.buttonPrimary, currentStep === 'business' && styles.buttonFull]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonPrimaryText}>Save & Continue</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.button, styles.buttonPrimary]}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonPrimaryText}>Submit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  formWrapper: {
    width: '100%',
    maxWidth: screenWidth * 0.95,
    maxHeight: screenHeight * 0.92,
  },
  formContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  stepLine: {
    height: 2,
    flex: 0.8,
    backgroundColor: '#E5E7EB',
    marginBottom: 30,
  },
  stepTitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 10,
  },
  stepContent: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 13,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
