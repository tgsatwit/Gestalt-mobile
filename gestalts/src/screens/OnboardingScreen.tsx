import React, { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text, useTheme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Onboarding'>) {
	const { tokens } = useTheme();
	const setProfile = useMemoriesStore((s) => s.setProfile);
	const [name, setName] = useState('');
	const [stage, setStage] = useState('');
	const [currentStep, setCurrentStep] = useState(0);

	const steps = [
		{
			title: "Welcome to Gestalts",
			subtitle: "Support your child's language development journey with personalized guidance and insights.",
			showInputs: false
		},
		{
			title: "Let's get started",
			subtitle: "Tell us about your child so we can personalize your experience.",
			showInputs: true
		}
	];

	const handleContinue = () => {
		if (currentStep === 0) {
			setCurrentStep(1);
		} else {
			if (!name.trim()) return;
			setProfile({ id: 'profile', childName: name.trim(), stage: stage.trim() || undefined });
			navigation.replace('Main');
		}
	};

	return (
		<LinearGradient
			colors={['#E879F9', '#C084FC', '#A855F7']}
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
						<TouchableOpacity
							style={{
								backgroundColor: 'rgba(255,255,255,0.3)',
								paddingHorizontal: tokens.spacing.gap.md,
								paddingVertical: tokens.spacing.gap.xs,
								borderRadius: tokens.radius.pill
							}}
						>
							<Text style={{ color: 'white', fontSize: tokens.font.size.body, fontWeight: '500' }}>
								Skip
							</Text>
						</TouchableOpacity>
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
										width: 60,
										height: 4,
										borderRadius: 2,
										backgroundColor: index <= currentStep ? 'white' : 'rgba(255,255,255,0.3)'
									}}
								/>
							))}
						</View>

						{/* Input Fields */}
						{steps[currentStep].showInputs && (
							<View style={{ marginBottom: tokens.spacing.gap.lg * 2, gap: tokens.spacing.gap.md }}>
								<TextInput
									placeholder="Child's name"
									placeholderTextColor="rgba(255,255,255,0.7)"
									value={name}
									onChangeText={setName}
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
								<TextInput
									placeholder="GLP stage (optional)"
									placeholderTextColor="rgba(255,255,255,0.7)"
									value={stage}
									onChangeText={setStage}
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
							disabled={steps[currentStep].showInputs && !name.trim()}
							style={{
								backgroundColor: 'white',
								borderRadius: tokens.radius.lg,
								paddingVertical: tokens.spacing.gap.md,
								alignItems: 'center',
								opacity: (steps[currentStep].showInputs && !name.trim()) ? 0.5 : 1
							}}
						>
							<Text style={{
								color: tokens.color.brand.gradient.start,
								fontSize: tokens.font.size.lg,
								fontWeight: '600'
							}}>
								{currentStep === 0 ? 'Get Started' : 'Continue'}
							</Text>
						</TouchableOpacity>

						{/* Secondary Button */}
						{currentStep === 0 && (
							<TouchableOpacity
								style={{
									backgroundColor: 'rgba(255,255,255,0.2)',
									borderWidth: 1,
									borderColor: 'rgba(255,255,255,0.3)',
									borderRadius: tokens.radius.lg,
									paddingVertical: tokens.spacing.gap.md,
									alignItems: 'center'
								}}
							>
								<Text style={{
									color: 'white',
									fontSize: tokens.font.size.lg,
									fontWeight: '500'
								}}>
									Learn More
								</Text>
							</TouchableOpacity>
						)}

						{/* Terms */}
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
					</View>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</LinearGradient>
	);
}