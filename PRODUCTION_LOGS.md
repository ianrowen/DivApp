# Viewing Production Build Logs

## Android Production Builds

### Method 1: ADB Logcat (Recommended)
```powershell
# View all logs
adb logcat

# Filter for your app only
adb logcat | Select-String "divin8"

# Filter for specific tags (Gemini, Interpretation errors)
adb logcat | Select-String "Gemini|Interpretation|EXPO_PUBLIC_GEMINI_API_KEY"

# Save logs to file
adb logcat > production-logs.txt
```

### Method 2: Filter by Package Name
```powershell
# View logs for your app package
adb logcat | Select-String "com.divin8.app"

# Clear logs first, then capture new ones
adb logcat -c
adb logcat > app-logs.txt
```

### Method 3: Use Logcat Filters
```powershell
# Filter by log level (E = Error, W = Warning, I = Info)
adb logcat *:E | Select-String "divin8"

# Filter for specific tags
adb logcat -s ReactNativeJS:V Gemini:V Interpretation:V
```

## iOS Production Builds

### Method 1: Xcode Console
1. Connect device via USB
2. Open Xcode → Window → Devices and Simulators
3. Select your device
4. Click "Open Console" button
5. Filter for your app: `com.divin8.app`

### Method 2: Console.app (macOS)
1. Open Console.app
2. Select your connected device
3. Filter for your app bundle ID

### Method 3: Device Logs (iOS)
```bash
# View device logs
idevicesyslog | grep divin8

# Or use libimobiledevice
idevicesyslog -u <device-udid>
```

## What to Look For

### Startup Logs
- `✅ EXPO_PUBLIC_GEMINI_API_KEY is configured` - API key is present
- `❌ EXPO_PUBLIC_GEMINI_API_KEY not found` - API key missing

### Interpretation Logs
- `[Gemini] Request timeout after 60s` - Timeout occurred
- `[Gemini] API key is not configured` - API key error
- `[Gemini] Fetch error` - Network/API error
- `[Interpretation] Error generating interpretation` - General error

### Error Patterns
- Look for `[Gemini]` prefix for API-related errors
- Look for `[Interpretation]` prefix for interpretation flow errors
- Check for timeout messages after 60 seconds

## Quick Test Command

```powershell
# Clear logs, then start app and generate interpretation
adb logcat -c
# ... use app ...
adb logcat -d | Select-String "Gemini|Interpretation|EXPO_PUBLIC_GEMINI_API_KEY" > interpretation-logs.txt
```
