// src/shared/components/DailyCardDraw.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LOCAL_RWS_CARDS } from '../../systems/tarot/data/localCardData';
import { getLocalizedCard } from '../../systems/tarot/utils/cardHelpers';
import theme from '../theme';
import ThemedText from './ui/ThemedText';
import ThemedCard from './ui/ThemedCard';
import { useTranslation } from '../../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_CARD_STORAGE_KEY = 'divin8_daily_card';
const DAILY_CARD_DATE_KEY = 'divin8_daily_card_date';

export default function DailyCardDraw() {
  const { t, locale } = useTranslation();
  const [card, setCard] = useState<any>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const flipAnimation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDailyCard();
  }, []);

  const loadDailyCard = async () => {
    try {
      const today = new Date().toDateString();
      const savedDate = await AsyncStorage.getItem(DAILY_CARD_DATE_KEY);
      const savedCardCode = await AsyncStorage.getItem(DAILY_CARD_STORAGE_KEY);

      // If we have a card for today, use it
      if (savedDate === today && savedCardCode) {
        const foundCard = LOCAL_RWS_CARDS.find(c => c.code === savedCardCode);
        if (foundCard) {
          setCard(foundCard);
          return;
        }
      }

      // Otherwise, draw a new card for today
      drawNewCard();
    } catch (error) {
      console.error('Error loading daily card:', error);
      drawNewCard();
    }
  };

  const drawNewCard = async () => {
    try {
      // Shuffle and pick a random card
      const shuffled = [...LOCAL_RWS_CARDS];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const drawnCard = shuffled[0];
      const reversed = Math.random() < 0.3; // 30% chance of reversal

      const cardWithReversal = { ...drawnCard, reversed };
      setCard(cardWithReversal);

      // Save for today
      const today = new Date().toDateString();
      await AsyncStorage.setItem(DAILY_CARD_DATE_KEY, today);
      await AsyncStorage.setItem(DAILY_CARD_STORAGE_KEY, drawnCard.code);
    } catch (error) {
      console.error('Error drawing daily card:', error);
    }
  };

  const handleFlip = () => {
    if (isAnimating) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsAnimating(true);
    setIsFlipped(!isFlipped);

    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setIsAnimating(false);
    });
  };

  if (!card) {
    return null;
  }

  const localizedCard = getLocalizedCard(card);
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
              <ThemedText variant="h2" style={styles.cardTitle}>
                {localizedCard.title}
              </ThemedText>
              {card.reversed && (
                <ThemedText variant="caption" style={styles.reversedLabel}>
                  {locale === 'zh-TW' ? '逆位' : 'Reversed'}
                </ThemedText>
              )}
              <ThemedText variant="body" style={styles.cardMeaning}>
                {card.reversed
                  ? localizedCard.reversedMeaning
                  : localizedCard.uprightMeaning}
              </ThemedText>
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
            <View style={styles.cardFrontContent}>
              <ThemedText variant="h1" style={styles.cardEmoji}>
                🎴
              </ThemedText>
              <ThemedText variant="body" style={styles.tapToReveal}>
                {locale === 'zh-TW' ? '點擊翻牌' : 'Tap to Reveal'}
              </ThemedText>
            </View>
          </Animated.View>
        </View>
      </TouchableOpacity>
      <ThemedText variant="caption" style={styles.hint}>
        {locale === 'zh-TW'
          ? '每日一張卡牌，為您指引方向'
          : 'One card a day to guide your path'}
      </ThemedText>
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 400,
    marginBottom: theme.spacing.spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.md,
    color: theme.colors.primary.gold,
  },
  cardContainer: {
    width: '100%',
    minHeight: 200,
    marginBottom: theme.spacing.spacing.sm,
  },
  cardWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary.gold,
  },
  cardFront: {
    backgroundColor: theme.colors.neutrals.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    backgroundColor: theme.colors.neutrals.darkGray,
    padding: theme.spacing.spacing.md,
  },
  cardFrontContent: {
    alignItems: 'center',
  },
  cardBackContent: {
    flex: 1,
  },
  cardEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.spacing.sm,
  },
  tapToReveal: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
  cardMeaning: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 18,
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
});


