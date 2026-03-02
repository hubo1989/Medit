/**
 * TabManager - Core service for managing multi-tab document editing
 * Provides tab state management, persistence, and event notifications
 */

import type {
  TabState,
  TabManagerConfig,
  PersistedTabState,
  PersistedTabManagerState,
  TabChangeListener,
  CloseResult,
  CreateTabOptions,
  TabChangeEvent,
} from '../types/tab.js';

const STORAGE_KEY = 'medit:tabs';
const DEFAULT_MAX_TABS = 10;
const DEFAULT_WELCOME_CONTENT = `# 欢迎使用 Medit

这是一个简洁的 Markdown 编辑器。

## 功能特性

- **实时预览**: 编辑时即时查看渲染效果
- **多种模式**: 支持编辑、预览、分屏三种模式
- **主题切换**: 支持亮色和暗色主题
- **目录导航**: 自动生成文档目录
- **多标签页**: 同时编辑多个文档

## 开始使用

在编辑器中输入 Markdown 语法，右侧预览区会实时更新。

---

*享受写作的乐趣！*
`;

export class TabManager {
  private _tabs: Map<string, TabState> = new Map();
  private _activeTabId: string | null = null;
  private _config: TabManagerConfig;
  private _listeners: Set<TabChangeListener> = new Set();
  private _idCounter: number = 0;

  constructor(config: Partial<TabManagerConfig> = {}) {
    this._config = {
      maxTabs: config.maxTabs ?? DEFAULT_MAX_TABS,
      restoreOnStartup: config.restoreOnStartup ?? true,
      defaultNewTabBehavior: config.defaultNewTabBehavior ?? 'welcome',
      onContentChange: config.onContentChange,
      onTabSwitch: config.onTabSwitch,
      onTabCreate: config.onTabCreate,
      onTabClose: config.onTabClose,
      onTabUpdate: config.onTabUpdate,
      onSave: config.onSave,
      onExitRequest: config.onExitRequest,
    };
  }

  /**
   * Generate a unique tab ID
   */
  private _generateId(): string {
    this._idCounter++;
    return `tab-${Date.now()}-${this._idCounter}`;
  }

  /**
   * Create a new tab
   */
  createTab(options: CreateTabOptions = {}): TabState | null {
    // Check if we've reached the max tabs limit
    if (this._tabs.size >= this._config.maxTabs) {
      console.warn('[TabManager] Maximum number of tabs reached');
      return null;
    }

    const id = this._generateId();
    const now = Date.now();

    let content = options.content ?? '';
    let title = options.title;

    // If no content provided and behavior is welcome, use default welcome content
    if (!options.content && !options.filePath && this._config.defaultNewTabBehavior === 'welcome') {
      content = DEFAULT_WELCOME_CONTENT;
    }

    // Generate title from file path or use default
    if (!title) {
      if (options.filePath) {
        const parts = options.filePath.split(/[/\\]/);
        title = parts[parts.length - 1] || '未命名';
      } else {
        title = '未命名';
      }
    }

    const tab: TabState = {
      id,
      title,
      filePath: options.filePath ?? null,
      content,
      lastSavedContent: content,
      scrollPosition: 0,
      editorScrollPosition: 0,
      isDirty: false,
      createdAt: now,
      modifiedAt: now,
    };

    this._tabs.set(id, tab);

    // Activate the new tab by default
    if (options.activate !== false) {
      this._activeTabId = id;
    }

    // Notify listeners
    this._notifyListeners({
      type: 'created',
      tabId: id,
      tab,
    });

    // Call onTabCreate callback
    this._config.onTabCreate?.(id, tab);

    return tab;
  }

  /**
   * Close a tab
   * Returns the close result: 'saved', 'discarded', or 'cancelled'
   */
  async closeTab(tabId: string, options: { force?: boolean } = {}): Promise<CloseResult> {
    const tab = this._tabs.get(tabId);
    if (!tab) {
      return 'discarded';
    }

    // Check for unsaved changes
    if (!options.force && tab.isDirty) {
      // The caller should handle the save dialog
      // For now, we return 'cancelled' to indicate there are unsaved changes
      return 'cancelled';
    }

    // Remove the tab
    this._tabs.delete(tabId);

    // If this was the active tab, switch to another
    if (this._activeTabId === tabId) {
      const remainingTabs = Array.from(this._tabs.keys());
      this._activeTabId = remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1] : null;
    }

    // Notify listeners
    this._notifyListeners({
      type: 'closed',
      tabId,
    });

    // Call onTabClose callback
    this._config.onTabClose?.(tabId);

    return 'discarded';
  }

  /**
   * Switch to a different tab
   */
  switchTab(tabId: string): boolean {
    const tab = this._tabs.get(tabId);
    if (!tab) {
      return false;
    }

    if (this._activeTabId === tabId) {
      return true;
    }

    this._activeTabId = tabId;

    // Notify listeners
    this._notifyListeners({
      type: 'activated',
      tabId,
      tab,
    });

    // Call onTabSwitch callback
    this._config.onTabSwitch?.(tabId, tab);

    return true;
  }

  /**
   * Get the currently active tab
   */
  getActiveTab(): TabState | null {
    if (!this._activeTabId) {
      return null;
    }
    return this._tabs.get(this._activeTabId) ?? null;
  }

  /**
   * Get the active tab ID
   */
  getActiveTabId(): string | null {
    return this._activeTabId;
  }

  /**
   * Get a specific tab by ID
   */
  getTab(tabId: string): TabState | null {
    return this._tabs.get(tabId) ?? null;
  }

  /**
   * Get all tabs
   */
  getAllTabs(): TabState[] {
    return Array.from(this._tabs.values());
  }

  /**
   * Get the number of tabs
   */
  getTabCount(): number {
    return this._tabs.size;
  }

  /**
   * Check if there are any tabs with unsaved changes
   */
  hasUnsavedChanges(): boolean {
    for (const tab of this._tabs.values()) {
      if (tab.isDirty) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a specific tab has unsaved changes
   */
  hasTabUnsavedChanges(tabId: string): boolean {
    const tab = this._tabs.get(tabId);
    return tab?.isDirty ?? false;
  }

  /**
   * Update the content of a tab
   */
  updateTabContent(tabId: string, content: string, updates?: Partial<TabState>): void {
    const tab = this._tabs.get(tabId);
    if (!tab) {
      return;
    }

    tab.content = content;
    tab.modifiedAt = Date.now();
    tab.isDirty = content !== tab.lastSavedContent;
    
    // Apply additional updates if provided
    if (updates) {
      if (updates.scrollPosition !== undefined) {
        tab.scrollPosition = updates.scrollPosition;
      }
      if (updates.editorScrollPosition !== undefined) {
        tab.editorScrollPosition = updates.editorScrollPosition;
      }
    }

    // Notify listeners
    this._notifyListeners({
      type: 'updated',
      tabId,
      tab,
    });

    // Call callbacks
    this._config.onContentChange?.(tabId, content);
    this._config.onTabUpdate?.(tabId, tab);
  }

  /**
   * Update tab scroll positions
   */
  updateTabScrollPositions(
    tabId: string,
    scrollPosition: number,
    editorScrollPosition: number
  ): void {
    const tab = this._tabs.get(tabId);
    if (!tab) {
      return;
    }

    tab.scrollPosition = scrollPosition;
    tab.editorScrollPosition = editorScrollPosition;
  }

  /**
   * Mark a tab as saved
   */
  markTabSaved(tabId: string, filePath?: string): void {
    const tab = this._tabs.get(tabId);
    if (!tab) {
      return;
    }

    tab.lastSavedContent = tab.content;
    tab.isDirty = false;

    if (filePath) {
      tab.filePath = filePath;
      const parts = filePath.split(/[/\\]/);
      tab.title = parts[parts.length - 1] || tab.title;
    }

    tab.modifiedAt = Date.now();

    // Notify listeners
    this._notifyListeners({
      type: 'saved',
      tabId,
      tab,
    });

    // Call callback
    this._config.onTabUpdate?.(tabId, tab);
  }

  /**
   * Update tab title
   */
  updateTabTitle(tabId: string, title: string): void {
    const tab = this._tabs.get(tabId);
    if (!tab) {
      return;
    }

    tab.title = title;
    tab.modifiedAt = Date.now();

    // Notify listeners
    this._notifyListeners({
      type: 'updated',
      tabId,
      tab,
    });
  }

  /**
   * Rename a tab (update file path)
   */
  renameTab(tabId: string, filePath: string): void {
    const tab = this._tabs.get(tabId);
    if (!tab) {
      return;
    }

    tab.filePath = filePath;
    const parts = filePath.split(/[/\\]/);
    tab.title = parts[parts.length - 1] || tab.title;
    tab.modifiedAt = Date.now();

    // Notify listeners
    this._notifyListeners({
      type: 'updated',
      tabId,
      tab,
    });
  }

  /**
   * Save state to localStorage
   */
  saveState(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const state: PersistedTabManagerState = {
        tabs: Array.from(this._tabs.values()).map((tab) => ({
          id: tab.id,
          title: tab.title,
          filePath: tab.filePath,
          scrollPosition: tab.scrollPosition,
          editorScrollPosition: tab.editorScrollPosition,
          createdAt: tab.createdAt,
        })),
        activeTabId: this._activeTabId,
        savedAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[TabManager] Failed to save state:', error);
    }
  }

  /**
   * Restore state from localStorage
   * Returns true if state was restored, false otherwise
   */
  async restoreState(): Promise<boolean> {
    if (!this._config.restoreOnStartup) {
      return false;
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return false;
      }

      const state = JSON.parse(stored) as PersistedTabManagerState;
      if (!state.tabs || state.tabs.length === 0) {
        return false;
      }

      // Clear existing tabs
      this._tabs.clear();
      this._activeTabId = null;

      // Restore tabs
      for (const persistedTab of state.tabs) {
        // Note: We don't restore content from localStorage for security/size reasons
        // The actual content should be loaded from files
        const tab: TabState = {
          id: persistedTab.id,
          title: persistedTab.title,
          filePath: persistedTab.filePath,
          content: '', // Will be loaded from file
          lastSavedContent: '',
          scrollPosition: persistedTab.scrollPosition,
          editorScrollPosition: persistedTab.editorScrollPosition,
          isDirty: false,
          createdAt: persistedTab.createdAt,
          modifiedAt: Date.now(),
        };

        this._tabs.set(tab.id, tab);
      }

      // Restore active tab
      if (state.activeTabId && this._tabs.has(state.activeTabId)) {
        this._activeTabId = state.activeTabId;
      } else if (this._tabs.size > 0) {
        this._activeTabId = Array.from(this._tabs.keys())[0];
      }

      return true;
    } catch (error) {
      console.error('[TabManager] Failed to restore state:', error);
      return false;
    }
  }

  /**
   * Subscribe to tab changes
   */
  onTabChange(callback: TabChangeListener): () => void {
    this._listeners.add(callback);
    return () => {
      this._listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of a tab change
   */
  private _notifyListeners(event: TabChangeEvent): void {
    for (const callback of this._listeners) {
      try {
        callback(event);
      } catch (error) {
        console.error('[TabManager] Error in listener:', error);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TabManagerConfig>): void {
    this._config = {
      ...this._config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): TabManagerConfig {
    return { ...this._config };
  }

  /**
   * Set maximum number of tabs
   */
  setMaxTabs(maxTabs: number): void {
    this._config.maxTabs = maxTabs;
  }

  /**
   * Clear all tabs
   */
  clearAll(): void {
    this._tabs.clear();
    this._activeTabId = null;
  }

  /**
   * Dispose the service
   */
  dispose(): void {
    this._listeners.clear();
    this._tabs.clear();
    this._activeTabId = null;
  }
}

export default TabManager;
