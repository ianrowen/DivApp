// src/theme/colors.ts
/**
 * Divin8 Color Palette
 * Based on mystical symbolism with crimson velvet aesthetic
 */

export const colors = {
  primary: {
    crimson: '#8B1538',
    crimsonLight: '#A91D47',
    crimsonDark: '#6B0F2A',
    gold: '#D4AF37',
    goldLight: '#E8C968',
    goldDark: '#B8941F',
  },
  
  neutrals: {
    black: '#0A0A0A',
    darkGray: '#1A1A1A',
    midGray: '#2A2A2A',
    lightGray: '#C0C0C0',
  },
  
  mystical: {
    velvetGlow: '#4D0A1F',
    silverSheen: '#C0C0C0',
    cosmicPurple: '#2D1B3D',
  },
  
  semantic: {
    success: '#2D5016',
    warning: '#8B6914',
    error: '#6B0F0F',
    info: '#1B3D5D',
  },
  
  text: {
    primary: '#D4AF37',     // Gold - headings
    secondary: '#C0C0C0',   // Silver - body text
    tertiary: '#808080',    // Dimmed - metadata
    inverse: '#0A0A0A',     // Black on light backgrounds
  },
  
  backgrounds: {
    pure: '#000000',        // Pure black background
    mysticalGradient: {
      colors: ['#0A0A0A', '#1A0A14', '#2D0A1F', '#0A0A0A'],
      locations: [0, 0.3, 0.7, 1],
    },
    subtleGradient: {
      colors: ['#0A0A0A', '#0F0A0C', '#0A0A0A'],
      locations: [0, 0.5, 1],
    },
    glowOverlay: {
      color: '#8B1538',      // Crimson glow
      opacity: 0.15,
    },
  },
};

export default colors;