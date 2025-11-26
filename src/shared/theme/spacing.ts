// src/shared/theme/spacing.ts
/**
 * Divin8 Spacing & Border Radius System
 * 
 * Based on the Divin8 Design System Specification v1.0.0
 * 
 * The spacing system uses a 4px base unit for consistent rhythm throughout
 * the application. Border radius values create visual hierarchy and soften
 * the mystical aesthetic.
 * 
 * @module spacing
 */

/**
 * Spacing scale
 * 
 * Base unit: 4px
 * All spacing values are multiples of the base unit for consistent rhythm
 * 
 * Usage Guidelines:
 * - Internal component padding: sm to md
 * - Between related elements: md
 * - Between sections: lg to xl
 * - Page margins: lg to xxl
 */
export const spacing = {
  /**
   * Extra small - 4px
   * Used for: Tight spacing within elements, icon padding
   * Example: Space between icon and text in a button
   */
  xs: 4,
  
  /**
   * Small - 8px
   * Used for: Small gaps, compact padding
   * Example: Padding inside small buttons, gaps in compact lists
   */
  sm: 8,
  
  /**
   * Medium - 16px
   * Used for: Default spacing, standard padding
   * Example: Default padding for cards, gaps between form fields
   * This is the most commonly used spacing value
   */
  md: 16,
  
  /**
   * Large - 24px
   * Used for: Section spacing, comfortable padding
   * Example: Space between major sections, padding for prominent cards
   */
  lg: 24,
  
  /**
   * Extra large - 32px
   * Used for: Major section breaks, generous spacing
   * Example: Space between major page sections, large card padding
   */
  xl: 32,
  
  /**
   * 2X Large - 48px
   * Used for: Page-level spacing, maximum breathing room
   * Example: Page margins, space around hero sections
   */
  xxl: 48,
} as const;

/**
 * Border radius scale
 * 
 * Creates visual hierarchy and softens the mystical aesthetic
 * Larger radius values create more prominent, elevated elements
 */
export const borderRadius = {
  /**
   * Small - 4px
   * Used for: Subtle rounding on buttons, inputs, small elements
   * Example: Input fields, small buttons, badges
   */
  sm: 4,
  
  /**
   * Medium - 8px
   * Used for: Standard cards, default rounding
   * Example: Standard card components, default button rounding
   * This is the most commonly used border radius value
   */
  md: 8,
  
  /**
   * Large - 16px
   * Used for: Prominent cards, modals, elevated elements
   * Example: Modal dialogs, prominent feature cards
   */
  lg: 16,
  
  /**
   * Extra large - 24px
   * Used for: Hero elements, special cards
   * Example: Hero sections, featured content cards
   */
  xl: 24,
  
  /**
   * Full - 9999px
   * Used for: Circular elements, pills
   * Example: Avatar images, pill-shaped buttons, circular badges
   * Note: Using 9999px creates a "fully rounded" effect in React Native
   */
  full: 9999,
} as const;

/**
 * Complete spacing system
 * Exports all spacing and border radius definitions in a single object
 */
export const spacingSystem = {
  spacing,
  borderRadius,
} as const;

/**
 * Default export - Main spacing system object
 */
export default spacingSystem;

/**
 * Type definitions for spacing values
 */
export type SpacingValue = typeof spacing[keyof typeof spacing];
export type BorderRadiusValue = typeof borderRadius[keyof typeof borderRadius];

