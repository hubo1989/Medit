/**
 * PreferencesPanel - UI component for application settings
 * Provides categorized settings with open/close animations
 */

import { PreferencesService, PreferenceValue } from '../services/preferences-service.js';
import { I18nService } from '../i18n';

export type SettingsCategory = 'general' | 'editor' | 'preview' | 'shortcuts';

export interface PreferencesPanelConfig {
  /** Container element to render panel into */
  container: HTMLElement;
  /** Preferences service instance */
  preferences: PreferencesService;
  /** i18n service instance */
  i18n: I18nService;
  /** Callback when settings change */
  onChange?: (key: string, value: PreferenceValue) => void;
}

interface SettingField {
  key: string;
  type: 'select' | 'number' | 'checkbox' | 'text' | 'readonly';
  label: string;
  description?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

interface CategoryConfig {
  id: SettingsCategory;
  label: string;
  icon: string;
  fields: SettingField[];
}

// SVG Icons for categories
const CATEGORY_ICONS: Record<SettingsCategory, string> = {
  general: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 6.34L2.1 2.1m17.8 17.8l-4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.24-4.24l-4.24 4.24M6.34 6.34l-4.24-4.24"/></svg>`,
  editor: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  preview: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  shortcuts: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/></svg>`,
};

// Shortcut key bindings (actions resolved via i18n)
const SHORTCUT_KEYS = [
  { key: 'Ctrl+S / Cmd+S', actionKey: 'preferences.shortcutList.saveFile' },
  { key: 'Ctrl+N / Cmd+N', actionKey: 'preferences.shortcutList.newFile' },
  { key: 'Ctrl+O / Cmd+O', actionKey: 'preferences.shortcutList.openFile' },
  { key: 'Ctrl+Shift+S', actionKey: 'preferences.shortcutList.saveAs' },
  { key: 'Ctrl+Shift+P', actionKey: 'preferences.shortcutList.togglePreview' },
  { key: 'Ctrl+Shift+E', actionKey: 'preferences.shortcutList.toggleEdit' },
  { key: 'Ctrl+Shift+D', actionKey: 'preferences.shortcutList.toggleSplit' },
  { key: 'Ctrl+Plus', actionKey: 'preferences.shortcutList.zoomIn' },
  { key: 'Ctrl+Minus', actionKey: 'preferences.shortcutList.zoomOut' },
  { key: 'Ctrl+0', actionKey: 'preferences.shortcutList.resetZoom' },
  { key: 'Ctrl+Q / Cmd+Q', actionKey: 'preferences.shortcutList.quit' },
];

/**
 * PreferencesPanel class for managing application settings UI
 */
export class PreferencesPanel {
  private _container: HTMLElement;
  private _preferences: PreferencesService;
  private _i18n: I18nService;
  private _onChange?: (key: string, value: PreferenceValue) => void;
  private _panel: HTMLElement | null = null;
  private _overlay: HTMLElement | null = null;
  private _isOpen = false;
  private _currentCategory: SettingsCategory = 'general';
  private _unsubscribe: (() => void) | null = null;
  private _unsubscribeI18n: (() => void) | null = null;
  private _inputElements: Map<string, HTMLElement> = new Map();

  constructor(config: PreferencesPanelConfig) {
    this._container = config.container;
    this._preferences = config.preferences;
    this._i18n = config.i18n;
    this._onChange = config.onChange;

    this._render();
    this._setupEventListeners();
  }

  /**
   * Build categories config dynamically from i18n translations
   */
  private _getCategories(): CategoryConfig[] {
    const t = (key: string) => this._i18n.t(key as Parameters<I18nService['t']>[0]);
    return [
      {
        id: 'general',
        label: t('preferences.general'),
        icon: CATEGORY_ICONS.general,
        fields: [
          {
            key: 'general.language',
            type: 'select',
            label: t('preferences.language'),
            description: t('preferences.desc.language'),
            options: [
              { value: 'zh', label: t('preferences.options.zhCN') },
              { value: 'en', label: t('preferences.options.en') },
            ],
          },
          {
            key: 'general.theme',
            type: 'select',
            label: t('preferences.theme'),
            description: t('preferences.desc.theme'),
            options: [
              { value: 'light', label: t('preferences.options.light') },
              { value: 'dark', label: t('preferences.options.dark') },
              { value: 'auto', label: t('preferences.options.auto') },
            ],
          },
          {
            key: 'general.startupBehavior',
            type: 'select',
            label: t('preferences.startupBehavior'),
            description: t('preferences.desc.startupBehavior'),
            options: [
              { value: 'new', label: t('preferences.options.newDoc') },
              { value: 'recent', label: t('preferences.options.recent') },
              { value: 'welcome', label: t('preferences.options.welcome') },
            ],
          },
          {
            key: 'general.autoSave',
            type: 'checkbox',
            label: t('preferences.autoSave'),
            description: t('preferences.desc.autoSave'),
          },
          {
            key: 'general.autoSaveInterval',
            type: 'number',
            label: t('preferences.autoSaveInterval'),
            description: t('preferences.desc.autoSaveInterval'),
            min: 5,
            max: 300,
            step: 5,
          },
        ],
      },
      {
        id: 'editor',
        label: t('preferences.editor'),
        icon: CATEGORY_ICONS.editor,
        fields: [
          {
            key: 'editor.fontSize',
            type: 'number',
            label: t('preferences.fontSize'),
            description: t('preferences.desc.fontSize'),
            min: 12,
            max: 24,
            step: 1,
          },
          {
            key: 'editor.fontFamily',
            type: 'select',
            label: t('preferences.fontFamily'),
            description: t('preferences.desc.fontFamily'),
            options: [
              { value: 'system', label: t('preferences.options.system') },
              { value: 'monospace', label: t('preferences.options.monospace') },
              { value: 'serif', label: t('preferences.options.serif') },
              { value: 'sans-serif', label: t('preferences.options.sansSerif') },
            ],
          },
          {
            key: 'editor.lineHeight',
            type: 'number',
            label: t('preferences.lineHeight'),
            description: t('preferences.desc.lineHeight'),
            min: 1.2,
            max: 2.0,
            step: 0.1,
          },
          {
            key: 'editor.tabWidth',
            type: 'select',
            label: t('preferences.tabWidth'),
            description: t('preferences.desc.tabWidth'),
            options: [
              { value: '2', label: t('preferences.options.twoSpaces') },
              { value: '4', label: t('preferences.options.fourSpaces') },
            ],
          },
          {
            key: 'editor.showLineNumbers',
            type: 'checkbox',
            label: t('preferences.showLineNumbers'),
            description: t('preferences.desc.showLineNumbers'),
          },
        ],
      },
      {
        id: 'preview',
        label: t('preferences.preview'),
        icon: CATEGORY_ICONS.preview,
        fields: [
          {
            key: 'preview.syncScroll',
            type: 'checkbox',
            label: t('preferences.syncScroll'),
            description: t('preferences.desc.syncScroll'),
          },
          {
            key: 'preview.wordWrap',
            type: 'checkbox',
            label: t('preferences.wordWrap'),
            description: t('preferences.desc.wordWrap'),
          },
          {
            key: 'preview.codeTheme',
            type: 'select',
            label: t('preferences.codeTheme'),
            description: t('preferences.desc.codeTheme'),
            options: [
              { value: 'github', label: 'GitHub' },
              { value: 'monokai', label: 'Monokai' },
              { value: 'dracula', label: 'Dracula' },
              { value: 'atom-one-dark', label: 'Atom One Dark' },
              { value: 'vs2015', label: 'VS 2015' },
            ],
          },
        ],
      },
      {
        id: 'shortcuts',
        label: t('preferences.shortcuts'),
        icon: CATEGORY_ICONS.shortcuts,
        fields: [],
      },
    ];
  }

  /**
   * Check if panel is currently open
   */
  isOpen(): boolean {
    return this._isOpen;
  }

  /**
   * Open the preferences panel with animation
   */
  open(category?: SettingsCategory): void {
    if (this._isOpen) {
      if (category && category !== this._currentCategory) {
        this._switchCategory(category);
      }
      return;
    }

    this._isOpen = true;
    if (category) {
      this._currentCategory = category;
    }

    // Show overlay
    if (this._overlay) {
      this._overlay.style.display = 'block';
      requestAnimationFrame(() => {
        if (this._overlay) {
          this._overlay.style.opacity = '1';
        }
      });
    }

    // Show panel with animation
    if (this._panel) {
      this._panel.style.display = 'flex';
      this._panel.classList.remove('closing');
      requestAnimationFrame(() => {
        if (this._panel) {
          this._panel.classList.add('open');
        }
      });
    }

    // Render current category
    this._renderCategoryContent(this._currentCategory);
    this._updateActiveTab();
  }

  /**
   * Close the preferences panel with animation
   */
  close(): void {
    if (!this._isOpen) return;

    this._isOpen = false;

    // Animate panel out
    if (this._panel) {
      this._panel.classList.remove('open');
      this._panel.classList.add('closing');
    }

    // Fade out overlay
    if (this._overlay) {
      this._overlay.style.opacity = '0';
    }

    // Hide after animation
    setTimeout(() => {
      if (!this._isOpen) {
        if (this._panel) {
          this._panel.style.display = 'none';
          this._panel.classList.remove('closing');
        }
        if (this._overlay) {
          this._overlay.style.display = 'none';
        }
      }
    }, 300);
  }

  /**
   * Toggle panel open/closed
   */
  toggle(category?: SettingsCategory): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open(category);
    }
  }

  /**
   * Get current active category
   */
  getCurrentCategory(): SettingsCategory {
    return this._currentCategory;
  }

  /**
   * Switch to a specific category
   */
  switchCategory(category: SettingsCategory): void {
    if (this._isOpen) {
      this._switchCategory(category);
    } else {
      this.open(category);
    }
  }

  /**
   * Destroy panel and cleanup
   */
  destroy(): void {
    this.close();

    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }

    if (this._unsubscribeI18n) {
      this._unsubscribeI18n();
      this._unsubscribeI18n = null;
    }

    this._inputElements.clear();

    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }

    if (this._panel) {
      this._panel.remove();
      this._panel = null;
    }
  }

  /**
   * Render the panel structure
   */
  private _render(): void {
    // Create overlay
    this._overlay = document.createElement('div');
    this._overlay.className = 'preferences-overlay';
    this._overlay.style.display = 'none';
    this._container.appendChild(this._overlay);

    // Create panel
    this._panel = document.createElement('div');
    this._panel.className = 'preferences-panel';
    this._panel.style.display = 'none';

    // Create sidebar
    const sidebar = this._createSidebar();
    this._panel.appendChild(sidebar);

    // Create content area
    const content = this._createContentArea();
    this._panel.appendChild(content);

    this._container.appendChild(this._panel);
  }

  /**
   * Create sidebar with category tabs
   */
  private _createSidebar(): HTMLElement {
    const sidebar = document.createElement('div');
    sidebar.className = 'preferences-sidebar';

    const title = document.createElement('div');
    title.className = 'preferences-title';
    title.textContent = this._i18n.t('preferences.title');
    sidebar.appendChild(title);

    const nav = document.createElement('nav');
    nav.className = 'preferences-nav';

    const categories = this._getCategories();
    for (const category of categories) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'preferences-tab';
      tab.dataset.category = category.id;
      tab.innerHTML = `${category.icon}<span>${category.label}</span>`;

      tab.addEventListener('click', () => {
        this._switchCategory(category.id);
      });

      nav.appendChild(tab);
    }

    sidebar.appendChild(nav);
    return sidebar;
  }

  /**
   * Create content area
   */
  private _createContentArea(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'preferences-content';

    // Header
    const header = document.createElement('div');
    header.className = 'preferences-header';

    const headerTitle = document.createElement('h2');
    headerTitle.className = 'preferences-category-title';
    headerTitle.textContent = this._getCategories()[0].label;
    header.appendChild(headerTitle);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'preferences-close-btn';
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
    closeBtn.title = this._i18n.t('preferences.close');
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    content.appendChild(header);

    // Content body
    const body = document.createElement('div');
    body.className = 'preferences-body';
    content.appendChild(body);

    return content;
  }

  /**
   * Switch to a different category
   */
  private _switchCategory(category: SettingsCategory): void {
    if (category === this._currentCategory) return;

    this._currentCategory = category;
    this._renderCategoryContent(category);
    this._updateActiveTab();
  }

  /**
   * Update active tab styling
   */
  private _updateActiveTab(): void {
    const tabs = this._panel?.querySelectorAll('.preferences-tab');
    tabs?.forEach((tab) => {
      const isActive = tab.getAttribute('data-category') === this._currentCategory;
      tab.classList.toggle('active', isActive);
    });

    // Update header title
    const categories = this._getCategories();
    const category = categories.find((c) => c.id === this._currentCategory);
    const headerTitle = this._panel?.querySelector('.preferences-category-title');
    if (category && headerTitle) {
      headerTitle.textContent = category.label;
    }
  }

  /**
   * Render content for a specific category
   */
  private _renderCategoryContent(category: SettingsCategory): void {
    const body = this._panel?.querySelector('.preferences-body');
    if (!body) return;

    body.innerHTML = '';
    this._inputElements.clear();

    if (category === 'shortcuts') {
      this._renderShortcutsContent(body as HTMLElement);
      return;
    }

    const categoryConfig = this._getCategories().find((c) => c.id === category);
    if (!categoryConfig) return;

    const form = document.createElement('div');
    form.className = 'preferences-form';

    for (const field of categoryConfig.fields) {
      const fieldEl = this._createFieldElement(field);
      form.appendChild(fieldEl);
    }

    body.appendChild(form);
  }

  /**
   * Create a form field element
   */
  private _createFieldElement(field: SettingField): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'preferences-field';

    // Info group (label + description)
    const info = document.createElement('div');
    info.className = 'preferences-field-info';

    const label = document.createElement('label');
    label.className = 'preferences-field-label';
    label.textContent = field.label;
    info.appendChild(label);

    if (field.description) {
      const desc = document.createElement('div');
      desc.className = 'preferences-field-description';
      desc.textContent = field.description;
      info.appendChild(desc);
    }

    wrapper.appendChild(info);

    // Input
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'preferences-field-input';

    let input: HTMLElement;
    const currentValue = this._preferences.get(field.key);

    switch (field.type) {
      case 'select':
        input = this._createSelect(field, currentValue as string);
        break;
      case 'number':
        input = this._createRangeSlider(field, currentValue as number);
        break;
      case 'checkbox':
        input = this._createCheckbox(field, currentValue as boolean);
        break;
      case 'text':
        input = this._createText(field, currentValue as string);
        break;
      default:
        input = document.createElement('input');
    }

    inputWrapper.appendChild(input);
    wrapper.appendChild(inputWrapper);

    this._inputElements.set(field.key, input);

    return wrapper;
  }

  /**
   * Create select input
   */
  private _createSelect(field: SettingField, value: string): HTMLElement {
    const select = document.createElement('select');
    select.className = 'preferences-select';

    for (const option of field.options || []) {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      select.appendChild(opt);
    }

    select.value = value ?? field.options?.[0]?.value ?? '';

    select.addEventListener('change', () => {
      this._handleValueChange(field.key, select.value);
    });

    return select;
  }

  /**
   * Create range slider with value display
   */
  private _createRangeSlider(field: SettingField, value: number): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'preferences-range-wrapper';

    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'preferences-range';
    range.value = String(value ?? field.min ?? 0);

    if (field.min !== undefined) range.min = String(field.min);
    if (field.max !== undefined) range.max = String(field.max);
    if (field.step !== undefined) range.step = String(field.step);

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'preferences-range-value';
    valueDisplay.textContent = String(value ?? field.min ?? 0);

    range.addEventListener('input', () => {
      valueDisplay.textContent = range.value;
    });

    range.addEventListener('change', () => {
      const numValue = parseFloat(range.value);
      valueDisplay.textContent = range.value;
      this._handleValueChange(field.key, numValue);
    });

    wrapper.appendChild(range);
    wrapper.appendChild(valueDisplay);

    return wrapper;
  }

  /**
   * Create checkbox input
   */
  private _createCheckbox(field: SettingField, value: boolean): HTMLElement {
    const wrapper = document.createElement('label');
    wrapper.className = 'preferences-checkbox-wrapper';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'preferences-checkbox';
    input.checked = value ?? false;

    const slider = document.createElement('span');
    slider.className = 'preferences-checkbox-slider';

    wrapper.appendChild(input);
    wrapper.appendChild(slider);

    input.addEventListener('change', () => {
      this._handleValueChange(field.key, input.checked);
    });

    return wrapper;
  }

  /**
   * Create text input
   */
  private _createText(field: SettingField, value: string): HTMLElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'preferences-input';
    input.value = value ?? '';

    input.addEventListener('change', () => {
      this._handleValueChange(field.key, input.value);
    });

    return input;
  }

  /**
   * Render shortcuts content (readonly)
   */
  private _renderShortcutsContent(container: HTMLElement): void {
    const t = (key: string) => this._i18n.t(key as Parameters<I18nService['t']>[0]);

    const wrapper = document.createElement('div');
    wrapper.className = 'preferences-shortcuts';

    const desc = document.createElement('p');
    desc.className = 'preferences-shortcuts-desc';
    desc.textContent = t('preferences.shortcutList.description');
    wrapper.appendChild(desc);

    const list = document.createElement('div');
    list.className = 'preferences-shortcuts-list';

    for (const shortcut of SHORTCUT_KEYS) {
      const item = document.createElement('div');
      item.className = 'preferences-shortcut-item';

      const key = document.createElement('kbd');
      key.className = 'preferences-shortcut-key';
      key.textContent = shortcut.key;

      const action = document.createElement('span');
      action.className = 'preferences-shortcut-action';
      action.textContent = t(shortcut.actionKey);

      item.appendChild(key);
      item.appendChild(action);
      list.appendChild(item);
    }

    wrapper.appendChild(list);
    container.appendChild(wrapper);
  }

  /**
   * Handle value change from input
   */
  private _handleValueChange(key: string, value: PreferenceValue): void {
    this._preferences.set(key, value);
    this._onChange?.(key, value);
  }

  /**
   * Setup global event listeners
   */
  private _setupEventListeners(): void {
    // Close on overlay click
    this._overlay?.addEventListener('click', () => {
      this.close();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isOpen) {
        this.close();
      }
    });

    // Subscribe to preference changes
    this._unsubscribe = this._preferences.onAnyChange((key, newValue) => {
      this._updateInputValue(key, newValue);
    });

    // Subscribe to language changes for real-time UI update
    this._unsubscribeI18n = this._i18n.onLanguageChange(() => {
      this._refreshUI();
    });
  }

  /**
   * Refresh entire panel UI when language changes
   */
  private _refreshUI(): void {
    if (!this._panel) return;

    // Update sidebar title
    const titleEl = this._panel.querySelector('.preferences-title');
    if (titleEl) {
      titleEl.textContent = this._i18n.t('preferences.title');
    }

    // Update close button title
    const closeBtn = this._panel.querySelector<HTMLButtonElement>('.preferences-close-btn');
    if (closeBtn) {
      closeBtn.title = this._i18n.t('preferences.close');
    }

    // Update sidebar tab labels
    const categories = this._getCategories();
    const tabs = this._panel.querySelectorAll('.preferences-tab');
    tabs.forEach((tab) => {
      const catId = tab.getAttribute('data-category');
      const cat = categories.find((c) => c.id === catId);
      if (cat) {
        const span = tab.querySelector('span');
        if (span) span.textContent = cat.label;
      }
    });

    // Re-render current category content
    if (this._isOpen) {
      this._renderCategoryContent(this._currentCategory);
      this._updateActiveTab();
    }
  }

  /**
   * Update input value when preference changes externally
   */
  private _updateInputValue(key: string, value: PreferenceValue): void {
    const element = this._inputElements.get(key);
    if (!element) return;

    if (element instanceof HTMLSelectElement) {
      element.value = String(value);
    } else if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        element.checked = Boolean(value);
      } else {
        element.value = String(value);
      }
    } else if (element.classList.contains('preferences-range-wrapper')) {
      const range = element.querySelector<HTMLInputElement>('.preferences-range');
      const display = element.querySelector('.preferences-range-value');
      if (range) range.value = String(value);
      if (display) display.textContent = String(value);
    }
  }
}

export default PreferencesPanel;
