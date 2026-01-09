import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../lib/theme';
import api from '../../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Question types
type QuestionType = 'yes-no' | 'text' | 'multiple-choice' | 'multi-select';

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  key: string;
  icon: string;
  emoji: string;
  options?: string[];
}

const QUESTIONS: Question[] = [
  { id: '1', text: 'Are you married?', type: 'yes-no', key: 'married', icon: 'heart', emoji: '💑' },
  { id: '2', text: 'Do you have a bike?', type: 'yes-no', key: 'haveBike', icon: 'bicycle', emoji: '🏍️' },
  { id: '3', text: 'Do you have a car?', type: 'yes-no', key: 'haveCar', icon: 'car', emoji: '🚗' },
  { id: '4', text: 'Are you currently studying?', type: 'yes-no', key: 'studying', icon: 'school', emoji: '📚' },
  { id: '5', text: 'Are you on a job?', type: 'yes-no', key: 'onJob', icon: 'briefcase', emoji: '💼' },
  { id: '6', text: 'Do you own a business?', type: 'yes-no', key: 'business', icon: 'business', emoji: '🏢' },
  { id: '7', text: 'Are you a freelancer?', type: 'yes-no', key: 'freeLancer', icon: 'laptop', emoji: '💻' },
  { id: '8', text: 'What languages can you speak, read, and type?', type: 'multi-select', key: 'languages', icon: 'language', emoji: '🗣️', options: ['English', 'Hindi', 'Marathi', 'Other'] },
  { id: '9', text: 'Are you looking for a job?', type: 'yes-no', key: 'wantJob', icon: 'search', emoji: '🔍' },
  { id: '10', text: 'What is your pincode?', type: 'text', key: 'pincode', icon: 'location', emoji: '📍' },
];

const CREDITS_PER_QUESTION = 10;

export default function EarnCreditsScreen() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [showFinalBanner, setShowFinalBanner] = useState(false);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [confettiAnim] = useState(new Animated.Value(0));
  const [userProgress, setUserProgress] = useState<{
    answeredQuestions: string[];
    totalEarned: number;
  }>({ answeredQuestions: [], totalEarned: 0 });

  const scrollViewRef = useRef<ScrollView>(null);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const totalQuestions = QUESTIONS.length;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  useEffect(() => {
    fetchUserProgress();
  }, []);

  useEffect(() => {
    // Animate in new question with bounce effect
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.9);
    
    // Reset input states when changing questions
    setTextInput('');
    setSelectedOption('');
    setSelectedLanguages([]);
    setShowOtherInput(false);
    setShowFinalBanner(false);
    
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentQuestionIndex]);

  const fetchUserProgress = async () => {
    try {
      setLoading(true);
      
      // Try to load from local storage first
      const savedProgress = await AsyncStorage.getItem('quiz_progress');
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        setUserProgress({
          answeredQuestions: progressData.answeredQuestions || [],
          totalEarned: progressData.totalEarned || 0,
        });
        setAnswers(progressData.answers || {});
        
        if (progressData.completed) {
          setShowCompletionBanner(true);
          return;
        }
        
        const firstUnanswered = QUESTIONS.findIndex(
          q => !progressData.answeredQuestions?.includes(q.key)
        );
        
        if (firstUnanswered !== -1) {
          setCurrentQuestionIndex(firstUnanswered);
        }
        return;
      }
      
      // If no local storage, try backend (will fail silently)
      const response = await api.get('/quiz/progress');
      if (response.success && response.data) {
        const { answeredQuestions, creditsEarned, currentQuestionIndex: savedIndex, answers: savedAnswers, completed } = response.data;
        
        setUserProgress({
          answeredQuestions: answeredQuestions || [],
          totalEarned: creditsEarned || 0,
        });
        
        setAnswers(savedAnswers || {});
        
        if (completed) {
          setShowCompletionBanner(true);
          return;
        }
        
        const firstUnanswered = QUESTIONS.findIndex(
          q => !answeredQuestions?.includes(q.key)
        );
        
        if (firstUnanswered !== -1) {
          setCurrentQuestionIndex(firstUnanswered);
        } else if (savedIndex !== undefined) {
          setCurrentQuestionIndex(Math.min(savedIndex, QUESTIONS.length - 1));
        }
      }
    } catch (error: any) {
      // Silently handle errors (quiz endpoints not fully implemented yet)
      // Don't log or alert - fail gracefully
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    const questionKey = currentQuestion.key;
    
    // Check if this question was already answered
    const alreadyAnswered = userProgress.answeredQuestions.includes(questionKey);
    
    // If already answered, show alert and return
    if (alreadyAnswered) {
      Alert.alert(
        'Already Answered',
        'You have already answered this question. Credits are awarded only once per question.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Celebration animation
    Animated.sequence([
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Update local state
    setAnswers(prev => ({ ...prev, [questionKey]: answer }));
    
    // Submit to backend
    setSubmitting(true);
    try {
      const response = await api.post('/quiz/answer', {
        questionKey,
        answer,
        questionIndex: currentQuestionIndex
      });

      if (response.success) {
        const creditsEarned = response.data.creditsEarned || CREDITS_PER_QUESTION;
        const isCompleted = response.data.completed || false;
        
        const updatedAnsweredQuestions = response.data.answeredQuestions || [...userProgress.answeredQuestions, questionKey];
        
        setUserProgress(prev => ({
          answeredQuestions: updatedAnsweredQuestions,
          totalEarned: response.data.totalCreditsFromQuiz || prev.totalEarned + creditsEarned,
        }));

        // Check if quiz is completed - all 10 questions must be answered
        const allQuestionsAnswered = updatedAnsweredQuestions.length >= QUESTIONS.length;
        
        if (isCompleted || allQuestionsAnswered) {
          // All questions answered - show final banner then completion
          setShowFinalBanner(true);
          setTimeout(() => {
            showCompletionScreen();
          }, 2000);
        } else {
          // Find next unanswered question
          const nextUnanswered = QUESTIONS.findIndex(
            q => !updatedAnsweredQuestions.includes(q.key)
          );
          
          if (nextUnanswered !== -1) {
            setCurrentQuestionIndex(nextUnanswered);
          } else {
            // Fallback: move to next question
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          }
          setTextInput('');
        }
      }
    } catch (error: any) {
      // Handle any quiz submission errors gracefully - operate in demo mode
      const errorMsg = error?.message || '';
      const isQuizNotImplemented = 
        errorMsg.includes('404') || 
        errorMsg.includes('Cannot POST') || 
        errorMsg.includes('Cannot GET') ||
        errorMsg.includes('Server error') ||
        errorMsg.includes('HTML error page');
      
      if (isQuizNotImplemented) {
        // Quiz endpoints not available - continue in demo mode
        const newAnsweredQuestions = [...userProgress.answeredQuestions, questionKey];
        const newTotalEarned = userProgress.totalEarned + CREDITS_PER_QUESTION;
        
        setUserProgress({
          answeredQuestions: newAnsweredQuestions,
          totalEarned: newTotalEarned,
        });
        
        // Save progress to local storage
        const updatedProgress = {
          answeredQuestions: newAnsweredQuestions,
          totalEarned: newTotalEarned,
          answers: { ...answers, [questionKey]: answer },
          completed: newAnsweredQuestions.length >= QUESTIONS.length,
        };
        await AsyncStorage.setItem('quiz_progress', JSON.stringify(updatedProgress));
        
        // Move to next question
        if (currentQuestionIndex < totalQuestions - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setTextInput('');
        } else {
          showCompletionScreen();
        }
      } else {
        // Unknown error - still continue but log it
        console.warn('Quiz error:', errorMsg);
        // Continue in demo mode anyway
        const newAnsweredQuestions = [...userProgress.answeredQuestions, questionKey];
        const newTotalEarned = userProgress.totalEarned + CREDITS_PER_QUESTION;
        
        setUserProgress({
          answeredQuestions: newAnsweredQuestions,
          totalEarned: newTotalEarned,
        });
        
        // Save to local storage
        const updatedProgress = {
          answeredQuestions: newAnsweredQuestions,
          totalEarned: newTotalEarned,
          answers: { ...answers, [questionKey]: answer },
          completed: newAnsweredQuestions.length >= QUESTIONS.length,
        };
        await AsyncStorage.setItem('quiz_progress', JSON.stringify(updatedProgress));
        
        if (currentQuestionIndex < totalQuestions - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setTextInput('');
        } else {
          showCompletionScreen();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showCompletionScreen = () => {
    setShowCompletionBanner(true);
  };

  const handleQuit = () => {
    const earnedSoFar = userProgress.totalEarned;
    const questionsAnswered = userProgress.answeredQuestions.length;
    Alert.alert(
      'Quit Quiz?',
      `You've earned ${earnedSoFar} credits from ${questionsAnswered} questions.\n\nYour progress will be saved. You can continue later from where you left off.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: async () => {
            // Save progress to local storage before quitting
            try {
              const progressData = {
                answeredQuestions: userProgress.answeredQuestions,
                totalEarned: userProgress.totalEarned,
                answers: answers,
                completed: false,
              };
              await AsyncStorage.setItem('quiz_progress', JSON.stringify(progressData));
            } catch (error) {
              // Silently handle save errors
            }
            router.back();
          },
        },
      ]
    );
  };

  const skipQuestion = async () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTextInput('');
      setSelectedOption('');
      setSelectedLanguages([]);
      setShowOtherInput(false);
    } else {
      // Save progress to local storage before leaving
      try {
        const progressData = {
          answeredQuestions: userProgress.answeredQuestions,
          totalEarned: userProgress.totalEarned,
          answers: answers,
          completed: false,
        };
        await AsyncStorage.setItem('quiz_progress', JSON.stringify(progressData));
      } catch (error) {
        // Silently handle save errors
      }
      router.back();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setTextInput('');
      setSelectedOption('');
      setSelectedLanguages([]);
      setShowOtherInput(false);
    }
  };

  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(language)) {
        // Remove if already selected
        const updated = prev.filter(l => l !== language);
        // Hide other input if "Other" is deselected
        if (language === 'Other') {
          setShowOtherInput(false);
          setTextInput('');
        }
        return updated;
      } else {
        // Add if not selected
        if (language === 'Other') {
          setShowOtherInput(true);
          // Auto-scroll to show the text input after a short delay
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 300);
        }
        return [...prev, language];
      }
    });
  };

  const handleMultiSelectSubmit = () => {
    if (selectedLanguages.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one language.');
      return;
    }
    
    // Build answer string
    let answer = selectedLanguages.filter(l => l !== 'Other').join(', ');
    if (selectedLanguages.includes('Other') && textInput.trim()) {
      answer += (answer ? ', ' : '') + `Other: ${textInput.trim()}`;
    } else if (selectedLanguages.includes('Other') && !textInput.trim()) {
      Alert.alert('Input Required', 'Please specify the other language.');
      return;
    }
    
    handleAnswer(answer);
  };

  const handleOptionSelect = (option: string) => {
    if (option === 'Other') {
      setSelectedOption(option);
      setShowOtherInput(true);
    } else {
      setSelectedOption(option);
      setShowOtherInput(false);
      handleAnswer(option);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleAnswer(showOtherInput ? `Other: ${textInput.trim()}` : textInput.trim());
    } else {
      Alert.alert('Input Required', 'Please enter your answer before continuing.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // All questions answered - show completion banner
  if (showCompletionBanner) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.backgroundGradient}>
          <View style={styles.completionBannerContainer}>
            <Animated.View
              style={[
                styles.bonusCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={[styles.completionBonusGradient, { backgroundColor: '#673AB7' }]}>
                <View style={styles.bonusIconContainer}>
                  <Ionicons name="trophy" size={52} color="#fff" />
                </View>
                <Text style={styles.completionBonusTitle}>🎊 Congratulations!</Text>
                <Text style={styles.completionBonusText}>
                  You've completed all questions!{' \n'}
                  <Text style={styles.bonusAmount}>Total: 100 Credits Earned!</Text>
                </Text>
                <TouchableOpacity
                  style={styles.completionBannerButton}
                  onPress={async () => {
                    // Mark as completed in local storage
                    try {
                      const progressData = {
                        answeredQuestions: userProgress.answeredQuestions,
                        totalEarned: userProgress.totalEarned,
                        answers: answers,
                        completed: true,
                      };
                      await AsyncStorage.setItem('quiz_progress', JSON.stringify(progressData));
                    } catch (error) {
                      // Silently handle save errors
                    }
                    router.push('/(tabs)/home');
                  }}
                >
                  <View style={[styles.completionBannerButtonGradient, { backgroundColor: '#fff' }]}>
                    <Text style={styles.completionBannerButtonText}>Go to Home</Text>
                    <Ionicons name="arrow-forward-circle" size={22} color="#673AB7" />
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.backgroundGradient}>
        {/* Confetti Animation Overlay */}
        <Animated.View
          style={[
            styles.confettiOverlay,
            {
              opacity: confettiAnim,
              transform: [{
                scale: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.5],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.confettiText}>+10 🎉</Text>
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconContainer}>
                <View style={[styles.headerIconGradient, { backgroundColor: '#673AB7' }]}>
                  <Ionicons name="wallet" size={24} color="#fff" />
                </View>
              </View>
              <View>
                <Text style={styles.headerTitle}>Earn Credits</Text>
                <Text style={styles.headerSubtitle}>Answer & Get Rewarded</Text>
              </View>
            </View>
          </View>

          <View style={[styles.creditsDisplay, { backgroundColor: '#673AB7' }]}>
            <Ionicons name="gift" size={18} color="#fff" />
            <Text style={styles.creditsText}>{userProgress.totalEarned}</Text>
          </View>
        </View>

        {/* Info Tooltip Banner - Below Header */}
        <View style={styles.infoTooltipContainer}>
          <View style={[styles.infoTooltip, { backgroundColor: '#E8EAF6' }]}>
            <Ionicons name="information-circle-outline" size={22} color="#673AB7" />
            <Text style={styles.infoTooltipText}>
             If you  Answer  all the 10 questions you will earn 100 credits!
            </Text>
          </View>
        </View>

        {/* Circular Progress */}
        <View style={styles.circularProgressContainer}>
          <View style={styles.circularProgress}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressNumber}>{currentQuestionIndex + 1}</Text>
              <Text style={styles.progressTotal}>of {totalQuestions}</Text>
            </View>
          </View>
          <View style={styles.progressDots}>
            {QUESTIONS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index <= currentQuestionIndex && styles.dotActive,
                  index < currentQuestionIndex && styles.dotCompleted,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Card */}
          <Animated.View
            style={[
              currentQuestion.type === 'multiple-choice' ? styles.questionCardTransparent : styles.questionCard,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {/* Emoji Icon */}
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{currentQuestion.emoji}</Text>
            </View>

            {/* Question Text */}
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionLabel}>Question {currentQuestionIndex + 1}</Text>
              <Text style={styles.questionText}>{currentQuestion.text}</Text>
            </View>

            {/* Answer Options */}
            <View style={styles.answerContainer}>
              {currentQuestion.type === 'yes-no' ? (
                <View style={styles.yesNoContainer}>
                  <TouchableOpacity
                    style={styles.yesButton}
                    onPress={() => handleAnswer('Yes')}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.buttonGradient, { backgroundColor: '#673AB7' }]}>
                      {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={24} color="#fff" />
                          <Text style={styles.yesButtonText}>Yes</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.noButton}
                    onPress={() => handleAnswer('No')}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.buttonGradient, { backgroundColor: '#5F6368' }]}>
                      {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={24} color="#fff" />
                          <Text style={styles.noButtonText}>No</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              ) : currentQuestion.type === 'multiple-choice' ? (
                <View style={styles.multipleChoiceContainer}>
                  {currentQuestion.options?.map((option) => {
                    const isSelected = selectedOption === option;
                    const isAnswered = answers[currentQuestion.key];
                    return (
                      <TouchableOpacity
                        key={option}
                        style={styles.optionButton}
                        onPress={() => handleOptionSelect(option)}
                        disabled={submitting || !!isAnswered}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.optionGradient, { backgroundColor: isSelected ? '#673AB7' : '#fff' }]}>
                          <View style={styles.radioRow}>
                            <View style={styles.radioButton}>
                              {isSelected ? (
                                <Ionicons name="radio-button-on" size={24} color="#673AB7" />
                              ) : (
                                <Ionicons name="radio-button-off" size={24} color="#673AB7" />
                              )}
                            </View>
                            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  
                  {showOtherInput && (
                    <View style={styles.otherInputWrapper}>
                      <View style={styles.otherInputRow}>
                        <Ionicons name="create-outline" size={20} color="#667eea" style={styles.otherIcon} />
                        <TextInput
                          style={styles.otherTextInput}
                          placeholder="Type other language..."
                          placeholderTextColor="#999"
                          value={textInput}
                          onChangeText={setTextInput}
                          editable={!submitting}
                        />
                      </View>
                      <TouchableOpacity
                        style={[styles.submitButton, (!textInput.trim() || submitting) && styles.submitButtonDisabled]}
                        onPress={handleTextSubmit}
                        disabled={submitting || !textInput.trim()}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.submitButtonGradient, { backgroundColor: textInput.trim() ? '#673AB7' : '#9CA3AF' }]}>
                          {submitting ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <>
                              <Text style={styles.submitButtonText}>Submit Answer</Text>
                              <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
                            </>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : currentQuestion.type === 'multi-select' ? (
                <ScrollView 
                  ref={scrollViewRef}
                  style={styles.multiSelectScrollContainer} 
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.multiSelectContainer}>
                    <Text style={styles.multiSelectHint}>Select all that apply:</Text>
                    {currentQuestion.options?.map((option) => {
                      const isSelected = selectedLanguages.includes(option);
                      const isAnswered = answers[currentQuestion.key];
                      return (
                        <TouchableOpacity
                          key={option}
                          style={styles.checkboxButton}
                          onPress={() => handleLanguageToggle(option)}
                          disabled={submitting || !!isAnswered}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.checkboxGradient, isSelected && { backgroundColor: '#673AB7' }]}>
                            <View style={styles.checkboxRow}>
                              <View style={styles.checkbox}>
                                {isSelected ? (
                                  <Ionicons name="checkbox" size={24} color="#fff" />
                                ) : (
                                  <Ionicons name="square-outline" size={24} color="#673AB7" />
                                )}
                              </View>
                              <Text style={[styles.checkboxText, isSelected && styles.checkboxTextSelected]}>{option}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    
                    {selectedLanguages.includes('Other') && (
                      <View style={styles.otherInputWrapper}>
                        <View style={styles.otherInputRow}>
                          <Ionicons name="create-outline" size={20} color="#673AB7" style={styles.otherIcon} />
                          <TextInput
                            style={styles.otherTextInput}
                            placeholder="Type other language..."
                            placeholderTextColor="#999"
                            value={textInput}
                            onChangeText={setTextInput}
                            editable={!submitting}
                          />
                        </View>
                      </View>
                    )}
                    
                    {selectedLanguages.length > 0 && (
                      <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                        onPress={handleMultiSelectSubmit}
                        disabled={submitting}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.submitButtonGradient, { backgroundColor: '#673AB7' }]}>
                          {submitting ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <>
                              <Text style={styles.submitButtonText}>Submit Answer</Text>
                              <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
                            </>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.textInputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="create-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Type your answer here..."
                      placeholderTextColor="#999"
                      value={textInput}
                      onChangeText={setTextInput}
                      multiline
                      editable={!submitting}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.submitButton, (!textInput.trim() || submitting) && styles.submitButtonDisabled]}
                    onPress={handleTextSubmit}
                    disabled={submitting || !textInput.trim()}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.submitButtonGradient, { backgroundColor: textInput.trim() ? '#673AB7' : '#9CA3AF' }]}>
                      {submitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.submitButtonText}>Submit Answer</Text>
                          <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Reward Info */}
            <View style={styles.rewardInfo}>
              <View style={[styles.rewardBadge, { backgroundColor: '#FFF9C4' }]}>
                <Ionicons name="gift" size={18} color="#F57C00" />
                <Text style={styles.rewardInfoText}>
                  +{CREDITS_PER_QUESTION} Credits
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            {currentQuestionIndex > 0 && (
              <TouchableOpacity
                style={styles.previousButton}
                onPress={goToPreviousQuestion}
                disabled={submitting}
                activeOpacity={0.6}
              >
                <Ionicons name="arrow-back-outline" size={16} color="#673AB7" />
                <Text style={styles.previousButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.skipButton}
              onPress={skipQuestion}
              disabled={submitting}
              activeOpacity={0.6}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
              <Ionicons name="arrow-forward-outline" size={16} color="#5F6368" />
            </TouchableOpacity>
          </View>

          {/* Quit Button Below Navigation */}
          <View style={styles.quitButtonContainer}>
            <TouchableOpacity onPress={handleQuit} style={styles.quitButton}>
              <View style={[styles.quitButtonGradient, { backgroundColor: '#EF5350' }]}>
                <Ionicons name="exit-outline" size={20} color="#fff" />
                <Text style={styles.quitButtonText}>Quit Quiz</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F3F4',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#F1F3F4',
  },
  confettiOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    zIndex: 1000,
    marginLeft: -75,
  },
  confettiText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#5F6368',
    fontWeight: '500',
  },
  infoTooltipContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  infoTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#C5CAE9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTooltipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#673AB7',
    letterSpacing: 0,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerIconGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202124',
    letterSpacing: 0,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#5F6368',
    marginTop: 2,
  },
  quitButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  quitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  quitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  quitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  creditsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  creditsText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  circularProgressContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  circularProgress: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#673AB7',
    marginBottom: 10,
  },
  progressCircle: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#673AB7',
  },
  progressTotal: {
    fontSize: 10,
    fontWeight: '500',
    color: '#673AB7',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: width - 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  dotActive: {
    backgroundColor: '#9575CD',
    transform: [{ scale: 1.2 }],
  },
  dotCompleted: {
    backgroundColor: '#673AB7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  questionCardTransparent: {
    borderRadius: 20,
    overflow: 'visible',
  },
  emojiContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  emoji: {
    fontSize: 40,
  },
  questionTextContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#673AB7',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 24,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  multipleChoiceContainer: {
    gap: 10,
  },
  optionButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  optionGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 14,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
    flex: 1,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  otherInputWrapper: {
    marginTop: 8,
    gap: 10,
  },
  otherInputRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#673AB7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  otherIcon: {
    marginRight: 10,
  },
  otherTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  multiSelectScrollContainer: {
    maxHeight: 400,
  },
  multiSelectContainer: {
    gap: 8,
  },
  multiSelectHint: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
    marginBottom: 8,
    paddingLeft: 4,
  },
  checkboxButton: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  checkboxGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#DADCE0',
    borderRadius: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#202124',
    flex: 1,
  },
  checkboxTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  yesButton: {
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
  },
  buttonIconWrapper: {
    marginBottom: 4,
  },
  yesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0,
  },
  noButton: {
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  noButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0,
  },
  textInputContainer: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E8ECEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 60,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  submitButtonGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.3,
  },
  rewardInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  rewardInfoText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  previousButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#673AB7',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5F6368',
  },
  bonusCard: {
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  bonusGradient: {
    padding: 16,
    alignItems: 'center',
  },
  bonusIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bonusTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
  },
  bonusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 18,
  },
  bonusAmount: {
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completionBannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  completionBonusGradient: {
    padding: 32,
    alignItems: 'center',
  },
  completionBonusTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  completionBonusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  completionBannerButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completionBannerButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
  },
  completionBannerButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#673AB7',
    letterSpacing: 0,
  },
  completionCard: {
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: 20,
  },
  completionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.9,
  },
  completionCredits: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFD700',
    marginTop: 20,
  },
  completionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 28,
  },
  completionButtonText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#10B981',
  },
});
