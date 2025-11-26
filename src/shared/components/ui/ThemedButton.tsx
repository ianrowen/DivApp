// src/shared/components/ui/ThemedButton.tsx
/**
 * ThemedButton Component
 * 
 * A reusable button component that applies theme styles and provides
 * consistent button styling throughout the application.
 * 
 * Supports three variants: primary (crimson with gold), secondary (transparent with gold),
 * and ghost (minimal styling).
 * 
 * @module ThemedButton
 */

import React, { useRef } from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import theme from '../../theme';
import ThemedText from './ThemedText';

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * ThemedButton component props
 */
export interface ThemedButtonProps extends Omit<PressableProps, 'style'> {
  /**
   * Button text label
   */
  title: string;
  
  /**
   * Press handler function
   */
  onPress: () => void;
  
  /**
   * Button style variant
   * Defaults to 'primary' if not specified
   */
  variant?: ButtonVariant;
  
  /**
   * Whether the button is disabled
   * When disabled, opacity is reduced and onPress is disabled
   */
  disabled?: boolean;
  
  /**
   * Optional style override for the button container
   */
  style?: ViewStyle | ViewStyle[];
  
  /**
   * Optional style override for the button text
   */
  textStyle?: TextStyle | TextStyle[];
}

/**
 * ThemedButton Component
 * 
 * A themed button with three variants and press animations.
 * Uses Pressable for native press handling with scale animation feedback.
 * 
 * @example
 * ```tsx
 * <ThemedButton
 *   title="Submit"
 *   onPress={() => console.log('Pressed')}
 *   variant="primary"
 * />
 * 
 * <ThemedButton
 *   title="Cancel"
 *   onPress={handleCancel}
 *   variant="secondary"
 *   disabled={isLoading}
 * />
 * 
 * <ThemedButton
 *   title="Skip"
 *   onPress={handleSkip}
 *   variant="ghost"
 * />
 * ```
 */
const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  ...pressableProps
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animate scale on press
  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  // Get variant-specific styles
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: theme.colors.primary.crimson,
            borderWidth: 1,
            borderColor: theme.colors.primary.gold,
          },
          text: {
            color: theme.colors.primary.gold,
          },
        };
      
      case 'secondary':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.colors.primary.gold,
          },
          text: {
            color: theme.colors.primary.gold,
          },
        };
      
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: theme.colors.neutrals.lightGray,
          },
        };
      
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const variantStyles = getVariantStyles();

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          variantStyles.container,
          {
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
        {...pressableProps}
      >
        <ThemedText
          variant="body"
          style={textStyle ? [
            styles.buttonText,
            variantStyles.text,
            textStyle,
          ] as TextStyle[] : [
            styles.buttonText,
            variantStyles.text,
          ]}
        >
          {title}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.spacing.sm,
    paddingHorizontal: theme.spacing.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target size
  },
  buttonText: {
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default ThemedButton;

