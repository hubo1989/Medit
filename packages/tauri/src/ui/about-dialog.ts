/**
 * AboutDialog - Application about dialog with credits, dependencies, and update info
 */

import { I18nService } from '../i18n';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';

export interface AboutDialogConfig {
  container: HTMLElement;
  i18n: I18nService;
}

interface Dependency {
  name: string;
  version: string;
  license?: string;
  url?: string;
}

interface AppInfo {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  repository: string;
}

// Application information
const APP_INFO: AppInfo = {
  name: 'Medit',
  version: '1.0.0',
  description: 'A modern Markdown editor with real-time preview',
  author: 'hubo1989',
  license: 'MIT',
  repository: 'https://github.com/hubo1989/Medit',
};

// Frontend dependencies (from package.json)
const FRONTEND_DEPENDENCIES: Dependency[] = [
  { name: 'vditor', version: '3.11.2', license: 'MIT', url: 'https://b3log.org/vditor/' },
  { name: 'mermaid', version: '11.12.2', license: 'MIT', url: 'https://mermaid.js.org/' },
  { name: 'katex', version: '0.16.27', license: 'MIT', url: 'https://katex.org/' },
  { name: 'd3-array', version: '3.2.4', license: 'ISC', url: 'https://github.com/d3/d3-array' },
  { name: 'dompurify', version: '3.3.1', license: 'MPL-2.0', url: 'https://github.com/cure53/DOMPurify' },
  { name: 'eventemitter3', version: '5.0.1', license: 'MIT', url: 'https://github.com/primus/eventemitter3' },
  { name: 'github-slugger', version: '2.0.0', license: 'ISC', url: 'https://github.com/Flet/github-slugger' },
  { name: 'unified', version: '11.0.5', license: 'MIT', url: 'https://unifiedjs.com/' },
  { name: 'remark-gfm', version: '4.0.1', license: 'MIT', url: 'https://github.com/remarkjs/remark-gfm' },
  { name: 'remark-math', version: '6.0.0', license: 'MIT', url: 'https://github.com/remarkjs/remark-math' },
  { name: 'rehype-katex', version: '7.0.1', license: 'MIT', url: 'https://github.com/remarkjs/rehype-katex' },
  { name: 'rehype-highlight', version: '7.0.2', license: 'MIT', url: 'https://github.com/rehypejs/rehype-highlight' },
  { name: '@viz-js/viz', version: '3.24.0', license: 'MIT', url: 'https://github.com/nickg/viz-js' },
  { name: 'vega', version: '6.2.0', license: 'BSD-3-Clause', url: 'https://vega.github.io/vega/' },
  { name: 'vega-lite', version: '6.4.1', license: 'BSD-3-Clause', url: 'https://vega.github.io/vega-lite/' },
  { name: 'vega-embed', version: '7.1.0', license: 'BSD-3-Clause', url: 'https://github.com/vega/vega-embed' },
];

// Rust backend dependencies (from Cargo.toml)
const RUST_DEPENDENCIES: Dependency[] = [
  { name: 'tauri', version: '2.x', license: 'Apache-2.0 / MIT', url: 'https://tauri.app/' },
  { name: 'tauri-plugin-fs', version: '2.x', license: 'Apache-2.0 / MIT', url: 'https://tauri.app/' },
  { name: 'tauri-plugin-dialog', version: '2.x', license: 'Apache-2.0 / MIT', url: 'https://tauri.app/' },
  { name: 'serde', version: '1.x', license: 'Apache-2.0 / MIT', url: 'https://serde.rs/' },
  { name: 'serde_json', version: '1.x', license: 'Apache-2.0 / MIT', url: 'https://github.com/serde-rs/json' },
];

// Special thanks
const SPECIAL_THANKS = [
  { name: 'Tauri Team', reason: 'Tauri framework' },
  { name: 'Vditor Team', reason: 'Excellent Markdown editor core' },
  { name: 'markdown-viewer', reason: 'Markdown rendering engine', url: 'https://github.com/markdown-viewer/markdown-viewer-extension' },
  { name: 'Mermaid Team', reason: 'Diagram rendering' },
  { name: 'KaTeX Team', reason: 'Math rendering' },
  { name: 'Open Source Community', reason: 'All the amazing libraries' },
];

/**
 * AboutDialog class for displaying application information
 */
export class AboutDialog {
  private _container: HTMLElement;
  private _i18n: I18nService;
  private _dialog: HTMLElement | null = null;
  private _overlay: HTMLElement | null = null;
  private _isOpen = false;
  private _currentTab: 'about' | 'dependencies' | 'thanks' = 'about';

  constructor(config: AboutDialogConfig) {
    this._container = config.container;
    this._i18n = config.i18n;
    this._render();
  }

  /**
   * Open the about dialog
   */
  open(): void {
    if (this._isOpen) return;
    this._isOpen = true;
    this._currentTab = 'about';
    
    if (this._overlay) {
      this._overlay.style.display = 'flex';
      requestAnimationFrame(() => {
        this._overlay?.classList.add('open');
      });
    }
    
    this._updateContent();
  }

  /**
   * Close the about dialog
   */
  close(): void {
    if (!this._isOpen) return;
    this._isOpen = false;
    
    if (this._overlay) {
      this._overlay.classList.remove('open');
      setTimeout(() => {
        if (!this._isOpen && this._overlay) {
          this._overlay.style.display = 'none';
        }
      }, 200);
    }
  }

  /**
   * Check if dialog is open
   */
  isOpen(): boolean {
    return this._isOpen;
  }

  /**
   * Create a link element that opens in external browser
   */
  private _createExternalLink(url: string, text: string): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = text;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      open(url);
    });
    return link;
  }

  /**
   * Destroy the dialog
   */
  destroy(): void {
    this.close();
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
    this._dialog = null;
  }

  /**
   * Render the dialog structure
   */
  private _render(): void {
    // Create overlay
    this._overlay = document.createElement('div');
    this._overlay.className = 'about-overlay';
    this._overlay.style.display = 'none';

    // Create dialog
    this._dialog = document.createElement('div');
    this._dialog.className = 'about-dialog';

    // Header with app icon and close button
    const header = this._createHeader();
    this._dialog.appendChild(header);

    // Tab navigation
    const tabs = this._createTabs();
    this._dialog.appendChild(tabs);

    // Content area
    const content = document.createElement('div');
    content.className = 'about-content';
    this._dialog.appendChild(content);

    this._overlay.appendChild(this._dialog);
    this._container.appendChild(this._overlay);

    // Event listeners
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isOpen) {
        this.close();
      }
    });
  }

  /**
   * Create dialog header
   */
  private _createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'about-header';

    // App icon
    const iconContainer = document.createElement('div');
    iconContainer.className = 'about-icon';
    iconContainer.innerHTML = `<img src="/icons/icon.png" alt="Medit" width="64" height="64" />`;
    header.appendChild(iconContainer);

    // App info
    const info = document.createElement('div');
    info.className = 'about-header-info';
    
    const title = document.createElement('h2');
    title.textContent = APP_INFO.name;
    info.appendChild(title);

    const version = document.createElement('div');
    version.className = 'about-version';
    version.textContent = `Version ${APP_INFO.version}`;
    info.appendChild(version);

    const description = document.createElement('p');
    description.className = 'about-description';
    description.textContent = APP_INFO.description;
    info.appendChild(description);

    header.appendChild(info);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'about-close-btn';
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    return header;
  }

  /**
   * Create tab navigation
   */
  private _createTabs(): HTMLElement {
    const tabs = document.createElement('div');
    tabs.className = 'about-tabs';

    const tabItems: { id: 'about' | 'dependencies' | 'thanks'; label: string }[] = [
      { id: 'about', label: this._i18n.t('about.tabs.about') || 'About' },
      { id: 'dependencies', label: this._i18n.t('about.tabs.dependencies') || 'Dependencies' },
      { id: 'thanks', label: this._i18n.t('about.tabs.thanks') || 'Thanks' },
    ];

    for (const item of tabItems) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'about-tab';
      tab.dataset.tab = item.id;
      tab.textContent = item.label;
      tab.addEventListener('click', () => this._switchTab(item.id));
      tabs.appendChild(tab);
    }

    return tabs;
  }

  /**
   * Switch to a different tab
   */
  private _switchTab(tab: typeof this._currentTab): void {
    this._currentTab = tab;
    this._updateContent();
    this._updateActiveTab();
  }

  /**
   * Update active tab styling
   */
  private _updateActiveTab(): void {
    const tabs = this._dialog?.querySelectorAll('.about-tab');
    tabs?.forEach((tab) => {
      const isActive = (tab as HTMLElement).dataset.tab === this._currentTab;
      tab.classList.toggle('active', isActive);
    });
  }

  /**
   * Update content based on current tab
   */
  private _updateContent(): void {
    const content = this._dialog?.querySelector('.about-content');
    if (!content) return;

    content.innerHTML = '';
    this._updateActiveTab();

    switch (this._currentTab) {
      case 'about':
        content.appendChild(this._createAboutContent());
        break;
      case 'dependencies':
        content.appendChild(this._createDependenciesContent());
        break;
      case 'thanks':
        content.appendChild(this._createThanksContent());
        break;
    }
  }

  /**
   * Create About tab content
   */
  private _createAboutContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'about-tab-content about-tab-about';

    // Info section
    const info = document.createElement('div');
    info.className = 'about-info-section';

    const items = [
      { label: this._i18n.t('about.author') || 'Author', value: APP_INFO.author },
      { label: this._i18n.t('about.license') || 'License', value: APP_INFO.license },
      { label: this._i18n.t('about.website') || 'Website', value: APP_INFO.repository, isLink: true },
    ];

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'about-info-row';

      const label = document.createElement('span');
      label.className = 'about-info-label';
      label.textContent = item.label + ':';
      row.appendChild(label);

      if (item.isLink) {
        const link = this._createExternalLink(item.value, item.value);
        row.appendChild(link);
      } else {
        const value = document.createElement('span');
        value.className = 'about-info-value';
        value.textContent = item.value;
        row.appendChild(value);
      }

      info.appendChild(row);
    }

    container.appendChild(info);

    // Update section
    const updateSection = this._createUpdateSection();
    container.appendChild(updateSection);

    return container;
  }

  /**
   * Create update check section
   */
  private _createUpdateSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'about-update-section';

    const title = document.createElement('h3');
    title.textContent = this._i18n.t('about.updates') || 'Updates';
    section.appendChild(title);

    const updateInfo = document.createElement('div');
    updateInfo.className = 'about-update-info';
    updateInfo.innerHTML = `
      <span class="update-status">${this._i18n.t('about.currentVersion') || 'Current version'}: ${APP_INFO.version}</span>
    `;
    section.appendChild(updateInfo);

    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'about-check-update-btn';
    checkBtn.textContent = this._i18n.t('about.checkForUpdates') || 'Check for Updates';
    checkBtn.addEventListener('click', () => this._checkForUpdates(checkBtn, updateInfo));
    section.appendChild(checkBtn);

    return section;
  }

  /**
   * Check for updates
   */
  private async _checkForUpdates(btn: HTMLButtonElement, infoDiv: HTMLElement): Promise<void> {
    btn.disabled = true;
    btn.textContent = this._i18n.t('about.checking') || 'Checking...';

    try {
      // Try to use Tauri's updater plugin if available
      const result = await invoke<{ available: boolean; version?: string }>('check_for_updates');
      
      if (result.available) {
        infoDiv.innerHTML = `
          <span class="update-available">
            ${this._i18n.t('about.updateAvailable') || 'Update available'}: ${result.version}
            <button class="about-download-btn">${this._i18n.t('about.download') || 'Download'}</button>
          </span>
        `;
        
        const downloadBtn = infoDiv.querySelector('.about-download-btn');
        downloadBtn?.addEventListener('click', () => this._downloadUpdate());
      } else {
        infoDiv.innerHTML = `
          <span class="update-latest">
            ${this._i18n.t('about.upToDate') || 'You are up to date'}
          </span>
        `;
      }
    } catch (error) {
      // Updater not available, show manual check option
      infoDiv.innerHTML = `
        <span class="update-manual">
          ${this._i18n.t('about.manualCheck') || 'Visit GitHub to check for updates'}
          <a href="${APP_INFO.repository}/releases" target="_blank" rel="noopener noreferrer">
            ${this._i18n.t('about.viewReleases') || 'View Releases'}
          </a>
        </span>
      `;
    }

    btn.disabled = false;
    btn.textContent = this._i18n.t('about.checkForUpdates') || 'Check for Updates';
  }

  /**
   * Download update
   */
  private async _downloadUpdate(): Promise<void> {
    try {
      await invoke('download_update');
    } catch {
      // Fallback to opening releases page
      open(`${APP_INFO.repository}/releases`);
    }
  }

  /**
   * Create Dependencies tab content
   */
  private _createDependenciesContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'about-tab-content about-tab-dependencies';

    // Frontend dependencies
    const frontend = document.createElement('div');
    frontend.className = 'about-dep-section';
    
    const frontendTitle = document.createElement('h3');
    frontendTitle.textContent = this._i18n.t('about.frontendDependencies') || 'Frontend Dependencies';
    frontend.appendChild(frontendTitle);

    const frontendList = this._createDependencyList(FRONTEND_DEPENDENCIES);
    frontend.appendChild(frontendList);
    container.appendChild(frontend);

    // Rust dependencies
    const rust = document.createElement('div');
    rust.className = 'about-dep-section';
    
    const rustTitle = document.createElement('h3');
    rustTitle.textContent = this._i18n.t('about.rustDependencies') || 'Rust Dependencies';
    rust.appendChild(rustTitle);

    const rustList = this._createDependencyList(RUST_DEPENDENCIES);
    rust.appendChild(rustList);
    container.appendChild(rust);

    return container;
  }

  /**
   * Create dependency list
   */
  private _createDependencyList(deps: Dependency[]): HTMLElement {
    const list = document.createElement('div');
    list.className = 'about-dep-list';

    for (const dep of deps) {
      const item = document.createElement('div');
      item.className = 'about-dep-item';

      const name = document.createElement('span');
      name.className = 'about-dep-name';
      if (dep.url) {
        const link = this._createExternalLink(dep.url, dep.name);
        name.appendChild(link);
      } else {
        name.textContent = dep.name;
      }
      item.appendChild(name);

      const version = document.createElement('span');
      version.className = 'about-dep-version';
      version.textContent = dep.version;
      item.appendChild(version);

      if (dep.license) {
        const license = document.createElement('span');
        license.className = 'about-dep-license';
        license.textContent = dep.license;
        item.appendChild(license);
      }

      list.appendChild(item);
    }

    return list;
  }

  /**
   * Create Thanks tab content
   */
  private _createThanksContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'about-tab-content about-tab-thanks';

    const title = document.createElement('h3');
    title.textContent = this._i18n.t('about.specialThanks') || 'Special Thanks To';
    container.appendChild(title);

    const list = document.createElement('div');
    list.className = 'about-thanks-list';

    for (const thanks of SPECIAL_THANKS) {
      const item = document.createElement('div');
      item.className = 'about-thanks-item';

      const name = document.createElement('span');
      name.className = 'about-thanks-name';
      if ('url' in thanks && thanks.url) {
        const link = this._createExternalLink(thanks.url, thanks.name);
        name.appendChild(link);
      } else {
        name.textContent = thanks.name;
      }
      item.appendChild(name);

      const reason = document.createElement('span');
      reason.className = 'about-thanks-reason';
      reason.textContent = `— ${thanks.reason}`;
      item.appendChild(reason);

      list.appendChild(item);
    }

    container.appendChild(list);

    // Footer note
    const footer = document.createElement('p');
    footer.className = 'about-thanks-footer';
    footer.textContent = this._i18n.t('about.thanksFooter') || 
      'And to all contributors, bug reporters, and users who help make Medit better!';
    container.appendChild(footer);

    return container;
  }
}

export default AboutDialog;
