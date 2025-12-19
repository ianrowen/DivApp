#!/usr/bin/env node
/**
 * Extract App Icon Script
 * 
 * Extracts the central circular disc area from the source image and creates
 * app icon and splash screen assets.
 * 
 * Usage: npm install sharp && node scripts/extract-app-icon.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configuration
// Primary source image path (as specified)
const PRIMARY_SOURCE_IMAGE = '/mnt/user-data/uploads/divin8-card-curtains-horizontal_medium_res.jpg';

// Fallback paths if primary doesn't exist
const FALLBACK_SOURCE_IMAGES = [
  // Local project paths
  path.join(__dirname, '..', 'assets', 'images', 'logo', 'divin8-card-curtains-horizontal medium res.jpg'),
  path.join(__dirname, '..', 'assets', 'images', 'logo', 'divin8-card-curtains-horizontal_medium_res.jpg'),
  // Windows paths (common locations)
  path.join('C:', 'Users', process.env.USERNAME || 'User', 'Downloads', 'divin8-card-curtains-horizontal_medium_res.jpg'),
  path.join('C:', 'Users', process.env.USERNAME || 'User', 'Desktop', 'divin8-card-curtains-horizontal_medium_res.jpg'),
  // Alternative Windows path format
  'C:\\Users\\' + (process.env.USERNAME || 'User') + '\\Downloads\\divin8-card-curtains-horizontal_medium_res.jpg',
];

const OUTPUT_DIR = path.join(__dirname, '..', 'assets');
const ICON_SIZE = 1024;
const SPLASH_WIDTH = 1284;
const SPLASH_HEIGHT = 2778;
const SPLASH_BG_COLOR = '#000000';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ Created output directory: ${OUTPUT_DIR}`);
}

async function extractAppIcon() {
  try {
    // Find the source image (check primary path first)
    let SOURCE_IMAGE = null;
    console.log('🔍 Searching for source image...');
    
    // Check primary path first
    if (fs.existsSync(PRIMARY_SOURCE_IMAGE)) {
      SOURCE_IMAGE = PRIMARY_SOURCE_IMAGE;
      console.log(`✅ Found source image at primary location: ${PRIMARY_SOURCE_IMAGE}`);
    } else {
      console.log(`⚠️  Primary source not found: ${PRIMARY_SOURCE_IMAGE}`);
      console.log('🔍 Checking fallback locations...');
      
      // Check fallback paths
      for (const possiblePath of FALLBACK_SOURCE_IMAGES) {
        if (fs.existsSync(possiblePath)) {
          SOURCE_IMAGE = possiblePath;
          console.log(`✅ Found source image at fallback location: ${possiblePath}`);
          break;
        }
      }
    }

    if (!SOURCE_IMAGE) {
      console.error('❌ Source image not found. Tried the following paths:');
      console.error(`   Primary: ${PRIMARY_SOURCE_IMAGE}`);
      FALLBACK_SOURCE_IMAGES.forEach(p => console.error(`   Fallback: ${p}`));
      throw new Error('Please ensure the source image exists in one of the expected locations.');
    }

    console.log(`\n📖 Reading source image: ${SOURCE_IMAGE}`);
    
    // Get image metadata
    const metadata = await sharp(SOURCE_IMAGE).metadata();
    console.log(`📐 Source image dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`📊 Source image format: ${metadata.format}`);
    console.log(`🎨 Color space: ${metadata.space || 'unknown'}`);

    // Calculate crop region for central circular disc area
    // Extract center 95% of image to ensure the FULL ornate gold frame,
    // all filigree, and all figures are included
    // Use the smaller dimension to create a square crop that captures everything
    const cropPercentage = 0.95; // 95% to ensure complete capture of frame, filigree, and figures
    const minDimension = Math.min(metadata.width, metadata.height);
    const cropSize = Math.floor(minDimension * cropPercentage);
    
    // Center the square crop on the infinity symbol and bagua
    const left = Math.floor((metadata.width - cropSize) / 2);
    const top = Math.floor((metadata.height - cropSize) / 2);
    const cropWidth = cropSize;
    const cropHeight = cropSize;

    console.log(`\n✂️  Cropping region (95% to include full gold filigree and figures):`);
    console.log(`   Left: ${left}px`);
    console.log(`   Top: ${top}px`);
    console.log(`   Width: ${cropWidth}px`);
    console.log(`   Height: ${cropHeight}px`);
    console.log(`   Region: ${left}, ${top}, ${cropWidth}x${cropHeight}`);

    // Step 1: Extract and resize to 1024x1024 square
    // This ensures all gold filigree and figures are included
    const croppedSquare = await sharp(SOURCE_IMAGE)
      .extract({
        left: left,
        top: top,
        width: cropWidth,
        height: cropHeight,
      })
      .resize(ICON_SIZE, ICON_SIZE, {
        fit: 'cover', // Fill the entire 1024x1024 square
        position: 'center', // Center the image during resize
      })
      .png()
      .toBuffer();

    console.log(`\n✅ Created ${ICON_SIZE}x${ICON_SIZE} square crop`);

    // Step 2: Create circular mask for perfect spinning logo
    // The circular shape works great for rotation animations
    const radius = ICON_SIZE / 2;
    const centerX = ICON_SIZE / 2;
    const centerY = ICON_SIZE / 2;
    
    // Create circular mask using SVG
    // White circle on transparent background - this will be used as a mask
    const circularMaskSvg = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="white"/>
    </svg>`;

    // Create the mask image from SVG (with alpha channel for transparency)
    const maskBuffer = await sharp(Buffer.from(circularMaskSvg))
      .ensureAlpha() // Ensure alpha channel for transparency
      .png()
      .toBuffer();

    // Apply circular mask to create circular icon
    // This creates a perfect circle suitable for spinning
    // The output is still square (1024x1024) but with circular content and transparent corners
    // This works perfectly for:
    // - App icons (iOS/Android will apply their own rounded corners, square format required)
    // - Spinning animations (the circular content rotates smoothly)
    const iconBuffer = await sharp(croppedSquare)
      .ensureAlpha() // Ensure alpha channel for transparent corners
      .composite([
        {
          input: maskBuffer,
          blend: 'dest-in', // Use mask to create circular shape with transparent corners
        },
      ])
      .png()
      .toBuffer();

    console.log(`✅ Applied circular mask (radius: ${radius}px)`);
    console.log(`✅ Created ${ICON_SIZE}x${ICON_SIZE} circular icon`);
    console.log(`   - Square canvas (required for iOS/Android app icons)`);
    console.log(`   - Circular content with transparent corners (perfect for spinning)`);

    // Save icon.png
    const iconPath = path.join(OUTPUT_DIR, 'icon.png');
    await fs.promises.writeFile(iconPath, iconBuffer);
    console.log(`💾 Saved: ${iconPath}`);

    // Save adaptive-icon.png (same as icon)
    const adaptiveIconPath = path.join(OUTPUT_DIR, 'adaptive-icon.png');
    await fs.promises.writeFile(adaptiveIconPath, iconBuffer);
    console.log(`💾 Saved: ${adaptiveIconPath}`);

    // Create splash screen
    // Center the icon on black background with padding
    // Calculate padding to make icon not too large (about 60% of height)
    const maxIconSize = Math.floor(SPLASH_HEIGHT * 0.6);
    const iconSizeForSplash = Math.min(ICON_SIZE, maxIconSize);
    const paddingX = Math.floor((SPLASH_WIDTH - iconSizeForSplash) / 2);
    const paddingY = Math.floor((SPLASH_HEIGHT - iconSizeForSplash) / 2);

    console.log(`\n🎨 Creating splash screen:`);
    console.log(`   Dimensions: ${SPLASH_WIDTH}x${SPLASH_HEIGHT}`);
    console.log(`   Icon size on splash: ${iconSizeForSplash}x${iconSizeForSplash}`);
    console.log(`   Padding: ${paddingX}px horizontal, ${paddingY}px vertical`);
    console.log(`   Background color: ${SPLASH_BG_COLOR}`);

    // Resize icon for splash if needed
    const splashIconBuffer = iconSizeForSplash !== ICON_SIZE
      ? await sharp(iconBuffer)
          .resize(iconSizeForSplash, iconSizeForSplash, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
          })
          .png()
          .toBuffer()
      : iconBuffer;

    // Create splash screen with black background and centered icon
    const splashBuffer = await sharp({
      create: {
        width: SPLASH_WIDTH,
        height: SPLASH_HEIGHT,
        channels: 3,
        background: SPLASH_BG_COLOR,
      },
    })
      .composite([
        {
          input: splashIconBuffer,
          top: paddingY,
          left: paddingX,
        },
      ])
      .png()
      .toBuffer();

    // Save splash.png
    const splashPath = path.join(OUTPUT_DIR, 'splash.png');
    await fs.promises.writeFile(splashPath, splashBuffer);
    console.log(`💾 Saved: ${splashPath}`);

    // Verify files were created
    const files = [
      { path: iconPath, name: 'icon.png' },
      { path: adaptiveIconPath, name: 'adaptive-icon.png' },
      { path: splashPath, name: 'splash.png' },
    ];

    console.log('\n✅ All files created successfully:');
    for (const file of files) {
      const stats = await fs.promises.stat(file.path);
      const sizeKB = (stats.size / 1024).toFixed(2);
      const filePath = path.relative(process.cwd(), file.path);
      console.log(`   ${file.name}: ${sizeKB} KB (${filePath})`);
    }

    console.log('\n🎉 Icon extraction complete!');
    console.log('\n📝 Summary:');
    console.log(`   Source: ${SOURCE_IMAGE}`);
    console.log(`   Source size: ${metadata.width}x${metadata.height}`);
    console.log(`   Cropped region: ${left}, ${top}, ${cropWidth}x${cropHeight}`);
    console.log(`   Output files:`);
    files.forEach(file => {
      const filePath = path.relative(process.cwd(), file.path);
      console.log(`     - ${filePath}`);
    });

  } catch (error) {
    console.error('\n❌ Error extracting app icon:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error('❌ Error: sharp package not found.');
  console.error('   Please install it first: npm install sharp');
  process.exit(1);
}

// Run the script
extractAppIcon();
