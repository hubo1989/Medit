/**
 * Theme Type Definitions
 * Types for theme system
 */

// =============================================================================
// Font Configuration Types
// =============================================================================

/**
 * Heading style configuration
 */
export interface HeadingConfig {
  fontFamily?: string;
  fontSize: string;
  fontWeight?: string;
  alignment?: 'left' | 'center' | 'right';
  spacing?: {
    before?: string;
    after?: string;
  };
}

/**
 * Font scheme configuration
 */
export interface FontScheme {
  body: {
    fontFamily: string;
    fontSize: string;
    lineHeight: number;
  };
  headings: Record<string, HeadingConfig>;
  code: {
    fontFamily: string;
    fontSize: string;
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
// Spacing Types
// =============================================================================

/**
 * Spacing scheme configuration
 */
export interface SpacingScheme {
  paragraph: number;
  blockquote?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  horizontalRule?: {
    top: number;
    bottom: number;
  };
  [key: string]: unknown;
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
  tableStyle: string;  // Reference to table style
  codeTheme: string;  // Reference to code theme
  spacing: string;  // Reference to spacing scheme
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
