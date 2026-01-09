// src/shared/components/CardSelectionScreen.tsx
/**
 * CardSelectionScreen Component - Simplified version
 * Cards arranged in a fan, user taps to select cards
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import theme from '../../theme';
import MysticalBackground from './ui/MysticalBackground';
import ThemedText from './ui/ThemedText';
import { LOCAL_RWS_CARDS } from '../../systems/tarot/data/localCardData';
import type { LocalTarotCard } from '../../systems/tarot/data/localCardData';
import { getCardImage } from '../../systems/tarot/utils/cardImageLoader';
import { useTranslation } from '../../i18n';

const CARD_BACK_IMAGE = require('../../../assets/images/logo/divin8-card-curtains-horizontal.webp');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = 90;
const CARD_HEIGHT = 135;
const FAN_CARD_COUNT = 15;

interface CardSelectionScreenProps {
  cardCount: number;
  onCardsSelected: (selectedCards: LocalTarotCard[]) => void;
}

interface CardState {
  index: number;
  card: LocalTarotCard;
  isSelected: boolean;
  isFlipped: boolean;
  reversed: boolean; // Track if card is reversed
  initialPosition: { x: number; y: number; rotation: number };
  animTranslateX: Animated.Value;
  animTranslateY: Animated.Value;
  animScale: Animated.Value;
  animRotate: Animated.Value;
  animOpacity: Animated.Value;
  selectionOrder: number;
}

function CardSelectionScreen({
  cardCount,
  onCardsSelected,
}: CardSelectionScreenProps) {
  const { locale } = useTranslation();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [selectionOrder, setSelectionOrder] = useState<number[]>([]);
  const cardStatesRef = useRef<Map<number, CardState>>(new Map());
  
  // Shuffle deck once
  const shuffledDeck = useMemo(() => {
    const deck = [...LOCAL_RWS_CARDS];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }, []);

  // Calculate fan position - higher arc, wider spread
  const getFanPosition = (index: number, total: number) => {
    const centerY = SCREEN_HEIGHT * 0.6; // Higher arc
    const centerX = SCREEN_WIDTH / 2;
    const radius = SCREEN_WIDTH * 0.5; // Wide spread
    const startAngle = -70;
    const endAngle = 70;
    
    const t = total > 1 ? index / (total - 1) : 0.5;
    const angleDeg = startAngle + (endAngle - startAngle) * t;
    const angleRad = (angleDeg * Math.PI) / 180;
    
    return {
      x: centerX + radius * Math.sin(angleRad) - CARD_WIDTH / 2,
      y: centerY - radius * Math.cos(angleRad) - CARD_HEIGHT / 2,
      rotation: angleDeg,
    };
  };

  // Initialize card states
  const cardStates = useMemo(() => {
    const states = new Map<number, CardState>();
    const cardsToShow = shuffledDeck.slice(0, FAN_CARD_COUNT);
    
    cardsToShow.forEach((card, index) => {
      const position = getFanPosition(index, cardsToShow.length);
      states.set(index, {
        index,
        card,
        isSelected: false,
        isFlipped: false,
        reversed: false, // Will be set when card is selected
        initialPosition: position,
        animTranslateX: new Animated.Value(0), // Start at 0, we'll use initialPosition.x as base
        animTranslateY: new Animated.Value(0), // Start at 0, we'll use initialPosition.y as base
        animScale: new Animated.Value(1),
        animRotate: new Animated.Value(position.rotation),
        animOpacity: new Animated.Value(1),
        selectionOrder: -1,
      });
    });
    
    cardStatesRef.current = states;
    return states;
  }, [shuffledDeck]);

  const handleCardPress = async (index: number) => {
    const state = cardStatesRef.current.get(index);
    if (!state || state.isSelected || selectedIndices.size >= cardCount) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Determine if card is reversed (30% chance)
    const reversed = Math.random() < 0.3;
    
    // Mark as selected and flipped
    state.isSelected = true;
    state.isFlipped = true;
    state.reversed = reversed; // Store reversed state immediately
    const newSelected = new Set(selectedIndices);
    newSelected.add(index);
    const newOrder = [...selectionOrder, index];
    setSelectedIndices(newSelected);
    setSelectionOrder(newOrder);
    
    state.selectionOrder = newOrder.length - 1;

    // Calculate target position at top
    const selectionIndex = state.selectionOrder;
    const padding = 24;
    const gap = 16;
    const targetCardWidth = 150;
    const totalWidth = targetCardWidth * cardCount + gap * (cardCount - 1);
    const contentWidth = SCREEN_WIDTH - (padding * 2);
    const startX = padding + (contentWidth - totalWidth) / 2;
    const targetX = startX + selectionIndex * (targetCardWidth + gap) + targetCardWidth / 2 - CARD_WIDTH / 2;
    const targetY = 100;
    const targetScale = targetCardWidth / CARD_WIDTH;

    // Calculate translation needed (target - initial)
    const translateX = targetX - state.initialPosition.x;
    const translateY = targetY - state.initialPosition.y;

    // Animate: Flip first, then move to top
    Animated.sequence([
      // Quick flip animation
      Animated.timing(state.animOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      // Move to top using transforms
      Animated.parallel([
        Animated.timing(state.animTranslateX, {
          toValue: translateX,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true, // Can use native driver with translateX
        }),
        Animated.timing(state.animTranslateY, {
          toValue: translateY,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true, // Can use native driver with translateY
        }),
        Animated.timing(state.animScale, {
          toValue: targetScale,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(state.animRotate, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // When all cards selected, proceed
      if (newSelected.size === cardCount) {
        setTimeout(() => {
          const selectedCards = newOrder
            .map(i => {
              const s = cardStatesRef.current.get(i);
              if (!s) return null;
                  // Use the reversed state already stored in the card state
              return { ...s.card, reversed: s.reversed };
            })
            .filter((c): c is LocalTarotCard => c !== null);
          onCardsSelected(selectedCards);
        }, 300);
      }
    });
  };

  const cards = Array.from(cardStates.values());
  const selectedCards = selectionOrder
    .map(i => cardStatesRef.current.get(i))
    .filter((s): s is CardState => s !== undefined && s.isSelected);

  return (
    <MysticalBackground variant="default">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h3" style={styles.title}>
            {locale === 'zh-TW' 
              ? `點選 ${cardCount} 張卡牌`
              : `Tap ${cardCount} Card${cardCount > 1 ? 's' : ''}`}
          </ThemedText>
          {selectedIndices.size > 0 && (
            <ThemedText variant="caption" style={styles.subtitle}>
              {locale === 'zh-TW'
                ? `已選 ${selectedIndices.size} / ${cardCount} 張`
                : `${selectedIndices.size} of ${cardCount} selected`}
            </ThemedText>
          )}
        </View>

        {/* Top area for selected cards */}
        {selectedCards.length > 0 && (
          <View style={styles.selectedCardsArea} pointerEvents="none">
            {selectedCards.map((state) => {
              const rotateStr = state.animRotate.interpolate({
                inputRange: [-90, 90],
                outputRange: ['-90deg', '90deg'],
              });

              return (
                <Animated.View
                  key={`selected-${state.index}`}
                  style={[
                    styles.cardWrapper,
                    {
                      left: state.initialPosition.x,
                      top: state.initialPosition.y,
                      transform: [
                        { translateX: state.animTranslateX },
                        { translateY: state.animTranslateY },
                        { scale: state.animScale },
                        { rotate: rotateStr },
                      ],
                      opacity: state.animOpacity,
                      zIndex: 1000 + state.selectionOrder,
                    },
                  ]}
                >
                  <View style={styles.cardContent}>
                    {state.isFlipped ? (
                      <Image
                        source={getCardImage(state.card.code)}
                        style={[
                          styles.cardImage,
                          state.reversed && styles.cardReversed,
                        ]}
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        source={CARD_BACK_IMAGE}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Fan of cards - only show non-selected cards */}
        <View style={styles.cardsContainer}>
          {cards
            .filter(state => !state.isSelected)
            .map((state) => {
            const canSelect = selectedIndices.size < cardCount;
            const rotateStr = state.animRotate.interpolate({
              inputRange: [-90, 90],
              outputRange: ['-90deg', '90deg'],
            });

            return (
              <Animated.View
                key={`fan-card-${state.index}`}
                style={[
                  styles.cardWrapper,
                  {
                    left: state.initialPosition.x,
                    top: state.initialPosition.y,
                    transform: [
                      { scale: state.animScale },
                      { rotate: rotateStr },
                    ],
                    opacity: state.animOpacity,
                    zIndex: 100 - state.index,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleCardPress(state.index)}
                  disabled={!canSelect}
                  style={[
                    styles.cardTouchable,
                    !canSelect && styles.cardDisabled,
                  ]}
                >
                  <View style={styles.cardContent}>
                    {!state.isFlipped ? (
                      <Image
                        source={CARD_BACK_IMAGE}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        source={getCardImage(state.card.code)}
                        style={[
                          styles.cardImage,
                          state.reversed && styles.cardReversed,
                        ]}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </MysticalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: theme.spacing.spacing.lg,
    zIndex: 100,
  },
  title: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.xs,
    fontSize: 24,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  selectedCardsArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 1000,
    overflow: 'visible',
  },
  cardsContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  cardWrapper: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardTouchable: {
    width: '100%',
    height: '100%',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardContent: {
    width: '100%',
    height: '100%',
    borderRadius: theme.spacing.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutrals.darkGray,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardReversed: {
    transform: [{ rotate: '180deg' }],
  },
});

export default React.memo(CardSelectionScreen);
