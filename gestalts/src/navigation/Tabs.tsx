import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CoachScreen from '../screens/CoachScreen';
import MemoriesScreen from '../screens/MemoriesScreen';
import PlayScreen from '../screens/PlayScreen';
import ReportScreen from '../screens/ReportScreen';
import { tokens } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';

export type TabsParamList = {
	Coach: undefined;
	Memories: undefined;
	Play: undefined;
	Report: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

export default function Tabs() {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				headerShown: false,
				tabBarActiveTintColor: tokens.color.text.primary,
				tabBarStyle: { borderTopColor: tokens.color.border.default, backgroundColor: 'white' },
				tabBarIcon: ({ color, size, focused }) => {
					const icon = route.name === 'Coach' ? 'chatbubbles' : route.name === 'Memories' ? 'book' : route.name === 'Play' ? 'game-controller' : 'document-text';
					return <Ionicons name={icon as any} size={size} color={color} />;
				},
			})}
		>
			<Tab.Screen name="Coach" component={CoachScreen} />
			<Tab.Screen name="Memories" component={MemoriesScreen} />
			<Tab.Screen name="Play" component={PlayScreen} />
			<Tab.Screen name="Report" component={ReportScreen} />
		</Tab.Navigator>
	);
}