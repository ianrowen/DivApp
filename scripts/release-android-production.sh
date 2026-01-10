#!/bin/bash
# Android Production Release Script
# This script builds, submits to Google Play, and publishes OTA update

set -e

echo "🚀 Starting Android Production Release Process"
echo ""

# Step 1: Build Android Production
echo "📦 Step 1: Building Android production build..."
npm run build:android:production

echo ""
echo "✅ Build completed! Waiting for build to finish processing..."
echo ""

# Step 2: Submit to Google Play
echo "📤 Step 2: Submitting to Google Play..."
npm run submit:android

echo ""
echo "✅ Submitted to Google Play!"
echo ""

# Step 3: Publish OTA Update
echo "🔄 Step 3: Publishing OTA update to production channel..."
eas update --branch production --message "Production release update"

echo ""
echo "✅ OTA update published!"
echo ""
echo "🎉 Release complete!"
echo ""
echo "Next steps:"
echo "1. Monitor build status: https://expo.dev/accounts/irowen/projects/divin8-app/builds"
echo "2. Check Google Play Console for submission status"
echo "3. Users will receive OTA update automatically"
