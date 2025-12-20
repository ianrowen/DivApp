#!/usr/bin/env node
/**
 * Optimize problematic PNG image for Android build
 * 
 * This script optimizes the divin8-card-curtains-horizontal.png file
 * to fix Android AAPT compilation errors.
 * 
 * Usage: npm install sharp && node scripts/optimize-problematic-image.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const INPUT_FILE = path.join(__dirname, '..', 'assets', 'images', 'logo', 'divin8-card-curtains-horizontal.png');
const OUTPUT_FILE = path.join(__dirname, '..', 'assets', 'images', 'logo', 'divin8-card-curtains-horizontal-optimized.png');
const BACKUP_FILE = path.join(__dirname, '..', 'assets', 'images', 'logo', 'divin8-card-curtains-horizontal-backup.png');

async function optimizeImage() {
  try {
    // Check if input file exists
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`❌ Input file not found: ${INPUT_FILE}`);
      process.exit(1);
    }

    // Create backup
    console.log('📦 Creating backup...');
    fs.copyFileSync(INPUT_FILE, BACKUP_FILE);
    console.log(`✅ Backup created: ${BACKUP_FILE}`);

    // Get original file info
    const originalStats = fs.statSync(INPUT_FILE);
    console.log(`\n📊 Original file size: ${(originalStats.size / 1024).toFixed(2)} KB`);

    // Optimize PNG: re-encode with proper settings for Android
    console.log('\n🔄 Optimizing PNG for Android...');
    const image = sharp(INPUT_FILE);
    const metadata = await image.metadata();
    
    console.log(`   Image dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`   Format: ${metadata.format}`);
    
    // Use more aggressive compression for Android compatibility
    await image
      .png({
        compressionLevel: 6,
        adaptiveFiltering: false,
        quality: 90,
        palette: metadata.channels <= 2, // Use palette for grayscale images
        effort: 7
      })
      .toFile(OUTPUT_FILE);

    const optimizedStats = fs.statSync(OUTPUT_FILE);
    console.log(`✅ Optimized file size: ${(optimizedStats.size / 1024).toFixed(2)} KB`);
    console.log(`📉 Size reduction: ${((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1)}%`);

    // Replace original with optimized version
    console.log('\n🔄 Replacing original file...');
    try {
      // On Windows, we need to unlink first, then copy
      if (process.platform === 'win32') {
        // Try to unlink the original file first
        try {
          fs.unlinkSync(INPUT_FILE);
        } catch (e) {
          // File might be locked, try renaming instead
          const TEMP_FILE = INPUT_FILE + '.old';
          fs.renameSync(INPUT_FILE, TEMP_FILE);
        }
      }
      fs.copyFileSync(OUTPUT_FILE, INPUT_FILE);
      fs.unlinkSync(OUTPUT_FILE);
      console.log('✅ Image optimized and replaced successfully!');
    } catch (error) {
      console.warn('\n⚠️  Could not replace original file (may be locked):', error.message);
      console.log(`📁 Optimized file saved as: ${OUTPUT_FILE}`);
      console.log('💡 Please manually replace the original file or close any programs using it.');
      throw error;
    }

    console.log('\n✨ Done! Try building again.');
    console.log(`💾 Backup saved at: ${BACKUP_FILE}`);

  } catch (error) {
    console.error('\n❌ Error optimizing image:', error.message);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n📦 Please install sharp first:');
      console.error('   npm install sharp --save-dev');
    }
    
    process.exit(1);
  }
}

optimizeImage();

