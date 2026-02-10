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
    const { theme = 'light', initialValue = '', placeholder, mode = 'sv', customOptions = {}, onChange, onFocus, onBlur } = this._config;

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
