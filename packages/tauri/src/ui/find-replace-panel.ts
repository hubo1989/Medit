/**
 * FindReplacePanel - Find and replace functionality for the editor
 * Provides a floating panel with search, navigation, and replace capabilities
 */

import { I18nService } from '../i18n/index.js';

const ICONS = {
  chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
  chevronUp: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
};

export interface FindReplacePanelConfig {
  /** Container element to render into (should be #main-container) */
  container: HTMLElement;
  /** i18n service instance */
  i18n: I18nService;
  /** Get current editor content */
  getContent: () => string;
  /** Set editor content */
  setContent: (value: string) => void;
}

interface Match {
  start: number;
  end: number;
}

export class FindReplacePanel {
  private _container: HTMLElement;
  private _i18n: I18nService;
  private _getContent: () => string;
  private _setContent: (value: string) => void;
  private _panelElement: HTMLElement | null = null;
  private _findInput: HTMLInputElement | null = null;
  private _replaceInput: HTMLInputElement | null = null;
  private _matchCountElement: HTMLElement | null = null;
  private _replaceRow: HTMLElement | null = null;
  private _toggleReplaceBtn: HTMLButtonElement | null = null;
  private _caseSensitiveBtn: HTMLButtonElement | null = null;
  private _wholeWordBtn: HTMLButtonElement | null = null;
  private _isOpen = false;
  private _isReplaceVisible = false;
  private _caseSensitive = false;
  private _wholeWord = false;
  private _matches: Match[] = [];
  private _currentMatchIndex = -1;
  private _i18nUnsubscribe: (() => void) | null = null;
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(config: FindReplacePanelConfig) {
    this._container = config.container;
    this._i18n = config.i18n;
    this._getContent = config.getContent;
    this._setContent = config.setContent;
    this._render();
    this._setupI18n();
    this._setupGlobalKeydown();
  }

  /**
   * Open the find panel
   */
  open(showReplace = false): void {
    if (!this._panelElement) return;
    this._isOpen = true;
    this._panelElement.classList.add('open');

    if (showReplace) {
      this._showReplaceRow();
    }

    this._findInput?.focus();
    this._performSearch();
  }

  /**
   * Close the find panel
   */
  close(): void {
    if (!this._panelElement) return;
    this._isOpen = false;
    this._panelElement.classList.remove('open');
    this._matches = [];
    this._currentMatchIndex = -1;
    this._updateMatchDisplay();
  }

  /**
   * Toggle the find panel
   */
  toggle(showReplace = false): void {
    if (this._isOpen) {
      if (showReplace && !this._isReplaceVisible) {
        this._showReplaceRow();
        this._replaceInput?.focus();
        return;
      }
      this.close();
    } else {
      this.open(showReplace);
    }
  }

  /**
   * Whether the panel is currently open
   */
  isOpen(): boolean {
    return this._isOpen;
  }

  private _render(): void {
    this._panelElement = document.createElement('div');
    this._panelElement.className = 'find-replace-panel';

    const wrapper = document.createElement('div');
    wrapper.className = 'find-replace-wrapper';

    // Toggle replace visibility button
    this._toggleReplaceBtn = document.createElement('button');
    this._toggleReplaceBtn.type = 'button';
    this._toggleReplaceBtn.className = 'find-replace-toggle-btn';
    this._toggleReplaceBtn.innerHTML = ICONS.chevronRight;
    this._toggleReplaceBtn.title = this._i18n.t('findReplace.toggleReplace');
    this._toggleReplaceBtn.addEventListener('click', () => this._toggleReplaceRow());

    const rows = document.createElement('div');
    rows.className = 'find-replace-rows';

    const findRow = this._createFindRow();
    rows.appendChild(findRow);

    this._replaceRow = this._createReplaceRow();
    rows.appendChild(this._replaceRow);

    wrapper.appendChild(this._toggleReplaceBtn);
    wrapper.appendChild(rows);
    this._panelElement.appendChild(wrapper);
    this._container.appendChild(this._panelElement);
  }

  private _createFindRow(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'find-replace-row';

    // Input wrapper
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'find-replace-input-wrapper';

    this._findInput = document.createElement('input');
    this._findInput.type = 'text';
    this._findInput.className = 'find-replace-input';
    this._findInput.placeholder = this._i18n.t('findReplace.findPlaceholder');
    this._findInput.addEventListener('input', () => this._performSearch());
    this._findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          this._navigatePrev();
        } else {
          this._navigateNext();
        }
      }
    });

    this._caseSensitiveBtn = document.createElement('button');
    this._caseSensitiveBtn.type = 'button';
    this._caseSensitiveBtn.className = 'find-replace-option-btn';
    this._caseSensitiveBtn.textContent = 'Aa';
    this._caseSensitiveBtn.title = this._i18n.t('findReplace.caseSensitive');
    this._caseSensitiveBtn.addEventListener('click', () => this._toggleCaseSensitive());

    this._wholeWordBtn = document.createElement('button');
    this._wholeWordBtn.type = 'button';
    this._wholeWordBtn.className = 'find-replace-option-btn';
    this._wholeWordBtn.innerHTML = '<span style="text-decoration:underline;font-weight:700;font-size:12px">W</span>';
    this._wholeWordBtn.title = this._i18n.t('findReplace.wholeWord');
    this._wholeWordBtn.addEventListener('click', () => this._toggleWholeWord());

    inputWrapper.appendChild(this._findInput);
    inputWrapper.appendChild(this._caseSensitiveBtn);
    inputWrapper.appendChild(this._wholeWordBtn);

    // Match count
    this._matchCountElement = document.createElement('span');
    this._matchCountElement.className = 'find-replace-match-count';

    // Navigation buttons
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'find-replace-nav-btn';
    prevBtn.innerHTML = ICONS.chevronUp;
    prevBtn.title = this._i18n.t('findReplace.previousMatch');
    prevBtn.addEventListener('click', () => this._navigatePrev());

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'find-replace-nav-btn';
    nextBtn.innerHTML = ICONS.chevronDown;
    nextBtn.title = this._i18n.t('findReplace.nextMatch');
    nextBtn.addEventListener('click', () => this._navigateNext());

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'find-replace-nav-btn';
    closeBtn.innerHTML = ICONS.close;
    closeBtn.title = this._i18n.t('findReplace.close');
    closeBtn.addEventListener('click', () => this.close());

    row.appendChild(inputWrapper);
    row.appendChild(this._matchCountElement);
    row.appendChild(prevBtn);
    row.appendChild(nextBtn);
    row.appendChild(closeBtn);

    return row;
  }

  private _createReplaceRow(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'find-replace-row find-replace-replace-row';

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'find-replace-input-wrapper';

    this._replaceInput = document.createElement('input');
    this._replaceInput.type = 'text';
    this._replaceInput.className = 'find-replace-input';
    this._replaceInput.placeholder = this._i18n.t('findReplace.replacePlaceholder');
    this._replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._replaceCurrent();
      }
    });

    inputWrapper.appendChild(this._replaceInput);

    const replaceBtn = document.createElement('button');
    replaceBtn.type = 'button';
    replaceBtn.className = 'find-replace-action-btn';
    replaceBtn.textContent = this._i18n.t('findReplace.replace');
    replaceBtn.dataset.action = 'replace';
    replaceBtn.addEventListener('click', () => this._replaceCurrent());

    const replaceAllBtn = document.createElement('button');
    replaceAllBtn.type = 'button';
    replaceAllBtn.className = 'find-replace-action-btn';
    replaceAllBtn.textContent = this._i18n.t('findReplace.replaceAll');
    replaceAllBtn.dataset.action = 'replaceAll';
    replaceAllBtn.addEventListener('click', () => this._replaceAll());

    row.appendChild(inputWrapper);
    row.appendChild(replaceBtn);
    row.appendChild(replaceAllBtn);

    return row;
  }

  private _setupI18n(): void {
    this._i18nUnsubscribe = this._i18n.onLanguageChange(() => {
      this._updateLabels();
    });
  }

  private _setupGlobalKeydown(): void {
    this._keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this._isOpen) {
        e.preventDefault();
        this.close();
      }
    };
    document.addEventListener('keydown', this._keydownHandler);
  }

  private _updateLabels(): void {
    if (this._findInput) {
      this._findInput.placeholder = this._i18n.t('findReplace.findPlaceholder');
    }
    if (this._replaceInput) {
      this._replaceInput.placeholder = this._i18n.t('findReplace.replacePlaceholder');
    }
    if (this._caseSensitiveBtn) {
      this._caseSensitiveBtn.title = this._i18n.t('findReplace.caseSensitive');
    }
    if (this._wholeWordBtn) {
      this._wholeWordBtn.title = this._i18n.t('findReplace.wholeWord');
    }
    if (this._toggleReplaceBtn) {
      this._toggleReplaceBtn.title = this._i18n.t('findReplace.toggleReplace');
    }
    const replaceBtn = this._replaceRow?.querySelector('[data-action="replace"]');
    if (replaceBtn) replaceBtn.textContent = this._i18n.t('findReplace.replace');
    const replaceAllBtn = this._replaceRow?.querySelector('[data-action="replaceAll"]');
    if (replaceAllBtn) replaceAllBtn.textContent = this._i18n.t('findReplace.replaceAll');
    this._updateMatchDisplay();
  }

  private _performSearch(): void {
    const query = this._findInput?.value ?? '';
    this._matches = [];
    this._currentMatchIndex = -1;

    if (!query) {
      this._updateMatchDisplay();
      return;
    }

    const content = this._getContent();
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let pattern = escapedQuery;
    if (this._wholeWord) pattern = `\\b${pattern}\\b`;

    let flags = 'g';
    if (!this._caseSensitive) flags += 'i';

    try {
      const regex = new RegExp(pattern, flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        this._matches.push({ start: match.index, end: match.index + match[0].length });
        if (regex.lastIndex === match.index) regex.lastIndex++;
      }
    } catch {
      // Invalid regex pattern
    }

    if (this._matches.length > 0) {
      this._currentMatchIndex = 0;
    }

    this._updateMatchDisplay();
  }

  private _navigateNext(): void {
    if (this._matches.length === 0) return;
    this._currentMatchIndex = (this._currentMatchIndex + 1) % this._matches.length;
    this._updateMatchDisplay();
  }

  private _navigatePrev(): void {
    if (this._matches.length === 0) return;
    this._currentMatchIndex =
      (this._currentMatchIndex - 1 + this._matches.length) % this._matches.length;
    this._updateMatchDisplay();
  }

  private _replaceCurrent(): void {
    if (this._matches.length === 0 || this._currentMatchIndex < 0) return;

    const content = this._getContent();
    const match = this._matches[this._currentMatchIndex];
    const replacement = this._replaceInput?.value ?? '';

    const newContent =
      content.substring(0, match.start) + replacement + content.substring(match.end);

    this._setContent(newContent);

    // Re-search and adjust index
    this._performSearch();
    if (this._matches.length > 0) {
      this._currentMatchIndex = Math.min(this._currentMatchIndex, this._matches.length - 1);
      this._updateMatchDisplay();
    }
  }

  private _replaceAll(): void {
    if (this._matches.length === 0) return;

    const content = this._getContent();
    const query = this._findInput?.value ?? '';
    const replacement = this._replaceInput?.value ?? '';
    if (!query) return;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let pattern = escapedQuery;
    if (this._wholeWord) pattern = `\\b${pattern}\\b`;

    let flags = 'g';
    if (!this._caseSensitive) flags += 'i';

    try {
      const regex = new RegExp(pattern, flags);
      const newContent = content.replace(regex, replacement);
      this._setContent(newContent);
      this._performSearch();
    } catch {
      // Invalid regex pattern
    }
  }

  private _updateMatchDisplay(): void {
    if (!this._matchCountElement) return;

    const query = this._findInput?.value ?? '';
    if (this._matches.length === 0) {
      this._matchCountElement.textContent = query
        ? this._i18n.t('findReplace.noResults')
        : '';
      this._matchCountElement.classList.toggle('no-results', !!query);
    } else {
      this._matchCountElement.textContent = `${this._currentMatchIndex + 1} / ${this._matches.length}`;
      this._matchCountElement.classList.remove('no-results');
    }
  }

  private _toggleCaseSensitive(): void {
    this._caseSensitive = !this._caseSensitive;
    this._caseSensitiveBtn?.classList.toggle('active', this._caseSensitive);
    this._performSearch();
  }

  private _toggleWholeWord(): void {
    this._wholeWord = !this._wholeWord;
    this._wholeWordBtn?.classList.toggle('active', this._wholeWord);
    this._performSearch();
  }

  private _toggleReplaceRow(): void {
    if (this._isReplaceVisible) {
      this._hideReplaceRow();
    } else {
      this._showReplaceRow();
    }
  }

  private _showReplaceRow(): void {
    this._isReplaceVisible = true;
    this._replaceRow?.classList.add('visible');
    this._toggleReplaceBtn?.classList.add('expanded');
  }

  private _hideReplaceRow(): void {
    this._isReplaceVisible = false;
    this._replaceRow?.classList.remove('visible');
    this._toggleReplaceBtn?.classList.remove('expanded');
  }

  /**
   * Destroy panel and cleanup resources
   */
  destroy(): void {
    if (this._i18nUnsubscribe) {
      this._i18nUnsubscribe();
      this._i18nUnsubscribe = null;
    }
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null;
    }
    this._panelElement?.remove();
    this._panelElement = null;
    this._findInput = null;
    this._replaceInput = null;
    this._matchCountElement = null;
    this._replaceRow = null;
    this._toggleReplaceBtn = null;
    this._caseSensitiveBtn = null;
    this._wholeWordBtn = null;
  }
}

export default FindReplacePanel;
