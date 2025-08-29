import React, { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform, Image, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Text, useTheme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { useAuth } from '../contexts/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Onboarding'>) {
	const { tokens } = useTheme();
	const { updateUserName, markOnboarded, getCurrentUserId } = useAuth();
	const { createProfile } = useMemoriesStore();
	
	const [currentStep, setCurrentStep] = useState(0);
	const [userName, setUserName] = useState('');
	const [childName, setChildName] = useState('');
	const [childStage, setChildStage] = useState(1);
	const [isCreatingProfile, setIsCreatingProfile] = useState(false);

	const steps = [
		{
			title: "Welcome to Gestalts",
			subtitle: "Support your child's language development journey with personalized guidance and insights.",
			type: 'welcome'
		},
		{
			title: "What should we call you?",
			subtitle: "Tell us your preferred name so we can personalize your experience.",
			type: 'userName'
		},
		{
			title: "Create your first child profile",
			subtitle: "Add your child's information to unlock personalized features. You can skip this and set it up later.",
			type: 'childProfile'
		}
	];

	const handleContinue = async () => {
		if (currentStep === 0) {
			// Welcome step - just move to next
			setCurrentStep(1);
		} else if (currentStep === 1) {
			// User name step
			if (!userName.trim()) {
				Alert.alert('Name Required', 'Please enter your preferred name to continue.');
				return;
			}
			await updateUserName(userName.trim());
			setCurrentStep(2);
		} else {
			// Child profile step
			if (childName.trim()) {
				// Create child profile if name provided
				setIsCreatingProfile(true);
				try {
					const userId = getCurrentUserId();
					if (userId) {
						await createProfile(userId, {
							childName: childName.trim(),
							currentStage: childStage
						});
					}
				} catch (error) {
					console.error('Failed to create profile:', error);
					Alert.alert('Error', 'Failed to create child profile. You can set this up later from the settings.');
				} finally {
					setIsCreatingProfile(false);
				}
			}
			// Mark user as onboarded and navigate to main
			await markOnboarded();
			navigation.replace('Main');
		}
	};
	
	const handleSkip = async () => {
		if (currentStep === 2) {
			// Skip child profile creation
			await markOnboarded();
			navigation.replace('Main');
		}
	};

	return (
		<LinearGradient
			colors={['#7C3AED', '#EC4899', '#FB923C']}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={{ flex: 1 }}
		>
			<SafeAreaView style={{ flex: 1 }}>
				<KeyboardAvoidingView 
					behavior={Platform.select({ ios: 'padding', android: undefined })} 
					style={{ flex: 1 }}
				>
					{/* Header */}
					<View style={{ 
						flexDirection: 'row', 
						justifyContent: 'flex-end',
						paddingHorizontal: tokens.spacing.containerX,
						paddingTop: tokens.spacing.gap.md
					}}>
						{currentStep === 2 && (
							<TouchableOpacity
								onPress={handleSkip}
								style={{
									backgroundColor: 'rgba(255,255,255,0.3)',
									paddingHorizontal: tokens.spacing.gap.md,
									paddingVertical: tokens.spacing.gap.xs,
									borderRadius: tokens.radius.pill
								}}
							>
								<Text style={{ color: 'white', fontSize: tokens.font.size.body, fontWeight: '500' }}>
									Skip for now
								</Text>
							</TouchableOpacity>
						)}
					</View>

					{/* Content */}
					<View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: tokens.spacing.containerX }}>
						{/* Logo */}
						<View style={{ alignItems: 'center', marginBottom: tokens.spacing.gap.lg * 2 }}>
							<View style={{
								width: 160,
								height: 160,
								backgroundColor: 'rgba(255,255,255,0.2)',
								borderRadius: 80,
								alignItems: 'center',
								justifyContent: 'center',
								marginBottom: tokens.spacing.gap.lg
							}}>
								<Image 
									source={require('../../assets/Gestalts-logo.png')} 
									style={{ width: 100, height: 100 }}
									resizeMode="contain"
								/>
							</View>
						</View>

						{/* Title and Subtitle */}
						<View style={{ marginBottom: tokens.spacing.gap.lg * 2 }}>
							<Text 
								weight="semibold" 
								style={{ 
									fontSize: tokens.font.size.h1,
									lineHeight: Math.round(tokens.font.size.h1 * 1.2),
									textAlign: 'center',
									color: 'white',
									marginBottom: tokens.spacing.gap.md
								}}
							>
								{steps[currentStep].title}
							</Text>
							<Text 
								style={{ 
									fontSize: tokens.font.size.lg,
									textAlign: 'center',
									color: 'rgba(255,255,255,0.9)',
									lineHeight: Math.round(tokens.font.size.lg * 1.4),
									paddingHorizontal: tokens.spacing.gap.md
								}}
							>
								{steps[currentStep].subtitle}
							</Text>
						</View>

						{/* Progress Indicators */}
						<View style={{ 
							flexDirection: 'row', 
							justifyContent: 'center', 
							gap: tokens.spacing.gap.xs,
							marginBottom: tokens.spacing.gap.lg * 2
						}}>
							{steps.map((_, index) => (
								<View
									key={index}
									style={{
										width: 40,
										height: 4,
										borderRadius: 2,
										backgroundColor: index <= currentStep ? 'white' : 'rgba(255,255,255,0.3)'
									}}
								/>
							))}
						</View>

						{/* Input Fields */}
						{steps[currentStep].type === 'userName' && (
							<View style={{ marginBottom: tokens.spacing.gap.lg * 2 }}>
								<TextInput
									placeholder="Enter your preferred name"
									placeholderTextColor="rgba(255,255,255,0.7)"
									value={userName}
									onChangeText={setUserName}
									style={{
										backgroundColor: 'rgba(255,255,255,0.2)',
										borderWidth: 1,
										borderColor: 'rgba(255,255,255,0.3)',
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										fontSize: tokens.font.size.body,
										color: 'white'
									}}
								/>
							</View>
						)}
						
						{steps[currentStep].type === 'childProfile' && (
							<View style={{ marginBottom: tokens.spacing.gap.lg * 2, gap: tokens.spacing.gap.md }}>
								<TextInput
									placeholder="Child's name (optional)"
									placeholderTextColor="rgba(255,255,255,0.7)"
									value={childName}
									onChangeText={setChildName}
									style={{
										backgroundColor: 'rgba(255,255,255,0.2)',
										borderWidth: 1,
										borderColor: 'rgba(255,255,255,0.3)',
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										fontSize: tokens.font.size.body,
										color: 'white'
									}}
								/>
								
								{/* Gestalt Stage Selector */}
								<View style={{ 
									backgroundColor: 'rgba(255,255,255,0.2)',
									borderWidth: 1,
									borderColor: 'rgba(255,255,255,0.3)',
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md
								}}>
									<Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: tokens.font.size.sm, marginBottom: tokens.spacing.gap.sm }}>
										Current Gestalt Stage
									</Text>
									<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.gap.xs }}>
										{[1, 2, 3, 4, 5, 6].map((stage) => (
											<TouchableOpacity
												key={stage}
												onPress={() => setChildStage(stage)}
												style={{
													backgroundColor: childStage === stage ? 'white' : 'rgba(255,255,255,0.3)',
													width: 40,
													height: 40,
													borderRadius: 20,
													alignItems: 'center',
													justifyContent: 'center'
												}}
											>
												<Text style={{ 
													color: childStage === stage ? tokens.color.brand.gradient.start : 'white', 
													fontWeight: '600' 
												}}>
													{stage}
												</Text>
											</TouchableOpacity>
										))}
									</View>
								</View>
							</View>
						)}
					</View>

					{/* Bottom Buttons */}
					<View style={{ 
						paddingHorizontal: tokens.spacing.containerX,
						paddingBottom: tokens.spacing.gap.lg * 2,
						gap: tokens.spacing.gap.md
					}}>
						{/* Primary Button */}
						<TouchableOpacity
							onPress={handleContinue}
							disabled={(currentStep === 1 && !userName.trim()) || isCreatingProfile}
							style={{
								backgroundColor: 'white',
								borderRadius: tokens.radius.lg,
								paddingVertical: tokens.spacing.gap.md,
								alignItems: 'center',
								flexDirection: 'row',
								justifyContent: 'center',
								opacity: ((currentStep === 1 && !userName.trim()) || isCreatingProfile) ? 0.5 : 1
							}}
						>
							{isCreatingProfile ? (
								<>
									<View style={{ 
										width: 20, 
										height: 20, 
										borderWidth: 2, 
										borderColor: tokens.color.brand.gradient.start,
										borderTopColor: 'transparent',
										borderRadius: 10,
										marginRight: tokens.spacing.gap.sm
									}} />
									<Text style={{
										color: tokens.color.brand.gradient.start,
										fontSize: tokens.font.size.lg,
										fontWeight: '600'
									}}>
										Creating Profile...
									</Text>
								</>
							) : (
								<Text style={{
									color: tokens.color.brand.gradient.start,
									fontSize: tokens.font.size.lg,
									fontWeight: '600'
								}}>
									{currentStep === 0 ? 'Get Started' : currentStep === 1 ? 'Continue' : childName.trim() ? 'Create Profile & Continue' : 'Continue Without Profile'}
								</Text>
							)}
						</TouchableOpacity>

						{/* Terms */}
						{currentStep === 0 && (
							<View style={{ alignItems: 'center', marginTop: tokens.spacing.gap.md }}>
								<Text style={{
									fontSize: tokens.font.size.sm,
									color: 'rgba(255,255,255,0.8)',
									textAlign: 'center'
								}}>
									By continuing, you agree to our{' '}
									<Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text>
									{' '}and{' '}
									<Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>.
								</Text>
							</View>
						)}
					</View>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</LinearGradient>
	);
}