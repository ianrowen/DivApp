import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import theme from '../../src/shared/theme';
import ThemedText from '../../src/shared/components/ui/ThemedText';
import ThemedCard from '../../src/shared/components/ui/ThemedCard';

export default function LibraryScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <ThemedText variant="h1" style={styles.heroIcon}>📚</ThemedText>
        <ThemedText variant="h2" style={styles.title}>Library</ThemedText>
        <ThemedText variant="body" style={styles.subtitle}>
          Reference & Knowledge
        </ThemedText>
        
        <ThemedCard variant="elevated" style={styles.comingSoonCard}>
          <ThemedText variant="h3" style={styles.comingSoonTitle}>
            Coming Soon
          </ThemedText>
          <View style={styles.divider} />
          <ThemedText variant="body" style={styles.comingSoonBody}>
            Explore all tarot cards, spreads, and divination systems. Learn the mythology and meanings behind the cards.
          </ThemedText>
        </ThemedCard>
        
        <View style={styles.featuresList}>
          <ThemedText variant="h3" style={styles.featuresTitle}>
            What's Coming:
          </ThemedText>
          
          {[
            { icon: '🃏', title: 'Complete Tarot Deck', desc: 'All 78 cards with detailed interpretations' },
            { icon: '🔮', title: 'Spread Library', desc: 'Learn every spread with visual guides' },
            { icon: '📖', title: 'Tarot History', desc: 'Origins and evolution of divination' },
            { icon: '☯️', title: 'I Ching Reference', desc: '64 hexagrams and their meanings' },
            { icon: '⭐', title: 'Astrology Guide', desc: 'Planets, signs, and houses explained' },
            { icon: '🔗', title: 'Cross-System Links', desc: 'How different traditions connect' },
          ].map((feature, index) => (
            <ThemedCard key={index} style={styles.featureCard}>
              <View style={styles.featureRow}>
                <ThemedText variant="h1" style={styles.featureIcon}>
                  {feature.icon}
                </ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText variant="h3" style={styles.featureTitle}>
                    {feature.title}
                  </ThemedText>
                  <ThemedText variant="body" style={styles.featureDesc}>
                    {feature.desc}
                  </ThemedText>
                </View>
              </View>
            </ThemedCard>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutrals.black,
  },
  content: {
    padding: theme.spacing.spacing.lg,
    paddingBottom: theme.spacing.spacing.xxl,
  },
  heroIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.spacing.xl,
  },
  comingSoonCard: {
    marginBottom: theme.spacing.spacing.xl,
  },
  comingSoonTitle: {
    textAlign: 'center',
    color: theme.colors.primary.goldLight,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.primary.goldDark,
    marginVertical: theme.spacing.spacing.md,
    opacity: 0.3,
  },
  comingSoonBody: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.relaxed,
  },
  featuresList: {
    gap: theme.spacing.spacing.sm,
  },
  featuresTitle: {
    marginBottom: theme.spacing.spacing.md,
  },
  featureCard: {
    marginBottom: theme.spacing.spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: theme.spacing.spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    marginBottom: theme.spacing.spacing.xs,
  },
  featureDesc: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
});
