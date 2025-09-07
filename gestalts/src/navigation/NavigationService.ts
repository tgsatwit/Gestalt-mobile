import { createNavigationContainerRef } from '@react-navigation/native';
import type { MainStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<MainStackParamList>();

export function navigate(name: keyof MainStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params);
  }
}

export function reset(name: keyof MainStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: name as any, params }],
    });
  }
}