import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerProvider } from './SimpleDrawer';
import DashboardScreen from '../screens/DashboardScreen';
import CoachScreen from '../screens/CoachScreen';
import MemoriesScreen from '../screens/MemoriesScreen';
import PlayScreen from '../screens/PlayScreen';
import ReportScreen from '../screens/ReportScreen';
import StorybookScreen from '../screens/StorybookScreen';
import KnowledgeScreen from '../screens/KnowledgeScreen';
import AddJournalScreen from '../screens/AddJournalScreen';
import AddMilestoneScreen from '../screens/AddMilestoneScreen';
import AddGestaltScreen from '../screens/AddGestaltScreen';
import AppointmentNoteScreen from '../screens/AppointmentNoteScreen';
import GestaltListsScreen from '../screens/GestaltListsScreen';
import ChildProfileScreen from '../screens/ChildProfileScreen';
import ChildProfilesListScreen from '../screens/ChildProfilesListScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SpecialistProfilesScreen from '../screens/SpecialistProfilesScreen';
import ProfileSelectionScreen from '../screens/ProfileSelectionScreen';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

// Wrap screens with DrawerProvider (for bottom nav screens)
const DashboardWithDrawer = () => (
  <DrawerProvider>
    <DashboardScreen />
  </DrawerProvider>
);

const CoachWithDrawer = () => (
  <DrawerProvider>
    <CoachScreen />
  </DrawerProvider>
);

const MemoriesWithDrawer = () => (
  <DrawerProvider>
    <MemoriesScreen />
  </DrawerProvider>
);

const PlayWithDrawer = () => (
  <DrawerProvider>
    <PlayScreen />
  </DrawerProvider>
);

const ReportWithDrawer = () => (
  <DrawerProvider>
    <ReportScreen />
  </DrawerProvider>
);

const KnowledgeWithDrawer = () => (
  <DrawerProvider>
    <KnowledgeScreen />
  </DrawerProvider>
);

const AddJournalWithDrawer = () => (
  <DrawerProvider>
    <AddJournalScreen />
  </DrawerProvider>
);

const AddMilestoneWithDrawer = () => (
  <DrawerProvider>
    <AddMilestoneScreen />
  </DrawerProvider>
);

const AddGestaltWithDrawer = () => (
  <DrawerProvider>
    <AddGestaltScreen />
  </DrawerProvider>
);

const AppointmentNoteWithDrawer = () => (
  <DrawerProvider>
    <AppointmentNoteScreen />
  </DrawerProvider>
);

const GestaltListsWithDrawer = () => (
  <DrawerProvider>
    <GestaltListsScreen />
  </DrawerProvider>
);

const ChildProfileWithDrawer = () => (
  <DrawerProvider>
    <ChildProfileScreen />
  </DrawerProvider>
);

const ChildProfilesListWithDrawer = () => (
  <DrawerProvider>
    <ChildProfilesListScreen />
  </DrawerProvider>
);

const UserProfileWithDrawer = () => (
  <DrawerProvider>
    <UserProfileScreen />
  </DrawerProvider>
);

const ProfileWithDrawer = () => (
  <DrawerProvider>
    <ProfileScreen />
  </DrawerProvider>
);

const SpecialistProfilesWithDrawer = () => (
  <DrawerProvider>
    <SpecialistProfilesScreen />
  </DrawerProvider>
);

const ProfileSelectionWithDrawer = () => (
  <DrawerProvider>
    <ProfileSelectionScreen />
  </DrawerProvider>
);

// Screens without bottom nav (colored header style)
const PlayAnalyzerWithDrawer = () => (
  <DrawerProvider>
    <PlayScreen />
  </DrawerProvider>
);

const StorybookWithDrawer = () => (
  <DrawerProvider>
    <StorybookScreen />
  </DrawerProvider>
);

export default function MainNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        // Fix for iOS pointer events issue with react-native-screens
        ...(Platform.OS === 'ios' && {
          headerTransparent: true,
          headerBackTitleVisible: false,
        })
      }}
    >
      {/* Main Navigation Screens */}
      <Stack.Screen name="Dashboard" component={DashboardWithDrawer} />
      <Stack.Screen name="Coach" component={CoachWithDrawer} />
      <Stack.Screen name="Memories" component={MemoriesWithDrawer} />
      <Stack.Screen name="Play" component={PlayWithDrawer} />
      <Stack.Screen name="Report" component={ReportWithDrawer} />
      
      {/* Learn & Grow Screens */}
      <Stack.Screen name="PlayAnalyzer" component={PlayAnalyzerWithDrawer} />
      <Stack.Screen name="Storybook" component={StorybookWithDrawer} />
      <Stack.Screen name="Knowledge" component={KnowledgeWithDrawer} />
      
      {/* Record & Track Screens */}
      <Stack.Screen name="AddJournal" component={AddJournalWithDrawer} />
      <Stack.Screen name="AddMilestone" component={AddMilestoneWithDrawer} />
      <Stack.Screen name="AddGestalt" component={AddGestaltWithDrawer} />
      <Stack.Screen name="AppointmentNote" component={AppointmentNoteWithDrawer} />
      <Stack.Screen name="GestaltLists" component={GestaltListsWithDrawer} />
      
      {/* Profile Screens */}
      <Stack.Screen name="Profile" component={ProfileWithDrawer} />
      <Stack.Screen name="ChildProfile" component={ChildProfileWithDrawer} />
      <Stack.Screen name="ChildProfilesList" component={ChildProfilesListWithDrawer} />
      <Stack.Screen name="UserProfile" component={UserProfileWithDrawer} />
      <Stack.Screen name="SpecialistProfiles" component={SpecialistProfilesWithDrawer} />
      <Stack.Screen name="ProfileSelection" component={ProfileSelectionWithDrawer} />
    </Stack.Navigator>
  );
}