# Google Service Account Setup for EAS Submit

## File Location

The Google Service Account JSON file should be placed in your **project root directory**:

```
c:\Dev\divin8-app\google-service-account.json
```

Or if you have a file named like `api-0000000000000000000-111111-aaaaaabbbbbb.json`, you can either:

1. **Rename it** to `google-service-account.json` (recommended)
2. **Configure the path** in `eas.json` (see below)

## Current Status

- ❌ File not found in project root
- ✅ `.gitignore` already excludes it (won't be committed)
- ✅ `eas.json` ready to use it

## Setup Steps

### Option 1: Rename Your File (Recommended)

If you have the file `api-0000000000000000000-111111-aaaaaabbbbbb.json`:

1. **Copy it to project root**:
   ```powershell
   Copy-Item "path\to\api-0000000000000000000-111111-aaaaaabbbbbb.json" "c:\Dev\divin8-app\google-service-account.json"
   ```

2. **Or rename it** if it's already in the project:
   ```powershell
   Rename-Item "api-0000000000000000000-111111-aaaaaabbbbbb.json" "google-service-account.json"
   ```

### Option 2: Configure Custom Path in eas.json

If you want to keep the original filename, update `eas.json`:

```json
{
  "submit": {
    "production": {
      "android": {
        "track": "closed",
        "serviceAccountKeyPath": "./api-0000000000000000000-111111-aaaaaabbbbbb.json"
      }
    }
  }
}
```

## Getting the Service Account File

If you don't have the file yet:

1. **Go to Google Cloud Console**:
   - https://console.cloud.google.com/

2. **Navigate to IAM & Admin → Service Accounts**:
   - https://console.cloud.google.com/iam-admin/serviceaccounts

3. **Find or Create Service Account**:
   - Look for a service account for your app
   - Or create a new one with "Editor" or "Service Account User" role

4. **Create Key**:
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Select "JSON" format
   - Download the file

5. **Place the file**:
   - Save it as `google-service-account.json` in your project root
   - Or use the custom path option above

## Required Permissions

The service account needs these permissions in Google Play Console:

1. **Go to Google Play Console**:
   - https://play.google.com/console

2. **Settings → API access**:
   - Find your service account
   - Grant permissions:
     - ✅ View app information
     - ✅ Manage production releases
     - ✅ Manage testing track releases

## Verify Setup

After placing the file, test submission:

```bash
# This will use the service account file automatically
eas submit --platform android --profile production
```

Or it will be used automatically when you run:
```bash
npm run build:android:production
```

## Security Notes

- ✅ File is in `.gitignore` (won't be committed to git)
- ✅ Keep the file secure and never commit it
- ✅ The file contains sensitive credentials
- ✅ Only share with trusted team members

## Troubleshooting

### File Not Found Error

If you get an error about the service account file:

1. **Check file location**:
   ```powershell
   Test-Path "google-service-account.json"
   ```

2. **Verify file name** matches what's in `eas.json` (if custom path)

3. **Check file permissions** - make sure it's readable

### Permission Errors

If submission fails with permission errors:

1. Verify service account has correct permissions in Google Play Console
2. Check that the service account email matches in Play Console
3. Ensure the service account is linked to your Play Console account
