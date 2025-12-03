// app/statistics.tsx
import { Stack } from 'expo-router';
import StatisticsScreen from '../src/screens/StatisticsScreen';
import theme from '../src/shared/theme';

export default function Statistics() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Statistics',
          headerShown: true,
          presentation: 'card',
          headerStyle: { 
            backgroundColor: theme.colors.neutrals.black,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.primary.goldDark,
          },
          headerTintColor: theme.colors.primary.gold,
          headerTitleStyle: {
            color: theme.colors.text.primary,
            fontFamily: 'Cinzel_600SemiBold',
            fontSize: theme.typography.fontSize.xl,
            letterSpacing: 0.5,
          },
          headerBackTitle: 'Back',
        }}
      />
      <StatisticsScreen />
    </>
  );
}
