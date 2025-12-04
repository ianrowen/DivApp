// src/shared/components/ui/ThemedText.tsx
/**
 * ThemedText Component
 * 
 * A reusable text component that applies theme typography styles.
 * Provides consistent text styling throughout the application using the
 * Divin8 design system typography presets.
 * 
 * @module ThemedText
 */

import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import theme from '../../../theme';

/**
 * Text variant types
 * Maps to the text style presets defined in the theme
 */
export type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption';

/**
 * ThemedText component props
 */
export interface ThemedTextProps extends Omit<TextProps, 'style'> {
  /**
   * Text content to display
   */
  children: React.ReactNode;
  
  /**
   * Typography variant to apply
   * Defaults to 'body' if not specified
   */
  variant?: TextVariant;
  
  /**
   * Optional style override
   * Merged with the theme text style
   */
  style?: TextStyle | TextStyle[];
}

/**
 * ThemedText Component
 * 
 * A wrapper around React Native's Text component that automatically
 * applies theme typography styles based on the variant prop.
 * 
 * @example
 * ```tsx
 * <ThemedText variant="h1">Page Title</ThemedText>
 * <ThemedText variant="body">Body text content</ThemedText>
 * <ThemedText variant="caption" style={{ color: '#FF0000' }}>
 *   Custom colored caption
 * </ThemedText>
 * ```
 */
const ThemedText: React.FC<ThemedTextProps> = ({
  children,
  variant = 'body',
  style,
  ...textProps
}) => {
  // Get the theme text style for the specified variant
  const themeStyle = theme.typography.textStyles[variant];

  return (
    <Text
      style={[themeStyle, style]}
      {...textProps}
    >
      {children}
    </Text>
  );
};

export default ThemedText;

