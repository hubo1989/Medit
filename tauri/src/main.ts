/**
 * Medit Tauri Application Main Entry
 * Initializes the markdown editor with preview mode support
 */

import { EditorModeService, type EditorMode, VditorEditor, FileSaveService, type SaveStatus } from './editor/index.js';
import { Toolbar } from './ui/index.js';
import { I18nService, type Language } from './i18n/index.js';
import { MenuService } from './menu/index.js';

// Application state
interface AppState {
  scrollPosition: number;
  editorScrollPosition: number;
  theme: 'light' | 'dark';
  tocVisible: boolean;
  splitRatio: number; // 0.0 - 1.0, default 0.5
  filePath: string;
}

/**
 * Main application class
 */
class MeditApp {
  private _modeService: EditorModeService;
  private _i18n: I18nService;
  private _toolbar: Toolbar | null = null;
  private _editor: VditorEditor | null = null;
  private _fileSaveService: FileSaveService | null = null;
  private _menuService: MenuService | null = null;
  private _appContainer: HTMLElement | null = null;
  private _state: AppState = {
    scrollPosition: 0,
    editorScrollPosition: 0,
    theme: 'light',
    tocVisible: true,
    splitRatio: 0.5,
    filePath: 'document.md',
  };
  private _currentContent = '';
  private _previewUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
  private _saveStatusElement: HTMLElement | null = null;

  constructor() {
    this._modeService = new EditorModeService({
      storageKey: 'medit:editor-mode',
      defaultMode: 'preview',
    });
    this._i18n = new I18nService({
      storageKey: 'medit:language',
      defaultLanguage: 'zh',
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
    this._initFileSaveService();
    this._initSaveStatusIndicator();
    this._initKeyboardShortcuts();
    this._initMenuService();

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
      i18n: this._i18n,
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
        this._fileSaveService?.autoSave(value);
      },
    });
  }

  /**
   * Initialize file save service
   */
  private _initFileSaveService(): void {
    this._fileSaveService = new FileSaveService({
      filePath: this._state.filePath,
      autoSave: true,
      autoSaveDelay: 2000,
      onStatusChange: (status) => {
        this._updateSaveStatusIndicator(status);
      },
      onSave: () => {
        console.log('[Medit] File saved successfully');
      },
    });

    // Set initial content as last saved
    this._fileSaveService.setLastSavedContent(this._currentContent);
  }

  /**
   * Initialize save status indicator
   */
  private _initSaveStatusIndicator(): void {
    const toolbarContainer = document.getElementById('toolbar-container');
    if (!toolbarContainer) return;

    const statusElement = document.createElement('div');
    statusElement.className = 'save-status';
    statusElement.setAttribute('data-status', 'idle');
    statusElement.textContent = '';

    toolbarContainer.appendChild(statusElement);
    this._saveStatusElement = statusElement;
  }

  /**
   * Update save status indicator UI
   */
  private _updateSaveStatusIndicator(status: SaveStatus): void {
    if (!this._saveStatusElement) return;

    this._saveStatusElement.setAttribute('data-status', status);
    this._saveStatusElement.textContent = this._i18n.getSaveStatus(status);
  }

  /**
   * Initialize menu service for native menu events
   */
  private _initMenuService(): void {
    this._menuService = new MenuService({
      onNewFile: () => this._handleNewFile(),
      onOpenFile: () => this._handleOpenFile(),
      onSave: () => this._manualSave(),
      onSaveAs: () => this._handleSaveAs(),
      onExit: () => this._handleExit(),
      onFind: () => this._handleFind(),
      onEditMode: () => this._modeService.switchMode('edit'),
      onPreviewMode: () => this._modeService.switchMode('preview'),
      onSplitMode: () => this._modeService.switchMode('split'),
      onZoomIn: () => this._handleZoomIn(),
      onZoomOut: () => this._handleZoomOut(),
      onResetZoom: () => this._handleResetZoom(),
      onAbout: () => this._handleAbout(),
      onDocs: () => this._handleDocs(),
      onShortcuts: () => this._handleShortcuts(),
    });

    void this._menuService.init();
  }

  /**
   * Handle new file from menu
   */
  private _handleNewFile(): void {
    // Clear current content
    this._currentContent = '';
    this._editor?.setValue('');
    this._state.filePath = 'document.md';
    this._saveState();
    console.log('[Medit] New file created');
  }

  /**
   * Handle open file from menu
   */
  private _handleOpenFile(): void {
    // TODO: Implement file open dialog using Tauri API
    console.log('[Medit] Open file dialog');
  }

  /**
   * Handle save as from menu
   */
  private _handleSaveAs(): void {
    // TODO: Implement save as dialog using Tauri API
    console.log('[Medit] Save as dialog');
  }

  /**
   * Handle exit from menu
   */
  private _handleExit(): void {
    this._saveState();
    void this._fileSaveService?.flush();
    console.log('[Medit] Exit requested');
  }

  /**
   * Handle find from menu
   */
  private _handleFind(): void {
    // Focus editor and trigger find
    this._editor?.focus();
    console.log('[Medit] Find dialog');
  }

  /**
   * Handle zoom in
   */
  private _handleZoomIn(): void {
    const currentZoom = parseFloat(document.body.style.zoom || '1');
    const newZoom = Math.min(currentZoom + 0.1, 2);
    document.body.style.zoom = String(newZoom);
    console.log('[Medit] Zoom in:', newZoom);
  }

  /**
   * Handle zoom out
   */
  private _handleZoomOut(): void {
    const currentZoom = parseFloat(document.body.style.zoom || '1');
    const newZoom = Math.max(currentZoom - 0.1, 0.5);
    document.body.style.zoom = String(newZoom);
    console.log('[Medit] Zoom out:', newZoom);
  }

  /**
   * Handle reset zoom
   */
  private _handleResetZoom(): void {
    document.body.style.zoom = '1';
    console.log('[Medit] Zoom reset');
  }

  /**
   * Handle about from menu
   */
  private _handleAbout(): void {
    alert('Medit - Markdown Editor\nVersion 1.0.0');
  }

  /**
   * Handle docs from menu
   */
  private _handleDocs(): void {
    window.open('https://github.com/medit/docs', '_blank');
  }

  /**
   * Handle shortcuts from menu
   */
  private _handleShortcuts(): void {
    alert(
      '快捷键参考:\n\n' +
        'Ctrl/Cmd + S - 保存\n' +
        'Ctrl/Cmd + O - 打开\n' +
        'Ctrl/Cmd + F - 查找\n' +
        'Ctrl/Cmd + B - 切换目录\n' +
        'Ctrl/Cmd + Shift + E - 编辑模式\n' +
        'Ctrl/Cmd + Shift + P - 预览模式\n' +
        'Ctrl/Cmd + Shift + L - 分屏模式\n' +
        'Ctrl/Cmd + +/- - 缩放'
    );
  }

  /**
   * Initialize keyboard shortcuts
   */
  private _initKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Ctrl+S / Cmd+S for manual save
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        void this._manualSave();
        return;
      }

      // Ctrl+B / Cmd+B for TOC toggle
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.shiftKey) {
        e.preventDefault();
        this.toggleToc();
        return;
      }

      // Ctrl+Shift+E for edit mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        this._modeService.switchMode('edit');
        return;
      }

      // Ctrl+Shift+P for preview mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this._modeService.switchMode('preview');
        return;
      }

      // Ctrl+Shift+S for split mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        this._modeService.switchMode('split');
        return;
      }
    });
  }

  /**
   * Trigger manual save
   */
  private async _manualSave(): Promise<void> {
    if (!this._fileSaveService) return;

    const success = await this._fileSaveService.save(this._currentContent, { force: true });
    if (!success) {
      console.error('[Medit] Manual save failed');
    }
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
   * Set language
   */
  setLanguage(lang: Language): void {
    this._i18n.setLanguage(lang);
    this._toolbar?.updateLabels();
    this._updateSaveStatusIndicator(this._fileSaveService?.getStatus() ?? 'idle');
    this._saveState();
  }

  /**
   * Toggle language between English and Chinese
   */
  toggleLanguage(): void {
    this._i18n.toggleLanguage();
    this._toolbar?.updateLabels();
    this._updateSaveStatusIndicator(this._fileSaveService?.getStatus() ?? 'idle');
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

    // Flush pending saves
    void this._fileSaveService?.flush();

    this._toolbar?.destroy();
    this._toolbar = null;
    this._editor?.destroy();
    this._editor = null;
    this._fileSaveService?.dispose();
    this._fileSaveService = null;
    this._menuService?.dispose();
    this._menuService = null;
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
