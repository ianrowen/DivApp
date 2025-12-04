// app/spread-selection.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../src/core/api/supabase';
import theme from '../src/theme';
import MysticalBackground from '../src/shared/components/ui/MysticalBackground';
import ThemedText from '../src/shared/components/ui/ThemedText';
import ThemedButton from '../src/shared/components/ui/ThemedButton';
import ThemedCard from '../src/shared/components/ui/ThemedCard';
import { useTranslation } from '../src/i18n';
import { getAvailableSpreads } from '../src/services/spreadService';
import type { TarotSpread } from '../src/types/spreads';

export default function SpreadSelectionScreen() {
  const { question } = useLocalSearchParams<{ question: string }>();
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [spreads, setSpreads] = useState<TarotSpread[]>([]);
  const [allSpreads, setAllSpreads] = useState<TarotSpread[]>([]);
  const [suggestedSpread, setSuggestedSpread] = useState<TarotSpread | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'premium'>('free');
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(question || '');
  const [isTyping, setIsTyping] = useState(false);
  const routerNav = useRouter();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadUserDataAndSpreads();
  }, []);

  // Update editedQuestion when question prop changes (from navigation)
  useEffect(() => {
    if (question) {
      setEditedQuestion(question);
    }
  }, [question]);

  // Auto-suggest when user stops typing (debounced)
  useEffect(() => {
    if (!isTyping && editedQuestion && editedQuestion.trim().length > 0 && spreads.length > 0) {
      const timeoutId = setTimeout(() => {
        setSuggesting(true);
        suggestSpreadForQuestion(editedQuestion.trim(), spreads);
      }, 1000); // 1 second after user stops typing

      return () => clearTimeout(timeoutId);
    }
  }, [isTyping, editedQuestion, spreads.length]);

  const handleQuestionChange = (text: string) => {
    setEditedQuestion(text);
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Reset typing flag after user stops typing (debounced)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleAskAgain = () => {
    if (editedQuestion.trim().length > 0) {
      setSuggesting(true);
      suggestSpreadForQuestion(editedQuestion.trim(), spreads);
    }
  };

  const loadUserDataAndSpreads = async () => {
    try {
      // Load user tier and beta status
      const { data: { user } } = await supabase.auth.getUser();
      let tier: 'free' | 'premium' = 'free';
      let betaTester = false;

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier, is_beta_tester')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          tier = profile.subscription_tier || 'free';
          betaTester = profile.is_beta_tester || false;
          setUserTier(tier);
          setIsBetaTester(betaTester);
        }
      }

      // Load ALL spreads (for display with locks)
      const { data: allData } = await supabase
        .from('tarot_spreads')
        .select('*')
        .order('card_count', { ascending: true })
        .order('spread_key', { ascending: true });
      
      setAllSpreads(allData as TarotSpread[] || []);

      // Load available spreads (user can actually use)
      const availableSpreads = await getAvailableSpreads(tier, betaTester);
      setSpreads(availableSpreads);
      setLoading(false); // Show UI immediately

      // Get initial suggestion immediately (non-blocking for better UX)
      if (editedQuestion && editedQuestion.trim().length > 0) {
        setSuggesting(true);
        // Don't await - let it run in background so UI shows immediately
        suggestSpreadForQuestion(editedQuestion.trim(), availableSpreads).catch((error) => {
          console.error('Suggestion error:', error);
          setSuggesting(false);
        });
      }
    } catch (error) {
      console.error('Error loading spreads:', error);
    } finally {
      setLoading(false);
    }
  };

  const suggestSpreadForQuestion = async (
    userQuestion: string,
    availableSpreads: TarotSpread[]
  ) => {
    try {
      // Rule-based suggestion (NO AI call for speed + token efficiency)
      const q = userQuestion.toLowerCase();
      
      // Keywords for different spread types
      const temporalKeywords = ['past', 'future', 'before', 'after', 'history', 'timeline', 'will', 'was', 'going to', 'happened'];
      const reflectiveKeywords = ['self', 'myself', 'who am i', 'feel', 'emotion', 'spiritual', 'growth', 'understanding', 'confused'];
      const comparativeKeywords = ['should i', 'or', 'choice', 'option', 'path', 'decide', 'compare', 'versus', 'vs'];
      const challengeKeywords = ['problem', 'challenge', 'obstacle', 'difficulty', 'issue', 'struggle', 'overcome', 'stuck'];
      const complexKeywords = ['life', 'everything', 'major', 'important decision', 'comprehensive', 'deep', 'detailed'];
      
      let suggested: TarotSpread | null = null;

      // Check for complex (Celtic Cross) - only if available
      if (complexKeywords.some(k => q.includes(k))) {
        suggested = availableSpreads.find(s => s.spread_key === 'celtic_cross') || null;
      }

      // Check for temporal (3-card P/P/F)
      if (!suggested && temporalKeywords.some(k => q.includes(k))) {
        suggested = availableSpreads.find(s => s.spread_key === 'three_card_past_present_future') || null;
      }

      // Check for reflective (3-card M/B/S)
      if (!suggested && reflectiveKeywords.some(k => q.includes(k))) {
        suggested = availableSpreads.find(s => s.spread_key === 'three_card_mind_body_spirit') || null;
      }

      // Check for comparative (2-card Situation/Advice)
      if (!suggested && comparativeKeywords.some(k => q.includes(k))) {
        suggested = availableSpreads.find(s => s.spread_key === 'two_card_situation_advice') || null;
      }

      // Check for challenge (2-card Challenge/Outcome)
      if (!suggested && challengeKeywords.some(k => q.includes(k))) {
        suggested = availableSpreads.find(s => s.spread_key === 'two_card_challenge_outcome') || null;
      }

      // Default: pick best available spread
      if (!suggested) {
        // Prefer 3-card if available, then 2-card, then single
        suggested = availableSpreads.find(s => s.card_count === 3)
          || availableSpreads.find(s => s.card_count === 2)
          || availableSpreads[0];
      }

      setSuggestedSpread(suggested);
    } catch (error) {
      console.error('Error getting spread suggestion:', error);
      setSuggestedSpread(availableSpreads[0]);
    } finally {
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

    console.log('📍 Selected spread:', spread.spread_key);
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
          <ActivityIndicator size="large" color={theme.colors.primary.gold} />
        </View>
      </MysticalBackground>
    );
  }

  return (
    <MysticalBackground variant="default">
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              onPress={() => routerNav.back()}
              style={styles.backButton}
            >
              <ThemedText variant="body" style={styles.backButtonText}>
                ← {t('common.back')}
              </ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText variant="h1" style={styles.title}>
            {t('spreads.selectSpread')}
          </ThemedText>
          
          {/* Question Field - Always Editable */}
          {editedQuestion && (
            <ThemedCard variant="minimal" style={styles.questionCard}>
              <ThemedText variant="caption" style={styles.questionLabel}>
                {t('home.questionPrompt')}
              </ThemedText>
              <TextInput
                style={styles.questionInput}
                value={editedQuestion}
                onChangeText={handleQuestionChange}
                onBlur={() => setIsTyping(false)} // Mark as done typing on blur
                multiline
                maxLength={500}
                placeholder={t('home.questionPlaceholder')}
                placeholderTextColor={theme.colors.text.tertiary}
              />
              <View style={styles.questionActions}>
                <ThemedText variant="caption" style={styles.charCount}>
                  {editedQuestion.length}/500
                </ThemedText>
                <ThemedButton
                  title={t('home.askQuestion')}
                  onPress={handleAskAgain}
                  variant="primary"
                  disabled={editedQuestion.trim().length === 0 || suggesting}
                  style={styles.askButton}
                />
              </View>
            </ThemedCard>
          )}
        </View>

        {/* Suggested Spread */}
        {suggesting ? (
          <ThemedCard variant="elevated" style={styles.suggestedCard}>
            <ActivityIndicator size="small" color={theme.colors.primary.gold} />
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
          
          return (
            <TouchableOpacity
              key={spread.id}
              onPress={() => handleSelectSpread(spread)}
              activeOpacity={locked ? 1 : 0.7}
              disabled={locked}
            >
               <ThemedCard
                 variant={isSuggested ? 'elevated' : 'default'}
                 style={locked ? [styles.spreadCard, styles.lockedCard] : styles.spreadCard}
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
                       {locked && (
                         <View style={styles.lockBadge}>
                           <ThemedText variant="caption" style={styles.lockText}>
                             🔒
                           </ThemedText>
                         </View>
                       )}
                       {spread.is_premium && !locked && (
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.md,
  },
  backButton: {
    paddingVertical: theme.spacing.spacing.sm,
    paddingHorizontal: theme.spacing.spacing.md,
  },
  backButtonText: {
    color: theme.colors.primary.goldLight,
    fontSize: theme.typography.fontSize.md,
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
  questionInput: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderWidth: 1,
    borderColor: theme.colors.primary.goldDark,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.spacing.sm,
  },
  questionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
  },
  askButton: {
    minWidth: 120,
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