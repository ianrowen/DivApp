// app/reading.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Modal,
  Text,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/core/api/supabase';
import theme from '../src/theme';
import MysticalBackground from '../src/shared/components/ui/MysticalBackground';
import ThemedText from '../src/shared/components/ui/ThemedText';
import ThemedButton from '../src/shared/components/ui/ThemedButton';
import ThemedCard from '../src/shared/components/ui/ThemedCard';
import CardDetailModal from '../src/shared/components/CardDetailModal';
import CardSelectionScreen from '../src/shared/components/CardSelectionScreen';
import SpinningLogo from '../src/shared/components/ui/SpinningLogo';
import { useTranslation } from '../src/i18n';
import { useProfile } from '../src/contexts/ProfileContext';
import { LOCAL_RWS_CARDS } from '../src/systems/tarot/data/localCardData';
import { getLocalizedCard } from '../src/systems/tarot/utils/cardHelpers';
import { getCardImage } from '../src/systems/tarot/utils/cardImageLoader';
import { getSpreadByKey } from '../src/services/spreadService';
import AIProvider from '../src/core/api/aiProvider';
import { PromptBuilder } from '../src/core/ai/prompts/promptBuilder';
import type { TarotSpread } from '../src/types/spreads';
import type { DrawnCard, ChatMessage, InterpretationStyle } from '../src/types/reading';
import type { LocalTarotCard } from '../src/systems/tarot/data/localCardData';

export default function ReadingScreen() {
  const { type, question, spreadKey, cardCode, reversed, readingId: readingIdParam } = useLocalSearchParams<{
    type: 'daily' | 'spread';
    question?: string;
    spreadKey?: string;
    cardCode?: string;
    reversed?: string;
    readingId?: string;
  }>();

  const { t, locale } = useTranslation();
  const { profile, isLoading: profileLoading } = useProfile();
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [spread, setSpread] = useState<TarotSpread | null>(null);
  const [showCardSelection, setShowCardSelection] = useState(false);
  
  // User & Profile - derived from context (cached at sign-in)
  const userTier = (profile?.subscription_tier || 'free') as 'free' | 'adept' | 'apex';
  const userProfile = profile;
  // Default to true for beta tester (all users are beta testers)
  // Only set to false if profile is explicitly loaded AND is_beta_tester is explicitly false
  const isBetaTester = profile === null || profile === undefined 
    ? true  // Default to true if profile not loaded (all users are beta testers)
    : (profile.is_beta_tester !== false); // Only false if explicitly set to false
  
  // Interpretations
  const [selectedStyle, setSelectedStyle] = useState<'traditional' | 'esoteric' | 'jungian'>('traditional');
  const [interpretations, setInterpretations] = useState<{
    traditional?: string;
    esoteric?: string;
    jungian?: string;
  }>({});

  // Chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);

  // Reflection & Save
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  // Use ref to track readingId immediately (avoids state timing issues)
  const readingIdRef = useRef<string | null>(null);

  // Modal
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Card animations - use ref to store animations
  const cardAnimationsRef = useRef<Animated.Value[]>([]);

  useEffect(() => {
    initializeReading();
  }, []);

  useEffect(() => {
    // Create animations for new cards
    while (cardAnimationsRef.current.length < cards.length) {
      cardAnimationsRef.current.push(new Animated.Value(0));
    }
    
    // Animate cards appearing one by one
    cards.forEach((_, idx) => {
      if (cardAnimationsRef.current[idx]) {
        Animated.timing(cardAnimationsRef.current[idx], {
          toValue: 1,
          duration: 400,
          delay: idx * 150,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [cards.length]);

  const initializeReading = async () => {
    try {
      setLoading(true);

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(t('common.error'), 'Please sign in');
        router.back();
        return;
      }

      // Profile is loaded from context (cached at sign-in)
      // It will be available immediately, no need to fetch
      
      // Now start reading initialization
      if (type === 'daily') {
        if (!cardCode) {
          console.error('❌ No cardCode provided for daily card!');
          Alert.alert('Error', 'Card code missing');
          router.back();
          return;
        }
        
        const foundCard = LOCAL_RWS_CARDS.find(c => c.code === cardCode);
        if (!foundCard) {
          console.error('❌ Card not found:', cardCode);
          Alert.alert('Error', 'Card not found');
          router.back();
          return;
        }
        
        const drawnCards = [{
          cardCode: foundCard.code,  // Use code, not filename
          reversed: reversed === 'true',
          position: 'Daily Guidance', // Add position for daily cards
        }];
        
        setCards(drawnCards);
        
        // Show cards immediately - don't wait for interpretation
        setLoading(false);
        
        // Check if daily card was already saved (from DailyCardDraw component)
        let savedReadingId: string | null = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Check for existing daily card reading from today
            const { data: existingReading, error: fetchError } = await supabase
              .from('readings')
              .select('id, created_at')
              .eq('user_id', user.id)
              .eq('reading_type', 'daily_card')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (fetchError) {
              console.warn('⚠️ Error checking for existing daily card:', fetchError);
            } else if (existingReading?.id) {
              // Check if it's from today
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const readingDate = new Date(existingReading.created_at);
              readingDate.setHours(0, 0, 0, 0);
              
              if (readingDate.getTime() === today.getTime()) {
                savedReadingId = existingReading.id;
                setReadingId(savedReadingId);
                readingIdRef.current = savedReadingId;
              }
            }
          }
        } catch (err: any) {
          console.warn('⚠️ Exception checking for existing daily card:', err);
        }
        
        // Only auto-save if no existing reading was found
        if (!savedReadingId) {
          // Auto-save daily card immediately (before interpretation)
          // Await the save to ensure readingId is set before interpretation starts
          try {
            savedReadingId = await autoSaveReading(drawnCards);
            if (savedReadingId) {
              // Set readingId in both state and ref immediately
              setReadingId(savedReadingId);
              readingIdRef.current = savedReadingId;
            }
          } catch (err: any) {
            console.error('❌ Exception auto-saving daily card:', err);
            console.error('❌ Error type:', typeof err);
            console.error('❌ Error message:', err?.message);
            console.error('❌ Error stack:', err?.stack);
            // Continue even if save fails - interpretation will try to save
          }
        }
        
        // Generate interpretation in background (non-blocking)
        // Pass readingId directly to avoid state timing issues
        // Only generate if we have a saved readingId, otherwise wait for save to complete
        if (savedReadingId) {
          generateInterpretation(drawnCards, 'traditional', undefined, savedReadingId).catch(() => {});
        }
        
        return;
      } else if (type === 'spread' && spreadKey) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:258',message:'Loading spread reading',data:{spreadKey:spreadKey,readingIdParam:readingIdParam},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
        // #endregion
        // Spread reading - load spread and draw cards
        const spreadData = await getSpreadByKey(spreadKey);
        if (!spreadData) {
          Alert.alert(t('common.error'), 'Spread not found');
          router.back();
          return;
        }
        setSpread(spreadData);
        
        // If readingId is provided as param (from history), load existing reading
        if (readingIdParam) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:268',message:'Loading existing reading by ID',data:{readingId:readingIdParam},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
          // #endregion
          try {
            const { data: existingReading, error: loadError } = await supabase
              .from('readings')
              .select('*')
              .eq('id', readingIdParam)
              .single();
            
            if (loadError || !existingReading) {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:275',message:'Failed to load existing reading',data:{error:loadError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
              // #endregion
              console.warn('⚠️ Failed to load existing reading:', loadError);
            } else {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:279',message:'Loaded existing reading',data:{readingId:existingReading.id,hasInterpretations:!!existingReading.interpretations},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
              // #endregion
              // Set readingId
              setReadingId(existingReading.id);
              readingIdRef.current = existingReading.id;
              
              // Load interpretations if they exist
              if (existingReading.interpretations) {
                const interps = existingReading.interpretations as any;
                const loadedInterpretations: typeof interpretations = {};
                if (interps.traditional?.content) loadedInterpretations.traditional = interps.traditional.content;
                if (interps.esoteric?.content) loadedInterpretations.esoteric = interps.esoteric.content;
                if (interps.jungian?.content) loadedInterpretations.jungian = interps.jungian.content;
                setInterpretations(loadedInterpretations);
                
                // Load chat history
                if (interps._metadata?.conversation) {
                  setChatHistory(interps._metadata.conversation);
                  setFollowUpCount(interps._metadata.follow_up_count || 0);
                }
                
                // Load reflection
                if (interps._metadata?.reflection) {
                  setReflection(interps._metadata.reflection);
                }
              }
              
              // Load cards from elements_drawn
              if (existingReading.elements_drawn && Array.isArray(existingReading.elements_drawn)) {
                const loadedCards: DrawnCard[] = existingReading.elements_drawn.map((el: any) => ({
                  cardCode: el.elementId || el.metadata?.cardCode || '',
                  reversed: el.metadata?.reversed || false,
                  position: el.position || el.metadata?.positionLabel || '',
                }));
                setCards(loadedCards);
              }
            }
          } catch (err: any) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:305',message:'Exception loading existing reading',data:{error:err?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
            // #endregion
            console.error('❌ Exception loading existing reading:', err);
          }
        }
        
        // Check animation preference
        const animationsEnabled = await AsyncStorage.getItem('@divin8_animations_enabled');
        const shouldAnimate = animationsEnabled !== 'false'; // Default to true if not set
        
        // Show card selection for 2 and 3 card spreads ONLY if animations are enabled
        if ((spreadData.card_count === 2 || spreadData.card_count === 3) && shouldAnimate) {
          setShowCardSelection(true);
          setLoading(false);
        } else {
          // Auto-draw for other spreads OR if animations are disabled
          await drawCardsForSpread(spreadData);
        }
      }
    } catch (error) {
      console.error('Error initializing reading:', error);
      Alert.alert(t('common.error'), 'Failed to initialize reading');
    } finally {
      setLoading(false);
    }
  };

  const handleCardsSelected = (selectedCards: LocalTarotCard[]) => {
    if (!spread) return;

    // Convert selected cards to DrawnCard format
    // IMPORTANT: Use the reversed state that was already determined during card selection animation
    const drawnCards: DrawnCard[] = selectedCards.map((card, index) => {
      const position = spread.positions[index];
      // Use the reversed state from the card (already determined during selection)
      const reversed = card.reversed || false;

      return {
        cardCode: card.code,
        position: locale === 'zh-TW' ? position.label.zh : position.label.en,
        reversed,
      };
    });

    setCards(drawnCards);
    setShowCardSelection(false);
    setLoading(false);

    // Generate interpretation in background (non-blocking)
    generateInterpretation(drawnCards, 'traditional', spread, undefined).catch(err => {
      console.error('Error generating interpretation:', err);
    });
  };

  const drawCardsForSpread = async (spreadData: TarotSpread) => {
    // Shuffle deck
    const shuffled = [...LOCAL_RWS_CARDS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Draw cards for each position
    const drawnCards: DrawnCard[] = [];
    for (let i = 0; i < spreadData.card_count; i++) {
      const card = shuffled[i];
      const position = spreadData.positions[i];
      const reversed = Math.random() < 0.3;

      drawnCards.push({
        cardCode: card.code,
        position: locale === 'zh-TW' ? position.label.zh : position.label.en,
        reversed,
      });
    }

    setCards(drawnCards);
    
    // Show cards immediately - don't wait for interpretation
    setLoading(false);

    // Generate interpretation in background (non-blocking)
    generateInterpretation(drawnCards, 'traditional', spreadData, undefined).catch(err => {
      console.error('Error generating interpretation:', err);
    });
  };

  const formatReadingDate = (dateString: string): string => {
    try {
      const readingDate = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = daysOfWeek[readingDate.getDay()];
      
      // Check if it's today
      if (readingDate.toDateString() === today.toDateString()) {
        return `today (${dayOfWeek})`;
      }
      
      // Check if it's yesterday
      if (readingDate.toDateString() === yesterday.toDateString()) {
        return `yesterday (${dayOfWeek})`;
      }
      
      // Check if it's this week (within last 7 days)
      const daysDiff = Math.floor((today.getTime() - readingDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        return `last ${dayOfWeek}`;
      }
      
      // For older readings, use relative time
      if (daysDiff <= 14) {
        return `${dayOfWeek} (${daysDiff} days ago)`;
      }
      
      return `${dayOfWeek} (${Math.floor(daysDiff / 7)} weeks ago)`;
    } catch (error) {
      return 'recently';
    }
  };

  const extractThemes = (interpretation: string): string => {
    if (!interpretation) return '';
    
    // Extract first sentence or key phrases (usually contains the main theme)
    const sentences = interpretation.split(/[.!?]/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      // Get first meaningful sentence, limit to 80 chars
      const theme = sentences[0].trim();
      return theme.length > 80 ? theme.substring(0, 80) + '...' : theme;
    }
    
    // Fallback: extract first 80 chars
    return interpretation.substring(0, 80) + (interpretation.length > 80 ? '...' : '');
  };

  const fetchLast10Readings = async (): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';

      const { data, error } = await supabase
        .from('readings')
        .select('interpretations, elements_drawn, created_at, question')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) return '';

      // Build context from last 10 readings with date and theme information
      const readingsContext = data
        .map((reading) => {
          const elements = reading.elements_drawn || [];
          const cardNames = elements
            .map((el: any) => {
              const cardData = LOCAL_RWS_CARDS.find(c => c.code === el.elementId || c.code === el.metadata?.cardCode);
              return cardData ? getLocalizedCard(cardData).title : el.metadata?.cardTitle || 'Unknown';
            })
            .filter(Boolean)
            .join(', ');
          
          const interpretation = reading.interpretations?.traditional?.content || 
                                reading.interpretations?.esoteric?.content ||
                                reading.interpretations?.jungian?.content ||
                                '';
          
          if (!cardNames && !interpretation) return null;
          
          const dateStr = reading.created_at ? formatReadingDate(reading.created_at) : 'recently';
          const question = reading.question || '';
          const theme = extractThemes(interpretation);
          
          // Build contextual reference
          let context = `On ${dateStr}`;
          if (question) {
            context += `, you asked about "${question.substring(0, 50)}${question.length > 50 ? '...' : ''}"`;
          }
          context += `. Cards drawn: ${cardNames}`;
          if (theme) {
            context += `. The reading focused on: ${theme}`;
          }
          
          return context;
        })
        .filter(Boolean)
        .join('\n');

      return readingsContext || '';
    } catch (error) {
      console.error('Error fetching last 10 readings:', error);
      return '';
    }
  };

  const generateInterpretation = async (
    cardsToInterpret: DrawnCard[],
    style: 'traditional' | 'esoteric' | 'jungian',
    spreadData?: TarotSpread,
    existingReadingId?: string | null
  ) => {
    setGenerating(true);
    try {
      // Use current user tier (may be loading, default to 'free')
      const currentTier = userTier || 'free';
      const currentProfile = userProfile;
      

      // Build detailed card descriptions with explicit reversed indication
      const cardsDetailed = cardsToInterpret.map((c, idx) => {
        const card = LOCAL_RWS_CARDS.find(lc => lc.code === c.cardCode);
        if (!card) return '';
        
        const localCard = getLocalizedCard(card);
        const position = c.position ? `[${c.position}] ` : '';
        
        // Explicit reversed indication
        const orientationText = c.reversed 
          ? (locale === 'zh-TW' ? '（逆位/REVERSED）' : '(REVERSED)')
          : (locale === 'zh-TW' ? '（正位/UPRIGHT）' : '(UPRIGHT)');
        
        // Get reversed or upright meaning
        const meaningObj = c.reversed ? card.reversed_meaning : card.upright_meaning;
        const lang = locale === 'zh-TW' ? 'zh' : 'en';
        const meaning = meaningObj[lang] || meaningObj.en || '';
        
        // Get keywords (same keywords for both reversed and upright)
        const keywords = localCard.keywords.slice(0, 3).join(', ');
        
        return `${position}${localCard.title} ${orientationText}\n  Keywords: ${keywords}\n  Meaning: ${meaning.substring(0, 100)}${meaning.length > 100 ? '...' : ''}`;
      }).join('\n\n');

      // Build birth context with detail (use current profile state)
      // Beta testers get enhanced astrological context regardless of tier
      const isBeta = isBetaTester || currentProfile?.is_beta_tester;
      let birthContextDetailed = '';
      
      if (currentProfile?.sun_sign) {
        if (currentTier === 'free' && !isBeta) {
          // Free tier: Sun sign only
          birthContextDetailed = `Querent's Sun Sign: ${currentProfile.sun_sign}`;
        } else if ((currentTier === 'adept' || isBeta) && (currentProfile.moon_sign || currentProfile.rising_sign)) {
          // Adept tier or beta tester: Big Three (Sun, Moon, Rising) when available
          const parts = [`Sun: ${currentProfile.sun_sign}`];
          if (currentProfile.moon_sign) parts.push(`Moon: ${currentProfile.moon_sign}`);
          if (currentProfile.rising_sign) parts.push(`Rising: ${currentProfile.rising_sign}`);
          
          birthContextDetailed = `Querent's Birth Chart:\n- ${parts.join('\n- ')}`;
        } else if (currentTier === 'apex' && currentProfile?.chart_data) {
          // Apex tier: Full chart
          const chartSummary = currentProfile.chart_data;
          birthContextDetailed = `Querent's Natal Chart: ${JSON.stringify(chartSummary).substring(0, 200)}`;
        } else {
          // Fallback: At least include sun sign
          birthContextDetailed = `Querent's Sun Sign: ${currentProfile.sun_sign}`;
        }
      }


      // Build concise system prompt (optimized for speed)
      let systemPrompt = '';
      const astroInstruction = birthContextDetailed 
        ? (locale === 'zh-TW' 
            ? ' 當提供占星背景時，自然地融入太陽、月亮和上升星座的影響（如適用）。'
            : ' When astrological context is provided, naturally incorporate Sun, Moon, and Rising sign influences (where applicable).')
        : '';
      
      const formatInstruction = locale === 'zh-TW'
        ? ' 使用純文字格式，不要使用任何標記格式（如 **粗體** 或 *斜體*）。'
        : ' Use plain text format only. Do NOT use markdown formatting (like **bold** or *italic*).';
      
      if (style === 'traditional') {
        systemPrompt = locale === 'zh-TW' 
          ? `專業塔羅解讀。130-156字。${formatInstruction}${astroInstruction}`
          : `Expert tarot reader. 130-156 words.${formatInstruction}${astroInstruction}`;
      } else if (style === 'esoteric') {
        systemPrompt = locale === 'zh-TW'
          ? `神秘學專家。195-234字。${formatInstruction}${astroInstruction}`
          : `Esoteric expert. 195-234 words.${formatInstruction}${astroInstruction}`;
      } else {
        systemPrompt = locale === 'zh-TW'
          ? `榮格心理學家。234-260字。${formatInstruction}${astroInstruction}`
          : `Jungian analyst. 234-260 words.${formatInstruction}${astroInstruction}`;
      }

      // Load reading history with conversations and reflections for ALL readings
      let readingsContext = '';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Use PromptBuilder to get comprehensive history including conversations and reflections
          const historyCount = PromptBuilder.getSmartHistoryCount(currentTier, false);
          const includeConversations = currentTier !== 'free'; // Premium+ get conversations
          readingsContext = await PromptBuilder.loadRecentReadingHistory(
            user.id,
            locale,
            historyCount,
            includeConversations
          );
        }
      } catch (error) {
        console.error('Error loading reading history:', error);
        // Fallback to simple history if PromptBuilder fails
        if (!spreadData) {
          readingsContext = await fetchLast10Readings();
        }
      }

      // Concise prompts (optimized for speed)
      let prompt = '';
      const astroGuidance = birthContextDetailed 
        ? (locale === 'zh-TW'
            ? ' 自然地將占星背景融入解讀中，特別是當卡牌與太陽、月亮或上升星座的能量產生共鳴時。'
            : ' Naturally weave astrological context into the interpretation, especially when cards resonate with Sun, Moon, or Rising sign energies.')
        : '';
      
      // Build prompt with context for all readings
      // PRIORITY: Past readings, conversations, and reflections are MORE IMPORTANT than astrology
      const reversedInstruction = locale === 'zh-TW'
        ? '注意：如果卡牌標示為「逆位/REVERSED」，必須使用逆位的意義和能量來解讀，這與正位完全不同。'
        : 'IMPORTANT: If a card is marked as "(REVERSED)", you MUST interpret it using reversed meanings and energy, which is fundamentally different from upright.';
      
      const contextPriorityInstruction = locale === 'zh-TW'
        ? '重要：過去解讀、對話和反思的內容比占星背景更優先。優先考慮用戶的歷史問題、洞察和反思，然後才融入占星元素。'
        : 'PRIORITY: Past readings, conversations, and reflections are MORE IMPORTANT than astrology. Prioritize the user\'s historical questions, insights, and reflections, then weave in astrological elements as secondary context.';
      
      const formattingInstruction = locale === 'zh-TW'
        ? '重要：請使用純文字格式，不要使用任何標記格式（如 **粗體** 或 *斜體*）。直接寫出卡牌名稱即可。'
        : 'IMPORTANT: Use plain text format only. Do NOT use any markdown formatting (like **bold** or *italic*). Write card names directly without any formatting.';
      
      // Define word limits by style (30% longer than before)
      const wordLimits = style === 'traditional' 
        ? (locale === 'zh-TW' ? '130-156' : '130-156')
        : style === 'esoteric'
        ? (locale === 'zh-TW' ? '195-234' : '195-234')
        : (locale === 'zh-TW' ? '234-260' : '234-260');
      
      if (spreadData) {
        // SPREAD READING - prioritize context over astrology
        prompt = `Q: "${question || 'Guidance'}"

Cards:
${cardsDetailed}

${reversedInstruction}

${readingsContext ? `HIGH PRIORITY - Past Reading Context (includes questions, conversations, and reflections):
${readingsContext}

` : ''}${contextPriorityInstruction}

${formattingInstruction}

${birthContextDetailed ? `Astrological Context (secondary - use as supporting detail): ${birthContextDetailed}\n` : ''}${astroGuidance}
Write ${wordLimits} words. Consider patterns from past readings as primary guidance.`;
      } else {
        // DAILY CARD - prioritize context over astrology
        prompt = `Daily Card:
${cardsDetailed}

${reversedInstruction}

${readingsContext ? `HIGH PRIORITY - Past Reading Context (includes questions, conversations, and reflections):
${readingsContext}

` : ''}${contextPriorityInstruction}

${formattingInstruction}

${birthContextDetailed ? `Astrological Context (secondary - use as supporting detail): ${birthContextDetailed}\n` : ''}${astroGuidance}
Write ${wordLimits} words. When referencing past readings, use the day of the week or themes mentioned.`;
      }


      const result = await AIProvider.generate({
        prompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1200, // Increased to allow for Gemini 2.5 thinking tokens + output
      });

      // Validate and truncate if too long
      const wordCount = result.text.split(/\s+/).length;

      // Define word limits by style (30% longer than before)
      const maxWords = style === 'traditional' ? 156 : style === 'esoteric' ? 234 : 260;
      
      let finalText = result.text;
      if (wordCount > maxWords) {
        // Truncate to max words, preserving sentence boundaries
        const words = result.text.split(/\s+/);
        const truncatedWords = words.slice(0, maxWords);
        // Try to end at a sentence boundary
        let truncatedText = truncatedWords.join(' ');
        const lastSentenceEnd = Math.max(
          truncatedText.lastIndexOf('.'),
          truncatedText.lastIndexOf('!'),
          truncatedText.lastIndexOf('?')
        );
        if (lastSentenceEnd > truncatedText.length * 0.7) {
          truncatedText = truncatedText.substring(0, lastSentenceEnd + 1);
        }
        finalText = truncatedText;
      }


      setInterpretations(prev => {
        const updated = {
          ...prev,
          [style]: finalText,
        };
        
        // Don't update here - we'll update after ensuring readingId is set
        // This prevents race conditions
        
        return updated;
      });

      // Auto-save reading after first interpretation is generated - pass cards directly
      // Use existingReadingId parameter (from immediate save) or check state/ref
      const currentReadingId = existingReadingId || readingIdRef.current || readingId;
      
      if (type === 'daily') {
        // Daily cards are saved immediately when drawn
        if (currentReadingId) {
          // Update readingId in state and ref if not already set
          if (!readingId) {
            setReadingId(currentReadingId);
            readingIdRef.current = currentReadingId;
          }
        } else {
          // Fallback: if immediate save failed, save now
          const savedId = await autoSaveReading(cardsToInterpret);
          if (savedId) {
            setReadingId(savedId);
            readingIdRef.current = savedId;
          }
        }
      } else {
        // Spread readings: save here if not already saved
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:794',message:'Spread reading save check',data:{autoSaved:autoSaved,currentReadingId:currentReadingId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
        // #endregion
        if (!autoSaved && !currentReadingId) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:797',message:'Calling autoSaveReading for spread',data:{cardsCount:cardsToInterpret.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
          // #endregion
          const savedId = await autoSaveReading(cardsToInterpret);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:800',message:'autoSaveReading for spread returned',data:{savedId:savedId,isNull:savedId===null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
          // #endregion
          if (savedId) {
            setReadingId(savedId);
            readingIdRef.current = savedId;
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:804',message:'Spread readingId set',data:{readingId:savedId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
            // #endregion
          }
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:808',message:'Skipping spread save - already saved',data:{autoSaved:autoSaved,currentReadingId:currentReadingId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
          // #endregion
        }
      }
      
      // Update interpretations in the saved reading
      const finalReadingId = existingReadingId || readingIdRef.current || readingId;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:815',message:'Final readingId for update',data:{finalReadingId:finalReadingId,existingReadingId:existingReadingId,readingIdRef:readingIdRef.current,readingId:readingId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
      if (finalReadingId) {
        // Ensure readingId is set in state and ref
        if (!readingId) {
          setReadingId(finalReadingId);
        }
        if (!readingIdRef.current) {
          readingIdRef.current = finalReadingId;
        } else if (readingIdRef.current !== finalReadingId) {
          // Update ref if it's different
          readingIdRef.current = finalReadingId;
        }
        
        // Update the reading with the new interpretation
        // Use current interpretations state and add/update the new style
        const updatedInterpretations = {
          ...interpretations, // Get current state
          [style]: finalText, // Add/update the new interpretation
        };
        await updateReadingInterpretationsWithId(finalReadingId, updatedInterpretations);
      }

    } catch (error: any) {
      console.error('Error generating interpretation:', error);
      // Log the error details for debugging
      if (error?.message) {
        console.error('Error message:', error.message);
      }
      if (error?.stack) {
        console.error('Error stack:', error.stack);
      }
      Alert.alert(t('common.error'), 'Failed to generate interpretation');
    } finally {
      setGenerating(false);
    }
  };

  const handleStyleChange = async (style: 'traditional' | 'esoteric' | 'jungian') => {
    // Check tier access (bypass for beta testers)
    if (!isBetaTester && (style === 'esoteric' || style === 'jungian') && userTier === 'free') {
      Alert.alert(
        t('tiers.upgrade.title'),
        t('tiers.upgrade.adeptCta'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('tiers.adept'), onPress: () => router.push('/(tabs)/profile') }
        ]
      );
      return;
    }

    setSelectedStyle(style);

    // Generate if not already generated
    if (!interpretations[style]) {
      await generateInterpretation(cards, style, spread || undefined);
    }
  };

  const handleFollowUpQuestion = async () => {
    if (!chatInput.trim()) {
      return;
    }

    // Check follow-up limit for free users (bypass for beta testers)
    if (!isBetaTester && userTier === 'free' && followUpCount >= 3) {
      Alert.alert(
        t('tiers.upgrade.title'),
        locale === 'zh-TW' 
          ? '免費用戶限制3個後續問題。升級至Adept以獲得無限提問。'
          : 'Free users are limited to 3 follow-up questions. Upgrade to Adept for unlimited questions.',
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('tiers.adept'), onPress: () => router.push('/(tabs)/profile') }
        ]
      );
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);
    setFollowUpCount(prev => prev + 1);

    try {
      // Build current reading context
      const cardsContext = cards.map(c => {
        const card = LOCAL_RWS_CARDS.find(lc => lc.code === c.cardCode);
        if (!card) return '';
        const name = locale === 'zh-TW' ? card.title.zh : card.title.en;
        return `${name}${c.reversed ? ' (R)' : ''}`;
      }).join(', ');

      // Build astrological context (same logic as interpretation)
      const isBeta = isBetaTester || userProfile?.is_beta_tester;
      let birthContextDetailed = '';
      if (userProfile?.sun_sign) {
        if (userTier === 'free' && !isBeta) {
          birthContextDetailed = `Querent's Sun Sign: ${userProfile.sun_sign}`;
        } else if ((userTier === 'adept' || isBeta) && (userProfile.moon_sign || userProfile.rising_sign)) {
          const parts = [`Sun: ${userProfile.sun_sign}`];
          if (userProfile.moon_sign) parts.push(`Moon: ${userProfile.moon_sign}`);
          if (userProfile.rising_sign) parts.push(`Rising: ${userProfile.rising_sign}`);
          birthContextDetailed = `Querent's Birth Chart:\n- ${parts.join('\n- ')}`;
        } else if (userTier === 'apex' && userProfile?.chart_data) {
          const chartSummary = userProfile.chart_data;
          birthContextDetailed = `Querent's Natal Chart: ${JSON.stringify(chartSummary).substring(0, 200)}`;
        } else {
          birthContextDetailed = `Querent's Sun Sign: ${userProfile.sun_sign}`;
        }
      }

      // Fetch previous readings context for Q&A
      const readingsContext = await fetchLast10Readings();

      // Build prompt with previous readings context and astrological context
      let prompt = `Current Reading: ${cardsContext}
Original question: ${question || 'General guidance'}

${birthContextDetailed ? `Astrological Context: ${birthContextDetailed}\n` : ''}${readingsContext ? `Previous Reading History (for reference):
${readingsContext}

` : ''}User asks: ${userMessage.content}

Answer the question. If the user asks about previous readings mentioned in the interpretation, you can reference the reading history above. Use day references (e.g., "last Tuesday's reading") or themes to help the user recall. ${birthContextDetailed ? 'You can also incorporate astrological context (Sun, Moon, Rising signs) when relevant to the question.' : ''} Keep it concise (100-150 words).`;

      const systemPrompt = locale === 'zh-TW'
        ? `你是塔羅解讀師。可以參考過去的占卜記錄和占星背景來回答問題。簡潔回答。${birthContextDetailed ? '當問題相關時，可以自然地融入太陽、月亮和上升星座的影響。' : ''}`
        : `You are a tarot reader. You can reference past reading history${birthContextDetailed ? ' and astrological context' : ''} to answer questions. Answer concisely.${birthContextDetailed ? ' When relevant, naturally incorporate Sun, Moon, and Rising sign influences.' : ''}`;

      const result = await AIProvider.generate({
        prompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 800,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.text,
        timestamp: new Date().toISOString(),
      };

      setChatHistory(prev => {
        const updated = [...prev, assistantMessage];
        // Update reading with new chat history if already saved
        if (readingId) {
          updateReadingChatHistory(updated);
        }
        return updated;
      });
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('❌ Error in follow-up:', error);
      Alert.alert(t('common.error'), 'Failed to get response');
    } finally {
      setChatLoading(false);
    }
  };

  // Update reading with new interpretation styles (uses readingId from state)
  const updateReadingInterpretations = async (updatedInterpretations: typeof interpretations) => {
    const idToUse = readingIdRef.current || readingId;
    if (!idToUse) {
      console.warn('⚠️ No readingId available for updateReadingInterpretations');
      return;
    }
    return updateReadingInterpretationsWithId(idToUse, updatedInterpretations);
  };

  // Update reading with new interpretation styles (takes readingId as parameter)
  const updateReadingInterpretationsWithId = async (id: string, updatedInterpretations: typeof interpretations) => {
    if (!id) {
      console.warn('⚠️ No readingId provided to updateReadingInterpretationsWithId');
      return;
    }

    try {
      
      // Get current reading
      const { data: currentReading, error: fetchError } = await supabase
        .from('readings')
        .select('interpretations')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching reading:', fetchError);
        return;
      }

      if (!currentReading?.interpretations) {
        console.warn('⚠️ No interpretations found in reading, creating new structure');
        // Create new structure if it doesn't exist
        const newInterpretations: Record<string, any> = {};
        Object.keys(updatedInterpretations).forEach(key => {
          if (updatedInterpretations[key as keyof typeof updatedInterpretations]) {
            newInterpretations[key] = {
              content: updatedInterpretations[key as keyof typeof updatedInterpretations] || '',
            };
          }
        });
        newInterpretations._metadata = {
          reading_type: type === 'daily' ? 'daily_card' : 'spread',
          interpretation_styles: Object.keys(updatedInterpretations),
          follow_up_count: followUpCount,
          conversation: chatHistory,
          reflection: reflection || null,
        };

        const { error: updateError } = await supabase
          .from('readings')
          .update({ interpretations: newInterpretations })
          .eq('id', id);
        
        if (updateError) {
          console.error('❌ Error updating reading:', updateError);
        }
        return;
      }

      const currentInterpretations = currentReading.interpretations as Record<string, any>;
      
      // Update all interpretation styles
      Object.keys(updatedInterpretations).forEach(key => {
        if (updatedInterpretations[key as keyof typeof updatedInterpretations]) {
          currentInterpretations[key] = {
            content: updatedInterpretations[key as keyof typeof updatedInterpretations] || '',
          };
        }
      });

      // Update metadata
      if (!currentInterpretations._metadata) {
        currentInterpretations._metadata = {};
      }
      currentInterpretations._metadata.interpretation_styles = Object.keys(updatedInterpretations).filter(k => k !== '_metadata');
      currentInterpretations._metadata.conversation = chatHistory;
      currentInterpretations._metadata.follow_up_count = chatHistory.filter(m => m.role === 'user').length;
      currentInterpretations._metadata.reflection = reflection || null;

      // Update the reading
      const { error: updateError } = await supabase
        .from('readings')
        .update({ interpretations: currentInterpretations })
        .eq('id', id);
      
      if (updateError) {
        console.error('❌ Error updating reading:', updateError);
      }
    } catch (error) {
      console.error('❌ Error updating interpretations:', error);
    }
  };

  // Update reading reflection
  const updateReadingReflection = async (newReflection: string) => {
    if (!readingId) return;

    try {
      const { data: currentReading } = await supabase
        .from('readings')
        .select('interpretations')
        .eq('id', readingId)
        .single();

      if (!currentReading?.interpretations) {
        console.warn('❌ No interpretations found for reading:', readingId);
        return;
      }

      const currentInterpretations = currentReading.interpretations as Record<string, any>;
      
      // Ensure _metadata exists
      if (!currentInterpretations._metadata) {
        currentInterpretations._metadata = {};
      }
      
      // Update reflection
      currentInterpretations._metadata.reflection = newReflection || null;

      const { error } = await supabase
        .from('readings')
        .update({ interpretations: currentInterpretations })
        .eq('id', readingId);
      
      if (error) {
        console.error('❌ Error updating reflection:', error);
        return;
      }
      
      console.log('✅ Updated reading reflection:', newReflection ? `${newReflection.length} chars` : 'cleared');
    } catch (error) {
      console.error('❌ Error updating reflection:', error);
    }
  };

  // Update reading chat history when new messages are added
  const updateReadingChatHistory = async (updatedChatHistory: ChatMessage[]) => {
    if (!readingId) return;

    try {
      // Get current interpretations
      const { data: currentReading } = await supabase
        .from('readings')
        .select('interpretations')
        .eq('id', readingId)
        .single();

      if (!currentReading?.interpretations) return;

      const currentInterpretations = currentReading.interpretations as Record<string, any>;
      
      // Update metadata with new chat history
      if (currentInterpretations._metadata) {
        currentInterpretations._metadata.conversation = updatedChatHistory;
        currentInterpretations._metadata.follow_up_count = updatedChatHistory.filter(m => m.role === 'user').length;

        // Update the reading
        await supabase
          .from('readings')
          .update({ interpretations: currentInterpretations })
          .eq('id', readingId);
          
        console.log('✅ Updated reading chat history');
      }
    } catch (error) {
      console.error('❌ Error updating chat history:', error);
      // Silent fail
    }
  };

  // Auto-save reading when interpretation is generated (without reflection)
  // Also called immediately for daily cards when they're drawn
  // Returns readingId if successful, null otherwise
  const autoSaveReading = async (cardsToSave?: DrawnCard[]): Promise<string | null> => {
    // Check both state and ref to avoid race conditions
    const currentReadingId = readingIdRef.current || readingId;
    const readingType = type; // Capture type at function start
    
    if (!readingType) {
      console.error('❌ No reading type available! Cannot save.');
      return null;
    }
    
    // For daily cards, only check readingId (don't check autoSaved - we want to save immediately)
    // For spread readings, check both autoSaved and readingId
    if (readingType === 'spread' && (autoSaved || currentReadingId)) {
      return null;
    }
    // For daily cards, check if we already have a valid readingId
    // If we do, verify it exists in the database before skipping
    if (readingType === 'daily' && currentReadingId) {
      try {
        const { data: existingReading, error: verifyError } = await supabase
          .from('readings')
          .select('id')
          .eq('id', currentReadingId)
          .maybeSingle();
        
        if (existingReading && !verifyError) {
          return currentReadingId;
        }
      } catch (verifyErr) {
        // Continue to save below
      }
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('❌ Error getting user:', userError);
        return null;
      }
      if (!user) {
        console.log('⏭️ No user found, skipping auto-save');
        return null;
      }
      console.log('✅ User found:', user.id);

      // Use provided cards or fall back to state (for backwards compatibility)
      const cardsToUse = cardsToSave || cards;
      
      if (!cardsToUse || cardsToUse.length === 0) {
        console.error('❌ No cards to save!', { cardsToSave, cardsState: cards });
        return null;
      }


      // Get the tarot divination system ID
      let divinationSystemId: string | null = null;
      
      const { data: tarotSystem, error: systemError } = await supabase
        .from('divination_systems')
        .select('id, system_key')
        .or('system_key.eq.tarot,system_key.eq.rws')
        .limit(1)
        .single();

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

      // Build elements_drawn - ensure all card data is saved
      const elementsDrawn = cardsToUse.map(c => {
        const card = LOCAL_RWS_CARDS.find(lc => lc.code === c.cardCode);
        if (!card) {
          console.error('❌ Card not found for code:', c.cardCode);
          return null;
        }

        const elementData = {
          elementId: card.code, // Card code (e.g., "00", "01", "P02")
          position: c.position || 'Guidance',
          metadata: {
            cardTitle: card.title.en, // English title for lookup
            cardTitleZh: card.title.zh, // Chinese title for lookup
            cardCode: card.code, // Card code for reliable lookup
            positionLabel: c.position || 'Guidance',
            reversed: c.reversed || false,
            suit: card.suit || null,
            arcana: card.arcana,
            // Additional metadata for statistics
            number: card.code, // Keep code as number reference
          },
        };

        return elementData;
      }).filter(Boolean);

      console.log('💾 Total elements to save:', elementsDrawn.length);
      if (elementsDrawn.length === 0) {
        console.error('❌ ERROR: No elements drawn! Cards array was empty or invalid.');
        return null;
      }

      // Format interpretations - even if empty, we still save the reading
      const formattedInterpretations: Record<string, any> = {};
      Object.keys(interpretations).forEach(key => {
        if (interpretations[key as keyof typeof interpretations]) {
          formattedInterpretations[key] = {
            content: interpretations[key as keyof typeof interpretations] || '',
          };
        }
      });

      // Always include _metadata, even if interpretations are empty
      formattedInterpretations._metadata = {
        reading_type: readingType === 'daily' ? 'daily_card' : 'spread',
        interpretation_styles: Object.keys(interpretations).filter(k => interpretations[k as keyof typeof interpretations]),
        follow_up_count: followUpCount,
        astro_depth: userTier === 'free' ? 'sun_sign' : userTier === 'adept' ? 'big_three' : 'full_chart',
        conversation: chatHistory,
        reflection: null, // No reflection on auto-save
        tier_at_creation: userTier,
      };
      

      if (spread) {
        formattedInterpretations._metadata.spread_key = spread.spread_key;
        formattedInterpretations._metadata.spread_name = {
          en: spread.name.en,
          zh: spread.name.zh,
        };
        formattedInterpretations._metadata.spread_card_count = spread.card_count;
      }

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

      const questionText = question || (readingType === 'daily' 
        ? (locale === 'zh-TW' ? '每日卡牌' : 'Daily guidance')
        : null);
      const questionHash = generateQuestionHash(questionText);
      

      const readingData: Record<string, any> = {
        user_id: user.id,
        divination_system_id: divinationSystemId,
        reading_type: readingType === 'daily' ? 'daily_card' : 'spread',
        question: questionText,
        question_hash: questionHash,
        elements_drawn: elementsDrawn,
        interpretations: formattedInterpretations,
        language: locale === 'zh-TW' ? 'zh-TW' : 'en',
      };
      

      console.log('💾 Inserting reading data:', {
        user_id: readingData.user_id,
        reading_type: readingData.reading_type,
        elements_drawn_count: readingData.elements_drawn?.length || 0,
        interpretations_keys: Object.keys(readingData.interpretations || {}),
      });
      
      const { data, error } = await supabase
        .from('readings')
        .insert(readingData)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Auto-save error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error hint:', error.hint);
        console.error('❌ Error details object:', error.details);
        console.error('❌ Reading data attempted:', JSON.stringify(readingData, null, 2));
        
        // Check if it's a unique constraint violation (duplicate daily card)
        if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
          console.log('⚠️ Duplicate reading detected - trying to find existing reading');
          // Try to fetch the existing reading
          if (readingType === 'daily') {
            // For daily cards, search by user_id, reading_type, and question_hash
            const { data: existingReading, error: fetchError } = await supabase
              .from('readings')
              .select('id, reading_type, created_at')
              .eq('user_id', user.id)
              .eq('reading_type', 'daily_card')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (fetchError) {
              console.error('❌ Error fetching existing reading:', fetchError);
            } else if (existingReading?.id) {
              console.log('✅ Found existing daily card reading:', existingReading.id);
              setReadingId(existingReading.id);
              readingIdRef.current = existingReading.id;
              setAutoSaved(true);
              return existingReading.id;
            } else {
              console.warn('⚠️ Duplicate error but no existing reading found');
            }
          } else if (questionHash) {
            // For spread readings, search by question_hash
            const { data: existingReading } = await supabase
              .from('readings')
              .select('id')
              .eq('user_id', user.id)
              .eq('question_hash', questionHash)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (existingReading?.id) {
              console.log('✅ Found existing spread reading:', existingReading.id);
              setReadingId(existingReading.id);
              readingIdRef.current = existingReading.id;
              return existingReading.id;
            }
          }
        }
        
        return null; // Return null on error
      }

      if (!data || !data.id) {
        return null;
      }
      
      // Verify the reading was actually saved by querying it back
      const { data: verifyData, error: verifyError } = await supabase
        .from('readings')
        .select('id, reading_type, created_at')
        .eq('id', data.id)
        .single();
      
      if (verifyError || !verifyData) {
        // Verification failed - but insert succeeded, might just be timing
      }
      
      setReadingId(data.id);
      readingIdRef.current = data.id; // Also update ref immediately
      setAutoSaved(true);
      console.log('✅ State updated: readingId =', data.id, 'autoSaved =', true);
      console.log('✅ Ref updated: readingIdRef.current =', readingIdRef.current);
      return data.id; // Return readingId so caller can use it immediately
    } catch (error) {
      console.error('❌ Error auto-saving reading:', error);
      // Silent fail for auto-save
      return null;
    }
  };

  // Save reflection (update existing reading with ALL data)
  const handleSaveReading = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:1421',message:'handleSaveReading entry',data:{readingId:readingId,readingIdRef:readingIdRef.current,readingIdParam:readingIdParam,type:type,hasReflection:!!reflection.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion
    if (!readingId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:1424',message:'No readingId, calling autoSaveReading',data:{readingIdParam:readingIdParam},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
      // #endregion
      // If no reading ID, do a full save (shouldn't happen, but fallback)
      const savedId = await autoSaveReading();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:1427',message:'autoSaveReading returned',data:{savedId:savedId,isNull:savedId===null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
      // #endregion
      if (savedId) {
        setReadingId(savedId);
        readingIdRef.current = savedId;
        // Retry after auto-save
        await handleSaveReading();
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:1433',message:'autoSaveReading failed, cannot save',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
        Alert.alert(t('common.error'), 'Failed to save reading. Please try again.');
      }
      return;
    }

    try {
      // Format ALL interpretation styles
      const formattedInterpretations: Record<string, any> = {};
      
      Object.keys(interpretations).forEach(key => {
        if (interpretations[key as keyof typeof interpretations]) {
          formattedInterpretations[key] = {
            content: interpretations[key as keyof typeof interpretations] || '',
          };
        }
      });

      // Update metadata with ALL current data (reflection, chat history, all interpretation styles)
      formattedInterpretations._metadata = {
        reading_type: type === 'daily' ? 'daily_card' : 'spread',
        interpretation_styles: Object.keys(interpretations).filter(k => k !== '_metadata'),
        follow_up_count: chatHistory.filter(m => m.role === 'user').length,
        astro_depth: userTier === 'free' ? 'sun_sign' : userTier === 'adept' ? 'big_three' : 'full_chart',
        conversation: chatHistory, // Save ALL chat history
        reflection: reflection || null, // Save reflection
        tier_at_creation: userTier,
      };

      if (spread) {
        formattedInterpretations._metadata.spread_key = spread.spread_key;
        formattedInterpretations._metadata.spread_name = {
          en: spread.name.en,
          zh: spread.name.zh,
        };
        formattedInterpretations._metadata.spread_card_count = spread.card_count;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:1468',message:'Updating reading with interpretations',data:{readingId:readingId,interpretationStyles:Object.keys(formattedInterpretations).filter(k=>k!=='_metadata')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
      // #endregion
      // Update the interpretations field (which contains ALL data)
      const { error } = await supabase
        .from('readings')
        .update({ interpretations: formattedInterpretations })
        .eq('id', readingId);

      if (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:1474',message:'Error updating reading',data:{error:error.message,errorCode:error.code,readingId:readingId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
        console.error('❌ Error updating reading:', error);
        Alert.alert(t('common.error'), 'Failed to save reading');
        return;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reading.tsx:1480',message:'Reading updated successfully',data:{readingId:readingId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
      // #endregion

      setSaved(true);
      
      // Show auto-dismissing success modal
      setShowSaveModal(true);
      setTimeout(() => {
        setShowSaveModal(false);
      }, 2000); // Auto-dismiss after 2 seconds

    } catch (error: any) {
      console.error('❌ Error saving reflection:', error);
      Alert.alert(t('common.error'), 'Failed to save reflection');
    }
  };

  const handleCardPress = (cardCode: string, reversed: boolean) => {
    const card = LOCAL_RWS_CARDS.find(c => c.code === cardCode);
    
    if (card) {
      setSelectedCard({ ...card, reversed });
      setModalVisible(true);
    } else {
      console.error('❌ Card NOT found for code:', cardCode);
    }
  };

  // Format interpretation text with bold/italic for card names, days, and main points
  const formatInterpretationText = (text: string): React.ReactNode => {
    if (!text) return null;

    // Strip markdown bold/italic formatting from text first
    // This ensures consistent display regardless of AI output format
    let cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
      .replace(/\*([^*]+)\*/g, '$1');    // Remove *italic*

    // Get all card names (both English and Chinese) - sorted by length (longest first)
    const allCardNames: string[] = [];
    LOCAL_RWS_CARDS.forEach(card => {
      const localized = getLocalizedCard(card);
      if (localized.title) allCardNames.push(localized.title);
      if (card.title.en) allCardNames.push(card.title.en);
      if (card.title.zh) allCardNames.push(card.title.zh);
    });
    allCardNames.sort((a, b) => b.length - a.length);

    // Days and date patterns (sorted by length)
    const dayPatterns = [
      'last wednesday', 'last thursday', 'last friday', 'last saturday', 'last sunday', 'last monday', 'last tuesday',
      'this week', 'next week',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'today', 'yesterday', 'tomorrow', 'last',
      '上週三', '上週四', '上週五', '上週六', '上週日', '上週一', '上週二',
      '本週', '下週',
      '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日',
      '今天', '昨天', '明天', '上週', '上個'
    ];

    // Build regex patterns
    const cardPattern = allCardNames.map(name => 
      name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('|');
    const dayPattern = dayPatterns.map(day => 
      day.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('|');

    // Combined regex to find all matches
    // For Chinese, use different word boundary handling (Chinese doesn't use spaces)
    const isChinese = locale === 'zh-TW';
    const wordBoundary = isChinese ? '' : '\\b';
    const combinedRegex = new RegExp(`${wordBoundary}(${cardPattern}|${dayPattern})${wordBoundary}`, isChinese ? 'g' : 'gi');
    
    const parts: Array<{ text: string; type: 'normal' | 'card' | 'day' }> = [];
    let lastIndex = 0;
    let match;

    // Reset regex lastIndex
    combinedRegex.lastIndex = 0;
    
    while ((match = combinedRegex.exec(cleanText)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({ text: cleanText.substring(lastIndex, match.index), type: 'normal' });
      }
      
      // Determine if it's a card or day
      const matchedText = match[0];
      const isCard = allCardNames.some(name => 
        name.toLowerCase() === matchedText.toLowerCase()
      );
      
      parts.push({ 
        text: matchedText, 
        type: isCard ? 'card' : 'day' 
      });
      
      lastIndex = match.index + matchedText.length;
    }

    // Add remaining text
    if (lastIndex < cleanText.length) {
      parts.push({ text: cleanText.substring(lastIndex), type: 'normal' });
    }

    // If no matches, return plain text
    if (parts.length === 1 && parts[0].type === 'normal') {
      return <Text style={styles.interpretationText}>{cleanText}</Text>;
    }

    // Render formatted text
    return (
      <Text style={styles.interpretationText}>
        {parts.map((part, idx) => {
          if (part.type === 'card') {
            return (
              <Text key={idx} style={styles.cardNameInText}>
                {part.text}
              </Text>
            );
          } else if (part.type === 'day') {
            return (
              <Text key={idx} style={styles.dayReferenceInText}>
                {part.text}
              </Text>
            );
          } else {
            // Check for emphasis at start of sentences (both English and Chinese)
            const sentences = part.text.split(/([.!?。！？]\s*)/);
            return sentences.map((sentence, sIdx) => {
              // Bold first sentence of paragraphs or key phrases
              const isStartOfParagraph = idx === 0 || (parts[idx - 1]?.text.match(/[.!?。！？]\s*$/) !== null);
              
              // English emphasis words
              const hasEnglishEmphasis = /^(This|These|Your|You|The|Today|Now|Remember|Focus|Important|Key|Crucial)/i.test(sentence.trim());
              
              // Chinese emphasis words/phrases
              const hasChineseEmphasis = /^(這|這些|你的|您|這個|今天|現在|記住|記住|專注|重要|關鍵|關鍵的|請|注意)/.test(sentence.trim());
              
              if ((isStartOfParagraph || hasEnglishEmphasis || hasChineseEmphasis) && sentence.trim().length > (locale === 'zh-TW' ? 8 : 15)) {
                return (
                  <Text key={`${idx}-${sIdx}`} style={styles.emphasisText}>
                    {sentence}
                  </Text>
                );
              }
              return <Text key={`${idx}-${sIdx}`}>{sentence}</Text>;
            });
          }
        })}
      </Text>
    );
  };

  const availableStyles: InterpretationStyle[] = [
    {
      key: 'traditional',
      label: { en: 'Traditional', zh: '傳統' },
      requiredTier: 'free',
    },
    {
      key: 'esoteric',
      label: { en: 'Esoteric', zh: '神秘學' },
      requiredTier: 'adept',
    },
    {
      key: 'jungian',
      label: { en: 'Jungian', zh: '榮格心理學' },
      requiredTier: 'adept',
    },
  ];

  const canAccessStyle = (style: InterpretationStyle) => {
    // Beta testers get access to all styles
    if (isBetaTester) return true;
    
    const tierOrder = { free: 0, adept: 1, apex: 2 };
    return tierOrder[userTier] >= tierOrder[style.requiredTier];
  };

  // Show card selection screen for 2 and 3 card spreads
  if (showCardSelection && spread) {
    return (
      <CardSelectionScreen
        key={`card-selection-${spread.spread_key}`} // Stable key to prevent remounting
        cardCount={spread.card_count}
        onCardsSelected={handleCardsSelected}
        onCancel={() => router.back()}
      />
    );
  }

  if (loading) {
    return (
      <MysticalBackground variant="default">
        <View style={styles.centerContainer}>
          <SpinningLogo size={100} />
          <ThemedText variant="body" style={styles.loadingText}>
            {type === 'daily' ? t('reading.drawingCard') : t('reading.preparingSpread')}
          </ThemedText>
        </View>
      </MysticalBackground>
    );
  }

  // Determine header title
  const headerTitle = type === 'daily' 
    ? (locale === 'zh-TW' ? '每日卡牌' : 'Daily Card')
    : spread 
      ? (locale === 'zh-TW' ? spread.name.zh : spread.name.en)
      : (locale === 'zh-TW' ? '解讀' : 'Reading');

  return (
    <>
      <Stack.Screen 
        options={{
          title: headerTitle,
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
              onPress={() => {
                // Always navigate back to home for daily cards
                if (type === 'daily') {
                  try {
                    router.back();
                  } catch (e: any) {
                    console.error('Back navigation error:', e);
                    router.push('/(tabs)/home');
                  }
                } else {
                  // For spread readings, try to go back
                  try {
                    router.back();
                  } catch (e) {
                    router.push('/(tabs)/home');
                  }
                }
              }}
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <MysticalBackground variant="default">
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
          {/* Question (for spread readings) */}
          {type === 'spread' && question && (
            <ThemedCard variant="minimal" style={styles.questionCard}>
              <ThemedText variant="caption" style={styles.questionLabel}>
                {t('home.questionPrompt')}
              </ThemedText>
              <ThemedText variant="body" style={styles.questionText}>
                {question}
              </ThemedText>
            </ThemedCard>
          )}

          {/* Spread Name */}
          {spread && (
            <ThemedText variant="h2" style={styles.spreadName}>
              {locale === 'zh-TW' ? spread.name.zh : spread.name.en}
            </ThemedText>
          )}

          {/* Cards Display */}
          <View style={[
            styles.cardsContainer,
            cards.length === 3 && styles.cardsContainerThree,
            cards.length === 2 && styles.cardsContainerTwo,
          ]}>
            {cards.map((drawnCard, idx) => {
              const cardData = LOCAL_RWS_CARDS.find(c => c.code === drawnCard.cardCode);
              if (!cardData) {
                console.error('❌ Card data not found:', drawnCard.cardCode);
                return null;
              }

              const localizedCard = getLocalizedCard(cardData);
              
              // CRITICAL: Keywords must be available for both upright AND reversed cards
              // Get keywords from localized card first, fallback to original card keywords
              // Reversed state does NOT affect keywords - same keywords apply to both orientations
              const localizedKeywords = localizedCard?.keywords;
              const originalKeywords = cardData?.keywords;
              
              // Build display keywords with multiple fallbacks to ensure we always have keywords
              let displayKeywords: string[] = [];
              
              if (localizedKeywords && Array.isArray(localizedKeywords) && localizedKeywords.length > 0) {
                displayKeywords = localizedKeywords.slice(0, 3);
              } else if (originalKeywords && Array.isArray(originalKeywords) && originalKeywords.length > 0) {
                displayKeywords = originalKeywords.slice(0, 3);
              } else {
                // Final fallback - don't break rendering
                displayKeywords = [];
              }

              return (
                <Animated.View
                  key={idx}
                  style={[
                    styles.cardItem,
                    cards.length === 3 && styles.cardItemThree,
                    cards.length === 2 && styles.cardItemTwo,
                    {
                      opacity: cardAnimationsRef.current[idx] || 1,
                      transform: [{
                        translateY: cardAnimationsRef.current[idx]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }) || 0,
                      }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      handleCardPress(drawnCard.cardCode, drawnCard.reversed);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.cardImageContainer,
                      drawnCard.reversed && styles.cardReversed,
                    ]}>
                      <Image
                        source={getCardImage(cardData.code)}
                        style={styles.cardImage}
                        resizeMode="contain"
                        onError={(e) => console.error('❌ Image error for:', cardData.code, e)}
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {drawnCard.position && (
                    <ThemedText variant="caption" style={styles.cardPosition}>
                      {drawnCard.position}
                    </ThemedText>
                  )}
                  
                  <ThemedText variant="body" style={styles.cardName}>
                    {localizedCard.title}{drawnCard.reversed ? (locale === 'zh-TW' ? ' (逆位)' : ' (Reversed)') : ''}
                  </ThemedText>
                  
                  {/* CRITICAL: Keywords must display for both upright and reversed cards */}
                  {/* Keywords are the same regardless of orientation - they represent the card's core concepts */}
                  {displayKeywords && displayKeywords.length > 0 ? (
                    <View style={styles.keywordsContainer}>
                      {(() => {
                        // Filter out invalid keywords once
                        const validKeywords = displayKeywords.filter((kw) => kw && typeof kw === 'string' && kw.trim().length > 0);
                        
                        return validKeywords.map((kw, i) => {
                          const isLast = i === validKeywords.length - 1;
                          return (
                            <React.Fragment key={`${cardData.code}-kw-${i}`}>
                              <ThemedText variant="caption" style={styles.keyword}>
                                {kw.trim()}
                              </ThemedText>
                              {!isLast && (
                                <ThemedText variant="caption" style={styles.keywordSeparator}>
                                  {' • '}
                                </ThemedText>
                              )}
                            </React.Fragment>
                          );
                        });
                      })()}
                    </View>
                  ) : null}
                </Animated.View>
              );
            })}
          </View>

          {/* Interpretation Styles */}
          <ThemedCard variant="elevated" style={styles.interpretationCard}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {locale === 'zh-TW' ? '解讀方式' : 'Interpretation Style'}
            </ThemedText>
            
            <View style={styles.stylesContainer}>
              {availableStyles.map(style => {
                const hasAccess = canAccessStyle(style);
                const isSelected = selectedStyle === style.key;
                
                return (
                  <TouchableOpacity
                    key={style.key}
                    style={[
                      styles.styleButton,
                      isSelected && styles.styleButtonActive,
                      !hasAccess && styles.styleButtonLocked,
                    ]}
                    onPress={() => handleStyleChange(style.key)}
                    disabled={!hasAccess}
                  >
                    <ThemedText
                      variant="body"
                      style={[
                        styles.styleButtonText,
                        ...(isSelected ? [styles.styleButtonTextActive] : []),
                        ...(!hasAccess ? [styles.styleButtonTextLocked] : []),
                      ]}
                    >
                      {locale === 'zh-TW' ? style.label.zh : style.label.en}
                    </ThemedText>
                    {!hasAccess && (
                      <ThemedText variant="caption" style={styles.lockIcon}>
                        🔒
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Interpretation Text */}
            {generating ? (
              <View style={styles.generatingContainer}>
                <SpinningLogo size={24} />
                <ThemedText variant="body" style={styles.generatingText}>
                  {locale === 'zh-TW' ? '生成解讀中...' : 'Generating interpretation...'}
                </ThemedText>
              </View>
            ) : interpretations[selectedStyle] ? (
              formatInterpretationText(interpretations[selectedStyle])
            ) : null}
          </ThemedCard>

          {/* Follow-up Chat */}
          <ThemedCard variant="elevated" style={styles.chatCard}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {locale === 'zh-TW' ? '後續問題' : 'Follow-up Questions'}
            </ThemedText>

            {!isBetaTester && userTier === 'free' && (
              <ThemedText variant="caption" style={styles.chatLimit}>
                {followUpCount}/3 {locale === 'zh-TW' ? '問題已使用' : 'questions used'}
              </ThemedText>
            )}

            {/* Chat History */}
            {chatHistory.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.chatMessage,
                  msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant,
                ]}
              >
                <ThemedText variant="body" style={styles.chatText}>
                  {msg.content}
                </ThemedText>
              </View>
            ))}

            {chatLoading && (
              <View style={styles.chatMessage}>
                <SpinningLogo size={40} />
              </View>
            )}

            {/* Chat Input */}
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder={locale === 'zh-TW' ? '問一個問題...' : 'Ask a question...'}
                placeholderTextColor={theme.colors.text.tertiary}
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={handleFollowUpQuestion}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                onPress={() => {
                  handleFollowUpQuestion();
                }}
                disabled={!chatInput.trim() || chatLoading}
                style={[
                  styles.chatSendButton,
                  (!chatInput.trim() || chatLoading) && styles.chatSendButtonDisabled,
                ]}
              >
                <ThemedText variant="body" style={styles.chatSendText}>
                  ➤
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedCard>

          {/* Reflection */}
          <ThemedCard variant="default" style={styles.reflectionCard}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {locale === 'zh-TW' ? '反思（選填）' : 'Reflection (Optional)'}
            </ThemedText>
            <TextInput
              style={styles.reflectionInput}
              placeholder={locale === 'zh-TW' ? '記錄你的想法...' : 'Record your thoughts...'}
              placeholderTextColor={theme.colors.text.tertiary}
              value={reflection}
              onChangeText={(text) => {
                setReflection(text);
                // Auto-save reflection as user types (debounced)
                if (readingId) {
                  clearTimeout((global as any).reflectionSaveTimeout);
                  (global as any).reflectionSaveTimeout = setTimeout(() => {
                    updateReadingReflection(text);
                  }, 2000); // Save 2 seconds after user stops typing
                }
              }}
              multiline
              maxLength={1000}
            />
          </ThemedCard>

          {/* Save Reflection Button */}
          <ThemedButton
            title={locale === 'zh-TW' ? '儲存反思' : 'Save Reflection'}
            onPress={handleSaveReading}
            variant="primary"
            style={styles.saveButton}
            disabled={false}
          />

          {/* Success Modal - Auto-dismissing */}
          <Modal
            visible={showSaveModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSaveModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <ThemedText variant="h3" style={styles.modalTitle}>
                  {t('reading.saved')}
                </ThemedText>
              </View>
            </View>
          </Modal>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </MysticalBackground>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
          }}
          card={selectedCard}
          reversed={selectedCard.reversed}
        />
      )}
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.spacing.md,
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.spacing.lg,
    paddingBottom: 100,
  },
  questionCard: {
    marginBottom: theme.spacing.spacing.md,
    padding: theme.spacing.spacing.md,
  },
  questionLabel: {
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.spacing.xs,
  },
  questionText: {
    color: theme.colors.text.primary,
  },
  spreadName: {
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.lg,
    color: theme.colors.primary.gold,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: theme.spacing.spacing.md,
    marginBottom: theme.spacing.spacing.xl,
    paddingHorizontal: theme.spacing.spacing.md,
  },
  cardsContainerTwo: {
    gap: theme.spacing.spacing.lg,
  },
  cardsContainerThree: {
    gap: theme.spacing.spacing.sm,
    paddingHorizontal: theme.spacing.spacing.sm,
  },
  cardItem: {
    width: 150,
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.md,
    minHeight: 350,
  },
  cardItemTwo: {
    width: 150, // Keep same size for 2 cards
  },
  cardItemThree: {
    width: 120, // Smaller width for 3 cards to fit better
    minHeight: 320, // Slightly smaller height too
  },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 0.6,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 0,
    overflow: 'hidden',
    marginBottom: theme.spacing.spacing.sm,
    backgroundColor: theme.colors.neutrals.black,
  },
  cardReversed: {
    transform: [{ rotate: '180deg' }],
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPosition: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.spacing.xs,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.xs,
  },
  cardName: {
    color: theme.colors.primary.gold,
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  reversedLabel: {
    color: theme.colors.semantic.error,
    marginBottom: theme.spacing.spacing.xs,
    fontSize: theme.typography.fontSize.xs,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.sm,
    paddingHorizontal: theme.spacing.spacing.xs,
    maxWidth: '100%',
    minHeight: 16, // Ensure consistent height even when wrapping
  },
  keyword: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
    flexShrink: 0, // Prevent keywords from shrinking
  },
  keywordSeparator: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
    opacity: 0.5,
    flexShrink: 0, // Prevent separators from shrinking
  },
  interpretationCard: {
    marginBottom: theme.spacing.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.primary.goldLight,
    marginBottom: theme.spacing.spacing.md,
  },
  stylesContainer: {
    flexDirection: 'row',
    gap: theme.spacing.spacing.sm,
    marginBottom: theme.spacing.spacing.lg,
  },
  styleButton: {
    flex: 1,
    paddingVertical: theme.spacing.spacing.sm,
    paddingHorizontal: theme.spacing.spacing.xs,
    borderRadius: theme.spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutrals.midGray,
    alignItems: 'center',
  },
  styleButtonActive: {
    backgroundColor: theme.colors.primary.crimson,
    borderColor: theme.colors.primary.gold,
  },
  styleButtonLocked: {
    opacity: 0.5,
  },
  styleButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  styleButtonTextActive: {
    color: theme.colors.primary.gold,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  styleButtonTextLocked: {
    color: theme.colors.text.tertiary,
  },
  lockIcon: {
    marginTop: theme.spacing.spacing.xs,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.spacing.lg,
  },
  generatingText: {
    marginLeft: theme.spacing.spacing.sm,
    color: theme.colors.text.secondary,
  },
  interpretationText: {
    color: theme.colors.text.primary,
    lineHeight: 24,
    fontSize: theme.typography.fontSize.md,
  },
  cardNameInText: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.gold,
  },
  dayReferenceInText: {
    fontStyle: 'italic',
    color: theme.colors.primary.goldLight,
  },
  emphasisText: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  chatCard: {
    marginBottom: theme.spacing.spacing.lg,
  },
  chatLimit: {
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.spacing.md,
  },
  chatMessage: {
    marginBottom: theme.spacing.spacing.md,
    paddingVertical: theme.spacing.spacing.md,
    paddingHorizontal: theme.spacing.spacing.lg,
    borderRadius: theme.spacing.borderRadius.md,
    maxWidth: '85%',
  },
  chatMessageUser: {
    backgroundColor: theme.colors.primary.crimsonDark,  // User messages: crimson
    alignSelf: 'flex-end',
    borderBottomRightRadius: theme.spacing.borderRadius.sm,
  },
  chatMessageAssistant: {
    backgroundColor: theme.colors.neutrals.darkGray,  // AI messages: dark gray
    borderWidth: 1,
    borderColor: theme.colors.primary.goldDark,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: theme.spacing.borderRadius.sm,
  },
  chatText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.spacing.sm,
    marginTop: theme.spacing.spacing.md,
  },
  chatInput: {
    flex: 1,
    backgroundColor: theme.colors.neutrals.black,
    borderWidth: 1,
    borderColor: theme.colors.primary.goldDark,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    maxHeight: 100,
  },
  chatSendButton: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.primary.crimson,
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendButtonDisabled: {
    opacity: 0.5,
  },
  chatSendText: {
    color: theme.colors.primary.gold,
    fontSize: 20,
  },
  reflectionCard: {
    marginBottom: theme.spacing.spacing.lg,
  },
  reflectionInput: {
    backgroundColor: theme.colors.neutrals.black,
    borderWidth: 1,
    borderColor: theme.colors.primary.goldDark,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginBottom: theme.spacing.spacing.lg,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.spacing.xl,
  },
  completedTitle: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.lg,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    marginBottom: theme.spacing.spacing.md,
  },
  bottomSpacer: {
    height: theme.spacing.spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.spacing.xl,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary.gold,
  },
  modalTitle: {
    color: theme.colors.primary.gold,
    textAlign: 'center',
  },
});

