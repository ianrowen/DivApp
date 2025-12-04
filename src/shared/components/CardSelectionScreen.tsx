// src/shared/components/CardSelectionScreen.tsx
/**
 * CardSelectionScreen Component
 * Cards animate to top when selected, then transition to reading screen
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import theme from '../../theme';
import MysticalBackground from './ui/MysticalBackground';
import ThemedText from './ui/ThemedText';
import ThemedButton from './ui/ThemedButton';
import { LOCAL_RWS_CARDS } from '../../systems/tarot/data/localCardData';
import type { LocalTarotCard } from '../../systems/tarot/data/localCardData';
import { getCardImage } from '../../systems/tarot/utils/cardImageLoader';
import { applyShadow } from '../../theme/shadows';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CARD_BACK_IMAGE = require('../../../assets/images/logo/divin8-card-curtains-horizontal.png');
const ANIMATIONS_ENABLED_KEY = '@divin8_animations_enabled';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = 90;
const CARD_HEIGHT = 135;
const SPREAD_CARD_COUNT = 15;

// Target card size for top area (matches reading screen)
const TARGET_CARD_WIDTH = 150; // matches cardItem width
const READING_CARD_WIDTH = 150;

interface CardSelectionScreenProps {
  cardCount: number;
  onCardsSelected: (selectedCards: LocalTarotCard[]) => void;
  onCancel: () => void;
}

function CardSelectionScreen({
  cardCount,
  onCardsSelected,
  onCancel,
}: CardSelectionScreenProps) {
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [animatingCards, setAnimatingCards] = useState<Set<number>>(new Set());
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  // Animation refs for each card
  const positionAnims = useRef<{ [key: number]: Animated.ValueXY }>({});
  const scaleAnims = useRef<{ [key: number]: Animated.Value }>({});
  const rotationAnims = useRef<{ [key: number]: Animated.Value }>({});
  
  // Shuffle deck ONCE - never changes
  const shuffledDeck = useMemo(() => {
    const deck = [...LOCAL_RWS_CARDS];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }, []);

  // Load animation preference
  useEffect(() => {
    const loadAnimationPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(ANIMATIONS_ENABLED_KEY);
        if (saved !== null) {
          setAnimationsEnabled(saved === 'true');
        } else {
          setAnimationsEnabled(true); // Default is true
        }
      } catch (error) {
        console.error('Error loading animation preference:', error);
        setAnimationsEnabled(true);
      }
    };
    loadAnimationPreference();
  }, []);

  // Initialize animations for all cards
  useEffect(() => {
    shuffledDeck.slice(0, SPREAD_CARD_COUNT).forEach((_, index) => {
      const fanPos = getCardPosition(index);
      positionAnims.current[index] = new Animated.ValueXY({
        x: fanPos.left,
        y: fanPos.top,
      });
      scaleAnims.current[index] = new Animated.Value(1);
      // Store initial rotation for interpolation
      rotationAnims.current[index] = new Animated.Value(fanPos.rotation);
    });
  }, [shuffledDeck]);

  const getCardPosition = (index: number) => {
    const totalCards = SPREAD_CARD_COUNT;
    const centerY = SCREEN_HEIGHT * 0.55;
    const startX = SCREEN_WIDTH * 0.1;
    const endX = SCREEN_WIDTH * 0.9;
    const arcHeight = SCREEN_HEIGHT * 0.12;
    
    const t = index / (totalCards - 1);
    const x = startX + (endX - startX) * t;
    const y = centerY + (arcHeight * 4 * t * (1 - t)) - (arcHeight * 2);
    const baseRotation = -50 + (100 * t);
    const curveRotation = Math.sin(t * Math.PI) * 2;
    const rotation = baseRotation + curveRotation;
    
    return {
      left: x - CARD_WIDTH / 2,
      top: y - CARD_HEIGHT / 2,
      rotation: rotation,
    };
  };

  const getTargetPosition = (selectionIndex: number) => {
    // Calculate exact position to match reading screen layout
    // Reading screen uses: scrollContent padding (24px), cardsContainer with gap (16px), cardItem width (150px)
    const scrollPadding = 24; // theme.spacing.spacing.lg
    const cardGap = 16; // theme.spacing.spacing.md
    const readingCardWidth = 150; // matches cardItem width
    const scaleFactor = READING_CARD_WIDTH / CARD_WIDTH; // ~1.67
    
    // Calculate total width of all cards with gaps
    const totalCardsWidth = readingCardWidth * cardCount + cardGap * (cardCount - 1);
    
    // Cards are centered in the scroll view content area
    // Content area = SCREEN_WIDTH - (scrollPadding * 2)
    const contentWidth = SCREEN_WIDTH - (scrollPadding * 2);
    const cardsStartX = scrollPadding + (contentWidth - totalCardsWidth) / 2;
    
    // Calculate x position for this card (center of card item in reading screen)
    const cardCenterX = cardsStartX + selectionIndex * (readingCardWidth + cardGap) + readingCardWidth / 2;
    
    // Position card so its CENTER aligns with target center
    // Since scale happens from center, we position the card's center at the target center
    // Card's center is at (x + CARD_WIDTH/2, y + CARD_HEIGHT/2)
    // We want this center to be at (cardCenterX, targetCenterY)
    const x = cardCenterX - CARD_WIDTH / 2;
    
    // Y position: account for header, padding, and ensure card center aligns
    // Reading screen card center is roughly at: header + padding + cardImageContainer height/2
    // cardImageContainer has aspectRatio 0.6, so height = 150 * 0.6 = 90px
    const headerHeight = 60;
    const topPadding = scrollPadding;
    const cardImageHeight = readingCardWidth * 0.6; // aspectRatio 0.6
    const targetCenterY = headerHeight + topPadding + 20 + cardImageHeight / 2;
    
    // Position card so its center is at targetCenterY
    const y = targetCenterY - CARD_HEIGHT / 2;
    
    // Add padding to prevent clipping when scaled
    // When card scales, it expands from center, so we need extra margin
    // But since we're positioning the center, we need to ensure bounds aren't exceeded
    const scaleExpansionX = (CARD_WIDTH * (scaleFactor - 1)) / 2;
    const scaleExpansionY = (CARD_HEIGHT * (scaleFactor - 1)) / 2;
    
    // Adjust position to keep card within screen bounds when scaled
    const adjustedX = Math.max(scaleExpansionX, Math.min(x, SCREEN_WIDTH - CARD_WIDTH - scaleExpansionX));
    const adjustedY = Math.max(scaleExpansionY, Math.min(y, SCREEN_HEIGHT - CARD_HEIGHT - scaleExpansionY));
    
    return { x: adjustedX, y: adjustedY };
  };

  const handleCardPress = (index: number) => {
    if (flippedIndices.includes(index)) return;
    if (flippedIndices.length >= cardCount) return;
    if (animatingCards.has(index)) return;

    const selectionIndex = flippedIndices.length;
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);
    setAnimatingCards(prev => new Set(prev).add(index));

    // Get target position
    const targetPos = getTargetPosition(selectionIndex);
    const fanPos = getCardPosition(index);

    // Animate card to top
    const positionAnim = positionAnims.current[index];
    const scaleAnim = scaleAnims.current[index];
    const rotationAnim = rotationAnims.current[index];

    // Calculate scale factor to match reading screen card size
    const scaleFactor = READING_CARD_WIDTH / CARD_WIDTH;

    if (animationsEnabled) {
      // Animate position, scale, and rotation
      Animated.parallel([
        Animated.timing(positionAnim, {
          toValue: { x: targetPos.x, y: targetPos.y },
          duration: 1000,
          useNativeDriver: false, // Can't use native driver for layout properties
        }),
        Animated.timing(scaleAnim, {
          toValue: scaleFactor,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnim, {
          toValue: 0, // Straighten card
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Wait a moment for cards to settle in exact position, then transition
        if (newFlipped.length === cardCount) {
          setTimeout(() => {
            const selectedCards = newFlipped.map(i => shuffledDeck[i]);
            onCardsSelected(selectedCards);
          }, 500); // Longer delay to ensure smooth transition
        }
      });
    } else {
      // No animation - instantly move to target position
      positionAnim.setValue({ x: targetPos.x, y: targetPos.y });
      scaleAnim.setValue(scaleFactor);
      rotationAnim.setValue(0);
      
      // If this is the last card, transition immediately
      if (newFlipped.length === cardCount) {
        setTimeout(() => {
          const selectedCards = newFlipped.map(i => shuffledDeck[i]);
          onCardsSelected(selectedCards);
        }, 100);
      }
    }
  };

  return (
    <MysticalBackground variant="default">
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="h3" style={styles.title}>
            Tap {cardCount} Card{cardCount > 1 ? 's' : ''}
          </ThemedText>
          <ThemedText variant="caption" style={styles.subtitle}>
            {flippedIndices.length > 0 
              ? `Card ${flippedIndices.length} of ${cardCount} revealed`
              : 'Tap a card to reveal it'}
          </ThemedText>
        </View>

        {/* Top area where cards will animate to - invisible placeholder for reference */}
        <View style={styles.topArea} pointerEvents="none" />

        {/* Card spread - wrapper to allow overflow during animation */}
        <View style={styles.cardSpreadContainer}>
          <View style={styles.cardSpread}>
          {shuffledDeck.length > 0 && shuffledDeck.slice(0, SPREAD_CARD_COUNT).map((card, index) => {
            const isFlipped = flippedIndices.includes(index);
            const isAnimating = animatingCards.has(index);
            const canFlip = !isFlipped && flippedIndices.length < cardCount && !isAnimating;
            
            const positionAnim = positionAnims.current[index];
            const scaleAnim = scaleAnims.current[index];
            const rotationAnim = rotationAnims.current[index];

            if (!positionAnim || !scaleAnim || !rotationAnim) {
              return null;
            }

            const zIndex = isFlipped ? 1000 + index : 1;
            const elevation = isFlipped ? 15 : 3;

            return (
              <Animated.View
                key={`card-${card.code}-${index}`}
                style={[
                  styles.cardWrapper,
                  {
                    position: 'absolute',
                    left: positionAnim.x,
                    top: positionAnim.y,
                    zIndex,
                    opacity: 1,
                    transform: [
                      { 
                        rotate: rotationAnim.interpolate({
                          inputRange: [-60, 60],
                          outputRange: ['-60deg', '60deg'],
                        }) 
                      },
                      { scale: scaleAnim },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleCardPress(index)}
                  disabled={!canFlip}
                  style={[
                    styles.cardTouchable,
                    applyShadow({
                      shadowColor: isFlipped ? theme.colors.primary.gold : '#000',
                      shadowOffset: { width: 0, height: elevation },
                      shadowOpacity: isFlipped ? 0.5 : 0.2,
                      shadowRadius: elevation * 0.8,
                      elevation: elevation * 0.6,
                    }),
                  ]}
                >
                  <View style={styles.card3D}>
                    {/* Show front if flipped, back otherwise */}
                    {isFlipped ? (
                      <Image
                        source={getCardImage(card.code)}
                        style={styles.cardImage}
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
                </TouchableOpacity>
              </Animated.View>
            );
          })}
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedButton
            title="Cancel"
            onPress={onCancel}
            variant="secondary"
            style={styles.cancelButton}
          />
        </View>
      </View>
    </MysticalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 100,
    overflow: 'visible', // Allow cards to be visible when animated to top
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: theme.spacing.spacing.lg,
    zIndex: 10,
  },
  title: {
    color: theme.colors.primary.goldLight,
    marginBottom: theme.spacing.spacing.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  subtitle: {
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    opacity: 0.7,
    fontSize: theme.typography.fontSize.xs,
  },
  topArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 100,
  },
  cardSpreadContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    minHeight: SCREEN_HEIGHT * 0.6,
    overflow: 'visible', // Allow cards to overflow during animation
  },
  cardSpread: {
    flex: 1,
    position: 'relative',
    width: SCREEN_WIDTH,
    minHeight: SCREEN_HEIGHT * 0.6,
    overflow: 'visible', // Allow cards to be visible when scaled/moved
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    // Account for scaling - cards scale up to ~1.67x, so we need extra space
    // The wrapper itself doesn't clip, but we ensure proper positioning
  },
  cardTouchable: {
    width: '100%',
    height: '100%',
  },
  card3D: {
    width: '100%',
    height: '100%',
    borderRadius: theme.spacing.borderRadius.md,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.spacing.borderRadius.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.spacing.lg,
    paddingTop: theme.spacing.spacing.lg,
    zIndex: 10,
  },
  cancelButton: {
    minWidth: 120,
  },
});

// Memoize to prevent unnecessary re-renders
export default React.memo(CardSelectionScreen, (prevProps, nextProps) => {
  return prevProps.cardCount === nextProps.cardCount;
});
