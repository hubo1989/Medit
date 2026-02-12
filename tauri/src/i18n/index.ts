/**
 * i18n - Internationalization module for Medit
 * Supports English and Chinese translations
 */

export type Language = 'en' | 'zh';

export interface I18nConfig {
  /** Default language if none saved */
  defaultLanguage?: Language;
  /** Storage key for localStorage */
  storageKey?: string;
}

// Translation strings
const TRANSLATIONS = {
  en: {
    // Mode labels
    mode: {
      preview: 'Preview',
      edit: 'Edit',
      split: 'Split',
    },
    // Toolbar labels
    toolbar: {
      toc: 'Table of Contents',
      tocToggle: 'Toggle TOC',
      save: 'Save',
      theme: 'Theme',
    },
    // Save status
    save: {
      idle: '',
      saving: 'Saving...',
      saved: 'Saved',
      error: 'Save failed',
    },
    // Editor
    editor: {
      placeholder: 'Start writing Markdown...',
      welcomeTitle: 'Welcome to Medit',
      welcomeSubtitle: 'A clean Markdown editor.',
      features: 'Features',
      gettingStarted: 'Getting Started',
      shortcuts: 'Shortcuts',
    },
    // General
    general: {
      close: 'Close',
      confirm: 'Confirm',
      cancel: 'Cancel',
    },
    // Confirmations
    confirm: {
      discardChanges: 'You have unsaved changes. Continue anyway?',
      unsavedChanges: 'You have unsaved changes. Are you sure you want to exit?',
    },
    // Errors
    error: {
      readFile: 'Failed to read file',
      openFile: 'Failed to open file',
      saveFile: 'Failed to save file',
    },
    // Preferences
    preferences: {
      title: 'Preferences',
      close: 'Close',
      general: 'General',
      editor: 'Editor',
      preview: 'Preview',
      shortcuts: 'Shortcuts',
      language: 'Language',
      theme: 'Theme',
      startupBehavior: 'Startup Behavior',
      autoSave: 'Auto Save',
      autoSaveInterval: 'Auto Save Interval (s)',
      fontSize: 'Font Size (px)',
      fontFamily: 'Font Family',
      lineHeight: 'Line Height',
      tabWidth: 'Tab Width',
      showLineNumbers: 'Show Line Numbers',
      syncScroll: 'Sync Scroll',
      wordWrap: 'Word Wrap',
      codeTheme: 'Code Theme',
      desc: {
        language: 'Application interface language',
        theme: 'Application appearance theme',
        startupBehavior: 'Default action on startup',
        autoSave: 'Auto save document changes',
        autoSaveInterval: 'Time interval for auto save',
        fontSize: 'Editor font size',
        fontFamily: 'Editor font family',
        lineHeight: 'Editor line height multiplier',
        tabWidth: 'Tab character width (spaces)',
        showLineNumbers: 'Show line numbers on the left',
        syncScroll: 'Sync scroll between editor and preview',
        wordWrap: 'Wrap preview content automatically',
        codeTheme: 'Code block highlight style',
      },
      options: {
        zhCN: '简体中文',
        en: 'English',
        light: 'Light',
        dark: 'Dark',
        auto: 'Follow System',
        newDoc: 'New Document',
        recent: 'Open Recent',
        welcome: 'Show Welcome',
        system: 'System Default',
        monospace: 'Monospace',
        serif: 'Serif',
        sansSerif: 'Sans Serif',
        twoSpaces: '2 Spaces',
        fourSpaces: '4 Spaces',
      },
      shortcutList: {
        description: 'Available keyboard shortcuts (customization not yet supported):',
        saveFile: 'Save File',
        newFile: 'New File',
        openFile: 'Open File',
        saveAs: 'Save As',
        togglePreview: 'Toggle Preview',
        toggleEdit: 'Toggle Edit',
        toggleSplit: 'Toggle Split',
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        resetZoom: 'Reset Zoom',
        quit: 'Quit',
      },
    },
    // Menu labels
    menu: {
      file: 'File',
      edit: 'Edit',
      view: 'View',
      help: 'Help',
      newFile: 'New',
      openFile: 'Open...',
      save: 'Save',
      saveAs: 'Save As...',
      exit: 'Exit',
      find: 'Find...',
      editMode: 'Edit Mode',
      previewMode: 'Preview Mode',
      splitMode: 'Split Mode',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      resetZoom: 'Reset Zoom',
      about: 'About Medit',
      docs: 'Documentation',
      shortcuts: 'Keyboard Shortcuts',
    },
    // Find & Replace
    findReplace: {
      find: 'Find',
      findPlaceholder: 'Find...',
      replacePlaceholder: 'Replace...',
      replace: 'Replace',
      replaceAll: 'Replace All',
      caseSensitive: 'Match Case',
      wholeWord: 'Match Whole Word',
      previousMatch: 'Previous Match',
      nextMatch: 'Next Match',
      noResults: 'No results',
      close: 'Close',
      toggleReplace: 'Toggle Replace',
    },
  },
  zh: {
    // Mode labels
    mode: {
      preview: '预览',
      edit: '编辑',
      split: '分屏',
    },
    // Toolbar labels
    toolbar: {
      toc: '目录',
      tocToggle: '切换目录',
      save: '保存',
      theme: '主题',
    },
    // Save status
    save: {
      idle: '',
      saving: '保存中...',
      saved: '已保存',
      error: '保存失败',
    },
    // Editor
    editor: {
      placeholder: '开始编写 Markdown...',
      welcomeTitle: '欢迎使用 Medit',
      welcomeSubtitle: '这是一个简洁的 Markdown 编辑器。',
      features: '功能特性',
      gettingStarted: '开始使用',
      shortcuts: '快捷键',
    },
    // General
    general: {
      close: '关闭',
      confirm: '确认',
      cancel: '取消',
    },
    // Confirmations
    confirm: {
      discardChanges: '有未保存的更改，是否继续？',
      unsavedChanges: '有未保存的更改，确定要退出吗？',
    },
    // Errors
    error: {
      readFile: '读取文件失败',
      openFile: '打开文件失败',
      saveFile: '保存文件失败',
    },
    // Preferences
    preferences: {
      title: '设置',
      close: '关闭',
      general: '通用',
      editor: '编辑器',
      preview: '预览',
      shortcuts: '快捷键',
      language: '语言',
      theme: '主题',
      startupBehavior: '启动行为',
      autoSave: '自动保存',
      autoSaveInterval: '自动保存间隔（秒）',
      fontSize: '字体大小（px）',
      fontFamily: '字体',
      lineHeight: '行高',
      tabWidth: 'Tab 宽度',
      showLineNumbers: '显示行号',
      syncScroll: '同步滚动',
      wordWrap: '自动换行',
      codeTheme: '代码高亮主题',
      desc: {
        language: '应用界面语言',
        theme: '应用外观主题',
        startupBehavior: '应用启动时的默认操作',
        autoSave: '自动保存文档更改',
        autoSaveInterval: '自动保存的时间间隔',
        fontSize: '编辑器字体大小',
        fontFamily: '编辑器字体家族',
        lineHeight: '编辑器行高倍数',
        tabWidth: 'Tab 字符宽度（空格数）',
        showLineNumbers: '在编辑器左侧显示行号',
        syncScroll: '编辑器和预览同步滚动',
        wordWrap: '预览内容自动换行',
        codeTheme: '代码块的高亮样式',
      },
      options: {
        zhCN: '简体中文',
        en: 'English',
        light: '浅色',
        dark: '深色',
        auto: '跟随系统',
        newDoc: '新建文档',
        recent: '打开最近文档',
        welcome: '显示欢迎页',
        system: '系统默认',
        monospace: '等宽字体',
        serif: '衬线字体',
        sansSerif: '无衬线字体',
        twoSpaces: '2 空格',
        fourSpaces: '4 空格',
      },
      shortcutList: {
        description: '以下是当前可用的快捷键列表（暂不支持自定义）：',
        saveFile: '保存文件',
        newFile: '新建文件',
        openFile: '打开文件',
        saveAs: '另存为',
        togglePreview: '切换预览模式',
        toggleEdit: '切换编辑模式',
        toggleSplit: '切换分屏模式',
        zoomIn: '放大',
        zoomOut: '缩小',
        resetZoom: '重置缩放',
        quit: '退出应用',
      },
    },
    // 菜单标签
    menu: {
      file: '文件',
      edit: '编辑',
      view: '视图',
      help: '帮助',
      newFile: '新建',
      openFile: '打开...',
      save: '保存',
      saveAs: '另存为...',
      exit: '退出',
      find: '查找...',
      editMode: '编辑模式',
      previewMode: '预览模式',
      splitMode: '分屏模式',
      zoomIn: '放大',
      zoomOut: '缩小',
      resetZoom: '重置缩放',
      about: '关于 Medit',
      docs: '文档',
      shortcuts: '快捷键参考',
    },
    // 查找替换
    findReplace: {
      find: '查找',
      findPlaceholder: '查找...',
      replacePlaceholder: '替换...',
      replace: '替换',
      replaceAll: '全部替换',
      caseSensitive: '区分大小写',
      wholeWord: '全字匹配',
      previousMatch: '上一个匹配',
      nextMatch: '下一个匹配',
      noResults: '无结果',
      close: '关闭',
      toggleReplace: '切换替换',
    },
  },
} as const;

type Translations = typeof TRANSLATIONS;

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type FullTranslationKey = NestedKeyOf<Translations['en']>;

const DEFAULT_STORAGE_KEY = 'medit:language';

export class I18nService {
  private _currentLanguage: Language;
  private _storageKey: string;
  private _listeners: Set<(lang: Language) => void> = new Set();

  constructor(config: I18nConfig = {}) {
    this._storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
    this._currentLanguage = this._loadSavedLanguage() ?? config.defaultLanguage ?? 'zh';
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): Language {
    return this._currentLanguage;
  }

  /**
   * Set language
   */
  setLanguage(lang: Language): void {
    if (this._currentLanguage === lang) {
      return;
    }

    this._currentLanguage = lang;
    this._saveLanguage(lang);
    this._notifyListeners(lang);
  }

  /**
   * Toggle between English and Chinese
   */
  toggleLanguage(): void {
    const newLang = this._currentLanguage === 'zh' ? 'en' : 'zh';
    this.setLanguage(newLang);
  }

  /**
   * Get translation for a key
   */
  t(key: FullTranslationKey): string {
    const keys = key.split('.');
    let value: unknown = TRANSLATIONS[this._currentLanguage];

    for (const k of keys) {
      if (value === null || typeof value !== 'object') {
        return key;
      }
      value = (value as Record<string, unknown>)[k];
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * Get mode label
   */
  getModeLabel(mode: 'preview' | 'edit' | 'split'): string {
    return TRANSLATIONS[this._currentLanguage].mode[mode];
  }

  /**
   * Get save status text
   */
  getSaveStatus(status: 'idle' | 'saving' | 'saved' | 'error'): string {
    return TRANSLATIONS[this._currentLanguage].save[status];
  }

  /**
   * Subscribe to language changes
   */
  onLanguageChange(callback: (lang: Language) => void): () => void {
    this._listeners.add(callback);

    return () => {
      this._listeners.delete(callback);
    };
  }

  /**
   * Load saved language from localStorage
   */
  private _loadSavedLanguage(): Language | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const saved = localStorage.getItem(this._storageKey);
      if (saved === 'en' || saved === 'zh') {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }

    return null;
  }

  /**
   * Save language to localStorage
   */
  private _saveLanguage(lang: Language): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.setItem(this._storageKey, lang);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Notify all listeners
   */
  private _notifyListeners(lang: Language): void {
    for (const callback of this._listeners) {
      try {
        callback(lang);
      } catch (error) {
        console.error('I18nService: Error in language change callback:', error);
      }
    }
  }
}

// Create singleton instance
let globalI18n: I18nService | null = null;

export function getI18n(): I18nService {
  if (!globalI18n) {
    globalI18n = new I18nService();
  }
  return globalI18n;
}

export function initI18n(config?: I18nConfig): I18nService {
  globalI18n = new I18nService(config);
  return globalI18n;
}

export { TRANSLATIONS };
export default I18nService;
