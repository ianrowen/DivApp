// src/shared/theme/index.ts
/**
 * Divin8 Unified Theme System
 * 
 * Based on the Divin8 Design System Specification v1.0.0
 * 
 * This module provides a unified interface to all theme components:
 * - Colors: Complete color palette (primary, neutrals, mystical accents, semantic, text)
 * - Typography: Font families, sizes, weights, line heights, and text style presets
 * - Spacing: Spacing scale and border radius values
 * - Shadows: Shadow/elevation system with platform-aware handling
 * 
 * Usage:
 * ```typescript
 * // Import unified theme
 * import theme from '../shared/theme';
 * 
 * // Use theme properties
 * <View style={{ backgroundColor: theme.colors.primary.crimson }}>
 *   <Text style={theme.typography.textStyles.h1}>Title</Text>
 * </View>
 * 
 * // Or import individual modules
 * import { colors, typography } from '../shared/theme';
 * ```
 * 
 * @module theme
 */

import colors, {
  primary,
  neutrals,
  mystical,
  semantic,
  text,
} from './colors';
import typography, {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textStyles,
} from './typography';
import spacingSystem, {
  spacing,
  borderRadius,
} from './spacing';
import shadowSystem, {
  shadows,
  applyShadow,
  ShadowConfig,
} from './shadows';

/**
 * Complete theme configuration
 * 
 * Combines all design system tokens into a single, unified object.
 * This provides a single source of truth for all design tokens.
 */
export const theme = {
  /**
   * Color palette
   * Includes primary brand colors, neutrals, mystical accents, semantic colors, and text hierarchy
   */
  colors,

  /**
   * Typography system
   * Includes font families, sizes, weights, line heights, and text style presets
   */
  typography,

  /**
   * Spacing system
   * Includes spacing scale and border radius values
   */
  spacing: spacingSystem,

  /**
   * Shadow system
   * Includes shadow presets and platform-aware helper functions
   */
  shadows: shadowSystem,
} as const;

/**
 * TypeScript type for the complete theme
 * 
 * Use this type when you need to type-check theme usage or create theme-aware components
 * 
 * @example
 * ```typescript
 * interface ThemedComponentProps {
 *   theme: Theme;
 * }
 * ```
 */
export type Theme = typeof theme;

/**
 * Named exports for individual theme modules
 * 
 * Import specific modules when you only need certain parts of the theme:
 * 
 * @example
 * ```typescript
 * import { colors, typography } from '../shared/theme';
 * 
 * const styles = StyleSheet.create({
 *   button: {
 *     backgroundColor: colors.primary.crimson,
 *     ...typography.textStyles.h2,
 *   },
 * });
 * ```
 */

// Color exports
export {
  colors,
  primary,
  neutrals,
  mystical,
  semantic,
  text,
};

// Typography exports
export {
  typography,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textStyles,
};

// Spacing exports
export {
  spacingSystem,
  spacing,
  borderRadius,
};

// Shadow exports
export {
  shadowSystem,
  shadows,
  applyShadow,
  ShadowConfig,
};

/**
 * Default export - Unified theme object
 * 
 * This is the recommended way to import the theme for most use cases.
 * 
 * @example
 * ```typescript
 * import theme from '../shared/theme';
 * 
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: theme.colors.background.primary,
 *     padding: theme.spacing.spacing.md,
 *     borderRadius: theme.spacing.borderRadius.md,
 *     ...theme.shadows.shadows.md,
 *   },
 *   title: {
 *     ...theme.typography.textStyles.h1,
 *   },
 * });
 * ```
 */
export default theme;

