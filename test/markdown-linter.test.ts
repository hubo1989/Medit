/**
 * Test for markdown-linter
 */

import { fixMarkdown, lintMarkdown, getDiagnostics, getAllCategories, getCategoryRules } from '../vscode/src/tools/markdown-linter';

// Test content with various issues
const testContent = `#No space after hash

##  Multiple spaces

Some text
* List without blank line above

Another paragraph	with tab

Trailing spaces   
Multiple


blank lines

Some text

\`\`\`
code without language
\`\`\`

* item
  + subitem
    - subsubitem

**bold with space inside **

*italic with space inside *

(reversed link)[http://example.com]

http://bare-url.com

[ link with spaces ](http://example.com)

> quote
>  with multiple spaces

`;

console.log('=== Markdown Linter Test ===\n');

// Test all categories
console.log('Available categories:');
for (const cat of getAllCategories()) {
  const rules = getCategoryRules(cat);
  console.log(`  ${cat}: ${rules.length} rules`);
}
console.log();

// Test linting
const errors = lintMarkdown(testContent, 'all');
console.log(`Found ${errors.length} errors:`);
errors.slice(0, 10).forEach(e => {
  console.log(`  Line ${e.lineNumber}: ${e.ruleNames[0]} - ${e.ruleDescription}`);
});
if (errors.length > 10) {
  console.log(`  ... and ${errors.length - 10} more`);
}
console.log();

// Test category fixes
console.log('Testing category fixes:');
for (const cat of ['whitespace', 'headings', 'lists', 'code', 'links', 'emphasis', 'blockquotes'] as const) {
  const result = fixMarkdown(testContent, cat);
  console.log(`  ${cat}: ${result.issuesFixed} issues fixed, changed=${result.changed}`);
}
console.log();

// Test fix all
const fixAllResult = fixMarkdown(testContent, 'all');
console.log('Fix All result:');
console.log(`  Issues found: ${fixAllResult.issuesFound}`);
console.log(`  Issues fixed: ${fixAllResult.issuesFixed}`);
console.log(`  Content changed: ${fixAllResult.changed}`);
console.log();

// Show fixed content
console.log('=== Fixed Content ===');
console.log(fixAllResult.content);
