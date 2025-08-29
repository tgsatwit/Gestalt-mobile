import React, { useState } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet
} from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { useAuth } from '../contexts/AuthContext';
import * as AppleAuthentication from 'expo-apple-authentication';

type AuthTab = 'signin' | 'signup';

export default function AuthScreen() {
  const { tokens } = useTheme();
  const { signUp, signIn, signInWithApple, loading, isAppleSignInAvailable } = useAuth();
  
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sign In Form State
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });
  
  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSignIn = async () => {
    if (!signInData.email || !signInData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn({
        email: signInData.email.trim().toLowerCase(),
        password: signInData.password,
      });
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    const { firstName, lastName, displayName, email, password, confirmPassword } = signUpData;
    
    if (!firstName || !lastName || !displayName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setIsSubmitting(true);
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      });
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsSubmitting(true);
      await signInWithApple();
    } catch (error: any) {
      if (error.message !== 'Apple sign-in was cancelled') {
        Alert.alert('Apple Sign In Failed', error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Logo */}
      <Image
        source={require('../../assets/Gestalts-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* Tagline */}
      <View style={styles.taglineContainer}>
        <Text style={[styles.taglineText, styles.taglineRegular]}>
          Helping your{' '}
        </Text>
        <Text style={[styles.taglineText, styles.taglineScript, styles.gradientText]}>
          love
        </Text>
        <Text style={[styles.taglineText, styles.taglineRegular]}>
          {' '}become{' '}
        </Text>
        <Text style={[styles.taglineText, styles.taglineScript, styles.gradientText]}>
          language
        </Text>
      </View>
    </View>
  );

  const renderSegmentedControl = () => (
    <View style={[styles.segmentedControl, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
      <TouchableOpacity 
        onPress={() => setActiveTab('signin')}
        style={[
          styles.segmentButton,
          { backgroundColor: activeTab === 'signin' ? 'white' : 'transparent' }
        ]}
      >
        <Text 
          weight="semibold" 
          style={[
            styles.segmentButtonText,
            { color: activeTab === 'signin' ? tokens.color.primary.default : 'white' }
          ]}
        >
          Sign In
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => setActiveTab('signup')}
        style={[
          styles.segmentButton,
          { backgroundColor: activeTab === 'signup' ? 'white' : 'transparent' }
        ]}
      >
        <Text 
          weight="semibold" 
          style={[
            styles.segmentButtonText,
            { color: activeTab === 'signup' ? tokens.color.primary.default : 'white' }
          ]}
        >
          Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAppleSignInButton = () => {
    if (!isAppleSignInAvailable) return null;

    return (
      <TouchableOpacity
        onPress={handleAppleSignIn}
        disabled={isSubmitting || loading}
        style={styles.appleButton}
      >
        <Ionicons name="logo-apple" size={20} color="white" />
        <Text style={styles.appleButtonText}>Continue with Apple</Text>
      </TouchableOpacity>
    );
  };

  const renderDivider = () => (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or</Text>
      <View style={styles.dividerLine} />
    </View>
  );

  const renderSignInForm = () => (
    <View style={styles.formContainer}>
      <Text size="h2" weight="bold" style={styles.formTitle}>Welcome Back</Text>
      <Text color="secondary" style={styles.formSubtitle}>
        Sign in to continue your journey
      </Text>

      {isAppleSignInAvailable && (
        <>
          {renderAppleSignInButton()}
          {renderDivider()}
        </>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.textInput}
          value={signInData.email}
          onChangeText={(text) => setSignInData({ ...signInData, email: text })}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.textInput}
          value={signInData.password}
          onChangeText={(text) => setSignInData({ ...signInData, password: text })}
          placeholder="Enter your password"
          secureTextEntry
        />
      </View>

      <GradientButton
        title={isSubmitting ? 'Signing In...' : 'Sign In'}
        onPress={handleSignIn}
        disabled={isSubmitting || loading}
        style={styles.submitButton}
      />
    </View>
  );

  const renderSignUpForm = () => (
    <View style={styles.formContainer}>
      <Text size="h2" weight="bold" style={styles.formTitle}>Create Account</Text>
      <Text color="secondary" style={styles.formSubtitle}>
        Join our community and start your language journey
      </Text>

      {isAppleSignInAvailable && (
        <>
          {renderAppleSignInButton()}
          {renderDivider()}
        </>
      )}

      <View style={styles.nameInputsContainer}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.textInput}
            value={signUpData.firstName}
            onChangeText={(text) => setSignUpData({ ...signUpData, firstName: text })}
            placeholder="First name"
            autoCapitalize="words"
          />
        </View>

        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.textInput}
            value={signUpData.lastName}
            onChangeText={(text) => setSignUpData({ ...signUpData, lastName: text })}
            placeholder="Last name"
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Display Name</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.displayName}
          onChangeText={(text) => setSignUpData({ ...signUpData, displayName: text })}
          placeholder="How should we call you?"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.email}
          onChangeText={(text) => setSignUpData({ ...signUpData, email: text })}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.password}
          onChangeText={(text) => setSignUpData({ ...signUpData, password: text })}
          placeholder="Create a password"
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.confirmPassword}
          onChangeText={(text) => setSignUpData({ ...signUpData, confirmPassword: text })}
          placeholder="Confirm your password"
          secureTextEntry
        />
      </View>

      <GradientButton
        title={isSubmitting ? 'Creating Account...' : 'Create Account'}
        onPress={handleSignUp}
        disabled={isSubmitting || loading}
        style={styles.submitButton}
      />
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#7C3AED', '#EC4899', '#FB923C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#7C3AED', '#EC4899', '#FB923C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderHeader()}
          {renderSegmentedControl()}
          
          <View style={styles.contentContainer}>
            {activeTab === 'signin' ? renderSignInForm() : renderSignUpForm()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  headerContainer: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logo: {
    height: 60,
    width: 200,
    marginBottom: 24,
  },
  taglineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'baseline',
    paddingHorizontal: 16,
  },
  taglineText: {
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
  taglineRegular: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  taglineScript: {
    fontSize: 28,
    fontFamily: 'OoohBaby_400Regular',
  },
  gradientText: {
    color: '#FFD700', // Fallback color for gradient text
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentButtonText: {
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#1F2937',
  },
  formSubtitle: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 16,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  appleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  nameInputsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  submitButton: {
    marginTop: 8,
  },
});
