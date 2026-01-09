#!/usr/bin/env node
/**
 * Convert problematic PNG to WebP for smaller build size
 * 
 * Converts divin8-card-curtains-horizontal.png to WebP format
 * which is much smaller and Android-friendly.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const INPUT_FILE = path.join(__dirname, '..', 'assets', 'images', 'logo', 'divin8-card-curtains-horizontal.png');
const OUTPUT_FILE = path.join(__dirname, '..', 'assets', 'images', 'logo', 'divin8-card-curtains-horizontal.webp');
const BACKUP_FILE = path.join(__dirname, '..', 'assets', 'images', 'logo', 'divin8-card-curtains-horizontal-backup.png');

async function convertToWebP() {
  try {
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`❌ Input file not found: ${INPUT_FILE}`);
      process.exit(1);
    }

    const originalStats = fs.statSync(INPUT_FILE);
    const image = sharp(INPUT_FILE);
    const metadata = await image.metadata();
    
    console.log('📊 Original PNG:');
    console.log(`   Size: ${(originalStats.size / 1024).toFixed(2)} KB (${(originalStats.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`   Dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`   Format: ${metadata.format}\n`);

    // Convert to WebP with quality optimization
    console.log('🔄 Converting to WebP...');
    
    // Try different quality levels to find best size/quality balance
    const qualities = [80, 85, 90];
    let bestSize = Infinity;
    let bestQuality = 85;
    let bestFile = null;
    
    for (const quality of qualities) {
      const testFile = OUTPUT_FILE.replace('.webp', `-q${quality}.webp`);
      await image
        .webp({ quality, effort: 6 })
        .toFile(testFile);
      
      const testStats = fs.statSync(testFile);
      const reduction = ((1 - testStats.size / originalStats.size) * 100).toFixed(1);
      
      console.log(`   Quality ${quality}: ${(testStats.size / 1024).toFixed(2)} KB (${reduction}% reduction)`);
      
      if (testStats.size < bestSize && quality >= 85) {
        bestSize = testStats.size;
        bestQuality = quality;
        bestFile = testFile;
      }
      
      // Keep the best one, delete others
      if (testFile !== bestFile && fs.existsSync(testFile)) {
        if (bestFile && testFile !== bestFile.replace(`-q${bestQuality}`, `-q${quality}`)) {
          fs.unlinkSync(testFile);
        }
      }
    }
    
    // Use the best quality version
    if (bestFile && bestFile !== OUTPUT_FILE) {
      fs.copyFileSync(bestFile, OUTPUT_FILE);
      fs.unlinkSync(bestFile);
    } else {
      // Create final version with best quality
      await image
        .webp({ quality: bestQuality, effort: 6 })
        .toFile(OUTPUT_FILE);
    }
    
    const optimizedStats = fs.statSync(OUTPUT_FILE);
    const reduction = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1);
    const saved = originalStats.size - optimizedStats.size;
    
    console.log(`\n✅ Conversion complete!`);
    console.log(`   WebP size: ${(optimizedStats.size / 1024).toFixed(2)} KB (${(optimizedStats.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`   Size reduction: ${reduction}%`);
    console.log(`   Space saved: ${(saved / 1024).toFixed(2)} KB (${(saved / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`   Quality: ${bestQuality}`);
    
    console.log(`\n📝 Next steps:`);
    console.log(`1. Update code to use: divin8-card-curtains-horizontal.webp`);
    console.log(`2. Test the app to ensure image displays correctly`);
    console.log(`3. Consider removing the PNG version to save space`);
    
    console.log(`\n💾 Files:`);
    console.log(`   WebP: ${OUTPUT_FILE}`);
    if (fs.existsSync(BACKUP_FILE)) {
      console.log(`   Backup PNG: ${BACKUP_FILE}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n📦 Please install sharp first:');
      console.error('   npm install sharp --save-dev');
    }
    process.exit(1);
  }
}

convertToWebP();



