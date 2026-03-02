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
      wechatMP: 'Export for WeChat',
      zhihu: 'Export for Zhihu',
      desktop: 'Desktop Preview',
      tablet: 'Tablet Preview',
      mobile: 'Mobile Preview',
      refresh: 'Refresh Preview',
      heading: 'Heading',
      heading1: 'Heading 1',
      heading2: 'Heading 2',
      heading3: 'Heading 3',
      heading4: 'Heading 4',
      heading5: 'Heading 5',
      bold: 'Bold',
      italic: 'Italic',
      strikethrough: 'Strikethrough',
      codeBlock: 'Code Block',
      inlineCode: 'Inline Code',
      link: 'Link',
      image: 'Image',
      quote: 'Quote',
      horizontalRule: 'Horizontal Rule',
      unorderedList: 'Bullet List',
      orderedList: 'Numbered List',
      taskList: 'Task List',
      undo: 'Undo',
      redo: 'Redo',
      insertDiagram: 'Insert Diagram',
      table: 'Table',
      tableSelectSize: 'Select table size',
      tableCells: 'cells',
    },
    // Diagram templates
    diagram: {
      // Categories
      mermaid: 'Mermaid',
      vegaLite: 'Vega-Lite',
      dot: 'Graphviz DOT',
      // Mermaid templates
      mermaidFlowchart: 'Flowchart',
      mermaidSequence: 'Sequence Diagram',
      mermaidClass: 'Class Diagram',
      mermaidState: 'State Diagram',
      mermaidEr: 'ER Diagram',
      mermaidGantt: 'Gantt Chart',
      mermaidPie: 'Pie Chart',
      mermaidMindmap: 'Mind Map',
      // Vega-Lite templates
      vegaLiteBar: 'Bar Chart',
      vegaLiteLine: 'Line Chart',
      vegaLiteArea: 'Area Chart',
      vegaLiteScatter: 'Scatter Plot',
      vegaLitePie: 'Pie Chart',
      vegaLiteHeatmap: 'Heatmap',
      vegaLiteStackedBar: 'Stacked Bar Chart',
      // DOT templates
      dotBasic: 'Basic Graph',
      dotTree: 'Tree Diagram',
      dotCluster: 'Cluster Diagram',
      dotState: 'State Machine',
      // Vega templates
      vega: 'Vega',
      vegaBar: 'Bar Chart',
      vegaPie: 'Pie Chart',
      // Infographic templates
      infographic: 'Infographic',
      infographicList: 'List Process',
      infographicCompare: 'SWOT Compare',
      infographicTimeline: 'Timeline',
    },
    // TOC
    toc: {
      empty: 'No headings',
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
      app: 'Medit',
      newFile: 'New',
      openFile: 'Open...',
      save: 'Save',
      saveAs: 'Save As...',
      exit: 'Exit',
      quit: 'Quit Medit',
      find: 'Find...',
      editMode: 'Edit Mode',
      previewMode: 'Preview Mode',
      splitMode: 'Split Mode',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      resetZoom: 'Reset Zoom',
      about: 'About Medit',
      preferences: 'Preferences...',
      docs: 'Documentation',
      shortcuts: 'Keyboard Shortcuts',
      hide: 'Hide Medit',
      hideOthers: 'Hide Others',
      showAll: 'Show All',
    },
    // About dialog
    about: {
      tabs: {
        about: 'About',
        dependencies: 'Dependencies',
        thanks: 'Thanks',
      },
      author: 'Author',
      license: 'License',
      website: 'Website',
      updates: 'Updates',
      currentVersion: 'Current version',
      checkForUpdates: 'Check for Updates',
      checking: 'Checking...',
      updateAvailable: 'Update available',
      upToDate: 'You are up to date',
      download: 'Download',
      manualCheck: 'Visit GitHub to check for updates',
      viewReleases: 'View Releases',
      frontendDependencies: 'Frontend Dependencies',
      rustDependencies: 'Rust Dependencies',
      specialThanks: 'Special Thanks To',
      thanksFooter: 'And to all contributors, bug reporters, and users who help make Medit better!',
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
    // Export
    export: {
      noContent: 'No content to export',
      exporting: 'Exporting to {target}...',
      toBeAvailable: 'Export to "{target}" feature coming soon',
      targets: {
        wechatMP: 'WeChat',
        zhihu: 'Zhihu',
      },
    },
    // Tabs
    tabs: {
      newTab: 'New Tab',
      closeTab: 'Close Tab',
      closeOtherTabs: 'Close Other Tabs',
      closeAllTabs: 'Close All Tabs',
      untitled: 'Untitled',
      confirmClose: 'You have unsaved changes. Save before closing?',
      confirmCloseAll: 'You have tabs with unsaved changes. Save all before closing?',
      confirmExit: 'This is the last tab. Exit the application?',
      createNewTab: 'Create a new tab',
      maxTabsReached: 'Maximum number of tabs reached',
      restoreOnStartup: 'Restore Tabs on Startup',
      maxTabs: 'Maximum Tabs',
      defaultNewTabBehavior: 'New Tab Default Content',
      blank: 'Blank Document',
      welcome: 'Welcome Page',
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
      wechatMP: '导出公众号格式',
      zhihu: '导出知乎格式',
      desktop: '桌面预览',
      tablet: '平板预览',
      mobile: '手机机型预览',
      refresh: '刷新预览',
      heading: '标题',
      heading1: '标题1',
      heading2: '标题2',
      heading3: '标题3',
      heading4: '标题4',
      heading5: '标题5',
      bold: '加粗',
      italic: '斜体',
      strikethrough: '删除线',
      codeBlock: '代码块',
      inlineCode: '行内代码',
      link: '链接',
      image: '图片',
      quote: '引用',
      horizontalRule: '分隔线',
      unorderedList: '无序列表',
      orderedList: '有序列表',
      taskList: '任务列表',
      undo: '撤销',
      redo: '重做',
      insertDiagram: '插入图表',
      table: '表格',
      tableSelectSize: '选择表格大小',
      tableCells: '单元格',
    },
    // Diagram templates
    diagram: {
      // Categories
      mermaid: 'Mermaid',
      vegaLite: 'Vega-Lite',
      dot: 'Graphviz DOT',
      // Mermaid templates
      mermaidFlowchart: '流程图',
      mermaidSequence: '时序图',
      mermaidClass: '类图',
      mermaidState: '状态图',
      mermaidEr: 'ER图',
      mermaidGantt: '甘特图',
      mermaidPie: '饼图',
      mermaidMindmap: '思维导图',
      // Vega-Lite templates
      vegaLiteBar: '柱状图',
      vegaLiteLine: '折线图',
      vegaLiteArea: '面积图',
      vegaLiteScatter: '散点图',
      vegaLitePie: '饼图',
      vegaLiteHeatmap: '热力图',
      vegaLiteStackedBar: '堆叠柱状图',
      // DOT templates
      dotBasic: '基础图',
      dotTree: '树形图',
      dotCluster: '集群图',
      dotState: '状态机',
      // Vega templates
      vega: 'Vega',
      vegaBar: '柱状图',
      vegaPie: '饼图',
      // Infographic templates
      infographic: '信息图',
      infographicList: '列表流程',
      infographicCompare: 'SWOT对比',
      infographicTimeline: '时间线',
    },
    // TOC
    toc: {
      empty: '暂无标题',
    },
    // Menu labels
    menu: {
      file: '文件',
      edit: '编辑',
      view: '视图',
      help: '帮助',
      app: 'Medit',
      newFile: '新建',
      openFile: '打开...',
      save: '保存',
      saveAs: '另存为...',
      exit: '退出',
      quit: '退出 Medit',
      find: '查找...',
      editMode: '编辑模式',
      previewMode: '预览模式',
      splitMode: '分屏模式',
      zoomIn: '放大',
      zoomOut: '缩小',
      resetZoom: '重置缩放',
      about: '关于 Medit',
      preferences: '偏好设置...',
      docs: '文档',
      shortcuts: '快捷键参考',
      hide: '隐藏 Medit',
      hideOthers: '隐藏其他',
      showAll: '显示全部',
    },
    // About dialog
    about: {
      tabs: {
        about: '关于',
        dependencies: '依赖',
        thanks: '致谢',
      },
      author: '作者',
      license: '许可证',
      website: '网站',
      updates: '更新',
      currentVersion: '当前版本',
      checkForUpdates: '检查更新',
      checking: '检查中...',
      updateAvailable: '有新版本',
      upToDate: '已是最新版本',
      download: '下载',
      manualCheck: '访问 GitHub 检查更新',
      viewReleases: '查看发布版本',
      frontendDependencies: '前端依赖',
      rustDependencies: 'Rust 依赖',
      specialThanks: '特别致谢',
      thanksFooter: '感谢所有贡献者、问题报告者和用户，你们让 Medit 变得更好！',
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
    // 导出
    export: {
      noContent: '没有可导出的内容',
      exporting: '正在导出到「{target}」...',
      toBeAvailable: '导出到「{target}」功能即将推出',
      targets: {
        wechatMP: '公众号',
        zhihu: '知乎',
      },
    },
    // 标签页
    tabs: {
      newTab: '新建标签',
      closeTab: '关闭标签',
      closeOtherTabs: '关闭其他标签',
      closeAllTabs: '关闭所有标签',
      untitled: '未命名',
      confirmClose: '有未保存的更改，关闭前是否保存？',
      confirmCloseAll: '有标签页未保存，关闭前是否保存？',
      confirmExit: '这是最后一个标签。退出应用？',
      createNewTab: '创建新标签',
      maxTabsReached: '已达到最大标签数',
      restoreOnStartup: '启动时恢复标签页',
      maxTabs: '最大标签数',
      defaultNewTabBehavior: '新标签默认内容',
      blank: '空白文档',
      welcome: '欢迎页',
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
   * Get translation for any string key (safe wrapper for external code)
   * This method accepts any string and returns the translation or the key itself if not found
   */
  translate(key: string): string {
    return this.t(key as FullTranslationKey);
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
