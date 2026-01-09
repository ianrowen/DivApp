# Logo Files Audit

## Current Status
- **Directory**: `assets/images/logo` does NOT exist
- **Code References**: 3 files reference `divin8-card-curtains-horizontal.webp`

## Files Actually Used in Code

### ✅ REQUIRED (Currently Used)
1. **`divin8-card-curtains-horizontal.webp`** 
   - Used in:
     - `src/shared/components/DailyCardDraw.tsx` (card back image)
     - `src/features/auth/screens/LoginScreen.tsx` (login logo)
     - `src/shared/components/CardSelectionScreen.tsx` (card back image)
   - **Status**: REQUIRED - This is the only logo file actually used

### ❓ POTENTIALLY UNUSED (Based on earlier directory listings)
If these PNG files exist, they are likely NOT needed:

1. **`divin8 logo horizontal.png`** - Not referenced in code
2. **`divin8 logo vertical.png`** - Not referenced in code  
3. **`divin8-card-curtains-vertical.png`** - Not referenced in code
4. **`divin8-card-horizontal.png`** - Not referenced in code
5. **`divin8-card-vertical.png`** - Not referenced in code
6. **`divin8-card-curtains-horizontal - high res watermark.png`** - Not referenced in code
7. **`divin8-card-curtains-vertical - high res watermark.png`** - Not referenced in code
8. **`Screenshot_20251205-031251.png`** - Not referenced (likely temporary)
9. **`Gemini_Generated_Image_*.png`** - Not referenced (likely temporary)

### 📝 App Icons (Must Stay PNG)
These are required by `app.json` and must remain PNG:
- `assets/icon.png` - App icon
- `assets/adaptive-icon.png` - Android adaptive icon
- `assets/splash.png` - Splash screen
- `assets/favicon.png` - Web favicon

## Recommendations

### ✅ KEEP
- `divin8-card-curtains-horizontal.webp` (or create it if missing)
- All app icons (icon.png, adaptive-icon.png, splash.png, favicon.png)

### 🗑️ CAN DELETE (if they exist)
- All other PNG logo files (they have WebP equivalents or aren't used)
- Screenshot files
- Gemini generated images
- High-res watermark versions (unless needed for marketing)

## Action Items

1. **Create missing directory**: `assets/images/logo/` if it doesn't exist
2. **Ensure WebP file exists**: `divin8-card-curtains-horizontal.webp`
3. **Delete unused PNG logos** if they exist
4. **Verify app builds** after cleanup

