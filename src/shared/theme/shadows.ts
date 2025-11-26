// src/shared/theme/shadows.ts
/**
 * Divin8 Shadow & Elevation System
 * 
 * Based on the Divin8 Design System Specification v1.0.0
 * 
 * The shadow system creates depth and hierarchy using crimson and gold glows.
 * Shadows are platform-aware, using iOS shadow properties and Android elevation.
 * 
 * @module shadows
 */

import { Platform, ViewStyle } from 'react-native';
import colors from './colors';

/**
 * Shadow configuration interface
 * Combines iOS shadow properties with Android elevation
 */
export interface ShadowConfig {
  /**
   * Shadow color (iOS)
   * Used for: iOS shadow rendering
   */
  shadowColor: string;
  
  /**
   * Shadow offset (iOS)
   * Used for: iOS shadow position
   */
  shadowOffset: {
    width: number;
    height: number;
  };
  
  /**
   * Shadow opacity (iOS)
   * Range: 0.0 to 1.0
   * Used for: iOS shadow intensity
   */
  shadowOpacity: number;
  
  /**
   * Shadow blur radius (iOS)
   * Used for: iOS shadow softness
   */
  shadowRadius: number;
  
  /**
   * Elevation (Android)
   * Used for: Android shadow depth
   * Range: 0-24 (material design guidelines)
   */
  elevation: number;
}

/**
 * Shadow scale
 * 
 * Provides consistent elevation levels throughout the application.
 * Uses crimson for standard shadows, creating a mystical depth effect.
 * 
 * Platform Handling:
 * - iOS: Uses shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * - Android: Uses elevation property
 * 
 * Usage Guidelines:
 * - sm: Subtle cards, basic elevation
 * - md: Floating elements, interactive cards
 * - lg: Modals, dialogs, high-priority elements
 * - glow: Special cards, active states, mystical effects
 * - goldGlow: Selected items, highlighted elements, premium features
 */
export const shadows = {
  /**
   * Small shadow - Subtle elevation
   * Used for: Standard cards, basic elevation
   * Creates a gentle lift without being too prominent
   */
  sm: {
    shadowColor: colors.primary.crimson,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2, // Android
  } as ShadowConfig,

  /**
   * Medium shadow - Standard elevation
   * Used for: Floating elements, interactive cards, buttons
   * Provides clear depth for interactive elements
   */
  md: {
    shadowColor: colors.primary.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5, // Android
  } as ShadowConfig,

  /**
   * Large shadow - High elevation
   * Used for: Modals, dialogs, high-priority elements
   * Creates strong depth for elevated content
   */
  lg: {
    shadowColor: colors.primary.crimson,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10, // Android
  } as ShadowConfig,

  /**
   * Glow effect - Mystical glow
   * Used for: Special cards, active states, mystical effects
   * Creates an ethereal glow around elements
   * Note: shadowOffset is {0, 0} for a true glow effect
   */
  glow: {
    shadowColor: colors.primary.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15, // Android
  } as ShadowConfig,

  /**
   * Gold glow - Premium highlight
   * Used for: Selected items, highlighted elements, premium features
   * Creates a warm, luxurious glow using gold color
   * Perfect for indicating selected or premium states
   */
  goldGlow: {
    shadowColor: colors.primary.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12, // Android
  } as ShadowConfig,
} as const;

/**
 * Helper function to apply shadow styles
 * 
 * Returns a ViewStyle object with platform-appropriate shadow properties.
 * On iOS, all shadow properties are applied. On Android, only elevation is used.
 * 
 * @param shadow - The shadow configuration to apply
 * @returns ViewStyle object with shadow properties
 * 
 * @example
 * ```typescript
 * <View style={[styles.card, applyShadow(shadows.md)]}>
 *   <Text>Card content</Text>
 * </View>
 * ```
 */
export const applyShadow = (shadow: ShadowConfig): ViewStyle => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: shadow.shadowColor,
      shadowOffset: shadow.shadowOffset,
      shadowOpacity: shadow.shadowOpacity,
      shadowRadius: shadow.shadowRadius,
    };
  } else {
    // Android uses elevation
    return {
      elevation: shadow.elevation,
    };
  }
};

/**
 * Complete shadow system
 * Exports all shadow definitions and helper functions
 */
export const shadowSystem = {
  shadows,
  applyShadow,
} as const;

/**
 * Default export - Main shadow system object
 */
export default shadowSystem;

/**
 * Type definitions for shadow values
 */
export type ShadowPreset = keyof typeof shadows;
export type ShadowValue = typeof shadows[ShadowPreset];

