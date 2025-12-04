// src/theme/shadows.ts
/**
 * Shadow and glow effects for elevation and mystical atmosphere
 */

export const shadows = {
  shadows: {
    sm: {
      shadowColor: '#8B1538',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#8B1538',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    lg: {
      shadowColor: '#8B1538',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 10,
    },
    glow: {
      shadowColor: '#8B1538',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 20,
      elevation: 15,
    },
    goldGlow: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 12,
    },
  },
};

/**
 * Helper function to apply shadow styles
 * Works for both iOS and Android
 */
export function applyShadow(shadow: typeof shadows.shadows.md) {
  return {
    shadowColor: shadow.shadowColor,
    shadowOffset: shadow.shadowOffset,
    shadowOpacity: shadow.shadowOpacity,
    shadowRadius: shadow.shadowRadius,
    elevation: shadow.elevation,
  };
}

export default shadows;