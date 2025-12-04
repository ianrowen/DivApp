// app/reading.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/core/api/supabase';
import theme from '../src/theme';
import MysticalBackground from '../src/shared/components/ui/MysticalBackground';
import ThemedText from '../src/shared/components/ui/ThemedText';
import ThemedButton from '../src/shared/components/ui/ThemedButton';
import ThemedCard from '../src/shared/components/ui/ThemedCard';
import CardDetailModal from '../src/shared/components/CardDetailModal';
import { useTranslation } from '../src/i18n';
import { LOCAL_RWS_CARDS } from '../src/systems/tarot/data/localCardData';
import { getLocalizedCard } from '../src/systems/tarot/utils/cardHelpers';
import { getCardImage } from '../src/systems/tarot/utils/cardImageLoader';
import { getSpreadByKey } from '../src/services/spreadService';
import AIProvider from '../src/core/api/aiProvider';
import type { TarotSpread } from '../src/types/spreads';
import type { DrawnCard, ChatMessage, InterpretationStyle } from '../src/types/reading';

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
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [spread, setSpread] = useState<TarotSpread | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'adept' | 'apex'>('free');
  const [userProfile, setUserProfile] = useState<any>(null);
  
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

  // Modal
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    initializeReading();
  }, []);

  const initializeReading = async () => {
    try {
      // Load user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(t('common.error'), 'Please sign in');
        router.back();
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setUserProfile(profile);
      setUserTier(profile?.subscription_tier || 'free');

      if (type === 'daily') {
        console.log('📍 Daily card type detected');
        console.log('📍 cardCode param:', cardCode);
        console.log('📍 reversed param:', reversed);
        
        if (!cardCode) {
          console.error('❌ No cardCode provided for daily card!');
          Alert.alert('Error', 'Card code missing');
          router.back();
          return;
        }
        
        // Find the card data
        const foundCard = LOCAL_RWS_CARDS.find(c => c.code === cardCode);
        console.log('📍 Found card:', foundCard ? foundCard.title.en : 'NOT FOUND');
        
        if (!foundCard) {
          console.error('❌ Card not found:', cardCode);
          Alert.alert(t('common.error'), 'Card not found');
          router.back();
          return;
        }
        
        // Set the card that was already drawn
        const cardToSet = {
          cardCode: foundCard.code,
          reversed: reversed === 'true',
        };
        console.log('📍 Card being set:', cardToSet);
        setCards([cardToSet]);
        
        // Generate interpretation
        await generateInterpretation(
          [{
            cardCode: foundCard.code,
            reversed: reversed === 'true',
          }],
          'traditional'
        );
        
        setLoading(false);
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
        await drawCardsForSpread(spreadData);
      }
    } catch (error) {
      console.error('Error initializing reading:', error);
      Alert.alert(t('common.error'), 'Failed to initialize reading');
    } finally {
      setLoading(false);
    }
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

    // Generate interpretation
    await generateInterpretation(drawnCards, 'traditional', spreadData);
  };

  const generateInterpretation = async (
    cardsToInterpret: DrawnCard[],
    style: 'traditional' | 'esoteric' | 'jungian',
    spreadData?: TarotSpread
  ) => {
    setGenerating(true);
    try {
      console.log('🎯 Generating interpretation...');
      console.log('🎴 Cards:', cardsToInterpret.length);
      console.log('👤 User tier:', userTier);

      // Build detailed card descriptions
      const cardsDetailed = cardsToInterpret.map((c, idx) => {
        const card = LOCAL_RWS_CARDS.find(lc => lc.code === c.cardCode);
        if (!card) return '';
        
        const localCard = getLocalizedCard(card);
        const position = c.position ? `Position: ${c.position}\n` : '';
        const orientation = c.reversed ? 'Reversed' : 'Upright';
        const keywords = localCard.keywords.slice(0, 5).join(', ');
        
        return `Card ${idx + 1}: ${localCard.title} (${orientation})
${position}Keywords: ${keywords}
Element: ${localCard.element || 'N/A'}
Astrology: ${localCard.astro || 'N/A'}`;
      }).join('\n\n');

      // Build birth context with detail
      let birthContextDetailed = '';
      if (userTier === 'free' && userProfile?.sun_sign) {
        birthContextDetailed = `Querent's Sun Sign: ${userProfile.sun_sign}`;
      } else if (userTier === 'adept' && userProfile?.sun_sign) {
        birthContextDetailed = `Querent's Birth Chart:
- Sun: ${userProfile.sun_sign || 'Unknown'}
- Moon: ${userProfile.moon_sign || 'Unknown'}  
- Rising: ${userProfile.rising_sign || 'Unknown'}`;
      } else if (userTier === 'apex' && userProfile?.chart_data) {
        // Extract key planets from chart_data
        const chartSummary = userProfile.chart_data;
        birthContextDetailed = `Querent's Natal Chart: ${JSON.stringify(chartSummary).substring(0, 200)}`;
      }

      console.log('⭐ Birth context:', birthContextDetailed ? 'Yes' : 'No');

      // Build system prompt with few-shot examples
      let systemPrompt = '';
      if (style === 'traditional') {
        systemPrompt = locale === 'zh-TW' 
          ? `你是專業塔羅牌解讀師。寫3段落解讀：概述、具體指導、行動建議。每段2-3句。總共250-300字。要具體，不要籠統。

範例長度：
"這些牌顯示你正處於轉變期。過去的挑戰（寶劍五）正在消退，現在（聖杯騎士）帶來新的情感機會。

針對你的問題，牌面建議先療癒過去的傷痛，才能迎接新關係。你的巨蟹座月亮需要情感安全感。

具體行動：本週花時間反思過去的教訓，寫下你從中學到的智慧。當新機會來臨時，你會準備好接受。"`
          : `You are an expert tarot reader. Write a 3-paragraph interpretation: overview, specific guidance, action steps. 2-3 sentences each. 250-300 words total. Be specific, not generic.

Example length:
"These cards reveal you're at a turning point. Past challenges (Five of Swords) are fading while the present (Knight of Cups) brings new emotional opportunities.

For your question about relationships, the cards advise healing past wounds before embracing new connections. Your Cancer Moon needs emotional security first.

Action steps: This week, journal about past lessons and what you learned. When new opportunities arise, you'll be ready to receive them with wisdom."`;
      } else if (style === 'esoteric') {
        systemPrompt = locale === 'zh-TW'
          ? '你是神秘學專家。揭示象徵意義，保持簡潔。'
          : 'You are an esoteric expert. Reveal symbolic meanings concisely.';
      } else {
        systemPrompt = locale === 'zh-TW'
          ? '你是榮格心理學家。以原型心理學解讀，保持簡潔。'
          : 'You are a Jungian analyst. Interpret through archetypes concisely.';
      }

      // Different prompts for spread vs daily
      let prompt = '';
      if (spreadData) {
        // SPREAD READING
        prompt = `TAROT READING

Spread: ${locale === 'zh-TW' ? spreadData.name.zh : spreadData.name.en}
Question: "${question || 'General life guidance'}"

${cardsDetailed}

${birthContextDetailed ? `\nQUERENT CONTEXT:\n${birthContextDetailed}\n` : ''}

INSTRUCTIONS:
Write a cohesive 3-paragraph interpretation (250-300 words total):

Paragraph 1 (Overview): Synthesize the overall message from all cards together. What story do they tell as a whole?

Paragraph 2 (Specific Guidance): Address the querent's question directly. How do the cards answer it? ${birthContextDetailed ? 'Connect to their astrological placements.' : ''}

Paragraph 3 (Action Steps): Give concrete, actionable advice. What should they do next?

Write in a warm, insightful tone. Be specific, not generic. Reference actual card meanings and positions.`;
      } else {
        // DAILY CARD
        prompt = `DAILY TAROT CARD

${cardsDetailed}

${birthContextDetailed ? `QUERENT CONTEXT:\n${birthContextDetailed}\n` : ''}

INSTRUCTIONS:
Write a focused 2-paragraph daily guidance (180-220 words total):

Paragraph 1: What energy does this card bring to today? How does it relate to current life themes?${birthContextDetailed ? ' Connect to their sun sign energy.' : ''}

Paragraph 2: Practical guidance - what specific actions or mindsets will help them work with this energy today?

Be encouraging and specific. Avoid generic platitudes.`;
      }

      console.log('📝 Prompt length:', prompt.length, 'chars');

      const result = await AIProvider.generate({
        prompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1500, // Allows for complete 300-word response + buffer
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

      setInterpretations(prev => ({
        ...prev,
        [style]: result.text,
      }));

    } catch (error) {
      console.error('Error generating interpretation:', error);
      Alert.alert(t('common.error'), 'Failed to generate interpretation');
    } finally {
      setGenerating(false);
    }
  };

  const handleStyleChange = async (style: 'traditional' | 'esoteric' | 'jungian') => {
    // Check tier access
    if ((style === 'esoteric' || style === 'jungian') && userTier === 'free') {
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

    // Check follow-up limit for free users
    if (userTier === 'free' && followUpCount >= 3) {
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
      // Build simplified context
      const cardsContext = cards.map(c => {
        const card = LOCAL_RWS_CARDS.find(lc => lc.code === c.cardCode);
        if (!card) return '';
        const name = locale === 'zh-TW' ? card.title.zh : card.title.en;
        return `${name}${c.reversed ? ' (R)' : ''}`;
      }).join(', ');

      const prompt = `Reading: ${cardsContext}
Original question: ${question || 'General guidance'}

User asks: ${userMessage.content}

Answer briefly (100 words).`;

      const systemPrompt = locale === 'zh-TW'
        ? '你是塔羅解讀師。簡潔回答問題。'
        : 'You are a tarot reader. Answer questions concisely.';

      console.log('🤖 Calling AI for follow-up...');
      
      const result = await AIProvider.generate({
        prompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 400, // Reduced from 600
      });

      console.log('✅ Got AI response');

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.text,
        timestamp: new Date().toISOString(),
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      
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

  const handleSaveReading = async () => {
    if (saved) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Build elements_drawn
      const elementsDrawn = cards.map(c => {
        const card = LOCAL_RWS_CARDS.find(lc => lc.code === c.cardCode);
        if (!card) {
          console.error('❌ Card not found for saving:', c.cardCode);
          return null;
        }

        console.log('💾 Saving card:', card.title.en);

        return {
          elementId: card.code, // Use code, not filename
          position: c.position || 'Guidance',
          metadata: {
            cardTitle: card.title.en,
            cardCode: card.code,
            positionLabel: c.position || 'Guidance',
            reversed: c.reversed,
            suit: card.suit || null,
            arcana: card.arcana,
          },
        };
      }).filter(Boolean);

      console.log('💾 Elements to save:', elementsDrawn.length);

      const { data, error } = await supabase
        .from('readings')
        .insert({
          user_id: user.id,
          divination_system_id: '00000000-0000-0000-0000-000000000001',
          reading_type: type === 'daily' ? 'daily_card' : 'spread',
          question: question || (type === 'daily' ? 'Daily guidance' : null),
          elements_drawn: elementsDrawn,
          interpretations: interpretations,
          conversation: chatHistory,
          reflection: reflection || null,
          language: locale === 'zh-TW' ? 'zh-TW' : 'en',
          tier_at_creation: userTier,
          features_used: {
            interpretation_styles: Object.keys(interpretations),
            follow_up_count: followUpCount,
            astro_depth: userTier === 'free' ? 'sun_sign' : userTier === 'adept' ? 'big_three' : 'full_chart',
          },
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Save error:', error);
        throw error;
      }

      console.log('✅ Reading saved with ID:', data.id);
      setReadingId(data.id);
      setSaved(true);
      Alert.alert(t('common.success'), t('reading.saved'));

    } catch (error) {
      console.error('Error saving reading:', error);
      Alert.alert(t('common.error'), 'Failed to save reading');
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
    const tierOrder = { free: 0, adept: 1, apex: 2 };
    return tierOrder[userTier] >= tierOrder[style.requiredTier];
  };

  if (loading) {
    return (
      <MysticalBackground variant="default">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.gold} />
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
              const cardData = LOCAL_RWS_CARDS.find(c => c.code === drawnCard.cardCode);
              if (!cardData) {
                console.error('❌ Card data not found for:', drawnCard.cardCode);
                return null;
              }

              const localizedCard = getLocalizedCard(cardData);

              return (
                <View key={idx} style={styles.cardItem}>
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
                        source={getCardImage(drawnCard.cardCode)}
                        style={styles.cardImage}
                        resizeMode="contain"
                        onError={(e) => {
                          console.error('❌ Image load error:', drawnCard.cardCode, e.nativeEvent?.error);
                        }}
                        onLoad={() => {
                          console.log('✅ Image loaded:', drawnCard.cardCode);
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {drawnCard.position && (
                    <ThemedText variant="caption" style={styles.cardPosition}>
                      {drawnCard.position}
                    </ThemedText>
                  )}
                  
                  <ThemedText variant="body" style={styles.cardName}>
                    {localizedCard.title}
                  </ThemedText>
                  
                  {drawnCard.reversed && (
                    <ThemedText variant="caption" style={styles.reversedLabel}>
                      {locale === 'zh-TW' ? '逆位' : 'Reversed'}
                    </ThemedText>
                  )}
                  
                  <View style={styles.keywordsContainer}>
                    {localizedCard.keywords.slice(0, 3).map((kw, i) => (
                      <ThemedText key={i} variant="caption" style={styles.keyword}>
                        {kw}
                      </ThemedText>
                    ))}
                  </View>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('📍 More button pressed:', drawnCard.cardCode);
                      handleCardPress(drawnCard.cardCode, drawnCard.reversed);
                    }}
                    style={styles.moreButton}
                  >
                    <ThemedText variant="caption" style={styles.moreText}>
                      {locale === 'zh-TW' ? '更多' : 'More'} →
                    </ThemedText>
                  </TouchableOpacity>
                </View>
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
                        isSelected && styles.styleButtonTextActive,
                        !hasAccess && styles.styleButtonTextLocked,
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
                <ActivityIndicator size="small" color={theme.colors.primary.gold} />
                <ThemedText variant="body" style={styles.generatingText}>
                  {locale === 'zh-TW' ? '生成解讀中...' : 'Generating interpretation...'}
                </ThemedText>
              </View>
            ) : interpretations[selectedStyle] ? (
              <ThemedText variant="body" style={styles.interpretationText}>
                {interpretations[selectedStyle]}
              </ThemedText>
            ) : null}
          </ThemedCard>

          {/* Follow-up Chat */}
          <ThemedCard variant="elevated" style={styles.chatCard}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {locale === 'zh-TW' ? '後續問題' : 'Follow-up Questions'}
            </ThemedText>

            {userTier === 'free' && (
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
                <ThemedText
                  variant="caption"
                  style={msg.role === 'user' ? styles.chatLabelUser : styles.chatLabelAssistant}
                >
                  {msg.role === 'user' 
                    ? (locale === 'zh-TW' ? '你' : 'You')
                    : (locale === 'zh-TW' ? 'Divin8' : 'Divin8')
                  }
                </ThemedText>
                <ThemedText variant="body" style={styles.chatText}>
                  {msg.content}
                </ThemedText>
              </View>
            ))}

            {chatLoading && (
              <View style={styles.chatMessage}>
                <ActivityIndicator size="small" color={theme.colors.primary.gold} />
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
              onChangeText={setReflection}
              multiline
              maxLength={1000}
            />
          </ThemedCard>

          {/* Save Button */}
          {!saved ? (
            <ThemedButton
              title={locale === 'zh-TW' ? '儲存解讀' : 'Save Reading'}
              onPress={handleSaveReading}
              variant="primary"
              style={styles.saveButton}
            />
          ) : (
            <View style={styles.completedContainer}>
              <ThemedText variant="h3" style={styles.completedTitle}>
                {locale === 'zh-TW' ? '解讀已儲存' : 'Reading Saved'}
              </ThemedText>
              
              <ThemedButton
                title={locale === 'zh-TW' ? '新解讀' : 'New Reading'}
                onPress={() => router.push('/(tabs)/home')}
                variant="primary"
                style={styles.actionButton}
              />
              
              <ThemedButton
                title={locale === 'zh-TW' ? '查看歷史' : 'View History'}
                onPress={() => router.push('/(tabs)/history')}
                variant="secondary"
                style={styles.actionButton}
              />
            </View>
          )}

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
    gap: theme.spacing.spacing.xs,
    marginBottom: theme.spacing.spacing.sm,
    paddingHorizontal: theme.spacing.spacing.xs,
  },
  keyword: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
  },
  moreButton: {
    paddingVertical: theme.spacing.spacing.xs,
  },
  moreText: {
    color: theme.colors.primary.goldLight,
    textDecorationLine: 'underline',
    fontSize: theme.typography.fontSize.xs,
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
    padding: theme.spacing.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
  },
  chatMessageUser: {
    backgroundColor: theme.colors.neutrals.midGray,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  chatMessageAssistant: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderWidth: 1,
    borderColor: theme.colors.primary.goldDark,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  chatLabelUser: {
    color: theme.colors.primary.goldLight,
    marginBottom: theme.spacing.spacing.xs,
  },
  chatLabelAssistant: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.xs,
  },
  chatText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
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
});

