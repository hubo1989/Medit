/**
 * Markdown Linter - Integration with markdownlint
 * 
 * Provides categorized Markdown fixing capabilities using markdownlint library.
 * Supports selective fixing by category (whitespace, headings, lists, etc.)
 */

import { lint as lintSync } from 'markdownlint/sync';
import { applyFixes } from 'markdownlint';
import type { LintError, Options, Configuration } from 'markdownlint';

/**
 * Fix categories with their corresponding markdownlint rules
 */
export type FixCategory = 
  | 'all'
  | 'whitespace'
  | 'headings'
  | 'lists'
  | 'code'
  | 'links'
  | 'emphasis'
  | 'tables'
  | 'blockquotes'
  | 'properNames';

/**
 * Rule mapping for each fix category
 * Only includes rules that have fixInfo (are auto-fixable)
 */
const CATEGORY_RULES: Record<FixCategory, string[]> = {
  all: [], // Special case: all fixable rules
  
  whitespace: [
    'MD009', // no-trailing-spaces
    'MD010', // no-hard-tabs
    'MD012', // no-multiple-blanks
    'MD047', // single-trailing-newline
  ],
  
  headings: [
    'MD018', // no-missing-space-atx
    'MD019', // no-multiple-space-atx
    'MD020', // no-missing-space-closed-atx
    'MD021', // no-multiple-space-closed-atx
    'MD022', // blanks-around-headings
    'MD023', // heading-start-left
    'MD026', // no-trailing-punctuation
  ],
  
  lists: [
    'MD004', // ul-style
    'MD005', // list-indent
    'MD007', // ul-indent
    'MD029', // ol-prefix
    'MD030', // list-marker-space
    'MD032', // blanks-around-lists
  ],
  
  code: [
    'MD014', // commands-show-output
    'MD031', // blanks-around-fences
    'MD038', // no-space-in-code
  ],
  
  links: [
    'MD011', // no-reversed-links
    'MD034', // no-bare-urls
    'MD039', // no-space-in-links
    'MD051', // link-fragments
    'MD053', // link-image-reference-definitions
    'MD054', // link-image-style
  ],
  
  emphasis: [
    'MD037', // no-space-in-emphasis
    'MD049', // emphasis-style
    'MD050', // strong-style
  ],
  
  tables: [
    'MD058', // blanks-around-tables
  ],
  
  blockquotes: [
    'MD027', // no-multiple-space-blockquote
  ],
  
  properNames: [
    'MD044', // proper-names
  ],
};

/**
 * All fixable rules (union of all categories)
 */
const ALL_FIXABLE_RULES = [
  ...CATEGORY_RULES.whitespace,
  ...CATEGORY_RULES.headings,
  ...CATEGORY_RULES.lists,
  ...CATEGORY_RULES.code,
  ...CATEGORY_RULES.links,
  ...CATEGORY_RULES.emphasis,
  ...CATEGORY_RULES.tables,
  ...CATEGORY_RULES.blockquotes,
  ...CATEGORY_RULES.properNames,
];

/**
 * Result of a lint/fix operation
 */
export interface LintResult {
  /** Fixed content (same as input if no fixes applied) */
  content: string;
  /** Number of issues found */
  issuesFound: number;
  /** Number of issues fixed */
  issuesFixed: number;
  /** List of errors (for diagnostics) */
  errors: LintError[];
  /** Whether any changes were made */
  changed: boolean;
}

/**
 * Build markdownlint configuration for a specific category
 */
function buildConfig(category: FixCategory): Configuration {
  const config: Configuration = {};
  
  // Disable all rules first
  config.default = false;
  
  // Enable only rules for the category
  const rules = category === 'all' ? ALL_FIXABLE_RULES : CATEGORY_RULES[category];
  for (const rule of rules) {
    config[rule] = true;
  }
  
  return config;
}

/**
 * Lint Markdown content and return errors
 */
export function lintMarkdown(content: string, category: FixCategory = 'all'): LintError[] {
  const config = buildConfig(category);
  
  const options: Options = {
    strings: { content },
    config,
  };
  
  const results = lintSync(options);
  return results.content || [];
}

/**
 * Fix Markdown content for a specific category
 */
export function fixMarkdown(content: string, category: FixCategory = 'all'): LintResult {
  const config = buildConfig(category);
  
  const options: Options = {
    strings: { content },
    config,
  };
  
  const results = lintSync(options);
  const errors = results.content || [];
  
  // Filter to only fixable errors
  const fixableErrors = errors.filter(e => e.fixInfo !== null);
  
  // Apply fixes
  const fixed = applyFixes(content, errors);
  
  return {
    content: fixed,
    issuesFound: errors.length,
    issuesFixed: fixableErrors.length,
    errors,
    changed: fixed !== content,
  };
}

/**
 * Get all lint errors with their fix status
 */
export function getDiagnostics(content: string): LintError[] {
  // Use all rules (not just fixable ones) for diagnostics
  const options: Options = {
    strings: { content },
    config: { default: true },
  };
  
  const results = lintSync(options);
  return results.content || [];
}

/**
 * Get human-readable category name
 */
export function getCategoryDisplayName(category: FixCategory): string {
  const names: Record<FixCategory, string> = {
    all: 'All Issues',
    whitespace: 'Whitespace',
    headings: 'Headings',
    lists: 'Lists',
    code: 'Code Blocks',
    links: 'Links',
    emphasis: 'Emphasis',
    tables: 'Tables',
    blockquotes: 'Blockquotes',
    properNames: 'Proper Names',
  };
  return names[category];
}

/**
 * Get rules for a category
 */
export function getCategoryRules(category: FixCategory): string[] {
  return category === 'all' ? ALL_FIXABLE_RULES : CATEGORY_RULES[category];
}

/**
 * Get all available fix categories
 */
export function getAllCategories(): FixCategory[] {
  return ['all', 'whitespace', 'headings', 'lists', 'code', 'links', 'emphasis', 'tables', 'blockquotes', 'properNames'];
}
