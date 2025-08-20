import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainNavigator from './MainNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useMemoriesStore } from '../state/useStore';

export type RootStackParamList = {
	Onboarding: undefined;
	Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
	const profile = useMemoriesStore((s) => s.profile);
	const initialRouteName = profile ? 'Main' : 'Onboarding';
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
			<Stack.Screen name="Onboarding" component={OnboardingScreen} />
			<Stack.Screen name="Main" component={MainNavigator} />
		</Stack.Navigator>
	);
}