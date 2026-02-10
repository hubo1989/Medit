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

// Default keyboard shortcuts (readonly display)
const DEFAULT_SHORTCUTS = [
  { key: 'Ctrl+S / Cmd+S', action: '保存文件' },
  { key: 'Ctrl+N / Cmd+N', action: '新建文件' },
  { key: 'Ctrl+O / Cmd+O', action: '打开文件' },
  { key: 'Ctrl+Shift+S', action: '另存为' },
  { key: 'Ctrl+Shift+P', action: '切换预览模式' },
  { key: 'Ctrl+Shift+E', action: '切换编辑模式' },
  { key: 'Ctrl+Shift+D', action: '切换分屏模式' },
  { key: 'Ctrl+Plus', action: '放大' },
  { key: 'Ctrl+Minus', action: '缩小' },
  { key: 'Ctrl+0', action: '重置缩放' },
  { key: 'Ctrl+Q / Cmd+Q', action: '退出应用' },
];

/**
 * PreferencesPanel class for managing application settings UI
 */
export class PreferencesPanel {
  private _container: HTMLElement;
  private _preferences: PreferencesService;
  private _onChange?: (key: string, value: PreferenceValue) => void;
  private _panel: HTMLElement | null = null;
  private _overlay: HTMLElement | null = null;
  private _isOpen = false;
  private _currentCategory: SettingsCategory = 'general';
  private _unsubscribe: (() => void) | null = null;
  private _inputElements: Map<string, HTMLElement> = new Map();

  private _categories: CategoryConfig[] = [
    {
      id: 'general',
      label: '通用',
      icon: CATEGORY_ICONS.general,
      fields: [
        {
          key: 'general.language',
          type: 'select',
          label: '语言',
          description: '应用界面语言',
          options: [
            { value: 'zh', label: '简体中文' },
            { value: 'en', label: 'English' },
          ],
        },
        {
          key: 'general.theme',
          type: 'select',
          label: '主题',
          description: '应用外观主题',
          options: [
            { value: 'light', label: '浅色' },
            { value: 'dark', label: '深色' },
            { value: 'system', label: '跟随系统' },
          ],
        },
        {
          key: 'general.startupBehavior',
          type: 'select',
          label: '启动行为',
          description: '应用启动时的默认操作',
          options: [
            { value: 'new', label: '新建文档' },
            { value: 'recent', label: '打开最近文档' },
            { value: 'welcome', label: '显示欢迎页' },
          ],
        },
        {
          key: 'general.autoSave',
          type: 'checkbox',
          label: '自动保存',
          description: '自动保存文档更改',
        },
        {
          key: 'general.autoSaveInterval',
          type: 'number',
          label: '自动保存间隔（秒）',
          description: '自动保存的时间间隔',
          min: 5,
          max: 300,
          step: 5,
        },
      ],
    },
    {
      id: 'editor',
      label: '编辑器',
      icon: CATEGORY_ICONS.editor,
      fields: [
        {
          key: 'editor.fontSize',
          type: 'number',
          label: '字体大小（px）',
          description: '编辑器字体大小',
          min: 10,
          max: 32,
          step: 1,
        },
        {
          key: 'editor.fontFamily',
          type: 'select',
          label: '字体',
          description: '编辑器字体家族',
          options: [
            { value: 'system', label: '系统默认' },
            { value: 'monospace', label: '等宽字体' },
            { value: 'serif', label: '衬线字体' },
            { value: 'sans-serif', label: '无衬线字体' },
          ],
        },
        {
          key: 'editor.lineHeight',
          type: 'number',
          label: '行高',
          description: '编辑器行高倍数',
          min: 1,
          max: 3,
          step: 0.1,
        },
        {
          key: 'editor.tabWidth',
          type: 'number',
          label: 'Tab 宽度',
          description: 'Tab 字符宽度（空格数）',
          min: 2,
          max: 8,
          step: 2,
        },
        {
          key: 'editor.showLineNumbers',
          type: 'checkbox',
          label: '显示行号',
          description: '在编辑器左侧显示行号',
        },
      ],
    },
    {
      id: 'preview',
      label: '预览',
      icon: CATEGORY_ICONS.preview,
      fields: [
        {
          key: 'preview.syncScroll',
          type: 'checkbox',
          label: '同步滚动',
          description: '编辑器和预览同步滚动',
        },
        {
          key: 'preview.wordWrap',
          type: 'checkbox',
          label: '自动换行',
          description: '预览内容自动换行',
        },
        {
          key: 'preview.codeTheme',
          type: 'select',
          label: '代码高亮主题',
          description: '代码块的高亮样式',
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
      label: '快捷键',
      icon: CATEGORY_ICONS.shortcuts,
      fields: [],
    },
  ];

  constructor(config: PreferencesPanelConfig) {
    this._container = config.container;
    this._preferences = config.preferences;
    this._onChange = config.onChange;

    this._render();
    this._setupEventListeners();
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
    title.textContent = '设置';
    sidebar.appendChild(title);

    const nav = document.createElement('nav');
    nav.className = 'preferences-nav';

    for (const category of this._categories) {
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
    headerTitle.textContent = this._categories[0].label;
    header.appendChild(headerTitle);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'preferences-close-btn';
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
    closeBtn.title = '关闭';
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
    const category = this._categories.find((c) => c.id === this._currentCategory);
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

    const categoryConfig = this._categories.find((c) => c.id === category);
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

    // Label
    const label = document.createElement('label');
    label.className = 'preferences-field-label';
    label.textContent = field.label;
    wrapper.appendChild(label);

    // Description
    if (field.description) {
      const desc = document.createElement('div');
      desc.className = 'preferences-field-description';
      desc.textContent = field.description;
      wrapper.appendChild(desc);
    }

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
        input = this._createNumber(field, currentValue as number);
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
   * Create number input
   */
  private _createNumber(field: SettingField, value: number): HTMLElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'preferences-input';
    input.value = String(value ?? field.min ?? 0);

    if (field.min !== undefined) input.min = String(field.min);
    if (field.max !== undefined) input.max = String(field.max);
    if (field.step !== undefined) input.step = String(field.step);

    input.addEventListener('change', () => {
      const numValue = parseFloat(input.value);
      this._handleValueChange(field.key, numValue);
    });

    return input;
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
    const wrapper = document.createElement('div');
    wrapper.className = 'preferences-shortcuts';

    const desc = document.createElement('p');
    desc.className = 'preferences-shortcuts-desc';
    desc.textContent = '以下是当前可用的快捷键列表（暂不支持自定义）：';
    wrapper.appendChild(desc);

    const list = document.createElement('div');
    list.className = 'preferences-shortcuts-list';

    for (const shortcut of DEFAULT_SHORTCUTS) {
      const item = document.createElement('div');
      item.className = 'preferences-shortcut-item';

      const key = document.createElement('kbd');
      key.className = 'preferences-shortcut-key';
      key.textContent = shortcut.key;

      const action = document.createElement('span');
      action.className = 'preferences-shortcut-action';
      action.textContent = shortcut.action;

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
  }

  /**
   * Update input value when preference changes externally
   */
  private _updateInputValue(key: string, value: PreferenceValue): void {
    const input = this._inputElements.get(key);
    if (!input) return;

    if (input instanceof HTMLSelectElement) {
      input.value = String(value);
    } else if (input instanceof HTMLInputElement) {
      if (input.type === 'checkbox') {
        input.checked = Boolean(value);
      } else {
        input.value = String(value);
      }
    }
  }
}

export default PreferencesPanel;
