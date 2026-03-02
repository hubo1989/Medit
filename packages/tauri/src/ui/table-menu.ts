/**
 * Table Menu - Grid selector for inserting tables (2x2 to 9x9)
 */

import type { I18nService } from '../i18n/index.js';
import { EDIT_ICONS } from './icons.js';

export interface TableMenuConfig {
  /** Callback when a table size is selected */
  onSelect: (rows: number, cols: number) => void;
  /** i18n service for translating labels */
  i18n: I18nService;
}

/** Minimum table size */
const MIN_SIZE = 2;
/** Maximum table size */
const MAX_SIZE = 9;
/** Size of each cell in the grid selector (px) */
const CELL_SIZE = 18;
/** Gap between cells (px) */
const CELL_GAP = 2;

export class TableMenu {
  private _onSelect: (rows: number, cols: number) => void;
  private _i18n: I18nService;
  private _button: HTMLButtonElement | null = null;
  private _panel: HTMLDivElement | null = null;
  private _isOpen = false;
  private _hoveredRows = 0;
  private _hoveredCols = 0;
  private _cells: HTMLDivElement[][] = [];
  private _sizeLabel: HTMLSpanElement | null = null;

  constructor(config: TableMenuConfig) {
    this._onSelect = config.onSelect;
    this._i18n = config.i18n;
  }

  /**
   * Create and return the menu button element
   */
  createButton(): HTMLButtonElement {
    this._button = document.createElement('button');
    this._button.type = 'button';
    this._button.className = 'medit-edit-btn medit-table-btn';
    this._button.title = this._i18n.translate('toolbar.table');
    this._button.innerHTML = EDIT_ICONS.table;
    this._button.setAttribute('aria-label', this._i18n.translate('toolbar.table'));
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
      const label = this._i18n.translate('toolbar.table');
      this._button.title = label;
      this._button.setAttribute('aria-label', label);
    }
    if (this._isOpen && this._panel) {
      this._updateSizeLabel();
    }
  }

  /**
   * Create the grid selector panel
   */
  private _createPanel(): HTMLDivElement {
    this._panel = document.createElement('div');
    this._panel.className = 'medit-table-panel';
    this._panel.setAttribute('role', 'menu');

    // Grid container
    const grid = document.createElement('div');
    grid.className = 'medit-table-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${MAX_SIZE - MIN_SIZE + 1}, ${CELL_SIZE}px)`;
    grid.style.gap = `${CELL_GAP}px`;

    // Create cells
    this._cells = [];
    for (let row = 0; row < MAX_SIZE - MIN_SIZE + 1; row++) {
      const rowCells: HTMLDivElement[] = [];
      for (let col = 0; col < MAX_SIZE - MIN_SIZE + 1; col++) {
        const cell = document.createElement('div');
        cell.className = 'medit-table-cell';
        cell.style.width = `${CELL_SIZE}px`;
        cell.style.height = `${CELL_SIZE}px`;
        cell.style.border = '1px solid var(--medit-border-color)';
        cell.style.borderRadius = '2px';
        cell.style.cursor = 'pointer';
        cell.style.transition = 'background-color 0.1s ease';
        
        const actualRow = row + MIN_SIZE;
        const actualCol = col + MIN_SIZE;
        
        cell.addEventListener('mouseenter', () => this._handleHover(actualRow, actualCol));
        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          this._handleSelect(actualRow, actualCol);
        });
        
        grid.appendChild(cell);
        rowCells.push(cell);
      }
      this._cells.push(rowCells);
    }

    this._panel.appendChild(grid);

    // Size label
    this._sizeLabel = document.createElement('span');
    this._sizeLabel.className = 'medit-table-size-label';
    this._updateSizeLabel();
    this._panel.appendChild(this._sizeLabel);

    // Reset hover on mouse leave
    this._panel.addEventListener('mouseleave', () => this._resetHighlight());

    return this._panel;
  }

  /**
   * Update the size label text
   */
  private _updateSizeLabel(): void {
    if (this._sizeLabel) {
      if (this._hoveredRows > 0 && this._hoveredCols > 0) {
        this._sizeLabel.textContent = `${this._hoveredRows} × ${this._hoveredCols} ${this._i18n.translate('toolbar.tableCells')}`;
      } else {
        this._sizeLabel.textContent = this._i18n.translate('toolbar.tableSelectSize');
      }
    }
  }

  /**
   * Handle hover over a cell
   */
  private _handleHover(rows: number, cols: number): void {
    this._hoveredRows = rows;
    this._hoveredCols = cols;
    this._updateHighlight();
    this._updateSizeLabel();
  }

  /**
   * Update cell highlighting based on current hover
   */
  private _updateHighlight(): void {
    for (let row = 0; row < this._cells.length; row++) {
      for (let col = 0; col < this._cells[row].length; col++) {
        const cell = this._cells[row][col];
        const actualRow = row + MIN_SIZE;
        const actualCol = col + MIN_SIZE;
        
        // Highlight cells within the selection
        if (actualRow <= this._hoveredRows && actualCol <= this._hoveredCols) {
          cell.style.backgroundColor = 'var(--medit-accent-color)';
          cell.style.borderColor = 'var(--medit-accent-color)';
        } else {
          cell.style.backgroundColor = 'transparent';
          cell.style.borderColor = 'var(--medit-border-color)';
        }
      }
    }
  }

  /**
   * Reset highlighting
   */
  private _resetHighlight(): void {
    this._hoveredRows = 0;
    this._hoveredCols = 0;
    this._updateHighlight();
    this._updateSizeLabel();
  }

  /**
   * Handle table size selection
   */
  private _handleSelect(rows: number, cols: number): void {
    this._onSelect(rows, cols);
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

    // Always recreate panel to ensure fresh state
    this._createPanel();

    if (!this._panel) return;

    // Position panel below button
    const buttonRect = this._button.getBoundingClientRect();
    this._panel.style.position = 'absolute';
    this._panel.style.top = `${buttonRect.bottom + window.scrollY + 4}px`;
    this._panel.style.left = `${buttonRect.left + window.scrollX}px`;

    document.body.appendChild(this._panel);
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

    if (this._panel?.parentNode) {
      this._panel.parentNode.removeChild(this._panel);
    }
    this._isOpen = false;
    this._button?.classList.remove('active');
    this._button?.setAttribute('aria-expanded', 'false');
    this._cells = [];
    this._sizeLabel = null;

    document.removeEventListener('click', this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Handle clicks outside the menu
   */
  private _handleOutsideClick = (e: MouseEvent): void => {
    if (
      this._button?.contains(e.target as Node) ||
      this._panel?.contains(e.target as Node)
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
    this._panel = null;
  }
}

export default TableMenu;
