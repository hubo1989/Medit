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
    // Preferences
    preferences: {
      title: 'Preferences',
      general: 'General',
      editor: 'Editor',
      preview: 'Preview',
      shortcuts: 'Shortcuts',
      language: 'Language',
      theme: 'Theme',
      autoSave: 'Auto Save',
      fontSize: 'Font Size',
      fontFamily: 'Font Family',
      lineHeight: 'Line Height',
      tabWidth: 'Tab Width',
      showLineNumbers: 'Show Line Numbers',
      syncScroll: 'Sync Scroll',
      wordWrap: 'Word Wrap',
      codeTheme: 'Code Theme',
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
    // Preferences
    preferences: {
      title: '设置',
      general: '通用',
      editor: '编辑器',
      preview: '预览',
      shortcuts: '快捷键',
      language: '语言',
      theme: '主题',
      autoSave: '自动保存',
      fontSize: '字体大小',
      fontFamily: '字体',
      lineHeight: '行高',
      tabWidth: 'Tab 宽度',
      showLineNumbers: '显示行号',
      syncScroll: '同步滚动',
      wordWrap: '自动换行',
      codeTheme: '代码高亮主题',
    },
  },
} as const;

type Translations = typeof TRANSLATIONS;
type TranslationKey = keyof Translations['en'];

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
  t<K extends TranslationKey>(key: K): Translations[Language][K] {
    return TRANSLATIONS[this._currentLanguage][key];
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
