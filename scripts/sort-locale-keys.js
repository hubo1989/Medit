#!/usr/bin/env node

/**
 * Sort locale message keys alphabetically in all locale files
 * This script reads each messages.json file, sorts keys alphabetically,
 * and writes them back with consistent formatting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/_locales');

/**
 * Sort object keys alphabetically
 * @param {Object} obj - Object to sort
 * @returns {Object} New object with sorted keys
 */
function sortObjectKeys(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  
  return sorted;
}

/**
 * Process a single locale file
 * @param {string} localeDir - Path to locale directory
 * @param {string} locale - Locale code (e.g., 'en', 'zh_CN')
 */
function processLocaleFile(localeDir, locale) {
  const messagesPath = path.join(localeDir, locale, 'messages.json');
  
  if (!fs.existsSync(messagesPath)) {
    console.log(`⚠️  Skipping ${locale}: messages.json not found`);
    return;
  }
  
  try {
    // Read and parse JSON
    const content = fs.readFileSync(messagesPath, 'utf8');
    const messages = JSON.parse(content);
    
    // Sort keys
    const sortedMessages = sortObjectKeys(messages);
    
    // Write back with 2-space indentation
    const sortedContent = JSON.stringify(sortedMessages, null, 2) + '\n';
    fs.writeFileSync(messagesPath, sortedContent, 'utf8');
    
    console.log(`✅ Sorted ${locale}: ${Object.keys(messages).length} keys`);
  } catch (error) {
    console.error(`❌ Error processing ${locale}:`, error.message);
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔄 Sorting locale message keys...\n');
  
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error(`❌ Locales directory not found: ${LOCALES_DIR}`);
    process.exit(1);
  }
  
  // Get all locale directories
  const locales = fs.readdirSync(LOCALES_DIR)
    .filter(item => {
      const itemPath = path.join(LOCALES_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    })
    .sort();
  
  console.log(`Found ${locales.length} locale(s): ${locales.join(', ')}\n`);
  
  // Process each locale
  for (const locale of locales) {
    processLocaleFile(LOCALES_DIR, locale);
  }
  
  console.log('\n✨ Done!');
}

// Run the script
main();
