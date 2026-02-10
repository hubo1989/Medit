/**
 * Menu Service - Handles native menu events from Tauri backend
 */

import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export interface MenuServiceConfig {
  onNewFile?: () => void;
  onOpenFile?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onExit?: () => void;
  onFind?: () => void;
  onPreferences?: () => void;
  onEditMode?: () => void;
  onPreviewMode?: () => void;
  onSplitMode?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onAbout?: () => void;
  onDocs?: () => void;
  onShortcuts?: () => void;
}

/**
 * Menu service that listens to native menu events from Tauri
 */
export class MenuService {
  private _config: MenuServiceConfig;
  private _unlisteners: UnlistenFn[] = [];
  private _isInitialized = false;

  constructor(config: MenuServiceConfig = {}) {
    this._config = config;
  }

  /**
   * Initialize menu event listeners
   */
  async init(): Promise<void> {
    if (this._isInitialized) return;

    // File menu events
    this._unlisteners.push(
      await listen('menu:file:new', () => this._config.onNewFile?.())
    );
    this._unlisteners.push(
      await listen('menu:file:open', () => this._config.onOpenFile?.())
    );
    this._unlisteners.push(
      await listen('menu:file:save', () => this._config.onSave?.())
    );
    this._unlisteners.push(
      await listen('menu:file:save-as', () => this._config.onSaveAs?.())
    );
    this._unlisteners.push(
      await listen('menu:file:exit', () => this._config.onExit?.())
    );

    // Edit menu events
    this._unlisteners.push(
      await listen('menu:edit:find', () => this._config.onFind?.())
    );

    // Preferences menu event
    this._unlisteners.push(
      await listen('menu:preferences', () => this._config.onPreferences?.())
    );

    // View menu events
    this._unlisteners.push(
      await listen('menu:view:edit-mode', () => this._config.onEditMode?.())
    );
    this._unlisteners.push(
      await listen('menu:view:preview-mode', () => this._config.onPreviewMode?.())
    );
    this._unlisteners.push(
      await listen('menu:view:split-mode', () => this._config.onSplitMode?.())
    );
    this._unlisteners.push(
      await listen('menu:view:zoom-in', () => this._config.onZoomIn?.())
    );
    this._unlisteners.push(
      await listen('menu:view:zoom-out', () => this._config.onZoomOut?.())
    );
    this._unlisteners.push(
      await listen('menu:view:reset-zoom', () => this._config.onResetZoom?.())
    );

    // Help menu events
    this._unlisteners.push(
      await listen('menu:help:about', () => this._config.onAbout?.())
    );
    this._unlisteners.push(
      await listen('menu:help:docs', () => this._config.onDocs?.())
    );
    this._unlisteners.push(
      await listen('menu:help:shortcuts', () => this._config.onShortcuts?.())
    );

    this._isInitialized = true;
    console.log('[MenuService] Initialized');
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Dispose of event listeners
   */
  dispose(): void {
    this._unlisteners.forEach((unlisten) => unlisten());
    this._unlisteners = [];
    this._isInitialized = false;
    console.log('[MenuService] Disposed');
  }
}

export default MenuService;
