// src/shared/components/ui/CardBack.tsx
/**
 * CardBack Component
 * 
 * A component for displaying tarot card backs with a mystical gradient design.
 * Uses the standard tarot card aspect ratio (2:3) and applies a velvet-to-crimson
 * gradient background with shadow effects.
 * 
 * @module CardBack
 */

import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../theme';
import { applyShadow } from '../../theme/shadows';
import ThemedText from './ThemedText';

/**
 * CardBack component props
 */
export interface CardBackProps extends Omit<ViewProps, 'style'> {
  /**
   * Card width in pixels
   * Defaults to 120 if not specified
   */
  width?: number;
  
  /**
   * Card height in pixels
   * Defaults to 180 if not specified (maintains 2:3 aspect ratio)
   */
  height?: number;
  
  /**
   * Optional style override for the card container
   */
  style?: ViewStyle | ViewStyle[];
}

/**
 * CardBack Component
 * 
 * Displays a tarot card back with a mystical gradient background.
 * Uses standard tarot card proportions (2:3 aspect ratio) and applies
 * a velvet-to-crimson gradient with shadow effects.
 * 
 * @example
 * ```tsx
 * <CardBack width={120} height={180} />
 * 
 * <CardBack width={200} height={300} style={{ margin: 10 }} />
 * ```
 */
const CardBack: React.FC<CardBackProps> = ({
  width = 120,
  height = 180,
  style,
  ...viewProps
}) => {
  // Ensure aspect ratio is maintained (2:3)
  const cardHeight = height;
  const cardWidth = width;

  return (
    <View
      style={[
        styles.container,
        {
          width: cardWidth,
          height: cardHeight,
        },
        style,
      ]}
      {...viewProps}
    >
      <View
        style={[
          styles.borderedContainer,
          {
            width: cardWidth,
            height: cardHeight,
            borderRadius: theme.spacing.borderRadius.md,
          },
          applyShadow(theme.shadows.shadows.md),
        ]}
      >
        <LinearGradient
          colors={[
            theme.colors.mystical.velvetGlow,
            theme.colors.primary.crimson,
            theme.colors.mystical.velvetGlow,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              width: cardWidth,
              height: cardHeight,
              borderRadius: theme.spacing.borderRadius.md,
            },
          ]}
        />
        <View style={styles.logoPlaceholder}>
          <ThemedText variant="h3" style={styles.logoText}>
            LOGO
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container for the card back
    // Dimensions are set via props
  },
  borderedContainer: {
    // Container with gold border
    borderWidth: 2,
    borderColor: theme.colors.primary.gold,
    overflow: 'hidden',
  },
  gradient: {
    // Gradient fills the entire card back
    // Positioned absolutely to fill the bordered container
    position: 'absolute',
    top: 0,
    left: 0,
  },
  logoPlaceholder: {
    // Placeholder for logo - centered
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    // Gold text for logo placeholder
    color: theme.colors.primary.gold,
  },
});

export default CardBack;

