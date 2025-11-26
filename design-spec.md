# Divin8 Design System Specification

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Foundation Phase

---

## Overview

Divin8's design language draws from mystical symbolism, combining Eastern and Western esoteric traditions. The aesthetic is inspired by David Lynch's use of crimson velvet, sacred geometry, and the interplay of light and shadow in divination practices.

**Core Principles:**
- **Mystical Elegance:** Rich, deep colors with metallic accents
- **Sacred Geometry:** Clean lines, balanced proportions, centered layouts
- **Ritual Atmosphere:** Shadows, glows, and gradients create depth
- **Readability First:** Despite dark aesthetic, text must be highly legible

---

## Color Palette

### Primary Colors
```typescript
crimson: '#8B1538'        // Primary brand color - deep burgundy
crimsonLight: '#A91D47'   // Lighter accent for hover states
crimsonDark: '#6B0F2A'    // Deeper shade for pressed states

gold: '#D4AF37'           // Secondary brand - metallic gold
goldLight: '#E8C968'      // Highlights and active states
goldDark: '#B8941F'       // Borders and subdued accents
```

### Neutrals
```typescript
black: '#0A0A0A'          // True black - main background
darkGray: '#1A1A1A'       // Surface color for cards/panels
midGray: '#2A2A2A'        // Subtle dividers
lightGray: '#C0C0C0'      // Silver - secondary text
```

### Mystical Accents
```typescript
velvetGlow: '#4D0A1F'     // Background gradient accent
silverSheen: '#C0C0C0'    // Metallic highlights (infinity symbol)
cosmicPurple: '#2D1B3D'   // Optional: deep space backgrounds
```

### Semantic Colors
```typescript
success: '#2D5016'        // Dark green - positive outcomes
warning: '#8B6914'        // Dark gold - caution
error: '#6B0F0F'          // Dark red - errors
info: '#1B3D5D'           // Dark blue - informational
```

### Text Hierarchy
```typescript
textPrimary: '#D4AF37'    // Gold - headings, primary actions
textSecondary: '#C0C0C0'  // Silver - body text, descriptions
textTertiary: '#808080'   // Dimmed - metadata, timestamps
textInverse: '#0A0A0A'    // Black text on light backgrounds (rare)
```

### Accessibility Notes
- Gold (#D4AF37) on black (#0A0A0A): **7.8:1** contrast ratio (AAA compliant)
- Silver (#C0C0C0) on black (#0A0A0A): **11.4:1** contrast ratio (AAA compliant)
- Ensure interactive elements have 3:1 contrast minimum

---

## Typography

### Font Families
```typescript
fontFamily: {
  heading: 'Cinzel',      // Elegant serif - mystical, authoritative
  body: 'Lato',           // Clean sans-serif - readable, modern
  monospace: 'Courier',   // For technical info (optional)
}
```

**Installation:**
```bash
npx expo install expo-font @expo-google-fonts/cinzel @expo-google-fonts/lato
```

### Type Scale
```typescript
fontSize: {
  xs: 12,      // Captions, fine print
  sm: 14,      // Secondary text, labels
  md: 16,      // Body text (default)
  lg: 20,      // Subheadings
  xl: 24,      // Section headings
  xxl: 32,     // Page titles
  xxxl: 40,    // Hero text (splash, special occasions)
}
```

### Font Weights
```typescript
fontWeight: {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}
```

### Line Heights
```typescript
lineHeight: {
  tight: 1.2,     // Headings
  normal: 1.5,    // Body text
  relaxed: 1.75,  // Long-form reading
}
```

### Text Styles (Common Patterns)
```typescript
// Page title
h1: {
  fontFamily: 'Cinzel',
  fontSize: 32,
  fontWeight: '600',
  color: gold,
  letterSpacing: 1,
  textAlign: 'center',
}

// Section heading
h2: {
  fontFamily: 'Cinzel',
  fontSize: 24,
  fontWeight: '600',
  color: gold,
  letterSpacing: 0.5,
}

// Subheading
h3: {
  fontFamily: 'Cinzel',
  fontSize: 20,
  fontWeight: '500',
  color: goldLight,
}

// Body text
body: {
  fontFamily: 'Lato',
  fontSize: 16,
  fontWeight: '400',
  color: lightGray,
  lineHeight: 24,
}

// Caption / metadata
caption: {
  fontFamily: 'Lato',
  fontSize: 12,
  fontWeight: '400',
  color: textTertiary,
  lineHeight: 16,
}
```

---

## Spacing System

**Base unit:** 4px  
**Scale:** Multiples of base unit for consistent rhythm
```typescript
spacing: {
  xs: 4,       // Tight spacing within elements
  sm: 8,       // Small gaps
  md: 16,      // Default spacing
  lg: 24,      // Section spacing
  xl: 32,      // Major section breaks
  xxl: 48,     // Page-level spacing
}
```

**Usage Guidelines:**
- Internal component padding: `sm` to `md`
- Between related elements: `md`
- Between sections: `lg` to `xl`
- Page margins: `lg` to `xxl`

---

## Border Radius
```typescript
borderRadius: {
  sm: 4,       // Subtle rounding (buttons, inputs)
  md: 8,       // Standard cards
  lg: 16,      // Prominent cards, modals
  xl: 24,      // Hero elements
  full: 9999,  // Circular (avatars, pills)
}
```

---

## Shadows & Glows

### Elevation System
```typescript
shadow: {
  // Subtle elevation (cards)
  sm: {
    shadowColor: crimson,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2, // Android
  },
  
  // Standard elevation (floating elements)
  md: {
    shadowColor: crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  
  // High elevation (modals, dialogs)
  lg: {
    shadowColor: crimson,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  
  // Mystical glow (special cards, active states)
  glow: {
    shadowColor: crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  
  // Gold glow (selected, highlighted)
  goldGlow: {
    shadowColor: gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
}
```

---

## Component Patterns

### Cards
```typescript
card: {
  backgroundColor: darkGray,
  borderWidth: 1,
  borderColor: gold,
  borderRadius: 8,
  padding: 16,
  ...shadow.md,
}

cardMinimal: {
  backgroundColor: darkGray,
  borderRadius: 8,
  padding: 16,
  // No border, no shadow - for dense layouts
}

cardElevated: {
  backgroundColor: darkGray,
  borderWidth: 2,
  borderColor: gold,
  borderRadius: 12,
  padding: 20,
  ...shadow.lg,
}
```

### Buttons
```typescript
// Primary action
buttonPrimary: {
  backgroundColor: crimson,
  borderWidth: 1,
  borderColor: gold,
  borderRadius: 8,
  paddingVertical: 12,
  paddingHorizontal: 24,
}

buttonPrimaryText: {
  color: gold,
  fontSize: 16,
  fontWeight: '600',
  textAlign: 'center',
}

// Secondary action
buttonSecondary: {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: gold,
  borderRadius: 8,
  paddingVertical: 12,
  paddingHorizontal: 24,
}

buttonSecondaryText: {
  color: gold,
  fontSize: 16,
  fontWeight: '500',
  textAlign: 'center',
}

// Ghost button (minimal)
buttonGhost: {
  backgroundColor: 'transparent',
  paddingVertical: 8,
  paddingHorizontal: 16,
}

buttonGhostText: {
  color: lightGray,
  fontSize: 14,
  fontWeight: '500',
}
```

### Inputs
```typescript
input: {
  backgroundColor: darkGray,
  borderWidth: 1,
  borderColor: goldDark,
  borderRadius: 8,
  paddingVertical: 12,
  paddingHorizontal: 16,
  color: lightGray,
  fontSize: 16,
}

inputFocused: {
  borderColor: gold,
  borderWidth: 2,
  ...shadow.goldGlow,
}

inputError: {
  borderColor: error,
  borderWidth: 1,
}

inputLabel: {
  color: gold,
  fontSize: 14,
  fontWeight: '500',
  marginBottom: 8,
}
```

### Dividers
```typescript
divider: {
  height: 1,
  backgroundColor: goldDark,
  opacity: 0.3,
  marginVertical: 16,
}

dividerThick: {
  height: 2,
  backgroundColor: gold,
  opacity: 0.5,
  marginVertical: 24,
}
```

---

## Background Patterns

### Solid Backgrounds
```typescript
screenBackground: {
  flex: 1,
  backgroundColor: black,
}
```

### Gradient Backgrounds
```typescript
// Mystical velvet gradient (primary)
<LinearGradient
  colors={[black, velvetGlow, black]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ flex: 1 }}
/>

// Subtle depth gradient
<LinearGradient
  colors={[black, darkGray]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  style={{ flex: 1 }}
/>

// Card gradient (optional, for special cards)
<LinearGradient
  colors={[crimsonDark, crimson, crimsonDark]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
/>
```

---

## Icon System

### Element Icons (Western 4 Elements)

**Primary Set (Unicode Alchemical):**
```
🜂 Fire
🜄 Water
🜁 Air
🜃 Earth
```

**Fallback Set (if Unicode unsupported):**
```
🔥 Fire
💧 Water
🌬️ Air
🌍 Earth
```

**Alternative: Wu Xing (Chinese 5 Elements):**
```
火 Fire (Huǒ)
水 Water (Shuǐ)
木 Wood (Mù)
金 Metal (Jīn)
土 Earth (Tǔ)
```

### Icon Library

Use **Expo Vector Icons** for app UI:
```typescript
// Recommended icon sets
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// Common icons
home: "home-outline"
settings: "settings-outline"
profile: "person-circle-outline"
search: "search-outline"
menu: "menu-outline"
close: "close-outline"
star: "star-outline"
info: "information-circle-outline"
```

**Icon Colors:**
- Primary actions: `gold`
- Secondary actions: `lightGray`
- Inactive: `textTertiary`
- Active/selected: `goldLight`

**Icon Sizes:**
```typescript
iconSize: {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
}
```

---

## Animation Guidelines

### Timing Functions
```typescript
animation: {
  fast: 150,       // Quick feedback (button press)
  normal: 300,     // Standard transitions
  slow: 500,       // Dramatic reveals (card flips)
  ritual: 1000,    // Mystical animations (shuffle)
}

easing: {
  standard: 'ease-in-out',
  entrance: 'ease-out',
  exit: 'ease-in',
}
```

### Common Animations

**Card Flip:**
- Duration: 500ms
- Easing: ease-in-out
- Rotate Y: 0° → 180°

**Fade In:**
- Duration: 300ms
- Opacity: 0 → 1

**Scale Press:**
- Duration: 150ms
- Scale: 1 → 0.95 → 1
- Use for button feedback

**Mystical Glow Pulse:**
- Duration: 2000ms
- Loop: infinite
- Shadow opacity: 0.6 → 0.9 → 0.6

---

## Layout Guidelines

### Screen Structure
```
┌─────────────────────┐
│      Header         │ ← 64px height, gold title
├─────────────────────┤
│                     │
│    Content Area     │ ← Padding: lg (24px)
│                     │
│                     │
├─────────────────────┤
│   Bottom Nav        │ ← 60px height (if used)
└─────────────────────┘
```

### Grid System

- **Columns:** 12-column responsive grid
- **Gutter:** 16px (md spacing)
- **Margin:** 24px (lg spacing) on tablet+
- **Max width:** 600px for optimal readability

### Safe Areas

Always respect device safe areas:
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={{ flex: 1, backgroundColor: black }}>
  {/* Content */}
</SafeAreaView>
```

---

## Dark Mode Support

**Current Implementation:**
- Dark mode is PRIMARY theme
- Light mode: Not planned for v1.0
- Future: High contrast mode for accessibility

**If implementing light mode later:**
```typescript
lightTheme: {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  textPrimary: crimsonDark,
  textSecondary: '#333333',
  // Invert logic while maintaining brand colors
}
```

---

## Internationalization Considerations

### Text Expansion
- **English → Traditional Chinese:** ~10-15% shorter
- **Buttons:** Allow 150% expansion for other languages
- **Card text:** Consider variable height containers

### Typography Adjustments
- **Chinese text:** May need +2px font size for readability
- **Line height:** Increase to 1.6 for Chinese characters
- **Font fallback:** Ensure system fonts handle Chinese glyphs

### RTL Support (Future)
- If supporting Arabic/Hebrew: mirror layouts
- Icons: Use directional-agnostic icons where possible

---

## Accessibility

### Minimum Requirements

**Contrast:**
- Text: 4.5:1 for normal text (WCAG AA)
- Large text (18pt+): 3:1 minimum
- Interactive elements: 3:1 against background

**Touch Targets:**
- Minimum: 44x44 dp (iOS HIG / Material)
- Preferred: 48x48 dp for primary actions
- Spacing: 8px minimum between targets

**Motion:**
- Respect `prefers-reduced-motion`
- Provide option to disable animations
- Never use motion as ONLY indicator

**Screen Readers:**
- All interactive elements: `accessibilityLabel`
- Images: `accessibilityRole="image"` + description
- Decorative: `accessibilityElementsHidden={true}`

### High Contrast Mode (Optional)
```typescript
highContrastColors: {
  textPrimary: '#FFFFFF',     // Pure white
  background: '#000000',      // Pure black
  border: '#FFFF00',          // Yellow (high visibility)
}
```

---

## Platform-Specific Considerations

### iOS
- Use native blur effects sparingly (performance)
- Shadow radius: iOS handles larger values better
- Haptic feedback: Use for ritual moments (card draw)

### Android
- `elevation` property for Material shadows
- Ripple effects on buttons (already handled by RN)
- Hardware back button: Handle gracefully

### Performance
- Avoid excessive shadow/blur on low-end devices
- Lazy load images
- Use `removeClippedSubviews` for long lists
- Optimize gradient backgrounds (consider static images)

---

## File Organization
```
src/
├── theme/
│   ├── colors.ts           # Color palette
│   ├── typography.ts       # Font system
│   ├── spacing.ts          # Spacing scale
│   ├── shadows.ts          # Shadow definitions
│   ├── components.ts       # Component style patterns
│   └── index.ts            # Main export
├── components/
│   ├── ui/
│   │   ├── ThemedCard.tsx
│   │   ├── ThemedButton.tsx
│   │   ├── MysticalBackground.tsx
│   │   └── CardBack.tsx
│   └── ...
└── ...
```

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
- [ ] Color system
- [ ] Typography
- [ ] Spacing & layout primitives
- [ ] Basic components (Card, Button, Input)

### Phase 2: Enhancement (Week 2)
- [ ] Shadows & glows
- [ ] Gradient backgrounds
- [ ] Icon system
- [ ] Animation utilities

### Phase 3: Polish (Week 3)
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Platform-specific refinements
- [ ] Documentation examples

---

## Design Tokens Export

For design tools (Figma, Sketch):
```json
{
  "colors": {
    "crimson": "#8B1538",
    "gold": "#D4AF37",
    "black": "#0A0A0A"
  },
  "typography": {
    "heading": "Cinzel",
    "body": "Lato"
  },
  "spacing": [4, 8, 16, 24, 32, 48]
}
```

---

## References & Inspiration

- **Logo:** Later Heaven Bagua arrangement with planetary correspondences
- **Color inspiration:** David Lynch's use of crimson velvet (Twin Peaks)
- **Sacred geometry:** Infinity symbol (∞) shaped as 8
- **Cultural authenticity:** Traditional Chinese divination aesthetics
- **Modern UX:** Material Design (elevation), iOS HIG (spacing)

---

## Changelog

**v1.0.0** - Initial specification
- Established core color palette
- Defined typography system
- Created component patterns
- Added accessibility guidelines

---

## Maintenance Notes

**Update frequency:** Review quarterly or when:
- Adding new features requiring new components
- User feedback indicates readability issues
- Platform guidelines change significantly
- Expanding to new markets with different expectations

**Approval required for:**
- Changes to primary colors (crimson, gold)
- Typography hierarchy modifications
- Accessibility standard updates

**Living document:** This spec should evolve with the product. Document all deviations with rationale.
```

---

**Usage in Cursor:**

Save this as `design-spec.md` in your project root, then use:
```
@design-spec.md implement the theme system in /src/theme/
```

Or:
```
@design-spec.md update the login screen to match our design system