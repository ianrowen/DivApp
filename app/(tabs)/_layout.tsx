// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import InfinityEight from '../../src/shared/components/icons/InfinityEight';
import { ProfileIcon } from '../../src/shared/components/icons/ProfileIcon';
import { StatisticsIcon } from '../../src/shared/components/icons/StatisticsIcon';
import { HistoryScroll } from '../../src/shared/components/icons/HistoryScroll';
import { LibraryBook } from '../../src/shared/components/icons/LibraryBook';
import { useTranslation } from '../../src/i18n';
import theme from '../../src/shared/theme';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.neutrals.black,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.primary.goldDark,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontFamily: 'Cinzel_600SemiBold',
          fontSize: theme.typography.fontSize.xl,
          color: theme.colors.text.primary,
          letterSpacing: 0.5,
        },
        headerTintColor: theme.colors.primary.gold,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: theme.colors.neutrals.black,
          borderTopColor: theme.colors.primary.goldDark,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: theme.spacing.spacing.sm,
          paddingTop: theme.spacing.spacing.sm,
        },
        tabBarActiveTintColor: theme.colors.primary.gold,
        tabBarInactiveTintColor: theme.colors.neutrals.lightGray,
        tabBarLabelStyle: {
          fontFamily: 'Lato_400Regular',
          fontSize: theme.typography.fontSize.xs,
          fontWeight: '600',
          marginTop: theme.spacing.spacing.xs,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.reading') || 'Reading',
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <InfinityEight 
              size={28} 
              isActive={focused}
            />
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
              onPress={() => router.push('/statistics')}
              style={{ marginRight: 15 }}
            >
              <StatisticsIcon size={24} color={theme.colors.primary.gold} showLabel={true} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ focused }) => (
            <HistoryScroll size={28} isActive={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('tabs.library') || 'Library',
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <LibraryBook size={28} isActive={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile') || 'Profile',
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <ProfileIcon 
              size={28} 
              isActive={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
