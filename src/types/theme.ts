/**
 * Theme Type Definitions
 * Types for theme system
 */

// =============================================================================
// Font Configuration Types
// =============================================================================

/**
 * Heading style configuration (font-related properties only)
 * Layout properties (fontSize, alignment, spacing) are in LayoutScheme
 */
export interface HeadingConfig {
  fontFamily?: string;
  fontWeight?: string;
}

/**
 * Font scheme configuration (font-related properties only)
 * Layout properties (fontSize, lineHeight, spacing) are in LayoutScheme
 */
export interface FontScheme {
  body: {
    fontFamily: string;
  };
  headings: Record<string, HeadingConfig>;
  code: {
    fontFamily: string;
    background: string;
  };
}

// =============================================================================
// Table Style Types
// =============================================================================

/**
 * Border configuration
 */
export interface BorderConfig {
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

// =============================================================================
// Code Theme Types
// =============================================================================

/**
 * Code theme color configuration
 */
export interface CodeThemeConfig {
  colors: Record<string, string>;
  foreground?: string;
}

// =============================================================================
// Layout Types
// =============================================================================

/**
 * Layout scheme heading configuration
 */
export interface LayoutHeadingConfig {
  fontSize: string;
  spacingBefore: string;
  spacingAfter: string;
  alignment?: 'left' | 'center' | 'right';
}

/**
 * Layout scheme block configuration
 */
export interface LayoutBlockConfig {
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

// =============================================================================
// Theme Types
// =============================================================================

/**
 * Complete theme definition (loaded from theme files)
 */
export interface Theme {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  author?: string;
  version?: string;
  fontScheme: FontScheme;
  layoutScheme: string;  // Reference to layout scheme
  tableStyle: string;    // Reference to table style
  codeTheme: string;     // Reference to code theme
}

/**
 * Theme definition from registry
 */
export interface ThemeDefinition {
  id: string;
  name: string;
  name_en: string;
  description?: string;
  description_en?: string;
  category: string;
  featured?: boolean;
}

/**
 * Theme category info
 */
export interface ThemeCategoryInfo {
  name: string;
  name_en: string;
  order?: number;
}

/**
 * Theme registry structure
 */
export interface ThemeRegistry {
  categories: Record<string, ThemeCategoryInfo>;
  themes: Array<{
    id: string;
    file: string;
    category: string;
    featured?: boolean;
  }>;
}

/**
 * Theme registry info (cached version)
 */
export interface ThemeRegistryInfo {
  id: string;
  name: string;
  category: string;
}
