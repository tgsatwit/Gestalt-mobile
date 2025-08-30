import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import MainNavigator from './MainNavigator';
import AuthScreen from '../screens/AuthScreen';
import { useMemoriesStore } from '../state/useStore';
import { useAuth } from '../contexts/AuthContext';

export type RootStackParamList = {
	Auth: undefined;
	Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
	const { user, isAuthenticated, loading } = useAuth();
	const { 
		currentProfile, 
		profiles, 
		loadUserProfiles,
		setCurrentProfile
	} = useMemoriesStore();
	
	// Load user profiles when component mounts and user is authenticated
	useEffect(() => {
		if (isAuthenticated && user) {
			loadUserProfiles(user.id);
		}
	}, [isAuthenticated, user, loadUserProfiles]);
	
	// Set current profile if we have profiles but no current one selected
	useEffect(() => {
		if (profiles.length > 0 && !currentProfile) {
			// Select the first profile by default
			setCurrentProfile(profiles[0]);
		}
	}, [profiles, currentProfile, setCurrentProfile]);
	
	// Show loading spinner while auth state is being determined
	if (loading) {
		return (
			<View style={{ 
				flex: 1, 
				justifyContent: 'center', 
				alignItems: 'center',
				backgroundColor: '#7C3AED'
			}}>
				<ActivityIndicator size="large" color="white" />
			</View>
		);
	}
	
	// If not authenticated, show auth screen
	if (!isAuthenticated) {
		return (
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="Auth" component={AuthScreen} />
			</Stack.Navigator>
		);
	}
	
	// User is authenticated - go directly to Main
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Main">
			<Stack.Screen name="Main" component={MainNavigator} />
		</Stack.Navigator>
	);
}