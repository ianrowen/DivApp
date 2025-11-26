// src/shared/components/ui/CardFlip.tsx
/**
 * CardFlip Component
 * 
 * An animated card flip component for revealing card faces.
 * Uses react-native-reanimated for smooth 3D flip animations with perspective.
 * 
 * @module CardFlip
 */

import React, { useEffect } from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import theme from '../../theme';

/**
 * CardFlip component props
 */
export interface CardFlipProps extends Omit<ViewProps, 'style'> {
  /**
   * Controls the flip state
   * true = face up (frontContent visible)
   * false = face down (backContent visible)
   */
  isFaceUp: boolean;
  
  /**
   * Content to display on the front of the card (face up)
   */
  frontContent: React.ReactNode;
  
  /**
   * Content to display on the back of the card (face down)
   * Typically a CardBack component
   */
  backContent: React.ReactNode;
  
  /**
   * Animation duration in milliseconds
   * Defaults to 500ms if not specified
   */
  duration?: number;
  
  /**
   * Optional style override for the card container
   */
  style?: ViewStyle | ViewStyle[];
}

/**
 * CardFlip Component
 * 
 * An animated card flip component that smoothly transitions between
 * front and back content using a 3D rotation animation.
 * 
 * @example
 * ```tsx
 * <CardFlip
 *   isFaceUp={isRevealed}
 *   frontContent={<CardImage card={card} />}
 *   backContent={<CardBack />}
 *   duration={600}
 * />
 * ```
 */
const CardFlip: React.FC<CardFlipProps> = ({
  isFaceUp,
  frontContent,
  backContent,
  duration = 500,
  style,
  ...viewProps
}) => {
  const rotation = useSharedValue(isFaceUp ? 0 : 180);

  useEffect(() => {
    rotation.value = withTiming(isFaceUp ? 0 : 180, {
      duration,
    });
  }, [isFaceUp, duration, rotation]);

  // Front face animated style (visible when rotation is 0-90 degrees)
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = rotation.value;
    const opacity = interpolate(
      rotateY,
      [0, 90],
      [1, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      rotateY,
      [0, 90],
      [1, 0.95],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale },
      ],
      opacity,
    };
  });

  // Back face animated style (visible when rotation is 90-180 degrees)
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = rotation.value;
    const opacity = interpolate(
      rotateY,
      [90, 180],
      [0, 1],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      rotateY,
      [90, 180],
      [0.95, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <View
      style={[styles.container, style]}
      {...viewProps}
    >
      {/* Front face */}
      <Animated.View
        style={[styles.face, styles.frontFace, frontAnimatedStyle]}
        pointerEvents={isFaceUp ? 'auto' : 'none'}
      >
        {frontContent}
      </Animated.View>

      {/* Back face */}
      <Animated.View
        style={[styles.face, styles.backFace, backAnimatedStyle]}
        pointerEvents={isFaceUp ? 'none' : 'auto'}
      >
        {backContent}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container for both card faces
    position: 'relative',
  },
  face: {
    // Base style for both front and back faces
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
  frontFace: {
    // Front face specific styles
    zIndex: 2,
  },
  backFace: {
    // Back face specific styles
    zIndex: 1,
    transform: [{ rotateY: '180deg' }],
  },
});

export default CardFlip;

