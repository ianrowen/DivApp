import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AppStackParamList } from '../../App';
import theme from '../shared/theme';
import MysticalBackground from '../shared/components/ui/MysticalBackground';
import ThemedText from '../shared/components/ui/ThemedText';
import ThemedButton from '../shared/components/ui/ThemedButton';
import ThemedCard from '../shared/components/ui/ThemedCard';

type Props = StackScreenProps<AppStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  return (
    <MysticalBackground variant="default">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Mystical Icon */}
        <View style={styles.iconContainer}>
          <ThemedText variant="h1" style={styles.mysticalIcon}>
            📜
          </ThemedText>
        </View>

        {/* Main Content Card */}
        <ThemedCard variant="elevated" style={styles.contentCard}>
          <ThemedText variant="h1" style={styles.heading}>
            Reading History
          </ThemedText>
          
          <View style={styles.spacer} />
          
          <ThemedText variant="body" style={styles.paragraph}>
            Reading history sync is scheduled for the next milestone. You&apos;ll be able to revisit past
            draws, regenerate interpretations, and export notes right from here.
          </ThemedText>
          
          <View style={styles.spacer} />
          
          <ThemedText variant="body" style={styles.paragraph}>
            Until then, you can continue saving readings in the Divin8 web app. They&apos;ll migrate over
            automatically once the in-app history module ships.
          </ThemedText>
        </ThemedCard>

        {/* Back Button */}
        <View style={styles.buttonContainer}>
          <ThemedButton
            title="Back to Home"
            onPress={() => navigation.navigate('Home')}
            variant="ghost"
          />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: theme.spacing.spacing.xl,
    alignItems: 'center',
  },
  mysticalIcon: {
    fontSize: 80,
  },
  contentCard: {
    width: '100%',
    maxWidth: 500,
    marginBottom: theme.spacing.spacing.xl,
  },
  heading: {
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.md,
  },
  spacer: {
    height: theme.spacing.spacing.md,
  },
  paragraph: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.relaxed,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 500,
    marginTop: theme.spacing.spacing.lg,
  },
});
