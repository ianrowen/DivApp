#!/usr/bin/env node
/**
 * Optimize images for tablets while maintaining quality
 * 
 * Strategy:
 * - Convert large PNGs to WebP (90% quality for tablets)
 * - Optimize JPG card images (max 800px width, 85% quality)
 * - Keep icons/splash as PNG (optimized)
 * 
 * Tablet considerations:
 * - iPad Pro: up to 2732x2048 (2x = 1366x1024 logical)
 * - Cards displayed at ~150-200px width (need 2x = 300-400px source)
 * - Max 800px width is sufficient for tablets (2x retina = 1600px logical)
 * 
 * Usage: npm install sharp && node scripts/optimize-images-for-tablets.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configuration for tablet optimization
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const CARDS_DIR = path.join(ASSETS_DIR, 'images', 'cards', 'rws');
const LOGO_DIR = path.join(ASSETS_DIR, 'images', 'logo');

// Tablet-optimized settings
const TABLET_MAX_WIDTH = 800; // Sufficient for tablets (2x = 1600px logical)
const TABLET_WEBP_QUALITY = 90; // High quality for tablets
const TABLET_JPEG_QUALITY = 85; // Good quality, smaller size
const CARD_MAX_WIDTH = 800; // Cards don't need to be larger than this

// Icons/splash should stay PNG but optimized
const KEEP_PNG = [
  'icon.png',
  'adaptive-icon.png',
  'favicon.png',
  'splash.png',
];

// Files to skip (already optimized or backups)
const SKIP_FILES = [
  'divin8-card-curtains-horizontal-q80.webp',
  'divin8-card-curtains-horizontal-q90.webp',
  'divin8-card-curtains-horizontal.webp',
  'divin8-card-curtains-horizontal medium res.jpg',
  'Screenshot_20251205-031251.png',
  'Gemini_Generated_Image_u35913u35913u359.png',
  'Gemini_Generated_Image_x84ifex84ifex84i.png',
];

async function optimizeCardImage(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Calculate dimensions - maintain aspect ratio
    let width = metadata.width;
    let height = metadata.height;
    
    if (width > CARD_MAX_WIDTH) {
      height = Math.round((height / width) * CARD_MAX_WIDTH);
      width = CARD_MAX_WIDTH;
    }
    
    const originalSize = fs.statSync(inputPath).size;
    
    // Convert to WebP for better compression
    await image
      .resize(width, height, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .webp({ 
        quality: TABLET_WEBP_QUALITY,
        effort: 6 // Higher effort = better compression (slower)
      })
      .toFile(outputPath);
    
    const optimizedSize = fs.statSync(outputPath).size;
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
    
    return {
      original: originalSize,
      optimized: optimizedSize,
      reduction: parseFloat(reduction),
      dimensions: `${metadata.width}x${metadata.height}`,
      newDimensions: width !== metadata.width ? `${width}x${height}` : null,
      format: 'webp'
    };
  } catch (error) {
    throw new Error(`Failed to optimize card: ${error.message}`);
  }
}

async function optimizeLogoImage(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Calculate dimensions
    let width = metadata.width;
    let height = metadata.height;
    
    if (width > TABLET_MAX_WIDTH) {
      height = Math.round((height / width) * TABLET_MAX_WIDTH);
      width = TABLET_MAX_WIDTH;
    }
    
    const originalSize = fs.statSync(inputPath).size;
    
    // Convert large PNGs to WebP
    if (metadata.format === 'png' && !KEEP_PNG.some(name => inputPath.includes(name))) {
      await image
        .resize(width, height, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .webp({ 
          quality: TABLET_WEBP_QUALITY,
          effort: 6
        })
        .toFile(outputPath);
      
      const optimizedSize = fs.statSync(outputPath).size;
      const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      
      return {
        original: originalSize,
        optimized: optimizedSize,
        reduction: parseFloat(reduction),
        dimensions: `${metadata.width}x${metadata.height}`,
        newDimensions: width !== metadata.width ? `${width}x${height}` : null,
        format: 'webp'
      };
    } else if (metadata.format === 'jpg' || metadata.format === 'jpeg') {
      // Optimize JPG logos
      await image
        .resize(width, height, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: TABLET_JPEG_QUALITY,
          mozjpeg: true // Better compression
        })
        .toFile(outputPath);
      
      const optimizedSize = fs.statSync(outputPath).size;
      const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      
      return {
        original: originalSize,
        optimized: optimizedSize,
        reduction: parseFloat(reduction),
        dimensions: `${metadata.width}x${metadata.height}`,
        newDimensions: width !== metadata.width ? `${width}x${height}` : null,
        format: 'jpg'
      };
    } else {
      // Keep PNG but optimize
      await image
        .resize(width, height, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          quality: 90
        })
        .toFile(outputPath);
      
      const optimizedSize = fs.statSync(outputPath).size;
      const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      
      return {
        original: originalSize,
        optimized: optimizedSize,
        reduction: parseFloat(reduction),
        dimensions: `${metadata.width}x${metadata.height}`,
        newDimensions: width !== metadata.width ? `${width}x${height}` : null,
        format: 'png'
      };
    }
  } catch (error) {
    throw new Error(`Failed to optimize logo: ${error.message}`);
  }
}

async function optimizeAllImages() {
  console.log('🖼️  Tablet-Optimized Image Optimization\n');
  console.log('📊 Processing images for tablet quality...\n');
  
  let totalOriginal = 0;
  let totalOptimized = 0;
  const results = [];
  
  // Process card images
  console.log('🃏 Optimizing card images...\n');
  if (fs.existsSync(CARDS_DIR)) {
    const cardFiles = fs.readdirSync(CARDS_DIR)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg'))
      .filter(file => !SKIP_FILES.includes(file));
    
    for (const file of cardFiles) {
      const inputPath = path.join(CARDS_DIR, file);
      const baseName = path.basename(file, path.extname(file));
      const outputPath = path.join(CARDS_DIR, `${baseName}.webp`);
      
      try {
        console.log(`🔄 Processing card: ${file}`);
        const stats = await optimizeCardImage(inputPath, outputPath);
        
        totalOriginal += stats.original;
        totalOptimized += stats.optimized;
        
        results.push({
          file: `cards/rws/${file}`,
          ...stats,
        });
        
        console.log(`   ✅ ${stats.dimensions} → WebP`);
        if (stats.newDimensions) {
          console.log(`   📐 Resized: ${stats.newDimensions}`);
        }
        console.log(`   💾 ${(stats.original / 1024).toFixed(2)} KB → ${(stats.optimized / 1024).toFixed(2)} KB (${stats.reduction}% reduction)\n`);
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
      }
    }
  }
  
  // Process logo images
  console.log('\n🎨 Optimizing logo images...\n');
  if (fs.existsSync(LOGO_DIR)) {
    const logoFiles = fs.readdirSync(LOGO_DIR)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
      .filter(file => !SKIP_FILES.includes(file));
    
    for (const file of logoFiles) {
      const inputPath = path.join(LOGO_DIR, file);
      const ext = path.extname(file);
      const baseName = path.basename(file, ext);
      
      // Determine output format
      const isPng = ext === '.png';
      const shouldKeepPng = KEEP_PNG.some(name => file.includes(name));
      const outputExt = (isPng && !shouldKeepPng) ? '.webp' : ext;
      const outputPath = path.join(LOGO_DIR, `${baseName}${outputExt}`);
      
      // Skip if output already exists and is newer
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).mtime > fs.statSync(inputPath).mtime) {
        console.log(`⏭️  Skipping (already optimized): ${file}\n`);
        continue;
      }
      
      try {
        console.log(`🔄 Processing logo: ${file}`);
        const stats = await optimizeLogoImage(inputPath, outputPath);
        
        totalOriginal += stats.original;
        totalOptimized += stats.optimized;
        
        results.push({
          file: `images/logo/${file}`,
          ...stats,
        });
        
        console.log(`   ✅ ${stats.dimensions} → ${stats.format.toUpperCase()}`);
        if (stats.newDimensions) {
          console.log(`   📐 Resized: ${stats.newDimensions}`);
        }
        console.log(`   💾 ${(stats.original / 1024).toFixed(2)} KB → ${(stats.optimized / 1024).toFixed(2)} KB (${stats.reduction}% reduction)\n`);
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total original size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total optimized size: ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total reduction: ${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%`);
  console.log(`Space saved: ${((totalOriginal - totalOptimized) / 1024 / 1024).toFixed(2)} MB`);
  console.log('='.repeat(70));
  
  console.log('\n📱 Tablet Quality Settings:');
  console.log(`   - Max width: ${TABLET_MAX_WIDTH}px (sufficient for 2x retina tablets)`);
  console.log(`   - WebP quality: ${TABLET_WEBP_QUALITY}% (high quality)`);
  console.log(`   - JPEG quality: ${TABLET_JPEG_QUALITY}% (good quality)`);
  
  console.log('\n📝 Next steps:');
  console.log('1. Review optimized images on tablet devices');
  console.log('2. Update cardImageLoader.ts to use .webp extensions');
  console.log('3. Test image quality on iPad Pro and Android tablets');
  console.log('4. Remove original JPG files if WebP works well');
  
  // Generate code update suggestions
  console.log('\n💡 Code updates needed:');
  console.log('Update src/systems/tarot/utils/cardImageLoader.ts:');
  console.log('   Change: require(\'.../00_Fool.jpg\')');
  console.log('   To:     require(\'.../00_Fool.webp\')');
}

optimizeAllImages().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});



