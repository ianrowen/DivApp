// src/screens/HomeScreen.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { supabaseHelpers } from '../core/api/supabase';
import type { AppStackParamList } from '../../App';
import theme from '../shared/theme';
import MysticalBackground from '../shared/components/ui/MysticalBackground';
import ThemedText from '../shared/components/ui/ThemedText';
import ThemedButton from '../shared/components/ui/ThemedButton';
import ThemedCard from '../shared/components/ui/ThemedCard';

type Props = StackScreenProps<AppStackParamList, 'Home'>;

// This is the main screen after login - mystical divination portal
export default function HomeScreen({ navigation }: Props) {
  const [loading, setLoading] = React.useState(false);
  
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabaseHelpers.signOut();
      // App.tsx will detect the session change and navigate to LoginScreen
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MysticalBackground variant="default">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Welcome Section */}
        <View style={styles.header}>
          <ThemedText variant="h1" style={styles.welcomeEmoji}>
            🔮
          </ThemedText>
          <ThemedText variant="h1">Welcome Back, Querent.</ThemedText>
          <View style={styles.subtitleSpacer} />
          <ThemedText variant="body">Your journey awaits.</ThemedText>
        </View>

        {/* Divination Systems Card */}
        <ThemedCard variant="elevated" style={styles.systemsCard}>
          <ThemedText variant="h2" style={styles.cardTitle}>
            Divination Systems
          </ThemedText>
          <View style={styles.buttonContainer}>
            <ThemedButton
              title="Start Tarot Reading"
              onPress={() => navigation.navigate('TarotReading')}
              variant="primary"
              style={styles.primaryActionButton}
            />
            <View style={styles.buttonSpacer} />
            <ThemedButton
              title="Reading History"
              onPress={() => navigation.navigate('History')}
              variant="secondary"
            />
          </View>
        </ThemedCard>

        {/* Sign Out Section */}
        <View style={styles.signOutContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary.gold} />
          ) : (
            <ThemedButton
              title="Sign Out"
              onPress={handleSignOut}
              variant="ghost"
              style={styles.signOutButton}
              textStyle={styles.signOutText}
            />
          )}
        </View>
      </ScrollView>
    </MysticalBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.spacing.lg,
    paddingTop: theme.spacing.spacing.xxl,
    paddingBottom: theme.spacing.spacing.xl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.xl,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.spacing.md,
  },
  subtitleSpacer: {
    height: theme.spacing.spacing.sm,
  },
  systemsCard: {
    width: '100%',
    maxWidth: 400,
    marginBottom: theme.spacing.spacing.xl,
  },
  cardTitle: {
    marginBottom: theme.spacing.spacing.lg,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
  primaryActionButton: {
    marginBottom: 0,
  },
  buttonSpacer: {
    height: theme.spacing.spacing.md,
  },
  signOutContainer: {
    marginTop: 'auto',
    paddingTop: theme.spacing.spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  signOutButton: {
    width: '100%',
  },
  signOutText: {
    color: theme.colors.text.tertiary,
  },
});
