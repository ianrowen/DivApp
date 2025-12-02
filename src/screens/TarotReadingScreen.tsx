import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AppStackParamList } from '../../App';
import { useTranslation } from '../i18n';
import theme from '../shared/theme';
import MysticalBackground from '../shared/components/ui/MysticalBackground';
import ThemedText from '../shared/components/ui/ThemedText';
import ThemedButton from '../shared/components/ui/ThemedButton';
import ThemedCard from '../shared/components/ui/ThemedCard';

type Props = StackScreenProps<AppStackParamList, 'TarotReading'>;

export default function TarotReadingScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <MysticalBackground variant="default">
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText variant="h1" style={styles.heading}>
          {t('reading.title')}
        </ThemedText>
        <ThemedText variant="body" style={styles.paragraph}>
          {t('reading.comingSoon')}
        </ThemedText>

        <ThemedCard variant="elevated" style={styles.card}>
          <ThemedText variant="h3" style={styles.cardTitle}>
            {t('reading.whatsComing')}
          </ThemedText>
          <ThemedText variant="body" style={styles.listItem}>
            {t('reading.pickSpread')}
          </ThemedText>
          <ThemedText variant="body" style={styles.listItem}>
            {t('reading.drawCardsFromDeck')}
          </ThemedText>
          <ThemedText variant="body" style={styles.listItem}>
            {t('reading.aiInterpretations')}
          </ThemedText>
          <ThemedText variant="body" style={styles.listItem}>
            {t('reading.saveReadings')}
          </ThemedText>
        </ThemedCard>

        <ThemedText variant="body" style={styles.paragraph}>
          {t('reading.runReadingWeb')}
        </ThemedText>

        <ThemedButton
          title={t('reading.backToHome')}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          variant="primary"
          style={styles.backButton}
        />
      </ScrollView>
    </MysticalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: theme.spacing.spacing.lg,
    paddingTop: theme.spacing.spacing.xxl,
  },
  heading: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.md,
    textAlign: 'center',
  },
  paragraph: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.spacing.lg,
    lineHeight: 22,
  },
  card: {
    marginBottom: theme.spacing.spacing.xl,
  },
  cardTitle: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.md,
  },
  listItem: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.spacing.sm,
  },
  backButton: {
    marginTop: theme.spacing.spacing.md,
  },
});



