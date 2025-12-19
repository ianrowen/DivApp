// src/systems/tarot/utils/cardHelpers.ts
import { getLocale } from '../../../i18n';
import type { LocalTarotCard } from '../data/localCardData';
import { translateElement, translateAstro, translateKeyword } from './translationHelpers';

export function getLocalizedCard(card: LocalTarotCard) {
  const currentLocale = getLocale();
  const locale = currentLocale === 'zh-TW' ? 'zh' : 'en';
  const isChinese = currentLocale === 'zh-TW';
  
  // Translate keywords if Chinese locale
  // Ensure keywords array exists and is valid
  const originalKeywords = (card.keywords && Array.isArray(card.keywords) && card.keywords.length > 0)
    ? card.keywords
    : [];
  
  const localizedKeywords = isChinese && originalKeywords.length > 0
    ? originalKeywords.map(kw => {
        if (!kw || typeof kw !== 'string') {
          console.warn(`⚠️ Invalid keyword found:`, kw);
          return kw || '';
        }
        const translated = translateKeyword(kw);
        // Suppress missing translation warnings - fallback to English works fine
        // Only log in dev mode if needed for debugging
        // if (translated === kw && isChinese && __DEV__) {
        //   console.log(`⚠️ Keyword translation missing for: "${kw}"`);
        // }
        // Always return something - prefer translated, fallback to original
        const result = translated && translated.trim().length > 0 ? translated : kw;
        return result;
      }).filter(kw => kw && typeof kw === 'string' && kw.trim().length > 0) // Filter out empty strings
    : originalKeywords;
  
  // Final safety check - ensure we always return keywords if original had them
  const finalKeywords = (localizedKeywords && localizedKeywords.length > 0) 
    ? localizedKeywords 
    : originalKeywords; // Fallback to original if translation removed everything
  
  const translatedElement = translateElement(card.element);
  const translatedAstro = translateAstro(card.astro);
  
  return {
    title: typeof card.title === 'string' ? card.title : card.title[locale] || card.title.en,
    uprightMeaning: card.upright_meaning[locale] || card.upright_meaning.en,
    reversedMeaning: card.reversed_meaning[locale] || card.reversed_meaning.en,
    description: card.description?.[locale] || card.description?.en || '',
    keywords: finalKeywords, // Use finalKeywords with safety fallback
    element: translatedElement,
    astro: translatedAstro,
  };
}

