// app/(tabs)/_layout.tsx
import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InfinityEight from '../../src/shared/components/icons/InfinityEight';
import { ProfileIcon } from '../../src/shared/components/icons/ProfileIcon';
import { HistoryScroll } from '../../src/shared/components/icons/HistoryScroll';
import { LibraryBook } from '../../src/shared/components/icons/LibraryBook';
import { useTranslation } from '../../src/i18n';
import theme from '../../src/theme';
import ThemedText from '../../src/shared/components/ui/ThemedText';
import { debugLog } from '../../src/utils/debugLog';

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // #region agent log
  useEffect(() => {
    debugLog('(tabs)/_layout.tsx:insets', 'Safe area insets measured', {
      platform: Platform.OS,
      insetsTop: insets.top,
      insetsBottom: insets.bottom,
      insetsLeft: insets.left,
      insetsRight: insets.right,
    }, 'A');
    const calculatedHeight = Platform.select({
      ios: 105 + insets.bottom,
      android: 95 + Math.max(insets.bottom, 0),
    });
    const calculatedPaddingBottom = Platform.select({
      ios: insets.bottom + 24,
      android: Math.max(insets.bottom, 0) + 24,
    });
    debugLog('(tabs)/_layout.tsx:tabBarConfig', 'Tab bar configuration calculated', {
      platform: Platform.OS,
      calculatedHeight,
      calculatedPaddingBottom,
      androidInsetsBottom: insets.bottom,
      androidInsetsBottomUsed: Math.max(insets.bottom, 0),
    }, 'A');
  }, [insets]);
  // #endregion

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.neutrals.black,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.primary.goldDark,
          height: 60,
        },
        headerTitleStyle: {
          fontFamily: 'Cinzel_600SemiBold',
          fontSize: 24,
          color: theme.colors.primary.gold,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        headerTitleAlign: 'center',
        headerTintColor: theme.colors.primary.gold,
        tabBarStyle: {
          backgroundColor: theme.colors.neutrals.black,
          borderTopColor: theme.colors.primary.goldDark,
          borderTopWidth: 1,
          height: Platform.select({
            ios: 105 + insets.bottom,
            android: 95 + Math.max(insets.bottom, 0),
          }),
          paddingBottom: Platform.select({
            ios: insets.bottom + 24,
            android: Math.max(insets.bottom, 0) + 24,
          }),
          paddingTop: 12,
          paddingHorizontal: 16,
        },
        tabBarActiveTintColor: theme.colors.primary.gold,
        tabBarInactiveTintColor: theme.colors.neutrals.lightGray,
        tabBarLabelStyle: {
          fontFamily: 'Lato_400Regular',
          fontSize: 17,
          fontWeight: '600',
          marginTop: 8,
          marginBottom: 0,
          paddingBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          paddingHorizontal: 8,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.reading') || 'Reading',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <InfinityEight size={38} isActive={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history') || 'History',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/analysis')}
              style={{ 
                marginRight: 16, 
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
            >
              <ThemedText variant="body" style={{ 
                color: theme.colors.primary.goldLight, 
                fontSize: 16, 
                fontWeight: '400',
                fontFamily: 'Lato_400Regular',
                textDecorationLine: 'underline',
                textDecorationColor: theme.colors.primary.goldLight,
              }}>
                {t('analysis.linkTitle')}
              </ThemedText>
            </TouchableOpacity>
          ),
          tabBarIcon: ({ focused }) => (
            <HistoryScroll size={38} isActive={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('tabs.library') || 'Library',
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <LibraryBook size={38} isActive={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile') || 'Profile',
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <ProfileIcon size={38} isActive={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
