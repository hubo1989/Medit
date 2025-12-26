import fs from 'fs';
import path from 'path';

/**
 * Recursively scans code for i18n key usages.
 *
 * Supported call sites / patterns:
 * - translate('key')
 * - chrome.i18n.getMessage('key')
 * - data-i18n="key"
 * - __MSG_key__ (manifest)
 * - localization.t('key')
 * - localization.translate('key')
 *
 * Notes:
 * - Intentionally does NOT use full-text search fallbacks.
 * - Only extracts static string literal keys.
 */
export function findI18nKeysInCode({ srcDir, flutterDir }) {
  const keysUsedInCode = new Set();
  const keysUsedInHTML = new Set();
  const keysUsedInDart = new Set();

  function scanJSFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      const translatePattern = /translate\s*\(\s*['"]([^'"]+)['"]/g;
      let match;
      while ((match = translatePattern.exec(content)) !== null) {
        keysUsedInCode.add(match[1]);
      }

      const i18nPattern = /chrome\.i18n\.getMessage\s*\(\s*['"]([^'"]+)['"]/g;
      while ((match = i18nPattern.exec(content)) !== null) {
        keysUsedInCode.add(match[1]);
      }
    } catch {
      // Ignore unreadable files
    }
  }

  function scanHTMLFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      const i18nPattern = /data-i18n\s*=\s*["']([^"']+)["']/g;
      let match;
      while ((match = i18nPattern.exec(content)) !== null) {
        keysUsedInHTML.add(match[1]);
      }
    } catch {
      // Ignore unreadable files
    }
  }

  function scanManifestFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      const msgPattern = /__MSG_([^_]+)__/g;
      let match;
      while ((match = msgPattern.exec(content)) !== null) {
        keysUsedInCode.add(match[1]);
      }
    } catch {
      // Ignore unreadable files
    }
  }

  function scanDartFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      const tPattern = /localization\.t\s*\(\s*['"]([^'"]+)['"]/g;
      let match;
      while ((match = tPattern.exec(content)) !== null) {
        keysUsedInDart.add(match[1]);
      }

      const translatePattern = /localization\.translate\s*\(\s*['"]([^'"]+)['"]/g;
      while ((match = translatePattern.exec(content)) !== null) {
        keysUsedInDart.add(match[1]);
      }
    } catch {
      // Ignore unreadable files
    }
  }

  function shouldSkipDirName(dirName) {
    return dirName === '_locales' || dirName === 'node_modules' || dirName === 'dist' || dirName === '.git' || dirName === 'build';
  }

  function scanDirectory(dir, extensions) {
    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!shouldSkipDirName(file)) {
            scanDirectory(fullPath, extensions);
          }
          continue;
        }

        if (!stat.isFile()) continue;

        if (file === 'manifest.json') {
          scanManifestFile(fullPath);
          continue;
        }

        const ext = path.extname(file);
        if (!extensions.includes(ext)) continue;

        if (ext === '.js' || ext === '.ts') {
          scanJSFile(fullPath);
        } else if (ext === '.html') {
          scanHTMLFile(fullPath);
        } else if (ext === '.dart') {
          scanDartFile(fullPath);
        }
      }
    } catch {
      // Ignore unreadable directories
    }
  }

  if (srcDir) {
    scanDirectory(srcDir, ['.js', '.ts', '.html']);
  }

  if (flutterDir && fs.existsSync(flutterDir)) {
    scanDirectory(flutterDir, ['.dart']);
  }

  const allUsedKeys = new Set([...keysUsedInCode, ...keysUsedInHTML, ...keysUsedInDart]);

  return {
    all: allUsedKeys,
    inJS: keysUsedInCode,
    inHTML: keysUsedInHTML,
    inDart: keysUsedInDart
  };
}
