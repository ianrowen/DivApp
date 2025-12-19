// app/spread-selection.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Stack, router, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../src/core/api/supabase';
import theme from '../src/theme';
import MysticalBackground from '../src/shared/components/ui/MysticalBackground';
import ThemedText from '../src/shared/components/ui/ThemedText';
import ThemedButton from '../src/shared/components/ui/ThemedButton';
import ThemedCard from '../src/shared/components/ui/ThemedCard';
import SpinningLogo from '../src/shared/components/ui/SpinningLogo';
import { useTranslation } from '../src/i18n';
import { useProfile } from '../src/contexts/ProfileContext';
import { getAvailableSpreads } from '../src/services/spreadService';
import type { TarotSpread } from '../src/types/spreads';

export default function SpreadSelectionScreen() {
  const { question } = useLocalSearchParams<{ question: string }>();
  const { t, locale } = useTranslation();
  const { profile, isLoading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [spreads, setSpreads] = useState<TarotSpread[]>([]);
  const [allSpreads, setAllSpreads] = useState<TarotSpread[]>([]);
  const [suggestedSpread, setSuggestedSpread] = useState<TarotSpread | null>(null);
  const userTier = (profile?.subscription_tier || 'free') as 'free' | 'premium';
  const isBetaTester = profile?.is_beta_tester || false;
  const routerNav = useRouter();

  useEffect(() => {
    loadUserDataAndSpreads();
  }, []);

  const loadUserDataAndSpreads = async () => {
    try {
      // Show UI immediately - don't block on data loading
      setLoading(false);

      // Load spreads FIRST (most important, cacheable)
      const { data: allData } = await supabase
        .from('tarot_spreads')
        .select('*')
        .order('card_count', { ascending: true })
        .order('spread_key', { ascending: true });
      
      const allSpreadsData = (allData as TarotSpread[]) || [];
      setAllSpreads(allSpreadsData);

      // Use cached profile from context (loaded at sign-in)
      // Filter available spreads (client-side, fast)
      const availableSpreads = isBetaTester 
        ? allSpreadsData 
        : allSpreadsData.filter(spread => !spread.is_premium || userTier !== 'free');
      
      setSpreads(availableSpreads);

      // Defer AI suggestion - don't block UI
      if (question && question.trim().length > 0) {
        // Small delay to let UI render first
        setTimeout(() => {
          setSuggesting(true);
          suggestSpreadForQuestion(question.trim(), availableSpreads).catch((error) => {
            console.error('Suggestion error:', error);
            setSuggesting(false);
          });
        }, 300);
      }
    } catch (error) {
      console.error('Error loading spreads:', error);
      setLoading(false);
    }
  };

  const suggestSpreadForQuestion = async (
    userQuestion: string,
    availableSpreads: TarotSpread[]
  ) => {
    try {
      // Filter out Celtic Cross (10-card) - shadowed out until tested
      const testableSpreads = availableSpreads.filter(s => s.spread_key !== 'celtic_cross' && s.card_count !== 10);
      
      if (testableSpreads.length === 0) {
        setSuggestedSpread(availableSpreads[0]);
        setSuggesting(false);
        return;
      }

      // FAST: Use rule-based matching first (instant)
      const q = userQuestion.toLowerCase();
      const temporalKeywords = ['past', 'future', 'before', 'after', 'history', 'timeline', 'will', 'was', 'time', 'when'];
      const reflectiveKeywords = ['self', 'myself', 'feel', 'emotion', 'spiritual', 'growth', 'mind', 'body', 'spirit'];
      const comparativeKeywords = ['should i', 'or', 'choice', 'option', 'decide', 'compare', 'which', 'better'];
      const challengeKeywords = ['problem', 'challenge', 'obstacle', 'difficulty', 'issue', 'stuck', 'help', 'trouble'];
      const adviceKeywords = ['advice', 'guidance', 'what', 'how', 'situation'];

      let suggested: TarotSpread | undefined;

      if (temporalKeywords.some(k => q.includes(k))) {
        suggested = testableSpreads.find(s => s.spread_key === 'three_card_past_present_future');
      } else if (reflectiveKeywords.some(k => q.includes(k))) {
        suggested = testableSpreads.find(s => s.spread_key === 'three_card_mind_body_spirit');
      } else if (challengeKeywords.some(k => q.includes(k))) {
        suggested = testableSpreads.find(s => s.spread_key === 'two_card_challenge_outcome');
      } else if (adviceKeywords.some(k => q.includes(k)) || comparativeKeywords.some(k => q.includes(k))) {
        suggested = testableSpreads.find(s => s.spread_key === 'two_card_situation_advice');
      }

      // If rule-based found something, use it immediately (fast!)
      if (suggested) {
        setSuggestedSpread(suggested);
        setSuggesting(false);
        
        // Optionally refine with AI in background (non-blocking)
        // This can be removed if rule-based is good enough
        return;
      }

      // Fallback: prefer 3-card, then 2-card, then single
      suggested = testableSpreads.find(s => s.card_count === 3)
        || testableSpreads.find(s => s.card_count === 2)
        || testableSpreads.find(s => s.spread_key === 'single_card')
        || testableSpreads[0];

      setSuggestedSpread(suggested);
      setSuggesting(false);
    } catch (error) {
      console.error('Error getting spread suggestion:', error);
      // Fallback to first available spread (excluding Celtic Cross)
      const fallback = availableSpreads.find(s => s.spread_key !== 'celtic_cross' && s.card_count !== 10) || availableSpreads[0];
      setSuggestedSpread(fallback);
      setSuggesting(false);
    }
  };

  // Auto-save is handled by useEffect above

  const handleSelectSpread = (spread: TarotSpread) => {
    // Check if user has access
    const hasAccess = spreads.some(s => s.id === spread.id);
    
    if (!hasAccess) {
      // Show upgrade prompt (not pushy)
      return;
    }

    router.push({
      pathname: '/reading',
      params: {
        type: 'spread',
        question: question,
        spreadKey: spread.spread_key,
      },
    });
  };

  const getLocalizedSpreadName = (spread: TarotSpread) => {
    return locale === 'zh-TW' ? spread.name.zh : spread.name.en;
  };

  const getLocalizedSpreadDescription = (spread: TarotSpread) => {
    if (!spread.description) return '';
    return locale === 'zh-TW' ? spread.description.zh : spread.description.en;
  };

  const isSpreadLocked = (spread: TarotSpread) => {
    return !spreads.some(s => s.id === spread.id);
  };

  if (loading) {
    return (
      <MysticalBackground variant="default">
        <View style={styles.centerContainer}>
          <SpinningLogo size={100} />
        </View>
      </MysticalBackground>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: t('spreads.selectSpread'),
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
              onPress={() => routerNav.back()}
              style={{ marginLeft: 20, padding: 10 }}
            >
              <ThemedText variant="body" style={{ 
                color: theme.colors.primary.gold, 
                fontSize: 18,
                fontFamily: 'Lato_400Regular',
              }}>
                ← {t('common.back')}
              </ThemedText>
            </TouchableOpacity>
          ),
        }}
      />
      <MysticalBackground variant="default">
        <ScrollView contentContainerStyle={styles.container}>
          {/* Display Question */}
          {question && (
            <ThemedCard variant="minimal" style={styles.questionCard}>
              <ThemedText variant="caption" style={styles.questionLabel}>
                {t('home.questionPrompt')}
              </ThemedText>
              <ThemedText variant="body" style={styles.questionDisplay}>
                {question}
              </ThemedText>
            </ThemedCard>
          )}

        {/* Suggested Spread */}
        {suggesting ? (
          <ThemedCard variant="elevated" style={styles.suggestedCard}>
            <SpinningLogo size={24} />
            <ThemedText variant="body" style={styles.suggestingText}>
              {t('home.suggestSpread')}...
            </ThemedText>
          </ThemedCard>
        ) : suggestedSpread ? (
          <View>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {t('spreads.suggestedForYou')}
            </ThemedText>
            <ThemedCard variant="elevated" style={styles.spreadCard}>
              <View style={styles.spreadHeader}>
                <View style={styles.spreadTitleRow}>
                  <ThemedText variant="h3" style={styles.spreadName}>
                    {getLocalizedSpreadName(suggestedSpread)}
                  </ThemedText>
                  {suggestedSpread.is_premium && (
                    <View style={styles.premiumBadge}>
                      <ThemedText variant="caption" style={styles.premiumText}>
                        {t('spreads.premium')}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText variant="caption" style={styles.cardCount}>
                  {suggestedSpread.card_count} {t('spreads.cards')}
                </ThemedText>
              </View>
              <ThemedText variant="body" style={styles.spreadDescription}>
                {getLocalizedSpreadDescription(suggestedSpread)}
              </ThemedText>
              <ThemedButton
                title={t('spreads.useThisSpread')}
                onPress={() => handleSelectSpread(suggestedSpread)}
                variant="primary"
                style={styles.selectButton}
              />
            </ThemedCard>
          </View>
        ) : null}

        {/* All Spreads */}
        <ThemedText variant="h3" style={styles.sectionTitle}>
          {t('spreads.allSpreads')}
        </ThemedText>

        {allSpreads.map((spread) => {
          const locked = isSpreadLocked(spread);
          const isSuggested = spread.id === suggestedSpread?.id;
          const isCelticCross = spread.spread_key === 'celtic_cross' || spread.card_count === 10;
          const isDisabled = locked || isCelticCross;
          
          return (
            <TouchableOpacity
              key={spread.id}
              onPress={() => handleSelectSpread(spread)}
              activeOpacity={isDisabled ? 1 : 0.7}
              disabled={isDisabled}
            >
               <ThemedCard
                 variant={isSuggested ? 'elevated' : 'default'}
                 style={isDisabled ? [styles.spreadCard, styles.lockedCard, { opacity: 0.5 }] : styles.spreadCard}
               >
                 <View style={styles.spreadHeader}>
                   <View style={styles.spreadTitleRow}>
                     <ThemedText 
                       variant="h3" 
                       style={locked ? [styles.spreadName, styles.lockedText] : styles.spreadName}
                     >
                       {getLocalizedSpreadName(spread)}
                     </ThemedText>
                     <View style={styles.badges}>
                       {isCelticCross && (
                         <View style={styles.lockBadge}>
                           <ThemedText variant="caption" style={styles.lockText}>
                             {locale === 'zh-TW' ? '測試中' : 'Testing'}
                           </ThemedText>
                         </View>
                       )}
                       {locked && !isCelticCross && (
                         <View style={styles.lockBadge}>
                           <ThemedText variant="caption" style={styles.lockText}>
                             🔒
                           </ThemedText>
                         </View>
                       )}
                       {spread.is_premium && !isDisabled && (
                         <View style={styles.premiumBadge}>
                           <ThemedText variant="caption" style={styles.premiumText}>
                             {t('spreads.premium')}
                           </ThemedText>
                         </View>
                       )}
                     </View>
                   </View>
                   <ThemedText 
                     variant="caption" 
                     style={locked ? [styles.cardCount, styles.lockedText] : styles.cardCount}
                   >
                     {spread.card_count} {t('spreads.cards')}
                   </ThemedText>
                 </View>
                 {spread.description && (
                   <ThemedText 
                     variant="body" 
                     style={locked ? [styles.spreadDescription, styles.lockedText] : styles.spreadDescription}
                   >
                     {getLocalizedSpreadDescription(spread)}
                   </ThemedText>
                 )}
               </ThemedCard>
            </TouchableOpacity>
          );
        })}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </MysticalBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.spacing.lg,
    paddingTop: theme.spacing.spacing.xl,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: theme.spacing.spacing.xl,
    paddingTop: theme.spacing.spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.md,
  },
  questionCard: {
    padding: theme.spacing.spacing.md,
    marginTop: theme.spacing.spacing.md,
  },
  questionLabel: {
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.spacing.xs,
  },
  questionDisplay: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.fontSize.md * 1.5,
    marginTop: theme.spacing.spacing.xs,
  },
  sectionTitle: {
    marginTop: theme.spacing.spacing.xl,
    marginBottom: theme.spacing.spacing.md,
    color: theme.colors.primary.goldLight,
  },
  suggestedCard: {
    alignItems: 'center',
    padding: theme.spacing.spacing.lg,
  },
  suggestingText: {
    marginTop: theme.spacing.spacing.sm,
    color: theme.colors.text.secondary,
  },
  spreadCard: {
    marginBottom: theme.spacing.spacing.md,
  },
  lockedCard: {
    opacity: 0.6,
  },
  spreadHeader: {
    marginBottom: theme.spacing.spacing.sm,
  },
  spreadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.spacing.xs,
  },
  spreadName: {
    flex: 1,
    color: theme.colors.primary.gold,
  },
  lockedText: {
    color: theme.colors.text.tertiary,
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.spacing.xs,
  },
  lockBadge: {
    backgroundColor: theme.colors.neutrals.midGray,
    paddingHorizontal: theme.spacing.spacing.sm,
    paddingVertical: theme.spacing.spacing.xs,
    borderRadius: theme.spacing.borderRadius.sm,
  },
  lockText: {
    fontSize: theme.typography.fontSize.xs,
  },
  premiumBadge: {
    backgroundColor: theme.colors.primary.crimson,
    paddingHorizontal: theme.spacing.spacing.sm,
    paddingVertical: theme.spacing.spacing.xs,
    borderRadius: theme.spacing.borderRadius.sm,
    marginLeft: theme.spacing.spacing.sm,
  },
  premiumText: {
    color: theme.colors.primary.gold,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  cardCount: {
    color: theme.colors.text.secondary,
  },
  spreadDescription: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.spacing.md,
  },
  selectButton: {
    marginTop: theme.spacing.spacing.sm,
  },
  bottomSpacer: {
    height: theme.spacing.spacing.xxl,
  },
});