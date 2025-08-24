import React from 'react';
import { NavigationContainer, DefaultTheme, Theme as NavTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { tokens } from './src/theme/tokens';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/NavigationService';
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

export default function App() {
  const [pjLoaded] = usePlusJakarta({
    'PlusJakartaSans': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
  });
  const [interLoaded] = useInter({ 'Inter': Inter_400Regular });
  const [obLoaded] = useOoohBaby({ 'OoohBaby': OoohBaby_400Regular });
  const fontLoaded = pjLoaded && interLoaded && obLoaded;

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
        <ThemeProvider fontLoaded={fontLoaded}>
          <ElevenLabsProvider>
            <NavigationContainer ref={navigationRef} theme={navTheme}>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </ElevenLabsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
