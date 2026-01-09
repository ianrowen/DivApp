// app/analysis.tsx
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import AnalysisScreen from '../src/screens/AnalysisScreen';
import ThemedText from '../src/shared/components/ui/ThemedText';
import theme from '../src/theme';

export default function Analysis() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Analysis',
          headerShown: true,
          presentation: 'card',
          headerStyle: { 
            backgroundColor: theme.colors.neutrals.black,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.primary.goldDark,
            height: 60,
          },
          headerTintColor: theme.colors.primary.gold,
          headerTitleStyle: {
            fontFamily: 'Cinzel_600SemiBold',
            fontSize: 24,
            color: theme.colors.primary.gold,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          },
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 20, padding: 10 }}
            >
              <ThemedText variant="body" style={{ 
                color: theme.colors.primary.gold, 
                fontSize: 18,
                fontFamily: 'Lato_400Regular',
              }}>
                ← Back
              </ThemedText>
            </TouchableOpacity>
          ),
        }}
      />
      <AnalysisScreen />
    </>
  );
}
