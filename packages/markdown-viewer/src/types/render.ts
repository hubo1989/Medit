/**
 * Render Type Definitions
 * Types for rendering system (diagrams, charts, SVG, etc.)
 */

// =============================================================================
// Render Result Types
// =============================================================================

/**
 * Render result from renderers
 */
export interface RenderResult {
  base64?: string;
  width: number;
  height: number;
  format: string;
  success?: boolean;
  error?: string;
}

// =============================================================================
// Unified Render Result (for plugin system)
// =============================================================================

/**
 * Render result type enumeration
 */
export type RenderResultType = 'image' | 'text' | 'error' | 'empty';

/**
 * Unified render result content
 */
export interface RenderResultContent {
  data?: Uint8Array;
  base64?: string;
  text?: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Unified render result display options
 */
export interface RenderResultDisplay {
  inline: boolean;
  alignment: 'left' | 'center' | 'right';
}

/**
 * Unified render result (used by plugin system)
 */
export interface UnifiedRenderResult {
  type: RenderResultType;
  content: RenderResultContent;
  display: RenderResultDisplay;
}

// =============================================================================
// Renderer Theme Config (for render workers)
// =============================================================================

/**
 * Theme configuration for renderers
 * This is a simplified config passed to render workers
 */
export interface RendererThemeConfig {
  fontFamily?: string;
  fontSize?: number;
  background?: string;
  foreground?: string;
  /** Diagram rendering style: 'normal' or 'handDrawn' */
  diagramStyle?: 'normal' | 'handDrawn';
}
