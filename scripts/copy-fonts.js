const fs = require('fs');
const path = require('path');

// Copy fonts from @fontsource package - using chinese-simplified subset which is ~1.1MB
// This contains most Chinese characters needed for resume optimization
const FONTS_DIR = path.join(__dirname, '..', 'public', 'fonts');
const FONTSOURCE_DIR = path.join(
  __dirname,
  '..',
  'node_modules',
  '@fontsource',
  'noto-sans-sc',
  'files'
);

const FONTS = [
  {
    source: 'noto-sans-sc-chinese-simplified-400-normal.woff2',
    filename: 'NotoSansSC-Regular.woff2',
  },
  {
    source: 'noto-sans-sc-chinese-simplified-700-normal.woff2',
    filename: 'NotoSansSC-Bold.woff2',
  },
];

// Ensure fonts directory exists
if (!fs.existsSync(FONTS_DIR)) {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
}

// Copy a single font file
function copyFont(source, filename) {
  const sourcePath = path.join(FONTSOURCE_DIR, source);
  const destPath = path.join(FONTS_DIR, filename);

  // Check if source exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source font not found: ${sourcePath}`);
    return false;
  }

  // Check if dest already exists and is reasonably sized
  if (fs.existsSync(destPath)) {
    const stats = fs.statSync(destPath);
    if (stats.size > 100000) {
      console.log(`Skipping ${filename} (already exists, ${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      return true;
    }
  }

  fs.copyFileSync(sourcePath, destPath);
  const stats = fs.statSync(destPath);
  console.log(`Copied ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  return true;
}

// Copy all fonts
async function copyAllFonts() {
  console.log('Copying fonts from @fontsource/noto-sans-sc...');
  console.log(`Target directory: ${FONTS_DIR}\n`);

  let allSuccess = true;
  for (const font of FONTS) {
    if (!copyFont(font.source, font.filename)) {
      allSuccess = false;
    }
  }

  if (allSuccess) {
    console.log('\nFont copy complete!');
  } else {
    console.error('\nSome fonts failed to copy!');
    process.exit(1);
  }
}

copyAllFonts();
