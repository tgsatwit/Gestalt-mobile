import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, Theme as NavTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { tokens } from './src/theme/tokens';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/NavigationService';
import { AuthProvider } from './src/contexts/AuthContext';
import {
  useFonts as usePlusJakarta,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts as useInter, Inter_400Regular } from '@expo-google-fonts/inter';
import { useFonts as useOoohBaby, OoohBaby_400Regular } from '@expo-google-fonts/oooh-baby';
import { View, ActivityIndicator } from 'react-native';
import { ElevenLabsProvider } from '@elevenlabs/react-native';
import { initializeFirebase } from './src/services/firebaseConfig';
import { testFirebaseIntegration } from './src/utils/firebaseTest';

export default function App() {
  const [pjLoaded] = usePlusJakarta({
    'PlusJakartaSans': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
  });
  const [interLoaded] = useInter({ 'Inter': Inter_400Regular });
  const [obLoaded] = useOoohBaby({ 'OoohBaby': OoohBaby_400Regular });
  const fontLoaded = pjLoaded && interLoaded && obLoaded;

  // Initialize Firebase when app starts
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const firebaseServices = initializeFirebase();
        if (!firebaseServices.initialized) {
          console.warn('Firebase initialization failed');
        } else {
          console.log('Firebase initialized successfully with Web SDK');
          
          // Run Firebase integration test
          setTimeout(async () => {
            try {
              await testFirebaseIntegration();
            } catch (error) {
              console.error('Firebase integration test failed:', error);
            }
          }, 2000); // Wait 2 seconds for everything to settle
        }
      } catch (error) {
        console.error('Firebase initialization error:', error);
      }
    };
    
    initializeApp();
  }, []);

  const navTheme: NavTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: tokens.color.surface, text: tokens.color.text.primary, border: tokens.color.border.default },
  };

  if (!fontLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.surface }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider fontLoaded={fontLoaded}>
            <ElevenLabsProvider>
              <NavigationContainer ref={navigationRef} theme={navTheme}>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </ElevenLabsProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
