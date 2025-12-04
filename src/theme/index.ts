// src/theme/index.ts
/**
 * Main theme export
 * Combines all theme tokens into a single object
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows, applyShadow } from './shadows';

export const theme = {
  colors,
  typography,
  spacing,
  shadows,
};

export { applyShadow };

export default theme;