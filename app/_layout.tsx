// app/_layout.tsx - Root layout for Expo Router
// IMPORTANT: These must be imported first
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Slot } from 'expo-router';
import { TranslationProvider } from '../src/i18n';

export default function RootLayout() {
  return (
    <TranslationProvider>
      <Slot />
    </TranslationProvider>
  );
}

