// src/shared/components/ui/ThemedCard.tsx
/**
 * ThemedCard Component
 * 
 * A reusable card component that applies theme styles and provides
 * consistent card styling throughout the application.
 * 
 * Supports three variants: default (standard card), minimal (dense layout),
 * and elevated (prominent card with enhanced shadow and padding).
 * 
 * @module ThemedCard
 */

import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import theme from '../../theme';
import { applyShadow } from '../../theme/shadows';

/**
 * Card variant types
 */
export type CardVariant = 'default' | 'minimal' | 'elevated';

/**
 * ThemedCard component props
 */
export interface ThemedCardProps extends Omit<ViewProps, 'style'> {
  /**
   * Card content
   */
  children: React.ReactNode;
  
  /**
   * Card style variant
   * Defaults to 'default' if not specified
   */
  variant?: CardVariant;
  
  /**
   * Optional style override for the card container
   */
  style?: ViewStyle | ViewStyle[];
}

/**
 * ThemedCard Component
 * 
 * A themed card with three variants for different use cases.
 * Uses theme colors, spacing, shadows, and border radius for consistency.
 * 
 * @example
 * ```tsx
 * <ThemedCard variant="default">
 *   <ThemedText variant="h3">Card Title</ThemedText>
 *   <ThemedText variant="body">Card content goes here</ThemedText>
 * </ThemedCard>
 * 
 * <ThemedCard variant="minimal">
 *   <ThemedText variant="caption">Compact card content</ThemedText>
 * </ThemedCard>
 * 
 * <ThemedCard variant="elevated">
 *   <ThemedText variant="h2">Prominent Card</ThemedText>
 *   <ThemedText variant="body">This card has enhanced shadow and padding</ThemedText>
 * </ThemedCard>
 * ```
 */
const ThemedCard: React.FC<ThemedCardProps> = ({
  children,
  variant = 'default',
  style,
  ...viewProps
}) => {
  // Get variant-specific styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: theme.colors.neutrals.darkGray,
          borderWidth: 1,
          borderColor: theme.colors.primary.gold,
          padding: theme.spacing.spacing.md,
          borderRadius: theme.spacing.borderRadius.md,
          ...applyShadow(theme.shadows.shadows.md),
        };
      
      case 'minimal':
        return {
          backgroundColor: theme.colors.neutrals.darkGray,
          borderWidth: 0,
          padding: theme.spacing.spacing.md,
          borderRadius: theme.spacing.borderRadius.md,
        };
      
      case 'elevated':
        return {
          backgroundColor: theme.colors.neutrals.darkGray,
          borderWidth: 2,
          borderColor: theme.colors.primary.gold,
          padding: theme.spacing.spacing.lg,
          borderRadius: theme.spacing.borderRadius.md,
          ...applyShadow(theme.shadows.shadows.lg),
        };
      
      default:
        return {
          backgroundColor: theme.colors.neutrals.darkGray,
          padding: theme.spacing.spacing.md,
          borderRadius: theme.spacing.borderRadius.md,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.card,
        variantStyles,
        style,
      ]}
      {...viewProps}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    // Base card styles applied to all variants
    // Variant-specific styles are applied via getVariantStyles()
  },
});

export default ThemedCard;









