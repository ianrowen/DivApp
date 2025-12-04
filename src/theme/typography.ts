// src/theme/typography.ts
/**
 * Typography system for Divin8
 * Uses Cinzel for headings, Lato for body text
 */

export const typography = {
  fontFamily: {
    heading: 'Cinzel_600SemiBold',
    headingMedium: 'Cinzel_500Medium',
    body: 'Lato_400Regular',
    bodyBold: 'Lato_700Bold',
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  
  fontWeight: {
    normal: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Pre-defined text styles for ThemedText component
  textStyles: {
    h1: {
      fontFamily: 'Cinzel_600SemiBold',
      fontSize: 32,
      fontWeight: '600' as '600',
      color: '#D4AF37',
      letterSpacing: 1,
    },
    h2: {
      fontFamily: 'Cinzel_600SemiBold',
      fontSize: 24,
      fontWeight: '600' as '600',
      color: '#D4AF37',
      letterSpacing: 0.5,
    },
    h3: {
      fontFamily: 'Cinzel_500Medium',
      fontSize: 20,
      fontWeight: '500' as '500',
      color: '#E8C968',
    },
    body: {
      fontFamily: 'Lato_400Regular',
      fontSize: 16,
      fontWeight: '400' as '400',
      color: '#C0C0C0',
      lineHeight: 24,
    },
    caption: {
      fontFamily: 'Lato_400Regular',
      fontSize: 12,
      fontWeight: '400' as '400',
      color: '#808080',
      lineHeight: 16,
    },
  },
};

export default typography;