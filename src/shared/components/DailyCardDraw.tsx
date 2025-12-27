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
import { supabase } from '../../core/api/supabase';
import { useProfile } from '../../contexts/ProfileContext';
import { debugLog } from '../../utils/debugLog';

const CARD_BACK_IMAGE = require('../../../assets/images/logo/divin8-card-curtains-horizontal.webp');

const DAILY_CARD_STORAGE_KEY = 'divin8_daily_card';
const DAILY_CARD_DATE_KEY = 'divin8_daily_card_date';
const DAILY_CARD_REVERSED_KEY = 'divin8_daily_card_reversed';

export default function DailyCardDraw() {
  const { t, locale } = useTranslation();
  const { profile } = useProfile();
  const [card, setCard] = useState<any>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldAutoFlip, setShouldAutoFlip] = useState(false);
  const [savedReadingId, setSavedReadingId] = useState<string | null>(null);
  const flipAnimation = React.useRef(new Animated.Value(0)).current;

  // Check if daily card was already pulled today on mount
  useEffect(() => {
    const checkExistingDailyCard = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:checkExistingDailyCard:entry',message:'Checking for existing daily card on mount',data:{hasCard:!!card},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:checkExistingDailyCard:noUser',message:'No user found, skipping check',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          // No user, start with card back
          setIsFlipped(false);
          return;
        }

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:checkExistingDailyCard:queryStart',message:'Querying database for today daily card',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        // Check for existing daily card reading from today
        const { data: existingReading, error: fetchError } = await supabase
          .from('readings')
          .select('id, created_at, elements_drawn')
          .eq('user_id', user.id)
          .eq('reading_type', 'daily_card')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as any;

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:checkExistingDailyCard:queryResult',message:'Database query result',data:{hasReading:!!existingReading,hasError:!!fetchError,readingId:existingReading?.id,createdAt:existingReading?.created_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        if (fetchError) {
          console.warn('⚠️ Error checking for existing daily card:', fetchError);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:checkExistingDailyCard:queryError',message:'Database query error',data:{error:fetchError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          setIsFlipped(false);
          return;
        }

        if (existingReading?.id) {
          // Check if it's from today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const readingDate = new Date(existingReading.created_at);
          readingDate.setHours(0, 0, 0, 0);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:checkExistingDailyCard:dateCheck',message:'Checking if reading is from today',data:{today:today.toISOString(),readingDate:readingDate.toISOString(),isToday:readingDate.getTime()===today.getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion

          if (readingDate.getTime() === today.getTime()) {
            // Load the card from elements_drawn
            if (existingReading.elements_drawn && Array.isArray(existingReading.elements_drawn) && existingReading.elements_drawn.length > 0) {
              const cardElement = existingReading.elements_drawn[0] as any;
              const cardCode = cardElement.elementId || cardElement.metadata?.cardCode;
              const reversed = cardElement.metadata?.reversed || false;

              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:checkExistingDailyCard:foundCard',message:'Found existing card from today, loading it',data:{cardCode:cardCode,reversed:reversed,readingId:existingReading.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion

              const foundCard = LOCAL_RWS_CARDS.find(c => c.code === cardCode);
              if (foundCard) {
                const cardWithReversal = { ...foundCard, reversed };
                // Set card and flip state simultaneously, then animate immediately after render
                setCard(cardWithReversal);
                setSavedReadingId(existingReading.id);
                setIsFlipped(true);
                // Use requestAnimationFrame to ensure the card renders before animating
                requestAnimationFrame(() => {
                  flipAnimation.setValue(1);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                });
                console.log('✅ Loaded existing daily card from today:', cardCode, 'reversed:', reversed);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:checkExistingDailyCard:cardLoaded',message:'Card loaded successfully, auto-flipping immediately',data:{cardCode:cardCode,reversed:reversed},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                return; // Don't reset isFlipped
              } else {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:checkExistingDailyCard:cardNotFound',message:'Card not found in LOCAL_RWS_CARDS',data:{cardCode:cardCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                console.warn('⚠️ Card not found for code:', cardCode);
              }
            }
          }
        }
        
        // No existing card found for today, start with card back
        setIsFlipped(false);
      } catch (error: any) {
        console.error('❌ Error checking for existing daily card:', error);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:checkExistingDailyCard:exception',message:'Exception checking for existing card',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setIsFlipped(false);
      }
    };

    checkExistingDailyCard();
  }, []);

  // Auto-flip when card is drawn and shouldAutoFlip is true
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:autoFlipEffect:check',message:'Auto-flip effect triggered',data:{hasCard:!!card,shouldAutoFlip:shouldAutoFlip,isFlipped:isFlipped},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (card && shouldAutoFlip && !isFlipped) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:autoFlipEffect:flipping',message:'Auto-flipping card',data:{cardCode:card.code},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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

  const saveDailyCard = async (cardToSave: any): Promise<string | null> => {
    // #region agent log
    debugLog('DailyCardDraw.tsx:saveDailyCard:entry', 'Saving daily card', {cardCode:cardToSave?.code}, 'N');
    // #endregion
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('⏭️ No user found, skipping daily card save');
        return null;
      }

      // Get the tarot divination system ID
      const { data: tarotSystem, error: systemError } = await supabase
        .from('divination_systems')
        .select('id, system_key')
        .or('system_key.eq.tarot,system_key.eq.rws')
        .limit(1)
        .single();

      let divinationSystemId: string | null = null;
      if (systemError || !tarotSystem) {
        const { data: fallbackSystem } = await supabase
          .from('divination_systems')
          .select('id')
          .limit(1)
          .single();
        if (fallbackSystem) {
          divinationSystemId = fallbackSystem.id;
        } else {
          console.error('❌ No divination systems found');
          return null;
        }
      } else {
        divinationSystemId = tarotSystem.id;
      }

      // Build elements_drawn
      const cardData = LOCAL_RWS_CARDS.find(c => c.code === cardToSave.code);
      if (!cardData) {
        console.error('❌ Card not found for code:', cardToSave.code);
        return null;
      }

      const elementsDrawn = [{
        elementId: cardData.code,
        position: 'Daily Guidance',
        metadata: {
          cardTitle: cardData.title.en,
          cardTitleZh: cardData.title.zh,
          cardCode: cardData.code,
          positionLabel: 'Daily Guidance',
          reversed: cardToSave.reversed || false,
          suit: cardData.suit || null,
          arcana: cardData.arcana,
          number: cardData.code,
        },
      }];

      // Format interpretations (empty for now)
      const formattedInterpretations: Record<string, any> = {
        _metadata: {
          reading_type: 'daily_card',
          interpretation_styles: [],
          follow_up_count: 0,
          astro_depth: profile?.subscription_tier === 'free' ? 'sun_sign' : profile?.subscription_tier === 'adept' ? 'big_three' : 'full_chart',
          conversation: [],
          reflection: null,
          tier_at_creation: profile?.subscription_tier || 'free',
        },
      };

      const generateQuestionHash = (q: string | null): string => {
        if (!q) {
          return 'daily_' + new Date().toDateString().replace(/\s/g, '_').toLowerCase();
        }
        let hash = 0;
        for (let i = 0; i < q.length; i++) {
          const char = q.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      };

      const questionText = locale === 'zh-TW' ? '每日卡牌' : 'Daily guidance';
      const questionHash = generateQuestionHash(questionText);

      const readingData: Record<string, any> = {
        user_id: user.id,
        divination_system_id: divinationSystemId,
        reading_type: 'daily_card',
        question: questionText,
        question_hash: questionHash,
        elements_drawn: elementsDrawn,
        interpretations: formattedInterpretations,
        language: locale === 'zh-TW' ? 'zh-TW' : 'en',
      };

      const { data, error } = await supabase
        .from('readings')
        .insert(readingData)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error saving daily card:', error);
        // Check if it's a duplicate (already saved today)
        if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
          // Try to find existing reading
          const { data: existingReading } = await supabase
            .from('readings')
            .select('id')
            .eq('user_id', user.id)
            .eq('reading_type', 'daily_card')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (existingReading?.id) {
            console.log('✅ Found existing daily card reading:', existingReading.id);
            return existingReading.id;
          }
        }
        return null;
      }

      if (!data || !data.id) {
        console.error('❌ Save returned no data!');
        return null;
      }

      console.log('✅ Daily card saved! ID:', data.id);
      // #region agent log
      debugLog('DailyCardDraw.tsx:saveDailyCard:success', 'Daily card saved successfully', {readingId:data.id}, 'N');
      // #endregion
      return data.id;
    } catch (error: any) {
      console.error('❌ Exception saving daily card:', error);
      return null;
    }
  };

  const drawNewCard = async (): Promise<void> => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:drawNewCard:entry',message:'drawNewCard called',data:{hasCard:!!card},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:drawNewCard:cardDrawn',message:'Card drawn, setting state',data:{cardCode:drawnCard.code,reversed:reversed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setCard(cardWithReversal);
      
      // Save the daily card immediately when drawn
      const savedId = await saveDailyCard(cardWithReversal);
      // #region agent log
      debugLog('DailyCardDraw.tsx:drawNewCard:saveResult', 'Daily card save result', {savedId:savedId,hasId:!!savedId}, 'N');
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:drawNewCard:saveResult',message:'Daily card save result',data:{savedId:savedId,hasId:!!savedId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (savedId) {
        console.log('✅ Daily card saved immediately when drawn, readingId:', savedId);
        setSavedReadingId(savedId);
      } else {
        console.warn('⚠️ Failed to save daily card when drawn, will retry when viewing full reading');
        setSavedReadingId(null);
      }
      
      // Clear any saved card data (no persistence)
      await AsyncStorage.removeItem(DAILY_CARD_DATE_KEY);
      await AsyncStorage.removeItem(DAILY_CARD_STORAGE_KEY);
      await AsyncStorage.removeItem(DAILY_CARD_REVERSED_KEY);
    } catch (error) {
      console.error('Error drawing daily card:', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:drawNewCard:error',message:'Error drawing card',data:{error:error?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }
  };

  const handleFlip = async () => {
    if (isAnimating) return;

    // If card is already flipped, navigate to reading screen
    if (isFlipped && card) {
      console.log('📍 Navigating with card:', card.code, 'reversed:', card.reversed, 'readingId:', savedReadingId);
      // #region agent log
      debugLog('DailyCardDraw.tsx:handleFlip:navigate', 'Navigating to reading screen', {hasReadingId:!!savedReadingId,readingId:savedReadingId}, 'N');
      // #endregion
      const params: any = {
        type: 'daily',
        cardCode: card.code,
        reversed: card.reversed ? 'true' : 'false',
      };
      // Pass readingId if we have it to prevent duplicate save
      if (savedReadingId) {
        params.readingId = savedReadingId;
      }
      router.push({
        pathname: '/reading',
        params,
      });
      return;
    }

    // If no card yet, check if one was already pulled today before drawing
    if (!card) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:handleFlip:noCard',message:'No card in state, checking if already pulled today',data:{hasCard:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
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

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:handleFlip:checkBeforeDraw',message:'Checking database before drawing new card',data:{hasReading:!!existingReading,hasError:!!fetchError,readingId:existingReading?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion

          if (!fetchError && existingReading?.id) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const readingDate = new Date(existingReading.created_at);
            readingDate.setHours(0, 0, 0, 0);

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:handleFlip:dateCheckBeforeDraw',message:'Date check before drawing',data:{isToday:readingDate.getTime()===today.getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion

            if (readingDate.getTime() === today.getTime()) {
              // Card already pulled today, load it instead of drawing new
              if (existingReading.elements_drawn && Array.isArray(existingReading.elements_drawn) && existingReading.elements_drawn.length > 0) {
                const cardElement = existingReading.elements_drawn[0] as any;
                const cardCode = cardElement.elementId || cardElement.metadata?.cardCode;
                const reversed = cardElement.metadata?.reversed || false;
                const foundCard = LOCAL_RWS_CARDS.find(c => c.code === cardCode);
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:handleFlip:preventDraw',message:'Preventing new draw, loading existing card',data:{cardCode:cardCode,reversed:reversed,readingId:existingReading.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion

                if (foundCard) {
                  const cardWithReversal = { ...foundCard, reversed };
                  setCard(cardWithReversal);
                  setSavedReadingId(existingReading.id);
                  setShouldAutoFlip(true);
                  console.log('✅ Card already pulled today, loading existing:', cardCode);
                  return;
                }
              }
            }
          }
        }
      } catch (error: any) {
        console.error('❌ Error checking before draw:', error);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:handleFlip:checkError',message:'Error checking before draw',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }

      // No card found for today, draw a new one
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyCardDraw.tsx:handleFlip:drawingNew',message:'No existing card found, drawing new card',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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
                    
                    // Always display keywords if they exist - reversed state doesn't affect keywords
                    if (keywordsToShow.length === 0) {
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
      {isFlipped && card && (
        <ThemedButton
          title={locale === 'zh-TW' ? '查看完整解讀' : 'View Full Reading'}
          onPress={() => {
            console.log('📍 Navigating with card:', card.code, 'reversed:', card.reversed, 'readingId:', savedReadingId);
            // #region agent log
            debugLog('DailyCardDraw.tsx:viewFullButton:navigate', 'Navigating to reading screen from button', {hasReadingId:!!savedReadingId,readingId:savedReadingId}, 'N');
            // #endregion
            const params: any = {
              type: 'daily',
              cardCode: card.code,
              reversed: card.reversed ? 'true' : 'false',
            };
            // Pass readingId if we have it to prevent duplicate save
            if (savedReadingId) {
              params.readingId = savedReadingId;
            }
            router.push({
              pathname: '/reading',
              params,
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


