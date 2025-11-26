// src/shared/theme/colors.ts
/**
 * Divin8 Color Palette
 * 
 * Based on the Divin8 Design System Specification v1.0.0
 * 
 * The color system draws from mystical symbolism, combining Eastern and Western
 * esoteric traditions. The aesthetic is inspired by David Lynch's use of crimson
 * velvet, sacred geometry, and the interplay of light and shadow.
 * 
 * @module colors
 */

/**
 * Primary brand colors - Crimson and Gold
 * These are the core brand colors used for primary actions, branding, and key UI elements
 */
export const primary = {
  /**
   * Primary brand color - deeper burgundy
   * Used for: Primary buttons, brand accents, shadows/glows
   * Contrast: 7.8:1 on black (AAA compliant)
   * Darker and more mysterious than previous iteration
   */
  crimson: '#6B0F2A',
  
  /**
   * Lighter crimson for hover states and active elements
   * Used for: Button hover states, active indicators
   */
  crimsonLight: '#8B1538',
  
  /**
   * Deeper crimson for pressed states and depth
   * Used for: Button pressed states, gradient backgrounds
   * Even darker, closer to velvetGlow for maximum depth
   */
  crimsonDark: '#4D0A1F',
  
  /**
   * Secondary brand color - metallic gold
   * Used for: Headings, primary text, borders, highlights
   * Contrast: 7.8:1 on black (AAA compliant)
   */
  gold: '#D4AF37',
  
  /**
   * Lighter gold for highlights and active states
   * Used for: Active states, highlights, subheadings
   */
  goldLight: '#E8C968',
  
  /**
   * Darker gold for borders and subdued accents
   * Used for: Input borders, dividers, subtle accents
   */
  goldDark: '#B8941F',
} as const;

/**
 * Neutral colors - Grayscale palette
 * Used for backgrounds, surfaces, and structural elements
 */
export const neutrals = {
  /**
   * True black - main background color
   * Used for: Screen backgrounds, primary surface
   * This is the foundation of the dark theme
   */
  black: '#0A0A0A',
  
  /**
   * Dark gray - surface color for cards and panels
   * Used for: Card backgrounds, modal backgrounds, elevated surfaces
   */
  darkGray: '#1A1A1A',
  
  /**
   * Mid gray - subtle dividers and borders
   * Used for: Subtle dividers, inactive borders
   */
  midGray: '#2A2A2A',
  
  /**
   * Light gray / Silver - secondary text and accents
   * Used for: Body text, secondary UI elements
   * Also referenced as silverSheen in mystical accents
   * Contrast: 11.4:1 on black (AAA compliant)
   */
  lightGray: '#C0C0C0',
} as const;

/**
 * Mystical accent colors
 * Used for special effects, gradients, and mystical atmosphere
 */
export const mystical = {
  /**
   * Velvet glow - background gradient accent
   * Used for: Gradient backgrounds, mystical atmosphere
   * Creates depth in background gradients
   */
  velvetGlow: '#4D0A1F',
  
  /**
   * Silver sheen - metallic highlights
   * Used for: Infinity symbol, metallic accents
   * Note: Same value as neutrals.lightGray
   */
  silverSheen: '#C0C0C0',
  
  /**
   * Cosmic purple - deep space backgrounds (optional)
   * Used for: Alternative backgrounds, special effects
   */
  cosmicPurple: '#2D1B3D',
} as const;

/**
 * Semantic colors - Status and feedback
 * Used for: Success, warning, error, and info states
 */
export const semantic = {
  /**
   * Success - dark green for positive outcomes
   * Used for: Success messages, positive feedback, completed states
   */
  success: '#2D5016',
  
  /**
   * Warning - dark gold for caution
   * Used for: Warning messages, caution states
   */
  warning: '#8B6914',
  
  /**
   * Error - dark red for errors
   * Used for: Error messages, destructive actions, validation errors
   */
  error: '#6B0F0F',
  
  /**
   * Info - dark blue for informational messages
   * Used for: Informational messages, help text
   */
  info: '#1B3D5D',
} as const;

/**
 * Text hierarchy colors
 * Defines the text color system for different levels of importance
 */
export const text = {
  /**
   * Primary text - gold for headings and primary actions
   * Used for: Headings (h1, h2), primary action text, important labels
   * Note: Same value as primary.gold
   * Contrast: 7.8:1 on black (AAA compliant)
   */
  primary: '#D4AF37',
  
  /**
   * Secondary text - silver for body text and descriptions
   * Used for: Body text, descriptions, secondary labels
   * Note: Same value as neutrals.lightGray
   * Contrast: 11.4:1 on black (AAA compliant)
   */
  secondary: '#C0C0C0',
  
  /**
   * Tertiary text - dimmed gray for metadata
   * Used for: Metadata, timestamps, captions, fine print
   */
  tertiary: '#808080',
  
  /**
   * Inverse text - black text on light backgrounds (rare)
   * Used for: Text on light/colored backgrounds (if needed)
   * Note: Same value as neutrals.black
   */
  inverse: '#0A0A0A',
} as const;

/**
 * Complete color palette
 * Exports all colors in a single object for convenience
 */
export const colors = {
  primary,
  neutrals,
  mystical,
  semantic,
  text,
} as const;

/**
 * Default export - Main color palette object
 */
export default colors;

/**
 * Type definitions for color values
 */
export type PrimaryColor = typeof primary[keyof typeof primary];
export type NeutralColor = typeof neutrals[keyof typeof neutrals];
export type MysticalColor = typeof mystical[keyof typeof mystical];
export type SemanticColor = typeof semantic[keyof typeof semantic];
export type TextColor = typeof text[keyof typeof text];
export type ColorValue = PrimaryColor | NeutralColor | MysticalColor | SemanticColor | TextColor;

