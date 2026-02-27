/**
 * Application configuration constants
 * Centralizes all configurable values
 */

/**
 * Default font configuration
 */
export const FONT_CONFIG = {
  /** Default font family for rendering */
  defaultFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  /** Fallback font family for Chinese content */
  chineseFallback: "'SimSun', serif",
  /** Default font size (px) */
  defaultSize: 14,
  /** Default line height */
  defaultLineHeight: 1.6,
  /** Default tab width */
  defaultTabWidth: 4,
} as const;

/**
 * Vditor CDN configuration
 */
export const VDITOR_CONFIG = {
  /** CDN base URL for Vditor assets */
  cdnUrl: 'https://unpkg.com/vditor@3.10.4',
} as const;

/**
 * Rendering constants
 */
export const RENDER_CONFIG = {
  /** Scale factor for rendering diagrams (matches main project) */
  scaleFactor: 4,
  /** Default width for placeholder renders */
  defaultWidth: 400,
  /** Default height for placeholder renders */
  defaultHeight: 300,
  /** Default width for mermaid diagrams */
  mermaidDefaultWidth: 800,
  /** Default height for mermaid diagrams */
  mermaidDefaultHeight: 600,
  /** Brightness threshold for dark mode detection (0-255) */
  darkModeBrightnessThreshold: 128,
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  /** IndexedDB database name */
  dbName: 'medit-cache',
  /** IndexedDB store name */
  storeName: 'diagrams',
  /** Maximum number of items in cache */
  maxItems: 1000,
} as const;

/**
 * Theme colors for renderer
 */
export const THEME_COLORS = {
  light: {
    background: '#ffffff',
    foreground: '#333333',
  },
  dark: {
    background: '#1e1e1e',
    foreground: '#e0e0e0',
  },
} as const;

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  appState: 'medit:app-state',
  content: 'medit:content',
  settings: 'medit-settings',
  fileStates: 'medit-file-states',
} as const;

/**
 * Timing constants
 */
export const TIMING_CONFIG = {
  /** Debounce delay for preview updates (ms) */
  previewDebounceMs: 300,
  /** Scroll position save debounce (ms) */
  scrollDebounceMs: 150,
  /** Maximum wait time for Vditor initialization (ms) */
  vditorInitMaxWaitMs: 5000,
  /** Vditor initialization check interval (ms) */
  vditorInitCheckIntervalMs: 100,
  /** Auto-save default interval (seconds) */
  autoSaveDefaultIntervalSec: 5,
  /** Edit toolbar retry interval (ms) */
  editToolbarRetryIntervalMs: 500,
  /** Edit toolbar max retries */
  editToolbarMaxRetries: 10,
} as const;
