/**
 * SyncScrollService - Manages bidirectional scroll synchronization
 * between editor and preview containers in split mode
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('SyncScroll');

export interface SyncScrollServiceConfig {
  /** Function to get the editor scroll container */
  getEditorScrollContainer: () => HTMLElement | null;
  /** Function to get the preview scroll container */
  getPreviewScrollContainer: () => HTMLElement | null;
  /** Initial enabled state */
  enabled?: boolean;
}

export class SyncScrollService {
  private _config: SyncScrollServiceConfig;
  private _enabled: boolean;
  private _isSyncing = false; // Prevents infinite loop during sync
  private _editorScrollHandler: (() => void) | null = null;
  private _previewScrollHandler: (() => void) | null = null;
  private _animationFrameId: number | null = null;

  constructor(config: SyncScrollServiceConfig) {
    this._config = config;
    this._enabled = config.enabled ?? false;

    if (this._enabled) {
      this._attachListeners();
    }
  }

  /**
   * Enable scroll synchronization
   */
  enable(): void {
    if (this._enabled) return;
    this._enabled = true;
    this._attachListeners();
    logger.debug('Sync scroll enabled');
  }

  /**
   * Disable scroll synchronization
   */
  disable(): void {
    if (!this._enabled) return;
    this._enabled = false;
    this._detachListeners();
    logger.debug('Sync scroll disabled');
  }

  /**
   * Check if sync scroll is enabled
   */
  isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * Clean up and destroy the service
   */
  destroy(): void {
    this._detachListeners();
    this._editorScrollHandler = null;
    this._previewScrollHandler = null;
    logger.debug('Sync scroll service destroyed');
  }

  /**
   * Attach scroll event listeners
   */
  private _attachListeners(): void {
    const editorContainer = this._config.getEditorScrollContainer();
    const previewContainer = this._config.getPreviewScrollContainer();

    if (!editorContainer || !previewContainer) {
      logger.warn('Cannot attach listeners: containers not found');
      return;
    }

    // Create throttled handlers using requestAnimationFrame
    this._editorScrollHandler = () => this._handleEditorScroll();
    this._previewScrollHandler = () => this._handlePreviewScroll();

    editorContainer.addEventListener('scroll', this._editorScrollHandler, { passive: true });
    previewContainer.addEventListener('scroll', this._previewScrollHandler, { passive: true });

    logger.debug('Scroll listeners attached');
  }

  /**
   * Detach scroll event listeners
   */
  private _detachListeners(): void {
    const editorContainer = this._config.getEditorScrollContainer();
    const previewContainer = this._config.getPreviewScrollContainer();

    if (this._editorScrollHandler) {
      editorContainer?.removeEventListener('scroll', this._editorScrollHandler);
    }
    if (this._previewScrollHandler) {
      previewContainer?.removeEventListener('scroll', this._previewScrollHandler);
    }

    // Cancel any pending animation frame
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  /**
   * Handle editor scroll event
   */
  private _handleEditorScroll(): void {
    if (this._isSyncing || !this._enabled) return;
    this._syncEditorToPreview();
  }

  /**
   * Handle preview scroll event
   */
  private _handlePreviewScroll(): void {
    if (this._isSyncing || !this._enabled) return;
    this._syncPreviewToEditor();
  }

  /**
   * Sync editor scroll position to preview
   */
  private _syncEditorToPreview(): void {
    // Use requestAnimationFrame for smooth sync
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
    }

    this._animationFrameId = requestAnimationFrame(() => {
      const editorContainer = this._config.getEditorScrollContainer();
      const previewContainer = this._config.getPreviewScrollContainer();

      if (!editorContainer || !previewContainer) return;

      const targetScroll = this._calculateSyncScroll(editorContainer, previewContainer);
      
      this._isSyncing = true;
      previewContainer.scrollTop = targetScroll;
      
      // Reset flag after a short delay to allow the scroll event to complete
      requestAnimationFrame(() => {
        this._isSyncing = false;
      });
    });
  }

  /**
   * Sync preview scroll position to editor
   */
  private _syncPreviewToEditor(): void {
    // Use requestAnimationFrame for smooth sync
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
    }

    this._animationFrameId = requestAnimationFrame(() => {
      const editorContainer = this._config.getEditorScrollContainer();
      const previewContainer = this._config.getPreviewScrollContainer();

      if (!editorContainer || !previewContainer) return;

      const targetScroll = this._calculateSyncScroll(previewContainer, editorContainer);
      
      this._isSyncing = true;
      editorContainer.scrollTop = targetScroll;
      
      // Reset flag after a short delay to allow the scroll event to complete
      requestAnimationFrame(() => {
        this._isSyncing = false;
      });
    });
  }

  /**
   * Calculate target scroll position based on ratio
   */
  private _calculateSyncScroll(source: HTMLElement, target: HTMLElement): number {
    const sourceMaxScroll = source.scrollHeight - source.clientHeight;
    const targetMaxScroll = target.scrollHeight - target.clientHeight;

    // Handle edge cases
    if (sourceMaxScroll <= 0 || targetMaxScroll <= 0) {
      return 0;
    }

    const scrollRatio = source.scrollTop / sourceMaxScroll;
    return scrollRatio * targetMaxScroll;
  }
}

export default SyncScrollService;
