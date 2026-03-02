/**
 * Heading Menu - Dropdown menu for inserting heading levels 1-5
 */

import type { I18nService } from '../i18n/index.js';
import { EDIT_ICONS } from './icons.js';

export interface HeadingMenuConfig {
  /** Callback when a heading level is selected */
  onSelect: (level: 1 | 2 | 3 | 4 | 5) => void;
  /** i18n service for translating labels */
  i18n: I18nService;
}

export class HeadingMenu {
  private _onSelect: (level: 1 | 2 | 3 | 4 | 5) => void;
  private _i18n: I18nService;
  private _button: HTMLButtonElement | null = null;
  private _dropdown: HTMLDivElement | null = null;
  private _isOpen = false;

  constructor(config: HeadingMenuConfig) {
    this._onSelect = config.onSelect;
    this._i18n = config.i18n;
  }

  /**
   * Create and return the menu button element
   */
  createButton(): HTMLButtonElement {
    this._button = document.createElement('button');
    this._button.type = 'button';
    this._button.className = 'medit-edit-btn medit-heading-btn';
    this._button.title = this._i18n.translate('toolbar.heading');
    this._button.innerHTML = `${EDIT_ICONS.heading}${EDIT_ICONS.chevronDown}`;
    this._button.setAttribute('aria-label', this._i18n.translate('toolbar.heading'));
    this._button.setAttribute('aria-haspopup', 'true');
    this._button.setAttribute('aria-expanded', 'false');

    this._button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    return this._button;
  }

  /**
   * Update labels when language changes
   */
  updateLabels(): void {
    if (this._button) {
      const label = this._i18n.translate('toolbar.heading');
      this._button.title = label;
      this._button.setAttribute('aria-label', label);
    }
    // Dropdown will be recreated on next open with new labels
    if (this._isOpen && this._dropdown) {
      this.close();
    }
  }

  /**
   * Create the dropdown panel
   */
  private _createDropdown(): HTMLDivElement {
    this._dropdown = document.createElement('div');
    this._dropdown.className = 'medit-heading-dropdown';
    this._dropdown.setAttribute('role', 'menu');

    const levels: Array<{ level: 1 | 2 | 3 | 4 | 5; labelKey: string; shortcut: string }> = [
      { level: 1, labelKey: 'toolbar.heading1', shortcut: 'Ctrl+1' },
      { level: 2, labelKey: 'toolbar.heading2', shortcut: 'Ctrl+2' },
      { level: 3, labelKey: 'toolbar.heading3', shortcut: 'Ctrl+3' },
      { level: 4, labelKey: 'toolbar.heading4', shortcut: 'Ctrl+4' },
      { level: 5, labelKey: 'toolbar.heading5', shortcut: 'Ctrl+5' },
    ];

    for (const { level, labelKey, shortcut } of levels) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'medit-heading-item';
      item.setAttribute('role', 'menuitem');
      
      // Create level indicator (H1, H2, etc.)
      const levelIndicator = document.createElement('span');
      levelIndicator.className = 'medit-heading-level';
      levelIndicator.textContent = `H${level}`;
      
      // Create label
      const label = document.createElement('span');
      label.className = 'medit-heading-label';
      label.textContent = this._i18n.translate(labelKey);
      
      // Create shortcut hint
      const shortcutHint = document.createElement('span');
      shortcutHint.className = 'medit-heading-shortcut';
      shortcutHint.textContent = shortcut;
      
      item.appendChild(levelIndicator);
      item.appendChild(label);
      item.appendChild(shortcutHint);
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleSelect(level);
      });
      
      this._dropdown.appendChild(item);
    }

    return this._dropdown;
  }

  /**
   * Handle heading level selection
   */
  private _handleSelect(level: 1 | 2 | 3 | 4 | 5): void {
    this._onSelect(level);
    this.close();
  }

  /**
   * Toggle menu open/close
   */
  toggle(): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open the menu
   */
  open(): void {
    if (this._isOpen || !this._button) return;

    // Always recreate dropdown to ensure fresh translations
    this._createDropdown();

    if (!this._dropdown) return;

    // Position dropdown below button (account for page scroll)
    const buttonRect = this._button.getBoundingClientRect();
    this._dropdown.style.position = 'absolute';
    this._dropdown.style.top = `${buttonRect.bottom + window.scrollY + 4}px`;
    this._dropdown.style.left = `${buttonRect.left + window.scrollX}px`;

    document.body.appendChild(this._dropdown);
    this._isOpen = true;
    this._button.classList.add('active');
    this._button.setAttribute('aria-expanded', 'true');

    // Close on outside click
    requestAnimationFrame(() => {
      document.addEventListener('click', this._handleOutsideClick);
      document.addEventListener('keydown', this._handleKeyDown);
    });
  }

  /**
   * Close the menu
   */
  close(): void {
    if (!this._isOpen) return;

    if (this._dropdown?.parentNode) {
      this._dropdown.parentNode.removeChild(this._dropdown);
    }
    this._isOpen = false;
    this._button?.classList.remove('active');
    this._button?.setAttribute('aria-expanded', 'false');

    document.removeEventListener('click', this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Handle clicks outside the menu
   */
  private _handleOutsideClick = (e: MouseEvent): void => {
    if (
      this._button?.contains(e.target as Node) ||
      this._dropdown?.contains(e.target as Node)
    ) {
      return;
    }
    this.close();
  };

  /**
   * Handle keyboard events
   */
  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.close();
      this._button?.focus();
    }
  };

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.close();
    this._button = null;
    this._dropdown = null;
  }
}

export default HeadingMenu;
