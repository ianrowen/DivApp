// src/shared/components/ui/MysticalBackground.tsx
/**
 * MysticalBackground Component
 * 
 * A gradient background wrapper component that creates a mystical atmosphere
 * using velvet gradients. Provides consistent background styling throughout
 * the application.
 * 
 * Supports two variants: default (dramatic mystical gradient) and subtle
 * (less dramatic gradient for content-heavy screens).
 * 
 * @module MysticalBackground
 */

import React from 'react';
import { ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../theme';

/**
 * Background variant types
 */
export type BackgroundVariant = 'default' | 'subtle';

/**
 * MysticalBackground component props
 */
export interface MysticalBackgroundProps extends Omit<ViewProps, 'style'> {
  /**
   * Content to render over the gradient background
   */
  children: React.ReactNode;
  
  /**
   * Background gradient variant
   * Defaults to 'default' if not specified
   */
  variant?: BackgroundVariant;
  
  /**
   * Optional style override for the container
   */
  style?: ViewStyle | ViewStyle[];
}

/**
 * MysticalBackground Component
 * 
 * A gradient background wrapper that creates a mystical atmosphere using
 * velvet gradients. The default variant uses a dramatic black → velvetGlow → black
 * gradient, while the subtle variant uses a softer black → darkGray gradient.
 * 
 * @example
 * ```tsx
 * <MysticalBackground variant="default">
 *   <ThemedText variant="h1">Mystical Content</ThemedText>
 * </MysticalBackground>
 * 
 * <MysticalBackground variant="subtle">
 *   <ScrollView>
 *     <ThemedCard>Content here</ThemedCard>
 *   </ScrollView>
 * </MysticalBackground>
 * ```
 */
const MysticalBackground: React.FC<MysticalBackgroundProps> = ({
  children,
  variant = 'default',
  style,
  ...viewProps
}) => {
  // Get gradient colors based on variant
  const getGradientColors = (): string[] => {
    switch (variant) {
      case 'default':
        // Mystical velvet gradient: black → velvetGlow → black
        return [
          theme.colors.neutrals.black,
          theme.colors.mystical.velvetGlow,
          theme.colors.neutrals.black,
        ];
      
      case 'subtle':
        // Subtle gradient: black → darkGray
        return [
          theme.colors.neutrals.black,
          theme.colors.neutrals.darkGray,
        ];
      
      default:
        return [
          theme.colors.neutrals.black,
          theme.colors.mystical.velvetGlow,
          theme.colors.neutrals.black,
        ];
    }
  };

  const gradientColors = getGradientColors();

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
      {...viewProps}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MysticalBackground;
