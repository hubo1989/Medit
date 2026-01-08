/**
 * Theme to CSS Converter
 * Converts theme configuration to CSS styles
 * 
 * Theme v2.0 Format:
 * - fontScheme: only font families (no sizes)
 * - layoutScheme: all sizes and spacing (absolute pt values)
 * - colorScheme: colors (future)
 * - tableStyle: table styling
 * - codeTheme: code syntax highlighting
 */

import themeManager from './theme-manager';
import { fetchJSON } from './fetch-utils';
import type { PlatformAPI } from '../types/index';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Get platform instance from global scope
 */
function getPlatform(): PlatformAPI {
  return globalThis.platform as PlatformAPI;
}

/**
 * Heading style configuration (font-related properties only)
 */
interface HeadingConfig {
  fontFamily?: string;
  fontWeight?: string;
}

/**
 * Font scheme configuration (font-related properties only)
 * Layout properties (fontSize, lineHeight, spacing) are in LayoutScheme
 */
interface FontScheme {
  body: {
    fontFamily: string;
  };
  headings: Record<string, HeadingConfig>;
  code: {
    fontFamily: string;
    background: string;
  };
}

/**
 * Theme configuration (v2.0 format)
 */
export interface ThemeConfig {
  fontScheme: FontScheme;
  layoutScheme: string;    // reference to layout-schemes/
  tableStyle: string;
  codeTheme: string;
  colorScheme?: string;    // Future: reference to color-schemes/
}

/**
 * Border configuration
 */
interface BorderConfig {
  style: string;
  width: string;
  color: string;
}

/**
 * Table style configuration
 */
export interface TableStyleConfig {
  border?: {
    all?: BorderConfig;
    headerTop?: BorderConfig;
    headerBottom?: BorderConfig;
    rowBottom?: BorderConfig;
    lastRowBottom?: BorderConfig;
  };
  header: {
    background?: string;
    fontWeight?: string;
    color?: string;
    fontSize?: string;
  };
  cell: {
    padding: string;
  };
  zebra?: {
    enabled: boolean;
    evenBackground: string;
    oddBackground: string;
  };
}

/**
 * Code theme configuration
 */
export interface CodeThemeConfig {
  colors: Record<string, string>;
  foreground: string;
}

/**
 * Layout scheme heading configuration
 */
interface LayoutHeadingConfig {
  fontSize: string;
  spacingBefore: string;
  spacingAfter: string;
  alignment?: 'left' | 'center' | 'right';
}

/**
 * Layout scheme block configuration
 */
interface LayoutBlockConfig {
  spacingBefore?: string;
  spacingAfter?: string;
  paddingVertical?: string;
  paddingHorizontal?: string;
}

/**
 * Layout scheme configuration (absolute pt values)
 */
export interface LayoutScheme {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en?: string;
  
  body: {
    fontSize: string;
    lineHeight: number;
  };
  
  headings: {
    h1: LayoutHeadingConfig;
    h2: LayoutHeadingConfig;
    h3: LayoutHeadingConfig;
    h4: LayoutHeadingConfig;
    h5: LayoutHeadingConfig;
    h6: LayoutHeadingConfig;
  };
  
  code: {
    fontSize: string;
  };
  
  blocks: {
    paragraph: LayoutBlockConfig;
    list: LayoutBlockConfig;
    listItem: LayoutBlockConfig;
    blockquote: LayoutBlockConfig;
    codeBlock: LayoutBlockConfig;
    table: LayoutBlockConfig;
    horizontalRule: LayoutBlockConfig;
  };
}

/**
 * Font configuration for themeManager
 */
export interface FontConfig {
  [key: string]: unknown;
}

// ============================================================================
// CSS Generation Functions
// ============================================================================

/**
 * Convert theme configuration to CSS
 * @param theme - Theme configuration object
 * @param layoutScheme - Layout scheme configuration
 * @param tableStyle - Table style configuration
 * @param codeTheme - Code highlighting theme
 * @returns CSS string
 */
export function themeToCSS(
  theme: ThemeConfig,
  layoutScheme: LayoutScheme,
  tableStyle: TableStyleConfig,
  codeTheme: CodeThemeConfig
): string {
  const css: string[] = [];

  // Font and layout CSS (combined from fontScheme + layoutScheme)
  css.push(generateFontAndLayoutCSS(theme.fontScheme, layoutScheme));

  // Table style
  css.push(generateTableCSS(tableStyle));

  // Code highlighting
  css.push(generateCodeCSS(theme.fontScheme.code, codeTheme, layoutScheme.code));

  // Block spacing
  css.push(generateBlockSpacingCSS(layoutScheme));

  return css.join('\n\n');
}

/**
 * Generate font and layout CSS
 * @param fontScheme - Font scheme configuration (font families)
 * @param layoutScheme - Layout scheme configuration (sizes and spacing)
 * @returns CSS string
 */
function generateFontAndLayoutCSS(fontScheme: FontScheme, layoutScheme: LayoutScheme): string {
  const css: string[] = [];

  // Body font - font family from fontScheme, size from layoutScheme
  const bodyFontFamily = themeManager.buildFontFamily(fontScheme.body.fontFamily);
  const bodyFontSize = themeManager.ptToPx(layoutScheme.body.fontSize);
  const bodyLineHeight = layoutScheme.body.lineHeight;

  css.push(`#markdown-content {
  font-family: ${bodyFontFamily};
  font-size: ${bodyFontSize};
  line-height: ${bodyLineHeight};
}`);

  // KaTeX math expressions - use body font size
  css.push(`.katex {
  font-size: ${bodyFontSize};
}`);

  // Headings - font/fontWeight from fontScheme, sizes/alignment/spacing from layoutScheme
  const headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

  headingLevels.forEach((level) => {
    const fontHeading = fontScheme.headings[level];
    const layoutHeading = layoutScheme.headings[level];
    
    // Font family: inherit from heading config, fallback to body
    const fontFamily = themeManager.buildFontFamily(fontHeading?.fontFamily || fontScheme.body.fontFamily);
    const fontSize = themeManager.ptToPx(layoutHeading.fontSize);
    const fontWeight = fontHeading?.fontWeight || 'bold';

    const styles = [
      `  font-family: ${fontFamily};`,
      `  font-size: ${fontSize};`,
      `  font-weight: ${fontWeight};`
    ];

    // Add alignment from layoutScheme
    if (layoutHeading.alignment && layoutHeading.alignment !== 'left') {
      styles.push(`  text-align: ${layoutHeading.alignment};`);
    }

    // Add spacing from layoutScheme
    if (layoutHeading.spacingBefore && layoutHeading.spacingBefore !== '0pt') {
      styles.push(`  margin-top: ${themeManager.ptToPx(layoutHeading.spacingBefore)};`);
    }
    if (layoutHeading.spacingAfter && layoutHeading.spacingAfter !== '0pt') {
      styles.push(`  margin-bottom: ${themeManager.ptToPx(layoutHeading.spacingAfter)};`);
    }

    css.push(`#markdown-content ${level} {
${styles.join('\n')}
}`);
  });

  return css.join('\n\n');
}

/**
 * Generate table-related CSS
 * @param tableStyle - Table style configuration
 * @returns CSS string
 */
function generateTableCSS(tableStyle: TableStyleConfig): string {
  const css: string[] = [];

  // Base table styles
  css.push(`#markdown-content table {
  border-collapse: collapse;
  margin: 13px auto;
  overflow: auto;
}`);

  // Border styles
  const border = tableStyle.border || {};
  
  // Convert pt to px for border width
  const convertBorderWidth = (width: string): string => {
    if (width.endsWith('pt')) {
      return width.replace('pt', 'px');
    }
    return width;
  };
  
  // Convert CSS border style
  const convertBorderStyle = (style: string): string => {
    const styleMap: Record<string, string> = {
      'single': 'solid',
      'double': 'double',
      'dashed': 'dashed',
      'dotted': 'dotted',
      'solid': 'solid'
    };
    return styleMap[style] || 'solid';
  };
  
  // Calculate effective border width for CSS
  const calculateCssBorderWidth = (width: string, style: string): string => {
    const convertedWidth = convertBorderWidth(width);
    if (style === 'double') {
      const match = convertedWidth.match(/^(\d+\.?\d*)(.*)$/);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2];
        return `${value * 3}${unit}`; // 3x for double border
      }
    }
    return convertedWidth;
  };
  
  // Base cell styling
  css.push(`#markdown-content table th,
#markdown-content table td {
  padding: ${tableStyle.cell.padding};
}`);

  if (border.all) {
    // Full borders mode
    const borderWidth = calculateCssBorderWidth(border.all.width, border.all.style);
    const borderStyle = convertBorderStyle(border.all.style);
    const borderValue = `${borderWidth} ${borderStyle} ${border.all.color}`;
    css.push(`#markdown-content table th,
#markdown-content table td {
  border: ${borderValue};
}`);
  } else {
    // Horizontal-only mode
    css.push(`#markdown-content table th,
#markdown-content table td {
  border: none;
}`);

    // Special borders
    if (border.headerTop) {
      const width = calculateCssBorderWidth(border.headerTop.width, border.headerTop.style);
      const style = convertBorderStyle(border.headerTop.style);
      css.push(`#markdown-content table th {
  border-top: ${width} ${style} ${border.headerTop.color};
}`);
    }

    if (border.headerBottom) {
      const width = calculateCssBorderWidth(border.headerBottom.width, border.headerBottom.style);
      const style = convertBorderStyle(border.headerBottom.style);
      css.push(`#markdown-content table th {
  border-bottom: ${width} ${style} ${border.headerBottom.color};
}`);
    }

    if (border.rowBottom) {
      const width = calculateCssBorderWidth(border.rowBottom.width, border.rowBottom.style);
      const style = convertBorderStyle(border.rowBottom.style);
      css.push(`#markdown-content table td {
  border-bottom: ${width} ${style} ${border.rowBottom.color};
}`);
    }

    if (border.lastRowBottom) {
      const width = calculateCssBorderWidth(border.lastRowBottom.width, border.lastRowBottom.style);
      const style = convertBorderStyle(border.lastRowBottom.style);
      css.push(`#markdown-content table tr:last-child td {
  border-bottom: ${width} ${style} ${border.lastRowBottom.color};
}`);
    }
  }

  // Header styles
  const header = tableStyle.header;
  const headerStyles: string[] = [];

  if (header.background) {
    headerStyles.push(`  background-color: ${header.background};`);
  }

  if (header.fontWeight) {
    const fontWeight = header.fontWeight === 'bold' ? 'bold' : header.fontWeight;
    headerStyles.push(`  font-weight: ${fontWeight};`);
  }

  if (header.color) {
    headerStyles.push(`  color: ${header.color};`);
  }

  if (header.fontSize) {
    headerStyles.push(`  font-size: ${header.fontSize};`);
  }

  if (headerStyles.length > 0) {
    css.push(`#markdown-content table th {
${headerStyles.join('\n')}
}`);
  }

  // Zebra stripes
  if (tableStyle.zebra && tableStyle.zebra.enabled) {
    css.push(`#markdown-content table tr:nth-child(even) {
  background-color: ${tableStyle.zebra.evenBackground};
}`);

    css.push(`#markdown-content table tr:nth-child(odd) {
  background-color: ${tableStyle.zebra.oddBackground};
}`);
  }

  return css.join('\n\n');
}

/**
 * Generate code highlighting CSS
 * @param codeConfig - Code font configuration from fontScheme
 * @param codeTheme - Code highlighting theme
 * @param codeLayout - Code layout configuration from layoutScheme
 * @returns CSS string
 */
function generateCodeCSS(
  codeConfig: { fontFamily: string; background: string },
  codeTheme: CodeThemeConfig,
  codeLayout: { fontSize: string }
): string {
  const css: string[] = [];

  // Code font settings
  const codeFontFamily = themeManager.buildFontFamily(codeConfig.fontFamily);
  const codeFontSize = themeManager.ptToPx(codeLayout.fontSize);
  const codeBackground = codeConfig.background;

  css.push(`#markdown-content code {
  font-family: ${codeFontFamily};
  font-size: ${codeFontSize};
  background-color: ${codeBackground};
}`);

  css.push(`#markdown-content pre {
  background-color: ${codeBackground};
}`);

  css.push(`#markdown-content pre code {
  font-family: ${codeFontFamily};
  font-size: ${codeFontSize};
  background-color: transparent;
}`);

  // Ensure highlight.js styles work properly
  css.push(`#markdown-content .hljs {
  background: ${codeBackground} !important;
  color: ${codeTheme.foreground};
}`);

  // Generate color mappings for syntax highlighting
  Object.keys(codeTheme.colors).forEach((token) => {
    const color = codeTheme.colors[token];
    // Remove # prefix if present
    const colorValue = color.startsWith('#') ? color.slice(1) : color;
    css.push(`#markdown-content .hljs-${token} {
  color: #${colorValue};
}`);
  });

  return css.join('\n\n');
}

/**
 * Generate block spacing CSS from layout scheme
 * @param layoutScheme - Layout scheme configuration
 * @returns CSS string
 */
function generateBlockSpacingCSS(layoutScheme: LayoutScheme): string {
  const css: string[] = [];
  const blocks = layoutScheme.blocks;

  // Helper function to convert pt to px
  const toPx = (pt: string | undefined): string => {
    if (!pt || pt === '0pt') return '0';
    return themeManager.ptToPx(pt);
  };

  // Paragraph spacing
  if (blocks.paragraph) {
    const marginBefore = toPx(blocks.paragraph.spacingBefore);
    const marginAfter = toPx(blocks.paragraph.spacingAfter);
    css.push(`#markdown-content p {
  margin: ${marginBefore} 0 ${marginAfter} 0;
}`);
  }

  // List spacing
  if (blocks.list) {
    const marginBefore = toPx(blocks.list.spacingBefore);
    const marginAfter = toPx(blocks.list.spacingAfter);
    css.push(`#markdown-content ul,
#markdown-content ol {
  margin: ${marginBefore} 0 ${marginAfter} 0;
}`);
  }

  // List item spacing
  if (blocks.listItem) {
    const marginBefore = toPx(blocks.listItem.spacingBefore);
    const marginAfter = toPx(blocks.listItem.spacingAfter);
    css.push(`#markdown-content li {
  margin: ${marginBefore} 0 ${marginAfter} 0;
}`);
  }

  // Blockquote spacing
  if (blocks.blockquote) {
    const bq = blocks.blockquote;
    const marginBefore = toPx(bq.spacingBefore);
    const marginAfter = toPx(bq.spacingAfter);
    const paddingVertical = toPx(bq.paddingVertical);
    const paddingHorizontal = toPx(bq.paddingHorizontal);
    css.push(`#markdown-content blockquote {
  margin: ${marginBefore} 0 ${marginAfter} 0;
  padding: ${paddingVertical} ${paddingHorizontal};
}`);
  }

  // Code block spacing
  if (blocks.codeBlock) {
    const marginBefore = toPx(blocks.codeBlock.spacingBefore);
    const marginAfter = toPx(blocks.codeBlock.spacingAfter);
    css.push(`#markdown-content pre {
  margin: ${marginBefore} 0 ${marginAfter} 0;
}`);
  }

  // Table spacing
  if (blocks.table) {
    const marginBefore = toPx(blocks.table.spacingBefore);
    const marginAfter = toPx(blocks.table.spacingAfter);
    css.push(`#markdown-content table {
  margin: ${marginBefore} auto ${marginAfter} auto;
}`);
  }

  // Horizontal rule spacing
  if (blocks.horizontalRule) {
    const hr = blocks.horizontalRule;
    const marginBefore = toPx(hr.spacingBefore);
    const marginAfter = toPx(hr.spacingAfter);
    css.push(`#markdown-content hr {
  margin: ${marginBefore} 0 ${marginAfter} 0;
}`);
  }

  return css.join('\n\n');
}

// ============================================================================
// Theme Application Functions
// ============================================================================

/**
 * Apply theme CSS to the page
 * @param css - CSS string to apply
 */
export function applyThemeCSS(css: string): void {
  // Remove existing theme style
  const existingStyle = document.getElementById('theme-dynamic-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create and append new style element
  const styleElement = document.createElement('style');
  styleElement.id = 'theme-dynamic-style';
  styleElement.textContent = css;
  document.head.appendChild(styleElement);
}

/**
 * Apply theme from pre-loaded data (used by mobile when Flutter sends theme data)
 * @param theme - Theme configuration
 * @param layoutScheme - Layout scheme configuration
 * @param tableStyle - Table style configuration
 * @param codeTheme - Code theme configuration
 */
export function applyThemeFromData(
  theme: ThemeConfig,
  layoutScheme: LayoutScheme,
  tableStyle: TableStyleConfig,
  codeTheme: CodeThemeConfig
): void {
  try {
    // Generate CSS
    const css = themeToCSS(theme, layoutScheme, tableStyle, codeTheme);

    // Apply CSS
    applyThemeCSS(css);
  } catch (error) {
    console.error('Error applying theme from data:', error);
    throw error;
  }
}

/**
 * Theme load result containing layout information
 */
export interface ThemeLoadResult {
  theme: ThemeConfig;
  layoutScheme: LayoutScheme;
}

/**
 * Load and apply complete theme
 * @param themeId - Theme ID to load
 * @returns Theme and layout scheme for additional configuration
 */
export async function loadAndApplyTheme(themeId: string): Promise<ThemeLoadResult> {
  try {
    const platform = getPlatform();
    
    // Load theme preset
    const theme = (await themeManager.loadTheme(themeId)) as unknown as ThemeConfig;

    // Load layout scheme
    const layoutSchemeUrl = platform.resource.getURL(`themes/layout-schemes/${theme.layoutScheme}.json`);
    const layoutScheme = await fetchJSON(layoutSchemeUrl) as LayoutScheme;

    // Load table style
    const tableStyle = await fetchJSON(
      platform.resource.getURL(`themes/table-styles/${theme.tableStyle}.json`)
    ) as TableStyleConfig;

    // Load code theme
    const codeTheme = await fetchJSON(
      platform.resource.getURL(`themes/code-themes/${theme.codeTheme}.json`)
    ) as CodeThemeConfig;

    // Generate CSS
    const css = themeToCSS(theme, layoutScheme, tableStyle, codeTheme);

    // Apply CSS
    applyThemeCSS(css);
    
    return { theme, layoutScheme };
  } catch (error) {
    console.error('[Theme] Error loading theme:', error);
    throw error;
  }
}

/**
 * Switch to a different theme with smooth transition
 * @param themeId - Theme ID to switch to
 * @returns Success status
 */
export async function switchTheme(themeId: string): Promise<boolean> {
  try {
    // Switch theme in manager
    await themeManager.switchTheme(themeId);
    
    // Apply theme CSS
    await loadAndApplyTheme(themeId);
    
    return true;
  } catch (error) {
    console.error('Error switching theme:', error);
    throw error;
  }
}
