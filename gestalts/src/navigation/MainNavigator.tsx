import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerProvider } from './SimpleDrawer';
import DashboardScreen from '../screens/DashboardScreen';
import CoachScreen from '../screens/CoachScreen';
import MemoriesScreen from '../screens/MemoriesScreen';
import PlayScreen from '../screens/PlayScreen';
import ReportScreen from '../screens/ReportScreen';

export type MainStackParamList = {
  Dashboard: undefined;
  Coach: { initialMode?: 'Language Coach' | 'Parent Support' | 'Child Mode' };
  Memories: undefined;
  Play: undefined;
  Report: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <DrawerProvider>
      <Stack.Navigator 
        initialRouteName="Dashboard"
        screenOptions={{ 
          headerShown: false,
          gestureEnabled: true
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Coach" component={CoachScreen} />
        <Stack.Screen name="Memories" component={MemoriesScreen} />
        <Stack.Screen name="Play" component={PlayScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
      </Stack.Navigator>
    </DrawerProvider>
  );
}