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
import { router, useLocalSearchParams } from 'expo-router';
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
import type { TarotSpread } from '../src/types/spreads';
import type { DrawnCard, ChatMessage, InterpretationStyle } from '../src/types/reading';
import type { LocalTarotCard } from '../src/systems/tarot/data/localCardData';

export default function ReadingScreen() {
  const { type, question, spreadKey, cardCode, reversed } = useLocalSearchParams<{
    type: 'daily' | 'spread';
    question?: string;
    spreadKey?: string;
    cardCode?: string;
    reversed?: string;
  }>();

  console.log('📥 Reading screen params:', { type, cardCode, reversed, spreadKey, question });

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
  const isBetaTester = profile?.is_beta_tester || false;
  
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
        console.log('📍 Daily card - cardCode:', cardCode);
        
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
        
        console.log('✅ Found card:', foundCard.title.en, 'Code:', foundCard.code);
        
        const drawnCards = [{
          cardCode: foundCard.code,  // Use code, not filename
          reversed: reversed === 'true',
        }];
        
        console.log('📍 Setting cards state:', drawnCards);
        setCards(drawnCards);
        
        // Show cards immediately - don't wait for interpretation
        setLoading(false);
        
        // Generate interpretation in background (non-blocking)
        generateInterpretation(drawnCards, 'traditional').catch(err => {
          console.error('Error generating interpretation:', err);
        });
        
        return;
      } else if (type === 'spread' && spreadKey) {
        // Spread reading - load spread and draw cards
        const spreadData = await getSpreadByKey(spreadKey);
        if (!spreadData) {
          Alert.alert(t('common.error'), 'Spread not found');
          router.back();
          return;
        }
        setSpread(spreadData);
        
        // Show card selection for 2 and 3 card spreads
        if (spreadData.card_count === 2 || spreadData.card_count === 3) {
          setShowCardSelection(true);
          setLoading(false);
        } else {
          // Auto-draw for other spreads
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

    console.log('🎴 Cards selected:', selectedCards.map(c => c.title.en));

    // Convert selected cards to DrawnCard format
    const drawnCards: DrawnCard[] = selectedCards.map((card, index) => {
      const position = spread.positions[index];
      const reversed = Math.random() < 0.3; // Random reversal

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
    generateInterpretation(drawnCards, 'traditional', spread).catch(err => {
      console.error('Error generating interpretation:', err);
    });
  };

  const drawCardsForSpread = async (spreadData: TarotSpread) => {
    console.log('🎴 Drawing cards for spread:', spreadData.spread_key);
    
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

      console.log(`  Card ${i + 1}:`, card.title.en, reversed ? '(R)' : '');

      drawnCards.push({
        cardCode: card.code,
        position: locale === 'zh-TW' ? position.label.zh : position.label.en,
        reversed,
      });
    }

    setCards(drawnCards);
    console.log('✅ Cards drawn:', drawnCards.length);
    
    // Show cards immediately - don't wait for interpretation
    setLoading(false);

    // Generate interpretation in background (non-blocking)
    generateInterpretation(drawnCards, 'traditional', spreadData).catch(err => {
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
    spreadData?: TarotSpread
  ) => {
    setGenerating(true);
    try {
      // Use current user tier (may be loading, default to 'free')
      const currentTier = userTier || 'free';
      const currentProfile = userProfile;
      
      console.log('🎯 Generating interpretation...');
      console.log('🎴 Cards:', cardsToInterpret.length);
      console.log('👤 User tier:', currentTier);

      // Build concise card descriptions (optimized for speed)
      const cardsDetailed = cardsToInterpret.map((c, idx) => {
        const card = LOCAL_RWS_CARDS.find(lc => lc.code === c.cardCode);
        if (!card) return '';
        
        const localCard = getLocalizedCard(card);
        const position = c.position ? `[${c.position}] ` : '';
        const orientation = c.reversed ? 'R' : 'U';
        const keywords = localCard.keywords.slice(0, 3).join(', '); // Reduced from 5 to 3
        
        return `${position}${localCard.title} (${orientation}): ${keywords}`;
      }).join('\n');

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

      console.log('⭐ Birth context:', birthContextDetailed ? 'Yes' : 'No');

      // Build concise system prompt (optimized for speed)
      let systemPrompt = '';
      const astroInstruction = birthContextDetailed 
        ? (locale === 'zh-TW' 
            ? ' 當提供占星背景時，自然地融入太陽、月亮和上升星座的影響（如適用）。'
            : ' When astrological context is provided, naturally incorporate Sun, Moon, and Rising sign influences (where applicable).')
        : '';
      
      if (style === 'traditional') {
        systemPrompt = locale === 'zh-TW' 
          ? `專業塔羅解讀：3段落（概述、指導、行動），250-300字，具體不籠統。${astroInstruction}`
          : `Expert tarot reader. 3 paragraphs: overview, guidance, actions. 250-300 words. Be specific.${astroInstruction}`;
      } else if (style === 'esoteric') {
        systemPrompt = locale === 'zh-TW'
          ? `神秘學專家。揭示象徵意義，簡潔。${astroInstruction}`
          : `Esoteric expert. Reveal symbolic meanings concisely.${astroInstruction}`;
      } else {
        systemPrompt = locale === 'zh-TW'
          ? `榮格心理學家。原型解讀，簡潔。${astroInstruction}`
          : `Jungian analyst. Archetypal interpretation, concise.${astroInstruction}`;
      }

      // Fetch last 10 readings context for daily cards
      let readingsContext = '';
      if (!spreadData) {
        readingsContext = await fetchLast10Readings();
        console.log('📚 Last 10 readings context:', readingsContext ? `${readingsContext.length} chars` : 'None');
      }

      // Concise prompts (optimized for speed)
      let prompt = '';
      const astroGuidance = birthContextDetailed 
        ? (locale === 'zh-TW'
            ? ' 自然地將占星背景融入解讀中，特別是當卡牌與太陽、月亮或上升星座的能量產生共鳴時。'
            : ' Naturally weave astrological context into the interpretation, especially when cards resonate with Sun, Moon, or Rising sign energies.')
        : '';
      
      if (spreadData) {
        // SPREAD READING - simplified prompt
        prompt = `Q: "${question || 'Guidance'}"

Cards:
${cardsDetailed}

${birthContextDetailed ? `Astrological Context: ${birthContextDetailed}\n` : ''}${astroGuidance}
Write 3 paragraphs: overview, guidance, actions. 250-300 words.`;
      } else {
        // DAILY CARD - simplified prompt with reading history context
        prompt = `Daily Card:
${cardsDetailed}

${birthContextDetailed ? `Astrological Context: ${birthContextDetailed}\n` : ''}${astroGuidance}${readingsContext ? `Recent Reading History (for context and continuity):
${readingsContext}

` : ''}Write 2 paragraphs: today's energy, practical guidance. When referencing past readings, use the day of the week or the themes/context mentioned (e.g., "last Tuesday's reading about relationships" or "the reading where you asked about career changes"), NOT reading numbers. Connect today's card to patterns from recent readings if relevant. 180-220 words.`;
      }

      console.log('📝 Prompt length:', prompt.length, 'chars');

      const result = await AIProvider.generate({
        prompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1200, // Increased to allow for Gemini 2.5 thinking tokens + output
      });

      // Validate response isn't truncated
      const wordCount = result.text.split(/\s+/).length;
      console.log(`📊 Generated ${wordCount} words`);

      if (wordCount < 150 && !result.text.includes('.')) {
        console.warn('⚠️ Response appears truncated, retrying with shorter prompt...');
        // Retry logic here if needed
      }

      console.log('✅ Generated interpretation');
      console.log('📊 Tokens used:', result.tokensUsed);
      console.log('📝 Output length:', result.text.length, 'chars');
      console.log('💬 Word count:', result.text.split(/\s+/).length);

      setInterpretations(prev => {
        const updated = {
          ...prev,
          [style]: result.text,
        };
        
        // Update saved reading with new interpretation style if already saved
        if (readingId) {
          updateReadingInterpretations(updated);
        }
        
        return updated;
      });

      // Auto-save reading after first interpretation is generated - pass cards directly
      if (!autoSaved && !readingId) {
        await autoSaveReading(cardsToInterpret);
      }

    } catch (error) {
      console.error('Error generating interpretation:', error);
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
    console.log('📍 Follow-up question:', chatInput);
    
    if (!chatInput.trim()) {
      console.log('❌ Empty input');
      return;
    }

    // Check follow-up limit for free users (bypass for beta testers)
    if (!isBetaTester && userTier === 'free' && followUpCount >= 3) {
      console.log('❌ Hit free tier limit');
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

    console.log('✅ Adding user message to chat');
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
      console.log('📚 Previous readings context for Q&A:', readingsContext ? `${readingsContext.length} chars` : 'None');

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

      console.log('🤖 Calling AI for follow-up...');
      
      const result = await AIProvider.generate({
        prompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 800,
      });

      console.log('✅ Got AI response');

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

  // Update reading with new interpretation styles
  const updateReadingInterpretations = async (updatedInterpretations: typeof interpretations) => {
    if (!readingId) return;

    try {
      // Get current reading
      const { data: currentReading } = await supabase
        .from('readings')
        .select('interpretations')
        .eq('id', readingId)
        .single();

      if (!currentReading?.interpretations) return;

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
      if (currentInterpretations._metadata) {
        currentInterpretations._metadata.interpretation_styles = Object.keys(updatedInterpretations).filter(k => k !== '_metadata');
        currentInterpretations._metadata.conversation = chatHistory;
        currentInterpretations._metadata.follow_up_count = chatHistory.filter(m => m.role === 'user').length;
        currentInterpretations._metadata.reflection = reflection || null;
      }

      // Update the reading
      await supabase
        .from('readings')
        .update({ interpretations: currentInterpretations })
        .eq('id', readingId);
        
      console.log('✅ Updated reading with new interpretation styles');
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
  const autoSaveReading = async (cardsToSave?: DrawnCard[]) => {
    if (autoSaved || readingId) return; // Don't auto-save if already saved or if updating

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use provided cards or fall back to state (for backwards compatibility)
      const cardsToUse = cardsToSave || cards;
      
      if (!cardsToUse || cardsToUse.length === 0) {
        console.error('❌ No cards to save!', { cardsToSave, cardsState: cards });
        return;
      }

      console.log('💾 Auto-saving reading with cards:', cardsToUse.length);

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
          return;
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

        console.log('💾 Saving card element:', {
          elementId: elementData.elementId,
          cardCode: elementData.metadata.cardCode,
          cardTitle: elementData.metadata.cardTitle,
          reversed: elementData.metadata.reversed,
          suit: elementData.metadata.suit,
          arcana: elementData.metadata.arcana,
        });

        return elementData;
      }).filter(Boolean);

      console.log('💾 Total elements to save:', elementsDrawn.length);
      if (elementsDrawn.length === 0) {
        console.error('❌ ERROR: No elements drawn! Cards array was empty or invalid.');
        return;
      }

      // Format interpretations
      const formattedInterpretations: Record<string, any> = {};
      Object.keys(interpretations).forEach(key => {
        if (interpretations[key as keyof typeof interpretations]) {
          formattedInterpretations[key] = {
            content: interpretations[key as keyof typeof interpretations] || '',
          };
        }
      });

      formattedInterpretations._metadata = {
        reading_type: type === 'daily' ? 'daily_card' : 'spread',
        interpretation_styles: Object.keys(interpretations),
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

      const questionText = question || (type === 'daily' 
        ? (locale === 'zh-TW' ? '每日卡牌' : 'Daily guidance')
        : null);
      const questionHash = generateQuestionHash(questionText);

      const readingData: Record<string, any> = {
        user_id: user.id,
        divination_system_id: divinationSystemId,
        reading_type: type === 'daily' ? 'daily_card' : 'spread',
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
        console.error('❌ Auto-save error:', error);
        return; // Don't show error for auto-save
      }

      console.log('✅ Reading auto-saved! ID:', data.id);
      setReadingId(data.id);
      setAutoSaved(true);
    } catch (error) {
      console.error('❌ Error auto-saving reading:', error);
      // Silent fail for auto-save
    }
  };

  // Save reflection (update existing reading with ALL data)
  const handleSaveReading = async () => {
    if (!readingId) {
      // If no reading ID, do a full save (shouldn't happen, but fallback)
      await autoSaveReading();
      if (readingId) {
        // Retry after auto-save
        await handleSaveReading();
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

      // Update the interpretations field (which contains ALL data)
      const { error } = await supabase
        .from('readings')
        .update({ interpretations: formattedInterpretations })
        .eq('id', readingId);

      if (error) {
        console.error('❌ Error updating reading:', error);
        Alert.alert(t('common.error'), 'Failed to save reflection');
        return;
      }

      console.log('✅ Reading updated with all data (reflection, chat, interpretations)!');
      console.log('💾 Reflection saved:', reflection ? `${reflection.length} chars` : 'empty');
      console.log('💾 Metadata reflection:', formattedInterpretations._metadata.reflection ? `${formattedInterpretations._metadata.reflection.length} chars` : 'null');
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
    console.log('📍 handleCardPress called');
    console.log('📍 cardCode:', cardCode);
    console.log('📍 reversed:', reversed);
    console.log('📍 LOCAL_RWS_CARDS length:', LOCAL_RWS_CARDS.length);
    
    const card = LOCAL_RWS_CARDS.find(c => c.code === cardCode);
    
    if (card) {
      console.log('✅ Card found:', card.title.en);
      setSelectedCard({ ...card, reversed });
      setModalVisible(true);
    } else {
      console.error('❌ Card NOT found for code:', cardCode);
      console.log('📍 Available codes:', LOCAL_RWS_CARDS.slice(0, 5).map(c => c.code));
    }
  };

  // Format interpretation text with bold/italic for card names, days, and main points
  const formatInterpretationText = (text: string): React.ReactNode => {
    if (!text) return null;

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
    
    while ((match = combinedRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), type: 'normal' });
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
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), type: 'normal' });
    }

    // If no matches, return plain text
    if (parts.length === 1 && parts[0].type === 'normal') {
      return <Text style={styles.interpretationText}>{text}</Text>;
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

  return (
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
          <View style={styles.cardsContainer}>
            {cards.map((drawnCard, idx) => {
              console.log('🎴 Rendering card:', drawnCard.cardCode);
              
              const cardData = LOCAL_RWS_CARDS.find(c => c.code === drawnCard.cardCode);
              if (!cardData) {
                console.error('❌ Card data not found:', drawnCard.cardCode);
                return null;
              }

              console.log('✅ Card data found:', cardData.title.en, 'Loading image for code:', cardData.code);

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
                // Final fallback - log error but don't break rendering
                console.error(`❌ No keywords found for card ${cardData.code} (reversed: ${drawnCard.reversed})`, {
                  localizedKeywords,
                  originalKeywords,
                  localizedCardExists: !!localizedCard,
                  cardDataExists: !!cardData
                });
                displayKeywords = [];
              }
              
              console.log(`🔑 Keywords for ${cardData.code} (reversed: ${drawnCard.reversed}):`, {
                original: originalKeywords,
                localized: localizedKeywords,
                display: displayKeywords,
                displayLength: displayKeywords.length,
                locale: locale,
                willDisplay: displayKeywords.length > 0
              });

              return (
                <Animated.View
                  key={idx}
                  style={[
                    styles.cardItem,
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
                      console.log('📍 Card image pressed:', drawnCard.cardCode);
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
                        onLoad={() => console.log('✅ Image loaded for:', cardData.code)}
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
                  ) : (
                    // Debug: Log when keywords are missing - this should not happen for valid cards
                    (() => {
                      console.error(`❌ ERROR: No keywords to display for card ${cardData.code} (reversed: ${drawnCard.reversed})!`, {
                        localizedKeywords: localizedCard?.keywords,
                        originalKeywords: cardData?.keywords,
                        displayKeywords: displayKeywords,
                        displayKeywordsLength: displayKeywords?.length,
                        locale: locale,
                        cardReversed: drawnCard.reversed
                      });
                      return null;
                    })()
                  )}
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
                  console.log('📍 Send pressed, input:', chatInput);
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
            disabled={!reflection.trim()}
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
            console.log('📍 Modal closing');
            setModalVisible(false);
          }}
          card={selectedCard}
          reversed={selectedCard.reversed}
        />
      )}
    </KeyboardAvoidingView>
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
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.spacing.md,
    marginBottom: theme.spacing.spacing.xl,
  },
  cardItem: {
    width: 150,
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.md,
    minHeight: 350, // Ensure consistent card height to prevent overlap
  },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 0.6,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary.gold,
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

