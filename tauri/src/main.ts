/**
 * Medit Tauri Application Main Entry
 * Initializes the markdown editor with preview mode support
 */

import { EditorModeService, type EditorMode, VditorEditor } from './editor/index.js';
import { Toolbar } from './ui/index.js';

// Application state
interface AppState {
  scrollPosition: number;
  editorScrollPosition: number;
  theme: 'light' | 'dark';
  tocVisible: boolean;
  splitRatio: number; // 0.0 - 1.0, default 0.5
}

/**
 * Main application class
 */
class MeditApp {
  private _modeService: EditorModeService;
  private _toolbar: Toolbar | null = null;
  private _editor: VditorEditor | null = null;
  private _appContainer: HTMLElement | null = null;
  private _state: AppState = {
    scrollPosition: 0,
    editorScrollPosition: 0,
    theme: 'light',
    tocVisible: true,
    splitRatio: 0.5,
  };
  private _currentContent = '';
  private _previewUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

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
    this._initEditor();
    this._initModeHandling();

    // Load initial content
    await this._loadContent();

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
   * Initialize Vditor editor
   */
  private _initEditor(): void {
    this._editor = new VditorEditor({
      container: '#vditor-editor',
      theme: this._state.theme,
      initialValue: this._currentContent,
      placeholder: '开始编写 Markdown...',
      mode: 'sv',
      onChange: (value) => {
        this._currentContent = value;
        this._updatePreview(value);
      },
    });
  }

  /**
   * Load content from storage or default
   */
  private async _loadContent(): Promise<void> {
    // Try to load from localStorage first
    const savedContent = localStorage.getItem('medit:content');
    if (savedContent) {
      this._currentContent = savedContent;
      return;
    }

    // Default welcome content
    this._currentContent = `# 欢迎使用 Medit

这是一个简洁的 Markdown 编辑器。

## 功能特性

- **实时预览**: 编辑时即时查看渲染效果
- **多种模式**: 支持编辑、预览、分屏三种模式
- **主题切换**: 支持亮色和暗色主题
- **目录导航**: 自动生成文档目录

## 开始使用

在编辑器中输入 Markdown 语法，右侧预览区会实时更新。

## 快捷键

- \`Ctrl+B\`: 粗体
- \`Ctrl+I\`: 斜体
- \`Ctrl+K\`: 插入链接

---

*享受写作的乐趣！*
`;
  }

  /**
   * Update preview content with debounce (300ms)
   */
  private _updatePreview(content: string): void {
    // Clear existing timeout
    if (this._previewUpdateTimeout) {
      clearTimeout(this._previewUpdateTimeout);
    }

    // Debounce preview update
    this._previewUpdateTimeout = setTimeout(() => {
      this._renderPreview(content);
    }, 300);
  }

  /**
   * Render markdown to preview container using Vditor's markdown renderer
   */
  private async _renderPreview(content: string): Promise<void> {
    const previewContainer = document.getElementById('markdown-content');
    if (!previewContainer || typeof window.Vditor === 'undefined') return;

    try {
      // Use Vditor's markdown to HTML renderer
      const html = await window.Vditor.md2html(content, {
        theme: this._state.theme === 'dark' ? 'dark' : 'classic',
      });
      previewContainer.innerHTML = html;
    } catch (error) {
      console.error('[Medit] Failed to render preview:', error);
      // Fallback to plain text on error
      previewContainer.textContent = content;
    }
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
        // Initialize editor if needed
        void this._initEditorIfNeeded();
        break;

      case 'split':
        // Split mode: show both editor and preview
        editorContainer.style.display = 'flex';
        editorContainer.style.width = `${this._state.splitRatio * 100}%`;
        previewContainer.style.display = 'flex';
        previewContainer.style.width = `${(1 - this._state.splitRatio) * 100}%`;
        // Initialize editor if needed
        void this._initEditorIfNeeded();
        // Render preview with current content
        void this._renderPreview(this._currentContent);
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
    // Save scroll position on scroll for preview
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

    // Save scroll position for editor (Vditor container)
    const editorContainer = document.getElementById('vditor-editor');
    if (editorContainer) {
      let editorScrollTimeout: ReturnType<typeof setTimeout>;
      editorContainer.addEventListener('scroll', () => {
        clearTimeout(editorScrollTimeout);
        editorScrollTimeout = setTimeout(() => {
          this._state.editorScrollPosition = editorContainer.scrollTop;
          this._saveState();
        }, 150);
      });
    }

    // Setup split resizer
    this._setupSplitResizer();

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
   * Setup split pane resizer for split mode
   */
  private _setupSplitResizer(): void {
    const mainContainer = document.getElementById('main-container');
    const editorContainer = document.getElementById('editor-container');
    const previewContainer = document.getElementById('preview-container');

    if (!mainContainer || !editorContainer || !previewContainer) return;

    // Create resizer element
    const resizer = document.createElement('div');
    resizer.className = 'split-resizer';
    resizer.id = 'split-resizer';

    // Insert resizer between editor and preview
    editorContainer.after(resizer);

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const containerRect = mainContainer.getBoundingClientRect();
      const newRatio = (e.clientX - containerRect.left) / containerRect.width;

      // Clamp ratio between 20% and 80%
      const clampedRatio = Math.max(0.2, Math.min(0.8, newRatio));

      this._state.splitRatio = clampedRatio;
      editorContainer.style.width = `${clampedRatio * 100}%`;
      previewContainer.style.width = `${(1 - clampedRatio) * 100}%`;
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
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

    // Restore editor scroll position
    const editorContainer = document.getElementById('vditor-editor');
    if (editorContainer && this._state.editorScrollPosition > 0) {
      requestAnimationFrame(() => {
        editorContainer.scrollTop = this._state.editorScrollPosition;
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
    this._editor?.setTheme(theme);
    this._saveState();
  }

  /**
   * Initialize editor if not already initialized
   */
  private async _initEditorIfNeeded(): Promise<void> {
    if (!this._editor) {
      this._initEditor();
    }
    if (this._editor && !this._editor.isInitialized()) {
      await this._editor.init();
      if (this._currentContent) {
        this._editor.setValue(this._currentContent);
      }
    }
  }

  /**
   * Destroy the application
   */
  destroy(): void {
    // Clear pending preview update
    if (this._previewUpdateTimeout) {
      clearTimeout(this._previewUpdateTimeout);
      this._previewUpdateTimeout = null;
    }

    this._toolbar?.destroy();
    this._toolbar = null;
    this._editor?.destroy();
    this._editor = null;
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
