/**
 * FileSaveService - Handles file saving operations with auto-save and manual save support
 * Integrates with Tauri's fs API for writing content to files
 */

import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface FileSaveServiceConfig {
  /** Target file path */
  filePath: string;
  /** Base directory for file operations */
  baseDir?: BaseDirectory;
  /** Enable auto-save on content change */
  autoSave?: boolean;
  /** Auto-save debounce delay in milliseconds */
  autoSaveDelay?: number;
  /** Callback when save status changes */
  onStatusChange?: (status: SaveStatus, error?: Error) => void;
  /** Callback when content is saved */
  onSave?: (content: string) => void;
}

export interface SaveOptions {
  /** Skip auto-save check and force save */
  force?: boolean;
}

export class FileSaveService {
  private _config: Required<FileSaveServiceConfig>;
  private _status: SaveStatus = 'idle';
  private _lastSavedContent = '';
  private _pendingContent: string | null = null;
  private _autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private _isDisposed = false;

  constructor(config: FileSaveServiceConfig) {
    this._config = {
      baseDir: BaseDirectory.AppLocalData,
      autoSave: true,
      autoSaveDelay: 2000,
      onStatusChange: () => {},
      onSave: () => {},
      ...config,
    };
  }

  /**
   * Get current save status
   */
  getStatus(): SaveStatus {
    return this._status;
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(content: string): boolean {
    return content !== this._lastSavedContent;
  }

  /**
   * Save content to file
   */
  async save(content: string, options: SaveOptions = {}): Promise<boolean> {
    if (this._isDisposed) {
      throw new Error('FileSaveService: Service has been disposed');
    }

    // Skip if content hasn't changed and not forced
    if (!options.force && !this.hasUnsavedChanges(content)) {
      return true;
    }

    this._setStatus('saving');

    try {
      await writeTextFile(this._config.filePath, content, {
        baseDir: this._config.baseDir,
      });

      this._lastSavedContent = content;
      this._pendingContent = null;
      this._setStatus('saved');
      this._config.onSave(content);

      // Reset status to idle after a delay
      setTimeout(() => {
        if (this._status === 'saved') {
          this._setStatus('idle');
        }
      }, 2000);

      return true;
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error(String(error));
      this._setStatus('error', saveError);
      console.error('[FileSaveService] Failed to save file:', saveError);
      return false;
    }
  }

  /**
   * Trigger auto-save with debounce
   */
  autoSave(content: string): void {
    if (this._isDisposed) return;

    // Clear existing timeout
    if (this._autoSaveTimeout) {
      clearTimeout(this._autoSaveTimeout);
    }

    // If auto-save is disabled, just mark as having pending changes
    if (!this._config.autoSave) {
      this._pendingContent = content;
      return;
    }

    // Set new timeout for debounced save
    this._autoSaveTimeout = setTimeout(() => {
      void this.save(content);
    }, this._config.autoSaveDelay);

    // Update status to indicate pending changes
    if (this._status !== 'saving') {
      this._setStatus('idle');
    }
  }

  /**
   * Cancel pending auto-save
   */
  cancelAutoSave(): void {
    if (this._autoSaveTimeout) {
      clearTimeout(this._autoSaveTimeout);
      this._autoSaveTimeout = null;
    }
  }

  /**
   * Force save any pending content
   */
  async flush(): Promise<boolean> {
    if (this._pendingContent !== null) {
      return this.save(this._pendingContent, { force: true });
    }
    return true;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FileSaveServiceConfig>): void {
    if (this._isDisposed) {
      throw new Error('FileSaveService: Service has been disposed');
    }

    Object.assign(this._config, config);
  }

  /**
   * Get current configuration
   */
  getConfig(): FileSaveServiceConfig {
    return { ...this._config };
  }

  /**
   * Set last saved content without saving (useful for initial load)
   */
  setLastSavedContent(content: string): void {
    this._lastSavedContent = content;
    this._pendingContent = null;
  }

  /**
   * Dispose the service and cleanup resources
   */
  dispose(): void {
    this._isDisposed = true;
    this.cancelAutoSave();
    this._pendingContent = null;
  }

  /**
   * Update save status and notify listeners
   */
  private _setStatus(status: SaveStatus, error?: Error): void {
    this._status = status;
    this._config.onStatusChange(status, error);
  }
}

export default FileSaveService;
