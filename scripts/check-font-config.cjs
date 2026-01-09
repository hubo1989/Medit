#!/usr/bin/env node
/**
 * Check that all fonts used in theme presets exist in font-config.json
 * Usage: node scripts/check-font-config.js
 */

const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '../src/themes/presets');
const FONT_CONFIG_PATH = path.join(__dirname, '../src/themes/font-config.json');

function main() {
  console.log('🔍 Checking font configuration...\n');

  // Load font-config.json
  const fontConfig = JSON.parse(fs.readFileSync(FONT_CONFIG_PATH, 'utf8'));
  const configuredFonts = new Set(Object.keys(fontConfig.fonts));

  console.log(`📋 Configured fonts in font-config.json (${configuredFonts.size}):`);
  console.log(`   ${[...configuredFonts].join(', ')}\n`);

  // Collect all fonts used in theme presets
  const usedFonts = new Map(); // font -> [theme files]
  const themeFiles = fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.json'));

  for (const file of themeFiles) {
    const filePath = path.join(THEMES_DIR, file);
    const theme = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Extract fontFamily from typography settings
    const fonts = extractFonts(theme);
    for (const font of fonts) {
      if (!usedFonts.has(font)) {
        usedFonts.set(font, []);
      }
      usedFonts.get(font).push(file);
    }
  }

  console.log(`📂 Scanned ${themeFiles.length} theme files\n`);
  console.log(`🎨 Fonts used in themes (${usedFonts.size}):`);
  
  // Check each font
  const missingFonts = [];
  const validFonts = [];

  for (const [font, files] of [...usedFonts.entries()].sort()) {
    const exists = configuredFonts.has(font);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${font} (used in: ${files.join(', ')})`);
    
    if (!exists) {
      missingFonts.push({ font, files });
    } else {
      validFonts.push(font);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  
  if (missingFonts.length === 0) {
    console.log('✅ All fonts are properly configured!\n');
    return 0;
  } else {
    console.log(`❌ Missing ${missingFonts.length} font(s) in font-config.json:\n`);
    
    for (const { font, files } of missingFonts) {
      console.log(`   • "${font}"`);
      console.log(`     Used in: ${files.join(', ')}`);
      console.log(`     Suggested config:`);
      console.log(generateFontConfig(font));
    }
    
    return 1;
  }
}

/**
 * Extract all fontFamily values from a theme object
 */
function extractFonts(theme, fonts = new Set()) {
  if (typeof theme === 'object' && theme !== null) {
    for (const [key, value] of Object.entries(theme)) {
      if (key === 'fontFamily' && typeof value === 'string') {
        fonts.add(value);
      } else if (typeof value === 'object') {
        extractFonts(value, fonts);
      }
    }
  }
  return fonts;
}

/**
 * Generate a suggested font configuration entry
 */
function generateFontConfig(fontName) {
  // Determine font category for appropriate fallbacks
  const isSerif = /georgia|times|palatino|garamond|century|book/i.test(fontName);
  const isMono = /consolas|monaco|courier|mono|code/i.test(fontName);
  const isChinese = /sim|fang|kai|hei|song|ming/i.test(fontName);
  
  let webFallback, docxAscii, docxEastAsia;
  
  if (isMono) {
    webFallback = `'${fontName}', Monaco, 'Courier New', monospace, FangSong, STFangsong`;
    docxAscii = fontName;
    docxEastAsia = 'FangSong';
  } else if (isChinese) {
    webFallback = `'${fontName}', serif, SimSun, STSong`;
    docxAscii = 'Times New Roman';
    docxEastAsia = fontName;
  } else if (isSerif) {
    webFallback = `'${fontName}', Georgia, 'Times New Roman', serif, SimSun, STSong`;
    docxAscii = fontName;
    docxEastAsia = 'SimSun';
  } else {
    webFallback = `'${fontName}', Arial, Helvetica, sans-serif, SimHei, STHeiti`;
    docxAscii = fontName;
    docxEastAsia = 'SimHei';
  }

  const config = {
    name: fontName,
    displayName: fontName,
    webFallback,
    docx: {
      ascii: docxAscii,
      eastAsia: docxEastAsia
    }
  };

  return JSON.stringify({ [fontName]: config }, null, 2)
    .split('\n')
    .map(line => '     ' + line)
    .join('\n') + '\n';
}

process.exit(main());
