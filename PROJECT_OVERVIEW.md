# 📊 PROJECT OVERVIEW - Divin8

**Divin8** - Multi-system AI divination platform combining Tarot, Western Astrology, BaZi (Chinese astrology), and I Ching with unique cross-system synthesis.

## Current Status

- ✅ HTML prototype: Fully working Tarot app with Gemini AI
- ✅ React Native scaffold: Basic structure, needs Supabase integration  
- ✅ Architecture: Completely designed (plugin system, deck registry, modular)
- ✅ Database: Production-ready schema
- ✅ 78 Tarot card images: Rider-Waite-Smith deck

## What's Needed

- Port HTML functionality → React Native
- Migrate to Supabase
- Implement proper architecture patterns
- Conversation about readings
- Manual card draw to allow inputting reversed cards

---

## 🎨 CARD DRAWING ANIMATION SYSTEM

### CONTEXT
- React Native/Expo app for divination readings
- Need card drawing animation system for Tarot, I Ching, etc.
- Must work with existing DeckRegistry and card back design
- Target: simple, performant ritual feeling over complex physics

### IMPLEMENTATION REQUIREMENTS

1. **Create animation abstraction layer:**
   - Interface: DrawAnimationProvider with methods for shuffle/reveal
   - Should work with any divination system via registry
   - Keep animations modular for future customization

2. **Initial implementation using react-native-reanimated:**
   - Simple card flip animation (face-down to face-up)
   - Optional: brief shuffle animation (1-2 seconds)
   - Haptic feedback on card reveal (use expo-haptics)
   - Smooth 3D transform for card flip

3. **Integration points:**
   - Hook into existing card draw flow
   - Support spread patterns (single card, 3-card, Celtic Cross, etc.)
   - Work with both portrait and landscape orientations

4. **Configuration:**
   - Allow enabling/disabling animations (accessibility)
   - Animation speed settings (fast/normal/slow)
   - Store preferences in user settings

5. **Performance requirements:**
   - Must run smoothly on mid-range Android devices
   - No frame drops during animation
   - Lazy load animation resources

### TECHNICAL CONSTRAINTS
- TypeScript required
- Follow existing registry pattern architecture
- No external animation libraries beyond react-native-reanimated
- Keep bundle size impact minimal

### DELIVERABLES
1. DrawAnimationProvider interface and default implementation
2. Simple flip animation component
3. Integration with existing draw flow
4. User settings for animation preferences
5. Brief implementation notes on extending/customizing

**Note:** Start with the interface definition and simplest flip animation first. Show the interface before implementing the full animation system.

---

## 🌍 MARKET STRATEGY

### PRIMARY Market: US & English-Speaking (330M+ potential users)

**Why:** Higher ARPU ($15-20/mo), larger market, better exit opportunities

**Launch Sequence:**
1. Month 3: Tarot (proven demand)
2. Month 6: Western Astrology (table stakes, competitive necessity)
3. Month 9: Cross-system synthesis (unique differentiator)
4. Month 12: I Ching (additional depth)

### SECONDARY Market: Taiwan (23M population)

**Why:** Cultural authenticity, BaZi differentiation, underserved market

**Launch Sequence:**
1. Month 6: Localize app (Traditional Chinese)
2. Month 9: Add BaZi/Four Pillars (high perceived value in Taiwan)
3. Month 12: Complete synthesis (Tarot + Astrology + BaZi)

### Language Priority:
1. **English** (launch language, Month 3)
2. **Traditional Chinese** (Taiwan, Month 6)
3. **Japanese** (premium market, Month 12+)
4. **Spanish** (US Hispanic, Year 2)
5. **Russian** (white-label licensing, Year 2)

**Key Insight:** US/English is PRIMARY revenue driver, not Taiwan. Architecture must support this.

---

## 💰 BUSINESS MODEL

### Free Tier
- 3 Tarot readings/week
- Save readings to journal
- Basic 3-card spread only

### Premium - $9.99/month
- Unlimited Tarot readings
- All spreads (Celtic Cross, etc.)
- I Ching readings (later)
- 3 follow-up questions per reading
- Cross-reference (Tarot + one other system)

### Pro - $19.99/month
- Everything in Premium
- Western Astrology readings
- BaZi readings (Taiwan market)
- 10 follow-up questions per reading
- Unlimited cross-reference
- Long-arc narrative analysis
- Birth data personalization

### Expert - $29.99/month
- Everything in Pro
- Unlimited follow-ups
- Priority AI (better quality/speed)
- Multiple deck options
- Advanced features

---

## 🏗️ TECH STACK (CONFIRMED)

### Frontend
- React Native (Expo)
- TypeScript (strict mode)
- React Navigation
- React Context + Hooks (no Redux)

### Backend
- Supabase (PostgreSQL, Auth, Storage)
- Row Level Security (RLS)

### AI
- **Production (users):** Google Gemini 2.0 Flash (~$0.0004/reading)
- **Abstracted:** AIProvider class (can switch to Claude/GPT without code changes)
- **Development (me):** Claude Sonnet 4.5 + Gemini 2.0 Flash

### Payments
- RevenueCat (subscription management)
- Stripe (processor)
- Google Play Billing + Apple IAP

### Deployment
- EAS Build (Expo)
- Google Play Store (Month 3)
- Apple App Store (Month 7)

---

## 🎨 ARCHITECTURE PRINCIPLES (MUST FOLLOW)

### 1. Plugin System
Each divination system is self-contained module:

```
systems/
├── tarot/       # Self-contained
├── astrology/   # Self-contained  
├── bazi/        # Self-contained
└── iching/      # Self-contained
```

**Add new system = copy folder structure, no core changes**

### 2. Universal Data Model
- ONE `readings` table for ALL systems
- JSONB `elements_drawn` field (flexible)
- No migrations when adding systems

### 3. Deck Registry Pattern
- Decks as data (JSON + images), NOT code
- `tarot_decks` + `tarot_deck_cards` tables
- Add Thoth, Marseille, etc. without code changes
- Different card names/numbering handled gracefully

### 4. AI Provider Abstraction ⚠️ CRITICAL
```typescript
// NEVER hardcode Gemini:
const result = await gemini.generate(prompt);

// ALWAYS abstract:
const result = await AIProvider.generate(prompt);
```

**Why:** Privacy (don't reveal backend), flexibility (switch providers), negotiation leverage

### 5. Birth Data Optional
- Users CAN provide birth date/time/location
- Systems declare if they require/can use it
- Tarot: Optional context (slight card bias)
- Astrology: Required (can't generate chart without)
- BaZi: Required
- Cache expensive calculations

### 6. Feature Flags
- Enable/disable without deployment
- Gradual rollout (0% → 100%)
- A/B testing support
- User-tier gating

### 7. Multilingual from Day 1
- JSONB for all user-facing text: `{en: "...", zh_tw: "...", ja: "..."}`
- Separate AI prompts per language
- i18n library (react-i18next or similar)

---

## 📁 FOLDER STRUCTURE

```
divin8-app/
├── src/
│   ├── core/                      # Framework
│   │   ├── api/
│   │   │   ├── supabase.ts        # Supabase client
│   │   │   ├── aiProvider.ts      # ⚠️ AI abstraction layer
│   │   │   ├── gemini.ts          # Gemini implementation
│   │   │   └── revenuecat.ts      # Payments
│   │   ├── models/
│   │   │   ├── Reading.ts         # Base class (template method)
│   │   │   ├── SystemRegistry.ts  # System plugin manager
│   │   │   ├── DeckRegistry.ts    # Deck manager
│   │   │   └── User.ts
│   │   ├── config/
│   │   │   ├── featureFlags.ts
│   │   │   └── constants.ts
│   │   └── utils/
│   │       ├── i18n.ts
│   │       └── analytics.ts
│   │
│   ├── systems/                   # Divination systems (plugins)
│   │   ├── tarot/
│   │   │   ├── models/
│   │   │   │   ├── TarotReading.ts    # extends Reading
│   │   │   │   ├── TarotCard.ts
│   │   │   │   └── TarotSpread.ts
│   │   │   ├── components/
│   │   │   │   ├── CardDisplay.tsx
│   │   │   │   ├── CardDrawing/
│   │   │   │   └── SpreadLayout.tsx
│   │   │   ├── screens/
│   │   │   │   ├── TarotHomeScreen.tsx
│   │   │   │   └── TarotReadingScreen.tsx
│   │   │   ├── data/
│   │   │   │   ├── cards.json         # 78 cards
│   │   │   │   ├── spreads.json
│   │   │   │   └── decks/
│   │   │   │       ├── rws/           # Rider-Waite-Smith
│   │   │   │       │   ├── deck.json
│   │   │   │       │   └── images/
│   │   │   │       └── thoth/         # Future
│   │   │   └── prompts/
│   │   │       ├── tarotPrompts.ts    # English
│   │   │       └── tarotPrompts.zh.ts # Chinese
│   │   │
│   │   ├── astrology/         # Month 6+
│   │   ├── bazi/              # Month 9+ (Taiwan)
│   │   └── iching/            # Month 12+
│   │
│   ├── features/              # Cross-cutting features
│   │   ├── auth/
│   │   │   ├── screens/
│   │   │   └── hooks/
│   │   ├── journal/
│   │   │   ├── screens/
│   │   │   └── components/
│   │   ├── followUp/          # ⚠️ INCLUDE IN MVP (Week 4)
│   │   │   ├── services/
│   │   │   │   └── FollowUpService.ts
│   │   │   └── screens/
│   │   │       └── FollowUpScreen.tsx
│   │   ├── crossReference/    # Month 6+
│   │   └── profile/
│   │
│   ├── shared/                # Shared UI
│   │   ├── components/
│   │   ├── hooks/
│   │   └── theme/
│   │
│   ├── navigation/
│   │   ├── MainNavigator.tsx
│   │   └── AuthNavigator.tsx
│   │
│   └── App.tsx
│
├── assets/
│   ├── images/
│   │   └── cards/
│   │       └── rws/           # 78 RWS card images
│   ├── i18n/
│   │   ├── en.json
│   │   └── zh-TW.json
│   └── fonts/
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed/
│       ├── seedDecks.ts
│       └── seedCards.ts
│
├── app.json
├── package.json
└── tsconfig.json
```

---

## 🗄️ DATABASE (Already Designed)

**File:** `01-DATABASE-SCHEMA.sql` (uploaded separately)

**Key Tables:**
- `users` - Auth, subscription, birth data
- `tarot_decks` - Multi-deck support (RWS, Thoth, etc.)
- `tarot_deck_cards` - Card definitions per deck
- `divination_systems` - Plugin registry
- `system_elements` - Universal element catalog
- `readings` - ALL readings (JSONB elements_drawn)
- `reading_follow_ups` - Chat Q&A
- `cross_reference_sessions` - Multi-system consultations
- `astrological_calculations` - Cached birth charts

**Critical Design:**
- JSONB everywhere (no migrations)
- Multilingual JSONB: `{en: "...", zh_tw: "..."}`
- One readings table for ALL systems
- Deck-aware (tracks which deck used)

---

## 🎯 MVP SCOPE (Month 1-3, FIRST 12 WEEKS)

### ✅ INCLUDE:

1. **Tarot readings**
   - Single deck (RWS)
   - 3-card spread, Celtic Cross
   - Quick Draw mode only
   - Card flip animations

2. **AI Interpretation**
   - Gemini integration
   - English language only (initially)
   - Context-aware prompts

3. **Follow-up questions** ⚠️ CRITICAL MVP FEATURE
   - Chat interface
   - Simple version (full context, <20 messages)
   - NO context summarization yet
   - Tier limits: 3/10/unlimited

4. **Journal**
   - Save readings
   - View history
   - Basic search/filter

5. **Auth**
   - Email/password
   - Google OAuth
   - Supabase Auth

6. **Basic UI**
   - Clean, minimal design
   - Card display
   - Reading flow
   - Navigation

---

## 🔑 KEY ARCHITECTURAL DECISIONS

1. **AI Provider Abstraction** - Never hardcode Gemini, always use AIProvider
2. **Plugin System** - Each divination system is self-contained
3. **Universal Readings Table** - JSONB for flexibility, no migrations
4. **Deck Registry** - Decks as data, not code
5. **Multilingual from Day 1** - JSONB for all user-facing text
6. **Feature Flags** - Enable/disable without deployment
7. **Follow-up Questions** - Critical MVP feature, must be included

---

## 📝 NOTES

- Start with interface definition before implementing full animation system
- Manual card draw needed to allow inputting reversed cards
- Conversation about readings is a key feature
- Performance is critical - must run smoothly on mid-range Android devices
- Keep bundle size minimal
- TypeScript strict mode required

