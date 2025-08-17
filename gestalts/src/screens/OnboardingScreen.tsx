import React, { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, useTheme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import AppHeader from '../components/AppHeader';

export default function OnboardingScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Onboarding'>) {
	const { tokens } = useTheme();
	const setProfile = useMemoriesStore((s) => s.setProfile);
	const [name, setName] = useState('');
	const [stage, setStage] = useState('');

	return (
		<>
			<AppHeader title="Welcome" />
			<KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1, backgroundColor: 'white' }}>
				<View style={{ flex: 1, paddingHorizontal: tokens.spacing.containerX, justifyContent: 'center', gap: tokens.spacing.gap.lg }}>
					<Text weight="semibold" style={{ fontSize: tokens.font.size.h1, lineHeight: Math.round(tokens.font.size.h1 * 1.2) }}>
						Welcome to <Text weight="semibold" style={{ fontSize: tokens.font.size.h1 }}>Gestalts</Text>
					</Text>
					<Text color="secondary">Let's set up your child's profile to personalize guidance and memories.</Text>
					<TextInput
						placeholder="Child name"
						value={name}
						onChangeText={setName}
						style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 14 }}
					/>
					<TextInput
						placeholder="GLP stage (optional)"
						value={stage}
						onChangeText={setStage}
						style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 14 }}
					/>
					<GradientButton
						title="Continue"
						onPress={() => {
							if (!name.trim()) return;
							setProfile({ id: 'profile', childName: name.trim(), stage: stage.trim() || undefined });
							navigation.replace('Tabs');
						}}
					/>
				</View>
			</KeyboardAvoidingView>
		</>
	);
}