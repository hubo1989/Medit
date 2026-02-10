/**
 * Toolbar - UI component for editor toolbar with mode switcher
 * Provides buttons to switch between preview/edit/split modes
 */

import { EditorModeService, EditorMode } from '../editor';
import { I18nService } from '../i18n';

// SVG Icons for mode buttons
const ICONS = {
  preview: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  split: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="12" x2="12" y1="3" y2="17"/><line x1="2" x2="22" y1="21" x2="21"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

export interface ToolbarConfig {
  /** Container element to render toolbar into */
  container: HTMLElement;
  /** Editor mode service instance */
  modeService: EditorModeService;
  /** i18n service instance */
  i18n: I18nService;
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void;
  /** Whether settings panel is currently open */
  isSettingsOpen?: () => boolean;
}

/**
 * Toolbar class for managing editor mode switcher UI
 */
export class Toolbar {
  private _container: HTMLElement;
  private _modeService: EditorModeService;
  private _i18n: I18nService;
  private _onSettingsClick?: () => void;
  private _isSettingsOpen?: () => boolean;
  private _buttonGroup: HTMLElement | null = null;
  private _buttons: Map<EditorMode, HTMLButtonElement> = new Map();
  private _settingsButton: HTMLButtonElement | null = null;
  private _unsubscribe: (() => void) | null = null;
  private _i18nUnsubscribe: (() => void) | null = null;
  private _settingsUnsubscribe: (() => void) | null = null;

  constructor(config: ToolbarConfig) {
    this._container = config.container;
    this._modeService = config.modeService;
    this._i18n = config.i18n;
    this._onSettingsClick = config.onSettingsClick;
    this._isSettingsOpen = config.isSettingsOpen;

    this._render();
    this._setupEventListeners();
    this._updateActiveButton(this._modeService.getCurrentMode());
    this._updateSettingsButtonState();
  }

  /**
   * Render toolbar structure
   */
  private _render(): void {
    this._container.className = 'medit-toolbar';

    // Create toolbar sections
    const leftSection = this._createSection('medit-toolbar-left');
    const centerSection = this._createSection('medit-toolbar-center');
    const rightSection = this._createSection('medit-toolbar-right');

    // Create mode switcher button group in center
    this._buttonGroup = this._createModeButtonGroup();
    centerSection.appendChild(this._buttonGroup);

    // Create settings button in right section
    this._settingsButton = this._createSettingsButton();
    rightSection.appendChild(this._settingsButton);

    // Assemble toolbar
    this._container.appendChild(leftSection);
    this._container.appendChild(centerSection);
    this._container.appendChild(rightSection);
  }

  /**
   * Create a toolbar section container
   */
  private _createSection(className: string): HTMLElement {
    const section = document.createElement('div');
    section.className = className;
    return section;
  }

  /**
   * Create mode switcher button group
   */
  private _createModeButtonGroup(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'medit-mode-switcher';

    const modes: EditorMode[] = ['preview', 'edit', 'split'];

    for (const mode of modes) {
      const button = this._createModeButton(mode);
      this._buttons.set(mode, button);
      group.appendChild(button);
    }

    return group;
  }

  /**
   * Create a mode button
   */
  private _createModeButton(mode: EditorMode): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'medit-mode-btn';
    button.dataset.mode = mode;
    const label = this._i18n.getModeLabel(mode);
    button.title = label;
    button.innerHTML = `${ICONS[mode]}<span class="mode-label">${label}</span>`;

    return button;
  }

  /**
   * Create settings button
   */
  private _createSettingsButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'medit-settings-btn';
    button.title = '设置 (Ctrl+, / Cmd+,)';
    button.innerHTML = ICONS.settings;

    return button;
  }

  /**
   * Update settings button active state
   */
  private _updateSettingsButtonState(): void {
    if (!this._settingsButton) return;
    const isOpen = this._isSettingsOpen?.() ?? false;
    this._settingsButton.classList.toggle('active', isOpen);
  }

  /**
   * Update button labels when language changes
   */
  updateLabels(): void {
    for (const [mode, button] of this._buttons) {
      const label = this._i18n.getModeLabel(mode);
      button.title = label;
      const labelSpan = button.querySelector('.mode-label');
      if (labelSpan) {
        labelSpan.textContent = label;
      }
    }
  }

  /**
   * Setup event listeners
   */
  private _setupEventListeners(): void {
    // Button click handlers
    for (const [mode, button] of this._buttons) {
      button.addEventListener('click', () => {
        this._handleModeSwitch(mode);
      });
    }

    // Settings button click handler
    this._settingsButton?.addEventListener('click', () => {
      this._onSettingsClick?.();
    });

    // Subscribe to mode changes
    this._unsubscribe = this._modeService.onModeChange((newMode) => {
      this._updateActiveButton(newMode);
    });

    // Subscribe to language changes
    this._i18nUnsubscribe = this._i18n.onLanguageChange(() => {
      this.updateLabels();
    });

    // Setup keyboard shortcut for settings (Ctrl+, / Cmd+,)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',' && !e.shiftKey) {
        e.preventDefault();
        this._onSettingsClick?.();
      }
    });
  }

  /**
   * Update settings button state (call when panel opens/closes)
   */
  refreshSettingsButtonState(): void {
    this._updateSettingsButtonState();
  }

  /**
   * Handle mode switch button click
   */
  private _handleModeSwitch(mode: EditorMode): void {
    this._modeService.switchMode(mode);
  }

  /**
   * Update active button state
   */
  private _updateActiveButton(activeMode: EditorMode): void {
    for (const [mode, button] of this._buttons) {
      const isActive = mode === activeMode;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    }
  }

  /**
   * Destroy toolbar and cleanup
   */
  destroy(): void {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }

    if (this._i18nUnsubscribe) {
      this._i18nUnsubscribe();
      this._i18nUnsubscribe = null;
    }

    if (this._settingsUnsubscribe) {
      this._settingsUnsubscribe();
      this._settingsUnsubscribe = null;
    }

    this._buttons.clear();
    this._settingsButton = null;
    this._container.innerHTML = '';
  }

  /**
   * Get current mode from service
   */
  getCurrentMode(): EditorMode {
    return this._modeService.getCurrentMode();
  }
}

export default Toolbar;
