import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import ThemedText from '../../src/shared/components/ui/ThemedText';
import ThemedCard from '../../src/shared/components/ui/ThemedCard';
import MysticalBackground from '../../src/shared/components/ui/MysticalBackground';
import theme from '../../src/theme';
import { useTranslation } from '../../src/i18n';

export default function LibraryScreen() {
  const { t } = useTranslation();
  return (
    <MysticalBackground variant="default">
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 
          NO HEADER HERE - Navigation provides "LIBRARY" 
          This is the pattern: navigation header = ALL CAPS label
          Content starts immediately with actual content
        */}
        
        {/* Coming Soon Card */}
        <ThemedCard variant="elevated" style={styles.comingSoonCard}>
          <ThemedText variant="h2" style={styles.comingSoonTitle}>
            {t('library.comingSoonTitle')}
          </ThemedText>
          <ThemedText variant="body" style={styles.comingSoonText}>
            {t('library.comingSoonDescription')}
          </ThemedText>
        </ThemedCard>

        <ThemedText variant="h3" style={styles.sectionTitle}>
          {t('library.whatsComingTitle')}
        </ThemedText>

        {/* Feature Cards - All use ThemedText for consistency */}
        <ThemedCard variant="default" style={styles.featureCard}>
          <View style={styles.featureRow}>
            <ThemedText variant="h1" style={styles.featureEmoji}>🃏</ThemedText>
            <View style={styles.featureText}>
              <ThemedText variant="h3" style={styles.featureTitle}>
                {t('library.completeTarotDeck')}
              </ThemedText>
              <ThemedText variant="body" style={styles.featureDescription}>
                {t('library.completeTarotDeckDesc')}
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        <ThemedCard variant="default" style={styles.featureCard}>
          <View style={styles.featureRow}>
            <ThemedText variant="h1" style={styles.featureEmoji}>🔮</ThemedText>
            <View style={styles.featureText}>
              <ThemedText variant="h3" style={styles.featureTitle}>
                {t('library.spreadLibrary')}
              </ThemedText>
              <ThemedText variant="body" style={styles.featureDescription}>
                {t('library.spreadLibraryDesc')}
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        <ThemedCard variant="default" style={styles.featureCard}>
          <View style={styles.featureRow}>
            <ThemedText variant="h1" style={styles.featureEmoji}>📖</ThemedText>
            <View style={styles.featureText}>
              <ThemedText variant="h3" style={styles.featureTitle}>
                {t('library.tarotHistory')}
              </ThemedText>
              <ThemedText variant="body" style={styles.featureDescription}>
                {t('library.tarotHistoryDesc')}
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        <ThemedCard variant="default" style={styles.featureCard}>
          <View style={styles.featureRow}>
            <ThemedText variant="h1" style={styles.featureEmoji}>☯️</ThemedText>
            <View style={styles.featureText}>
              <ThemedText variant="h3" style={styles.featureTitle}>
                {t('library.iChingReference')}
              </ThemedText>
              <ThemedText variant="body" style={styles.featureDescription}>
                {t('library.iChingReferenceDesc')}
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        <ThemedCard variant="default" style={styles.featureCard}>
          <View style={styles.featureRow}>
            <ThemedText variant="h1" style={styles.featureEmoji}>⭐</ThemedText>
            <View style={styles.featureText}>
              <ThemedText variant="h3" style={styles.featureTitle}>
                {t('library.astrologyGuide')}
              </ThemedText>
              <ThemedText variant="body" style={styles.featureDescription}>
                {t('library.astrologyGuideDesc')}
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        <ThemedCard variant="default" style={styles.featureCard}>
          <View style={styles.featureRow}>
            <ThemedText variant="h1" style={styles.featureEmoji}>🔗</ThemedText>
            <View style={styles.featureText}>
              <ThemedText variant="h3" style={styles.featureTitle}>
                {t('library.crossSystemLinks')}
              </ThemedText>
              <ThemedText variant="body" style={styles.featureDescription}>
                {t('library.crossSystemLinksDesc')}
              </ThemedText>
            </View>
          </View>
        </ThemedCard>
      </ScrollView>
    </MysticalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.spacing.lg,
    paddingTop: theme.spacing.spacing.xl,
    paddingBottom: theme.spacing.spacing.xxl,
  },
  comingSoonCard: {
    padding: theme.spacing.spacing.lg,
    marginBottom: theme.spacing.spacing.xl,
    alignItems: 'center',
  },
  comingSoonTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.md,
  },
  comingSoonText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  sectionTitle: {
    marginBottom: theme.spacing.spacing.md,
    color: theme.colors.primary.goldLight,
    fontSize: 20,
    fontFamily: 'Cinzel_500Medium',
  },
  featureCard: {
    padding: theme.spacing.spacing.md,
    marginBottom: theme.spacing.spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.spacing.md,
    width: 40,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    marginBottom: theme.spacing.spacing.xs,
  },
  featureDescription: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
});
