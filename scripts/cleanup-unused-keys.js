#!/usr/bin/env node

/**
 * Automatically detect and remove unused translation keys from all locale files
 */

import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.join(import.meta.dirname, '../src/_locales');
const SRC_DIR = path.join(import.meta.dirname, '../src');
const FLUTTER_DIR = path.join(import.meta.dirname, '../lib');

// Get all locale directories
function getLocaleDirs() {
  return fs.readdirSync(LOCALES_DIR)
    .filter(file => {
      const fullPath = path.join(LOCALES_DIR, file);
      return fs.statSync(fullPath).isDirectory() && file !== 'node_modules';
    })
    .sort();
}

// Load messages.json from a locale directory
function loadMessages(locale) {
  const messagesPath = path.join(LOCALES_DIR, locale, 'messages.json');
  try {
    const content = fs.readFileSync(messagesPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${locale}/messages.json:`, error.message);
    return null;
  }
}

// Find all translation key references in source code
function findKeysInCode() {
  const keysUsedInCode = new Set();
  const keysUsedInHTML = new Set();
  const keysUsedInDart = new Set();
  
  // Scan JavaScript files for translate() calls
  function scanJSFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Match translate('key') or translate("key")
      const translatePattern = /translate\s*\(\s*['"]([^'"]+)['"]/g;
      let match;
      while ((match = translatePattern.exec(content)) !== null) {
        keysUsedInCode.add(match[1]);
      }
      
      // Match chrome.i18n.getMessage('key') or chrome.i18n.getMessage("key")
      const i18nPattern = /chrome\.i18n\.getMessage\s*\(\s*['"]([^'"]+)['"]/g;
      while ((match = i18nPattern.exec(content)) !== null) {
        keysUsedInCode.add(match[1]);
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  // Scan HTML files for data-i18n attributes
  function scanHTMLFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Match data-i18n="key"
      const i18nPattern = /data-i18n\s*=\s*["']([^"']+)["']/g;
      let match;
      while ((match = i18nPattern.exec(content)) !== null) {
        keysUsedInHTML.add(match[1]);
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  // Scan manifest.json for __MSG_key__ patterns
  function scanManifestFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Match __MSG_key__
      const msgPattern = /__MSG_([^_]+)__/g;
      let match;
      while ((match = msgPattern.exec(content)) !== null) {
        keysUsedInCode.add(match[1]);
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  // Scan Dart files for localization.t() or localization.translate() calls
  function scanDartFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Match localization.t('key') or localization.t("key")
      const tPattern = /localization\.t\s*\(\s*['"]([^'"]+)['"]/g;
      let match;
      while ((match = tPattern.exec(content)) !== null) {
        keysUsedInDart.add(match[1]);
      }
      
      // Match localization.translate('key') or localization.translate("key")
      const translatePattern = /localization\.translate\s*\(\s*['"]([^'"]+)['"]/g;
      while ((match = translatePattern.exec(content)) !== null) {
        keysUsedInDart.add(match[1]);
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  // Recursively scan directory
  function scanDirectory(dir, extensions) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip _locales directory and node_modules
          if (file !== '_locales' && file !== 'node_modules' && file !== 'dist') {
            scanDirectory(fullPath, extensions);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(file);
          if (extensions.includes(ext)) {
            if (ext === '.js' || ext === '.ts') {
              scanJSFile(fullPath);
            } else if (ext === '.html') {
              scanHTMLFile(fullPath);
            } else if (ext === '.dart') {
              scanDartFile(fullPath);
            }
          } else if (file === 'manifest.json') {
            scanManifestFile(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  // Scan all source files
  scanDirectory(SRC_DIR, ['.js', '.ts', '.html']);
  
  // Scan Flutter source files
  if (fs.existsSync(FLUTTER_DIR)) {
    scanDirectory(FLUTTER_DIR, ['.dart']);
  }
  
  // Combine all keys used in code
  return new Set([...keysUsedInCode, ...keysUsedInHTML, ...keysUsedInDart]);
}

// Check if key is used in source files (full-text search fallback)
function isKeyUsedInSource(key) {
  function searchInDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (file !== '_locales' && file !== 'node_modules' && file !== 'dist' && file !== '.git' && file !== 'build') {
            if (searchInDirectory(fullPath)) return true;
          }
        } else if (stat.isFile()) {
          const ext = path.extname(file);
          if (['.js', '.ts', '.html', '.json', '.css', '.md', '.dart'].includes(ext) || file === 'manifest.json') {
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              const regex = new RegExp(`\\b${key}\\b`, 'g');
              if (regex.test(content) && !fullPath.includes('_locales')) {
                return true;
              }
            } catch (error) {
              // Skip files that can't be read
            }
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
    return false;
  }
  
  if (searchInDirectory(SRC_DIR)) return true;
  if (fs.existsSync(FLUTTER_DIR) && searchInDirectory(FLUTTER_DIR)) return true;
  return false;
}

// Detect unused keys
function detectUnusedKeys() {
  const locales = getLocaleDirs();
  const allKeys = new Set();
  
  // Collect all defined keys
  locales.forEach(locale => {
    const messages = loadMessages(locale);
    if (messages) {
      Object.keys(messages).forEach(key => allKeys.add(key));
    }
  });
  
  // Find keys used in code
  const usedKeys = findKeysInCode();
  
  // Find potentially unused keys
  const potentiallyUnused = Array.from(allKeys).filter(key => !usedKeys.has(key));
  
  // Double-check with full-text search
  const trulyUnused = potentiallyUnused.filter(key => !isKeyUsedInSource(key));
  
  return trulyUnused;
}

// Remove unused keys from a locale
function cleanupLocale(locale, unusedKeys) {
  const messagesPath = path.join(LOCALES_DIR, locale, 'messages.json');
  
  try {
    const content = fs.readFileSync(messagesPath, 'utf8');
    const messages = JSON.parse(content);
    
    let removedCount = 0;
    
    // Remove unused keys
    unusedKeys.forEach(key => {
      if (messages[key]) {
        delete messages[key];
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      // Write back with proper formatting
      const updatedContent = JSON.stringify(messages, null, 2) + '\n';
      fs.writeFileSync(messagesPath, updatedContent, 'utf8');
    }
    
    console.log(`  ${locale}: removed ${removedCount} keys`);
    return removedCount;
    
  } catch (error) {
    console.error(`  ❌ Error processing ${locale}:`, error.message);
    return 0;
  }
}

function main() {
  console.log('🔍 Detecting unused translation keys...\n');
  
  const unusedKeys = detectUnusedKeys();
  
  if (unusedKeys.length === 0) {
    console.log('✅ No unused keys found. All keys are in use.\n');
    return;
  }
  
  console.log(`Found ${unusedKeys.length} unused key(s):`);
  unusedKeys.forEach(key => console.log(`  - ${key}`));
  console.log();
  
  console.log('🧹 Removing unused keys from all locales...\n');
  
  const locales = getLocaleDirs();
  let totalRemoved = 0;
  
  locales.forEach(locale => {
    totalRemoved += cleanupLocale(locale, unusedKeys);
  });
  
  console.log(`\n✨ Cleanup complete! Removed ${totalRemoved} key(s) total.`);
  console.log('\n💡 Run "node scripts/check-missing-keys.js" to verify.');
}

main();
