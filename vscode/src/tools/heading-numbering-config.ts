/**
 * Heading Numbering Config - Load configuration from messages.json
 */

import { HeadingNumberingConfig } from './heading-numbering';
import { translate, type MessagesJson } from '../utils/i18n-messages';

/**
 * Parse pipe-separated regex patterns string into RegExp array
 */
export function parsePatterns(patternsStr: string): RegExp[] {
  if (!patternsStr) return [];

  // Order matters: more specific patterns (e.g. multi-level 1.1.1)
  // must run before less specific ones (e.g. 1.), otherwise we can
  // partially strip numbers and create duplicated output like "1.1 1 ...".
  const parts = patternsStr
    .split('|')
    .map((p, idx) => ({ p: p.trim(), idx }))
    .filter(x => x.p);

  parts.sort((a, b) => {
    const lenDiff = b.p.length - a.p.length;
    return lenDiff !== 0 ? lenDiff : a.idx - b.idx;
  });

  return parts.map(x => new RegExp(x.p));
}

/**
 * Build HeadingNumberingConfig from messages object
 */
export function buildConfigFromMessages(messages: MessagesJson): HeadingNumberingConfig {
  const h2Format = translate('heading_h2_format', messages, '{0}.');
  const h2Numerals = translate('heading_h2_numerals', messages, 'arabic') as 'chinese' | 'arabic' | 'roman';

  return {
    h2Format,
    h2Numerals,
    removePatterns: []
  };
}
