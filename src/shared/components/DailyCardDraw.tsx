// src/shared/components/DailyCardDraw.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LOCAL_RWS_CARDS } from '../../systems/tarot/data/localCardData';
import { getLocalizedCard } from '../../systems/tarot/utils/cardHelpers';
import { getCardImage } from '../../systems/tarot/utils/cardImageLoader';
import theme from '../../theme';
import ThemedText from './ui/ThemedText';
import ThemedCard from './ui/ThemedCard';
import ThemedButton from './ui/ThemedButton';
import { useTranslation } from '../../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CARD_BACK_IMAGE = require('../../../assets/images/logo/divin8-card-curtains-horizontal.png');

const DAILY_CARD_STORAGE_KEY = 'divin8_daily_card';
const DAILY_CARD_DATE_KEY = 'divin8_daily_card_date';
const DAILY_CARD_REVERSED_KEY = 'divin8_daily_card_reversed';

export default function DailyCardDraw() {
  const { t, locale } = useTranslation();
  const [card, setCard] = useState<any>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldAutoFlip, setShouldAutoFlip] = useState(false);
  const flipAnimation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Always start with card back (not flipped)
    setIsFlipped(false);
    // Don't load a card automatically - wait for user to tap
  }, []);

  // Auto-flip when card is drawn and shouldAutoFlip is true
  useEffect(() => {
    if (card && shouldAutoFlip && !isFlipped) {
      setShouldAutoFlip(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsAnimating(true);
      setIsFlipped(true);
      Animated.spring(flipAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => {
        setIsAnimating(false);
      });
    }
  }, [card, shouldAutoFlip, isFlipped]);

  const drawNewCard = async (): Promise<void> => {
    try {
      // Shuffle entire deck using Fisher-Yates for true randomness
      const shuffled = [...LOCAL_RWS_CARDS];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Pick a truly random card from the entire shuffled deck
      const randomIndex = Math.floor(Math.random() * shuffled.length);
      const drawnCard = shuffled[randomIndex];
      const reversed = Math.random() < 0.3; // 30% chance of reversal

      const cardWithReversal = { ...drawnCard, reversed };
      console.log('🎴 Drawing new daily card:', drawnCard.code, 'reversed:', reversed);
      setCard(cardWithReversal);
      
      // Clear any saved card data (no persistence)
      await AsyncStorage.removeItem(DAILY_CARD_DATE_KEY);
      await AsyncStorage.removeItem(DAILY_CARD_STORAGE_KEY);
      await AsyncStorage.removeItem(DAILY_CARD_REVERSED_KEY);
    } catch (error) {
      console.error('Error drawing daily card:', error);
    }
  };

  const handleFlip = async () => {
    if (isAnimating) return;

    // If card is already flipped, navigate to reading screen
    if (isFlipped && card) {
      console.log('📍 Navigating with card:', card.code, 'reversed:', card.reversed);
      router.push({
        pathname: '/reading',
        params: {
          type: 'daily',
          cardCode: card.code,
          reversed: card.reversed ? 'true' : 'false',
        },
      });
      return;
    }

    // If no card yet, draw a new random one and mark for auto-flip
    if (!card) {
      setShouldAutoFlip(true);
      await drawNewCard();
      return;
    }

    // Card exists but not flipped - flip it
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnimating(true);
    setIsFlipped(true);

    Animated.spring(flipAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setIsAnimating(false);
    });
  };

  const localizedCard = card ? getLocalizedCard(card) : null;
  
  // Debug: Log keyword translation status
  useEffect(() => {
    if (localizedCard && card) {
      console.log(`🌐 Daily card keywords (locale: ${locale}):`, localizedCard.keywords);
      console.log(`🌐 Original keywords:`, card.keywords);
    }
  }, [localizedCard, card, locale]);
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };
  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <ThemedCard variant="elevated" style={styles.card}>
      <ThemedText variant="h3" style={styles.title}>
        {t('home.dailyDraw')}
      </ThemedText>
      <TouchableOpacity
        onPress={handleFlip}
        activeOpacity={0.9}
        style={styles.cardContainer}
      >
        <View style={styles.cardWrapper}>
          {/* Card Back */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardBack,
              backAnimatedStyle,
              { opacity: isFlipped ? 1 : 0 },
            ]}
          >
            <View style={styles.cardBackContent}>
              {card && localizedCard && (
                <>
                  {/* Card Image */}
                  <Image
                    source={getCardImage(card.code)}
                    style={[
                      styles.cardImage,
                      card.reversed && styles.cardReversedImage,
                    ]}
                    resizeMode="contain"
                  />
                  <ThemedText variant="h2" style={styles.cardTitle}>
                    {localizedCard.title}
                  </ThemedText>
                  {card.reversed && (
                    <ThemedText variant="caption" style={styles.reversedLabel}>
                      {locale === 'zh-TW' ? '逆位' : 'Reversed'}
                    </ThemedText>
                  )}
                  {/* Keywords Display - Always show if available, regardless of reversed state */}
                  {/* CRITICAL: Keywords must display for both upright and reversed cards */}
                  {(() => {
                    // Get keywords from localized card first, fallback to original card keywords
                    const localizedKeywords = localizedCard?.keywords;
                    const originalKeywords = card?.keywords;
                    
                    const keywordsToShow = (localizedKeywords && Array.isArray(localizedKeywords) && localizedKeywords.length > 0)
                      ? localizedKeywords
                      : (originalKeywords && Array.isArray(originalKeywords) && originalKeywords.length > 0)
                        ? originalKeywords // Fallback to original if localized is empty
                        : [];
                    
                    console.log(`🔑 DailyCard keywords check (reversed: ${card.reversed}):`, {
                      cardCode: card.code,
                      reversed: card.reversed,
                      locale: locale,
                      localizedKeywords: localizedKeywords,
                      originalKeywords: originalKeywords,
                      keywordsToShow: keywordsToShow,
                      keywordsLength: keywordsToShow.length,
                      willDisplay: keywordsToShow.length > 0
                    });
                    
                    // Always display keywords if they exist - reversed state doesn't affect keywords
                    if (keywordsToShow.length === 0) {
                      console.error(`❌ ERROR: No keywords found for card ${card.code} (reversed: ${card.reversed})!`, {
                        localizedCardExists: !!localizedCard,
                        cardExists: !!card,
                        localizedKeywordsType: typeof localizedKeywords,
                        originalKeywordsType: typeof originalKeywords
                      });
                      return null;
                    }
                    
                    return (
                      <View style={styles.keywordsContainer}>
                        {keywordsToShow.slice(0, 5).map((keyword: string, idx: number) => {
                          if (!keyword || typeof keyword !== 'string') {
                            console.warn(`⚠️ Invalid keyword at index ${idx}:`, keyword);
                            return null;
                          }
                          const isLast = idx === keywordsToShow.length - 1;
                          return (
                            <React.Fragment key={idx}>
                              <ThemedText variant="caption" style={styles.keyword}>
                                {keyword}
                              </ThemedText>
                              {!isLast && (
                                <ThemedText variant="caption" style={styles.keywordSeparator}>
                                  {' • '}
                                </ThemedText>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </View>
                    );
                  })()}
                </>
              )}
            </View>
          </Animated.View>

          {/* Card Front */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardFront,
              frontAnimatedStyle,
              { opacity: isFlipped ? 0 : 1 },
            ]}
          >
            <Image
              source={CARD_BACK_IMAGE}
              style={styles.cardBackImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
      {!isFlipped && (
        <ThemedText variant="caption" style={styles.hint}>
          {locale === 'zh-TW'
            ? '點擊抽取今日卡牌'
            : 'Tap to draw your daily card'}
        </ThemedText>
      )}
      {/* Show card name and keywords immediately after flip */}
      {isFlipped && card && localizedCard && (
        <View style={styles.cardInfoContainer}>
          <ThemedText variant="h2" style={styles.cardTitleBelow}>
            {localizedCard.title}
          </ThemedText>
          {card.reversed && (
            <ThemedText variant="caption" style={styles.reversedLabelBelow}>
              {locale === 'zh-TW' ? '逆位' : 'Reversed'}
            </ThemedText>
          )}
          {(() => {
            const localizedKeywords = localizedCard?.keywords;
            const originalKeywords = card?.keywords;
            const keywordsToShow = (localizedKeywords && Array.isArray(localizedKeywords) && localizedKeywords.length > 0)
              ? localizedKeywords
              : (originalKeywords && Array.isArray(originalKeywords) && originalKeywords.length > 0)
                ? originalKeywords
                : [];
            
            if (keywordsToShow.length === 0) return null;
            
            return (
              <View style={styles.keywordsContainerBelow}>
                {keywordsToShow.slice(0, 5).map((keyword: string, idx: number) => {
                  if (!keyword || typeof keyword !== 'string') return null;
                  const isLast = idx === keywordsToShow.slice(0, 5).length - 1;
                  return (
                    <React.Fragment key={idx}>
                      <ThemedText variant="caption" style={styles.keywordBelow}>
                        {keyword}
                      </ThemedText>
                      {!isLast && (
                        <ThemedText variant="caption" style={styles.keywordSeparatorBelow}>
                          {' • '}
                        </ThemedText>
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            );
          })()}
        </View>
      )}
      {isFlipped && card && (
        <ThemedButton
          title={locale === 'zh-TW' ? '查看完整解讀' : 'View Full Reading'}
          onPress={() => {
            console.log('📍 Navigating with card:', card.code, 'reversed:', card.reversed);
            router.push({
              pathname: '/reading',
              params: {
                type: 'daily',
                cardCode: card.code,
                reversed: card.reversed ? 'true' : 'false',
              },
            });
          }}
          variant="primary"
          style={styles.viewFullButton}
        />
      )}
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    marginBottom: theme.spacing.spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.md,
    color: theme.colors.primary.gold,
  },
  cardContainer: {
    width: '100%',
    minHeight: 250,
    marginBottom: theme.spacing.spacing.sm,
    padding: theme.spacing.spacing.xs,
  },
  cardWrapper: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: theme.spacing.borderRadius.lg,
    overflow: 'hidden',
  },
  cardFront: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardBackImage: {
    width: '100%',
    height: '100%',
    maxWidth: 200,
    maxHeight: 230,
    alignSelf: 'center',
  },
  cardBack: {
    backgroundColor: theme.colors.neutrals.darkGray,
    padding: theme.spacing.spacing.md,
  },
  cardBackContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cardImage: {
    width: 150,
    height: 230,
    marginBottom: theme.spacing.spacing.sm,
    borderRadius: theme.spacing.borderRadius.md,
  },
  cardReversedImage: {
    transform: [{ rotate: '180deg' }],
  },
  cardTitle: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.xs,
    textAlign: 'center',
  },
  reversedLabel: {
    color: theme.colors.semantic.error,
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.spacing.sm,
    paddingHorizontal: theme.spacing.spacing.md,
  },
  keyword: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  keywordSeparator: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
    opacity: 0.5,
  },
  hint: {
    textAlign: 'center',
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  viewFullButton: {
    marginTop: theme.spacing.spacing.md,
  },
  cardInfoContainer: {
    marginTop: theme.spacing.spacing.md,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.spacing.md,
  },
  cardTitleBelow: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.xs,
    textAlign: 'center',
  },
  reversedLabelBelow: {
    color: theme.colors.semantic.error,
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  keywordsContainerBelow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.sm,
    paddingHorizontal: theme.spacing.spacing.md,
  },
  keywordBelow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  keywordSeparatorBelow: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.sm,
    opacity: 0.5,
  },
});


