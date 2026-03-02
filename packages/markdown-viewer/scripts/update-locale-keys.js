#!/usr/bin/env node

/**
 * Update or add locale keys to all locale files
 * Usage: node scripts/update-locale-keys.js
 * 
 * - If key doesn't exist: add it
 * - If key exists but message differs: update it
 * - If key exists with same message: skip
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/_locales');

const DEFAULT_CONFIG_PATH = path.join(__dirname, './i18n/update-locale-keys.json');

function parseArgs(argv) {
  const args = { config: DEFAULT_CONFIG_PATH };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--config') {
      const next = argv[i + 1];
      if (!next) {
        throw new Error('Missing value for --config');
      }
      args.config = path.isAbsolute(next) ? next : path.resolve(process.cwd(), next);
      i++;
    }
  }
  return args;
}

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw);

  const keys = parsed?.keys;
  const translations = parsed?.translations ?? {};

  if (!keys || typeof keys !== 'object' || Array.isArray(keys)) {
    throw new Error('Invalid config: expected { keys: { ... } }');
  }
  if (typeof translations !== 'object' || Array.isArray(translations)) {
    throw new Error('Invalid config: expected { translations: { ... } }');
  }

  return { keys, translations };
}

/**
 * Keys to add/update.
 *
 * IMPORTANT:
 * - These messages are the canonical English strings.
 * - For non-English locales, this script will NOT fall back to English.
 *   Missing translations must be provided via TRANSLATIONS, otherwise the
 *   key will be skipped and reported.
 *
 * Format: { key: { message: "...", description: "..." } }
};

/**
 * Sort object keys alphabetically
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
 */
function processLocaleFile(locale, KEYS, TRANSLATIONS) {
  const messagesPath = path.join(LOCALES_DIR, locale, 'messages.json');
  
  if (!fs.existsSync(messagesPath)) {
    console.log(`⚠️  Skipping ${locale}: messages.json not found`);
    return { added: 0, updated: 0, skipped: 0 };
  }
  
  try {
    const content = fs.readFileSync(messagesPath, 'utf8');
    const messages = JSON.parse(content);
    
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const missingTranslations = [];
    
    const isEnglishLocale = locale === 'en';

    for (const [key, defaultValue] of Object.entries(KEYS)) {
      // For non-English locales, require explicit translation.
      const translation = TRANSLATIONS[locale]?.[key];
      const hasExplicitTranslation = typeof translation?.message === 'string' && translation.message.length > 0;

      if (!isEnglishLocale && !hasExplicitTranslation) {
        missingTranslations.push(key);
        skipped++;
        continue;
      }

      const newMessage = isEnglishLocale ? defaultValue.message : translation.message;
      
      if (!messages[key]) {
        // Key doesn't exist - add it
        messages[key] = {
          message: newMessage,
          description: defaultValue.description
        };
        added++;
      } else if (messages[key].message !== newMessage) {
        // Key exists but message differs - update it
        messages[key].message = newMessage;
        updated++;
      } else {
        // Key exists with same message - skip
        skipped++;
      }
    }
    
    if (added > 0 || updated > 0) {
      const sortedMessages = sortObjectKeys(messages);
      const sortedContent = JSON.stringify(sortedMessages, null, 2) + '\n';
      fs.writeFileSync(messagesPath, sortedContent, 'utf8');
      console.log(`✅ ${locale}: +${added} added, ~${updated} updated, =${skipped} unchanged`);
    } else if (skipped > 0) {
      console.log(`⏭️  ${locale}: all ${skipped} keys unchanged`);
    } else {
      console.log(`⏭️  ${locale}: no keys to process`);
    }

    return { added, updated, skipped, missingTranslations };
  } catch (error) {
    console.error(`❌ Error processing ${locale}:`, error.message);
    return { added: 0, updated: 0, skipped: 0, missingTranslations: [] };
  }
}

/**
 * Main function
 */
function main() {
  const args = parseArgs(process.argv);
  const { keys: KEYS, translations: TRANSLATIONS } = loadConfig(args.config);
  const keyCount = Object.keys(KEYS).length;
  
  if (keyCount === 0) {
    console.log('ℹ️  No keys defined in KEYS object. Add keys to process.');
    return;
  }
  
  console.log('🔄 Processing locale keys...\n');
  console.log(`Config: ${args.config}`);
  console.log('Keys:', Object.keys(KEYS).join(', '));
  console.log('');
  
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error(`❌ Locales directory not found: ${LOCALES_DIR}`);
    process.exit(1);
  }
  
  const locales = fs.readdirSync(LOCALES_DIR)
    .filter(item => {
      const itemPath = path.join(LOCALES_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    });
  
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  const missingTranslationsByLocale = new Map();
  
  for (const locale of locales) {
    const { added, updated, skipped, missingTranslations } = processLocaleFile(locale, KEYS, TRANSLATIONS);
    totalAdded += added;
    totalUpdated += updated;
    totalSkipped += skipped;

    if (missingTranslations.length > 0) {
      missingTranslationsByLocale.set(locale, missingTranslations);
    }
  }
  
  console.log('');
  console.log(`📊 Summary: +${totalAdded} added, ~${totalUpdated} updated, =${totalSkipped} unchanged`);

  if (missingTranslationsByLocale.size > 0) {
    console.log('\n❌ Missing translations (script did NOT add English fallbacks):');
    for (const [locale, keys] of Array.from(missingTranslationsByLocale.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      console.log(`  - ${locale}: ${keys.join(', ')}`);
    }
    console.log('\nProvide translations in scripts/update-locale-keys.js (TRANSLATIONS) and re-run this script.\n');
    process.exitCode = 1;
  }

  console.log('✨ Done!');
}

main();
