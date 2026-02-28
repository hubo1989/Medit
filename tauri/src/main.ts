/**
 * Medit Tauri Application Main Entry
 * Initializes the markdown editor with preview mode support
 */

import { EditorModeService, type EditorMode, VditorEditor, FileSaveService, type SaveStatus } from './editor/index.js';
import { PreferencesPanel, FindReplacePanel, PreviewToolbar, EditToolbar, TocService } from './ui/index.js';
import { I18nService, type Language } from './i18n/index.js';
import { MenuService } from './menu/index.js';
import { PreferencesService, ThemeService, SyncScrollService } from './services/index.js';
import { invoke } from '@tauri-apps/api/core';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import DOMPurify from 'dompurify';

// Main project rendering system
import { createTauriPlatform, createPluginRenderer } from './services/tauri-platform.js';
import { renderMarkdownFlow, setCurrentFileKey } from '@shared/core/viewer/viewer-host.js';
import { AsyncTaskManager } from '@shared/core/markdown-processor.js';
import type { PlatformAPI, PluginRenderer } from './types/shared.d.ts';

// Utilities
import { createLogger } from './utils/logger.js';
import { FONT_CONFIG, THEME_COLORS, STORAGE_KEYS, TIMING_CONFIG, VDITOR_CONFIG } from './utils/config.js';

const logger = createLogger('Medit');

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
  private _preferences: PreferencesService;
  private _themeService: ThemeService;
  private _editToolbar: EditToolbar | null = null;
  private _previewToolbar: PreviewToolbar | null = null;
  private _editor: VditorEditor | null = null;
  private _fileSaveService: FileSaveService | null = null;
  private _menuService: MenuService | null = null;
  private _preferencesPanel: PreferencesPanel | null = null;
  private _findReplacePanel: FindReplacePanel | null = null;
  private _tocService: TocService | null = null;
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
  private _hasOpenedFile = false; // Track if user has opened a file
  private _currentDevice: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  
  // Main project rendering system
  private _platform: PlatformAPI | null = null;
  private _pluginRenderer: PluginRenderer | null = null;

  // Sync scroll service for split mode
  private _syncScrollService: SyncScrollService | null = null;

  constructor() {
    this._modeService = new EditorModeService({
      storageKey: STORAGE_KEYS.appState + ':editor-mode',
      defaultMode: 'preview',
    });
    this._i18n = new I18nService({
      storageKey: STORAGE_KEYS.appState + ':language',
      defaultLanguage: 'zh',
    });
    this._preferences = new PreferencesService({
      storageKeyPrefix: 'medit:pref:',
      definitions: {
        // General settings
        'general.autoSave': {
          defaultValue: true,
          validate: (value) => typeof value === 'boolean',
        },
        'general.autoSaveInterval': {
          defaultValue: 5,
          validate: (value) => typeof value === 'number' && value >= 5 && value <= 300,
          transform: (value) => Math.max(5, Math.min(300, Math.round(value as number))),
        },
        // Editor settings (US-007)
        'editor.fontSize': {
          defaultValue: 14,
          validate: (value) => typeof value === 'number' && value >= 12 && value <= 24,
          transform: (value) => Math.max(12, Math.min(24, Math.round(value as number))),
        },
        'editor.fontFamily': {
          defaultValue: 'system',
          validate: (value) => typeof value === 'string' && ['system', 'monospace', 'serif', 'sans-serif'].includes(value),
        },
        'editor.lineHeight': {
          defaultValue: 1.6,
          validate: (value) => typeof value === 'number' && value >= 1.2 && value <= 2.0,
          transform: (value) => Math.max(1.2, Math.min(2.0, Math.round((value as number) * 10) / 10)),
        },
        'editor.tabWidth': {
          defaultValue: 4,
          validate: (value) => {
            const num = typeof value === 'string' ? parseInt(value, 10) : value;
            return typeof num === 'number' && (num === 2 || num === 4);
          },
          transform: (value) => {
            const num = typeof value === 'string' ? parseInt(value, 10) : value;
            return num === 2 ? 2 : 4;
          },
        },
        'editor.showLineNumbers': {
          defaultValue: true,
          validate: (value) => typeof value === 'boolean',
        },
      },
    });
    this._themeService = new ThemeService({
      preferences: this._preferences,
      onThemeChange: (theme) => this._handleThemeChange(theme),
    });
    
    // Initialize main project rendering system
    this._platform = createTauriPlatform();
    this._pluginRenderer = createPluginRenderer(this._platform);
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    this._appContainer = document.getElementById('app');
    if (!this._appContainer) {
      throw new Error('MeditApp: App container not found');
    }

    // Make Vditor available globally for preview rendering
    (window as unknown as Record<string, unknown>).Vditor = Vditor;

    // Load saved state
    this._loadState();

    // Sync theme with ThemeService (it may have detected system dark mode)
    this._state.theme = this._themeService.getCurrentTheme();

    // Initialize UI
    this._initPreferencesPanel();
    this._initToolbars();
    this._initEditor();
    this._initModeHandling();
    this._initFileSaveService();
    this._initSaveStatusIndicator();
    this._initKeyboardShortcuts();
    this._initMenuService();
    this._initFindReplacePanel();
    this._initTocService();
    this._initSyncScrollService();

    // Load initial content
    await this._loadContent();

    // Initialize renderer theme config based on current theme
    if (this._platform?.renderer) {
      const isDark = this._state.theme === 'dark';
      this._platform.renderer.setThemeConfig({
        fontFamily: FONT_CONFIG.defaultFamily,
        background: isDark ? THEME_COLORS.dark.background : THEME_COLORS.light.background,
        foreground: isDark ? THEME_COLORS.dark.foreground : THEME_COLORS.light.foreground,
        diagramStyle: 'normal'
      });
      logger.debug('Initial renderer theme config set for', this._state.theme, 'mode');
    }

    // Apply initial mode
    await this._applyMode(this._modeService.getCurrentMode());

    // Setup event listeners
    this._setupEventListeners();

    // Setup preference change listeners for auto-save
    this._setupAutoSavePreferenceListeners();

    // Setup preference change listeners for editor settings (US-007)
    this._setupEditorPreferenceListeners();

    // Apply initial editor settings
    this._applyInitialEditorSettings();

    logger.info('Application initialized');
  }

  /**
   * Initialize preferences panel
   */
  private _initPreferencesPanel(): void {
    if (!this._appContainer) return;

    this._preferencesPanel = new PreferencesPanel({
      container: this._appContainer,
      preferences: this._preferences,
      i18n: this._i18n,
      onChange: (key, value) => {
        logger.debug(`Preference changed: ${key} = ${String(value)}`);
      },
    });
  }

  /**
   * Initialize toolbars for all modes
   */
  private _initToolbars(): void {
    const previewToolbarContainer = document.getElementById('preview-toolbar-container');
    if (!previewToolbarContainer) {
      logger.warn('Preview toolbar container not found');
      return;
    }

    // Preview toolbar (for preview mode)
    this._previewToolbar = new PreviewToolbar({
      container: previewToolbarContainer,
      modeService: this._modeService,
      i18n: this._i18n,
      onFindClick: () => {
        this._findReplacePanel?.toggle();
      },
      onExportClick: (target) => {
        void this._handleExportTo(target);
      },
      onDevicePreviewChange: (device) => {
        this._applyDevicePreview(device);
      },
      onRefreshPreview: () => {
        this._refreshPreview();
      },
    });

    // Edit toolbar will be initialized after Vditor is ready (in _initEditorIfNeeded)
  }

  /**
   * Initialize edit toolbar in the combined toolbar container
   */
  private _initEditToolbar(): void {
    // Skip if already initialized
    if (this._editToolbar) {
      logger.debug('Edit toolbar already initialized');
      return;
    }

    // Find the combined toolbar container
    const editToolbarContainer = document.getElementById('edit-toolbar-container');
    if (!editToolbarContainer) {
      logger.warn('Edit toolbar container (#edit-toolbar-container) not found');
      return;
    }

    logger.debug('Found edit toolbar container, initializing EditToolbar');

    this._editToolbar = new EditToolbar({
      container: editToolbarContainer,
      modeService: this._modeService,
      i18n: this._i18n,
      onFindClick: () => {
        this._findReplacePanel?.toggle();
      },
      onExportClick: (target) => {
        void this._handleExportTo(target);
      },
      onDevicePreviewChange: (device) => {
        this._applyDevicePreview(device);
      },
      onRefreshPreview: () => {
        this._refreshPreview();
      },
      onEditAction: (action) => {
        this._handleEditAction(action);
      },
      onInsertDiagram: (template) => {
        this._handleInsertDiagram(template);
      },
    });

    logger.info('Edit toolbar initialized successfully');
  }

  /**
   * Handle edit action from toolbar
   */
  private _handleEditAction(action: string): void {
    if (!this._editor) return;

    switch (action) {
      case 'bold':
        this._editor.wrapSelection('**', '**');
        break;
      case 'italic':
        this._editor.wrapSelection('*', '*');
        break;
      case 'strikethrough':
        this._editor.wrapSelection('~~', '~~');
        break;
      case 'inlineCode':
        this._editor.insertInlineCode();
        break;
      case 'heading1':
        this._editor.insertHeading(1);
        break;
      case 'heading2':
        this._editor.insertHeading(2);
        break;
      case 'heading3':
        this._editor.insertHeading(3);
        break;
      case 'codeBlock':
        this._editor.insertCodeBlock();
        break;
      case 'quote':
        this._editor.insertQuote();
        break;
      case 'horizontalRule':
        this._editor.insertHorizontalRule();
        break;
      case 'link':
        this._editor.insertLink();
        break;
      case 'image':
        this._editor.insertImage();
        break;
      case 'unorderedList':
        this._editor.insertList(false);
        break;
      case 'orderedList':
        this._editor.insertList(true);
        break;
      case 'taskList':
        this._editor.insertTaskList();
        break;
      case 'undo':
        this._editor.undo();
        break;
      case 'redo':
        this._editor.redo();
        break;
    }
  }

  /**
   * Handle diagram template insertion
   */
  private _handleInsertDiagram(template: string): void {
    if (!this._editor) return;
    this._editor.insertTemplate(template);
  }

  /**
   * Apply device preview mode to preview container
   * In preview mode: adjusts #markdown-content max-width
   * In split mode: adjusts the preview-pane container width
   */
  private _applyDevicePreview(device: 'desktop' | 'tablet' | 'mobile'): void {
    this._currentDevice = device;
    
    // Update both toolbars directly
    if (this._previewToolbar) {
      this._previewToolbar.setDevice(device);
    }
    if (this._editToolbar) {
      this._editToolbar.setDevice(device);
    }

    // Apply to #markdown-content (for preview mode)
    const markdownContent = document.getElementById('markdown-content');
    if (markdownContent) {
      markdownContent.classList.remove('device-desktop', 'device-tablet', 'device-mobile');
      markdownContent.classList.add(`device-${device}`);
    }

    // Apply to .preview-pane container (for split mode)
    const previewPane = document.querySelector('.preview-pane') as HTMLElement;
    if (previewPane) {
      previewPane.classList.remove('device-desktop', 'device-tablet', 'device-mobile');
      previewPane.classList.add(`device-${device}`);
    }

    logger.debug(`Device preview mode: ${device}`);
  }

  /**
   * Refresh preview content
   */
  private _refreshPreview(): void {
    void this._renderPreview(this._currentContent);
    logger.debug('Preview refreshed');
  }

  /**
   * Handle export to specific target (公众号 or 知乎)
   */
  private async _handleExportTo(target: 'wechatMP' | 'zhihu'): Promise<void> {
    const content = this._currentContent;
    if (!content?.trim()) {
      alert(this._i18n.t('export.noContent'));
      return;
    }

    const targetKey = target === 'wechatMP' ? 'export.targets.wechatMP' : 'export.targets.zhihu';
    const targetName = this._i18n.t(targetKey);

    const exportingMsg = this._i18n.t('export.exporting').replace('{target}', targetName);
    console.log(`[Medit] ${exportingMsg}`);

    // TODO: Implement actual export functionality for 公众号 and 知乎
    const toBeAvailableMsg = this._i18n.t('export.toBeAvailable').replace('{target}', targetName);
    alert(toBeAvailableMsg);
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
      mode: 'ir',
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
    const autoSave = this._preferences.get<boolean>('general.autoSave');
    const autoSaveInterval = this._preferences.get<number>('general.autoSaveInterval');

    this._fileSaveService = new FileSaveService({
      filePath: this._state.filePath,
      autoSave: autoSave ?? true,
      autoSaveDelay: (autoSaveInterval ?? 5) * 1000,
      onStatusChange: (status) => {
        this._updateSaveStatusIndicator(status);
      },
      onSave: () => {
        logger.debug('File saved successfully');
      },
    });

    // Set initial content as last saved
    this._fileSaveService.setLastSavedContent(this._currentContent);
  }

  /**
   * Initialize save status indicator
   */
  private _initSaveStatusIndicator(): void {
    const toolbarContainer = document.getElementById('save-state-container');
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
   * Initialize find/replace panel
   */
  private _initFindReplacePanel(): void {
    const mainContainer = document.getElementById('main-container');
    if (!mainContainer) return;

    this._findReplacePanel = new FindReplacePanel({
      container: mainContainer,
      i18n: this._i18n,
      getContent: () => this._currentContent,
      setContent: (value: string) => {
        this._currentContent = value;
        this._editor?.setValue(value);
      },
    });
  }

  /**
   * Initialize TOC (Table of Contents) service
   */
  private _initTocService(): void {
    const tocNav = document.getElementById('toc-nav');
    if (!tocNav) {
      logger.warn('TOC nav container not found');
      return;
    }

    this._tocService = new TocService({
      container: tocNav,
      scrollTarget: () => {
        // In preview mode, the scrollable element is the preview-container
        // In split mode, it's also the preview-container
        return document.getElementById('preview-container');
      },
      onHeadingClick: (item) => {
        this._jumpEditorToHeading(item.id, item.text, item.level);
      },
      i18n: this._i18n,
    });

    logger.debug('TOC service initialized');
  }

  /**
   * Initialize sync scroll service for split mode
   */
  private _initSyncScrollService(): void {
    this._syncScrollService = new SyncScrollService({
      getEditorScrollContainer: () => {
        // Return the Vditor content scrollable element
        const vditorEditor = document.getElementById('vditor-editor');
        if (!vditorEditor) return null;
        // In sv mode, the scrollable element is .vditor-sv
        return vditorEditor.querySelector('.vditor-sv') as HTMLElement | null;
      },
      getPreviewScrollContainer: () => {
        return document.getElementById('preview-container');
      },
      enabled: false, // Initially disabled, will be enabled when entering split mode
    });

    logger.debug('Sync scroll service initialized');
  }

  /**
   * Jump editor cursor to the heading matching the given id (preferred) or text/level.
   * Finds the heading in the editor DOM (IR mode) and places the cursor there.
   */
  private _jumpEditorToHeading(headingId: string, headingText: string, _headingLevel: number): void {
    const mode = this._modeService.getCurrentMode();

    // Only jump cursor in edit or split mode (where the editor is visible)
    if (mode === 'preview') return;

    const editorContainer = document.getElementById('vditor-editor');
    if (!editorContainer) return;

    // In Vditor IR mode, headings are rendered as actual DOM elements
    // Find the heading node in the editor content area
    const contentArea = editorContainer.querySelector('.vditor-ir') ||
                        editorContainer.querySelector('.vditor-sv') ||
                        editorContainer.querySelector('.vditor-wysiwyg');
    if (!contentArea) {
      logger.warn('TOC: No editor content area found');
      return;
    }

    // Search for heading elements in the editor
    const headings = contentArea.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let targetHeading: HTMLElement | null = null;

    // In Vditor IR mode, heading textContent includes "# " prefix markers
    // We need flexible matching: strip all leading #/space combinations
    const normalizeText = (text: string): string => {
      return text
        .replace(/^#{1,6}\s*/, '')  // strip leading # markers
        .replace(/\s+/g, ' ')       // normalize whitespace
        .trim();
    };

    // 1. Try ID-first lookup (most reliable for duplicate headings)
    targetHeading = contentArea.querySelector(`#${CSS.escape(headingId)}`) as HTMLElement | null;

    // 2. Fallback to text matching if ID not found
    if (!targetHeading) {
      const targetNormalized = normalizeText(headingText);

      for (const h of headings) {
        const hNormalized = normalizeText(h.textContent || '');
        if (hNormalized === targetNormalized) {
          targetHeading = h as HTMLElement;
          break;
        }
      }

      // Fallback: partial/includes match
      if (!targetHeading) {
        for (const h of headings) {
          const hNormalized = normalizeText(h.textContent || '');
          if (hNormalized.includes(targetNormalized) || targetNormalized.includes(hNormalized)) {
            targetHeading = h as HTMLElement;
            break;
          }
        }
      }
    }

    if (!targetHeading) {
      logger.warn('TOC: Heading not found in editor:', headingText,
        'Available headings in editor:', Array.from(headings).map(h => normalizeText(h.textContent || '')));
      return;
    }

    // Find the actual scrollable container
    // We walk up from the heading to find the first element that is scrollable
    let scrollable = this._findScrollableAncestor(targetHeading);
    
    // Fallback if no scrollable parent found (unlikely in Vditor but for safety)
    if (!scrollable) {
      scrollable = editorContainer.querySelector('.vditor-content') as HTMLElement || editorContainer;
    }

    // Calculate scroll offset using getBoundingClientRect for accuracy
    const headingRect = targetHeading.getBoundingClientRect();
    const containerRect = scrollable.getBoundingClientRect();
    const scrollOffset = headingRect.top - containerRect.top + scrollable.scrollTop;

    logger.debug('TOC: Scrolling to heading', {
      text: headingText,
      container: scrollable.className,
      offset: scrollOffset
    });

    // Scroll to place heading at the very top
    scrollable.scrollTo({ top: scrollOffset, behavior: 'smooth' });

    // Place cursor at the heading — find a suitable text node
    const textNode = this._findFirstTextNode(targetHeading);
    if (textNode) {
      // Use setTimeout to ensure scroll completes before cursor placement
      setTimeout(() => {
        try {
          const range = document.createRange();
          range.setStart(textNode, 0);
          range.collapse(true);

          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }

          // Focus the editor to make cursor visible
          this._editor?.focus();
        } catch (e) {
          logger.error('TOC: Failed to set selection', e);
        }
      }, 100);
    } else {
      this._editor?.focus();
    }
  }

  /**
   * Find the nearest scrollable ancestor
   */
  private _findScrollableAncestor(element: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = element.parentElement;
    while (el && el.id !== 'app') {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  /**
   * Find the first text node within an element (skipping Vditor marker spans).
   */
  private _findFirstTextNode(element: HTMLElement): Text | null {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent || '';
          if (!text.trim()) return NodeFilter.FILTER_SKIP;
          const parent = node.parentElement;
          if (parent?.classList.contains('vditor-ir__marker')) return NodeFilter.FILTER_SKIP;
          if (parent?.classList.contains('vditor-ir__marker--heading')) return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );
    return walker.nextNode() as Text | null;
  }

  /**
   * Initialize menu service for native menu events
   */
  private _initMenuService(): void {
    this._menuService = new MenuService({
      onNewFile: () => this._handleNewFile(),
      onOpenFile: () => void this._handleOpenFile(),
      onSave: () => void this._manualSave(),
      onSaveAs: () => void this._handleSaveAs(),
      onExit: () => void this._handleExit(),
      onFind: () => this._handleFind(),
      onPreferences: () => this._handlePreferences(),
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
    void this._updateMenuLabels();
  }

  /**
   * Handle new file from menu
   */
  private _handleNewFile(): void {
    // Clear current content
    this._currentContent = '';
    this._editor?.setValue('');
    this._state.filePath = 'document.md';
    this._hasOpenedFile = false;
    this._fileSaveService?.setLastSavedContent('');
    this._saveState();
    logger.debug('New file created');
  }

  /**
   * Handle open file from menu
   */
  private async _handleOpenFile(): Promise<void> {
    try {
      // Only check for unsaved changes if user has previously opened a file
      if (this._hasOpenedFile && this._fileSaveService?.hasUnsavedChanges(this._currentContent)) {
        const confirmed = confirm(this._i18n.t('confirm.discardChanges') ?? '有未保存的更改，是否继续？');
        if (!confirmed) return;
      }

      // Call backend to open file dialog
      const result = await invoke<{ path: string | null; canceled: boolean }>('open_file_dialog');

      if (result.canceled || !result.path) {
        logger.debug('Open file dialog canceled');
        return;
      }

      // Read file content
      const fileResult = await invoke<{ success: boolean; content: string | null; error: string | null }>(
        'read_file',
        { path: result.path }
      );

      if (!fileResult.success || fileResult.content === null) {
        logger.error('Failed to read file:', fileResult.error);
        alert(this._i18n.t('error.readFile') ?? '读取文件失败');
        return;
      }

      // Mark that user has opened a file
      this._hasOpenedFile = true;

      // Update current content
      this._currentContent = fileResult.content;
      this._state.filePath = result.path;
      this._saveState();

      // Update editor if initialized, otherwise it will load content on init
      if (this._editor?.isInitialized()) {
        this._editor.setValue(fileResult.content);
      }

      // Also update preview if in preview or split mode
      void this._renderPreview(fileResult.content);

      // Update file save service with new path
      this._fileSaveService?.updateConfig({ filePath: result.path });
      this._fileSaveService?.setLastSavedContent(fileResult.content);

      logger.info('File opened:', result.path);
    } catch (error) {
      logger.error('Error opening file:', error);
      alert(this._i18n.t('error.openFile') ?? '打开文件失败');
    }
  }

  /**
   * Handle save as from menu
   */
  private async _handleSaveAs(): Promise<void> {
    try {
      // Get default filename from current path
      const defaultName = this._state.filePath.split('/').pop()?.split('\\').pop() ?? 'document.md';

      // Call backend to open save file dialog
      const result = await invoke<{ path: string | null; canceled: boolean }>(
        'save_file_dialog',
        { defaultName }
      );

      if (result.canceled || !result.path) {
        logger.debug('Save as dialog canceled');
        return;
      }

      // Write content to selected path
      const writeResult = await invoke<{ success: boolean; error: string | null }>(
        'write_file',
        { path: result.path, content: this._currentContent }
      );

      if (!writeResult.success) {
        logger.error('Failed to save file:', writeResult.error);
        alert(this._i18n.t('error.saveFile') ?? '保存文件失败');
        return;
      }

      // Update state with new path
      this._state.filePath = result.path;
      this._saveState();

      // Update file save service with new path
      this._fileSaveService?.updateConfig({ filePath: result.path });
      this._fileSaveService?.setLastSavedContent(this._currentContent);

      logger.info('File saved as:', result.path);
    } catch (error) {
      logger.error('Error saving file:', error);
      alert(this._i18n.t('error.saveFile') ?? '保存文件失败');
    }
  }

  /**
   * Handle exit from menu
   */
  private async _handleExit(): Promise<void> {
    // Check for unsaved changes
    if (this._fileSaveService?.hasUnsavedChanges(this._currentContent)) {
      const confirmed = confirm(this._i18n.t('confirm.unsavedChanges') ?? '有未保存的更改，确定要退出吗？');
      if (!confirmed) return;
    }

    // Flush any pending saves
    await this._fileSaveService?.flush();

    // Save state
    this._saveState();

    logger.debug('Exit requested');

    // Call backend to exit application
    try {
      await invoke('exit_app');
    } catch (error) {
      logger.error('Error exiting app:', error);
    }
  }

  /**
   * Handle find from menu
   */
  private _handleFind(): void {
    this._findReplacePanel?.toggle();
  }

  /**
   * Handle preferences from menu
   */
  private _handlePreferences(): void {
    this._preferencesPanel?.toggle();
    logger.debug('Preferences panel toggled');
  }

  /**
   * Handle zoom in
   */
  private _handleZoomIn(): void {
    const currentZoom = parseFloat(document.body.style.zoom || '1');
    const newZoom = Math.min(currentZoom + 0.1, 2);
    document.body.style.zoom = String(newZoom);
    logger.debug('Zoom in:', newZoom);
  }

  /**
   * Handle zoom out
   */
  private _handleZoomOut(): void {
    const currentZoom = parseFloat(document.body.style.zoom || '1');
    const newZoom = Math.max(currentZoom - 0.1, 0.5);
    document.body.style.zoom = String(newZoom);
    logger.debug('Zoom out:', newZoom);
  }

  /**
   * Handle reset zoom
   */
  private _handleResetZoom(): void {
    document.body.style.zoom = '1';
    logger.debug('Zoom reset');
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

      // Ctrl+F / Cmd+F for find
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
        e.preventDefault();
        this._findReplacePanel?.toggle();
        return;
      }

      // Ctrl+H / Cmd+H for find & replace
      if ((e.ctrlKey || e.metaKey) && e.key === 'h' && !e.shiftKey) {
        e.preventDefault();
        this._findReplacePanel?.toggle(true);
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
      logger.error('Manual save failed');
    }
  }

  /**
   * Load content from storage or default
   */
  private async _loadContent(): Promise<void> {
    // Try to load from localStorage first
    const savedContent = localStorage.getItem(STORAGE_KEYS.content);
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
   * Update preview content with debounce
   */
  private _updatePreview(content: string): void {
    // Clear existing timeout
    if (this._previewUpdateTimeout) {
      clearTimeout(this._previewUpdateTimeout);
    }

    // Debounce preview update
    this._previewUpdateTimeout = setTimeout(() => {
      this._renderPreview(content);
    }, TIMING_CONFIG.previewDebounceMs);
  }

  /**
   * Render markdown to preview container using main project's rendering system
   */
  private async _renderPreview(content: string): Promise<void> {
    const previewContainer = document.getElementById('markdown-content');
    if (!previewContainer) return;

    // Ensure platform and renderer are available
    if (!this._platform || !this._pluginRenderer) {
      logger.warn('Platform or renderer not initialized');
      previewContainer.textContent = content;
      return;
    }

    try {
      // Create task manager for async rendering
      const taskManager = new AsyncTaskManager((key: string) => 
        this._i18n.translate(key)
      );

      // Create translate function for main project
      const translate = (key: string) => 
        this._i18n.translate(key);

      // Set file key for scroll persistence
      setCurrentFileKey(this._state.filePath);

      // Use main project's render flow
      await renderMarkdownFlow({
        markdown: content,
        container: previewContainer,
        fileChanged: true,
        forceRender: false,
        zoomLevel: 1,
        scrollController: null,
        renderer: this._pluginRenderer!,
        translate,
        platform: this._platform!,
        currentTaskManagerRef: { current: taskManager },
        onHeadings: () => {
          // Update TOC with extracted headings
          if (this._tocService) {
            this._tocService.forceUpdate(content);
          }
        },
      });

      // Add visual marker for debugging (can be removed in production)
      previewContainer.setAttribute('data-renderer', 'main-project');
      logger.success('Preview rendered using MAIN PROJECT rendering system (data-renderer="main-project")');
    } catch (error) {
      logger.failure('Failed to render preview with main project renderer:', error);
      
      // Fallback to Vditor rendering on error
      if (typeof window.Vditor !== 'undefined') {
        try {
          const html = await window.Vditor.md2html(content, {
            theme: this._state.theme === 'dark' ? 'dark' : 'classic',
          });
          // Sanitize HTML with DOMPurify before assignment to prevent XSS
          const sanitizedHtml = DOMPurify.sanitize(html);
          previewContainer.innerHTML = sanitizedHtml;

          // Render diagrams using Vditor
          const cdn = VDITOR_CONFIG.cdnUrl;
          window.Vditor.mermaidRender(previewContainer, cdn);
          window.Vditor.flowchartRender(previewContainer, cdn);
          window.Vditor.graphvizRender(previewContainer, cdn);
          window.Vditor.chartRender(previewContainer, cdn);
          window.Vditor.mathRender(previewContainer, cdn);
          window.Vditor.highlightRender({ enable: true, lineNumber: false }, previewContainer, cdn);

          previewContainer.setAttribute('data-renderer', 'vditor-fallback');
          this._tocService?.forceUpdate(content);
          logger.fallback('Fallback to Vditor rendering (data-renderer="vditor-fallback")');
        } catch (fallbackError) {
          logger.error('Vditor rendering also failed:', fallbackError);
          previewContainer.textContent = content;
        }
      } else {
        previewContainer.textContent = content;
      }
    }
  }

  /**
   * Initialize mode change handling
   */
  private _initModeHandling(): void {
    // Subscribe to mode changes
    this._modeService.onModeChange((newMode, previousMode) => {
      logger.debug(`Mode changed: ${previousMode} -> ${newMode}`);
      void this._applyMode(newMode);
      this._saveState();
    });
  }

  /**
   * Apply mode to UI
   */
  private async _applyMode(mode: EditorMode): Promise<void> {
    // Set data-mode attribute on app container for CSS targeting
    this._appContainer?.setAttribute('data-mode', mode);

    // Save scroll position before mode change
    if (mode !== 'preview') {
      this._saveScrollPosition();
    }

    // Handle editor visibility
    const editorContainer = document.getElementById('editor-container');
    const previewContainer = document.getElementById('preview-container');
    const previewToolbarContainer = document.getElementById('preview-toolbar-container');
    const editToolbarContainer = document.getElementById('edit-toolbar-container');

    if (!editorContainer || !previewContainer) {
      logger.warn('Editor or preview container not found');
      return;
    }

    switch (mode) {
      case 'preview':
        // Preview mode: hide editor, show preview only
        editorContainer.style.display = 'none';
        previewContainer.style.display = 'flex';
        previewContainer.style.width = '100%';

        // Show preview toolbar, hide edit toolbar
        if (previewToolbarContainer) previewToolbarContainer.classList.remove('hidden');
        if (editToolbarContainer) editToolbarContainer.classList.add('hidden');

        // Disable sync scroll
        this._syncScrollService?.disable();

        // Render preview with current content
        await this._renderPreview(this._currentContent);
        // Restore scroll position
        this._restoreScrollPosition();
        break;

      case 'edit':
        // Edit mode: show editor only, hide preview
        editorContainer.style.display = 'flex';
        editorContainer.style.width = '100%';
        previewContainer.style.display = 'none';

        // Hide preview toolbar, show edit toolbar
        if (previewToolbarContainer) previewToolbarContainer.classList.add('hidden');
        if (editToolbarContainer) editToolbarContainer.classList.remove('hidden');

        // Disable sync scroll
        this._syncScrollService?.disable();

        // Initialize editor in ir mode
        await this._initEditorIfNeeded('ir');

        break;

      case 'split':
        // Split mode: editor on left (source code), preview on right
        editorContainer.style.display = 'flex';
        editorContainer.style.width = ''; // CSS sets 100%
        previewContainer.style.display = 'flex';
        previewContainer.style.width = ''; // CSS uses absolute positioning

        // Hide preview toolbar, show edit toolbar
        if (previewToolbarContainer) previewToolbarContainer.classList.add('hidden');
        if (editToolbarContainer) editToolbarContainer.classList.remove('hidden');

        // Initialize editor in sv mode (source code)
        await this._initEditorIfNeeded('sv');

        // Render preview with current content
        await this._renderPreview(this._currentContent);

        // Enable sync scroll after preview is rendered
        this._syncScrollService?.enable();
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
      
      // Update css variable for split percentage
      const splitPercent = (1 - clampedRatio) * 100;
      document.documentElement.style.setProperty('--vditor-split-percent', `${splitPercent}%`);
      
      // Clear specific width overrides to let CSS structure work with variables
      editorContainer.style.width = '';
      previewContainer.style.width = '';
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
      const saved = localStorage.getItem(STORAGE_KEYS.appState);
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
      localStorage.setItem(STORAGE_KEYS.appState, JSON.stringify(this._state));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Setup listeners for auto-save preference changes
   */
  private _setupAutoSavePreferenceListeners(): void {
    // Listen for auto-save enabled/disabled changes
    this._preferences.onChange('general.autoSave', (_key, newValue) => {
      const enabled = newValue as boolean;
      this._fileSaveService?.updateConfig({ autoSave: enabled });
      logger.debug(`Auto-save ${enabled ? 'enabled' : 'disabled'}`);
    });

    // Listen for auto-save interval changes
    this._preferences.onChange('general.autoSaveInterval', (_key, newValue) => {
      const intervalSeconds = newValue as number;
      this._fileSaveService?.updateConfig({ autoSaveDelay: intervalSeconds * 1000 });
      logger.debug(`Auto-save interval changed to ${intervalSeconds}s`);
    });
  }

  /**
   * Setup listeners for editor preference changes (US-007)
   */
  private _setupEditorPreferenceListeners(): void {
    // Font size changes
    this._preferences.onChange('editor.fontSize', (_key, newValue) => {
      const fontSize = newValue as number;
      this._editor?.setFontSize(fontSize);
      logger.debug(`Editor font size changed to ${fontSize}px`);
    });

    // Font family changes
    this._preferences.onChange('editor.fontFamily', (_key, newValue) => {
      const fontFamily = newValue as string;
      this._editor?.setFontFamily(fontFamily);
      logger.debug(`Editor font family changed to ${fontFamily}`);
    });

    // Line height changes
    this._preferences.onChange('editor.lineHeight', (_key, newValue) => {
      const lineHeight = newValue as number;
      this._editor?.setLineHeight(lineHeight);
      logger.debug(`Editor line height changed to ${lineHeight}`);
    });

    // Tab width changes
    this._preferences.onChange('editor.tabWidth', (_key, newValue) => {
      const tabWidth = newValue as number;
      this._editor?.setTabWidth(tabWidth);
      logger.debug(`Editor tab width changed to ${tabWidth}`);
    });

    // Show line numbers changes
    this._preferences.onChange('editor.showLineNumbers', (_key, newValue) => {
      const showLineNumbers = newValue as boolean;
      this._editor?.setShowLineNumbers(showLineNumbers);
      logger.debug(`Editor line numbers ${showLineNumbers ? 'enabled' : 'disabled'}`);
    });
  }

  /**
   * Apply initial editor settings from preferences (US-007)
   */
  private _applyInitialEditorSettings(): void {
    const fontSize = this._preferences.get<number>('editor.fontSize');
    const fontFamily = this._preferences.get<string>('editor.fontFamily');
    const lineHeight = this._preferences.get<number>('editor.lineHeight');
    const tabWidth = this._preferences.get<number>('editor.tabWidth');
    const showLineNumbers = this._preferences.get<boolean>('editor.showLineNumbers');

    this._editor?.applyEditorSettings({
      fontSize: fontSize ?? FONT_CONFIG.defaultSize,
      fontFamily: fontFamily ?? FONT_CONFIG.defaultFamily,
      lineHeight: lineHeight ?? FONT_CONFIG.defaultLineHeight,
      tabWidth: tabWidth ?? FONT_CONFIG.defaultTabWidth,
      showLineNumbers: showLineNumbers ?? true,
    });

    logger.debug('Initial editor settings applied');
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
   * Handle theme change from ThemeService
   */
  private _handleThemeChange(theme: 'light' | 'dark'): void {
    this._state.theme = theme;
    this._editor?.setTheme(theme);
    
    // Update renderer theme config for diagram rendering
    if (this._platform?.renderer) {
      const isDark = theme === 'dark';
      this._platform.renderer.setThemeConfig({
        fontFamily: FONT_CONFIG.defaultFamily,
        background: isDark ? THEME_COLORS.dark.background : THEME_COLORS.light.background,
        foreground: isDark ? THEME_COLORS.dark.foreground : THEME_COLORS.light.foreground,
        diagramStyle: 'normal'
      });
      logger.debug('Renderer theme config updated for', theme, 'mode');
    }
    
    // Re-render preview with new theme
    void this._renderPreview(this._currentContent);
    this._saveState();
  }

  /**
   * Set theme mode (light/dark/auto)
   */
  setThemeMode(mode: 'light' | 'dark' | 'auto'): void {
    this._themeService.setThemeMode(mode);
  }

  /**
   * Get current effective theme
   */
  getCurrentTheme(): 'light' | 'dark' {
    return this._themeService.getCurrentTheme();
  }

  /**
   * Get current device preview mode
   */
  getCurrentDevice(): 'desktop' | 'tablet' | 'mobile' {
    return this._currentDevice;
  }

  /**
   * Set language
   */
  setLanguage(lang: Language): void {
    this._i18n.setLanguage(lang);
    this._editToolbar?.updateLabels();
    this._previewToolbar?.updateLabels();
    this._updateSaveStatusIndicator(this._fileSaveService?.getStatus() ?? 'idle');
    void this._updateMenuLabels();
  }

  /**
   * Toggle language between English and Chinese
   */
  toggleLanguage(): void {
    this._i18n.toggleLanguage();
    this._editToolbar?.updateLabels();
    this._previewToolbar?.updateLabels();
    this._updateSaveStatusIndicator(this._fileSaveService?.getStatus() ?? 'idle');
    void this._updateMenuLabels();
  }

  private async _updateMenuLabels(): Promise<void> {
    try {
      const labels: Record<string, string> = {
        file: this._i18n.t('menu.file'),
        edit: this._i18n.t('menu.edit'),
        view: this._i18n.t('menu.view'),
        help: this._i18n.t('menu.help'),
        'file:new': this._i18n.t('menu.newFile'),
        'file:open': this._i18n.t('menu.openFile'),
        'file:save': this._i18n.t('menu.save'),
        'file:save-as': this._i18n.t('menu.saveAs'),
        'file:exit': this._i18n.t('menu.exit'),
        'edit:find': this._i18n.t('menu.find'),
        'view:edit-mode': this._i18n.t('menu.editMode'),
        'view:preview-mode': this._i18n.t('menu.previewMode'),
        'view:split-mode': this._i18n.t('menu.splitMode'),
        'view:zoom-in': this._i18n.t('menu.zoomIn'),
        'view:zoom-out': this._i18n.t('menu.zoomOut'),
        'view:reset-zoom': this._i18n.t('menu.resetZoom'),
        'help:about': this._i18n.t('menu.about'),
        'help:docs': this._i18n.t('menu.docs'),
        'help:shortcuts': this._i18n.t('menu.shortcuts'),
      };
      await invoke('update_menu_labels', { labels });
    } catch (error) {
      logger.error('Failed to update menu labels:', error);
    }
  }

  /**
   * Initialize editor if not already initialized
   * @param targetMode - Target mode to ensure ('sv', 'ir', or 'wysiwyg'). If different from current, editor will be recreated.
   */
  private async _initEditorIfNeeded(targetMode?: 'sv' | 'ir' | 'wysiwyg'): Promise<void> {
    if (!this._editor) {
      this._initEditor();
    }

    // If editor is already initialized and we need a specific mode, check if mode switch is needed
    if (this._editor?.isInitialized() && targetMode) {
      const currentMode = this._editor.getMode();
      if (currentMode !== targetMode) {
        // Mode switch needed - setMode will destroy and recreate
        await this._editor.setMode(targetMode);
      }
    } else if (this._editor && !this._editor.isInitialized()) {
      // Set target mode before first initialization
      if (targetMode) {
        this._editor.setMode(targetMode); // This sets config.mode since editor not initialized
      }
      await this._editor.init();
      // Initialize edit toolbar after Vditor is ready
      this._initEditToolbar();
    }

    // Always ensure content is set when entering edit mode
    // This fixes the issue where content loaded before editor initialization
    // would not be displayed
    if (this._editor?.isInitialized() && this._currentContent) {
      this._editor.setValue(this._currentContent);
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

    // Clean up platform resources
    this._pluginRenderer = null;
    this._platform = null;

    this._editToolbar?.destroy();
    this._editToolbar = null;
    this._previewToolbar?.destroy();
    this._previewToolbar = null;
    this._editor?.destroy();
    this._editor = null;
    this._fileSaveService?.dispose();
    this._fileSaveService = null;
    this._menuService?.dispose();
    this._menuService = null;
    this._preferencesPanel?.destroy();
    this._preferencesPanel = null;
    this._findReplacePanel?.destroy();
    this._findReplacePanel = null;
    this._tocService?.destroy();
    this._tocService = null;
    this._themeService?.dispose();
    (this as unknown as { _themeService: null })._themeService = null;
    
    logger.debug('Application destroyed');
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
      logger.error('Failed to initialize app:', error);
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
