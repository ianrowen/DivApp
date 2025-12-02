// src/shared/components/ui/MysticalBackground.tsx
/**
 * MysticalBackground Component
 * 
 * A background wrapper component that creates a mystical atmosphere
 * using pure React Native View components (no native modules).
 * Provides consistent background styling throughout the application.
 * 
 * Supports two variants: default (dramatic mystical glow) and subtle
 * (solid black for content-heavy screens).
 * 
 * @module MysticalBackground
 */

import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
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
   * Content to render over the background
   */
  children: React.ReactNode;
  
  /**
   * Background variant
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
 * A background wrapper that creates a mystical atmosphere using pure React Native
 * View components. The default variant uses a black background with a centered
 * crimson glow overlay, while the subtle variant uses a solid black background.
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
  return (
    <View
      style={[styles.baseLayer, style]}
      {...viewProps}
    >
      {/* Radial glow overlay for default variant */}
      {variant === 'default' && (
        <View style={styles.glowOverlay} />
      )}
      
      {/* Content layer */}
      <View style={styles.contentLayer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Base layer: solid black background
  baseLayer: {
    flex: 1,
    backgroundColor: theme.colors.neutrals.black,
    position: 'relative',
    overflow: 'hidden', // Clip the glow overlay to container bounds
  },
  // Radial glow overlay: soft crimson glow radiating from center
  glowOverlay: {
    position: 'absolute',
    top: '-25%', // Position so center is at 50% (150% / 2 = 75%, so -25% positions center at 50%)
    left: '-25%',
    width: '150%',
    height: '150%',
    backgroundColor: theme.colors.primary.crimson,
    opacity: 0.2,
    borderRadius: 9999, // Circular shape for radial effect
  },
  // Content layer: children rendered on top
  contentLayer: {
    flex: 1,
    zIndex: 1, // Ensure content is above the glow overlay
  },
});

export default MysticalBackground;
