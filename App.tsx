// App.tsx - Root component for Divin8 app
// IMPORTANT: These must be imported first
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/core/api/supabase';
import { useTranslation } from './src/i18n';
import theme from './src/shared/theme';

// Screens
import LoginScreen from './src/features/auth/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import TarotReadingScreen from './src/screens/TarotReadingScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Define navigation param types
export type AppStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  TarotReading: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Statistics: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom Tab Navigator for authenticated screens
function MainTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.neutrals.darkGray,
          borderTopColor: theme.colors.neutrals.midGray,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary.gold,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home.welcome'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔮</Text>,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: t('history.title'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📜</Text>,
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          tabBarLabel: t('statistics.title'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('profile.title'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    // You can add a loading screen here if needed
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {session ? (
          // Authenticated screens
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="TarotReading" component={TarotReadingScreen} />
          </>
        ) : (
          // Unauthenticated screen
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

