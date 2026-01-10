// src/shared/components/CardDetailModal.tsx
import React from 'react';
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../theme';
import ThemedText from './ui/ThemedText';
import ThemedCard from './ui/ThemedCard';
import { useTranslation } from '../../i18n';
import type { LocalTarotCard } from '../../systems/tarot/data/localCardData';
import { getLocalizedCard } from '../../systems/tarot/utils/cardHelpers';
import { getCardImage } from '../../systems/tarot/utils/cardImageLoader';

interface CardDetailModalProps {
  visible: boolean;
  onClose: () => void;
  card: LocalTarotCard;
  reversed?: boolean;
}

export default function CardDetailModal({
  visible,
  onClose,
  card,
  reversed = false,
}: CardDetailModalProps) {
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const localizedCard = getLocalizedCard(card);

  // Themed symbol mappings
  const ELEMENT_DATA: { [key: string]: { symbol: string; color: string } } = {
    'Fire': { symbol: '🜂', color: theme.colors.semantic.error },
    'Water': { symbol: '🜄', color: theme.colors.primary.gold },
    'Air': { symbol: '🜁', color: theme.colors.text.secondary },
    'Earth': { symbol: '🜃', color: theme.colors.primary.goldDark },
  };

  const PLANET_DATA: { [key: string]: { symbol: string; color: string } } = {
    'Sun': { symbol: '☉', color: theme.colors.primary.goldLight },
    'Moon': { symbol: '☽', color: theme.colors.text.secondary },
    'Mercury': { symbol: '☿', color: theme.colors.primary.goldDark },
    'Venus': { symbol: '♀', color: theme.colors.primary.gold },
    'Mars': { symbol: '♂', color: theme.colors.semantic.error },
    'Jupiter': { symbol: '♃', color: theme.colors.primary.goldLight },
    'Saturn': { symbol: '♄', color: theme.colors.text.tertiary },
    'Uranus': { symbol: '♅', color: theme.colors.primary.gold },
    'Neptune': { symbol: '♆', color: theme.colors.text.secondary },
    'Pluto': { symbol: '♇', color: theme.colors.neutrals.midGray },
  };

  const ZODIAC_DATA: { [key: string]: { symbol: string; color: string } } = {
    'Aries': { symbol: '♈', color: theme.colors.semantic.error },
    'Taurus': { symbol: '♉', color: theme.colors.primary.goldDark },
    'Gemini': { symbol: '♊', color: theme.colors.primary.gold },
    'Cancer': { symbol: '♋', color: theme.colors.text.secondary },
    'Leo': { symbol: '♌', color: theme.colors.primary.goldLight },
    'Virgo': { symbol: '♍', color: theme.colors.primary.goldDark },
    'Libra': { symbol: '♎', color: theme.colors.primary.gold },
    'Scorpio': { symbol: '♏', color: theme.colors.semantic.error },
    'Sagittarius': { symbol: '♐', color: theme.colors.primary.goldLight },
    'Capricorn': { symbol: '♑', color: theme.colors.neutrals.midGray },
    'Aquarius': { symbol: '♒', color: theme.colors.primary.gold },
    'Pisces': { symbol: '♓', color: theme.colors.text.secondary },
  };

  function getAstroData(astro: string): { symbols: string[]; colors: string[] } | null {
    const symbols: string[] = [];
    const colors: string[] = [];
    
    // Check for court card elements like "Fire of Earth", "Earth of Fire"
    // These should show both element symbols
    if (astro.includes(' of ')) {
      const parts = astro.split(' of ');
      if (parts.length === 2) {
        const elem1 = parts[0]?.trim();
        const elem2 = parts[1]?.trim();
        
        // Get first element icon
        if (elem1 && ELEMENT_DATA[elem1]) {
          symbols.push(ELEMENT_DATA[elem1].symbol);
          colors.push(ELEMENT_DATA[elem1].color);
        }
        
        // Get second element icon
        if (elem2 && ELEMENT_DATA[elem2]) {
          symbols.push(ELEMENT_DATA[elem2].symbol);
          colors.push(ELEMENT_DATA[elem2].color);
        }
        
        if (symbols.length > 0) {
          return { symbols, colors };
        }
      }
    }
    
    // Check for compound astro like "Sun in Aries" - get both planet and zodiac
    if (astro.includes(' in ')) {
      const parts = astro.split(' in ');
      const planet = parts[0]?.trim();
      const sign = parts[1]?.trim();
      
      // Get planet icon
      if (planet && PLANET_DATA[planet]) {
        symbols.push(PLANET_DATA[planet].symbol);
        colors.push(PLANET_DATA[planet].color);
      }
      
      // Get zodiac icon
      if (sign && ZODIAC_DATA[sign]) {
        symbols.push(ZODIAC_DATA[sign].symbol);
        colors.push(ZODIAC_DATA[sign].color);
      }
      
      if (symbols.length > 0) {
        return { symbols, colors };
      }
    }
    
    // Check for planet
    for (const [planet, data] of Object.entries(PLANET_DATA)) {
      if (astro.includes(planet)) {
        return { symbols: [data.symbol], colors: [data.color] };
      }
    }
    
    // Check for zodiac
    for (const [sign, data] of Object.entries(ZODIAC_DATA)) {
      if (astro.includes(sign)) {
        return { symbols: [data.symbol], colors: [data.color] };
      }
    }
    
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <ThemedText variant="h2" style={styles.headerTitle}>
            {localizedCard.title}
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText variant="h3" style={styles.closeText}>
              ✕
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Card Image */}
          <View style={styles.imageContainer}>
            <Image
              source={getCardImage(card.code)}
              style={[
                styles.cardImage,
                reversed && styles.cardImageReversed,
              ]}
              resizeMode="contain"
            />
          </View>

          {/* Card Metadata */}
          <View style={styles.metadata}>
            <ThemedText variant="body" style={styles.metadataText}>
              {card.arcana === 'Major' 
                ? `${locale === 'zh-TW' ? '大阿爾克那' : 'Major Arcana'} • ${locale === 'zh-TW' ? '牌' : 'Card'} ${card.code}`
                : `${card.suit || ''} • ${locale === 'zh-TW' ? '小阿爾克那' : 'Minor Arcana'}`
              }
            </ThemedText>
          </View>

          {/* Keywords */}
          <ThemedCard variant="default" style={styles.section}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {locale === 'zh-TW' ? '關鍵字' : 'Keywords'}
            </ThemedText>
            <View style={styles.keywordsContainer}>
              {localizedCard.keywords.map((keyword, idx) => (
                <View key={idx} style={styles.keywordBadge}>
                  <ThemedText variant="caption" style={styles.keywordText}>
                    {keyword}
                  </ThemedText>
                </View>
              ))}
            </View>
          </ThemedCard>

          {/* Description */}
          {localizedCard.description && (
            <ThemedCard variant="default" style={styles.section}>
              <ThemedText variant="h3" style={styles.sectionTitle}>
                {locale === 'zh-TW' ? '描述' : 'Description'}
              </ThemedText>
              <ThemedText variant="body" style={styles.bodyText}>
                {localizedCard.description}
              </ThemedText>
            </ThemedCard>
          )}

          {/* Meanings */}
          <ThemedCard variant="default" style={styles.section}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {locale === 'zh-TW' ? '正位含義' : 'Upright Meaning'}
            </ThemedText>
            <ThemedText variant="body" style={styles.bodyText}>
              {localizedCard.uprightMeaning}
            </ThemedText>
          </ThemedCard>

          <ThemedCard variant="default" style={styles.section}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {locale === 'zh-TW' ? '逆位含義' : 'Reversed Meaning'}
            </ThemedText>
            <ThemedText variant="body" style={styles.bodyText}>
              {localizedCard.reversedMeaning}
            </ThemedText>
          </ThemedCard>

          {/* Correspondences */}
          <ThemedCard variant="default" style={styles.section}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {locale === 'zh-TW' ? '對應關係' : 'Correspondences'}
            </ThemedText>
            
            {localizedCard.element && (
              <View style={styles.correspondenceRow}>
                <ThemedText variant="body" style={styles.correspondenceLabel}>
                  {t('tarot.correspondences.element')}:
                </ThemedText>
                <View style={styles.correspondenceValueRow}>
                  {(() => {
                    // For court cards, show both elements from astro (e.g., "Fire of Earth")
                    if (card.arcana === 'Court' && card.astro && card.astro.includes(' of ')) {
                      const parts = card.astro.split(' of ');
                      const elem1 = parts[0]?.trim();
                      const elem2 = parts[1]?.trim();
                      return (
                        <>
                          {elem1 && ELEMENT_DATA[elem1] && (
                            <ThemedText 
                              variant="body" 
                              style={[
                                styles.correspondenceSymbol,
                                { color: ELEMENT_DATA[elem1].color }
                              ]}
                            >
                              {ELEMENT_DATA[elem1].symbol}
                            </ThemedText>
                          )}
                          {elem2 && ELEMENT_DATA[elem2] && (
                            <ThemedText 
                              variant="body" 
                              style={[
                                styles.correspondenceSymbol,
                                { color: ELEMENT_DATA[elem2].color }
                              ]}
                            >
                              {ELEMENT_DATA[elem2].symbol}
                            </ThemedText>
                          )}
                        </>
                      );
                    }
                    // For non-court cards, show single element
                    if (card.element && ELEMENT_DATA[card.element]) {
                      return (
                        <ThemedText 
                          variant="body" 
                          style={[
                            styles.correspondenceSymbol,
                            { color: ELEMENT_DATA[card.element].color }
                          ]}
                        >
                          {ELEMENT_DATA[card.element].symbol}
                        </ThemedText>
                      );
                    }
                    return null;
                  })()}
                  <ThemedText variant="body" style={styles.correspondenceValue}>
                    {card.arcana === 'Court' && localizedCard.astro 
                      ? localizedCard.astro  // For court cards, show both elements (e.g., "Fire 的 Earth")
                      : localizedCard.element // For other cards, show single element
                    }
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Only show astrology for Major and Minor arcana, not Court cards */}
            {/* Court cards show both elements in the Element line instead */}
            {localizedCard.astro && card.arcana !== 'Court' && (
              <View style={styles.correspondenceRow}>
                <ThemedText variant="body" style={styles.correspondenceLabel}>
                  {t('tarot.correspondences.astrology')}:
                </ThemedText>
                <View style={styles.correspondenceValueRow}>
                  {(() => {
                    // Use original card.astro for icon lookup (English), but display translated text
                    const astroData = card.astro ? getAstroData(card.astro) : null;
                    return astroData ? (
                      <>
                        {astroData.symbols.map((symbol, index) => (
                          <ThemedText 
                            key={index}
                            variant="body" 
                            style={[
                              styles.correspondenceSymbol,
                              { color: astroData.colors[index] || theme.colors.text.primary }
                            ]}
                          >
                            {symbol}
                          </ThemedText>
                        ))}
                      </>
                    ) : null;
                  })()}
                  <ThemedText variant="body" style={styles.correspondenceValue}>
                    {localizedCard.astro}
                  </ThemedText>
                </View>
              </View>
            )}

            {card.numerology && (
              <View style={styles.correspondenceRow}>
                <ThemedText variant="body" style={styles.correspondenceLabel}>
                  {t('tarot.correspondences.numerology')}:
                </ThemedText>
                <ThemedText variant="body" style={styles.correspondenceValue}>
                  {card.numerology}
                </ThemedText>
              </View>
            )}
          </ThemedCard>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutrals.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.spacing.lg,
    paddingVertical: theme.spacing.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.goldDark,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.primary.gold,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: theme.colors.text.secondary,
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.spacing.lg,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.lg,
    position: 'relative',
  },
  cardImage: {
    width: 240,
    height: 420,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary.gold,
  },
  cardImageReversed: {
    transform: [{ rotate: '180deg' }],
  },
  metadata: {
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.lg,
  },
  metadataText: {
    color: theme.colors.text.secondary,
  },
  section: {
    marginBottom: theme.spacing.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.primary.goldLight,
    marginBottom: theme.spacing.spacing.sm,
  },
  bodyText: {
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.spacing.xs,
  },
  keywordBadge: {
    backgroundColor: theme.colors.neutrals.midGray,
    paddingHorizontal: theme.spacing.spacing.sm,
    paddingVertical: theme.spacing.spacing.xs,
    borderRadius: theme.spacing.borderRadius.sm,
  },
  keywordText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.md,
  },
  correspondenceRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.spacing.xs,
  },
  correspondenceLabel: {
    color: theme.colors.text.secondary,
    width: 100,
  },
  correspondenceValue: {
    flex: 1,
    color: theme.colors.text.primary,
  },
  correspondenceValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.spacing.xs,
  },
  correspondenceSymbol: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  bottomSpacer: {
    height: theme.spacing.spacing.xxl,
  },
});