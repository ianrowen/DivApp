#!/usr/bin/env node
/**
 * Optimize all images for Android build size reduction
 * 
 * Converts PNG images to WebP format (smaller, Android-friendly)
 * and optimizes image sizes while retaining quality.
 * 
 * Usage: npm install sharp && node scripts/optimize-all-images.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configuration
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const MAX_WIDTH = 2048; // Maximum width for images
const WEBP_QUALITY = 85; // WebP quality (0-100)
const PNG_QUALITY = 90; // PNG quality when keeping PNG format

// Images to optimize
const IMAGES_TO_OPTIMIZE = [
  'images/logo/divin8-card-curtains-horizontal.png',
  'images/logo/divin8-card-curtains-vertical.png',
  'images/logo/divin8-card-horizontal.png',
  'images/logo/divin8-card-vertical.png',
];

// Images that should stay as PNG (icons, small graphics)
const KEEP_PNG = [
  'icon.png',
  'adaptive-icon.png',
  'favicon.png',
  'splash.png',
];

async function optimizeImage(inputPath, outputPath, convertToWebP = true) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Calculate new dimensions if needed
    let width = metadata.width;
    let height = metadata.height;
    
    if (width > MAX_WIDTH) {
      height = Math.round((height / width) * MAX_WIDTH);
      width = MAX_WIDTH;
    }
    
    const stats = {
      original: fs.statSync(inputPath).size,
      format: metadata.format,
      dimensions: `${metadata.width}x${metadata.height}`,
      newDimensions: width !== metadata.width ? `${width}x${height}` : null,
    };
    
    if (convertToWebP && !KEEP_PNG.some(name => inputPath.includes(name))) {
      // Convert to WebP
      await image
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outputPath);
      
      stats.newFormat = 'webp';
      stats.optimized = fs.statSync(outputPath).size;
    } else {
      // Optimize PNG
      await image
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          quality: PNG_QUALITY,
          palette: metadata.channels <= 2,
        })
        .toFile(outputPath);
      
      stats.newFormat = 'png';
      stats.optimized = fs.statSync(outputPath).size;
    }
    
    stats.reduction = ((1 - stats.optimized / stats.original) * 100).toFixed(1);
    return stats;
  } catch (error) {
    throw new Error(`Failed to optimize ${inputPath}: ${error.message}`);
  }
}

async function optimizeAllImages() {
  console.log('🖼️  Image Optimization Tool\n');
  console.log('📊 Analyzing and optimizing images...\n');
  
  let totalOriginal = 0;
  let totalOptimized = 0;
  const results = [];
  
  for (const imagePath of IMAGES_TO_OPTIMIZE) {
    const inputPath = path.join(ASSETS_DIR, imagePath);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping (not found): ${imagePath}`);
      continue;
    }
    
    const ext = path.extname(imagePath);
    const baseName = path.basename(imagePath, ext);
    const dir = path.dirname(imagePath);
    
    // Create WebP version
    const webpPath = path.join(ASSETS_DIR, dir, `${baseName}.webp`);
    
    try {
      console.log(`🔄 Processing: ${imagePath}`);
      const stats = await optimizeImage(inputPath, webpPath, true);
      
      totalOriginal += stats.original;
      totalOptimized += stats.optimized;
      
      results.push({
        file: imagePath,
        ...stats,
      });
      
      console.log(`   ✅ ${stats.dimensions} → ${stats.newFormat.toUpperCase()}`);
      if (stats.newDimensions) {
        console.log(`   📐 Resized: ${stats.newDimensions}`);
      }
      console.log(`   💾 ${(stats.original / 1024).toFixed(2)} KB → ${(stats.optimized / 1024).toFixed(2)} KB (${stats.reduction}% reduction)\n`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total original size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total optimized size: ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total reduction: ${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%`);
  console.log(`Space saved: ${((totalOriginal - totalOptimized) / 1024 / 1024).toFixed(2)} MB`);
  console.log('='.repeat(60));
  
  console.log('\n📝 Next steps:');
  console.log('1. Review the optimized WebP files');
  console.log('2. Update your code to use .webp extensions instead of .png');
  console.log('3. Test the app to ensure images display correctly');
  console.log('4. Remove original PNG files if WebP works well');
  
  // Generate code update suggestions
  console.log('\n💡 Code updates needed:');
  results.forEach(result => {
    if (result.newFormat === 'webp') {
      const oldPath = result.file;
      const newPath = oldPath.replace(/\.png$/i, '.webp');
      console.log(`   ${oldPath} → ${newPath}`);
    }
  });
}

optimizeAllImages().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});



