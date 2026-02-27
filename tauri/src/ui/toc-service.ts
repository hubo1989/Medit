/**
 * TocService - Document Outline Navigation
 * Parses Markdown headings, renders a TOC tree in the sidebar,
 * handles click-to-scroll and scroll-to-highlight.
 */

import type { I18nService } from '../i18n/index.js';

export interface TocItem {
  level: number;  // 1-6
  text: string;   // heading text
  id: string;     // anchor id for scrolling
}

export interface TocServiceOptions {
  /** The #toc-nav container */
  container: HTMLElement;
  /** Returns the scrollable preview/editor element */
  scrollTarget: () => HTMLElement | null;
  /** Callback when a heading is clicked, receives the TocItem */
  onHeadingClick?: (item: TocItem) => void;
  /** i18n service for localized strings */
  i18n?: I18nService;
}

export class TocService {
  private _container: HTMLElement;
  private _scrollTarget: () => HTMLElement | null;
  private _onHeadingClick?: (item: TocItem) => void;
  private _i18n?: I18nService;
  private _items: TocItem[] = [];
  private _activeId: string | null = null;
  private _scrollHandler: (() => void) | null = null;
  private _scrollRAF: number | null = null;
  private _updateDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: TocServiceOptions) {
    this._container = options.container;
    this._scrollTarget = options.scrollTarget;
    this._onHeadingClick = options.onHeadingClick;
    this._i18n = options.i18n;
  }

  /**
   * Parse markdown content and update the TOC.
   * Call this after rendering preview or on content change.
   */
  update(markdown: string): void {
    // Debounce updates
    if (this._updateDebounceTimer) {
      clearTimeout(this._updateDebounceTimer);
    }
    this._updateDebounceTimer = setTimeout(() => {
      this._items = this._parseHeadings(markdown);
      this._render();
      this._attachScrollListener();
    }, 150);
  }

  /**
   * Force an immediate update (no debounce).
   */
  forceUpdate(markdown: string): void {
    if (this._updateDebounceTimer) {
      clearTimeout(this._updateDebounceTimer);
      this._updateDebounceTimer = null;
    }
    this._items = this._parseHeadings(markdown);
    this._render();
    this._attachScrollListener();
  }

  /**
   * Parse headings from Markdown text.
   * Extracts lines starting with # (ATX headings only).
   */
  private _parseHeadings(markdown: string): TocItem[] {
    const lines = markdown.split('\n');
    const items: TocItem[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      // Track code blocks to avoid parsing headings inside them
      if (line.trimStart().startsWith('```') || line.trimStart().startsWith('~~~')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[*_`~[\]]/g, '').trim(); // strip inline formatting
        if (!text) continue;

        // Generate a slug-style id matching Vditor's id generation
        const id = this._generateId(text, items);
        items.push({ level, text, id });
      }
    }

    return items;
  }

  /**
   * Generate a unique id for the heading.
   * Tries to match what Vditor/markdown renderers produce.
   */
  private _generateId(text: string, existingItems: TocItem[]): string {
    // Simple slug: lowercase, replace spaces with hyphens, remove special chars
    let slug = text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}-]/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) slug = 'heading';

    // Ensure uniqueness
    const existingSlugs = existingItems.map(i => i.id);
    let uniqueSlug = slug;
    let counter = 1;
    while (existingSlugs.includes(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  /**
   * Render the TOC items into the container.
   */
  private _render(): void {
    if (this._items.length === 0) {
      const emptyText = this._i18n?.t('toc.empty') ?? 'No headings';
      this._container.innerHTML = `<div class="toc-empty">${this._escapeHtml(emptyText)}</div>`;
      return;
    }

    // Find minimum heading level to normalize indentation
    const minLevel = Math.min(...this._items.map(i => i.level));

    const listHtml = this._items.map(item => {
      const indent = item.level - minLevel; // 0-based indent
      return `<li class="toc-item toc-level-${indent}" data-toc-id="${this._escapeAttr(item.id)}">
        <a class="toc-link" href="#${this._escapeAttr(item.id)}" title="${this._escapeAttr(item.text)}">
          ${this._escapeHtml(item.text)}
        </a>
      </li>`;
    }).join('\n');

    this._container.innerHTML = `<ul class="toc-list">${listHtml}</ul>`;

    // Attach click handlers
    const links = this._container.querySelectorAll('.toc-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const li = (e.currentTarget as HTMLElement).closest('.toc-item') as HTMLElement;
        const tocId = li?.dataset.tocId;
        if (tocId) {
          this._scrollToHeading(tocId);
          this._setActive(tocId);
          // Notify main app for editor cursor jump
          const item = this._items.find(i => i.id === tocId);
          if (item && this._onHeadingClick) {
            this._onHeadingClick(item);
          }
        }
      });
    });
  }

  /**
   * Scroll the preview/editor to the heading with given id.
   * Uses manual scrollTop calculation to ensure heading is at the very top.
   */
  private _scrollToHeading(id: string): void {
    const target = this._scrollTarget();
    if (!target) {
      console.warn('[Medit] TOC scroll: no scroll target');
      return;
    }

    const item = this._items.find(i => i.id === id);
    if (!item) {
      console.warn('[Medit] TOC scroll: item not found for id:', id);
      return;
    }

    // Find heading element: ID-first strategy, then text matching
    let heading: HTMLElement | null = null;

    // 1. Try to find by ID first (most reliable for duplicate headings)
    heading = target.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;

    // 2. Fallback to text matching if ID not found
    if (!heading) {
      const headings = target.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      const targetText = normalize(item.text);

      // Track occurrence count for duplicate handling
      let targetOccurrence = 0;

      // Count how many times this text appears before current item
      for (const existingItem of this._items) {
        if (existingItem.id === id) break;
        if (normalize(existingItem.text) === targetText) {
          targetOccurrence++;
        }
      }

      // Find the Nth occurrence of this text
      let currentOccurrence = 0;
      for (const h of headings) {
        const ht = normalize(h.textContent || '');
        if (ht === targetText) {
          if (currentOccurrence === targetOccurrence) {
            heading = h as HTMLElement;
            break;
          }
          currentOccurrence++;
        }
      }

      // Includes match fallback
      if (!heading) {
        for (const h of headings) {
          const ht = normalize(h.textContent || '');
          if (ht.includes(targetText) || targetText.includes(ht)) {
            heading = h as HTMLElement;
            break;
          }
        }
      }
    }

    if (!heading) {
      console.warn('[Medit] TOC scroll: heading element not found for:', item.text);
      return;
    }

    // Find the actual scrollable ancestor
    const scrollable = this._findScrollableAncestor(heading) || target;

    // Calculate scroll offset
    const headingRect = heading.getBoundingClientRect();
    const scrollableRect = scrollable.getBoundingClientRect();
    const scrollOffset = headingRect.top - scrollableRect.top + scrollable.scrollTop;

    scrollable.scrollTo({ top: scrollOffset, behavior: 'smooth' });
  }

  /**
   * Walk up the DOM to find the nearest scrollable ancestor.
   */
  private _findScrollableAncestor(element: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = element.parentElement;
    while (el) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  /**
   * Mark the active TOC item.
   */
  private _setActive(id: string): void {
    if (this._activeId === id) return;
    this._activeId = id;

    // Remove existing active class
    const prev = this._container.querySelector('.toc-item.active');
    if (prev) prev.classList.remove('active');

    // Add active class to current
    const current = this._container.querySelector(`.toc-item[data-toc-id="${CSS.escape(id)}"]`);
    if (current) {
      current.classList.add('active');
      // Scroll the TOC nav to keep active item visible
      current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Attach scroll listener to auto-highlight the current visible heading.
   */
  private _attachScrollListener(): void {
    // Remove existing listener
    this._detachScrollListener();

    const target = this._scrollTarget();
    if (!target || this._items.length === 0) return;

    this._scrollHandler = () => {
      // Use requestAnimationFrame to throttle
      if (this._scrollRAF) return;
      this._scrollRAF = requestAnimationFrame(() => {
        this._scrollRAF = null;
        this._highlightCurrentHeading();
      });
    };

    target.addEventListener('scroll', this._scrollHandler, { passive: true });
  }

  /**
   * Detach scroll listener.
   */
  private _detachScrollListener(): void {
    if (this._scrollHandler) {
      const target = this._scrollTarget();
      if (target) {
        target.removeEventListener('scroll', this._scrollHandler);
      }
      this._scrollHandler = null;
    }
    if (this._scrollRAF) {
      cancelAnimationFrame(this._scrollRAF);
      this._scrollRAF = null;
    }
  }

  /**
   * Determine which heading is currently visible and highlight it.
   */
  private _highlightCurrentHeading(): void {
    const target = this._scrollTarget();
    if (!target) return;

    const headings = target.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;

    const offset = 80; // Offset from top to consider a heading "current"

    let currentHeading: Element | null = null;

    for (const heading of headings) {
      const rect = heading.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const relativeTop = rect.top - targetRect.top;

      if (relativeTop <= offset) {
        currentHeading = heading;
      } else {
        break;
      }
    }

    // If no heading is above the offset, use the first one
    if (!currentHeading && headings.length > 0) {
      currentHeading = headings[0];
    }

    if (currentHeading) {
      const text = (currentHeading.textContent || '').trim();
      // Find matching TOC item by text
      const matchingItem = this._items.find(item => item.text === text);
      if (matchingItem) {
        this._setActive(matchingItem.id);
      }
    }
  }

  /**
   * Escape HTML entities.
   */
  private _escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Escape attribute value.
   */
  private _escapeAttr(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this._detachScrollListener();
    if (this._updateDebounceTimer) {
      clearTimeout(this._updateDebounceTimer);
      this._updateDebounceTimer = null;
    }
    this._container.innerHTML = '';
    this._items = [];
    this._activeId = null;
  }
}
