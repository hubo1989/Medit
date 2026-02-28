/**
 * VditorEditor - Core wrapper class for Vditor markdown editor
 * Provides unified initialization and content management interface
 */

import type { VditorOptions, VditorInstance } from '../types/vditor.js';
import { VDITOR_CONFIG } from '../utils/config.js';

export type EditorTheme = 'light' | 'dark';

export interface VditorEditorConfig {
  /** Container element or selector */
  container: string | HTMLDivElement;
  /** Editor theme */
  theme?: EditorTheme;
  /** Initial content */
  initialValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Editor mode */
  mode?: 'sv' | 'ir' | 'wysiwyg';
  /** Custom Vditor options to override defaults */
  customOptions?: Partial<VditorOptions>;
  /** Callback when content changes */
  onChange?: (value: string) => void;
  /** Callback when editor is focused */
  onFocus?: (value: string) => void;
  /** Callback when editor loses focus */
  onBlur?: (value: string) => void;
}

export class VditorEditor {
  private _instance: VditorInstance | null = null;
  private _config: VditorEditorConfig;
  private _container: HTMLDivElement | null = null;

  constructor(config: VditorEditorConfig) {
    this._config = config;
  }

  /**
   * Initialize the Vditor editor
   * Must be called after DOM is ready
   */
  async init(): Promise<void> {
    if (this._instance) {
      return;
    }

    this._container = this._resolveContainer();
    if (!this._container) {
      throw new Error('VditorEditor: Container element not found');
    }

    // Ensure container has an ID for Vditor
    if (!this._container.id) {
      this._container.id = `vditor-${Date.now()}`;
    }

    // Store container in local variable for closure
    const container = this._container;

    // Wait for Vditor to be available
    await this._waitForVditor();

    // Create a promise that resolves when Vditor is fully initialized
    return new Promise((resolve, reject) => {
      try {
        const options = this._buildOptions();
        const originalAfter = options.after;
        options.after = () => {
          // Explicitly set theme after Vditor is fully initialized
          const { theme = 'light' } = this._config;
          const vditorTheme = theme === 'dark' ? 'dark' : 'classic';
          const contentTheme = theme === 'dark' ? 'dark' : 'light';
          const codeTheme = theme === 'dark' ? 'native' : 'github';
          this._instance?.setTheme(vditorTheme, contentTheme, codeTheme);
          originalAfter?.();
          resolve();
        };
        this._instance = new window.Vditor(container, options);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Destroy the editor instance and clean up
   */
  destroy(): void {
    if (this._instance) {
      this._instance.destroy();
      this._instance = null;
    }
    this._container = null;
  }

  /**
   * Get current markdown value
   */
  getValue(): string {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    return this._instance.getValue();
  }

  /**
   * Set markdown value
   */
  setValue(value: string): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    this._instance.setValue(value);
  }

  /**
   * Focus the editor
   */
  focus(): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    this._instance.focus();
  }

  /**
   * Blur the editor
   */
  blur(): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    this._instance.blur();
  }

  /**
   * Get editor instance for advanced operations
   */
  getInstance(): VditorInstance | null {
    return this._instance;
  }

  /**
   * Check if editor is fully initialized
   */
  isInitialized(): boolean {
    // Check if instance exists and has the getCurrentMode method (available after full init)
    return this._instance !== null && typeof this._instance.getCurrentMode === 'function';
  }

  /**
   * Update editor theme
   */
  setTheme(theme: EditorTheme): void {
    if (!this.isInitialized()) {
      throw new Error('VditorEditor: Editor not fully initialized');
    }
    const vditorTheme = theme === 'dark' ? 'dark' : 'classic';
    const contentTheme = theme === 'dark' ? 'dark' : 'light';
    const codeTheme = theme === 'dark' ? 'native' : 'github';
    this._instance!.setTheme(vditorTheme, contentTheme, codeTheme);
  }

  /**
   * Update editor font size
   */
  setFontSize(size: number): void {
    if (!this._container) return;
    this._container.style.setProperty('--vditor-font-size', `${size}px`);
    // Apply to Vditor content area
    const contentElement = this._container.querySelector('.vditor-content') as HTMLElement | null;
    if (contentElement) {
      contentElement.style.fontSize = `${size}px`;
    }
    // Apply to textarea
    const textarea = this._container.querySelector('textarea') as HTMLElement | null;
    if (textarea) {
      textarea.style.fontSize = `${size}px`;
    }
    // Apply to preview
    const previewElement = this._container.querySelector('.vditor-preview') as HTMLElement | null;
    if (previewElement) {
      previewElement.style.fontSize = `${size}px`;
    }
  }

  /**
   * Update editor font family
   */
  setFontFamily(family: string): void {
    if (!this._container) return;
    const fontMap: Record<string, string> = {
      system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      monospace: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      serif: 'Georgia, "Times New Roman", serif',
      'sans-serif': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };
    const fontFamily = fontMap[family] || fontMap.system;
    this._container.style.setProperty('--vditor-font-family', fontFamily);
    // Apply to content area
    const contentElement = this._container.querySelector('.vditor-content') as HTMLElement | null;
    if (contentElement) {
      contentElement.style.fontFamily = fontFamily;
    }
    // Apply to textarea
    const textarea = this._container.querySelector('textarea') as HTMLElement | null;
    if (textarea) {
      textarea.style.fontFamily = fontFamily;
    }
    // Apply to preview
    const previewElement = this._container.querySelector('.vditor-preview') as HTMLElement | null;
    if (previewElement) {
      previewElement.style.fontFamily = fontFamily;
    }
  }

  /**
   * Update editor line height
   */
  setLineHeight(lineHeight: number): void {
    if (!this._container) return;
    this._container.style.setProperty('--vditor-line-height', String(lineHeight));
    // Apply to content area
    const contentElement = this._container.querySelector('.vditor-content') as HTMLElement | null;
    if (contentElement) {
      contentElement.style.lineHeight = String(lineHeight);
    }
    // Apply to textarea
    const textarea = this._container.querySelector('textarea') as HTMLElement | null;
    if (textarea) {
      textarea.style.lineHeight = String(lineHeight);
    }
    // Apply to preview
    const previewElement = this._container.querySelector('.vditor-preview') as HTMLElement | null;
    if (previewElement) {
      previewElement.style.lineHeight = String(lineHeight);
    }
  }

  /**
   * Update tab width
   */
  setTabWidth(width: number): void {
    if (!this._container) return;
    const tabSize = width === 2 ? 2 : 4;
    this._container.style.setProperty('--vditor-tab-width', `${tabSize}ch`);
    // Apply to textarea
    const textarea = this._container.querySelector('textarea') as HTMLElement | null;
    if (textarea) {
      textarea.style.tabSize = String(tabSize);
    }
  }

  /**
   * Toggle line numbers display
   */
  setShowLineNumbers(show: boolean): void {
    if (!this._container) return;
    if (show) {
      this._container.classList.remove('vditor-hide-line-numbers');
    } else {
      this._container.classList.add('vditor-hide-line-numbers');
    }
    // Apply to gutter/line number elements
    const gutterElements = this._container.querySelectorAll('.vditor-gutter, .vditor-linenumber') as NodeListOf<HTMLElement>;
    for (const el of gutterElements) {
      el.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * Apply all editor settings at once
   */
  applyEditorSettings(settings: {
    fontSize?: number;
    fontFamily?: string;
    lineHeight?: number;
    tabWidth?: number;
    showLineNumbers?: boolean;
  }): void {
    if (settings.fontSize !== undefined) {
      this.setFontSize(settings.fontSize);
    }
    if (settings.fontFamily !== undefined) {
      this.setFontFamily(settings.fontFamily);
    }
    if (settings.lineHeight !== undefined) {
      this.setLineHeight(settings.lineHeight);
    }
    if (settings.tabWidth !== undefined) {
      this.setTabWidth(settings.tabWidth);
    }
    if (settings.showLineNumbers !== undefined) {
      this.setShowLineNumbers(settings.showLineNumbers);
    }
  }

  /**
   * Insert text at cursor position
   */
  insertValue(value: string, render = true): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    this._instance.insertValue(value, render);
  }

  /**
   * Get selected text
   */
  getSelection(): string {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    return this._instance.getSelection();
  }

  /**
   * Replace selected text
   */
  replaceSelection(value: string): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    this._instance.replaceSelection(value);
  }

  /**
   * Get current editor mode
   */
  getMode(): 'sv' | 'ir' | 'wysiwyg' {
    if (!this.isInitialized()) {
      return this._config.mode || 'ir';
    }
    return this._instance!.getCurrentMode();
  }

  /**
   * Switch editor mode (requires re-creation since Vditor 3.x doesn't have changeMode)
   */
  async setMode(mode: 'sv' | 'ir' | 'wysiwyg'): Promise<void> {
    // If not initialized yet, just update config
    if (!this._instance) {
      this._config.mode = mode;
      return;
    }

    const currentMode = this._instance.getCurrentMode();
    if (currentMode === mode) {
      return; // Already in target mode
    }

    // Save current content
    const content = this._instance.getValue();

    // Destroy current instance
    this._instance.destroy();
    this._instance = null;

    // Update config with new mode
    this._config.mode = mode;
    this._config.initialValue = content;

    // Re-create editor
    await this.init();
  }

  /**
   * Show Vditor toolbar
   */
  showToolbar(): void {
    if (!this._container) return;
    const toolbar = this._container.querySelector('.vditor-toolbar') as HTMLElement | null;
    if (toolbar) {
      toolbar.style.display = '';
    }
  }

  /**
   * Hide Vditor toolbar
   */
  hideToolbar(): void {
    if (!this._container) return;
    const toolbar = this._container.querySelector('.vditor-toolbar') as HTMLElement | null;
    if (toolbar) {
      toolbar.style.display = 'none';
    }
  }

  /**
   * Wrap selected text with prefix and suffix
   * If no selection, insert prefix + suffix and place cursor between them
   */
  wrapSelection(prefix: string, suffix: string): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    const selection = this._instance.getSelection();
    if (selection) {
      this._instance.replaceSelection(`${prefix}${selection}${suffix}`);
    } else {
      // No selection: insert prefix + suffix with cursor between
      this._instance.insertValue(`${prefix}${suffix}`);
      // Note: cursor positioning is handled by Vditor's insertValue behavior
    }
    this._instance.focus();
  }

  /**
   * Insert text at the beginning of the current line
   */
  insertAtLineStart(prefix: string): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }

    // Try to access the textarea directly for sv mode
    const textarea = this._container.querySelector('.vditor-sv textarea') as HTMLTextAreaElement | null;

    if (textarea) {
      // sv mode: use textarea selection
      const value = textarea.value;
      const cursorPos = textarea.selectionStart;

      // Find line start position
      let lineStart = 0;
      for (let i = cursorPos - 1; i >= 0; i--) {
        if (value[i] === '\n') {
          lineStart = i + 1;
          break;
        }
      }

      // Insert prefix at line start
      const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
      textarea.value = newValue;

      // Adjust cursor position
      const newCursorPos = cursorPos + prefix.length;
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;

      // Trigger input event to sync Vditor state
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // ir/wysiwyg mode: use Vditor's insertValue (less precise but works)
      // For these modes, inserting at cursor is acceptable
      this._instance.insertValue(prefix);
    }

    this._instance.focus();
  }

  /**
   * Insert a multi-line template at cursor position
   * If there's a selection, replaces it with the template
   */
  insertTemplate(template: string): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }

    const selection = this._instance.getSelection();

    if (selection) {
      // Replace selection with template
      this._instance.replaceSelection(template);
    } else {
      // Insert template at cursor
      this._instance.insertValue(template);
    }
    this._instance.focus();
  }

  /**
   * Toggle heading at current line
   * @param level - Heading level (1-6)
   */
  insertHeading(level: 1 | 2 | 3 | 4 | 5 | 6): void {
    const prefix = '#'.repeat(level) + ' ';
    this.insertAtLineStart(prefix);
  }

  /**
   * Insert code block with optional language
   */
  insertCodeBlock(language = ''): void {
    const template = `\`\`\`${language}\n// code here\n\`\`\``;
    this.insertTemplate(template);
  }

  /**
   * Insert blockquote prefix at current line
   */
  insertQuote(): void {
    this.insertAtLineStart('> ');
  }

  /**
   * Insert horizontal rule
   */
  insertHorizontalRule(): void {
    this.insertTemplate('\n---\n');
  }

  /**
   * Insert list item at current line
   * @param ordered - Whether to use ordered list
   */
  insertList(ordered = false): void {
    this.insertAtLineStart(ordered ? '1. ' : '- ');
  }

  /**
   * Insert task list item at current line
   */
  insertTaskList(): void {
    this.insertAtLineStart('- [ ] ');
  }

  /**
   * Insert link placeholder
   */
  insertLink(): void {
    this.wrapSelection('[', '](url)');
  }

  /**
   * Insert image placeholder
   */
  insertImage(): void {
    this.wrapSelection('![alt](', ')');
  }

  /**
   * Insert inline code wrapper
   */
  insertInlineCode(): void {
    this.wrapSelection('`', '`');
  }

  /**
   * Undo last action
   */
  undo(): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    this._instance.undo();
  }

  /**
   * Redo last undone action
   */
  redo(): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    this._instance.redo();
  }

  /**
   * Resolve container element from selector or element
   */
  private _resolveContainer(): HTMLDivElement | null {
    const { container } = this._config;

    if (typeof container === 'string') {
      const element = document.querySelector(container);
      return element as HTMLDivElement | null;
    }

    return container;
  }

  /**
   * Wait for Vditor to be loaded
   */
  private _waitForVditor(): Promise<void> {
    return new Promise((resolve, reject) => {
      const maxAttempts = 100;
      let attempts = 0;

      const checkVditor = (): void => {
        attempts++;

        if (typeof window.Vditor !== 'undefined') {
          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          reject(new Error('VditorEditor: Vditor library not loaded'));
          return;
        }

        setTimeout(checkVditor, 50);
      };

      checkVditor();
    });
  }

  /**
   * Build Vditor options from config
   */
  private _buildOptions(): VditorOptions {
    const { theme = 'light', initialValue = '', placeholder, mode = 'ir', customOptions = {}, onChange, onFocus, onBlur } = this._config;

    const vditorTheme = theme === 'dark' ? 'dark' : 'classic';
    const contentTheme = theme === 'dark' ? 'dark' : 'light';
    const codeTheme = theme === 'dark' ? 'native' : 'github';

    const defaultOptions: VditorOptions = {
      mode,
      theme: vditorTheme,
      icon: 'ant',
      placeholder,
      value: initialValue,
      cdn: VDITOR_CONFIG.cdnUrl,
      cache: {
        enable: false,
      },
      counter: {
        enable: true,
        type: 'markdown',
      },
      preview: {
        mode: 'editor', // Only show editor; preview is handled by our custom #preview-container
        theme: {
          current: contentTheme,
        },
        markdown: {
          toc: true,
          mark: true,
          footnotes: true,
          autoSpace: true,
          gfmAutoLink: true,
        },
      },
      toolbar: [
        'headings',
        'bold',
        'italic',
        'strike',
        '|',
        'line',
        'quote',
        'list',
        'ordered-list',
        'check',
        '|',
        'code',
        'inline-code',
        'link',
        'table',
        '|',
        'undo',
        'redo',
      ],
      toolbarConfig: {
        hide: false,
        pin: false,
      },
      input: onChange,
      focus: onFocus,
      blur: onBlur,
    };

    // Merge custom options (custom options take precedence)
    const options: VditorOptions = {
      ...defaultOptions,
      ...customOptions,
      // Deep merge for nested objects
      preview: {
        ...defaultOptions.preview,
        ...customOptions.preview,
        // Deep merge theme to preserve 'current' when external theme fields are provided
        theme: {
          ...defaultOptions.preview?.theme,
          ...customOptions.preview?.theme,
        },
      },
      counter: {
        ...defaultOptions.counter,
        ...customOptions.counter,
      },
      cache: {
        ...defaultOptions.cache,
        ...customOptions.cache,
      },
    };

    return options;
  }
}

export default VditorEditor;
