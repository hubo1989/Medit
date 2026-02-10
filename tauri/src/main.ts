/**
 * Medit Tauri Application Main Entry
 * Initializes the markdown editor with preview mode support
 */

import { EditorModeService, type EditorMode } from './editor/index.js';
import { Toolbar } from './ui/index.js';

// Application state
interface AppState {
  scrollPosition: number;
  theme: 'light' | 'dark';
  tocVisible: boolean;
}

/**
 * Main application class
 */
class MeditApp {
  private _modeService: EditorModeService;
  private _toolbar: Toolbar | null = null;
  private _appContainer: HTMLElement | null = null;
  private _state: AppState = {
    scrollPosition: 0,
    theme: 'light',
    tocVisible: true,
  };

  constructor() {
    this._modeService = new EditorModeService({
      storageKey: 'medit:editor-mode',
      defaultMode: 'preview',
    });
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    this._appContainer = document.getElementById('app');
    if (!this._appContainer) {
      throw new Error('MeditApp: App container not found');
    }

    // Load saved state
    this._loadState();

    // Initialize UI
    this._initToolbar();
    this._initModeHandling();

    // Apply initial mode
    this._applyMode(this._modeService.getCurrentMode());

    // Setup event listeners
    this._setupEventListeners();

    console.log('[Medit] Application initialized');
  }

  /**
   * Initialize toolbar component
   */
  private _initToolbar(): void {
    const toolbarContainer = document.getElementById('toolbar-container');
    if (!toolbarContainer) {
      console.warn('[Medit] Toolbar container not found');
      return;
    }

    this._toolbar = new Toolbar({
      container: toolbarContainer,
      modeService: this._modeService,
    });
  }

  /**
   * Initialize mode change handling
   */
  private _initModeHandling(): void {
    // Subscribe to mode changes
    this._modeService.onModeChange((newMode, previousMode) => {
      console.log(`[Medit] Mode changed: ${previousMode} -> ${newMode}`);
      this._applyMode(newMode);
      this._saveState();
    });
  }

  /**
   * Apply mode to UI
   */
  private _applyMode(mode: EditorMode): void {
    // Set data-mode attribute on app container for CSS targeting
    this._appContainer?.setAttribute('data-mode', mode);

    // Save scroll position before mode change
    if (mode !== 'preview') {
      this._saveScrollPosition();
    }

    // Handle editor visibility
    const editorContainer = document.getElementById('editor-container');
    const previewContainer = document.getElementById('preview-container');

    if (!editorContainer || !previewContainer) {
      console.warn('[Medit] Editor or preview container not found');
      return;
    }

    switch (mode) {
      case 'preview':
        // Preview mode: hide editor, show preview only
        editorContainer.style.display = 'none';
        previewContainer.style.display = 'flex';
        previewContainer.style.width = '100%';
        // Restore scroll position
        this._restoreScrollPosition();
        break;

      case 'edit':
        // Edit mode: show editor only, hide preview
        editorContainer.style.display = 'flex';
        editorContainer.style.width = '100%';
        previewContainer.style.display = 'none';
        break;

      case 'split':
        // Split mode: show both editor and preview
        editorContainer.style.display = 'flex';
        editorContainer.style.width = '50%';
        previewContainer.style.display = 'flex';
        previewContainer.style.width = '50%';
        break;
    }

    // Dispatch custom event for mode change
    window.dispatchEvent(
      new CustomEvent('medit:modechange', {
        detail: { mode, previousMode: this._modeService.getCurrentMode() },
      })
    );
  }

  /**
   * Setup global event listeners
   */
  private _setupEventListeners(): void {
    // Save scroll position on scroll
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
      let scrollTimeout: ReturnType<typeof setTimeout>;
      previewContainer.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this._state.scrollPosition = previewContainer.scrollTop;
          this._saveState();
        }, 150);
      });
    }

    // Handle before unload
    window.addEventListener('beforeunload', () => {
      this._saveState();
    });

    // Handle visibility change (save state when switching tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this._saveState();
      }
    });
  }

  /**
   * Save current scroll position
   */
  private _saveScrollPosition(): void {
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
      this._state.scrollPosition = previewContainer.scrollTop;
    }
  }

  /**
   * Restore scroll position
   */
  private _restoreScrollPosition(): void {
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer && this._state.scrollPosition > 0) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        previewContainer.scrollTop = this._state.scrollPosition;
      });
    }
  }

  /**
   * Load saved state from localStorage
   */
  private _loadState(): void {
    try {
      const saved = localStorage.getItem('medit:app-state');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AppState>;
        this._state = {
          ...this._state,
          ...parsed,
        };
      }
    } catch {
      // Ignore storage errors
    }

    // Apply TOC visibility
    this._appContainer?.setAttribute('data-toc', this._state.tocVisible ? 'visible' : 'hidden');
  }

  /**
   * Save state to localStorage
   */
  private _saveState(): void {
    try {
      localStorage.setItem('medit:app-state', JSON.stringify(this._state));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Get current mode service instance
   */
  getModeService(): EditorModeService {
    return this._modeService;
  }

  /**
   * Toggle TOC visibility
   */
  toggleToc(): void {
    this._state.tocVisible = !this._state.tocVisible;
    this._appContainer?.setAttribute('data-toc', this._state.tocVisible ? 'visible' : 'hidden');
    this._saveState();
  }

  /**
   * Set theme
   */
  setTheme(theme: 'light' | 'dark'): void {
    this._state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this._saveState();
  }

  /**
   * Destroy the application
   */
  destroy(): void {
    this._toolbar?.destroy();
    this._toolbar = null;
  }
}

// Initialize application when DOM is ready
function initApp(): void {
  const app = new MeditApp();

  app
    .init()
    .then(() => {
      // Expose app instance for debugging
      (window as unknown as Record<string, unknown>).meditApp = app;
    })
    .catch((error) => {
      console.error('[Medit] Failed to initialize app:', error);
    });
}

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

export { MeditApp };
export default MeditApp;
