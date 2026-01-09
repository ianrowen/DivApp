// src/shared/components/DailyCardDraw.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
import CardDetailModal from './CardDetailModal';
import { useTranslation } from '../../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../core/api/supabase';

const CARD_BACK_IMAGE = require('../../../assets/images/logo/divin8-card-curtains-horizontal.webp');

const DAILY_CARD_STORAGE_KEY = 'divin8_daily_card';
const DAILY_CARD_DATE_KEY = 'divin8_daily_card_date';
const DAILY_CARD_REVERSED_KEY = 'divin8_daily_card_reversed';

export default function DailyCardDraw() {
  const { t, locale } = useTranslation();
  const [card, setCard] = useState<any>(null);
  const cardSetTimeRef = React.useRef<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldAutoFlip, setShouldAutoFlip] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const flipAnimation = React.useRef(new Animated.Value(0)).current;

  // Check if daily card was already pulled today on mount
  useEffect(() => {
    let mounted = true;
    
    const checkExistingDailyCard = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          // No user, start with card back
          if (mounted) setIsFlipped(false);
          return;
        }

        // Check for existing daily card reading from today
        const { data: existingReading, error: fetchError } = await supabase
          .from('readings')
          .select('id, created_at, elements_drawn')
          .eq('user_id', user.id)
          .eq('reading_type', 'daily_card')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as any;

        if (!mounted) return;

        if (fetchError) {
          console.warn('⚠️ Error checking for existing daily card:', fetchError);
          setIsFlipped(false);
          return;
        }

        if (existingReading?.id) {
          // Check if it's from today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const readingDate = new Date(existingReading.created_at);
          readingDate.setHours(0, 0, 0, 0);
          
          if (readingDate.getTime() === today.getTime()) {
            // Load the card from elements_drawn
            if (existingReading.elements_drawn && Array.isArray(existingReading.elements_drawn) && existingReading.elements_drawn.length > 0) {
              const cardElement = existingReading.elements_drawn[0] as any;
              const cardCode = cardElement.elementId || cardElement.metadata?.cardCode;
              const reversed = cardElement.metadata?.reversed || false;

              const foundCard = LOCAL_RWS_CARDS.find(c => c.code === cardCode);
              if (foundCard && mounted) {
                const cardWithReversal = { ...foundCard, reversed };
                // #region agent log
                const cardSetTime = Date.now();
                cardSetTimeRef.current = cardSetTime;
                fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:83',message:'Card set from existing reading',data:{cardCode:cardWithReversal.code,reversed:cardWithReversal.reversed},timestamp:cardSetTime,sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                // Set card and flip state simultaneously
                setCard(cardWithReversal);
                setIsFlipped(true);
                // Set animation value immediately (no need for requestAnimationFrame)
                flipAnimation.setValue(1);
                return; // Don't reset isFlipped
              } else if (!mounted) {
                return;
              } else {
                console.warn('⚠️ Card not found for code:', cardCode);
              }
            }
          }
        }
        
        // No existing card found for today, start with card back
        if (mounted) setIsFlipped(false);
      } catch (error: any) {
        if (mounted) {
          console.error('❌ Error checking for existing daily card:', error);
          setIsFlipped(false);
        }
      }
    };

    checkExistingDailyCard();
    
    return () => {
      mounted = false;
    };
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
      // #region agent log
      const cardSetTime = Date.now();
      cardSetTimeRef.current = cardSetTime;
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:152',message:'Card drawn - setting state',data:{cardCode:cardWithReversal.code,reversed:cardWithReversal.reversed},timestamp:cardSetTime,sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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

    // If card is already flipped, open card info modal
    if (isFlipped && card) {
      setModalVisible(true);
      return;
    }

    // If no card yet, check if one was already pulled today before drawing
    if (!card) {
      // Check if a card was already pulled today
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user) {
          const { data: existingReading, error: fetchError } = await supabase
            .from('readings')
            .select('id, created_at, elements_drawn')
            .eq('user_id', user.id)
            .eq('reading_type', 'daily_card')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle() as any;

          if (!fetchError && existingReading?.id) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const readingDate = new Date(existingReading.created_at);
            readingDate.setHours(0, 0, 0, 0);

            if (readingDate.getTime() === today.getTime()) {
              // Card already pulled today, load it instead of drawing new
              if (existingReading.elements_drawn && Array.isArray(existingReading.elements_drawn) && existingReading.elements_drawn.length > 0) {
                const cardElement = existingReading.elements_drawn[0] as any;
                const cardCode = cardElement.elementId || cardElement.metadata?.cardCode;
                const reversed = cardElement.metadata?.reversed || false;
                const foundCard = LOCAL_RWS_CARDS.find(c => c.code === cardCode);
                
                if (foundCard) {
                  const cardWithReversal = { ...foundCard, reversed };
                  setCard(cardWithReversal);
                  setShouldAutoFlip(true);
                  return;
                }
              }
            }
          }
        }
      } catch (error: any) {
        console.error('❌ Error checking before draw:', error);
      }

      // No card found for today, draw a new one
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

  const localizedCard = useMemo(() => {
    return card ? getLocalizedCard(card) : null;
  }, [card, locale]);
  
  // Memoize keywords to prevent unnecessary recalculations
  const keywordsToShow = useMemo(() => {
    if (!localizedCard || !card) return [];
    const localizedKeywords = localizedCard.keywords;
    const originalKeywords = card.keywords;
    
    return (localizedKeywords && Array.isArray(localizedKeywords) && localizedKeywords.length > 0)
      ? localizedKeywords
      : (originalKeywords && Array.isArray(originalKeywords) && originalKeywords.length > 0)
        ? originalKeywords
        : [];
  }, [localizedCard, card]);
  
  // Track previous keywords to prevent duplicate logs
  const prevKeywordsRef = React.useRef<{ localized: any; original: any } | null>(null);
  
  // Debug: Log keyword translation status (only when keywords actually change)
  useEffect(() => {
    if (localizedCard && card) {
      const localizedKeywords = localizedCard.keywords;
      const originalKeywords = card.keywords;
      
      // Only log if keywords have actually changed
      const prev = prevKeywordsRef.current;
      const keywordsChanged = !prev || 
        JSON.stringify(prev.localized) !== JSON.stringify(localizedKeywords) ||
        JSON.stringify(prev.original) !== JSON.stringify(originalKeywords);
      
      if (keywordsChanged) {
        prevKeywordsRef.current = { localized: localizedKeywords, original: originalKeywords };
      }
    } else {
      prevKeywordsRef.current = null;
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
                    onLoadStart={() => {
                      // #region agent log
                      const loadStartTime = Date.now();
                      const timeSinceCardSet = cardSetTimeRef.current ? loadStartTime - cardSetTimeRef.current : null;
                      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:328',message:'Image load started',data:{cardCode:card.code,reversed:card.reversed,timeSinceCardSet},timestamp:loadStartTime,sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                      // #endregion
                    }}
                    onLoad={() => {
                      // #region agent log
                      const loadEndTime = Date.now();
                      const timeSinceCardSet = cardSetTimeRef.current ? loadEndTime - cardSetTimeRef.current : null;
                      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:335',message:'Image load completed',data:{cardCode:card.code,reversed:card.reversed,timeSinceCardSet,totalLoadTime:loadEndTime},timestamp:loadEndTime,sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                      // #endregion
                    }}
                    onError={(error) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:332',message:'Image load error',data:{cardCode:card.code,error:error?.nativeEvent?.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                      // #endregion
                    }}
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
                  {keywordsToShow.length > 0 && (
                    <View style={styles.keywordsContainer}>
                      {keywordsToShow.slice(0, 5).map((keyword: string, idx: number) => {
                        if (!keyword || typeof keyword !== 'string') {
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
                  )}
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
      {isFlipped && card && (
        <ThemedButton
          title={locale === 'zh-TW' ? '查看完整解讀' : 'View Full Reading'}
          onPress={() => {
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
      {card && modalVisible && (() => {
        // Extract base card from LOCAL_RWS_CARDS to ensure correct type
        const baseCard = LOCAL_RWS_CARDS.find(c => c.code === card.code);
        return baseCard ? (
          <CardDetailModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            card={baseCard}
            reversed={card.reversed || false}
          />
        ) : null;
      })()}
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
    minHeight: 280,
    marginBottom: theme.spacing.spacing.sm,
    padding: theme.spacing.spacing.xs,
  },
  cardWrapper: {
    width: '100%',
    height: 280,
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
    maxWidth: 320,
    maxHeight: 270,
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
    paddingBottom: theme.spacing.spacing.md,
  },
  cardImage: {
    width: 180,
    height: 180,
    marginBottom: theme.spacing.spacing.xs,
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
    marginBottom: theme.spacing.spacing.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.spacing.xs,
    paddingHorizontal: theme.spacing.spacing.sm,
    paddingBottom: theme.spacing.spacing.xs,
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
});


