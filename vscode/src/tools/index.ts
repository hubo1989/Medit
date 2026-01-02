/**
 * Markdown Tools - Index
 */

export { 
  HeadingNumberingConfig,
  numberHeadings, 
  removeHeadingNumbers,
  toNumeral,
  removeExistingNumbering
} from './heading-numbering';

export {
  parsePatterns,
  buildConfigFromMessages
} from './heading-numbering-config';

export {
  type FixCategory,
  type LintResult,
  fixMarkdown,
  lintMarkdown,
  getDiagnostics,
  getCategoryDisplayName,
  getCategoryRules,
  getAllCategories
} from './markdown-linter';
