// app/spread-selection.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/core/api/supabase';
import theme from '../src/theme';
import MysticalBackground from '../src/shared/components/ui/MysticalBackground';
import ThemedText from '../src/shared/components/ui/ThemedText';
import ThemedButton from '../src/shared/components/ui/ThemedButton';
import ThemedCard from '../src/shared/components/ui/ThemedCard';
import { useTranslation } from '../src/i18n';
import { getAvailableSpreads } from '../src/services/spreadService';
import type { TarotSpread } from '../src/types/spreads';
import AIProvider from '../src/core/api/aiProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SpreadSelectionScreen() {
  const { question } = useLocalSearchParams<{ question: string }>();
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(true);
  const [spreads, setSpreads] = useState<TarotSpread[]>([]);
  const [suggestedSpread, setSuggestedSpread] = useState<TarotSpread | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'premium'>('free');
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [cachedModel, setCachedModel] = useState<string | null>(null);

  useEffect(() => {
    loadCachedModel();
    loadUserDataAndSpreads();
    if (question) {
      setCurrentQuestion(question);
    }
  }, [question]);

  // Load cached model on mount
  const loadCachedModel = async () => {
    try {
      const cached = await AsyncStorage.getItem('gemini_spread_model');
      if (cached) {
        setCachedModel(cached);
        console.log('📦 Loaded cached model:', cached);
      }
    } catch (error) {
      console.warn('Error loading cached model:', error);
    }
  };

  // Save working model to cache
  const saveCachedModel = async (modelName: string) => {
    try {
      await AsyncStorage.setItem('gemini_spread_model', modelName);
      setCachedModel(modelName);
      console.log('💾 Cached working model:', modelName);
    } catch (error) {
      console.warn('Error saving cached model:', error);
    }
  };

  // Auto-update suggestion when question changes (debounced)
  useEffect(() => {
    if (!currentQuestion.trim() || currentQuestion === question || spreads.length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (currentQuestion.trim()) {
        setSuggesting(true);
        suggestSpreadForQuestion(currentQuestion.trim(), spreads);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  const loadUserDataAndSpreads = async () => {
    try {
      // Load user tier and beta status
      let tier: 'free' | 'premium' = 'free';
      let beta = false;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier, is_beta_tester')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          tier = (profile.subscription_tier || 'free') as 'free' | 'premium';
          beta = profile.is_beta_tester || false;
          setUserTier(tier);
          setIsBetaTester(beta);
        }
      }

      // Load available spreads using the loaded values
      const availableSpreads = await getAvailableSpreads(tier, beta);
      setSpreads(availableSpreads);
      setLoading(false); // Show spreads immediately

      // Get AI suggestion in background (don't block UI)
      if (question) {
        // Don't await - let it run in background
        suggestSpreadForQuestion(question, availableSpreads).catch((error) => {
          console.error('Background suggestion error:', error);
        });
      } else {
        setSuggesting(false);
      }
    } catch (error) {
      console.error('Error loading spreads:', error);
      setLoading(false);
      setSuggesting(false);
    }
  };

  // Helper function to list available models (for debugging)
  const listAvailableModels = async () => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      const data = await response.json();
      const models = data.models?.filter((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent')
      ) || [];
      console.log('Available models:', models.map((m: any) => m.name));
      return models.map((m: any) => m.name);
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  };

  const suggestSpreadForQuestion = async (
    userQuestion: string,
    availableSpreads: TarotSpread[]
  ) => {
    try {
      // First try rule-based matching for common patterns (fast, no API call)
      const questionLower = userQuestion.toLowerCase();
      
      // Check for timeline/past-present-future keywords
      if (questionLower.match(/\b(past|present|future|before|after|timeline|progress|over time|will|was|is|will be)\b/)) {
        const timelineSpread = availableSpreads.find(s => s.spread_key === 'three_card_past_present_future');
        if (timelineSpread) {
          setSuggestedSpread(timelineSpread);
          setSuggesting(false);
          return;
        }
      }
      
      // Check for self-reflection keywords
      if (questionLower.match(/\b(mind|body|spirit|inner self|personal growth|self|reflection|spiritual)\b/)) {
        const reflectionSpread = availableSpreads.find(s => s.spread_key === 'three_card_mind_body_spirit');
        if (reflectionSpread) {
          setSuggestedSpread(reflectionSpread);
          setSuggesting(false);
          return;
        }
      }
      
      // Check for comparison keywords
      if (questionLower.match(/\b(compare|comparison|versus|vs|between|which|option|choice|better|or)\b/)) {
        const comparisonSpread = availableSpreads.find(s => 
          s.spread_key === 'two_card_situation_advice' || s.spread_key === 'two_card_challenge_outcome'
        );
        if (comparisonSpread) {
          setSuggestedSpread(comparisonSpread);
          setSuggesting(false);
          return;
        }
      }
      
      // Check for very simple yes/no questions
      if (questionLower.match(/^(should i|can i|will i|is|are|do|does|did)\b/i) && questionLower.length < 50) {
        const simpleSpread = availableSpreads.find(s => s.spread_key === 'single_card');
        if (simpleSpread) {
          setSuggestedSpread(simpleSpread);
          setSuggesting(false);
          return;
        }
      }
      
      // For complex questions, use the main AIProvider (which already works)
      // This uses gemini-2.5-flash but with much higher token limit to handle thinking tokens
      const spreadList = availableSpreads
        .map(s => `${s.spread_key}(${s.card_count})`)
        .join(', ');
  
      const prompt = `Q: "${userQuestion}"

Spreads: ${spreadList}

Rules:
-timeline → three_card_past_present_future
-self-reflection → three_card_mind_body_spirit
-comparison → two_card_situation_advice or two_card_challenge_outcome
-simple yes/no → single_card
-relationship/career/decision: simple→two_card_challenge_outcome, moderate→three_card_past_present_future, complex→celtic_cross
-very complex → celtic_cross
-default → three_card_past_present_future

Output: spread_key only`;

      // Use the main AIProvider which is already configured and working
      // Increase maxTokens significantly to account for thinking tokens (~500) + output (~100)
      // Thinking tokens are cheaper, so this won't significantly increase cost
      const result = await AIProvider.generate({
        prompt,
        systemPrompt: 'Tarot expert. Match spread to question. Output: spread_key only.',
        maxTokens: 800, // High limit: ~500 thinking + ~100 output + ~200 buffer = safe margin
        temperature: 0.2,
      });

      const aiText = result.text || '';

      // Extract spread_key from response (handle cases where AI adds extra text)
      const responseText = aiText.trim().toLowerCase();
      console.log('AI response:', responseText); // Debug log
      
      // Try to find spread_key in response
      let suggestedKey = responseText.split(/\s+/)[0].replace(/[^a-z_]/g, '');
      
      // If first word doesn't match, search for any spread_key in the response
      if (!availableSpreads.find(s => s.spread_key === suggestedKey)) {
        for (const spread of availableSpreads) {
          if (responseText.includes(spread.spread_key)) {
            suggestedKey = spread.spread_key;
            break;
          }
        }
      }
      
      const suggested = availableSpreads.find(s => s.spread_key === suggestedKey);
      
      if (!suggested) {
        console.warn('No matching spread found, using default');
        // Use first available spread as neutral fallback
        setSuggestedSpread(availableSpreads[0]);
      } else {
        setSuggestedSpread(suggested);
      }
    } catch (error) {
      console.error('Error getting spread suggestion:', error);
      // Neutral fallback - use first available spread
      setSuggestedSpread(availableSpreads[0]);
    } finally {
      setSuggesting(false);
    }
  };

  const handleSelectSpread = (spread: TarotSpread) => {
    router.push({
      pathname: '/reading',
      params: {
        question: currentQuestion || question || '',
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
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h1" style={styles.title}>
            {t('spreads.selectSpread')}
          </ThemedText>
          {(question || currentQuestion) && (
            <ThemedCard variant="minimal" style={styles.questionCard}>
              <ThemedText variant="caption" style={styles.questionLabel}>
                {t('home.questionPrompt')}
              </ThemedText>
              <TextInput
                style={styles.questionInput}
                placeholder={t('home.questionPlaceholder')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={currentQuestion}
                onChangeText={setCurrentQuestion}
                multiline
                maxLength={500}
              />
              <ThemedText variant="caption" style={styles.charCount}>
                {currentQuestion.length}/500
              </ThemedText>
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

        {spreads.map((spread) => (
          <TouchableOpacity
            key={spread.id}
            onPress={() => handleSelectSpread(spread)}
            activeOpacity={0.7}
          >
            <ThemedCard
              variant={spread.id === suggestedSpread?.id ? 'elevated' : 'default'}
              style={styles.spreadCard}
            >
              <View style={styles.spreadHeader}>
                <View style={styles.spreadTitleRow}>
                  <ThemedText variant="h3" style={styles.spreadName}>
                    {getLocalizedSpreadName(spread)}
                  </ThemedText>
                  {spread.is_premium && (
                    <View style={styles.premiumBadge}>
                      <ThemedText variant="caption" style={styles.premiumText}>
                        {t('spreads.premium')}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText variant="caption" style={styles.cardCount}>
                  {spread.card_count} {t('spreads.cards')}
                </ThemedText>
              </View>
              {spread.description && (
                <ThemedText variant="body" style={styles.spreadDescription}>
                  {getLocalizedSpreadDescription(spread)}
                </ThemedText>
              )}
            </ThemedCard>
          </TouchableOpacity>
        ))}

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
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.md,
  },
  questionCard: {
    padding: theme.spacing.spacing.md,
  },
  questionLabel: {
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.spacing.xs,
  },
  questionInput: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary.goldDark,
  },
  charCount: {
    textAlign: 'right',
    color: theme.colors.text.tertiary,
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