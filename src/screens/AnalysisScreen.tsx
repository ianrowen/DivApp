import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../core/api/supabase';
import ThemedText from '../shared/components/ui/ThemedText';
import ThemedButton from '../shared/components/ui/ThemedButton';
import MysticalBackground from '../shared/components/ui/MysticalBackground';
import SpinningLogo from '../shared/components/ui/SpinningLogo';
import theme from '../theme';
import { LOCAL_RWS_CARDS } from '../systems/tarot/data/localCardData';
import { useTranslation, SupportedLocale } from '../i18n';
import { generateThemeInterpretations } from '../services/themeInterpretationService';

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

export default function AnalysisScreen() {
  const { t, locale } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CardStats | null>(null);
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);
  const [themeInterpretations, setThemeInterpretations] = useState<Map<string, {
    summary: string;
    interpretation: string;
    themeNames?: string;
  }>>(new Map());
  const [generatingInterpretations, setGeneratingInterpretations] = useState(false);
  const [recurringCards, setRecurringCards] = useState<Array<{
    name: string;
    count: number;
    actualPercent: number;
    expectedPercent: number;
    probability: number;
  }>>([]);
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const loadingCompleteRef = useRef(false);
  const regeneratingRef = useRef(false);
  const loadingStatsRef = useRef(false);

  useEffect(() => {
    loadUser();

    // Failsafe: If still loading after 5 seconds, force stop
    const timeout = setTimeout(() => {
      setLoading((currentLoading) => {
        if (currentLoading && !loadingCompleteRef.current) {
          console.warn('Analysis loading timeout - forcing completion');
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
      console.log('Analysis: Starting to load readings...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Analysis: User fetch error:', userError);
        throw userError;
      }

      if (!user) {
        console.log('Analysis: No user found');
        setUser(null);
        loadingCompleteRef.current = true;
        setLoading(false);
        return;
      }

      console.log('Analysis: User found, fetching readings...');
      setUser(user);
    } catch (err) {
      console.error('Analysis: User load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user');
      loadingCompleteRef.current = true;
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    // Prevent concurrent loads
    if (loadingStatsRef.current) {
      console.log('Analysis: loadStatistics already in progress, skipping...');
      return;
    }
    
    try {
      loadingStatsRef.current = true;
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setLoading(false);
        loadingStatsRef.current = false;
        return;
      }

      console.log('Analysis: Fetching readings...');

      // Load all readings with dates
      const { data: readings, error: readingsError } = await supabase
        .from('readings')
        .select('elements_drawn, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (readingsError) {
        console.error('Analysis: Readings fetch error:', readingsError);
        throw readingsError;
      }

      console.log(`Analysis: Loaded ${readings?.length || 0} readings`);

      // Calculate date range
      if (readings && readings.length > 0) {
        const dates = readings
          .map((r: any) => r.created_at ? new Date(r.created_at) : null)
          .filter((d): d is Date => d !== null);
        
        if (dates.length > 0) {
          const start = dates[0];
          const end = dates[dates.length - 1];
          setDateRange({ start, end });
        }
      }

      // Process statistics
      const processedStats = processReadings(readings || []);
      setStats(processedStats);

      // Detect patterns and anomalies
      const detectedPatterns = detectPatterns(processedStats);
      setPatterns(detectedPatterns);

      // Extract recurring cards (1-3 cards) ONLY if statistically anomalous (< 25% chance)
      const sortedCards = Array.from(processedStats.cardCounts.entries())
        .sort((a, b) => b[1] - a[1]);
      
      // Calculate probability of recurrence using binomial distribution
      // P(X >= k) where X ~ Binomial(n, p), n = totalCards, p = 1/78, k = count
      const calculateRecurrenceProbability = (count: number, totalCards: number): number => {
        const p = 1 / 78; // Probability of drawing a specific card
        const n = totalCards;
        
        // Use cumulative binomial probability: P(X >= count)
        // For large n, we can approximate, but for accuracy we'll use a simpler approach
        // Calculate probability that this card appears count or more times
        let probability = 0;
        for (let k = count; k <= n; k++) {
          // Binomial coefficient: C(n,k) * p^k * (1-p)^(n-k)
          // Simplified calculation
          const binomialCoeff = factorial(n) / (factorial(k) * factorial(n - k));
          probability += binomialCoeff * Math.pow(p, k) * Math.pow(1 - p, n - k);
        }
        return probability;
      };
      
      // Helper function for factorial (with memoization for efficiency)
      const factorial = (n: number): number => {
        if (n <= 1) return 1;
        if (n > 20) return Infinity; // Prevent overflow
        let result = 1;
        for (let i = 2; i <= n; i++) {
          result *= i;
        }
        return result;
      };
      
      const anomalousCards = sortedCards
        .filter(([_, count]) => {
          if (count < 3 || processedStats.totalCards < 10) return false; // Need at least 3 occurrences
          
          const actualPercent = (count / processedStats.totalCards) * 100;
          const expectedPercent = (1 / 78) * 100; // ~1.28%
          
          // Calculate probability of this recurrence happening by chance
          const probability = calculateRecurrenceProbability(count, processedStats.totalCards);
          
          // Only include if probability < 25% (statistically significant)
          return probability < 0.25;
        })
        .slice(0, 3) // Max 3 cards
        .map(([name, count]) => {
          const actualPercent = (count / processedStats.totalCards) * 100;
          const expectedPercent = (1 / 78) * 100;
          const probability = calculateRecurrenceProbability(count, processedStats.totalCards);
          
          return {
            name: getCardName(name),
            count,
            actualPercent,
            expectedPercent,
            probability: probability * 100, // Convert to percentage
          };
        });
      
      setRecurringCards(anomalousCards);

      // Generate theme interpretations for patterns that need them
      // Exclude single recurring card patterns (they're shown in RECURRING CARD(S) section)
      if (detectedPatterns.length > 0) {
        setGeneratingInterpretations(true);
        try {
          // Build card occurrence timeline for themes that need temporal analysis
          const cardOccurrences = new Map<string, string[]>(); // card name -> array of timestamps
          readings?.forEach((reading: any) => {
            if (!reading.created_at) return;
            reading.elements_drawn?.forEach((elem: any) => {
              let card = null;
              if (elem.metadata?.cardCode) {
                card = LOCAL_RWS_CARDS.find(c => c.code === elem.metadata.cardCode);
              }
              if (!card && elem.elementId) {
                card = LOCAL_RWS_CARDS.find(c => c.code === elem.elementId);
              }
              if (card) {
                const cardName = card.title.en;
                if (!cardOccurrences.has(cardName)) {
                  cardOccurrences.set(cardName, []);
                }
                cardOccurrences.get(cardName)?.push(reading.created_at);
              }
            });
          });

          // Calculate structural statistics over time (early/middle/late periods)
          const calculateStructuralStatsOverTime = (readings: any[]) => {
            if (readings.length === 0) return null;
            
            const sortedReadings = [...readings].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            
            const totalReadings = sortedReadings.length;
            const third = Math.floor(totalReadings / 3);
            const early = sortedReadings.slice(0, third);
            const middle = sortedReadings.slice(third, third * 2);
            const late = sortedReadings.slice(third * 2);
            
            const calculatePeriodStats = (periodReadings: any[]) => {
              let major = 0, minor = 0, court = 0;
              let wands = 0, cups = 0, swords = 0, pentacles = 0;
              let total = 0;
              
              periodReadings.forEach((reading: any) => {
                reading.elements_drawn?.forEach((elem: any) => {
                  let card = null;
                  if (elem.metadata?.cardCode) {
                    card = LOCAL_RWS_CARDS.find(c => c.code === elem.metadata.cardCode);
                  }
                  if (!card && elem.elementId) {
                    card = LOCAL_RWS_CARDS.find(c => c.code === elem.elementId);
                  }
                  if (card) {
                    total++;
                    if (card.arcana === 'Major') major++;
                    else if (card.arcana === 'Minor') minor++;
                    else if (card.arcana === 'Court') court++;
                    
                    if (card.suit === 'Wands') wands++;
                    else if (card.suit === 'Cups') cups++;
                    else if (card.suit === 'Swords') swords++;
                    else if (card.suit === 'Pentacles') pentacles++;
                  }
                });
              });
              
              return {
                total,
                major: total > 0 ? (major / total) * 100 : 0,
                minor: total > 0 ? (minor / total) * 100 : 0,
                court: total > 0 ? (court / total) * 100 : 0,
                wands: total > 0 ? (wands / total) * 100 : 0,
                cups: total > 0 ? (cups / total) * 100 : 0,
                swords: total > 0 ? (swords / total) * 100 : 0,
                pentacles: total > 0 ? (pentacles / total) * 100 : 0,
              };
            };
            
            return {
              early: calculatePeriodStats(early),
              middle: calculatePeriodStats(middle),
              late: calculatePeriodStats(late),
              overall: {
                major: processedStats.majorArcana / processedStats.totalCards * 100,
                minor: processedStats.minorArcana / processedStats.totalCards * 100,
                court: processedStats.courtCards / processedStats.totalCards * 100,
                wands: processedStats.wands / processedStats.totalCards * 100,
                cups: processedStats.cups / processedStats.totalCards * 100,
                swords: processedStats.swords / processedStats.totalCards * 100,
                pentacles: processedStats.pentacles / processedStats.totalCards * 100,
              },
            };
          };
          
          const structuralStatsOverTime = calculateStructuralStatsOverTime(readings || []);

          const themes = detectedPatterns
            .filter(p => {
              // Exclude single recurring card patterns (they're shown at top)
              if (p.type === 'recurring_theme' && p.cards && p.cards.length === 1) {
                return false;
              }
              // Include "Multiple Recurring Themes" (now type 'trend') and other high severity patterns
              return p.title === (locale === 'zh-TW' ? '多重重複主題' : 'Multiple Recurring Themes') || p.severity === 'high';
            })
            .map(p => {
              // Build card occurrence timeline for this pattern's cards
              const cardTimeline: Record<string, string[]> = {};
              p.cards?.forEach(cardName => {
                const occurrences = cardOccurrences.get(cardName) || [];
                cardTimeline[cardName] = occurrences.sort(); // Sort chronologically
              });

              return {
                type: p.type,
                key: p.title, // Use title as key
                cards: p.cards || [],
                metadata: {
                  title: p.title,
                  description: p.description,
                  severity: p.severity,
                  cardTimeline, // Add temporal distribution data
                  structuralStatsOverTime, // Add structural statistics over time
                  totalCards: processedStats.totalCards,
                  totalReadings: readings?.length || 0,
                },
              };
            });
          
          const interpretations = await generateThemeInterpretations(
            user.id,
            themes,
            locale,
            false // Don't force regenerate on initial load
          );
          setThemeInterpretations(interpretations);
        } catch (err) {
          console.error('Error generating theme interpretations:', err);
        } finally {
          setGeneratingInterpretations(false);
        }
      }

      loadingCompleteRef.current = true;
    } catch (err) {
      console.error('Analysis: Fatal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
      loadingCompleteRef.current = true;
    } finally {
      loadingStatsRef.current = false;
      console.log('Analysis: Loading complete');
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
          card = LOCAL_RWS_CARDS.find(c => {
            const titleEn = typeof c.title === 'string' ? c.title : (c.title?.en || '');
            const titleZh = typeof c.title === 'object' ? (c.title?.zh || '') : '';
            return titleEn === elem.metadata.cardTitle || titleZh === elem.metadata.cardTitle;
          });
        }
        
        // Method 4: Try filename matching (for old data)
        if (!card && elem.elementId) {
          card = LOCAL_RWS_CARDS.find(c => c.filename === elem.elementId || c.filename === `${elem.elementId}.jpg`);
        }
        
        if (!card) {
          console.warn('Analysis: Card not found for element:', {
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

    // NOTE: Single recurring cards (1-3 cards) are shown in the RECURRING CARD(S) section at top
    // Only create pattern for single card if it's NOT already in the top section (handled separately)
    // This prevents duplication - single cards are shown at top, multiple cards (3+) are shown as "Multiple Recurring Themes"

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

    // INSIGHT: Multiple recurring themes (only if 3+ cards, separate from single recurring cards)
    if (sortedCards.length >= 3 && stats.totalCards > 20) {
      const recurringCardsForThemes = sortedCards.filter(([_, count]) => {
        const freq = (count / stats.totalCards) * 100;
        return freq > (1 / 78) * 100 * 2.5; // 2.5x expected
      });

      if (recurringCardsForThemes.length >= 3) {
        const cardNames = recurringCardsForThemes.map(([name]) => getCardName(name)).join(', ');
        // Change type to 'trend' so badges don't show - this is THEMES section, not recurring badge section
        patterns.push({
          type: 'trend', // Changed from 'recurring_theme' to prevent badge display
          severity: 'high',
          title: isChinese ? '多重重複主題' : 'Multiple Recurring Themes',
          description: isChinese
            ? `您有多張卡牌重複出現：${cardNames}。這些能量正在形成一個相互關聯的主題網絡，值得深入探索。`
            : `Multiple cards are recurring: ${cardNames}. These energies are forming an interconnected thematic network worth exploring deeply.`,
          cards: recurringCardsForThemes.map(([name]) => name),
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

  // Format description text, replacing markdown **bold** and *italic* with React Native styling
  const formatDescriptionWithBold = (text: string, currentLocale: SupportedLocale): React.ReactNode => {
    if (!text) return <ThemedText variant="body">{text}</ThemedText>;
    
    // Split by **bold** and *italic* markers (process bold first, then italic)
    let parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    // Process each part for italic markers
    const processedParts: React.ReactNode[] = [];
    
    parts.forEach((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // This is a bold section - remove ** markers and make bold
        const boldText = part.slice(2, -2);
        processedParts.push(
          <ThemedText key={`bold-${idx}`} variant="body" style={{ fontWeight: 'bold', color: theme.colors.primary.gold }}>
            {boldText}
          </ThemedText>
        );
      } else {
        // Check for italic markers within this part
        const italicParts = part.split(/(\*[^*]+\*)/g);
        italicParts.forEach((italicPart, italicIdx) => {
          if (italicPart.startsWith('*') && italicPart.endsWith('*') && !italicPart.startsWith('**')) {
            // This is an italic section - remove * markers and make italic
            const italicText = italicPart.slice(1, -1);
            processedParts.push(
              <ThemedText key={`italic-${idx}-${italicIdx}`} variant="body" style={{ fontStyle: 'italic', color: theme.colors.text.secondary }}>
                {italicText}
              </ThemedText>
            );
          } else if (italicPart.trim()) {
            // Regular text
            processedParts.push(
              <ThemedText key={`text-${idx}-${italicIdx}`} variant="body">
                {italicPart}
              </ThemedText>
            );
          }
        });
      }
    });
    
    return (
      <ThemedText variant="body" style={{ lineHeight: 22, flexWrap: 'wrap' }}>
        {processedParts}
      </ThemedText>
    );
  };

  // Extract concise theme names from AI interpretation
  const extractThemeNames = (interpretation: string, currentLocale: SupportedLocale): string => {
    if (!interpretation) return '';
    
    // Try to extract key themes from the interpretation
    // Look for patterns like "theme1, theme2, and theme3" or "themes of X, Y, Z"
    const themePatterns = [
      /(?:themes? of|themes? include|focusing on|centered around|revolving around|around)\s+([^.!?]+)/i,
      /(?:exploring|addressing|navigating|working with)\s+([^.!?]+)/i,
    ];
    
    for (const pattern of themePatterns) {
      const match = interpretation.match(pattern);
      if (match && match[1]) {
        // Clean up and limit length
        let themes = match[1].trim();
        // Remove common connecting words
        themes = themes.replace(/\b(and|or|the|a|an)\b/gi, '').trim();
        // Limit to reasonable length
        if (themes.length > 60) {
          themes = themes.substring(0, 57) + '...';
        }
        return themes;
      }
    }
    
    // Fallback: extract first sentence or key phrase
    const firstSentence = interpretation.split(/[.!?]/)[0];
    if (firstSentence.length > 0 && firstSentence.length < 80) {
      return firstSentence.trim();
    }
    
    // Last resort: return first 60 chars
    return interpretation.substring(0, 60).trim() + (interpretation.length > 60 ? '...' : '');
  };

  // Loading state
  if (loading) {
    return (
      <MysticalBackground variant="subtle">
        <View style={styles.centerContainer}>
          <SpinningLogo size={100} />
          <ThemedText variant="body" style={styles.loadingText}>
            Loading analysis...
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
            Unable to Load Analysis
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
            {t('analysis.noStats') || 'No Analysis Yet'}
          </ThemedText>
          <ThemedText variant="body" style={styles.emptySubtext}>
            {t('analysis.noStatsSubtext') || 'Complete some readings to see your patterns and insights here.'}
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
      {/* RECURRING CARD(S) - Top Left, Only if Statistically Anomalous */}
      {recurringCards.length > 0 && recurringCards.length <= 3 && (
        <View style={styles.recurringCardSection}>
          <ThemedText variant="caption" style={styles.recurringCardLabel}>
            {locale === 'zh-TW' 
              ? (recurringCards.length === 1 ? '重複卡牌' : '重複卡牌')
              : (recurringCards.length === 1 ? 'RECURRING CARD' : 'RECURRING CARDS')}
          </ThemedText>
          {recurringCards.map((card, idx) => (
            <View key={idx} style={styles.recurringCardItem}>
              <ThemedText variant="body" style={styles.recurringCardName}>
                {card.name}
              </ThemedText>
              <ThemedText variant="caption" style={styles.recurringCardStats}>
                {locale === 'zh-TW'
                  ? `${card.count}次 • ${card.actualPercent.toFixed(1)}% (預期 ${card.expectedPercent.toFixed(1)}%) • ${card.probability.toFixed(1)}%機率`
                  : `${card.count} times • ${card.actualPercent.toFixed(1)}% (expected ${card.expectedPercent.toFixed(1)}%) • ${card.probability.toFixed(1)}% probability`}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* THEMES Section - Standalone Container */}
      {patterns.some(p => p.title === (locale === 'zh-TW' ? '多重重複主題' : 'Multiple Recurring Themes')) && (
        <View style={styles.themesContainer}>
          {(() => {
            const themesPattern = patterns.find(p => p.title === (locale === 'zh-TW' ? '多重重複主題' : 'Multiple Recurring Themes'));
            return themesPattern ? (
              <>
                {/* Show THEMES: keywords */}
                <ThemedText variant="caption" style={styles.themesLabel}>
                  {locale === 'zh-TW' ? '主題' : 'THEMES'}
                  {(() => {
                    const interpretation = themeInterpretations.get(themesPattern.title);
                    const themeNames = interpretation?.themeNames;
                    if (themeNames && themeNames.trim()) {
                      return (
                        <>
                          {': '}
                          <ThemedText variant="body" style={styles.themesSubheading}>
                            {themeNames}
                          </ThemedText>
                        </>
                      );
                    }
                    return null;
                  })()}
                </ThemedText>
                {/* Show AI-generated interpretation if available */}
                {themeInterpretations.has(themesPattern.title) && (
                  <View style={{ marginTop: theme.spacing.spacing.md, width: '100%' }}>
                    {formatDescriptionWithBold(themeInterpretations.get(themesPattern.title)?.interpretation || '', locale)}
                  </View>
                )}
                {generatingInterpretations && (
                  <View style={styles.generatingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary.gold} />
                    <ThemedText variant="caption" style={styles.generatingText}>
                      {locale === 'zh-TW' ? '正在生成解讀...' : 'Generating interpretation...'}
                    </ThemedText>
                  </View>
                )}
              </>
            ) : null;
          })()}
        </View>
      )}

      {/* Section Break between Themes and Insights */}
      {patterns.some(p => p.title === (locale === 'zh-TW' ? '多重重複主題' : 'Multiple Recurring Themes')) && 
       patterns.filter(p => p.title !== (locale === 'zh-TW' ? '多重重複主題' : 'Multiple Recurring Themes')).length > 0 && (
        <View style={styles.sectionDivider} />
      )}

      {/* Enhanced Insights Panels - At Top */}
      {patterns.filter(p => p.title !== (locale === 'zh-TW' ? '多重重複主題' : 'Multiple Recurring Themes')).length > 0 && (
        <View style={styles.insightsSection}>
          {/* High Priority Insights - Only show header if there are high severity patterns (excluding THEMES) */}
          {patterns.filter(p => p.severity === 'high' && p.title !== (locale === 'zh-TW' ? '多重重複主題' : 'Multiple Recurring Themes')).length > 0 && (
            <View style={styles.priorityGroup}>
              <ThemedText variant="h3" style={styles.priorityLabel}>
                ⚠️ {locale === 'zh-TW' ? '高度顯著' : 'Highly Significant'}
              </ThemedText>
              {patterns
                .filter(p => p.severity === 'high' && p.title !== (locale === 'zh-TW' ? '多重重複主題' : 'Multiple Recurring Themes'))
                .map((pattern, idx) => (
                  <View
                    key={`high-${idx}`}
                    style={[styles.insightCard, styles.insightCardHigh]}
                  >
                    {/* Only show badges if it's actually a recurring theme */}
                    {pattern.type === 'recurring_theme' && (
                      <View style={styles.insightHeader}>
                        <View style={styles.insightBadge}>
                          <ThemedText variant="caption" style={styles.insightBadgeText}>
                            {locale === 'zh-TW' ? '重複' : 'RECURRING'}
                          </ThemedText>
                        </View>
                        <View style={styles.insightSeverity}>
                          <ThemedText variant="caption" style={styles.severityText}>
                            🔥 {locale === 'zh-TW' ? '高' : 'HIGH'}
                          </ThemedText>
                        </View>
                      </View>
                    )}
                    <ThemedText variant="h3" style={styles.insightTitle}>
                      {pattern.title}
                    </ThemedText>
                    <View style={{ marginTop: theme.spacing.spacing.sm }}>
                      {formatDescriptionWithBold(pattern.description, locale)}
                    </View>
                    {/* Show AI-generated interpretation if available */}
                    {themeInterpretations.has(pattern.title) && (
                      <View style={styles.interpretationContainer}>
                        <ThemedText variant="caption" style={styles.interpretationLabel}>
                          {locale === 'zh-TW' ? '✨ 解讀' : '✨ Interpretation'}
                        </ThemedText>
                        <View style={{ width: '100%' }}>
                          {formatDescriptionWithBold(themeInterpretations.get(pattern.title)?.interpretation || '', locale)}
                        </View>
                      </View>
                    )}
                    {generatingInterpretations && idx === 0 && (
                      <View style={styles.generatingContainer}>
                        <ActivityIndicator size="small" color={theme.colors.primary.gold} />
                        <ThemedText variant="caption" style={styles.generatingText}>
                          {locale === 'zh-TW' ? '正在生成解讀...' : 'Generating interpretation...'}
                        </ThemedText>
                      </View>
                    )}
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
                    <View>
                      {formatDescriptionWithBold(pattern.description, locale)}
                    </View>
                    {/* Show AI-generated interpretation if available */}
                    {themeInterpretations.has(pattern.title) && (
                      <View style={styles.interpretationContainer}>
                        <ThemedText variant="caption" style={styles.interpretationLabel}>
                          {locale === 'zh-TW' ? '✨ 解讀' : '✨ Interpretation'}
                        </ThemedText>
                        <View>
                          {formatDescriptionWithBold(themeInterpretations.get(pattern.title)?.interpretation || '', locale)}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
            </View>
          )}

          {/* Low Priority Insights - Observations */}
          {patterns.filter(p => p.severity === 'low').length > 0 && (
            <View style={styles.priorityGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.spacing.md }}>
                <ThemedText variant="h3" style={styles.priorityLabel}>
                  💭 {locale === 'zh-TW' ? '觀察' : 'Observations'}
                </ThemedText>
                {/* Show HIGHLY SIGNIFICANT header and flame badge only if there are high severity patterns in observations section (shouldn't normally happen) */}
                {patterns.filter(p => p.severity === 'low').some(p => p.severity === 'high') && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.spacing.xs }}>
                    <ThemedText variant="h3" style={styles.priorityLabel}>
                      ⚠️ {locale === 'zh-TW' ? '高度顯著' : 'Highly Significant'}
                    </ThemedText>
                    <View style={styles.insightSeverity}>
                      <ThemedText variant="caption" style={styles.severityText}>
                        🔥 {locale === 'zh-TW' ? '高' : 'HIGH'}
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
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
                      {/* Show flame badge only if pattern is high severity */}
                      {pattern.severity === 'high' && (
                        <View style={styles.insightSeverity}>
                          <ThemedText variant="caption" style={styles.severityText}>
                            🔥 {locale === 'zh-TW' ? '高' : 'HIGH'}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText variant="h3" style={styles.insightTitle}>
                      {pattern.title}
                    </ThemedText>
                    <View>
                      {formatDescriptionWithBold(pattern.description, locale)}
                    </View>
                    {/* Show AI-generated interpretation if available */}
                    {themeInterpretations.has(pattern.title) && (
                      <View style={styles.interpretationContainer}>
                        <ThemedText variant="caption" style={styles.interpretationLabel}>
                          {locale === 'zh-TW' ? '✨ 解讀' : '✨ Interpretation'}
                        </ThemedText>
                        <View>
                          {formatDescriptionWithBold(themeInterpretations.get(pattern.title)?.interpretation || '', locale)}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
            </View>
          )}
        </View>
      )}

      {/* Card Type Distribution */}
      <View style={styles.section}>
        <ThemedText variant="h2" style={styles.sectionTitle}>
          🎴 {t('analysis.cardTypeDistribution')}
        </ThemedText>
        
        <StatBar
          label={t('analysis.majorArcana')}
          value={stats.majorArcana}
          total={stats.totalCards}
          expected={22/78}
          color={theme.colors.primary.gold}
          t={t}
        />
        <StatBar
          label={t('analysis.courtCards')}
          value={stats.courtCards}
          total={stats.totalCards}
          expected={16/78}
          color={theme.colors.text.secondary}
          t={t}
        />
        <StatBar
          label={t('analysis.minorArcana')}
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
          🌟 {t('analysis.suitDistribution')}
        </ThemedText>
        
        <StatBar
          label={t('analysis.wands')}
          value={stats.wands}
          total={stats.totalCards}
          expected={14/78}
          color="#ff6b6b"
          t={t}
        />
        <StatBar
          label={t('analysis.cups')}
          value={stats.cups}
          total={stats.totalCards}
          expected={14/78}
          color="#4ecdc4"
          t={t}
        />
        <StatBar
          label={t('analysis.swords')}
          value={stats.swords}
          total={stats.totalCards}
          expected={14/78}
          color="#ffe66d"
          t={t}
        />
        <StatBar
          label={t('analysis.pentacles')}
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
          🔄 {t('analysis.reversalRatio')}
        </ThemedText>
        
        <StatBar
          label={t('analysis.upright')}
          value={stats.upright}
          total={stats.totalCards}
          expected={0.5}
          color={theme.colors.primary.gold}
          t={t}
        />
        <StatBar
          label={t('analysis.reversed')}
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
          ⭐ {t('analysis.mostPulled')}
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
              {count} {t('analysis.times')} ({((count / stats.totalCards) * 100).toFixed(1)}%)
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Regenerate Themes Button - For Testing */}
      <ThemedButton
        title={generatingInterpretations 
          ? (locale === 'zh-TW' ? '生成中...' : 'Generating...')
          : (locale === 'zh-TW' ? '🔄 重新生成主題' : '🔄 Regenerate Themes')}
        onPress={async () => {
          if (!user?.id || !stats) {
            console.error('Regenerate: Missing user or stats', { userId: user?.id, hasStats: !!stats });
            return;
          }
          
          // Prevent concurrent regenerations
          if (regeneratingRef.current) {
            console.log('Regenerate: Already in progress, skipping...');
            return;
          }
          
          try {
            regeneratingRef.current = true;
            console.log('Regenerate: Starting regeneration...');
            setGeneratingInterpretations(true);
            
            // Delete all theme interpretations for this user
            const { error: deleteError, data: deletedData } = await supabase
              .from('theme_interpretations')
              .delete()
              .eq('user_id', user.id)
              .select();
            
            if (deleteError) {
              console.error('Regenerate: Error clearing theme interpretations:', deleteError);
              // Continue anyway - might be table doesn't exist
            } else {
              console.log('Regenerate: Cleared existing theme interpretations, deleted:', deletedData?.length || 0);
            }
            
            // Verify delete completed by checking if records still exist
            const { data: verifyData } = await supabase
              .from('theme_interpretations')
              .select('id')
              .eq('user_id', user.id)
              .limit(1);
            
            if (verifyData && verifyData.length > 0) {
              console.warn('Regenerate: Delete may not have completed, records still exist. Retrying delete...');
              await supabase
                .from('theme_interpretations')
                .delete()
                .eq('user_id', user.id);
            }
            
            // Clear state
            setThemeInterpretations(new Map());
            
            // Delay to ensure delete completes before regeneration
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Regenerate interpretations
            const detectedPatterns = detectPatterns(stats);
            console.log('Regenerate: Detected patterns:', detectedPatterns.length);
            console.log('Regenerate: Pattern details:', detectedPatterns.map(p => ({
              title: p.title,
              type: p.type,
              severity: p.severity,
              cardsCount: p.cards?.length || 0
            })));
            
            if (detectedPatterns.length > 0) {
              // Build card occurrence timeline
              const cardOccurrences = new Map<string, string[]>();
              const { data: readings, error: readingsError } = await supabase
                .from('readings')
                .select('elements_drawn, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });
              
              if (readingsError) {
                console.error('Regenerate: Error fetching readings:', readingsError);
                throw readingsError;
              }
              
              console.log('Regenerate: Loaded readings for timeline:', readings?.length || 0);
              
              readings?.forEach((reading: any) => {
                if (!reading.created_at) return;
                reading.elements_drawn?.forEach((elem: any) => {
                  let card = null;
                  if (elem.metadata?.cardCode) {
                    card = LOCAL_RWS_CARDS.find(c => c.code === elem.metadata.cardCode);
                  }
                  if (!card && elem.elementId) {
                    card = LOCAL_RWS_CARDS.find(c => c.code === elem.elementId);
                  }
                  if (card) {
                    const cardName = card.title.en;
                    if (!cardOccurrences.has(cardName)) {
                      cardOccurrences.set(cardName, []);
                    }
                    cardOccurrences.get(cardName)?.push(reading.created_at);
                  }
                });
              });

              // Calculate structural statistics over time (early/middle/late periods)
              const calculateStructuralStatsOverTime = (readings: any[]) => {
                if (readings.length === 0) return null;
                
                const sortedReadings = [...readings].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                
                const totalReadings = sortedReadings.length;
                const third = Math.floor(totalReadings / 3);
                const early = sortedReadings.slice(0, third);
                const middle = sortedReadings.slice(third, third * 2);
                const late = sortedReadings.slice(third * 2);
                
                const calculatePeriodStats = (periodReadings: any[]) => {
                  let major = 0, minor = 0, court = 0;
                  let wands = 0, cups = 0, swords = 0, pentacles = 0;
                  let total = 0;
                  
                  periodReadings.forEach((reading: any) => {
                    reading.elements_drawn?.forEach((elem: any) => {
                      let card = null;
                      if (elem.metadata?.cardCode) {
                        card = LOCAL_RWS_CARDS.find(c => c.code === elem.metadata.cardCode);
                      }
                      if (!card && elem.elementId) {
                        card = LOCAL_RWS_CARDS.find(c => c.code === elem.elementId);
                      }
                      if (card) {
                        total++;
                        if (card.arcana === 'Major') major++;
                        else if (card.arcana === 'Minor') minor++;
                        else if (card.arcana === 'Court') court++;
                        
                        if (card.suit === 'Wands') wands++;
                        else if (card.suit === 'Cups') cups++;
                        else if (card.suit === 'Swords') swords++;
                        else if (card.suit === 'Pentacles') pentacles++;
                      }
                    });
                  });
                  
                  return {
                    total,
                    major: total > 0 ? (major / total) * 100 : 0,
                    minor: total > 0 ? (minor / total) * 100 : 0,
                    court: total > 0 ? (court / total) * 100 : 0,
                    wands: total > 0 ? (wands / total) * 100 : 0,
                    cups: total > 0 ? (cups / total) * 100 : 0,
                    swords: total > 0 ? (swords / total) * 100 : 0,
                    pentacles: total > 0 ? (pentacles / total) * 100 : 0,
                  };
                };
                
                return {
                  early: calculatePeriodStats(early),
                  middle: calculatePeriodStats(middle),
                  late: calculatePeriodStats(late),
                  overall: {
                    major: stats.majorArcana / stats.totalCards * 100,
                    minor: stats.minorArcana / stats.totalCards * 100,
                    court: stats.courtCards / stats.totalCards * 100,
                    wands: stats.wands / stats.totalCards * 100,
                    cups: stats.cups / stats.totalCards * 100,
                    swords: stats.swords / stats.totalCards * 100,
                    pentacles: stats.pentacles / stats.totalCards * 100,
                  },
                };
              };
              
              const structuralStatsOverTime = calculateStructuralStatsOverTime(readings || []);

              const themes = detectedPatterns
                .filter(p => {
                  const isSingleRecurring = p.type === 'recurring_theme' && p.cards && p.cards.length === 1;
                  const isMultipleThemes = p.title === (locale === 'zh-TW' ? '多重重複主題' : 'Multiple Recurring Themes');
                  const isHighSeverity = p.severity === 'high';
                  const shouldInclude = !isSingleRecurring && (isMultipleThemes || isHighSeverity);
                  
                  console.log(`Regenerate: Pattern "${p.title}":`, {
                    isSingleRecurring,
                    isMultipleThemes,
                    isHighSeverity,
                    shouldInclude
                  });
                  
                  return shouldInclude;
                })
                .map(p => {
                  const cardTimeline: Record<string, string[]> = {};
                  p.cards?.forEach(cardName => {
                    const occurrences = cardOccurrences.get(cardName) || [];
                    cardTimeline[cardName] = occurrences.sort();
                  });

                  const themeMetadata = {
                    title: p.title,
                    description: p.description,
                    severity: p.severity,
                    cardTimeline,
                    structuralStatsOverTime, // Add structural statistics over time
                    totalCards: stats.totalCards,
                    totalReadings: readings?.length || 0,
                  };
                  
                  console.log(`Regenerate: Theme metadata for "${p.title}":`, {
                    hasStructuralStats: !!structuralStatsOverTime,
                    hasEarly: !!structuralStatsOverTime?.early,
                    hasMiddle: !!structuralStatsOverTime?.middle,
                    hasLate: !!structuralStatsOverTime?.late,
                    metadataKeys: Object.keys(themeMetadata),
                  });
                  
                  return {
                    type: p.type,
                    key: p.title,
                    cards: p.cards || [],
                    metadata: themeMetadata,
                  };
                });
              
              console.log('Regenerate: Generating interpretations for themes:', themes.length);
              
              const interpretations = await generateThemeInterpretations(
                user.id,
                themes,
                locale,
                true // Force regenerate when button is clicked
              );
              
              console.log('Regenerate: Generated interpretations:', interpretations.size);
              console.log('Regenerate: Interpretation keys:', Array.from(interpretations.keys()));
              interpretations.forEach((value, key) => {
                console.log(`Regenerate: ${key} - themeNames:`, value.themeNames);
              });
              
              setThemeInterpretations(interpretations);
            } else {
              console.log('Regenerate: No patterns detected, nothing to regenerate');
            }
          } catch (err) {
            console.error('Regenerate: Error regenerating theme interpretations:', err);
            if (err instanceof Error) {
              console.error('Regenerate: Error stack:', err.stack);
            }
          } finally {
            regeneratingRef.current = false;
            setGeneratingInterpretations(false);
            console.log('Regenerate: Completed');
          }
        }}
        variant="secondary"
        style={styles.regenerateButton}
        disabled={generatingInterpretations || !stats}
      />
r      
      {/* Subtitle moved to bottom - card count and dates */}
      <ThemedText variant="body" style={styles.subtitle}>
        {(() => {
          const count = stats.totalCards;
          if (dateRange.start && dateRange.end) {
            // Format dates to match History screen format
            const formatDate = (date: Date): string => {
              if (locale === 'zh-TW') {
                // Chinese format: 2025年12月19日
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const day = date.getDate();
                return `${year}年${month}月${day}日`;
              } else {
                // English format: 19 Dec 2025
                const day = date.getDate();
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const month = monthNames[date.getMonth()];
                const year = date.getFullYear();
                return `${day} ${month} ${year}`;
              }
            };
            
            const startStr = formatDate(dateRange.start);
            const endStr = formatDate(dateRange.end);
            return locale === 'zh-TW' 
              ? `基於 ${count} 張卡牌，時間範圍：${startStr} 至 ${endStr}`
              : `Based on ${count} cards drawn between ${startStr} and ${endStr}`;
          }
          return locale === 'zh-TW' 
            ? `基於 ${count} 張卡牌`
            : `Based on ${count} cards drawn`;
        })()}
      </ThemedText>
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
        {t('analysis.expected')}: {expectedPercentage.toFixed(1)}%
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
    paddingTop: theme.spacing.spacing.md + 10, // Reduced top padding since header removed
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
    marginTop: theme.spacing.spacing.sm,
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
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.neutrals.midGray,
    marginVertical: theme.spacing.spacing.md, // Reduced from xl to md
    width: '100%',
  },
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
  recurringCardSection: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    marginBottom: theme.spacing.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary.gold,
  },
  recurringCardLabel: {
    color: theme.colors.primary.gold,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: theme.spacing.spacing.xs,
    textTransform: 'uppercase',
  },
  recurringCardItem: {
    marginTop: theme.spacing.spacing.sm,
  },
  recurringCardName: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  recurringCardStats: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.spacing.xs,
  },
  summaryContainer: {
    marginTop: theme.spacing.spacing.md,
    marginBottom: theme.spacing.spacing.sm,
  },
  summaryText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
    flexWrap: 'wrap',
  },
  expandButton: {
    marginTop: theme.spacing.spacing.md,
    alignSelf: 'flex-start',
  },
  themesContainer: {
    backgroundColor: theme.colors.neutrals.black,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    width: '100%',
    marginBottom: theme.spacing.spacing.xl,
  },
  themesLabel: {
    color: theme.colors.primary.gold,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: theme.spacing.spacing.xs,
    textTransform: 'uppercase',
  },
  themesSubheading: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    fontStyle: 'italic',
  },
  interpretationContainer: {
    marginTop: theme.spacing.spacing.md,
    padding: theme.spacing.spacing.md,
    backgroundColor: theme.colors.neutrals.black,
    borderRadius: theme.spacing.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary.gold,
    width: '100%',
  },
  interpretationLabel: {
    color: theme.colors.primary.goldLight,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.spacing.md,
    padding: theme.spacing.spacing.sm,
  },
  generatingText: {
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.spacing.sm,
    fontSize: theme.typography.fontSize.xs,
  },
  regenerateButton: {
    marginTop: theme.spacing.spacing.xl,
    marginBottom: theme.spacing.spacing.xl,
    alignSelf: 'center',
  },
});
