// src/systems/tarot/utils/translationHelpers.ts
/**
 * Translation helper utilities for Tarot card metadata
 * 
 * Provides functions to translate keywords, astrology, elements, etc.
 * with fallback to original text if translation not found.
 */

import { i18n, getLocale } from '../../../i18n';

/**
 * Translate a keyword, falling back to original if no translation exists
 * 
 * @param keyword - The keyword to translate (e.g., "Innocence", "Beginnings")
 * @returns Translated keyword or original if translation not found
 */
export function translateKeyword(keyword: string): string {
  const normalized = keyword
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  const key = `tarot.keywords.${normalized}`;
  
  try {
    const translated = i18n.t(key as any);
    
    if (translated && translated !== key && !translated.startsWith('[missing')) {
      return translated;
    }
  } catch (error) {
    console.warn(`Translation failed for keyword: ${keyword}`, error);
  }
  
  return keyword;
}

/**
 * Translate astrology correspondence (planet or sign)
 * 
 * @param astro - The astrological correspondence (e.g., "Uranus", "Leo", "Sun in Aries")
 * @returns Translated astrology or original if translation not found
 */
export function translateAstro(astro: string): string {
  const locale = getLocale();
  const isChinese = locale === 'zh-TW';
  
  // Get connector words based on locale
  const inConnector = isChinese ? i18n.t('tarot.correspondences.in') : 'in';
  const ofConnector = isChinese ? i18n.t('tarot.correspondences.of') : 'of';
  
  // Handle compound astro like "Sun in Aries" or "Mars in Leo"
  if (astro.includes(' in ')) {
    const parts = astro.split(' in ');
    const planet = parts[0]?.trim();
    const sign = parts[1]?.trim();
    
    if (planet && sign) {
      const translatedPlanet = translatePlanet(planet);
      const translatedSign = translateZodiac(sign);
      return `${translatedPlanet} ${inConnector} ${translatedSign}`;
    }
  }
  
  // Handle court card elements like "Fire of Earth", "Earth of Fire"
  if (astro.includes(' of ')) {
    const parts = astro.split(' of ');
    if (parts.length === 2) {
      const elem1 = translateElement(parts[0].trim());
      const elem2 = translateElement(parts[1].trim());
      return `${elem1} ${ofConnector} ${elem2}`;
    }
  }
  
  // Try translating as single planet
  const planetTranslated = translatePlanet(astro);
  if (planetTranslated !== astro) {
    return planetTranslated;
  }
  
  // Try translating as single zodiac sign
  const zodiacTranslated = translateZodiac(astro);
  if (zodiacTranslated !== astro) {
    return zodiacTranslated;
  }
  
  // Return as-is if no translation found
  return astro;
}

/**
 * Translate a planet name
 * 
 * @param planet - Planet name (e.g., "Mercury", "Venus")
 * @returns Translated planet name or original if translation not found
 */
export function translatePlanet(planet: string): string {
  if (!planet) return planet;
  
  const key = `tarot.planets.${planet.toLowerCase()}`;
  try {
    const translated = i18n.t(key as any);
    // Check if translation exists (doesn't start with [missing)
    if (translated && translated !== key && !translated.startsWith('[missing')) {
      return translated;
    }
  } catch (error) {
    console.warn(`Planet translation failed for: ${planet}`);
  }
  
  return planet;
}

/**
 * Translate element
 * 
 * @param element - Element name (e.g., "Fire", "Water", "Air", "Earth")
 * @returns Translated element or original if translation not found
 */
export function translateElement(element: string): string {
  const key = `tarot.elements.${element.toLowerCase()}`;
  try {
    const translated = i18n.t(key as any);
    return translated === key ? element : translated;
  } catch {
    return element;
  }
}

/**
 * Translate zodiac sign
 * 
 * @param sign - Zodiac sign (e.g., "Aries", "Taurus")
 * @returns Translated zodiac sign or original if translation not found
 */
export function translateZodiac(sign: string): string {
  if (!sign) return sign;
  
  const key = `tarot.zodiac.${sign.toLowerCase()}`;
  try {
    const translated = i18n.t(key as any);
    if (translated && translated !== key && !translated.startsWith('[missing')) {
      return translated;
    }
  } catch (error) {
    console.warn(`Zodiac translation failed for: ${sign}`);
  }
  
  return sign;
}

/**
 * Translate arcana type
 * 
 * @param arcana - Arcana type ("Major", "Minor", "Court")
 * @returns Translated arcana type or original if translation not found
 */
export function translateArcana(arcana: string): string {
  const key = `tarot.arcana.${arcana.toLowerCase()}`;
  try {
    const translated = i18n.t(key as any);
    return translated === key ? arcana : translated;
  } catch {
    return arcana;
  }
}

/**
 * Translate suit name
 * 
 * @param suit - Suit name ("Wands", "Cups", "Swords", "Pentacles")
 * @returns Translated suit name or original if translation not found
 */
export function translateSuit(suit: string): string {
  const key = `tarot.suits.${suit.toLowerCase()}`;
  try {
    const translated = i18n.t(key as any);
    return translated === key ? suit : translated;
  } catch {
    return suit;
  }
}

/**
 * Translate court rank
 * 
 * @param rank - Court rank ("Page", "Knight", "Queen", "King")
 * @returns Translated court rank or original if translation not found
 */
export function translateCourtRank(rank: string): string {
  const key = `tarot.courtRanks.${rank.toLowerCase()}`;
  try {
    const translated = i18n.t(key as any);
    return translated === key ? rank : translated;
  } catch {
    return rank;
  }
}

