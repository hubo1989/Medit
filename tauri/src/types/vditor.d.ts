/**
 * Vditor Editor Type Definitions
 * @see https://github.com/Vanessa219/vditor
 */

export interface VditorOptions {
  /** Editor mode: sv (split view), ir (instant render), wysiwyg */
  mode?: 'sv' | 'ir' | 'wysiwyg';
  /** Placeholder text when empty */
  placeholder?: string;
  /** Theme: classic, dark */
  theme?: 'classic' | 'dark';
  /** Icon style: classic, ant, material */
  icon?: 'classic' | 'ant' | 'material';
  /** Editor height */
  height?: number | string;
  /** Editor width */
  width?: number | string;
  /** Min height */
  minHeight?: number;
  /** Whether to resize */
  resize?: {
    enable?: boolean;
    position?: 'top' | 'bottom';
  };
  /** Toolbar configuration */
  toolbar?: Array<string | VditorToolbarItem>;
  /** Toolbar config */
  toolbarConfig?: {
    hide?: boolean;
    pin?: boolean;
  };
  /** Counter config */
  counter?: {
    enable?: boolean;
    max?: number;
    type?: 'markdown' | 'text';
  };
  /** Cache config */
  cache?: {
    enable?: boolean;
    id?: string;
  };
  /** Preview config */
  preview?: VditorPreviewConfig;
  /** Upload config */
  upload?: VditorUploadConfig;
  /** Link config */
  link?: {
    isOpen?: boolean;
  };
  /** Image config */
  image?: {
    isPreview?: boolean;
  };
  /** Hint config */
  hint?: VditorHintConfig;
  /** Input callback */
  input?: (value: string) => void;
  /** Focus callback */
  focus?: (value: string) => void;
  /** Blur callback */
  blur?: (value: string) => void;
  /** ESC key callback */
  esc?: () => void;
  /** Ctrl+Enter callback */
  ctrlEnter?: (value: string) => void;
  /** Select callback */
  select?: (value: string) => void;
  /** After render callback */
  after?: () => void;
  /** Fullscreen change callback */
  fullscreen?: (isFullscreen: boolean) => void;
  /** Outline change callback */
  outline?: {
    enable?: boolean;
    position?: 'left' | 'right';
  };
  /** Undo delay */
  undoDelay?: number;
  /** Tab size */
  tab?: string;
  /** Whether to autofocus */
  autofocus?: boolean;
  /** Whether to auto space */
  autoSpace?: boolean;
  /** Whether to fix term typo */
  fixTermTypo?: boolean;
  /** Whether to auto complete brackets */
  autoCompleteBrackets?: boolean;
  /** Custom render */
  customRenders?: Array<{
    name: string;
    render: (element: HTMLElement) => void;
  }>;
  /** Code block languages */
  lang?: string;
  /** Typewriter mode */
  typewriterMode?: boolean;
  /** Debugger mode */
  debugger?: boolean;
  /** Value */
  value?: string;
  /** CDN URL */
  cdn?: string;
  /** Classes to add to editor */
  classes?: {
    preview?: string;
  };
  /** Lazy load image URL */
  lazyLoadImage?: string;
  /** Inline math digit */
  inlineMathDigit?: boolean;
}

export interface VditorToolbarItem {
  name: string;
  tip?: string;
  tipPosition?: 'n' | 'ne' | 'nw' | 's' | 'se' | 'sw' | 'w' | 'e';
  className?: string;
  icon?: string;
  click?: () => void;
  hotkey?: string;
}

export interface VditorPreviewConfig {
  mode?: 'both' | 'editor';
  /** Max width */
  maxWidth?: number;
  /** Delay in ms */
  delay?: number;
  /** Whether to show markdown outline */
  markdown?: {
    toc?: boolean;
    mark?: boolean;
    footnotes?: boolean;
    autoSpace?: boolean;
    gfmAutoLink?: boolean;
    lazyLoadImage?: string;
    paragraphBeginningSpace?: boolean;
    sanitize?: boolean;
    listStyle?: boolean;
    linkBase?: string;
    linkPrefix?: string;
  };
  /** Theme */
  theme?: {
    current?: string;
    path?: string;
    list?: Record<string, string>;
  };
  /** Actions */
  actions?: Array<string | {
    key: string;
    text: string;
    click: (key: string) => void;
  }>;
  /** Transform before show */
  transform?: (html: string) => string;
}

export interface VditorUploadConfig {
  url?: string;
  max?: number;
  linkToImgUrl?: string;
  accept?: string;
  multiple?: boolean;
  fieldName?: string;
  token?: string;
  headers?: Record<string, string>;
  filename?: (name: string) => string;
  validate?: (files: File[]) => string | true;
  handler?: (files: File[]) => Promise<string>;
  format?: (files: File[], responseText: string) => string;
  success?: (editor: HTMLDivElement, responseText: string) => void;
  error?: (msg: string) => void;
}

export interface VditorHintConfig {
  emoji?: Record<string, string> | { path: string; ext: string };
  emojiTail?: string;
  at?: (value: string) => Array<{ label: string; value: string }>;
  delay?: number;
}

export interface VditorInstance {
  /** Get current value */
  getValue(): string;
  /** Set value */
  setValue(value: string): void;
  /** Insert value at cursor */
  insertValue(value: string, render?: boolean): void;
  /** Delete current selection */
  deleteValue(): void;
  /** Get selection text */
  getSelection(): string;
  /** Set selection */
  setSelection(start: number, end: number): void;
  /** Replace selection */
  replaceSelection(value: string): void;
  /** Focus editor */
  focus(): void;
  /** Blur editor */
  blur(): void;
  /** Destroy editor */
  destroy(): void;
  /** Get HTML */
  getHTML(): string;
  /** Render preview */
  renderPreview(value?: string): void;
  /** Get cursor position */
  getCursorPosition(): {
    top: number;
    left: number;
  };
  /** Disable editor */
  disabled(): void;
  /** Enable editor */
  enable(): void;
  /** Check if disabled */
  isDisabled(): boolean;
  /** Toggle fullscreen */
  fullscreen(): void;
  /** Get current mode */
  getCurrentMode(): 'sv' | 'ir' | 'wysiwyg';
  /** Switch mode */
  changeMode(mode: 'sv' | 'ir' | 'wysiwyg', render?: boolean): void;
  /** Set theme */
  setTheme(theme: 'classic' | 'dark', contentTheme?: string, codeTheme?: string): void;
  /** Get outline */
  getOutline(): Array<{
    level: number;
    text: string;
  }>;
  /** Tip message */
  tip(text: string, time?: number): void;
  /** Set preview mode */
  setPreviewMode(mode: 'both' | 'editor'): void;
  /** Get preview mode */
  getPreviewMode(): 'both' | 'editor';
  /** Clear cache */
  clearCache(): void;
  /** Disable cache */
  disabledCache(): void;
  /** Enable cache */
  enableCache(): void;
  /** Undo */
  undo(): void;
  /** Redo */
  redo(): void;
  /** Clear undo stack */
  clearStack(): void;
  /** Update toolbar config */
  updateToolbarConfig(config: { hide?: boolean; pin?: boolean }): void;
  /** Upload files */
  upload(files: FileList | File[]): void;
  /** Vditor element */
  readonly element: HTMLDivElement;
  /** Vditor options */
  readonly options: VditorOptions;
  /** Original value */
  readonly originalInnerHTML: string;
  /** Current mode */
  readonly currentMode: 'sv' | 'ir' | 'wysiwyg';
  /** Current preview mode */
  readonly currentPreviewMode: 'both' | 'editor';
  /** Is fullscreen */
  readonly isFullscreen: boolean;
  /** Counter element */
  readonly counter: HTMLSpanElement;
  /** Resize element */
  readonly resize: HTMLDivElement;
  /** Toolbar element */
  readonly toolbar: HTMLDivElement;
  /** Preview element */
  readonly preview: HTMLDivElement;
}

export interface VditorConstructor {
  new (id: string | HTMLDivElement, options?: VditorOptions): VditorInstance;
}

declare global {
  class Vditor implements VditorInstance {
    constructor(id: string | HTMLDivElement, options?: VditorOptions);
    getValue(): string;
    setValue(value: string): void;
    insertValue(value: string, render?: boolean): void;
    deleteValue(): void;
    getSelection(): string;
    setSelection(start: number, end: number): void;
    replaceSelection(value: string): void;
    focus(): void;
    blur(): void;
    destroy(): void;
    getHTML(): string;
    renderPreview(value?: string): void;
    getCursorPosition(): { top: number; left: number };
    disabled(): void;
    enable(): void;
    isDisabled(): boolean;
    fullscreen(): void;
    getCurrentMode(): 'sv' | 'ir' | 'wysiwyg';
    changeMode(mode: 'sv' | 'ir' | 'wysiwyg', render?: boolean): void;
    setTheme(theme: 'classic' | 'dark', contentTheme?: string, codeTheme?: string): void;
    getOutline(): Array<{ level: number; text: string }>;
    tip(text: string, time?: number): void;
    setPreviewMode(mode: 'both' | 'editor'): void;
    getPreviewMode(): 'both' | 'editor';
    clearCache(): void;
    disabledCache(): void;
    enableCache(): void;
    undo(): void;
    redo(): void;
    clearStack(): void;
    updateToolbarConfig(config: { hide?: boolean; pin?: boolean }): void;
    upload(files: FileList | File[]): void;
    readonly element: HTMLDivElement;
    readonly options: VditorOptions;
    readonly originalInnerHTML: string;
    readonly currentMode: 'sv' | 'ir' | 'wysiwyg';
    readonly currentPreviewMode: 'both' | 'editor';
    readonly isFullscreen: boolean;
    readonly counter: HTMLSpanElement;
    readonly resize: HTMLDivElement;
    readonly toolbar: HTMLDivElement;
    readonly preview: HTMLDivElement;
    static codeRender(element: HTMLElement, lang?: string): void;
    static highlightRender(options: {
      enable?: boolean;
      lineNumber?: boolean;
      defaultLang?: string;
    }, element: HTMLElement, cdn?: string): void;
    static mathRender(element: HTMLElement, cdn?: string): void;
    static chartRender(element?: HTMLElement, cdn?: string): void;
    static mermaidRender(element?: HTMLElement, cdn?: string): void;
    static flowchartRender(element?: HTMLElement, cdn?: string): void;
    static graphvizRender(element?: HTMLElement, cdn?: string): void;
    static abcRender(element?: HTMLElement, cdn?: string): void;
    static mediaRender(element?: HTMLElement): void;
    static speechRender(element: HTMLElement, lang?: string): void;
    static plantumlRender(element?: HTMLElement, cdn?: string): void;
    static outlineRender(contentElement: HTMLElement, targetElement: HTMLElement): void;
    static preview(previewElement: HTMLElement, markdown: string, options?: {
      mode?: 'dark' | 'classic';
      anchor?: number;
      customEmoji?: Record<string, string>;
      lang?: string;
      markdown?: VditorPreviewConfig['markdown'];
      renderers?: unknown;
      theme?: string;
      transform?: (html: string) => string;
    }): void;
    static md2html(markdown: string, options?: {
      anchor?: number;
      customEmoji?: Record<string, string>;
      lang?: string;
      markdown?: VditorPreviewConfig['markdown'];
      renderers?: unknown;
      theme?: string;
      transform?: (html: string) => string;
    }): Promise<string>;
    static getID(): string;
    static adaptEmoji(): void;
    static deAdaptEmoji(): void;
  }

  interface Window {
    Vditor: typeof Vditor;
  }
}

export {};
