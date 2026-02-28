/**
 * Diagram Menu - Dropdown menu for inserting diagram templates
 */

import { DIAGRAM_CATEGORIES, type DiagramTemplate } from './diagram-templates.js';
import { EDIT_ICONS } from './icons.js';

export interface DiagramMenuConfig {
  /** Callback when a template is selected */
  onSelect: (template: string) => void;
}

export class DiagramMenu {
  private _onSelect: (template: string) => void;
  private _button: HTMLButtonElement | null = null;
  private _dropdown: HTMLDivElement | null = null;
  private _isOpen = false;

  constructor(config: DiagramMenuConfig) {
    this._onSelect = config.onSelect;
  }

  /**
   * Create and return the menu button element
   */
  createButton(): HTMLButtonElement {
    this._button = document.createElement('button');
    this._button.type = 'button';
    this._button.className = 'medit-edit-btn medit-diagram-btn';
    this._button.title = '插入图表';
    this._button.innerHTML = `${EDIT_ICONS.diagram}${EDIT_ICONS.chevronDown}`;
    this._button.setAttribute('aria-label', '插入图表');
    this._button.setAttribute('aria-haspopup', 'true');
    this._button.setAttribute('aria-expanded', 'false');

    this._button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    return this._button;
  }

  /**
   * Create the dropdown panel
   */
  private _createDropdown(): HTMLDivElement {
    this._dropdown = document.createElement('div');
    this._dropdown.className = 'medit-diagram-dropdown';
    this._dropdown.setAttribute('role', 'menu');

    for (const category of DIAGRAM_CATEGORIES) {
      const categoryEl = document.createElement('div');
      categoryEl.className = 'medit-diagram-category';

      const categoryHeader = document.createElement('div');
      categoryHeader.className = 'medit-diagram-category-header';
      categoryHeader.textContent = category.label;
      categoryEl.appendChild(categoryHeader);

      for (const template of category.templates) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'medit-diagram-item';
        item.textContent = template.label;
        item.setAttribute('role', 'menuitem');
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this._handleSelect(template);
        });
        categoryEl.appendChild(item);
      }

      this._dropdown.appendChild(categoryEl);
    }

    return this._dropdown;
  }

  /**
   * Handle template selection
   */
  private _handleSelect(template: DiagramTemplate): void {
    this._onSelect(template.template);
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

    if (!this._dropdown) {
      this._createDropdown();
    }

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

export default DiagramMenu;
