/**
 * i18n Messages Helpers (VS Code)
 *
 * This module provides:
 * - locale normalization + fallback loading for messages.json
 * - safe value lookup for messages.json entries
 *
 * Comments in English per instructions.
 */

import * as fs from 'fs';
import * as path from 'path';

export type MessagesJson = Record<string, { message?: string } | undefined>;

export function normalizeLocaleCandidates(locale: string): string[] {
  const normalized = (locale || 'en').replace('-', '_');
  const langOnly = normalized.split('_')[0];
  const candidates = [normalized, langOnly, 'en'];

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const result: string[] = [];
  for (const c of candidates) {
    if (!c) continue;
    if (seen.has(c)) continue;
    seen.add(c);
    result.push(c);
  }
  return result;
}

/**
 * Load messages.json for a locale with fallbacks.
 *
 * NOTE: This is file-system based and intended for VS Code extension host.
 */
export function loadMessagesJsonWithFallback(extensionPath: string, locale: string): MessagesJson | null {
  const candidates = normalizeLocaleCandidates(locale);

  for (const loc of candidates) {
    const possiblePaths = [
      // Packaged extension assets
      path.join(extensionPath, '_locales', loc, 'messages.json'),
      // Built extension
      path.join(extensionPath, 'dist', 'webview', '_locales', loc, 'messages.json'),
      path.join(extensionPath, 'webview', '_locales', loc, 'messages.json'),
      // Development
      path.join(extensionPath, '..', 'src', '_locales', loc, 'messages.json'),
    ];

    for (const messagesPath of possiblePaths) {
      if (!fs.existsSync(messagesPath)) continue;
      try {
        const content = fs.readFileSync(messagesPath, 'utf-8');
        return JSON.parse(content) as MessagesJson;
      } catch {
        // Ignore parse errors and try next candidate.
      }
    }
  }

  return null;
}

/**
 * Get the "message" string from messages.json.
 *
 * We intentionally name this `translate` to align with the existing i18n key
 * usage detector in scripts (translate(key)). This covers both UI strings
 * and configuration-style lookups in a single mechanism.
 */
export function translate(
  key: string,
  messages: MessagesJson,
  fallbackValue: string = ''
): string {
  const entry = messages?.[key];
  const value = entry && typeof entry === 'object' ? entry.message : undefined;
  return typeof value === 'string' ? value : fallbackValue;
}
