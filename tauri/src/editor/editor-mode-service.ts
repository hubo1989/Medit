/**
 * EditorModeService - Manages editor view mode state
 * Supports 'preview' | 'edit' | 'split' modes with persistence
 */

export type EditorMode = 'preview' | 'edit' | 'split';

export type ModeChangeCallback = (mode: EditorMode, previousMode: EditorMode) => void;

export interface EditorModeServiceConfig {
  /** Storage key for localStorage */
  storageKey?: string;
  /** Default mode if none saved */
  defaultMode?: EditorMode;
}

const DEFAULT_STORAGE_KEY = 'medit:editor-mode';
const VALID_MODES: EditorMode[] = ['preview', 'edit', 'split'];

export class EditorModeService {
  private _currentMode: EditorMode;
  private _storageKey: string;
  private _listeners: Set<ModeChangeCallback> = new Set();

  constructor(config: EditorModeServiceConfig = {}) {
    this._storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
    this._currentMode = this._loadSavedMode() ?? config.defaultMode ?? 'edit';
  }

  /**
   * Get current editor mode
   */
  getCurrentMode(): EditorMode {
    return this._currentMode;
  }

  /**
   * Switch to a new editor mode
   * Triggers callbacks if mode actually changes
   */
  switchMode(mode: EditorMode): void {
    if (!this._isValidMode(mode)) {
      throw new Error(`EditorModeService: Invalid mode "${mode}". Valid modes are: ${VALID_MODES.join(', ')}`);
    }

    const previousMode = this._currentMode;

    if (mode === previousMode) {
      return;
    }

    this._currentMode = mode;
    this._saveMode(mode);
    this._notifyListeners(mode, previousMode);
  }

  /**
   * Check if current mode is preview
   */
  isPreviewMode(): boolean {
    return this._currentMode === 'preview';
  }

  /**
   * Check if current mode is edit
   */
  isEditMode(): boolean {
    return this._currentMode === 'edit';
  }

  /**
   * Check if current mode is split
   */
  isSplitMode(): boolean {
    return this._currentMode === 'split';
  }

  /**
   * Toggle between edit and preview modes
   */
  toggleEditPreview(): void {
    const newMode = this._currentMode === 'edit' ? 'preview' : 'edit';
    this.switchMode(newMode);
  }

  /**
   * Subscribe to mode changes
   * Returns unsubscribe function
   */
  onModeChange(callback: ModeChangeCallback): () => void {
    this._listeners.add(callback);

    return () => {
      this._listeners.delete(callback);
    };
  }

  /**
   * Subscribe to mode changes (alias for onModeChange)
   */
  subscribe(callback: ModeChangeCallback): () => void {
    return this.onModeChange(callback);
  }

  /**
   * Get list of all valid modes
   */
  getValidModes(): EditorMode[] {
    return [...VALID_MODES];
  }

  /**
   * Reset to default mode
   */
  reset(defaultMode: EditorMode = 'edit'): void {
    this.switchMode(defaultMode);
  }

  /**
   * Clear saved mode from storage
   */
  clearSavedMode(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(this._storageKey);
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Load saved mode from localStorage
   */
  private _loadSavedMode(): EditorMode | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const saved = localStorage.getItem(this._storageKey);
      if (saved && this._isValidMode(saved as EditorMode)) {
        return saved as EditorMode;
      }
    } catch {
      // Ignore storage errors (e.g., private browsing mode)
    }

    return null;
  }

  /**
   * Save current mode to localStorage
   */
  private _saveMode(mode: EditorMode): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.setItem(this._storageKey, mode);
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }

  /**
   * Validate mode value
   */
  private _isValidMode(mode: string): mode is EditorMode {
    return VALID_MODES.includes(mode as EditorMode);
  }

  /**
   * Notify all registered listeners
   */
  private _notifyListeners(newMode: EditorMode, previousMode: EditorMode): void {
    for (const callback of this._listeners) {
      try {
        callback(newMode, previousMode);
      } catch (error) {
        // Log error but don't break other listeners
        console.error('EditorModeService: Error in mode change callback:', error);
      }
    }
  }
}

export default EditorModeService;
