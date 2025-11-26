import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AppStackParamList } from '../../App';
import { supabaseHelpers } from '../core/api/supabase';
import { LOCAL_RWS_CARDS, LOCAL_SPREADS } from '../systems/tarot/data/localCardData';
import type { LocalTarotCard } from '../systems/tarot/data/localCardData';
import AIProvider from '../core/api/aiProvider';
import FollowUpService, { type FollowUpMessage } from '../features/followUp/services/FollowUpService';
import FormattedText from '../shared/components/FormattedText';
import { getCardImageSource } from '../systems/tarot/utils/cardImageHelper';
import theme from '../shared/theme';
import MysticalBackground from '../shared/components/ui/MysticalBackground';
import ThemedText from '../shared/components/ui/ThemedText';
import ThemedButton from '../shared/components/ui/ThemedButton';
import ThemedCard from '../shared/components/ui/ThemedCard';
import CardBack from '../shared/components/ui/CardBack';

type Props = StackScreenProps<AppStackParamList, 'TarotReading'>;

interface DrawnCard extends LocalTarotCard {
  reversed: boolean;
  position: string;
}

type SpreadType = 'single-card' | 'three-card';

// Card display component
function CardDisplay({ card, index }: { card: DrawnCard; index: number }) {
  const [imageError, setImageError] = useState(false);
  const imageSource = getCardImageSource(card.filename);

  // Get element icon - using classical alchemical symbols
  const getElementIcon = (element: string): string => {
    const elementMap: Record<string, string> = {
      'Fire': '🜂',      // Classical alchemical fire symbol
      'Water': '🜄',     // Classical alchemical water symbol
      'Air': '🜁',       // Classical alchemical air symbol
      'Earth': '🜃',     // Classical alchemical earth symbol
    };
    return elementMap[element] || '•';
  };

  // Get astrological symbols and formatted text
  // Returns icons and text for both planet and sign when present
  const getAstroInfo = (astro: string): { icons: string[]; text: string } => {
    // Check if this is a court card element description (e.g., "Fire of Earth", "Earth of Fire")
    // These are not astrological correspondences - they describe the element quality of the court card
    if (astro.toLowerCase().includes(' of ') && 
        (astro.includes('Fire') || astro.includes('Water') || astro.includes('Air') || astro.includes('Earth'))) {
      // For court cards, show the element combination in a clearer format
      const parts = astro.split(' of ');
      if (parts.length === 2) {
        // Show as "Air/Fire" instead of "a/f" for clarity
        return { icons: [], text: `${parts[0]}/${parts[1]}` };
      }
      return { icons: [], text: astro };
    }

    // List of zodiac signs
    const zodiacSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];

    const zodiacMap: Record<string, string> = {
      'Aries': '♈',
      'Taurus': '♉',
      'Gemini': '♊',
      'Cancer': '♋',
      'Leo': '♌',
      'Virgo': '♍',
      'Libra': '♎',
      'Scorpio': '♏',
      'Sagittarius': '♐',
      'Capricorn': '♑',
      'Aquarius': '♒',
      'Pisces': '♓',
    };

    const planetMap: Record<string, string> = {
      'Sun': '☉',
      'Moon': '☽',
      'Mercury': '☿',
      'Venus': '♀',
      'Mars': '♂',
      'Jupiter': '♃',
      'Saturn': '♄',
      'Uranus': '♅',
      'Neptune': '♆',
      'Pluto': '♇',
    };

    const icons: string[] = [];
    let displayText = astro;

    // Check for planet + sign combinations (e.g., "Mars in Aries")
    const astroLower = astro.toLowerCase();
    const hasPlanetAndSign = astro.includes(' in ');

    if (hasPlanetAndSign) {
      const parts = astro.split(' in ');
      const planetPart = parts[0].trim();
      const signPart = parts[1]?.trim();

      // Get planet icon
      if (planetMap[planetPart]) {
        icons.push(planetMap[planetPart]);
      }

      // Get sign icon
      if (signPart) {
        for (const sign of zodiacSigns) {
          if (signPart.toLowerCase().includes(sign.toLowerCase())) {
            icons.push(zodiacMap[sign]);
            // Keep "in" in the display text
            displayText = `${planetPart} in ${sign}`;
            break;
          }
        }
      }
    } else {
      // Check for zodiac sign first (more specific)
      for (const sign of zodiacSigns) {
        if (astroLower.includes(sign.toLowerCase())) {
          icons.push(zodiacMap[sign]);
          displayText = sign;
          break;
        }
      }

      // If no sign found, check for planet
      if (icons.length === 0) {
        const firstWord = astro.split(' ')[0];
        if (planetMap[firstWord]) {
          icons.push(planetMap[firstWord]);
        }
      }
    }

    // Special cases
    if (astro === 'Beginnings') {
      return { icons: ['✨'], text: astro };
    }

    // If no icons found and text is too long, abbreviate
    if (icons.length === 0 && astro.length > 12) {
      displayText = astro.substring(0, 12 - 3) + '...';
    }

    return { icons, text: displayText };
  };

  return (
    <ThemedCard variant="default" style={styles.cardDisplay}>
      <ThemedText variant="caption" style={styles.cardPosition}>
        {card.position}
      </ThemedText>
      {imageSource && !imageError ? (
        <Image
          source={imageSource}
          style={[
            styles.cardImage,
            card.reversed && styles.cardImageReversed,
          ]}
          resizeMode="contain"
          onError={() => {
            console.warn(`Failed to load image: ${card.filename}`);
            setImageError(true);
          }}
        />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <ThemedText variant="body" style={styles.cardImagePlaceholderText}>
            {card.title}
          </ThemedText>
          {card.reversed && (
            <ThemedText variant="caption" style={styles.cardImagePlaceholderText}>
              (Reversed)
            </ThemedText>
          )}
        </View>
      )}
      <ThemedText variant="h3" style={styles.cardTitle}>
        {card.title}
        {card.reversed && ' (Reversed)'}
      </ThemedText>
      
      {/* Arcana and Suit */}
      <View style={styles.cardMetadataRow}>
        <ThemedText variant="caption" style={styles.cardMetadataText}>
          {card.arcana}
          {card.suit && ` • ${card.suit}`}
        </ThemedText>
      </View>

      {/* Astrological and Elemental Attributes */}
      <View style={styles.cardAttributesContainer}>
        <View style={styles.cardAttribute}>
          <ThemedText variant="caption" style={styles.cardAttributeIcon}>
            {getElementIcon(card.element)}
          </ThemedText>
          <ThemedText variant="caption" style={styles.cardAttributeText} numberOfLines={1}>
            {card.element}
          </ThemedText>
        </View>
        <View style={styles.cardAttribute}>
          {(() => {
            const astroInfo = getAstroInfo(card.astro);
            return (
              <>
                {astroInfo.icons.length > 0 && (
                  <View style={styles.astroIconsContainer}>
                    {astroInfo.icons.map((icon, idx) => (
                      <ThemedText key={idx} variant="caption" style={styles.cardAttributeIcon}>
                        {icon}
                      </ThemedText>
                    ))}
                  </View>
                )}
                <ThemedText 
                  variant="caption" 
                  style={styles.cardAttributeText} 
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {astroInfo.text}
                </ThemedText>
              </>
            );
          })()}
        </View>
      </View>

      {/* Keywords */}
      <ThemedText variant="caption" style={styles.cardKeywords}>
        {card.keywords.join(', ')}
      </ThemedText>
    </ThemedCard>
  );
}

type InterpretationMode = 'traditional' | 'esoteric' | 'jungian';

export default function TarotReadingScreen({ navigation }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'premium' | 'pro' | 'expert'>('free');
  const [spreadType, setSpreadType] = useState<SpreadType>('three-card');
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [question, setQuestion] = useState('');
  const [interpretationMode, setInterpretationMode] = useState<InterpretationMode>('traditional');
  const [interpretation, setInterpretation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await supabaseHelpers.getCurrentUser();
      if (user) {
        setUserId(user.id);
        // Load user tier
        try {
          const tier = await supabaseHelpers.getUserTier(user.id);
          console.log('✅ User tier loaded:', tier);
          setUserTier(tier);
        } catch (tierError) {
          console.error('❌ Failed to load tier:', tierError);
          // For development: default to expert if tier lookup fails
          console.warn('⚠️ Defaulting to expert tier for development');
          setUserTier('expert');
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      // For development: allow unlimited questions even if user load fails
      console.warn('⚠️ Defaulting to expert tier for development');
      setUserTier('expert');
    }
  };

  // Get follow-up question limit based on tier
  const getFollowUpLimit = (): number | null => {
    switch (userTier) {
      case 'free':
        return 3;
      case 'premium':
        return 3;
      case 'pro':
        return 10;
      case 'expert':
        return null; // Unlimited
      default:
        return 3;
    }
  };

  // Count user questions (not assistant responses)
  const getUserQuestionCount = (): number => {
    return followUpMessages.filter(msg => msg.role === 'user').length;
  };

  const drawCards = (count: number): DrawnCard[] => {
    const deck = [...LOCAL_RWS_CARDS];
    const shuffled = [...deck];
    
    // Simple shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const spread = LOCAL_SPREADS[spreadType];
    const drawn: DrawnCard[] = [];

    for (let i = 0; i < count; i++) {
      const card = shuffled[i];
      const reversed = Math.random() < 0.3; // 30% chance of reversal
      const position = spread.positions[i]?.label.en || `Position ${i + 1}`;
      
      drawn.push({
        ...card,
        reversed,
        position,
      });
    }

    return drawn;
  };

  const handleDrawCards = () => {
    const spread = LOCAL_SPREADS[spreadType];
    const cards = drawCards(spread.card_count);
    setDrawnCards(cards);
    setInterpretation('');
    setShowFollowUp(false);
    setFollowUpMessages([]);
  };

  const buildSystemPrompt = (mode: InterpretationMode): string => {
    switch (mode) {
      case 'traditional':
        return `You are an expert Tarot reader with deep knowledge of traditional symbolism and intuitive interpretation.
Your readings are insightful, compassionate, and empowering. You help people gain clarity and perspective.
Provide a **concise** (2-3 paragraphs max) interpretation that weaves the cards together into a meaningful narrative.
Be specific to their question if provided. Use **bold** for key insights and *italic* for emphasis.
Format your response with markdown: use **bold** for important points and *italic* for emphasis.`;

      case 'esoteric':
        return `You are an expert esoteric Tarot reader with deep knowledge of astrological correspondences, elemental relationships, and hermetic symbolism.
Focus on the **astrological and elemental relationships** between the cards. Explain how planetary influences and elemental forces interact.
Discuss correspondences, alchemical processes, and esoteric meanings.
Provide a **concise** (2-3 paragraphs max) interpretation emphasizing these relationships.
Use **bold** for astrological/elemental correspondences and *italic* for esoteric concepts.
Format your response with markdown: use **bold** for correspondences and *italic* for esoteric terms.`;

      case 'jungian':
        return `You are an expert Tarot reader specializing in Jungian psychology, archetypal analysis, and depth psychology.
Focus on **archetypes**, the process of **individuation**, the **collective unconscious**, shadow work, and psychological integration.
Discuss how the cards represent inner processes, psychological patterns, and the journey toward wholeness.
Provide a **concise** (2-3 paragraphs max) interpretation with depth and precision about psychological dynamics.
Use **bold** for archetypes and key psychological concepts, *italic* for inner processes.
Format your response with markdown: use **bold** for archetypes and *italic* for psychological processes.`;

      default:
        return `You are an expert Tarot reader. Provide a concise, insightful interpretation.`;
    }
  };

  const handleGetInterpretation = async () => {
    if (drawnCards.length === 0) {
      Alert.alert('No Cards', 'Please draw cards first.');
      return;
    }

    setIsLoading(true);
    try {
      const spread = LOCAL_SPREADS[spreadType];
      const language = 'en';

      // Build mode-specific system prompt
      const systemPrompt = buildSystemPrompt(interpretationMode);

      // Build user prompt
      let prompt = `Provide a **concise** interpretation for this Tarot reading (2-3 paragraphs maximum):\n\n`;

      if (question.trim()) {
        prompt += `Question: ${question.trim()}\n\n`;
      }

      prompt += `Spread: ${spread.name.en}\n\n`;
      prompt += `Cards Drawn:\n`;

      drawnCards.forEach((card, index) => {
        const reversed = card.reversed ? ' (Reversed)' : '';
        prompt += `${index + 1}. ${card.position}: ${card.title}${reversed}\n`;
        prompt += `   Keywords: ${card.keywords.join(', ')}\n`;
        prompt += `   Element: ${card.element}, Astrology: ${card.astro}\n`;
        const meaning = card.reversed ? card.reversed_meaning.en : card.upright_meaning.en;
        prompt += `   Basic Meaning: ${meaning}\n\n`;
      });

      prompt += `\nProvide a concise, well-formatted interpretation using **bold** for key insights and *italic* for emphasis.`;

      const result = await AIProvider.generate({
        prompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1024, // Reduced for more concise responses
        language: 'en',
      });

      setInterpretation(result.text);
      setShowFollowUp(true);
    } catch (error) {
      console.error('Interpretation failed:', error);
      Alert.alert('Error', 'Failed to generate interpretation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskFollowUp = async () => {
    if (!followUpQuestion.trim()) {
      Alert.alert('Empty Question', 'Please enter a question.');
      return;
    }

    if (!interpretation) {
      Alert.alert('No Reading', 'Please generate an interpretation first.');
      return;
    }

    // Check tier-based limits
    const limit = getFollowUpLimit();
    const questionCount = getUserQuestionCount();
    
    if (limit !== null && questionCount >= limit) {
      Alert.alert(
        'Question Limit Reached',
        `You've reached your limit of ${limit} follow-up questions for the ${userTier} tier. Upgrade to ${userTier === 'free' ? 'Premium' : userTier === 'premium' ? 'Pro' : 'Expert'} for more questions.`
      );
      return;
    }

    setIsLoadingFollowUp(true);

    // Add user message
    const userMessage: FollowUpMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: followUpQuestion.trim(),
      timestamp: new Date(),
    };

    setFollowUpMessages((prev) => [...prev, userMessage]);
    setFollowUpQuestion('');

    try {
      const context = {
        readingId: 'local-reading', // TODO: Use actual reading ID from Supabase
        originalQuestion: question || undefined,
        cards: drawnCards.map((card) => ({
          title: card.title,
          position: card.position,
          reversed: card.reversed,
        })),
        interpretation,
        messages: [...followUpMessages, userMessage],
      };

      const answer = await FollowUpService.askQuestion(context, followUpQuestion.trim());

      const assistantMessage: FollowUpMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      };

      setFollowUpMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Follow-up failed:', error);
      Alert.alert('Error', 'Failed to get answer. Please try again.');
    } finally {
      setIsLoadingFollowUp(false);
    }
  };

  return (
    <MysticalBackground variant="default">
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText variant="h1" style={styles.heading}>
          Tarot Reading
        </ThemedText>

      {/* Spread Selection */}
      <ThemedCard variant="default" style={styles.section}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          Choose Spread
        </ThemedText>
        <View style={styles.spreadButtons}>
          <ThemedButton
            title="Single Card"
            onPress={() => {
              setSpreadType('single-card');
              setDrawnCards([]);
              setInterpretation('');
            }}
            variant={spreadType === 'single-card' ? 'primary' : 'secondary'}
            style={styles.spreadButton}
          />
          <ThemedButton
            title="Three Card"
            onPress={() => {
              setSpreadType('three-card');
              setDrawnCards([]);
              setInterpretation('');
            }}
            variant={spreadType === 'three-card' ? 'primary' : 'secondary'}
            style={styles.spreadButton}
          />
        </View>
      </ThemedCard>

      {/* Question Input (Optional) */}
      <ThemedCard variant="default" style={styles.section}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          Your Question (Optional)
        </ThemedText>
        <TextInput
          style={styles.input}
          placeholder="What would you like guidance on?"
          placeholderTextColor={theme.colors.text.tertiary}
          value={question}
          onChangeText={setQuestion}
          multiline
          numberOfLines={3}
        />
      </ThemedCard>

      {/* Draw Cards Button */}
      <View style={styles.section}>
        <ThemedButton
          title={drawnCards.length > 0 ? "Draw New Cards" : "Draw Cards"}
          onPress={handleDrawCards}
          variant="primary"
        />
      </View>

      {/* Drawn Cards Display */}
      {drawnCards.length > 0 && (
        <ThemedCard variant="elevated" style={styles.section}>
          <ThemedText variant="h2" style={styles.sectionTitle}>
            Cards Drawn
          </ThemedText>
          <View style={styles.cardsContainer}>
            {drawnCards.map((card, index) => (
              <CardDisplay key={index} card={card} index={index} />
            ))}
          </View>
        </ThemedCard>
      )}

      {/* Interpretation Mode Selection */}
      {drawnCards.length > 0 && (
        <ThemedCard variant="default" style={styles.section}>
          <ThemedText variant="h3" style={styles.sectionTitle}>
            Interpretation Style
          </ThemedText>
          <View style={styles.modeButtons}>
            <ThemedButton
              title="Traditional"
              onPress={() => {
                setInterpretationMode('traditional');
                if (interpretation) {
                  setInterpretation('');
                }
              }}
              variant={interpretationMode === 'traditional' ? 'primary' : 'secondary'}
              style={styles.modeButton}
            />
            <ThemedButton
              title="Esoteric"
              onPress={() => {
                setInterpretationMode('esoteric');
                if (interpretation) {
                  setInterpretation('');
                }
              }}
              variant={interpretationMode === 'esoteric' ? 'primary' : 'secondary'}
              style={styles.modeButton}
            />
            <ThemedButton
              title="Jungian"
              onPress={() => {
                setInterpretationMode('jungian');
                if (interpretation) {
                  setInterpretation('');
                }
              }}
              variant={interpretationMode === 'jungian' ? 'primary' : 'secondary'}
              style={styles.modeButton}
            />
          </View>
        </ThemedCard>
      )}

      {/* Get Interpretation Button */}
      {drawnCards.length > 0 && !interpretation && (
        <View style={styles.section}>
          <ThemedButton
            title={`Get ${interpretationMode.charAt(0).toUpperCase() + interpretationMode.slice(1)} Interpretation`}
            onPress={handleGetInterpretation}
            variant="primary"
            disabled={isLoading}
          />
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary.gold} />
              <ThemedText variant="body" style={styles.loadingText}>
                Generating {interpretationMode} interpretation...
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Interpretation Display */}
      {interpretation && (
        <ThemedCard variant="elevated" style={styles.section}>
          <ThemedText variant="h2" style={styles.sectionTitle}>
            Interpretation ({interpretationMode.charAt(0).toUpperCase() + interpretationMode.slice(1)})
          </ThemedText>
          <View style={styles.interpretationBox}>
            <FormattedText 
              text={interpretation} 
              style={styles.interpretationText}
            />
          </View>
          {/* Regenerate button for current mode */}
          <View style={styles.regenerateButton}>
            <ThemedButton
              title={`Regenerate (${interpretationMode})`}
              onPress={handleGetInterpretation}
              variant="secondary"
              disabled={isLoading}
            />
          </View>
        </ThemedCard>
      )}

      {/* Follow-up Questions */}
      {showFollowUp && interpretation && (() => {
        const limit = getFollowUpLimit();
        const questionCount = getUserQuestionCount();
        const remaining = limit !== null ? limit - questionCount : null;
        const canAskMore = limit === null || questionCount < limit;
        
        return (
          <ThemedCard variant="elevated" style={styles.section}>
            <ThemedText variant="h2" style={styles.sectionTitle}>
              Ask a Question
            </ThemedText>
            <ThemedText variant="body" style={styles.followUpHint}>
              Ask anything about your reading for deeper insights.
              {limit !== null && (
                <ThemedText variant="caption" style={styles.followUpLimitText}>
                  {' '}({remaining} {remaining === 1 ? 'question' : 'questions'} remaining - Tier: {userTier})
                </ThemedText>
              )}
              {limit === null && (
                <ThemedText variant="caption" style={styles.followUpLimitText}>
                  {' '}(Unlimited questions - Tier: {userTier})
                </ThemedText>
              )}
            </ThemedText>
            
            <TextInput
              style={styles.input}
              placeholder="What would you like to know more about?"
              placeholderTextColor={theme.colors.text.tertiary}
              value={followUpQuestion}
              onChangeText={setFollowUpQuestion}
              multiline
              numberOfLines={2}
            />
            
            <ThemedButton
              title="Ask"
              onPress={handleAskFollowUp}
              variant="primary"
              disabled={isLoadingFollowUp || !followUpQuestion.trim() || !canAskMore}
              style={styles.askButton}
            />
            
            {isLoadingFollowUp && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary.gold} />
              </View>
            )}

            {/* Follow-up Messages */}
            {followUpMessages.length > 0 && (
              <View style={styles.messagesContainer}>
                {followUpMessages.map((msg) => (
                  <ThemedCard
                    key={msg.id}
                    variant="minimal"
                    style={[
                      styles.message,
                      msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
                    ]}
                  >
                    <ThemedText variant="body" style={styles.messageText}>
                      {msg.content}
                    </ThemedText>
                  </ThemedCard>
                ))}
              </View>
            )}
          </ThemedCard>
        );
      })()}

      <View style={styles.backButton}>
        <ThemedButton
          title="Back to Home"
          onPress={() => navigation.navigate('Home')}
          variant="ghost"
        />
      </View>
      </ScrollView>
    </MysticalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: theme.spacing.spacing.lg,
  },
  heading: {
    marginBottom: theme.spacing.spacing.xl,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.spacing.md,
  },
  spreadButtons: {
    flexDirection: 'row',
    gap: theme.spacing.spacing.md,
  },
  spreadButton: {
    flex: 1,
  },
  input: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderWidth: 1,
    borderColor: theme.colors.primary.gold,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: theme.spacing.spacing.md,
  },
  cardDisplay: {
    padding: theme.spacing.spacing.md,
    marginBottom: theme.spacing.spacing.md,
    width: '45%',
    minWidth: 140,
    alignItems: 'center',
  },
  cardPosition: {
    marginBottom: theme.spacing.spacing.sm,
    textAlign: 'center',
    color: theme.colors.text.secondary,
  },
  cardImage: {
    width: '100%',
    height: 240,
    borderRadius: theme.spacing.borderRadius.md,
    marginBottom: theme.spacing.spacing.sm,
  },
  cardImageReversed: {
    transform: [{ rotate: '180deg' }],
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: theme.colors.neutrals.midGray,
    borderRadius: theme.spacing.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.sm,
  },
  cardImagePlaceholderText: {
    textAlign: 'center',
    padding: theme.spacing.spacing.sm,
    color: theme.colors.text.tertiary,
  },
  cardTitle: {
    marginBottom: theme.spacing.spacing.xs,
    textAlign: 'center',
  },
  cardMetadataRow: {
    marginBottom: theme.spacing.spacing.sm,
  },
  cardMetadataText: {
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.text.tertiary,
  },
  cardAttributesContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: theme.spacing.spacing.xs,
    marginBottom: theme.spacing.spacing.xs,
    paddingVertical: theme.spacing.spacing.xs,
    paddingHorizontal: theme.spacing.spacing.xs,
    backgroundColor: theme.colors.neutrals.midGray,
    borderRadius: theme.spacing.borderRadius.sm,
    width: '100%',
  },
  cardAttribute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.spacing.xs,
    flexWrap: 'wrap',
  },
  astroIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardAttributeIcon: {
    fontSize: 12,
    lineHeight: 14,
  },
  cardAttributeText: {
    fontSize: 9,
    color: theme.colors.text.secondary,
    flexShrink: 1,
    flex: 1,
    textAlign: 'center',
  },
  cardKeywords: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.spacing.md,
    gap: theme.spacing.spacing.sm,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  interpretationBox: {
    backgroundColor: theme.colors.neutrals.darkGray,
    padding: theme.spacing.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.gold,
  },
  interpretationText: {
    color: theme.colors.text.primary,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.spacing.sm,
    flexWrap: 'wrap',
  },
  modeButton: {
    flex: 1,
    minWidth: 100,
  },
  regenerateButton: {
    marginTop: theme.spacing.spacing.md,
  },
  followUpHint: {
    marginBottom: theme.spacing.spacing.md,
    fontStyle: 'italic',
    color: theme.colors.text.secondary,
  },
  followUpLimitText: {
    color: theme.colors.primary.gold,
  },
  askButton: {
    marginTop: theme.spacing.spacing.sm,
  },
  messagesContainer: {
    marginTop: theme.spacing.spacing.md,
    gap: theme.spacing.spacing.md,
  },
  message: {
    padding: theme.spacing.spacing.md,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary.crimsonDark,
    borderColor: theme.colors.primary.gold,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.neutrals.darkGray,
    borderColor: theme.colors.primary.gold,
  },
  messageText: {
    color: theme.colors.text.primary,
  },
  backButton: {
    marginTop: theme.spacing.spacing.lg,
    marginBottom: theme.spacing.spacing.lg,
  },
});
