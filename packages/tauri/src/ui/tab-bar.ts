/**
 * TabBar - UI component for displaying and managing document tabs
 */

import type { I18nService } from '../i18n/index.js';
import type { TabState, TabChangeEvent } from '../types/tab.js';
import type { TabManager } from '../services/tab-manager.js';

export interface TabBarConfig {
  /** Container element to render the tab bar into */
  container: HTMLElement;
  /** Tab manager instance */
  tabManager: TabManager;
  /** I18n service for translations */
  i18n: I18nService;
  /** Callback when a new tab is requested */
  onNewTab?: () => void;
  /** Callback when a tab close is requested */
  onTabClose?: (tabId: string) => Promise<boolean>;
  /** Callback when a tab switch is requested */
  onTabSwitch?: (tabId: string) => void;
}

const TAB_BAR_HTML = `
<div class="tab-bar">
  <div class="tab-bar-scroll">
    <div class="tab-list"></div>
  </div>
  <button class="tab-new-btn" title="新建标签">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 2V12M2 7H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>
</div>
`;

const TAB_ITEM_HTML = `
<div class="tab-item" data-tab-id="">
  <span class="tab-icon">📄</span>
  <span class="tab-title"></span>
  <span class="tab-dirty-indicator">●</span>
  <button class="tab-close-btn" title="关闭">
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </button>
</div>
`;

export class TabBar {
  private _container: HTMLElement;
  private _tabManager: TabManager;
  private _i18n: I18nService;
  private _config: TabBarConfig;
  private _element: HTMLElement | null = null;
  private _tabList: HTMLElement | null = null;
  private _unsubscribe: (() => void) | null = null;

  constructor(config: TabBarConfig) {
    this._container = config.container;
    this._tabManager = config.tabManager;
    this._i18n = config.i18n;
    this._config = config;
  }

  /**
   * Render the tab bar
   */
  render(): void {
    // Create wrapper and insert HTML
    this._element = document.createElement('div');
    this._element.innerHTML = TAB_BAR_HTML;
    const tabBar = this._element.firstElementChild as HTMLElement;

    // Find tab list element
    this._tabList = tabBar.querySelector('.tab-list');

    // Setup new tab button
    const newBtn = tabBar.querySelector('.tab-new-btn');
    if (newBtn) {
      newBtn.setAttribute('title', this._i18n.t('tabs.newTab') ?? '新建标签');
      newBtn.addEventListener('click', () => {
        console.log('[TabBar] New tab button clicked');
        if (this._config.onNewTab) {
          this._config.onNewTab();
        } else {
          console.warn('[TabBar] onNewTab callback not configured');
        }
      });
    }

    // Append to container
    this._container.appendChild(tabBar);

    // Subscribe to tab manager changes
    this._unsubscribe = this._tabManager.onTabChange((event) => {
      this._handleTabChange(event);
    });

    // Initial render of tabs
    this._renderTabs();
  }

  /**
   * Render all tabs
   */
  private _renderTabs(): void {
    if (!this._tabList) return;

    // Clear existing tabs
    this._tabList.innerHTML = '';

    const tabs = this._tabManager.getAllTabs();
    const activeTabId = this._tabManager.getActiveTabId();

    for (const tab of tabs) {
      this._createTabElement(tab, tab.id === activeTabId);
    }
  }

  /**
   * Create a single tab element
   */
  private _createTabElement(tab: TabState, isActive: boolean): HTMLElement {
    if (!this._tabList) {
      throw new Error('Tab list not initialized');
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = TAB_ITEM_HTML;
    const tabElement = wrapper.firstElementChild as HTMLElement;

    // Set tab ID
    tabElement.setAttribute('data-tab-id', tab.id);

    // Set active state
    if (isActive) {
      tabElement.classList.add('active');
    }

    // Set dirty state
    if (tab.isDirty) {
      tabElement.classList.add('dirty');
    }

    // Update title
    const titleElement = tabElement.querySelector('.tab-title');
    if (titleElement) {
      titleElement.textContent = tab.title;
    }

    // Update dirty indicator visibility
    const dirtyIndicator = tabElement.querySelector('.tab-dirty-indicator') as HTMLElement;
    if (dirtyIndicator) {
      dirtyIndicator.style.display = tab.isDirty ? 'inline' : 'none';
    }

    // Setup close button
    const closeBtn = tabElement.querySelector('.tab-close-btn');
    if (closeBtn) {
      closeBtn.setAttribute('title', this._i18n.t('tabs.closeTab') ?? '关闭');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleCloseClick(tab.id);
      });
    }

    // Setup tab click (switch)
    tabElement.addEventListener('click', () => {
      this._handleTabClick(tab.id);
    });

    // Middle click to close
    tabElement.addEventListener('mousedown', (e) => {
      if (e.button === 1) { // Middle click
        e.preventDefault();
        this._handleCloseClick(tab.id, true);
      }
    });

    this._tabList.appendChild(tabElement);
    return tabElement;
  }

  /**
   * Handle tab click (switch)
   */
  private _handleTabClick(tabId: string): void {
    this._config.onTabSwitch?.(tabId);
  }

  /**
   * Handle close button click
   */
  private async _handleCloseClick(tabId: string, force: boolean = false): Promise<void> {
    if (this._config.onTabClose) {
      await this._config.onTabClose(tabId);
    } else {
      // Default behavior: close if not dirty
      const tab = this._tabManager.getTab(tabId);
      if (tab && !tab.isDirty) {
        await this._tabManager.closeTab(tabId, { force: true });
      }
    }
  }

  /**
   * Handle tab change events from TabManager
   */
  private _handleTabChange(event: TabChangeEvent): void {
    switch (event.type) {
      case 'created':
        if (event.tab) {
          this._addTabElement(event.tab);
        }
        break;
      case 'closed':
        this._removeTabElement(event.tabId);
        break;
      case 'activated':
        this._setActiveTab(event.tabId);
        break;
      case 'updated':
      case 'saved':
        if (event.tab) {
          this._updateTabElement(event.tab);
        }
        break;
    }
  }

  /**
   * Add a new tab element
   */
  private _addTabElement(tab: TabState): void {
    if (!this._tabList) return;

    const activeTabId = this._tabManager.getActiveTabId();
    this._createTabElement(tab, tab.id === activeTabId);
  }

  /**
   * Remove a tab element
   */
  private _removeTabElement(tabId: string): void {
    if (!this._tabList) return;

    const tabElement = this._tabList.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.remove();
    }
  }

  /**
   * Update a tab element
   */
  private _updateTabElement(tab: TabState): void {
    if (!this._tabList) return;

    const tabElement = this._tabList.querySelector(`[data-tab-id="${tab.id}"]`);
    if (!tabElement) return;

    // Update title
    const titleElement = tabElement.querySelector('.tab-title');
    if (titleElement) {
      titleElement.textContent = tab.title;
    }

    // Update dirty state
    if (tab.isDirty) {
      tabElement.classList.add('dirty');
    } else {
      tabElement.classList.remove('dirty');
    }

    // Update dirty indicator
    const dirtyIndicator = tabElement.querySelector('.tab-dirty-indicator') as HTMLElement;
    if (dirtyIndicator) {
      dirtyIndicator.style.display = tab.isDirty ? 'inline' : 'none';
    }
  }

  /**
   * Set active tab
   */
  private _setActiveTab(tabId: string): void {
    if (!this._tabList) return;

    // Remove active from all tabs
    const allTabs = this._tabList.querySelectorAll('.tab-item');
    allTabs.forEach((tab) => tab.classList.remove('active'));

    // Add active to specific tab
    const tabElement = this._tabList.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.classList.add('active');
    }
  }

  /**
   * Update tab title
   */
  updateTabTitle(tabId: string, title: string): void {
    if (!this._tabList) return;

    const tabElement = this._tabList.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      const titleElement = tabElement.querySelector('.tab-title');
      if (titleElement) {
        titleElement.textContent = title;
      }
    }
  }

  /**
   * Update tab dirty state
   */
  updateTabDirtyState(tabId: string, isDirty: boolean): void {
    if (!this._tabList) return;

    const tabElement = this._tabList.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      if (isDirty) {
        tabElement.classList.add('dirty');
      } else {
        tabElement.classList.remove('dirty');
      }

      const dirtyIndicator = tabElement.querySelector('.tab-dirty-indicator') as HTMLElement;
      if (dirtyIndicator) {
        dirtyIndicator.style.display = isDirty ? 'inline' : 'none';
      }
    }
  }

  /**
   * Update all labels (for language change)
   */
  updateLabels(): void {
    if (!this._element) return;

    const newBtn = this._element.querySelector('.tab-new-btn');
    if (newBtn) {
      newBtn.setAttribute('title', this._i18n.t('tabs.newTab') ?? '新建标签');
    }

    const closeBtns = this._element.querySelectorAll('.tab-close-btn');
    closeBtns.forEach((btn) => {
      btn.setAttribute('title', this._i18n.t('tabs.closeTab') ?? '关闭');
    });
  }

  /**
   * Destroy the tab bar
   */
  destroy(): void {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }

    if (this._element) {
      this._element.remove();
      this._element = null;
    }

    this._tabList = null;
  }
}

export default TabBar;
