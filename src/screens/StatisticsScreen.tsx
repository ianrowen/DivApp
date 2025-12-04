import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../core/api/supabase';
import ThemedText from '../shared/components/ui/ThemedText';
import ThemedButton from '../shared/components/ui/ThemedButton';
import MysticalBackground from '../shared/components/ui/MysticalBackground';
import SpinningLogo from '../shared/components/ui/SpinningLogo';
import theme from '../theme';
import { LOCAL_RWS_CARDS } from '../systems/tarot/data/localCardData';
import { useTranslation } from '../i18n';

interface CardStats {
  // Distribution stats
  majorArcana: number;
  courtCards: number;
  minorArcana: number;
  
  // Suit stats
  wands: number;
  cups: number;
  swords: number;
  pentacles: number;
  
  // Reversal stats
  reversed: number;
  upright: number;
  
  // Card frequency
  cardCounts: Map<string, number>;
  
  // Total
  totalCards: number;
}

interface PatternDetection {
  type: 'recurring_theme' | 'anomaly' | 'trend';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  cards?: string[];
}

export default function StatisticsScreen() {
  const { t, locale } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CardStats | null>(null);
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);
  const loadingCompleteRef = useRef(false);

  useEffect(() => {
    loadUser();

    // Failsafe: If still loading after 5 seconds, force stop
    const timeout = setTimeout(() => {
      setLoading((currentLoading) => {
        if (currentLoading && !loadingCompleteRef.current) {
          console.warn('Statistics loading timeout - forcing completion');
          setError((currentError) => {
            if (!currentError && !stats) {
              return 'Loading timeout. Please check your connection and try again.';
            }
            return currentError;
          });
          return false;
        }
        return currentLoading;
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadStatistics();
    } else if (user === null && !loading) {
      // User fetch completed but no user found
      setLoading(false);
    }
  }, [user]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Statistics: Starting to load readings...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Statistics: User fetch error:', userError);
        throw userError;
      }

      if (!user) {
        console.log('Statistics: No user found');
        setUser(null);
        loadingCompleteRef.current = true;
        setLoading(false);
        return;
      }

      console.log('Statistics: User found, fetching readings...');
      setUser(user);
    } catch (err) {
      console.error('Statistics: User load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user');
      loadingCompleteRef.current = true;
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setLoading(false);
        return;
      }

      console.log('Statistics: Fetching readings...');

      // Load all readings
      const { data: readings, error: readingsError } = await supabase
        .from('readings')
        .select('elements_drawn')
        .eq('user_id', user.id);

      if (readingsError) {
        console.error('Statistics: Readings fetch error:', readingsError);
        throw readingsError;
      }

      console.log(`Statistics: Loaded ${readings?.length || 0} readings`);

      // Process statistics
      const processedStats = processReadings(readings || []);
      setStats(processedStats);

      // Detect patterns and anomalies
      const detectedPatterns = detectPatterns(processedStats);
      setPatterns(detectedPatterns);
      loadingCompleteRef.current = true;
    } catch (err) {
      console.error('Statistics: Fatal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
      loadingCompleteRef.current = true;
    } finally {
      console.log('Statistics: Loading complete');
      setLoading(false);
    }
  };

  const processReadings = (readings: any[]): CardStats => {
    const stats: CardStats = {
      majorArcana: 0,
      courtCards: 0,
      minorArcana: 0,
      wands: 0,
      cups: 0,
      swords: 0,
      pentacles: 0,
      reversed: 0,
      upright: 0,
      cardCounts: new Map(),
      totalCards: 0,
    };

    readings.forEach(reading => {
      reading.elements_drawn?.forEach((elem: any) => {
        // Try multiple ways to find the card
        let card = null;
        
        // Method 1: Find by cardCode from metadata (most reliable)
        if (elem.metadata?.cardCode) {
          card = LOCAL_RWS_CARDS.find(c => c.code === elem.metadata.cardCode);
        }
        
        // Method 2: Find by elementId as card code
        if (!card && elem.elementId) {
          card = LOCAL_RWS_CARDS.find(c => c.code === elem.elementId);
        }
        
        // Method 3: Find by cardTitle from metadata
        if (!card && elem.metadata?.cardTitle) {
          card = LOCAL_RWS_CARDS.find(c => c.title.en === elem.metadata.cardTitle || c.title.zh === elem.metadata.cardTitle);
        }
        
        // Method 4: Try filename matching (for old data)
        if (!card && elem.elementId) {
          card = LOCAL_RWS_CARDS.find(c => c.filename === elem.elementId || c.filename === `${elem.elementId}.jpg`);
        }
        
        if (!card) {
          console.warn('Statistics: Card not found for element:', {
            elementId: elem.elementId,
            cardCode: elem.metadata?.cardCode,
            cardTitle: elem.metadata?.cardTitle,
            metadata: elem.metadata,
          });
          return;
        }

        stats.totalCards++;

        // Card type
        if (card.arcana === 'Major') {
          stats.majorArcana++;
        } else if (card.arcana === 'Court') {
          stats.courtCards++;
        } else if (card.arcana === 'Minor') {
          stats.minorArcana++;
        }

        // Suit
        if (card.suit === 'Wands') stats.wands++;
        else if (card.suit === 'Cups') stats.cups++;
        else if (card.suit === 'Swords') stats.swords++;
        else if (card.suit === 'Pentacles') stats.pentacles++;

        // Reversal
        if (elem.metadata?.reversed) {
          stats.reversed++;
        } else {
          stats.upright++;
        }

        // Card frequency - use card code as key for consistency
        const cardName = card.title.en;
        stats.cardCounts.set(cardName, (stats.cardCounts.get(cardName) || 0) + 1);
      });
    });

    return stats;
  };

  const detectPatterns = (stats: CardStats): PatternDetection[] => {
    const patterns: PatternDetection[] = [];
    const isChinese = locale === 'zh-TW';

    if (stats.totalCards === 0) return patterns;

    // Calculate expected probabilities
    const expectedMajor = 22 / 78; // ~28%
    const expectedCourt = 16 / 78; // ~21%
    const expectedMinor = 40 / 78; // ~51%
    const expectedSuit = 14 / 78;  // ~18% per suit
    const expectedReversed = 0.5;  // 50%

    // Actual probabilities
    const actualMajor = stats.majorArcana / stats.totalCards;
    const actualCourt = stats.courtCards / stats.totalCards;
    const actualMinor = stats.minorArcana / stats.totalCards;
    const actualSuit = {
      wands: stats.wands / stats.totalCards,
      cups: stats.cups / stats.totalCards,
      swords: stats.swords / stats.totalCards,
      pentacles: stats.pentacles / stats.totalCards,
    };
    const actualReversed = stats.reversed / stats.totalCards;

    // ANOMALY: Major Arcana significantly higher/lower than expected
    const majorDiff = Math.abs(actualMajor - expectedMajor);
    if (majorDiff > 0.15 && stats.totalCards > 10) {
      patterns.push({
        type: 'anomaly',
        severity: majorDiff > 0.25 ? 'high' : 'medium',
        title: actualMajor > expectedMajor 
          ? (isChinese ? '大阿爾克那出現頻率高' : 'High Major Arcana Presence')
          : (isChinese ? '大阿爾克那出現頻率低' : 'Low Major Arcana Presence'),
        description: actualMajor > expectedMajor
          ? (isChinese 
              ? `您的大阿爾克那出現率為 ${Math.round(actualMajor * 100)}%（預期約 28%）。這表示您正在處理重要的生命主題和重大轉變。宇宙正在強調您旅程中的關鍵時刻。`
              : `You're drawing Major Arcana cards ${Math.round(actualMajor * 100)}% of the time (expected ~28%). This suggests you're dealing with significant life themes and major transformations. The universe is highlighting pivotal moments in your journey.`)
          : (isChinese
              ? `您的大阿爾克那出現率僅為 ${Math.round(actualMajor * 100)}%（預期約 28%）。您目前的焦點在於日常事務和實際關切，而非重大人生轉變。`
              : `You're drawing Major Arcana only ${Math.round(actualMajor * 100)}% of the time (expected ~28%). Your focus is currently on day-to-day matters and practical concerns rather than major life shifts.`),
      });
    }

    // ANOMALY: Court Cards significantly higher/lower
    const courtDiff = Math.abs(actualCourt - expectedCourt);
    if (courtDiff > 0.12 && stats.totalCards > 10) {
      patterns.push({
        type: 'anomaly',
        severity: courtDiff > 0.20 ? 'high' : 'medium',
        title: actualCourt > expectedCourt 
          ? (isChinese ? '宮廷牌出現頻率高' : 'High Court Card Frequency')
          : (isChinese ? '宮廷牌出現頻率低' : 'Low Court Card Frequency'),
        description: actualCourt > expectedCourt
          ? (isChinese
              ? `宮廷牌出現率為 ${Math.round(actualCourt * 100)}%（預期約 21%）。這表示您的占卜強烈聚焦於人物、個性和人際動態。您可能在處理複雜的關係或體現自己的不同面向。`
              : `Court cards appear ${Math.round(actualCourt * 100)}% of the time (expected ~21%). This indicates strong focus on people, personalities, and interpersonal dynamics in your readings. You may be navigating complex relationships or embodying different aspects of yourself.`)
          : (isChinese
              ? `宮廷牌出現率僅為 ${Math.round(actualCourt * 100)}%（預期約 21%）。您的占卜更聚焦於情況和事件，而非人物或個性。`
              : `Court cards appear only ${Math.round(actualCourt * 100)}% of the time (expected ~21%). Your readings are focused more on situations and events than on people or personalities.`),
      });
    }

    // ANOMALY: Suit imbalances
    const suitEntries = Object.entries(actualSuit);
    const maxSuit = suitEntries.reduce((a, b) => a[1] > b[1] ? a : b);
    const minSuit = suitEntries.reduce((a, b) => a[1] < b[1] ? a : b);
    
    if (maxSuit[1] > 0.30 && stats.totalCards > 15) {
      const suitNames = {
        wands: isChinese ? '權杖（火/創造力）' : 'Wands (Fire/Creativity)',
        cups: isChinese ? '聖杯（水/情感）' : 'Cups (Water/Emotions)',
        swords: isChinese ? '寶劍（風/理智）' : 'Swords (Air/Intellect)',
        pentacles: isChinese ? '錢幣（土/物質）' : 'Pentacles (Earth/Material)',
      };
      
      const suitName = suitNames[maxSuit[0] as keyof typeof suitNames];
      const suitDisplayName = isChinese 
        ? suitName.split('（')[0] 
        : suitName.split(' ')[0];
      
      patterns.push({
        type: 'trend',
        severity: maxSuit[1] > 0.40 ? 'high' : 'medium',
        title: isChinese ? `${suitDisplayName}主導` : `${suitDisplayName} Dominance`,
        description: isChinese
          ? `${suitName}出現率為 ${Math.round(maxSuit[1] * 100)}%（預期約 18%）。這個元素正在強烈影響您當前的道路。`
          : `${suitName} appears ${Math.round(maxSuit[1] * 100)}% of the time (expected ~18%). This element is strongly influencing your current path.`,
      });
    }

    // PATTERN: Reversal ratio
    if (stats.totalCards > 10) {
      if (actualReversed > 0.65) {
        patterns.push({
          type: 'trend',
          severity: 'medium',
          title: isChinese ? '逆位比例高' : 'High Reversal Rate',
          description: isChinese
            ? `您的卡牌中有 ${Math.round(actualReversed * 100)}% 為逆位（預期約 50%）。這表示您正在經歷阻礙、內化或對所呈現能量的抗拒。思考您可能在逃避什麼，或需要釋放什麼。`
            : `${Math.round(actualReversed * 100)}% of your cards are reversed (expected ~50%). This suggests you're experiencing blocks, internalization, or resistance to the energies being presented. Consider what you might be avoiding or what needs to be released.`,
        });
      } else if (actualReversed < 0.35) {
        patterns.push({
          type: 'trend',
          severity: 'low',
          title: isChinese ? '逆位比例低' : 'Low Reversal Rate',
          description: isChinese
            ? `您的卡牌中僅有 ${Math.round(actualReversed * 100)}% 為逆位（預期約 50%）。能量流動自然，阻礙極少。您與傳達的訊息保持一致。`
            : `Only ${Math.round(actualReversed * 100)}% of your cards are reversed (expected ~50%). Energy is flowing naturally and obstacles are minimal. You're aligned with the messages coming through.`,
        });
      }
    }

    // PATTERN: Most pulled cards (recurring themes)
    const sortedCards = Array.from(stats.cardCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCard = sortedCards[0];
    if (topCard && topCard[1] >= 3 && stats.totalCards > 10) {
      const frequency = (topCard[1] / stats.totalCards) * 100;
      const expectedFrequency = (1 / 78) * 100; // ~1.3%
      
      if (frequency > expectedFrequency * 3) {
        const cardName = getCardName(topCard[0]);
        patterns.push({
          type: 'recurring_theme',
          severity: 'high',
          title: isChinese ? `重複出現的卡牌：${cardName}` : `Recurring Card: ${cardName}`,
          description: isChinese
            ? `${cardName} 已出現 ${topCard[1]} 次（占 ${frequency.toFixed(1)}%，預期約 1.3%）。這張卡牌的能量是您當前旅程的核心主題。請密切關注其訊息。`
            : `${cardName} has appeared ${topCard[1]} times (${frequency.toFixed(1)}% of readings, expected ~1.3%). This card's energy is a central theme in your journey right now. Pay close attention to its message.`,
          cards: [topCard[0]],
        });
      }
    }

    // INSIGHT: Minor Arcana imbalance
    const minorDiff = Math.abs(actualMinor - expectedMinor);
    if (minorDiff > 0.15 && stats.totalCards > 10) {
      patterns.push({
        type: 'anomaly',
        severity: minorDiff > 0.25 ? 'high' : 'medium',
        title: actualMinor > expectedMinor
          ? (isChinese ? '小阿爾克那出現頻率高' : 'High Minor Arcana Presence')
          : (isChinese ? '小阿爾克那出現頻率低' : 'Low Minor Arcana Presence'),
        description: actualMinor > expectedMinor
          ? (isChinese
              ? `您的小阿爾克那出現率為 ${Math.round(actualMinor * 100)}%（預期約 51%）。您正在專注於日常生活的實際層面和具體情況。`
              : `You're drawing Minor Arcana cards ${Math.round(actualMinor * 100)}% of the time (expected ~51%). You're focused on practical aspects and specific situations in daily life.`)
          : (isChinese
              ? `您的小阿爾克那出現率僅為 ${Math.round(actualMinor * 100)}%（預期約 51%）。您的占卜更傾向於重大主題和深層轉變。`
              : `You're drawing Minor Arcana only ${Math.round(actualMinor * 100)}% of the time (expected ~51%). Your readings lean toward major themes and deep transformations.`),
      });
    }

    // INSIGHT: Elemental balance (suits represent elements)
    const suitVariance = Object.values(actualSuit).reduce((sum, val) => {
      const diff = Math.abs(val - expectedSuit);
      return sum + diff;
    }, 0) / 4;
    
    if (suitVariance > 0.10 && stats.totalCards > 15) {
      const balanced = suitVariance < 0.15;
      patterns.push({
        type: balanced ? 'trend' : 'anomaly',
        severity: suitVariance > 0.20 ? 'high' : 'medium',
        title: balanced
          ? (isChinese ? '元素平衡' : 'Elemental Balance')
          : (isChinese ? '元素不平衡' : 'Elemental Imbalance'),
        description: balanced
          ? (isChinese
              ? `您的牌陣顯示出良好的元素平衡（變異係數 ${(suitVariance * 100).toFixed(1)}%）。所有元素能量都在和諧運作。`
              : `Your readings show good elemental balance (variance ${(suitVariance * 100).toFixed(1)}%). All elemental energies are working in harmony.`)
          : (isChinese
              ? `您的牌陣顯示元素不平衡（變異係數 ${(suitVariance * 100).toFixed(1)}%）。某些元素能量可能被過度強調或忽略。`
              : `Your readings show elemental imbalance (variance ${(suitVariance * 100).toFixed(1)}%). Some elemental energies may be overemphasized or neglected.`),
      });
    }

    // INSIGHT: Multiple recurring cards
    if (sortedCards.length >= 3 && stats.totalCards > 20) {
      const recurringCards = sortedCards.filter(([_, count]) => {
        const freq = (count / stats.totalCards) * 100;
        return freq > (1 / 78) * 100 * 2.5; // 2.5x expected
      });

      if (recurringCards.length >= 3) {
        const cardNames = recurringCards.map(([name]) => getCardName(name)).join(', ');
        patterns.push({
          type: 'recurring_theme',
          severity: 'high',
          title: isChinese ? '多重重複主題' : 'Multiple Recurring Themes',
          description: isChinese
            ? `您有多張卡牌重複出現：${cardNames}。這些能量正在形成一個相互關聯的主題網絡，值得深入探索。`
            : `Multiple cards are recurring: ${cardNames}. These energies are forming an interconnected thematic network worth exploring deeply.`,
          cards: recurringCards.map(([name]) => name),
        });
      }
    }

    return patterns.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const getCardName = (cardEnglishName: string): string => {
    const card = LOCAL_RWS_CARDS.find(c => c.title.en === cardEnglishName);
    if (!card) return cardEnglishName;
    return card.title[locale === 'zh-TW' ? 'zh' : 'en'] || card.title.en;
  };

  // Loading state
  if (loading) {
    return (
      <MysticalBackground variant="subtle">
        <View style={styles.centerContainer}>
          <SpinningLogo size={100} />
          <ThemedText variant="body" style={styles.loadingText}>
            Loading statistics...
          </ThemedText>
        </View>
      </MysticalBackground>
    );
  }

  // Error state
  if (error) {
    return (
      <MysticalBackground variant="subtle">
        <View style={styles.centerContainer}>
          <ThemedText variant="h2" style={styles.errorText}>
            Unable to Load Statistics
          </ThemedText>
          <ThemedText variant="body" style={styles.errorSubtext}>
            {error}
          </ThemedText>
          <ThemedButton
            title="Try Again"
            onPress={() => {
              setError(null);
              loadingCompleteRef.current = false;
              loadUser();
            }}
            variant="primary"
            style={styles.retryButton}
          />
          <ThemedButton
            title="← Back to History"
            onPress={() => router.back()}
            variant="secondary"
            style={styles.backButton}
          />
        </View>
      </MysticalBackground>
    );
  }

  // Empty state
  if (!stats || stats.totalCards === 0) {
    return (
      <MysticalBackground variant="subtle">
        <View style={styles.centerContainer}>
          <ThemedText variant="h2" style={styles.emptyText}>
            {t('statistics.noStats') || 'No Statistics Yet'}
          </ThemedText>
          <ThemedText variant="body" style={styles.emptySubtext}>
            {t('statistics.noStatsSubtext') || 'Complete some readings to see your patterns and insights here.'}
          </ThemedText>
          <ThemedButton
            title="← Back to History"
            onPress={() => router.back()}
            variant="secondary"
            style={styles.backButton}
          />
        </View>
      </MysticalBackground>
    );
  }

  const mostPulled = Array.from(stats.cardCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <MysticalBackground variant="subtle">
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <ThemedText variant="h1" style={styles.title}>
          📊 {t('statistics.title')}
        </ThemedText>
        <ThemedText variant="body" style={styles.subtitle}>
          {t('statistics.basedOn', { count: stats.totalCards }) || `Based on ${stats.totalCards} cards drawn`}
        </ThemedText>

      {/* Enhanced Insights Panels - At Top */}
      {patterns.length > 0 && (
        <View style={styles.insightsSection}>
          <View style={styles.insightsHeader}>
            <ThemedText variant="h1" style={styles.insightsTitle}>
              💡 {locale === 'zh-TW' ? '關鍵洞察' : 'Key Insights'}
            </ThemedText>
            <ThemedText variant="caption" style={styles.insightsSubtitle}>
              {locale === 'zh-TW' 
                ? '統計上顯著或異常的模式' 
                : 'Statistically significant or unexpected patterns'}
            </ThemedText>
          </View>
          
          {/* High Priority Insights */}
          {patterns.filter(p => p.severity === 'high').length > 0 && (
            <View style={styles.priorityGroup}>
              <ThemedText variant="h3" style={styles.priorityLabel}>
                ⚠️ {locale === 'zh-TW' ? '高度顯著' : 'Highly Significant'}
              </ThemedText>
              {patterns
                .filter(p => p.severity === 'high')
                .map((pattern, idx) => (
                  <View
                    key={`high-${idx}`}
                    style={[styles.insightCard, styles.insightCardHigh]}
                  >
                    <View style={styles.insightHeader}>
                      <View style={styles.insightBadge}>
                        <ThemedText variant="caption" style={styles.insightBadgeText}>
                          {pattern.type === 'recurring_theme' 
                            ? (locale === 'zh-TW' ? '重複' : 'RECURRING')
                            : pattern.type === 'anomaly'
                            ? (locale === 'zh-TW' ? '異常' : 'ANOMALY')
                            : (locale === 'zh-TW' ? '趨勢' : 'TREND')}
                        </ThemedText>
                      </View>
                      <View style={styles.insightSeverity}>
                        <ThemedText variant="caption" style={styles.severityText}>
                          🔥 {locale === 'zh-TW' ? '高' : 'HIGH'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText variant="h3" style={styles.insightTitle}>
                      {pattern.title}
                    </ThemedText>
                    <ThemedText variant="body" style={styles.insightDescription}>
                      {pattern.description}
                    </ThemedText>
                  </View>
                ))}
            </View>
          )}

          {/* Medium Priority Insights */}
          {patterns.filter(p => p.severity === 'medium').length > 0 && (
            <View style={styles.priorityGroup}>
              <ThemedText variant="h3" style={styles.priorityLabel}>
                📊 {locale === 'zh-TW' ? '值得注意' : 'Notable Patterns'}
              </ThemedText>
              {patterns
                .filter(p => p.severity === 'medium')
                .map((pattern, idx) => (
                  <View
                    key={`medium-${idx}`}
                    style={[styles.insightCard, styles.insightCardMedium]}
                  >
                    <View style={styles.insightHeader}>
                      <View style={[styles.insightBadge, styles.insightBadgeMedium]}>
                        <ThemedText variant="caption" style={styles.insightBadgeText}>
                          {pattern.type === 'recurring_theme' 
                            ? (locale === 'zh-TW' ? '重複' : 'RECURRING')
                            : pattern.type === 'anomaly'
                            ? (locale === 'zh-TW' ? '異常' : 'ANOMALY')
                            : (locale === 'zh-TW' ? '趨勢' : 'TREND')}
                        </ThemedText>
                      </View>
                      <View style={[styles.insightSeverity, styles.insightSeverityMedium]}>
                        <ThemedText variant="caption" style={styles.severityText}>
                          ⚡ {locale === 'zh-TW' ? '中' : 'MED'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText variant="h3" style={styles.insightTitle}>
                      {pattern.title}
                    </ThemedText>
                    <ThemedText variant="body" style={styles.insightDescription}>
                      {pattern.description}
                    </ThemedText>
                  </View>
                ))}
            </View>
          )}

          {/* Low Priority Insights */}
          {patterns.filter(p => p.severity === 'low').length > 0 && (
            <View style={styles.priorityGroup}>
              <ThemedText variant="h3" style={styles.priorityLabel}>
                💭 {locale === 'zh-TW' ? '觀察' : 'Observations'}
              </ThemedText>
              {patterns
                .filter(p => p.severity === 'low')
                .map((pattern, idx) => (
                  <View
                    key={`low-${idx}`}
                    style={[styles.insightCard, styles.insightCardLow]}
                  >
                    <View style={styles.insightHeader}>
                      <View style={[styles.insightBadge, styles.insightBadgeLow]}>
                        <ThemedText variant="caption" style={styles.insightBadgeText}>
                          {pattern.type === 'recurring_theme' 
                            ? (locale === 'zh-TW' ? '重複' : 'RECURRING')
                            : pattern.type === 'anomaly'
                            ? (locale === 'zh-TW' ? '異常' : 'ANOMALY')
                            : (locale === 'zh-TW' ? '趨勢' : 'TREND')}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText variant="h3" style={styles.insightTitle}>
                      {pattern.title}
                    </ThemedText>
                    <ThemedText variant="body" style={styles.insightDescription}>
                      {pattern.description}
                    </ThemedText>
                  </View>
                ))}
            </View>
          )}
        </View>
      )}

      {/* Card Type Distribution */}
      <View style={styles.section}>
        <ThemedText variant="h2" style={styles.sectionTitle}>
          🎴 {t('statistics.cardTypeDistribution')}
        </ThemedText>
        
        <StatBar
          label={t('statistics.majorArcana')}
          value={stats.majorArcana}
          total={stats.totalCards}
          expected={22/78}
          color={theme.colors.primary.gold}
          t={t}
        />
        <StatBar
          label={t('statistics.courtCards')}
          value={stats.courtCards}
          total={stats.totalCards}
          expected={16/78}
          color={theme.colors.text.secondary}
          t={t}
        />
        <StatBar
          label={t('statistics.minorArcana')}
          value={stats.minorArcana}
          total={stats.totalCards}
          expected={40/78}
          color={theme.colors.neutrals.midGray}
          t={t}
        />
      </View>

      {/* Suit Distribution */}
      <View style={styles.section}>
        <ThemedText variant="h2" style={styles.sectionTitle}>
          🌟 {t('statistics.suitDistribution')}
        </ThemedText>
        
        <StatBar
          label={t('statistics.wands')}
          value={stats.wands}
          total={stats.totalCards}
          expected={14/78}
          color="#ff6b6b"
          t={t}
        />
        <StatBar
          label={t('statistics.cups')}
          value={stats.cups}
          total={stats.totalCards}
          expected={14/78}
          color="#4ecdc4"
          t={t}
        />
        <StatBar
          label={t('statistics.swords')}
          value={stats.swords}
          total={stats.totalCards}
          expected={14/78}
          color="#ffe66d"
          t={t}
        />
        <StatBar
          label={t('statistics.pentacles')}
          value={stats.pentacles}
          total={stats.totalCards}
          expected={14/78}
          color="#95e1d3"
          t={t}
        />
      </View>

      {/* Reversal Stats */}
      <View style={styles.section}>
        <ThemedText variant="h2" style={styles.sectionTitle}>
          🔄 {t('statistics.reversalRatio')}
        </ThemedText>
        
        <StatBar
          label={t('statistics.upright')}
          value={stats.upright}
          total={stats.totalCards}
          expected={0.5}
          color={theme.colors.primary.gold}
          t={t}
        />
        <StatBar
          label={t('statistics.reversed')}
          value={stats.reversed}
          total={stats.totalCards}
          expected={0.5}
          color={theme.colors.text.secondary}
          t={t}
        />
      </View>

      {/* Most Pulled Cards */}
      <View style={styles.section}>
        <ThemedText variant="h2" style={styles.sectionTitle}>
          ⭐ {t('statistics.mostPulled')}
        </ThemedText>
        {mostPulled.map(([cardName, count], idx) => (
          <View key={idx} style={styles.cardRow}>
            <ThemedText variant="body" style={styles.cardRank}>
              {idx + 1}.
            </ThemedText>
            <ThemedText variant="body" style={styles.cardNameText}>
              {getCardName(cardName)}
            </ThemedText>
            <ThemedText variant="body" style={styles.cardCount}>
              {count} {t('statistics.times')} ({((count / stats.totalCards) * 100).toFixed(1)}%)
            </ThemedText>
          </View>
        ))}
      </View>
      </ScrollView>
    </MysticalBackground>
  );
}

// Stat Bar Component
function StatBar({
  label,
  value,
  total,
  expected,
  color,
  t,
}: {
  label: string;
  value: number;
  total: number;
  expected: number;
  color: string;
  t: (key: string, options?: Record<string, any>) => string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const expectedPercentage = expected * 100;
  const difference = percentage - expectedPercentage;
  const isAnomaly = Math.abs(difference) > 10; // 10% difference is notable

  return (
    <View style={styles.statBar}>
      <View style={styles.statLabelRow}>
        <ThemedText variant="body" style={styles.statLabel}>
          {label}
        </ThemedText>
        <ThemedText variant="body" style={styles.statValue}>
          {value} ({percentage.toFixed(1)}%)
        </ThemedText>
      </View>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.min(percentage, 100)}%`, backgroundColor: color },
            isAnomaly && styles.barAnomaly,
          ]}
        />
        {/* Expected marker */}
        <View
          style={[
            styles.expectedMarker,
            { left: `${Math.min(expectedPercentage, 100)}%` },
          ]}
        />
      </View>
      <ThemedText variant="caption" style={styles.statHint}>
        {t('statistics.expected')}: {expectedPercentage.toFixed(1)}%
        {isAnomaly && (
          <ThemedText style={styles.anomalyIndicator}>
            {' '}• {difference > 0 ? '+' : ''}{difference.toFixed(1)}%
          </ThemedText>
        )}
      </ThemedText>
    </View>
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
  content: {
    padding: theme.spacing.spacing.lg,
    paddingTop: theme.spacing.spacing.xl,
    paddingBottom: theme.spacing.spacing.xxl,
  },
  title: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.spacing.xl,
  },
  sectionTitle: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.md,
    fontSize: theme.typography.fontSize.lg,
  },
  // Enhanced Insights Styles
  insightsSection: {
    marginBottom: theme.spacing.spacing.xl,
    paddingBottom: theme.spacing.spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary.gold,
  },
  insightsHeader: {
    marginBottom: theme.spacing.spacing.lg,
    alignItems: 'center',
  },
  insightsTitle: {
    color: theme.colors.primary.gold,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.spacing.xs,
  },
  insightsSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    fontStyle: 'italic',
  },
  priorityGroup: {
    marginBottom: theme.spacing.spacing.lg,
  },
  priorityLabel: {
    color: theme.colors.primary.goldLight,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.spacing.md,
    marginLeft: theme.spacing.spacing.xs,
  },
  insightCard: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.spacing.lg,
    marginBottom: theme.spacing.spacing.md,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightCardHigh: {
    borderColor: theme.colors.primary.gold,
    backgroundColor: theme.colors.neutrals.midGray,
    borderWidth: 3,
  },
  insightCardMedium: {
    borderColor: theme.colors.primary.goldLight,
  },
  insightCardLow: {
    borderColor: theme.colors.text.tertiary,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.md,
  },
  insightBadge: {
    backgroundColor: theme.colors.primary.gold,
    paddingHorizontal: theme.spacing.spacing.sm,
    paddingVertical: theme.spacing.spacing.xs,
    borderRadius: theme.spacing.borderRadius.sm,
  },
  insightBadgeMedium: {
    backgroundColor: theme.colors.primary.goldLight,
  },
  insightBadgeLow: {
    backgroundColor: theme.colors.text.tertiary,
  },
  insightBadgeText: {
    color: theme.colors.neutrals.black,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  insightSeverity: {
    backgroundColor: theme.colors.primary.crimson,
    paddingHorizontal: theme.spacing.spacing.sm,
    paddingVertical: theme.spacing.spacing.xs,
    borderRadius: theme.spacing.borderRadius.sm,
  },
  insightSeverityMedium: {
    backgroundColor: theme.colors.primary.crimsonDark,
  },
  severityText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  insightTitle: {
    color: theme.colors.primary.gold,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.spacing.sm,
  },
  insightDescription: {
    color: theme.colors.text.primary,
    lineHeight: 24,
    fontSize: theme.typography.fontSize.md,
  },
  // Legacy pattern styles (kept for compatibility)
  patternCard: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.lg,
    marginBottom: theme.spacing.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.text.secondary,
  },
  patternHigh: {
    borderLeftColor: theme.colors.primary.gold,
    backgroundColor: theme.colors.neutrals.midGray,
  },
  patternMedium: {
    borderLeftColor: theme.colors.primary.goldLight,
  },
  patternLow: {
    borderLeftColor: theme.colors.text.tertiary,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.sm,
  },
  patternTitle: {
    color: theme.colors.primary.gold,
    fontSize: theme.typography.fontSize.md,
    flex: 1,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  patternType: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patternDescription: {
    color: theme.colors.text.secondary,
    lineHeight: 22,
    fontSize: theme.typography.fontSize.md,
  },
  statBar: {
    marginBottom: theme.spacing.spacing.lg,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.spacing.xs,
  },
  statLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
  },
  statValue: {
    color: theme.colors.primary.gold,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  barContainer: {
    height: 12,
    backgroundColor: theme.colors.neutrals.darkGray,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barAnomaly: {
    opacity: 0.9,
  },
  expectedMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: theme.colors.text.tertiary,
  },
  statHint: {
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.spacing.xs,
    fontSize: theme.typography.fontSize.xs,
  },
  anomalyIndicator: {
    color: theme.colors.primary.gold,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutrals.darkGray,
  },
  cardRank: {
    color: theme.colors.text.secondary,
    width: 30,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  cardNameText: {
    flex: 1,
    color: theme.colors.text.primary,
  },
  cardCount: {
    color: theme.colors.primary.gold,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  loadingText: {
    marginTop: theme.spacing.spacing.md,
    color: theme.colors.text.secondary,
  },
  errorText: {
    color: theme.colors.semantic?.error || '#ff6b6b',
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.md,
  },
  errorSubtext: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.xl,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.md,
  },
  emptySubtext: {
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.xl,
  },
  retryButton: {
    marginBottom: theme.spacing.spacing.md,
    minWidth: 200,
  },
  backButton: {
    minWidth: 200,
  },
});