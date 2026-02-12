/**
 * VditorEditor - Core wrapper class for Vditor markdown editor
 * Provides unified initialization and content management interface
 */

import type { VditorOptions, VditorInstance } from '../types/vditor.js';

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

    // Wait for Vditor to be available
    await this._waitForVditor();

    const options = this._buildOptions();
    this._instance = new window.Vditor(this._container, options);
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
   * Check if editor is initialized
   */
  isInitialized(): boolean {
    return this._instance !== null;
  }

  /**
   * Update editor theme
   */
  setTheme(theme: EditorTheme): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    const vditorTheme = theme === 'dark' ? 'dark' : 'classic';
    this._instance.setTheme(vditorTheme);
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
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    return this._instance.getCurrentMode();
  }

  /**
   * Switch editor mode
   */
  setMode(mode: 'sv' | 'ir' | 'wysiwyg'): void {
    if (!this._instance) {
      throw new Error('VditorEditor: Editor not initialized');
    }
    this._instance.changeMode(mode);
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

    const defaultOptions: VditorOptions = {
      mode,
      theme: vditorTheme,
      icon: 'ant',
      placeholder,
      value: initialValue,
      cache: {
        enable: false,
      },
      counter: {
        enable: true,
        type: 'markdown',
      },
      preview: {
        mode: 'both',
        markdown: {
          toc: true,
          mark: true,
          footnotes: true,
          autoSpace: true,
          gfmAutoLink: true,
        },
      },
      toolbar: [
        'emoji',
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
        'upload',
        'link',
        'table',
        '|',
        'undo',
        'redo',
        '|',
        'fullscreen',
        'edit-mode',
        'outline',
        'preview',
      ],
      input: onChange,
      focus: onFocus,
      blur: onBlur,
    };

    // Merge custom options (custom options take precedence)
    return {
      ...defaultOptions,
      ...customOptions,
      // Deep merge for nested objects
      preview: {
        ...defaultOptions.preview,
        ...customOptions.preview,
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
  }
}

export default VditorEditor;
