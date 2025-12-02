// src/systems/tarot/utils/cardHelpers.ts
import { getLocale } from '../../../i18n';
import type { LocalTarotCard } from '../data/localCardData';
import { translateElement, translateAstro } from './translationHelpers';

export function getLocalizedCard(card: LocalTarotCard) {
  const currentLocale = getLocale();
  const locale = currentLocale === 'zh-TW' ? 'zh' : 'en';
  
  // Keywords are in English in card data - use directly
  // Translation of keywords can be added in Phase 2 when we have full coverage
  const localizedKeywords = card.keywords;
  
  const translatedElement = translateElement(card.element);
  const translatedAstro = translateAstro(card.astro);
  
  return {
    title: typeof card.title === 'string' ? card.title : card.title[locale] || card.title.en,
    uprightMeaning: card.upright_meaning[locale] || card.upright_meaning.en,
    reversedMeaning: card.reversed_meaning[locale] || card.reversed_meaning.en,
    description: card.description?.[locale] || card.description?.en || '',
    keywords: localizedKeywords,
    element: translatedElement,
    astro: translatedAstro,
  };
}

