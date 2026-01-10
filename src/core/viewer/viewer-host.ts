/**
 * ViewerHost - Unified utilities for viewer WebView across all platforms
 *
 * This module provides shared functionality for Chrome, VSCode, and Mobile platforms.
 * Each function is designed to be independently usable, allowing incremental adoption.
 *
 * Step 1: Basic utility functions
 * - createViewerScrollSync: Scroll sync controller with unified state persistence
 * - createPluginRenderer: Plugin renderer for diagrams (Mermaid, Vega, etc.)
 * - getFrontmatterDisplay: Read frontmatter display setting
 * - applyZoom: Apply zoom level with scroll position preservation
 */

import { createScrollSyncController, type ScrollSyncController } from '../line-based-scroll';
import { getDocument } from './viewer-controller';
import type { PluginRenderer, PlatformAPI } from '../../types/index';
import type { FrontmatterDisplay } from './viewer-controller';

// ============================================================================
// File Key Management (for scroll position persistence)
// ============================================================================

let currentFileKey = '';

/**
 * Set the current file key for scroll position persistence.
 * Call this when loading a new file.
 *
 * @param key - File identifier (URL for Chrome, filename for VSCode, filePath for Mobile)
 */
export function setCurrentFileKey(key: string): void {
  currentFileKey = key;
}

/**
 * Get the current file key.
 */
export function getCurrentFileKey(): string {
  return currentFileKey;
}

// ============================================================================
// Scroll Sync Controller
// ============================================================================

export interface ViewerScrollSyncOptions {
  /** Container element ID (default: 'markdown-content') */
  containerId?: string;
  /** Platform API instance */
  platform: PlatformAPI;
  /** Debounce time for user scroll events in ms (default: 10) */
  userScrollDebounceMs?: number;
  /**
   * Custom callback for user scroll events.
   * If not provided, defaults to saving scroll position to FileStateService.
   */
  onUserScroll?: (line: number) => void;
}

/**
 * Create a scroll sync controller with unified state persistence.
 *
 * By default, the controller saves scroll position to FileStateService
 * using the key set via setCurrentFileKey().
 *
 * For VSCode, pass a custom onUserScroll to send REVEAL_LINE messages instead.
 *
 * @example
 * ```typescript
 * // Chrome/Mobile: auto-save to FileStateService
 * setCurrentFileKey(documentUrl);
 * const scrollController = createViewerScrollSync({ platform });
 *
 * // VSCode: custom behavior
 * const scrollController = createViewerScrollSync({
 *   platform,
 *   onUserScroll: (line) => vscodeBridge.postMessage('REVEAL_LINE', { line }),
 * });
 * ```
 */
export function createViewerScrollSync(options: ViewerScrollSyncOptions): ScrollSyncController {
  const {
    containerId = 'markdown-content',
    platform,
    userScrollDebounceMs = 10,
    onUserScroll,
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`[ViewerHost] Container '${containerId}' not found`);
  }

  // Default behavior: save to FileStateService
  const defaultOnUserScroll = (line: number) => {
    if (currentFileKey) {
      platform.fileState.set(currentFileKey, { scrollLine: line });
    }
  };

  return createScrollSyncController({
    container,
    getLineMapper: getDocument,
    userScrollDebounceMs,
    onUserScroll: onUserScroll ?? defaultOnUserScroll,
  });
}

// ============================================================================
// Plugin Renderer
// ============================================================================

/**
 * Create a plugin renderer for diagrams (Mermaid, Vega, GraphViz, etc.).
 *
 * This wraps the platform's renderer API in the PluginRenderer interface
 * expected by the markdown processor.
 *
 * @example
 * ```typescript
 * const pluginRenderer = createPluginRenderer(platform);
 * const result = await pluginRenderer.render('mermaid', 'graph TD; A-->B');
 * ```
 */
export function createPluginRenderer(platform: PlatformAPI): PluginRenderer {
  return {
    render: async (type: string, content: string | object) => {
      const result = await platform.renderer.render(type, content);
      return {
        base64: result.base64,
        width: result.width,
        height: result.height,
        format: result.format,
        error: undefined,
      };
    },
  };
}

// ============================================================================
// Settings
// ============================================================================

/**
 * Get the frontmatter display setting from storage.
 *
 * @returns 'hide' | 'table' | 'raw'
 */
export async function getFrontmatterDisplay(platform: PlatformAPI): Promise<FrontmatterDisplay> {
  try {
    const result = await platform.storage.get(['markdownViewerSettings']);
    const settings = (result.markdownViewerSettings || {}) as Record<string, unknown>;
    return (settings.frontmatterDisplay as FrontmatterDisplay) || 'hide';
  } catch {
    return 'hide';
  }
}

// ============================================================================
// Zoom
// ============================================================================

export interface ApplyZoomOptions {
  /** Zoom level as percentage (e.g., 100, 150, 200) */
  zoom: number;
  /** Container element ID (default: 'markdown-content') */
  containerId?: string;
  /** Scroll controller to lock during zoom (optional) */
  scrollController?: ScrollSyncController | null;
}

/**
 * Apply zoom level to the container with scroll position preservation.
 *
 * @returns The applied zoom level as a decimal (e.g., 1.0, 1.5, 2.0)
 *
 * @example
 * ```typescript
 * const zoomLevel = applyZoom({ zoom: 150, scrollController });
 * // zoomLevel = 1.5
 * ```
 */
export function applyZoom(options: ApplyZoomOptions): number {
  const {
    zoom,
    containerId = 'markdown-content',
    scrollController,
  } = options;

  const zoomLevel = zoom / 100;

  // Lock scroll position before zoom change
  scrollController?.lock();

  const container = document.getElementById(containerId);
  if (container) {
    (container as HTMLElement).style.zoom = String(zoomLevel);
  }

  return zoomLevel;
}
