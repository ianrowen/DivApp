// src/shared/theme/typography.ts
/**
 * Divin8 Typography System
 * 
 * Based on the Divin8 Design System Specification v1.0.0
 * 
 * The typography system uses Cinzel for headings (mystical, authoritative)
 * and Lato for body text (readable, modern). The system emphasizes readability
 * while maintaining the mystical aesthetic.
 * 
 * @module typography
 */

import { TextStyle } from 'react-native';
import colors from './colors';

/**
 * Font family definitions
 * 
 * Note: Fonts must be loaded via expo-font before use:
 * @example
 * ```bash
 * npx expo install expo-font @expo-google-fonts/cinzel @expo-google-fonts/lato
 * ```
 */
export const fontFamily = {
  /**
   * Cinzel - Elegant serif font for headings
   * Mystical, authoritative, perfect for Tarot and divination
   * Used for: All headings (h1, h2, h3)
   * 
   * IMPORTANT: Cinzel only has weights 400 (Regular), 500 (Medium), and 600 (SemiBold) available.
   * For 'bold' (700) requests, use 600 (SemiBold) as the closest available weight.
   */
  heading: 'Cinzel',
  
  /**
   * Lato - Clean sans-serif font for body text
   * Readable, modern, excellent for long-form content
   * Used for: Body text, captions, labels
   */
  body: 'Lato',
  
  /**
   * Courier - Monospace font for technical information
   * Used for: Code, technical data, optional use cases
   */
  monospace: 'Courier',
} as const;

/**
 * Font size scale
 * Base unit system for consistent typography hierarchy
 */
export const fontSize = {
  /**
   * Extra small - 12px
   * Used for: Captions, fine print, metadata
   */
  xs: 12,
  
  /**
   * Small - 14px
   * Used for: Secondary text, labels, small buttons
   */
  sm: 14,
  
  /**
   * Medium - 16px
   * Used for: Body text (default), standard text
   */
  md: 16,
  
  /**
   * Large - 20px
   * Used for: Subheadings (h3), emphasized text
   */
  lg: 20,
  
  /**
   * Extra large - 24px
   * Used for: Section headings (h2), important titles
   */
  xl: 24,
  
  /**
   * 2X Large - 32px
   * Used for: Page titles (h1), major headings
   */
  xxl: 32,
  
  /**
   * 3X Large - 40px
   * Used for: Hero text, splash screens, special occasions
   */
  xxxl: 40,
} as const;

/**
 * Font weight scale
 * Defines text weight for emphasis and hierarchy
 * 
 * NOTE: Cinzel font family maxes out at 600 (SemiBold).
 * For 'bold' (700) requests when using Cinzel, use 600 (SemiBold) instead.
 * Lato supports all weights including 700 (Bold).
 */
export const fontWeight = {
  /**
   * Normal - 400
   * Used for: Body text, default weight
   * Available in: Cinzel, Lato
   */
  normal: '400' as const,
  
  /**
   * Medium - 500
   * Used for: Subheadings, emphasized body text
   * Available in: Cinzel, Lato
   */
  medium: '500' as const,
  
  /**
   * Semibold - 600
   * Used for: Headings, important labels
   * Available in: Cinzel (max weight), Lato
   * Note: This is the maximum weight available for Cinzel font family
   */
  semibold: '600' as const,
  
  /**
   * Bold - 700
   * Used for: Strong emphasis, primary headings
   * Available in: Lato only
   * Note: For Cinzel headings, use 600 (SemiBold) as the closest available weight
   */
  bold: '700' as const,
} as const;

/**
 * Line height scale
 * Controls vertical rhythm and readability
 */
export const lineHeight = {
  /**
   * Tight - 1.2
   * Used for: Headings, short text blocks
   * Creates compact, impactful headings
   */
  tight: 1.2,
  
  /**
   * Normal - 1.5
   * Used for: Body text, standard content
   * Balanced readability and space efficiency
   */
  normal: 1.5,
  
  /**
   * Relaxed - 1.75
   * Used for: Long-form reading, paragraphs
   * Improves readability for extended content
   */
  relaxed: 1.75,
} as const;

/**
 * Common text style presets
 * Pre-configured text styles for common use cases
 * These combine font family, size, weight, color, and spacing
 */
export const textStyles = {
  /**
   * Page title / Hero heading
   * Large, centered, gold text with mystical elegance
   * Used for: Main page titles, hero sections
   */
  h1: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary, // Gold
    letterSpacing: 1,
    textAlign: 'center' as const,
    lineHeight: fontSize.xxl * lineHeight.tight,
  } as TextStyle,

  /**
   * Section heading
   * Medium-large, gold text with subtle letter spacing
   * Used for: Section titles, major content divisions
   */
  h2: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary, // Gold
    letterSpacing: 0.5,
    lineHeight: fontSize.xl * lineHeight.tight,
  } as TextStyle,

  /**
   * Subheading
   * Medium size, lighter gold for hierarchy
   * Used for: Subsections, card titles, emphasized labels
   */
  h3: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.primary.goldLight,
    lineHeight: fontSize.lg * lineHeight.tight,
  } as TextStyle,

  /**
   * Body text
   * Standard readable text in silver/gray
   * Used for: Paragraphs, descriptions, main content
   */
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    color: colors.neutrals.lightGray, // Silver
    lineHeight: fontSize.md * lineHeight.normal, // 24px
  } as TextStyle,

  /**
   * Caption / Metadata
   * Small, dimmed text for secondary information
   * Used for: Captions, timestamps, fine print, metadata
   */
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    color: colors.text.tertiary,
    lineHeight: fontSize.xs * lineHeight.normal, // ~16px
  } as TextStyle,
} as const;

/**
 * Complete typography system
 * Exports all typography definitions in a single object
 */
export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textStyles,
} as const;

/**
 * Default export - Main typography system object
 */
export default typography;

/**
 * Type definitions for typography values
 */
export type FontFamily = typeof fontFamily[keyof typeof fontFamily];
export type FontSize = typeof fontSize[keyof typeof fontSize];
export type FontWeight = typeof fontWeight[keyof typeof fontWeight];
export type LineHeight = typeof lineHeight[keyof typeof lineHeight];
export type TextStylePreset = keyof typeof textStyles;

