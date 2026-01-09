#!/usr/bin/env node
/**
 * Update app.json version to match package.json
 * This ensures version consistency across the project
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const appJsonPath = path.join(__dirname, '..', 'app.json');

try {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const newVersion = packageJson.version;

  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // Update version in app.json
  appJson.expo.version = newVersion;
  
  // Write back
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  
  console.log(`✅ Updated app.json version to ${newVersion}`);
} catch (error) {
  console.error('❌ Error updating version:', error);
  process.exit(1);
}



