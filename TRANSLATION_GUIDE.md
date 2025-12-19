# Translation Guide

This guide explains how to ensure all user-facing text in the Divin8 app is properly translated.

## Quick Start

1. **Always use translations** for user-facing text:
   ```tsx
   // ✅ Good
   <ThemedText>{t('common.appName')}</ThemedText>
   <Stack.Screen options={{ title: t('statistics.title') }} />
   
   // ❌ Bad
   <ThemedText>Divin8</ThemedText>
   <Stack.Screen options={{ title: 'Statistics' }} />
   ```

2. **Add new translation keys** to `src/i18n/translations/en.ts`:
   ```typescript
   export default {
     common: {
       appName: 'Divin8',
       // Add your new key here
       myNewKey: 'My New Text',
     },
   };
   ```

3. **Auto-translate to Chinese**:
   ```bash
   npm run sync-translations
   ```

4. **Check for hardcoded strings**:
   ```bash
   npm run check-translations
   ```

## Translation System

### Supported Locales

- **English (en)**: Default locale
- **Traditional Chinese (zh-TW)**: Taiwan market

### File Structure

```
src/i18n/
├── index.ts                    # i18n setup and hooks
└── translations/
    ├── en.ts                   # English translations (source of truth)
    └── zh-TW.ts                # Traditional Chinese translations
```

### Using Translations

#### In React Components

```tsx
import { useTranslation } from '../i18n';

export default function MyScreen() {
  const { t, locale, setLocale } = useTranslation();
  
  return (
    <View>
      <Text>{t('common.appName')}</Text>
      <Text>{t('home.welcome')}</Text>
    </View>
  );
}
```

#### In Screen Options (Expo Router)

```tsx
import { Stack } from 'expo-router';
import { useTranslation } from '../i18n';

export default function MyScreen() {
  const { t } = useTranslation();
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: t('myScreen.title'),  // ✅ Use translation
          // title: 'My Screen',        // ❌ Don't hardcode
        }}
      />
      {/* Screen content */}
    </>
  );
}
```

#### In Tab Navigation

```tsx
import { Tabs } from 'expo-router';
import { useTranslation } from '../i18n';

export default function TabsLayout() {
  const { t } = useTranslation();
  
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),        // ✅ Header title
          tabBarLabel: t('tabs.home'),  // ✅ Tab label
        }}
      />
    </Tabs>
  );
}
```

## Adding New Translations

### Step 1: Add to English (en.ts)

Add your new key to `src/i18n/translations/en.ts`:

```typescript
export default {
  myFeature: {
    title: 'My Feature',
    description: 'This is my new feature',
    buttonLabel: 'Get Started',
  },
};
```

### Step 2: Auto-Translate to Chinese

Run the sync script:

```bash
npm run sync-translations
```

This will:
- Detect missing keys in `zh-TW.ts`
- Use Gemini AI to translate them
- Update `zh-TW.ts` automatically

### Step 3: Verify

Check that translations work:

```bash
# Check for hardcoded strings
npm run check-translations

# Test in app (switch locale in Profile screen)
```

## Translation Key Naming

Use a hierarchical structure:

```
feature.section.item
```

Examples:
- `common.appName` - Common app name
- `home.welcome` - Home screen welcome text
- `history.title` - History screen title
- `profile.birthDate` - Profile birth date label
- `statistics.totalReadings` - Statistics total readings

## What Should Be Translated

### ✅ Translate These

- Screen titles and headers
- Button labels
- Form labels and placeholders
- Error messages
- Success messages
- Alert dialogs
- Tab labels
- Menu items
- Help text
- Empty states
- Loading messages

### ❌ Don't Translate These

- Brand names: "Divin8"
- Proper nouns: "Rider-Waite-Smith", "I Ching"
- Technical terms: "iOS", "Android", "Expo"
- API keys, URLs, file paths
- Code comments
- Console logs (unless user-facing)

## Development Workflow

### Before Committing

1. **Check for hardcoded strings**:
   ```bash
   npm run check-translations
   ```

2. **Sync translations** (if you added new keys):
   ```bash
   npm run sync-translations
   ```

3. **Test in both locales**:
   - Switch language in Profile screen
   - Verify all text displays correctly

### During Development

- The i18n system will **warn in console** if a translation key is missing
- Look for warnings like: `⚠️ [i18n] Missing translation key: "my.key"`

## Automated Checks

### Runtime Warnings

In development mode, the app will warn in the console if:
- A translation key is missing
- A translation returns `[missing "key"]`

### Static Analysis

Run the check script to find hardcoded strings:

```bash
npm run check-translations
```

This scans all `.ts` and `.tsx` files for:
- Hardcoded screen titles
- Hardcoded button labels
- Hardcoded alert messages
- Other common UI strings

## Common Patterns

### Screen Title

```tsx
// ✅ Good
<Stack.Screen options={{ title: t('myScreen.title') }} />

// ❌ Bad
<Stack.Screen options={{ title: 'My Screen' }} />
```

### Button Text

```tsx
// ✅ Good
<ThemedButton title={t('common.save')} />

// ❌ Bad
<ThemedButton title="Save" />
```

### Alert Messages

```tsx
// ✅ Good
Alert.alert(
  t('common.error'),
  t('myFeature.errorMessage'),
  [{ text: t('common.ok') }]
);

// ❌ Bad
Alert.alert('Error', 'Something went wrong', [{ text: 'OK' }]);
```

### Conditional Text

```tsx
// ✅ Good
<Text>{t(hasError ? 'common.error' : 'common.success')}</Text>

// ❌ Bad
<Text>{hasError ? 'Error' : 'Success'}</Text>
```

## Troubleshooting

### Missing Translation Warning

If you see: `⚠️ [i18n] Missing translation key: "my.key"`

1. Add the key to `src/i18n/translations/en.ts`
2. Run `npm run sync-translations`
3. Restart the app

### Translation Not Updating

1. Check that the key exists in both `en.ts` and `zh-TW.ts`
2. Verify the key path is correct (case-sensitive)
3. Clear app cache and restart
4. Check console for errors

### Hardcoded String Detected

If `check-translations` finds a hardcoded string:

1. Identify the appropriate translation key (or create one)
2. Replace the hardcoded string with `t('key.path')`
3. Add the key to `en.ts` if it doesn't exist
4. Run `npm run sync-translations`

## Best Practices

1. **Always use translations** - Never hardcode user-facing text
2. **Use descriptive key names** - `history.deleteWarning` not `msg1`
3. **Group related keys** - Keep related translations together
4. **Test both locales** - Always verify Chinese translations
5. **Run checks before committing** - Use `check-translations` script
6. **Keep keys consistent** - Use the same key for the same concept
7. **Document complex translations** - Add comments for context

## Resources

- Translation files: `src/i18n/translations/`
- i18n setup: `src/i18n/index.ts`
- Sync script: `src/scripts/syncTranslations.ts`
- Check script: `scripts/check-translations.ts`

## Questions?

If you're unsure whether something should be translated:
1. Ask: "Would a user see this text?"
2. If yes → Translate it
3. If no → Don't translate it











