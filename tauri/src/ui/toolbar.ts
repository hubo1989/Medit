/**
 * Toolbar - UI component for editor toolbar with mode switcher
 * Provides buttons to switch between preview/edit/split modes
 */

import { EditorModeService, EditorMode } from '../editor';

// SVG Icons for mode buttons
const ICONS = {
  preview: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  split: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="12" x2="12" y1="3" y2="17"/><line x1="2" x2="22" y1="21" x2="21"/></svg>`,
};

// Button labels
const LABELS: Record<EditorMode, string> = {
  preview: '预览',
  edit: '编辑',
  split: '分屏',
};

export interface ToolbarConfig {
  /** Container element to render toolbar into */
  container: HTMLElement;
  /** Editor mode service instance */
  modeService: EditorModeService;
}

/**
 * Toolbar class for managing editor mode switcher UI
 */
export class Toolbar {
  private _container: HTMLElement;
  private _modeService: EditorModeService;
  private _buttonGroup: HTMLElement | null = null;
  private _buttons: Map<EditorMode, HTMLButtonElement> = new Map();
  private _unsubscribe: (() => void) | null = null;

  constructor(config: ToolbarConfig) {
    this._container = config.container;
    this._modeService = config.modeService;

    this._render();
    this._setupEventListeners();
    this._updateActiveButton(this._modeService.getCurrentMode());
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
    button.title = LABELS[mode];
    button.innerHTML = `${ICONS[mode]}<span>${LABELS[mode]}</span>`;

    return button;
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

    // Subscribe to mode changes
    this._unsubscribe = this._modeService.onModeChange((newMode) => {
      this._updateActiveButton(newMode);
    });
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

    this._buttons.clear();
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
