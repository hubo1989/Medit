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
 *
 * Step 2: Unified render flow
 * - renderMarkdownFlow: Main render function used by all platforms
 */

import { createScrollSyncController, type ScrollSyncController } from '../line-based-scroll';
import { getDocument, renderMarkdownDocument } from './viewer-controller';
import { AsyncTaskManager } from '../markdown-processor';
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

// ============================================================================
// Render Markdown Flow
// ============================================================================

/**
 * Translate function type for localization
 */
export type TranslateFn = (key: string, subs?: string | string[]) => string;

/**
 * Options for the unified render markdown flow.
 * 
 * This abstracts the common rendering logic across Chrome/VSCode/Mobile,
 * with platform-specific behavior controlled via callbacks.
 */
export interface RenderMarkdownFlowOptions {
  /** Markdown content to render */
  markdown: string;
  
  /** Container element to render into */
  container: HTMLElement;
  
  /** Whether the file has changed (new file loaded) */
  fileChanged: boolean;
  
  /** Force re-render even if file hasn't changed (e.g., theme change) */
  forceRender: boolean;
  
  /** Current zoom level as decimal (1.0 = 100%) */
  zoomLevel: number;
  
  /** Scroll sync controller (optional) */
  scrollController: ScrollSyncController | null;
  
  /** Plugin renderer for diagrams */
  renderer: PluginRenderer;
  
  /** Translate function for localization */
  translate: TranslateFn;
  
  /** Platform API */
  platform: PlatformAPI;
  
  /** 
   * Reference to current task manager for abort handling.
   * The function will set currentTaskManagerRef.current during rendering.
   */
  currentTaskManagerRef: { current: AsyncTaskManager | null };
  
  /**
   * Target line for scroll sync.
   * - Chrome/Mobile: Pass the saved scroll line
   * - VSCode: Pass undefined (uses message-driven targetLine set before render)
   */
  targetLine?: number;
  
  /**
   * Callback when headings are extracted during render.
   * - Chrome: Update TOC progressively
   * - VSCode/Mobile: Send to host
   */
  onHeadings?: (headings: Array<{ level: number; text: string; id: string }>) => void;
  
  /**
   * Callback for async task progress (diagrams, charts).
   * - VSCode/Mobile: Send RENDER_PROGRESS to host
   * - Chrome: Update progress indicator
   */
  onProgress?: (completed: number, total: number) => void;
  
  /**
   * Called before processing async tasks.
   * - Chrome: Show processing indicator
   */
  beforeProcessAll?: () => void;
  
  /**
   * Called after processing async tasks.
   * - Chrome: Hide processing indicator
   */
  afterProcessAll?: () => void;
  
  /**
   * Called after render completes successfully.
   * - Chrome: Update active TOC item
   */
  afterRender?: () => void;
}

/**
 * Unified markdown rendering flow for all platforms.
 * 
 * This function handles:
 * 1. Task manager lifecycle (create, abort previous, cleanup)
 * 2. Container clearing and scroll reset logic
 * 3. Zoom application
 * 4. Markdown rendering with streaming
 * 5. Async task processing (diagrams, charts)
 * 
 * Platform-specific behavior is controlled via callbacks.
 * 
 * @example
 * ```typescript
 * // Chrome
 * await renderMarkdownFlow({
 *   markdown,
 *   container,
 *   fileChanged: true,
 *   forceRender: false,
 *   zoomLevel: 1.5,
 *   scrollController,
 *   renderer: pluginRenderer,
 *   translate: Localization.translate,
 *   platform,
 *   currentTaskManagerRef: { current: currentTaskManager },
 *   targetLine: savedScrollLine,
 *   onHeadings: () => generateTOC(),
 *   beforeProcessAll: showProcessingIndicator,
 *   afterProcessAll: hideProcessingIndicator,
 *   afterRender: updateActiveTocItem,
 * });
 * 
 * // VSCode (targetLine undefined - set via message)
 * await renderMarkdownFlow({
 *   markdown,
 *   container,
 *   fileChanged,
 *   forceRender,
 *   zoomLevel: currentZoomLevel,
 *   scrollController,
 *   renderer: pluginRenderer,
 *   translate: Localization.translate,
 *   platform,
 *   currentTaskManagerRef: { current: currentTaskManager },
 *   onHeadings: (h) => vscodeBridge.postMessage('HEADINGS_UPDATED', h),
 *   onProgress: (c, t) => vscodeBridge.postMessage('RENDER_PROGRESS', { completed: c, total: t }),
 * });
 * ```
 */
export async function renderMarkdownFlow(options: RenderMarkdownFlowOptions): Promise<void> {
  const {
    markdown,
    container,
    fileChanged,
    forceRender,
    zoomLevel,
    scrollController,
    renderer,
    translate,
    platform,
    currentTaskManagerRef,
    targetLine,
    onHeadings,
    onProgress,
    beforeProcessAll,
    afterProcessAll,
    afterRender,
  } = options;

  // Abort any previous rendering task
  if (currentTaskManagerRef.current) {
    currentTaskManagerRef.current.abort();
    currentTaskManagerRef.current = null;
  }

  try {
    // Create task manager
    const taskManager = new AsyncTaskManager(translate);
    currentTaskManagerRef.current = taskManager;

    // Determine if we need to clear container
    const shouldClear = fileChanged || forceRender;

    if (shouldClear) {
      // Check if this is a real file switch (has existing content) vs initial load
      const isRealFileSwitch = container.childNodes.length > 0;

      // Clear container
      container.innerHTML = '';

      // Only reset scroll state on real file switch, not initial load
      if (isRealFileSwitch && fileChanged) {
        scrollController?.reset();
      }
    }

    // Set target line for scroll sync
    // VSCode: targetLine is undefined, uses message-driven value
    // Chrome/Mobile: targetLine is passed as parameter
    if (targetLine !== undefined) {
      scrollController?.setTargetLine(targetLine);
    }

    // Apply zoom level before rendering
    if (zoomLevel !== 1) {
      container.style.zoom = String(zoomLevel);
    }

    // Get frontmatter display setting
    const frontmatterDisplay = await getFrontmatterDisplay(platform);

    // Render markdown
    const renderResult = await renderMarkdownDocument({
      markdown,
      container,
      renderer,
      translate,
      taskManager,
      clearContainer: false, // Already cleared above if needed
      frontmatterDisplay,
      onHeadings,
      onStreamingComplete: () => {
        scrollController?.onStreamingComplete();
      },
    });

    if (taskManager.isAborted()) {
      return;
    }

    // Platform-specific: called after streaming, before async tasks
    // Chrome uses this to update TOC active state
    if (afterRender) {
      setTimeout(afterRender, 100);
    }

    // Process async tasks (diagrams, charts)
    beforeProcessAll?.();
    try {
      await renderResult.taskManager.processAll((completed, total) => {
        if (!taskManager.isAborted()) {
          onProgress?.(completed, total);
        }
      });
    } finally {
      afterProcessAll?.();
    }

    // Clear task manager reference
    if (currentTaskManagerRef.current === taskManager) {
      currentTaskManagerRef.current = null;
    }

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[ViewerHost] Render failed:', error);
  }
}
