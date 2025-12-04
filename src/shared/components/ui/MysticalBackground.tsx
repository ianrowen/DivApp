import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../../theme';

export type BackgroundVariant = 'default' | 'subtle' | 'pure';

export interface MysticalBackgroundProps {
  children: React.ReactNode;
  variant?: BackgroundVariant;
  style?: any;
}

export default function MysticalBackground({ 
  children, 
  variant = 'default',
  style 
}: MysticalBackgroundProps) {
  
  // Pure black - no gradient
  if (variant === 'pure') {
    return (
      <View style={[styles.baseLayer, { backgroundColor: theme.colors.backgrounds.pure }, style]}>
        <View style={styles.contentLayer}>
          {children}
        </View>
      </View>
    );
  }
  
  // Get gradient config based on variant
  const gradientConfig = variant === 'subtle' 
    ? theme.colors.backgrounds.subtleGradient
    : theme.colors.backgrounds.mysticalGradient;
  
  return (
    <View style={[styles.baseLayer, style]}>
      {/* Base gradient layer */}
      <LinearGradient
        colors={gradientConfig.colors}
        locations={gradientConfig.locations}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientLayer}
      />
      
      {/* Radial glow overlay */}
      <View style={[
        styles.glowOverlay,
        { 
          backgroundColor: theme.colors.backgrounds.glowOverlay.color,
          opacity: theme.colors.backgrounds.glowOverlay.opacity,
        }
      ]} />
      
      {/* Content layer */}
      <View style={styles.contentLayer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  baseLayer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowOverlay: {
    position: 'absolute',
    top: '-25%',
    left: '-25%',
    width: '150%',
    height: '150%',
    borderRadius: 9999,
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
  },
});

export { MysticalBackground };
